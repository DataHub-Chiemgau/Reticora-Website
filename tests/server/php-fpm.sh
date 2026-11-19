# shellcheck shell=bash
# Gemeinsam für tests/server/start.sh und scripts/integration-local.sh: PHP-FPM als FastCGI-Server für Apache (mod_proxy_fcgi),
# so wie beim Hoster (Sicherheitsprüfung S-07). Wird mit "source" eingebunden.

# Pfad zu php-fpm passend zur Version von "php" (CI: setup-php legt /usr/sbin/php-fpm8.x an); leer, wenn keiner da ist.
find_php_fpm() {
  local v c
  v="$(php -r 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;' 2>/dev/null || true)"
  for c in "php-fpm$v" "/usr/sbin/php-fpm$v" php-fpm /usr/sbin/php-fpm; do
    if command -v "$c" >/dev/null 2>&1; then command -v "$c"; return 0; fi
  done
  return 0
}

# Webroot wie im Paket (www/): Kopie der Wurzel-.htaccess aus dist/ und je Instanz api/lead.php + api/.htaccess aus backend/public.
# Aufruf: make_api_root <Ziel-www> <repo> <Ordnername>...   (z. B. api api-limit)
make_api_root() {
  local www="$1" repo="$2" name
  shift 2
  mkdir -p "$www"
  cp "$repo/dist/.htaccess" "$www/.htaccess"
  for name in "$@"; do
    mkdir -p "$www/$name"
    cp "$repo/backend/public/lead.php" "$repo/backend/public/.htaccess" "$www/$name/"
  done
  chmod -R a+rX "$www"
}

# Startet php-fpm im Vordergrund (Hintergrundprozess dieser Shell) auf 127.0.0.1:<Port>; PID in FPM_PID.
# Aufruf: start_php_fpm <php-fpm> <Arbeitsordner> <Port> <Fehlerprotokoll> [zusätzliche Pool-Zeile]
start_php_fpm() {
  local bin="$1" dir="$2" port="$3" log="$4" extra="${5:-}" root_flag="" user_line=""
  # Als root (lokaler Container) laufen die Kinder als root wie zuvor der PHP-Entwicklungsserver; sonst als aktueller Benutzer.
  if [ "$(id -u)" = "0" ]; then root_flag="-R"; user_line="user = root
group = root"; fi
  cat > "$dir/php-fpm.conf" <<CONF
[global]
pid = $dir/php-fpm.pid
error_log = $log
daemonize = no

[reticora]
$user_line
listen = 127.0.0.1:$port
pm = static
pm.max_children = 8
catch_workers_output = yes
decorate_workers_output = no
; wie im Betrieb erwartet (docker/web/php.ini): keine Fehler in der Antwort
php_admin_flag[display_errors] = off
php_admin_flag[log_errors] = on
$extra
CONF
  # php.ini und Erweiterungen der FPM-SAPI des Systems (pdo_sqlite bzw. pdo_mysql, mbstring), expose_php wie dort eingestellt.
  # shellcheck disable=SC2086
  "$bin" -F -y "$dir/php-fpm.conf" $root_flag >>"$log" 2>&1 &
  # shellcheck disable=SC2034 # lesen die aufrufenden Skripte (Aufräumen)
  FPM_PID=$!
  for _ in $(seq 1 50); do
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then return 0; fi
    sleep 0.1
  done
  echo "php-fpm startet nicht, siehe $log" >&2
  return 1
}
