#!/usr/bin/env bash
# Startet Apache im Vordergrund auf http://127.0.0.1:8080 mit dist/ als Wurzel.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
apache="$(command -v apache2 || true)"
[ -z "$apache" ] && [ -x /usr/sbin/apache2 ] && apache=/usr/sbin/apache2
if [ -z "$apache" ]; then
  echo "apache2 fehlt. Installation: sudo apt-get install -y apache2" >&2
  exit 1
fi
if [ ! -d "$root/dist" ]; then
  echo "dist/ fehlt. Bitte zuerst 'npm run build' ausführen." >&2
  exit 1
fi

mods=""
for d in /usr/lib/apache2/modules /usr/lib64/httpd/modules /usr/libexec/apache2; do
  [ -f "$d/mod_rewrite.so" ] && mods="$d" && break
done
if [ -z "$mods" ]; then
  echo "Apache-Module nicht gefunden (mod_rewrite.so)." >&2
  exit 1
fi

tmp="$(mktemp -d)"
chmod 755 "$tmp"
trap 'rm -rf "$tmp"' EXIT

identity=""
if [ "$(id -u)" = "0" ]; then identity="User www-data
Group www-data"; fi

sed -e "s#@TMP@#$tmp#g" -e "s#@MODS@#$mods#g" -e "s#@DOCROOT@#$root/dist#g" \
    "$root/tests/server/httpd.conf.tmpl" | awk -v id="$identity" '{ sub(/@IDENTITY@/, id); print }' > "$tmp/httpd.conf"

# Kein exec: der trap muss das temporäre Verzeichnis beim Beenden löschen.
"$apache" -DFOREGROUND -f "$tmp/httpd.conf" &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; rm -rf "$tmp"' EXIT INT TERM
wait "$pid"
