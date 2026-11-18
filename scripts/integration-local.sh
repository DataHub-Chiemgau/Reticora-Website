#!/usr/bin/env bash
# Integrationstests ohne Docker (README „Zielumgebung“). Startet als aktueller Benutzer in einem eigenen Verzeichnis:
#   - MariaDB (apt-Paket mariadb-server) auf 127.0.0.1:${RETICORA_IT_DB_PORT:-3307}, eigener Socket, eigene Datenbank,
#     eigener Benutzer mit beim Start erzeugtem Passwort
#   - einen SMTP-Fänger (Python aiosmtpd) auf 127.0.0.1:${RETICORA_IT_SMTP_PORT:-2587}: STARTTLS und Anmeldung Pflicht,
#     Zertifikat von einer beim Start erzeugten Test-CA (docker/web/gen-secrets.sh), jede Mail als JSON-Datei
# und führt die Backend-Integrationstests aus (backend/tests/Integration, PHPUnit-Testsuite "integration").
#
# Mit --browser zusätzlich: Apache auf 127.0.0.1:8088 nach tests/server/httpd.conf.tmpl (dist/ als Webroot,
# /api/lead.php per Proxy an den PHP-Entwicklungsserver mit derselben MariaDB und demselben SMTP-Fänger) und die
# Browser-Integrationstests (playwright.integration.config.ts, nur Chromium). Vorher npm run build.
#
# Voraussetzungen: apt-get install -y mariadb-server; Python mit aiosmtpd (RETICORA_IT_PYTHON, Standard python3);
# PHP mit pdo_mysql; openssl; cd backend && composer install.
# RETICORA_IT_DIR setzt das Arbeitsverzeichnis (Standard: neues Verzeichnis unter $TMPDIR), RETICORA_IT_KEEP=1 behält es.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
browser=0
for arg in "$@"; do
  case "$arg" in
    --browser) browser=1 ;;
    *) echo "Unbekannte Option: $arg (erlaubt: --browser)" >&2; exit 2 ;;
  esac
done

python="${RETICORA_IT_PYTHON:-python3}"
db_port="${RETICORA_IT_DB_PORT:-3307}"
smtp_port="${RETICORA_IT_SMTP_PORT:-2587}"
web_port=8088
php_port=8089

need() { command -v "$1" >/dev/null 2>&1 || { echo "$1 fehlt. $2" >&2; exit 1; }; }
need mariadbd "Installation: sudo apt-get install -y mariadb-server"
need mariadb-install-db "Installation: sudo apt-get install -y mariadb-server"
need openssl "Installation: sudo apt-get install -y openssl"
need php "Installation: sudo apt-get install -y php-cli php-mysql php-mbstring"
php -r 'exit(extension_loaded("pdo_mysql") && extension_loaded("mbstring") ? 0 : 1);' \
  || { echo "PHP braucht pdo_mysql und mbstring (Debian/Ubuntu: php-mysql php-mbstring)." >&2; exit 1; }
"$python" -c 'import aiosmtpd' 2>/dev/null \
  || { echo "Python-Paket aiosmtpd fehlt: python3 -m venv <dir> && <dir>/bin/pip install aiosmtpd, dann RETICORA_IT_PYTHON=<dir>/bin/python" >&2; exit 1; }
[ -f "$root/backend/vendor/bin/phpunit" ] || { echo "backend/vendor fehlt: cd backend && composer install" >&2; exit 1; }

run="${RETICORA_IT_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/reticora-it.XXXXXX")}"
mkdir -p "$run"
run="$(cd "$run" && pwd)"
pids=()
apache_dir=""
cleanup() {
  local status=$?
  if [ -n "$apache_dir" ] && [ -f "$apache_dir/apache.pid" ]; then kill "$(cat "$apache_dir/apache.pid")" 2>/dev/null || true; fi
  for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
  for p in "${pids[@]}"; do wait "$p" 2>/dev/null || true; done
  [ -n "$apache_dir" ] && rm -rf "$apache_dir"
  if [ "${RETICORA_IT_KEEP:-0}" = "1" ] || [ "$status" -ne 0 ]; then
    echo "Protokolle und Daten: $run" >&2
  else
    rm -rf "$run"
  fi
}
trap cleanup EXIT INT TERM

# 1. Zugangsdaten und Test-CA (dasselbe Skript wie im Container). Der Fänger hört auf "localhost"; 127.0.0.1 steht
#    absichtlich nicht im Zertifikat und dient als falscher Name für den Test der Zertifikatsprüfung.
rm -rf "$run/secrets"
sh "$root/docker/web/gen-secrets.sh" "$run/secrets" "DNS:localhost"

