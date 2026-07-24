#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/TrueTrek-Knowledge-system}"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
VENV_DIR="${BACKEND_DIR}/venv"
GIT_PULL_SCRIPT="${APP_DIR}/deploy/git-pull.sh"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_INTERVAL_SEC="${HEALTH_INTERVAL_SEC:-5}"
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1/api/docs/}"
APP_HEALTH_URL="${APP_HEALTH_URL:-http://127.0.0.1/}"

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

require_path() {
  [[ -e "$1" ]] || die "Required path not found: $1"
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local attempt=1

  while (( attempt <= HEALTH_RETRIES )); do
    log "Health check (${label}) attempt ${attempt}/${HEALTH_RETRIES}: ${url}"
    if curl -fsS --max-time 10 -o /dev/null "${url}"; then
      log "Health check (${label}): OK"
      return 0
    fi
    sleep "${HEALTH_INTERVAL_SEC}"
    ((attempt++))
  done

  die "Health check (${label}) failed after ${HEALTH_RETRIES} attempts"
}

require_active_service() {
  local unit="$1"
  # Use exact /bin/systemctl argv so sudoers NOPASSWD matches.
  if sudo /bin/systemctl is-active "${unit}" >/dev/null; then
    log "Service ${unit}: active"
  else
    sudo /bin/systemctl status "${unit}" || true
    die "Service ${unit} is not active"
  fi
}

log "Starting TrueTrek production deploy"
log "App directory: ${APP_DIR}"

require_cmd python3
require_cmd npm
require_cmd curl
require_cmd systemctl
require_path "${APP_DIR}"
require_path "${BACKEND_DIR}"
require_path "${FRONTEND_DIR}"
require_path "${VENV_DIR}/bin/activate"
require_path "${GIT_PULL_SCRIPT}"
require_path "${BACKEND_DIR}/.env"
require_path "${FRONTEND_DIR}/.env"

cd "${APP_DIR}"

log "Fetching latest code from origin/main"
if [[ "$(id -u)" -eq 0 ]]; then
  bash "${GIT_PULL_SCRIPT}"
else
  sudo "${GIT_PULL_SCRIPT}"
fi

DEPLOYED_SHA="$(git rev-parse --short HEAD)"
log "Working tree reset to ${DEPLOYED_SHA}"

log "Installing backend dependencies"
# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"
python -m pip install --upgrade pip
pip install -r "${BACKEND_DIR}/requirements.txt"

log "Validating Django configuration"
cd "${BACKEND_DIR}"
python manage.py check

log "Applying database migrations"
python manage.py migrate --noinput

log "Collecting static files"
python manage.py collectstatic --noinput

log "Installing frontend dependencies"
cd "${FRONTEND_DIR}"
npm ci

log "Building frontend production bundle"
npm run build

log "Validating build artifacts before service restart"
require_path "${FRONTEND_DIR}/.next"
require_path "${BACKEND_DIR}/staticfiles"
require_path "${BACKEND_DIR}/lms_be/wsgi.py"

log "Validating Nginx configuration"
sudo /usr/sbin/nginx -t

log "Restarting application services"
sudo /bin/systemctl restart truetrek-backend
sudo /bin/systemctl restart truetrek-frontend
sudo /bin/systemctl reload nginx

log "Verifying systemd units"
require_active_service truetrek-backend
require_active_service truetrek-frontend
require_active_service nginx

log "Running local HTTP health checks"
wait_for_http "${API_HEALTH_URL}" "API"
wait_for_http "${APP_HEALTH_URL}" "Frontend"

log "Deploy complete (commit ${DEPLOYED_SHA})"
