#!/usr/bin/env bash
# Richtet SSH für den Deploy-Lauf ein (GitHub Actions). Liest HETZNER_SSH_HOST, HETZNER_SSH_USER, HETZNER_SSH_KEY,
# HETZNER_KNOWN_HOSTS aus der Umgebung. Der Host wird nur über den festgelegten Hostschlüssel akzeptiert.
set -euo pipefail
: "${HETZNER_SSH_HOST:?}" "${HETZNER_SSH_USER:?}" "${HETZNER_SSH_KEY:?}" "${HETZNER_KNOWN_HOSTS:?}"
umask 077
mkdir -p "$HOME/.ssh"
printf '%s\n' "$HETZNER_SSH_KEY" > "$HOME/.ssh/deploy_key"
printf '%s\n' "$HETZNER_KNOWN_HOSTS" > "$HOME/.ssh/known_hosts"
cat > "$HOME/.ssh/config" <<CONF
Host hetzner
  HostName ${HETZNER_SSH_HOST}
  User ${HETZNER_SSH_USER}
  Port 222
  IdentityFile ~/.ssh/deploy_key
  IdentitiesOnly yes
  StrictHostKeyChecking yes
  UserKnownHostsFile ~/.ssh/known_hosts
  BatchMode yes
  ServerAliveInterval 30
CONF
ssh-keygen -y -f "$HOME/.ssh/deploy_key" > /dev/null # bricht ab, wenn der Schlüssel unbrauchbar ist
