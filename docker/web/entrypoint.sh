#!/bin/sh
# Start des Web-Containers (nur Integrationstest): Zugangsdaten erzeugen, Test-CA vertrauen, Webroot und config.php
# wie auf dem Hosting zusammenstellen, dann Apache starten.
set -eu
secrets=/run/reticora-secrets
reticora-gen-secrets "$secrets" "DNS:mail,DNS:localhost"

# Zertifikatsprüfung bleibt an: Die Test-CA wird in den Systemspeicher eingetragen.
cp "$secrets/ca.crt" /usr/local/share/ca-certificates/reticora-integration-ca.crt
update-ca-certificates >/dev/null 2>&1

# Webroot = dist/ plus api/lead.php und api/.htaccess (wie das Deploy-Paket „www/“).
if [ ! -f /srv/dist/index.html ]; then
  echo "dist/ fehlt oder ist leer: zuerst 'npm run build' ausführen." >&2
  exit 1
fi
find /var/www/html -mindepth 1 -delete
cp -R /srv/dist/. /var/www/html/
mkdir -p /var/www/html/api
cp /opt/reticora-api/lead.php /opt/reticora-api/.htaccess /var/www/html/api/
if [ ! -f /var/www/reticora/templates/contact.de.html ]; then
  echo "Hinweis: backend/templates/ fehlt (entsteht bei 'npm run build'); Eingabefehler ohne JavaScript zeigen dann die Hinweisseite." >&2
fi

# config.php neben vendor/ (außerhalb des Webroots), lesbar nur für root und Apache.
php -r 'echo "<?php\n// Beim Start des Containers erzeugt (nur Integrationstest).\nreturn " . var_export(require "/opt/reticora-docker/config.integration.php", true) . ";\n";' \
  > /var/www/reticora/config.php
chown root:www-data /var/www/reticora/config.php
chmod 640 /var/www/reticora/config.php

exec docker-php-entrypoint "$@"
