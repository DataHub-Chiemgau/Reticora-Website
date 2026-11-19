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

# Lead-Backend wie beim Hoster: lead.php im Webroot unter api/ mit api/.htaccess, PHP-FPM über mod_proxy_fcgi (S-07),
# SQLite, Mails als Datei.
php="$(command -v php || true)"
if [ -z "$php" ]; then
  echo "php fehlt. Das Kontaktformular wird gegen das PHP-Backend getestet. Installation: sudo apt-get install -y php-cli php-sqlite3 php-mbstring" >&2
  exit 1
fi
if ! "$php" -r 'exit(extension_loaded("pdo_sqlite") && extension_loaded("mbstring") ? 0 : 1);'; then
  echo "PHP braucht die Erweiterungen pdo_sqlite und mbstring (Debian/Ubuntu: php-sqlite3 php-mbstring)." >&2
  exit 1
fi
for m in mod_proxy.so mod_proxy_fcgi.so mod_env.so; do
  if [ ! -f "$mods/$m" ]; then echo "Apache-Modul $m fehlt." >&2; exit 1; fi
done
# shellcheck source=tests/server/php-fpm.sh
. "$root/tests/server/php-fpm.sh"
fpm="$(find_php_fpm)"
if [ -z "$fpm" ]; then
  echo "php-fpm fehlt (lead.php läuft wie beim Hoster über FastCGI). Installation: sudo apt-get install -y php-fpm" >&2
  exit 1
fi
for ext in pdo_sqlite mbstring; do
  if ! "$fpm" -m 2>/dev/null | grep -qx "$ext"; then echo "$fpm: Erweiterung $ext fehlt in der FPM-SAPI." >&2; exit 1; fi
done

tmp="$(mktemp -d)"
chmod 755 "$tmp"
# Feste Adresse, damit die Tests Datenbank und Mail-Datei lesen können (tests/e2e/helpers/backend.ts).
e2e="${TMPDIR:-/tmp}"; e2e="${e2e%/}/reticora-e2e"
rm -rf "$e2e"; mkdir -p "$e2e"
FPM_PID=""
cleanup() {
  # Zugriffsprotokoll sichern, bevor das temporäre Verzeichnis verschwindet (CI: Artefakt bei Fehlschlag).
  if [ -n "${RETICORA_ACCESS_LOG:-}" ] && [ -f "$tmp/access.log" ]; then cp "$tmp/access.log" "$RETICORA_ACCESS_LOG" 2>/dev/null || true; fi
  for p in $FPM_PID ${pid:-}; do kill "$p" 2>/dev/null || true; done
  for p in $FPM_PID ${pid:-}; do wait "$p" 2>/dev/null || true; done
  rm -rf "$tmp" "$e2e"
}
trap cleanup EXIT INT TERM

if [ ! -f "$root/backend/vendor/autoload.php" ] || [ ! -d "$root/backend/vendor/phpmailer/phpmailer" ]; then
  echo "backend/vendor fehlt. Bitte zuerst 'cd backend && composer install' ausführen." >&2
  exit 1
fi
if [ ! -f "$root/backend/templates/contact.de.html" ]; then
  echo "Hinweis: backend/templates/contact.de.html fehlt (entsteht bei 'npm run build'); Eingabefehler ohne JavaScript zeigen dann die kurze Hinweisseite." >&2
fi

# Zwei Instanzen derselben Anwendung, jede mit eigener, bei jedem Start neuer SQLite-Datei und eigener Konfiguration
# (RETICORA_CONFIG per SetEnv aus httpd.conf, als FastCGI-Parameter):
# /api/       "main" für alle Tests (Limits an der oberen Grenze: 100 je Herkunft, 1000 insgesamt je Stunde),
# /api-limit/ "limit" mit den Standardwerten (5 je Herkunft, 60 insgesamt) nur für den Test des Rate-Limits selbst.
chmod 777 "$e2e" # SQLite braucht Schreibrecht auf den Ordner (Journal), auch wenn PHP unter einer anderen Kennung läuft
config_backend() { # Name, Limit-Zeile
  local name="$1" limit="$2"
  rm -f "$e2e/$name.sqlite"
  cat > "$e2e/$name.php" <<PHP
<?php return [
  'site_url' => 'http://127.0.0.1:8080', 'contact_email' => 'kontakt@example.com', 'retention_days' => 90,
  $limit
  'templates_dir' => '$root/backend/templates',
  'db' => ['dsn' => 'sqlite:$e2e/$name.sqlite'],
  'mail' => ['transport' => 'file', 'allow_insecure' => true, 'file_path' => '$e2e/$name-mails.jsonl',
             'from_address' => 'versand@example.com', 'from_name' => 'Reticora Website', 'to_address' => 'vertrieb@example.com'],
  'log_path' => '$e2e/$name.log',
];
PHP
  RETICORA_CONFIG="$e2e/$name.php" RETICORA_HOME="$root/backend" "$php" "$root/backend/bin/migrate.php" >/dev/null
  chmod 666 "$e2e/$name.sqlite"
}
config_backend main "'rate_limit' => ['max' => 100, 'global_max' => 1000],"
config_backend limit "'rate_limit' => ['max' => 5, 'global_max' => 60],"
make_api_root "$tmp/www" "$root" api api-limit
fpm_port=8083
start_php_fpm "$fpm" "$tmp" "$fpm_port" "$e2e/php-fpm.log"

identity=""
if [ "$(id -u)" = "0" ]; then identity="User www-data
Group www-data"; fi

sed -e "s#@TMP@#$tmp#g" -e "s#@MODS@#$mods#g" -e "s#@DOCROOT@#$root/dist#g" \
    -e "s#@FPM@#127.0.0.1:$fpm_port#g" -e "s#@BACKEND@#$root/backend#g" \
    -e "s#@CONFIG_MAIN@#$e2e/main.php#g" -e "s#@CONFIG_LIMIT@#$e2e/limit.php#g" \
    "$root/tests/server/httpd.conf.tmpl" | awk -v id="$identity" '{ sub(/@IDENTITY@/, id); print }' > "$tmp/httpd.conf"

# Kein exec: der trap muss das temporäre Verzeichnis beim Beenden löschen.
"$apache" -DFOREGROUND -f "$tmp/httpd.conf" &
pid=$!
wait "$pid"
