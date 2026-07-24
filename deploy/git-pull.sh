#!/usr/bin/env bash
# Root-only helper: fetch and reset the app repo to origin/main.
# Invoked by deploy/deploy.sh via passwordless sudo.
set -euo pipefail

APP_DIR=/opt/TrueTrek-Knowledge-system
cd "$APP_DIR"

git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
git fetch --all --prune
git reset --hard origin/main

# Keep runtime ownership consistent after reset (do not touch .env secrets)
chown -R truetrek:truetrek "$APP_DIR"
if [[ -f "$APP_DIR/backend/.env" ]]; then
  chown root:truetrek "$APP_DIR/backend/.env"
  chmod 640 "$APP_DIR/backend/.env"
fi
if [[ -f "$APP_DIR/frontend/.env" ]]; then
  chown root:truetrek "$APP_DIR/frontend/.env"
  chmod 640 "$APP_DIR/frontend/.env"
fi
# Keep this helper root-owned for sudoers trust
chown root:root "$APP_DIR/deploy/git-pull.sh"
chmod 750 "$APP_DIR/deploy/git-pull.sh"
