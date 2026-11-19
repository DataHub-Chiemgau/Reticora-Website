#!/usr/bin/env bash
# Rauchtest gegen eine laufende Seite.  smoke.sh <Basis-URL> [Benutzer:Passwort]
# Mit Zugangsdaten: zuerst ohne Anmeldung (muss 401 sein), dann mit Anmeldung. Ohne Zugangsdaten: Betriebsprüfung.
set -euo pipefail
base="${1:?Basis-URL fehlt}"; base="${base%/}"
auth="${2:-}"
fails=0
note() { echo "smoke: $*"; }
bad() { echo "smoke FEHLER: $*" >&2; fails=$((fails + 1)); }

args=(--silent --show-error --max-time 20)
cred=(); if [[ -n "$auth" ]]; then cred=(--user "$auth"); fi

status() { curl "${args[@]}" "${cred[@]}" --output /dev/null --write-out '%{http_code}' "$@"; }
expect() { # <Soll> <Beschreibung> <curl-Argumente…>
  local want="$1" what="$2"; shift 2
  local got; got="$(status "$@" || echo 000)"
  if [[ "$got" == "$want" ]]; then note "ok  $what ($got)"; else bad "$what: erwartet $want, erhalten $got"; fi
}

if [[ -n "$auth" ]]; then
  got="$(curl "${args[@]}" --output /dev/null --write-out '%{http_code}' "$base/" || echo 000)"
  if [[ "$got" == 401 ]]; then note "ok  ohne Anmeldung gesperrt (401)"; else bad "Vorschau ohne Anmeldung: erwartet 401, erhalten $got"; fi
  got="$(curl "${args[@]}" --output /dev/null --write-out '%{http_code}' -X POST "$base/api/lead.php" || echo 000)"
  if [[ "$got" == 401 ]]; then note "ok  /api/lead.php ohne Anmeldung gesperrt (401)"; else bad "/api/lead.php ohne Anmeldung: erwartet 401, erhalten $got"; fi
fi

expect 200 "Startseite" "$base/"
expect 200 "/en/" "$base/en/"
expect 405 "GET /api/lead.php" "$base/api/lead.php"
expect 404 "unbekannte Seite" "$base/gibt-es-nicht/"
expect 404 "/en/ unbekannte Seite" "$base/en/gibt-es-nicht/"
for p in /.release /reticora/config.php /MANIFEST.txt /backend/; do
  got="$(status "$base$p" || echo 000)"
  case "$got" in 403 | 404) note "ok  $p nicht ausgeliefert ($got)" ;; *) bad "$p: erwartet 403/404, erhalten $got" ;; esac
done

headers="$(curl "${args[@]}" "${cred[@]}" --head "$base/" || true)"
for h in strict-transport-security content-security-policy x-content-type-options referrer-policy permissions-policy cross-origin-opener-policy; do
  if grep -qi "^$h:" <<< "$headers"; then note "ok  Kopfzeile $h"; else bad "Kopfzeile fehlt: $h"; fi
done
# 405 muss die Kopfzeilen der Seite tragen und Allow: POST nennen
lead="$(curl "${args[@]}" "${cred[@]}" --head "$base/api/lead.php" || true)"
if grep -qi '^allow:.*POST' <<< "$lead"; then note "ok  Allow: POST"; else bad "/api/lead.php: Allow: POST fehlt"; fi

if (( fails )); then echo "smoke: $fails Fehler" >&2; exit 1; fi
note "alle Prüfungen bestanden"