# 2. MariaDB als aktueller Benutzer, nur auf 127.0.0.1 und eigenem Socket.
me="$(id -un)"
mariadb-install-db --no-defaults --datadir="$run/db" --user="$me" --auth-root-authentication-method=socket \
  --skip-test-db >"$run/mariadb-install.log" 2>&1
mariadbd --no-defaults --datadir="$run/db" --socket="$run/mysqld.sock" --port="$db_port" --bind-address=127.0.0.1 \
  --pid-file="$run/mysqld.pid" --log-error="$run/mysqld.err" --user="$me" --skip-name-resolve \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci &
pids+=($!)
for _ in $(seq 1 100); do
  mariadb-admin --no-defaults --socket="$run/mysqld.sock" -u "$me" ping >/dev/null 2>&1 && break
  sleep 0.2
done
mariadb-admin --no-defaults --socket="$run/mysqld.sock" -u "$me" ping >/dev/null \
  || { echo "MariaDB startet nicht, siehe $run/mysqld.err" >&2; exit 1; }
db_pass="$(cat "$run/secrets/db_pass")"
mariadb --no-defaults --socket="$run/mysqld.sock" -u "$me" <<SQL
CREATE DATABASE reticora_it CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'reticora'@'127.0.0.1' IDENTIFIED BY '$db_pass';
GRANT ALL PRIVILEGES ON reticora_it.* TO 'reticora'@'127.0.0.1';
SQL
mariadb --no-defaults --socket="$run/mysqld.sock" -u "$me" -N -e 'SELECT VERSION()' > "$run/mariadb-version"

# 3. SMTP-Fänger mit STARTTLS und Anmeldung.
mkdir -p "$run/mails"
cat > "$run/smtp_catcher.py" <<'PY'
"""SMTP-Fänger für die Integrationstests: STARTTLS und Anmeldung (PLAIN/LOGIN) Pflicht, jede Mail als JSON-Datei."""
import json, os, signal, ssl, sys, threading, time, uuid
from aiosmtpd.controller import Controller
from aiosmtpd.smtp import AuthResult, LoginPassword

host, port, cert, key, user_file, pass_file, outdir = sys.argv[1:8]
user = open(user_file).read().strip().encode()
password = open(pass_file).read().strip().encode()

def authenticator(server, session, envelope, mechanism, auth_data):
    ok = isinstance(auth_data, LoginPassword) and auth_data.login == user and auth_data.password == password
    if ok:
        session.reticora_user = auth_data.login.decode()
    return AuthResult(success=ok, handled=False)

class Handler:
    async def handle_DATA(self, server, session, envelope):
        record = {
            "mail_from": envelope.mail_from,
            "rcpt_tos": envelope.rcpt_tos,
            "data": envelope.original_content.decode("utf-8", "replace"),
            "tls": session.ssl is not None,
            "auth_user": getattr(session, "reticora_user", None) if session.authenticated else None,
        }
        name = f"{time.time_ns()}-{uuid.uuid4().hex}.json"
        tmp = os.path.join(outdir, "." + name)
        with open(tmp, "w") as f:
            json.dump(record, f)
        os.replace(tmp, os.path.join(outdir, name))
        return "250 OK"

ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ctx.load_cert_chain(cert, key)
controller = Controller(Handler(), hostname=host, port=int(port), tls_context=ctx, require_starttls=True,
                        authenticator=authenticator, auth_required=True, auth_require_tls=True)
controller.start()
print(f"smtp catcher on {host}:{port}", flush=True)
stop = threading.Event()
signal.signal(signal.SIGTERM, lambda *a: stop.set())
signal.signal(signal.SIGINT, lambda *a: stop.set())
stop.wait()
controller.stop()
PY
"$python" -I "$run/smtp_catcher.py" 127.0.0.1 "$smtp_port" "$run/secrets/mail.crt" "$run/secrets/mail.key" \
  "$run/secrets/smtp_user" "$run/secrets/smtp_pass" "$run/mails" >"$run/smtp.log" 2>&1 &
pids+=($!)
for _ in $(seq 1 50); do
  grep -q 'smtp catcher on' "$run/smtp.log" 2>/dev/null && break
  sleep 0.2
done
grep -q 'smtp catcher on' "$run/smtp.log" || { echo "SMTP-Fänger startet nicht, siehe $run/smtp.log" >&2; exit 1; }

