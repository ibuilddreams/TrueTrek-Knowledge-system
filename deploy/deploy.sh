#!/usr/bin/env bash
# Production deploy script — pull latest code and restart services.
# Used by GitHub Actions and safe for manual runs on the server.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/TrueTrek-Knowledge-system}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"
DEPLOY_USER="${DEPLOY_USER:-truetrek}"

cd "$APP_DIR"

echo "==> Fetching latest code"
if [[ "$(id -u)" -eq 0 ]]; then
  bash "$APP_DIR/deploy/git-pull.sh"
else
  sudo /opt/TrueTrek-Knowledge-system/deploy/git-pull.sh
fi

echo "==> Installing backend dependencies"
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

echo "==> Running migrations"
cd "$BACKEND_DIR"
python manage.py migrate --noinput
python manage.py collectstatic --noinput

echo "==> Installing frontend dependencies and building"
cd "$FRONTEND_DIR"
# Preserve production env across git reset (.env is gitignored)
if [[ ! -f .env.production.local && -f .env ]]; then
  cp .env .env.local 2>/dev/null || true
fi
npm ci
npm run build

echo "==> Restarting application services"
sudo systemctl restart truetrek-backend
sudo systemctl restart truetrek-frontend
sudo systemctl reload nginx

echo "==> Health checks"
sleep 2
systemctl is-active --quiet truetrek-backend && echo "backend: active"
systemctl is-active --quiet truetrek-frontend && echo "frontend: active"
systemctl is-active --quiet nginx && echo "nginx: active"

curl -fsS -o /dev/null -w "API HTTP %{http_code}\n" http://127.0.0.1/api/docs/ || true
curl -fsS -o /dev/null -w "App HTTP %{http_code}\n" http://127.0.0.1/ || true

echo "==> Deploy complete"
