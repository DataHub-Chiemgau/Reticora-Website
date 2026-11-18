# syntax=docker/dockerfile:1
# Zielumgebung für die Integrationstests (Phase 7): Apache 2.4 mit PHP 8.4 als Modul, Aufbau wie beim Hoster
# (backend/README.md, „Installation auf dem Hosting“):
#   /var/www/html       Webroot = Inhalt von dist/ (beim Start aus dem schreibgeschützt eingehängten /srv/dist kopiert)
#                       plus api/lead.php und api/.htaccess aus backend/public/
#   /var/www/reticora   Backend außerhalb des Webroots (= ~/reticora), lead.php findet es über ../../reticora
# Zugangsdaten entstehen erst beim Start (gen-secrets.sh), nie im Image.

FROM composer:2.11 AS vendor
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
COPY backend/src ./src
# wie im Runbook: ohne Entwicklungswerkzeuge, Klassenliste fest
RUN composer install --no-dev --classmap-authoritative --no-interaction --no-progress --prefer-dist

FROM php:8.4-apache
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/* \
 && docker-php-ext-install pdo_mysql \
 && a2enmod rewrite headers expires deflate setenvif filter \
 && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/web/php.ini $PHP_INI_DIR/conf.d/zz-reticora.ini
COPY docker/web/apache.conf /etc/apache2/sites-available/000-default.conf

COPY --from=vendor /app/vendor /var/www/reticora/vendor
COPY backend/src /var/www/reticora/src
COPY backend/bin /var/www/reticora/bin
COPY backend/sql /var/www/reticora/sql
COPY backend/public/lead.php backend/public/.htaccess /opt/reticora-api/
COPY docker/config.integration.php /opt/reticora-docker/config.integration.php
COPY docker/web/gen-secrets.sh /usr/local/bin/reticora-gen-secrets
COPY docker/web/entrypoint.sh /usr/local/bin/reticora-entrypoint
RUN chmod 755 /usr/local/bin/reticora-gen-secrets /usr/local/bin/reticora-entrypoint \
 && mkdir -p /var/www/reticora/templates

HEALTHCHECK --interval=2s --timeout=5s --retries=30 \
  CMD php -r 'exit(@file_get_contents("http://127.0.0.1/") === false ? 1 : 0);'
ENTRYPOINT ["reticora-entrypoint"]
CMD ["apache2-foreground"]
