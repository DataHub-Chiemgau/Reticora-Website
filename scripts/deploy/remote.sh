#!/usr/bin/env bash
# Befehle auf dem Hosting-Konto (wird mit dem Paket hochgeladen und vom Deploy-Workflow per SSH aufgerufen).
#
# Arbeitet ausschließlich in
#   $RELEASES   (Standard ~/releases)     versionierte Releases, je ein Ordner <git-sha>
#   $PREVIEW    (Standard ~/preview)      Vorschau mit Zugangsschutz (immer eine Kopie)
#   $LIVE       (Standard ~/live)         Betriebsstand: Symlink auf ein Release oder (Strategie rsync) ein Ordner
# Es liest nur den Pfad $CONFIG_FILE (legt davon einen Symlink in das Release/den Betriebsstand, ändert aber nie die Datei),
# berührt die Datenbank nicht und schreibt nichts außerhalb dieser Pfade.
#
# Aufruf:  remote.sh exists <sha> [release] | install <sha> <.incoming-…> [release] | verify <sha> [release]
#          | preview <sha> [release] | activate <sha> | rollback | status | prune [Anzahl]
# Das letzte Wort `release` verlangt "build: release"; ohne es nehmen exists, install, verify und preview auch "build: dev".
# `preview` liest eine Zeile für .htpasswd von STDIN.
#
# Hochladen (S-03): Der Workflow lädt nie in $RELEASES/<sha> selbst, sondern in einen neuen Ordner $RELEASES/.incoming-<sha>-<lauf>;
# `install` prüft ihn und benennt ihn atomar in $RELEASES/<sha> um. Gibt es <sha> schon (z. B. das laufende Release), wird der
# Upload verworfen; ein laufendes Release wird nie überschrieben. `exists` sagt vorher, ob sich der Upload überhaupt lohnt.
# Builds (S-13): Ein mit --allow-dev gebautes Paket ("build: dev" in MANIFEST.txt, nur für die Vorschau) darf installiert, geprüft und
# in der Vorschau gezeigt werden. activate und rollback, also alles, was den Betriebsstand berührt, verlangen "build: release".
# Der Workflow verlangt für einen Betriebslauf zusätzlich überall `release`. Ein Vorschau-Release (dev) gleicher Kennung wird dann
# durch das Release-Paket ersetzt (dev wird nie current oder previous).
#
# Umschaltstrategie (RETICORA_SWITCH):
#   symlink (Standard)  $LIVE ist ein Symlink auf $RELEASES/<sha>; Umschalten = Symlink atomar ersetzen (ln + mv -T).
#   rsync               $LIVE ist ein Ordner mit www/ und reticora/; Umschalten = rsync --delay-updates --delete-after aus dem Release.
#                       Das vorige Release bleibt in $RELEASES liegen und ist der Rückweg.
# Welche Strategie das Hosting-Konto zulässt (Symlink als Dokumentenwurzel, FollowSymLinks), muss der Auftraggeber bestätigen.
set -euo pipefail

RELEASES="${RETICORA_RELEASES:-$HOME/releases}"
PREVIEW="${RETICORA_PREVIEW:-$HOME/preview}"
LIVE="${RETICORA_LIVE:-$HOME/live}"
CONFIG_FILE="${RETICORA_CONFIG_FILE:-$HOME/reticora-config/config.php}"
PREVIEW_CONFIG_FILE="${RETICORA_PREVIEW_CONFIG_FILE:-$HOME/reticora-config/config.preview.php}"
STRATEGY="${RETICORA_SWITCH:-symlink}"
KEEP_DEFAULT=5

die() { echo "remote.sh: $*" >&2; exit 1; }

