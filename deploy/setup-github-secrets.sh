#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-ibuilddreams/TrueTrek-Knowledge-system}"
HOST="${DEPLOY_HOST:-}"
USER="${DEPLOY_USER:-truetrek}"
PORT="${DEPLOY_PORT:-22}"
KEY_FILE="${DEPLOY_SSH_KEY_FILE:-/home/truetrek/.ssh/github_actions_deploy}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-}"

if [[ -z "${HOST}" ]]; then
  echo "Set DEPLOY_HOST before running this script." >&2
  exit 1
fi

if [[ ! -f "${KEY_FILE}" ]]; then
  echo "Missing deploy private key: ${KEY_FILE}" >&2
  exit 1
fi

gh auth status
gh secret set DEPLOY_HOST --repo "${REPO}" --body "${HOST}"
gh secret set DEPLOY_USER --repo "${REPO}" --body "${USER}"
gh secret set DEPLOY_PORT --repo "${REPO}" --body "${PORT}"
gh secret set DEPLOY_SSH_KEY --repo "${REPO}" < "${KEY_FILE}"

if [[ -n "${HEALTH_CHECK_URL}" ]]; then
  gh secret set HEALTH_CHECK_URL --repo "${REPO}" --body "${HEALTH_CHECK_URL}"
fi

echo "Secrets configured for ${REPO}"