# 4. Umgebung wie im Container (compose.yaml), Zertifikatsprüfung gegen die Test-CA (SSL_CERT_FILE gilt für PHP/OpenSSL).
export RETICORA_INTEGRATION=1
export RETICORA_IT_DB_DSN="mysql:host=127.0.0.1;port=$db_port;dbname=reticora_it;charset=utf8mb4"
export RETICORA_IT_DB_USER=reticora
export RETICORA_IT_DB_PASS_FILE="$run/secrets/db_pass"
export RETICORA_IT_SMTP_HOST=localhost
export RETICORA_IT_SMTP_PORT="$smtp_port"
export RETICORA_IT_SMTP_ENCRYPTION=starttls
export RETICORA_IT_SMTP_USER="$(cat "$run/secrets/smtp_user")"
export RETICORA_IT_SMTP_PASS_FILE="$run/secrets/smtp_pass"
export RETICORA_IT_SMTP_MISMATCH_HOST=127.0.0.1
export RETICORA_IT_MAIL_DIR="$run/mails"
export RETICORA_IT_SALES=vertrieb@example.com
export RETICORA_SITE_URL="http://127.0.0.1:$web_port"
export SSL_CERT_FILE="$run/secrets/ca.crt"

echo "MariaDB $(cat "$run/mariadb-version") auf 127.0.0.1:$db_port, SMTP-Fänger (STARTTLS, Anmeldung) auf localhost:$smtp_port"
# config.php wie im Container (docker/config.integration.php); dient migrate.php und dem PHP-Server für --browser.
php -r 'echo "<?php return " . var_export(require $argv[1], true) . ";\n";' "$root/docker/config.integration.php" > "$run/config.php"
chmod 600 "$run/config.php"
php "$root/backend/bin/migrate.php" "$run/config.php"

(cd "$root/backend" && php vendor/bin/phpunit --testsuite integration --do-not-cache-result)

[ "$browser" = "1" ] || exit 0

# 5. Browser-Integrationstests gegen Apache (Webroot dist/) + PHP-Entwicklungsserver mit MariaDB und SMTP-Fänger.
[ -f "$root/dist/index.html" ] || { echo "dist/ fehlt: npm run build" >&2; exit 1; }
# Browser-Tests starten mit leeren Zählern (alle Anfragen kommen von 127.0.0.1).
mariadb --no-defaults --socket="$run/mysqld.sock" -u "$me" reticora_it -e 'DELETE FROM rate_limit'
RETICORA_CONFIG="$run/config.php" RETICORA_HOME="$root/backend" \
  php -d expose_php=0 -d display_errors=0 -S "127.0.0.1:$php_port" -t "$root/backend/public" >"$run/php-server.log" 2>&1 &
pids+=($!)

apache="$(command -v apache2 || echo /usr/sbin/apache2)"
mods=""
for d in /usr/lib/apache2/modules /usr/lib64/httpd/modules /usr/libexec/apache2; do
  [ -f "$d/mod_rewrite.so" ] && mods="$d" && break
done
[ -n "$mods" ] || { echo "Apache-Module nicht gefunden" >&2; exit 1; }
# Apache-Kinder laufen als root unter www-data; das Verzeichnis muss für sie erreichbar sein (wie in tests/server/start.sh).
apache_dir="$(mktemp -d)"
chmod 755 "$apache_dir"
identity=""
if [ "$(id -u)" = "0" ]; then identity="User www-data
Group www-data"; fi
sed -e "s#@TMP@#$apache_dir#g" -e "s#@MODS@#$mods#g" -e "s#@DOCROOT@#$root/dist#g" \
    -e "s#^Listen 127.0.0.1:8080#Listen 127.0.0.1:$web_port#" \
    -e "s#http://127.0.0.1:8081/lead.php#http://127.0.0.1:$php_port/lead.php#" \
    -e '/api-limit/d' \
    "$root/tests/server/httpd.conf.tmpl" | awk -v id="$identity" '{ sub(/@IDENTITY@/, id); print }' > "$apache_dir/httpd.conf"
"$apache" -f "$apache_dir/httpd.conf" -k start
for _ in $(seq 1 50); do
  php -r 'exit(@file_get_contents($argv[1]) === false ? 1 : 0);' "http://127.0.0.1:$web_port/" && break
  sleep 0.2
done

# RETICORA_IT_API_PROXIED: /api/lead.php läuft hier über den Proxy (ohne .htaccess); dessen Kopfzeilen prüft nur der Container.
(cd "$root" && RETICORA_IT_API_PROXIED=1 RETICORA_IT_BASE_URL="http://127.0.0.1:$web_port" npx playwright test -c playwright.integration.config.ts)
