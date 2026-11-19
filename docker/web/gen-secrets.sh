#!/bin/sh
# Erzeugt beim Start die Wegwerf-Zugangsdaten des Integrationstests (NUR Test, nie im Repository, nie im Betrieb):
#   db_pass               Passwort des Datenbankbenutzers
#   smtp_user, smtp_pass  SMTP-Anmeldung; smtp-auth im Format der Mailpit-Passwortdatei (Benutzer:Passwort)
#   ca.crt, ca.key        eigene Test-CA (7 Tage gültig)
#   mail.crt, mail.key    Serverzertifikat des SMTP-Fängers, von der Test-CA signiert, Namen aus $2
#   ready                 Marke: alles vorhanden (db und mail warten darauf)
# Aufruf: gen-secrets.sh <Verzeichnis> <subjectAltName, z. B. "DNS:mail,DNS:localhost">
# Ist "ready" schon da (Neustart ohne "down -v"), bleibt alles, wie es ist: Die Datenbank kennt das alte Passwort.
set -eu
dir="$1"
san="$2"
[ -f "$dir/ready" ] && exit 0
mkdir -p "$dir"
cd "$dir"
umask 022
openssl rand -hex 24 > db_pass
printf 'reticora-it\n' > smtp_user
openssl rand -hex 24 > smtp_pass
printf '%s:%s\n' "$(cat smtp_user)" "$(cat smtp_pass)" > smtp-auth
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 7 -keyout ca.key -out ca.crt \
  -subj "/CN=Reticora Integrationstest-CA (nur Test)" \
  -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign" 2>/dev/null
openssl req -newkey rsa:2048 -nodes -sha256 -keyout mail.key -out mail.csr -subj "/CN=reticora-integration-mail" 2>/dev/null
printf 'subjectAltName=%s\nbasicConstraints=CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n' "$san" > mail.ext
openssl x509 -req -sha256 -days 7 -in mail.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out mail.crt -extfile mail.ext 2>/dev/null
rm -f mail.csr mail.ext ca.srl
# Lesbar für die Dienste unter eigener Kennung (MariaDB läuft als mysql); der CA-Schlüssel bleibt beim Erzeuger.
chmod 600 ca.key
chmod 644 db_pass smtp_user smtp_pass smtp-auth ca.crt mail.crt mail.key
touch ready
