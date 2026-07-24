#!/usr/bin/env bash
# Run on the server after: gh auth login
# Sets GitHub Actions deploy secrets for this repository.
set -euo pipefail

REPO="${REPO:-ibuilddreams/TrueTrek-Knowledge-system}"
HOST="${DEPLOY_HOST:-31.97.146.95}"
USER="${DEPLOY_USER:-truetrek}"
KEY_FILE="${DEPLOY_SSH_KEY_FILE:-/home/truetrek/.ssh/github_actions_deploy}"

if [[ ! -f "$KEY_FILE" ]]; then
  echo "Missing deploy private key: $KEY_FILE" >&2
  exit 1
fi

gh auth status
gh secret set DEPLOY_HOST --repo "$REPO" --body "$HOST"
gh secret set DEPLOY_USER --repo "$REPO" --body "$USER"
gh secret set DEPLOY_SSH_KEY --repo "$REPO" < "$KEY_FILE"
echo "Secrets configured for $REPO"
