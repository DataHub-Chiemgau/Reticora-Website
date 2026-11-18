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
# Aufruf:  remote.sh verify <sha> | preview <sha> | activate <sha> | rollback | status | prune [Anzahl]
# `preview` liest eine Zeile für .htpasswd von STDIN.
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

verify_release() {
  local dir; dir="$(release_dir "$1")"
  [[ -d "$dir/www" && -d "$dir/reticora" && -f "$dir/MANIFEST.txt" ]] || die "Release $1 unvollständig oder nicht vorhanden"
  # Eine echte config.php gehört nicht ins Release; der Symlink auf die gemeinsame Datei entsteht erst beim Aktivieren.
  [[ ! -f "$dir/reticora/config.php" || -L "$dir/reticora/config.php" ]] || die "Release $1 enthält eine echte config.php"
  # Alles nach der Zeile "---" ist "<sha256>  <Pfad>".
  ( cd "$dir" && sed -n '/^---$/,$p' MANIFEST.txt | tail -n +2 | sha256sum --check --quiet - ) || die "Release $1: Prüfsummen stimmen nicht mit MANIFEST.txt überein"
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

cmd_preview() {
  local sha="$1" dir pw; dir="$(release_dir "$1")"
  guard_path "$PREVIEW"
  [[ ! -L "$PREVIEW" ]] || die "$PREVIEW ist ein Symlink"
  IFS= read -r pw || true
  [[ "$pw" =~ ^[A-Za-z0-9._@+-]+:[^[:space:]]+$ ]] || die "STDIN: erwartet wird eine .htpasswd-Zeile 'Benutzer:Hash'"
  verify_release "$sha"
  local cfg="$CONFIG_FILE"
  [[ -f "$PREVIEW_CONFIG_FILE" ]] && cfg="$PREVIEW_CONFIG_FILE"
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
  local cmd="${1:-}"
  case "$cmd" in
    verify)   check_sha "${2:-}"; verify_release "$2" ;;
    preview)  check_sha "${2:-}"; cmd_preview "$2" ;;
    activate) check_sha "${2:-}"; cmd_activate "$2" ;;
    rollback) cmd_rollback ;;
    status)   cmd_status ;;
    prune)    cmd_prune "${2:-}" ;;
    *) die "Aufruf: remote.sh verify|preview|activate <sha> | rollback | status | prune [Anzahl]" ;;
  esac
}
main "$@"
