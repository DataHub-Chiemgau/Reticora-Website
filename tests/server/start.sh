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

# Lead-Backend: PHP-Entwicklungsserver hinter Apache (/api/lead.php), SQLite, Mails als Datei.
php="$(command -v php || true)"
if [ -z "$php" ]; then
  echo "php fehlt. Das Kontaktformular wird gegen das PHP-Backend getestet. Installation: sudo apt-get install -y php-cli php-sqlite3 php-mbstring" >&2
  exit 1
fi
if ! "$php" -r 'exit(extension_loaded("pdo_sqlite") && extension_loaded("mbstring") ? 0 : 1);'; then
  echo "PHP braucht die Erweiterungen pdo_sqlite und mbstring (Debian/Ubuntu: php-sqlite3 php-mbstring)." >&2
  exit 1
fi
for m in mod_proxy.so mod_proxy_http.so; do
  if [ ! -f "$mods/$m" ]; then echo "Apache-Modul $m fehlt." >&2; exit 1; fi
done

tmp="$(mktemp -d)"
chmod 755 "$tmp"
# Feste Adresse, damit die Tests Datenbank und Mail-Datei lesen können (tests/e2e/helpers/backend.ts).
e2e="${TMPDIR:-/tmp}"; e2e="${e2e%/}/reticora-e2e"
rm -rf "$e2e"; mkdir -p "$e2e"
phppids=""
cleanup() {
  for p in $phppids ${pid:-}; do kill "$p" 2>/dev/null || true; done
  for p in $phppids ${pid:-}; do wait "$p" 2>/dev/null || true; done
  rm -rf "$tmp" "$e2e"
}
trap cleanup EXIT INT TERM

# Zwei Instanzen derselben Anwendung: "main" mit hohem Limit für alle Tests,
# "limit" mit dem Standardlimit (5 je Stunde) nur für den Test des Limits selbst.
secret="e2e-only-secret-0123456789-abcdefghijkl"
start_backend() { # Name, Port, Limit-Zeile
  local name="$1" port="$2" limit="$3"
  cat > "$e2e/$name.php" <<PHP
<?php return [
  'site_url' => 'http://127.0.0.1:8080', 'contact_email' => 'kontakt@example.com',
  'secret' => '$secret',
  $limit
  'db' => ['dsn' => 'sqlite:$e2e/$name.sqlite'],
  'mail' => ['transport' => 'file', 'file_path' => '$e2e/$name-mails.jsonl',
             'from_address' => 'versand@example.com', 'from_name' => 'Reticora Website', 'to_address' => 'vertrieb@example.com'],
  'signature' => ['de' => '', 'en' => ''], 'log_path' => '$e2e/$name.log',
];
PHP
  RETICORA_CONFIG="$e2e/$name.php" RETICORA_HOME="$root/backend" "$php" "$root/backend/bin/migrate.php" >/dev/null
  RETICORA_CONFIG="$e2e/$name.php" RETICORA_HOME="$root/backend" "$php" -S "127.0.0.1:$port" -t "$root/backend/public" >"$e2e/$name-server.log" 2>&1 &
  phppids="$phppids $!"
}
start_backend main 8081 "'rate_limit' => ['max' => 100000],"
start_backend limit 8082 ""

identity=""
if [ "$(id -u)" = "0" ]; then identity="User www-data
Group www-data"; fi

sed -e "s#@TMP@#$tmp#g" -e "s#@MODS@#$mods#g" -e "s#@DOCROOT@#$root/dist#g" \
    "$root/tests/server/httpd.conf.tmpl" | awk -v id="$identity" '{ sub(/@IDENTITY@/, id); print }' > "$tmp/httpd.conf"

# Kein exec: der trap muss das temporäre Verzeichnis beim Beenden löschen.
"$apache" -DFOREGROUND -f "$tmp/httpd.conf" &
pid=$!
wait "$pid"
