#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/TrueTrek-Knowledge-system}"
BRANCH="${DEPLOY_BRANCH:-main}"
REMOTE="${DEPLOY_REMOTE:-origin}"

cd "${APP_DIR}"

git config --global --add safe.directory "${APP_DIR}" 2>/dev/null || true

echo "[git-pull] Fetching ${REMOTE}"
git fetch --all --prune

TARGET_REF="${REMOTE}/${BRANCH}"
if ! git rev-parse --verify "${TARGET_REF}" >/dev/null 2>&1; then
  echo "[git-pull] ERROR: Missing ref ${TARGET_REF}" >&2
  exit 1
fi

BEFORE_SHA="$(git rev-parse HEAD 2>/dev/null || echo none)"
AFTER_SHA="$(git rev-parse "${TARGET_REF}")"

echo "[git-pull] Resetting ${APP_DIR} to ${TARGET_REF} (${AFTER_SHA})"
git reset --hard "${TARGET_REF}"

chown -R truetrek:truetrek "${APP_DIR}"

if [[ -f "${APP_DIR}/backend/.env" ]]; then
  chown root:truetrek "${APP_DIR}/backend/.env"
  chmod 640 "${APP_DIR}/backend/.env"
fi

if [[ -f "${APP_DIR}/frontend/.env" ]]; then
  chown root:truetrek "${APP_DIR}/frontend/.env"
  chmod 640 "${APP_DIR}/frontend/.env"
fi

chown root:root "${APP_DIR}/deploy/git-pull.sh"
chmod 750 "${APP_DIR}/deploy/git-pull.sh"

echo "[git-pull] Complete: ${BEFORE_SHA} -> ${AFTER_SHA}"