# Pfad muss unter $HOME liegen, darf weder $HOME noch / sein und kein ".." enthalten.
guard_path() {
  case "$1" in
    "" | / | "$HOME" | "$HOME/") die "unzulässiger Pfad: '$1'" ;;
    *..*) die "unzulässiger Pfad (..): $1" ;;
    "$HOME"/*) ;;
    *) die "Pfad liegt nicht unter \$HOME: $1" ;;
  esac
}

check_sha() {
  [[ "${1:-}" =~ ^[0-9a-f]{7,40}$ ]] || die "ungültige Release-Kennung: '${1:-}'"
}

release_dir() { echo "$RELEASES/$1"; }

# Prüft einen Release-Ordner: vollständig, Build-Art, gehört zu <sha>, keine echte config.php, Prüfsummen.
# <Modus> release (Standard): nur "build: release"; any: auch "build: dev" (nur Vorschau).
verify_dir() { # <Ordner> <sha> [release|any]
  local dir="$1" sha="$2" mode="${3:-release}"
  [[ -d "$dir/www" && -d "$dir/reticora" && -f "$dir/MANIFEST.txt" ]] || die "Release $sha unvollständig oder nicht vorhanden"
  # S-13: ein mit --allow-dev gebautes Paket (ohne bestandene Release-Prüfung) wird auf dem Host nie aktiv.
  if [[ "$mode" == any ]]; then
    grep -qxE 'build: (release|dev)' "$dir/MANIFEST.txt" || die "Release $sha: MANIFEST.txt ohne 'build: release' oder 'build: dev'"
  else
    grep -qx 'build: release' "$dir/MANIFEST.txt" || die "Release $sha ist kein Release-Build (MANIFEST.txt ohne 'build: release')"
  fi
  grep -q "^git: $sha" "$dir/MANIFEST.txt" || die "MANIFEST.txt gehört nicht zum Release $sha"
  # Eine echte config.php gehört nicht ins Release; der Symlink auf die gemeinsame Datei entsteht erst beim Aktivieren.
  [[ ! -f "$dir/reticora/config.php" || -L "$dir/reticora/config.php" ]] || die "Release $sha enthält eine echte config.php"
  # Alles nach der Zeile "---" ist "<sha256>  <Pfad>".
  ( cd "$dir" && sed -n '/^---$/,$p' MANIFEST.txt | tail -n +2 | sha256sum --check --quiet - ) || die "Release $sha: Prüfsummen stimmen nicht mit MANIFEST.txt überein"
}

# Wort hinter der Release-Kennung: `release` verlangt einen Release-Build, leer lässt auch dev zu (exists/install/verify/preview).
mode_of() { case "${1:-}" in release) echo release ;; "") echo any ;; *) die "unbekanntes Wort '$1' (erlaubt: release)" ;; esac; }

is_dev() { grep -qx 'build: dev' "$1/MANIFEST.txt" 2>/dev/null; }

verify_release() { # <sha> [release|any]
  verify_dir "$(release_dir "$1")" "$1" "${2:-release}"
  echo "verify ok: $1"
}

state_get() { if [[ -f "$RELEASES/.$1" ]]; then cat "$RELEASES/.$1"; fi; }
state_set() { printf '%s\n' "$2" > "$RELEASES/.$1.tmp" && mv -f "$RELEASES/.$1.tmp" "$RELEASES/.$1"; }

# Symlink auf die gemeinsame config.php in <root>/reticora/ anlegen (die Datei selbst bleibt unberührt).
link_config() {
  local root="$1" cfg="$2"
  [[ -f "$cfg" ]] || die "Konfiguration fehlt: $cfg (einmalig von Hand anlegen, siehe docs/deploy.md)"
  ln -sfn "$cfg" "$root/reticora/config.php"
}

sync_tree() { # <Quelle>/ <Ziel>/ : ohne config.php, nachlaufend löschen, Dateien erst am Ende austauschen
  mkdir -p "$2"
  rsync -a --delay-updates --delete-after --exclude '/config.php' "$1/" "$2/"
}

# --- Umschalten des Betriebsstands: alles hinter dieser einen Funktion ---------------------------------------------
switch_live() {
  local sha="$1" dir; dir="$(release_dir "$1")"
  guard_path "$LIVE"
  case "$STRATEGY" in
    symlink)
      [[ ! -e "$LIVE" || -L "$LIVE" ]] || die "$LIVE ist ein echter Ordner; für die Strategie symlink muss er ein Symlink oder frei sein"
      link_config "$dir" "$CONFIG_FILE"
      ln -sfn "$dir" "$LIVE.new.$$"
      mv -T "$LIVE.new.$$" "$LIVE"
      ;;
    rsync)
      [[ ! -L "$LIVE" ]] || die "$LIVE ist ein Symlink; für die Strategie rsync muss er ein Ordner sein"
      mkdir -p "$LIVE/www" "$LIVE/reticora"
      sync_tree "$dir/reticora" "$LIVE/reticora"
      link_config "$LIVE" "$CONFIG_FILE"
      sync_tree "$dir/www" "$LIVE/www"
      ;;
    *) die "unbekannte Strategie RETICORA_SWITCH='$STRATEGY' (symlink oder rsync)" ;;
  esac
}

cmd_exists() { # <sha> [release|any]: ein vorhandenes dev-Release zählt nicht, wenn ein Release-Build verlangt ist
  local dir; dir="$(release_dir "$1")"
  if [[ ! -d "$dir" ]]; then echo fehlt
  elif [[ "${2:-any}" == release ]] && ! grep -qx 'build: release' "$dir/MANIFEST.txt" 2>/dev/null; then echo fehlt
  else echo vorhanden; fi
}

cmd_install() { # <sha> <Upload-Ordner unter $RELEASES> [release|any]
  local sha="$1" name="${2:-}" mode="${3:-any}" src dst
  [[ "$name" =~ ^\.incoming-([0-9a-f]{7,40})-[0-9]+-[0-9]+$ && "${BASH_REMATCH[1]}" == "$sha" ]] \
    || die "ungültiger Upload-Ordner: '$name' (erwartet .incoming-$sha-<Lauf>-<Versuch>)"
  src="$RELEASES/$name"; dst="$(release_dir "$sha")"
  [[ -d "$src" && ! -L "$src" ]] || die "Upload-Ordner fehlt: $src"
  if [[ -e "$dst" ]]; then
    # Einzige Ausnahme vom Verwerfen: ein Vorschau-Release (dev) wird durch den Release-Build gleicher Kennung ersetzt.
    # dev ist nie current oder previous (activate verweigert es), also läuft darauf nichts.
    if is_dev "$dst" && grep -qx 'build: release' "$src/MANIFEST.txt" 2>/dev/null \
      && [[ "$(state_get current)" != "$sha" && "$(state_get previous)" != "$sha" ]]; then
      verify_dir "$src" "$sha" release
      rm -rf -- "${RELEASES:?}/$sha"
      mv -T -- "$src" "$dst"
      echo "install ok: $sha (Vorschau-Build durch Release-Build ersetzt)"
      return
    fi
    # Nie in ein vorhandenes (womöglich laufendes) Release schreiben; der Upload war überflüssig.
    rm -rf -- "${RELEASES:?}/$name"
    echo "install: $sha schon vorhanden, Upload verworfen"
    verify_release "$sha" "$mode"
    return
  fi
  verify_dir "$src" "$sha" "$mode"
  mv -T -- "$src" "$dst" # atomar; scheitert, falls <sha> inzwischen entstanden ist
  echo "install ok: $sha"
}

cmd_preview() { # <sha> [release|any]
  local sha="$1" mode="${2:-any}" dir pw; dir="$(release_dir "$1")"
  guard_path "$PREVIEW"
  [[ ! -L "$PREVIEW" ]] || die "$PREVIEW ist ein Symlink"
  IFS= read -r pw || true
  [[ "$pw" =~ ^[A-Za-z0-9._@+-]+:[^[:space:]]+$ ]] || die "STDIN: erwartet wird eine .htpasswd-Zeile 'Benutzer:Hash'"
  verify_release "$sha" "$mode"
  # Konfiguration der Vorschau: Eine Entwicklungs-Vorschau nimmt nie die Betriebs-Konfiguration (Testanfragen gehören nicht in die
  # Betriebsdatenbank). Ein Release-Build nimmt die Vorschau-Konfiguration, falls vorhanden, sonst die gemeinsame.
  local cfg="$CONFIG_FILE"
  if is_dev "$dir" || [[ -f "$PREVIEW_CONFIG_FILE" ]]; then cfg="$PREVIEW_CONFIG_FILE"; fi
  mkdir -p "$PREVIEW"
  sync_tree "$dir/reticora" "$PREVIEW/reticora"
  link_config "$PREVIEW" "$cfg"
  sync_tree "$dir/www" "$PREVIEW/www"
  ( umask 077; printf '%s\n' "$pw" > "$PREVIEW/.htpasswd.new" ); mv -f "$PREVIEW/.htpasswd.new" "$PREVIEW/.htpasswd"
  chmod 644 "$PREVIEW/.htpasswd" # der Webserver-Prozess läuft beim Hoster unter demselben Benutzer; Datei liegt außerhalb von www/
  local auth="AuthType Basic
AuthName \"Vorschau\"
AuthUserFile $PREVIEW/.htpasswd"
  {
    printf '\n# Vorschau: Zugangsschutz und keine Indexierung (nur in dieser Kopie)\n%s\nRequire valid-user\n' "$auth"
    printf 'Header always set X-Robots-Tag "noindex, nofollow"\n'
  } >> "$PREVIEW/www/.htaccess"
  # api/.htaccess erlaubt lead.php für alle; in der Vorschau nur mit Anmeldung.
  if [[ -f "$PREVIEW/www/api/.htaccess" ]]; then
    local tmp="$PREVIEW/www/api/.htaccess.tmp"
    { printf '%s\n' "$auth"; sed 's/Require all granted/Require valid-user/' "$PREVIEW/www/api/.htaccess"; } > "$tmp"
    mv -f "$tmp" "$PREVIEW/www/api/.htaccess"
  fi
  state_set preview "$sha"
  echo "preview ok: $sha (Dokumentenwurzel der Vorschau: $PREVIEW/www)"
}

cmd_activate() {
  local sha="$1" cur prev; verify_release "$sha"
  cur="$(state_get current)"
  switch_live "$sha"
  if [[ "$cur" != "$sha" ]]; then state_set previous "$cur"; state_set current "$sha"; fi
  prev="$(state_get previous)"
  echo "activate ok: $sha (Strategie $STRATEGY, vorher: ${cur:-keins}, Rückweg: ${prev:-keiner})"
}

cmd_rollback() {
  local prev cur; prev="$(state_get previous)"; cur="$(state_get current)"
  [[ -n "$prev" ]] || die "kein vorheriges Release bekannt: Rückweg nicht möglich"
  check_sha "$prev"
  verify_release "$prev"
  switch_live "$prev"
  state_set previous "$cur"
  state_set current "$prev"
  echo "rollback ok: jetzt $prev (vorher $cur)"
}

cmd_status() {
  echo "current:  $(state_get current)"
  echo "previous: $(state_get previous)"
  echo "preview:  $(state_get preview)"
  echo "strategy: $STRATEGY"
  if [[ -L "$LIVE" ]]; then echo "live -> $(readlink "$LIVE")"; fi
  find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf 'release: %f\n' | sort
}

cmd_prune() {
  local keep="${1:-$KEEP_DEFAULT}" cur prev pv n=0 d name
  [[ "$keep" =~ ^[0-9]+$ && "$keep" -ge 2 ]] || die "Anzahl muss mindestens 2 sein"
  cur="$(state_get current)"; prev="$(state_get previous)"; pv="$(state_get preview)"
  # liegengebliebene Upload-Ordner abgebrochener Läufe (Deploy-Läufe laufen nie gleichzeitig: concurrency im Workflow)
  while IFS= read -r d; do
    name="$(basename "$d")"
    [[ "$name" =~ ^\.incoming-[0-9a-f]{7,40}-[0-9]+-[0-9]+$ ]] || continue
    rm -rf -- "${RELEASES:?}/$name"
    echo "prune: $name"
  done < <(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -name '.incoming-*')
  # neueste zuerst; current, previous und preview bleiben immer
  while IFS= read -r d; do
    name="$(basename "$d")"
    [[ "$name" =~ ^[0-9a-f]{7,40}$ ]] || continue
    n=$((n + 1))
    if [[ $n -le $keep || "$name" == "$cur" || "$name" == "$prev" || "$name" == "$pv" ]]; then continue; fi
    rm -rf -- "${RELEASES:?}/$name"
    echo "prune: $name"
  done < <(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)
}

main() {
  guard_path "$RELEASES"
  mkdir -p "$RELEASES"
  local cmd="${1:-}" mode
  case "$cmd" in
    exists)   check_sha "${2:-}"; mode="$(mode_of "${3:-}")"; cmd_exists "$2" "$mode" ;;
    install)  check_sha "${2:-}"; mode="$(mode_of "${4:-}")"; cmd_install "$2" "${3:-}" "$mode" ;;
    verify)   check_sha "${2:-}"; mode="$(mode_of "${3:-}")"; verify_release "$2" "$mode" ;;
    preview)  check_sha "${2:-}"; mode="$(mode_of "${3:-}")"; cmd_preview "$2" "$mode" ;;
    activate) check_sha "${2:-}"; cmd_activate "$2" ;;
    rollback) cmd_rollback ;;
    status)   cmd_status ;;
    prune)    cmd_prune "${2:-}" ;;
    *) die "Aufruf: remote.sh exists|verify|preview <sha> [release] | activate <sha> | install <sha> <.incoming-…> [release] | rollback | status | prune [Anzahl]" ;;
  esac
}
main "$@"
