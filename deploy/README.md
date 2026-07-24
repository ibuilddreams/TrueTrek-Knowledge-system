# Production deployment — TrueTrek Knowledge System

## Architecture

```
Internet → Nginx :80
  ├── /api/ /admin/          → Gunicorn (Django) 127.0.0.1:8000
  ├── /static/ /media/       → files on disk
  └── /                      → Next.js 127.0.0.1:3000
```

## Services

| Unit | Role |
|------|------|
| `truetrek-backend.service` | Gunicorn (Django WSGI) |
| `truetrek-frontend.service` | Next.js (`npm start`) |
| `nginx` | Reverse proxy |
| `postgresql` | Database |

## CI/CD pipeline

GitHub Actions workflow: `.github/workflows/deploy.yml`

| Stage | Job | What it does |
|-------|-----|--------------|
| 1 | **Code Validation** | Structure + env templates, syntax, Django checks, ESLint |
| 2 | **Build & Application Verification** | Next.js production build, artifact checks, Gunicorn start test |
| 3 | **Production Deployment** | SSH deploy via `deploy/deploy.sh` |
| 4 | **Post-Deployment Verification** | systemd/Nginx checks + external HTTP health suite |

Pipeline order is enforced with `needs`. Each stage also emits GitHub Actions annotations and a step summary listing its responsibilities.

On every push to `main` (or manual `workflow_dispatch`), the pipeline runs. Concurrent production deploys are serialized (`cancel-in-progress: false`).

## Manual deploy

```bash
sudo -u truetrek bash /opt/TrueTrek-Knowledge-system/deploy/deploy.sh
```

The script is idempotent: safe to rerun. It fails immediately on any error, validates Nginx and build artifacts **before** restarting services, then confirms systemd + HTTP health.

## GitHub configuration

### Secrets

| Secret | Required | Example |
|--------|----------|---------|
| `DEPLOY_HOST` | Yes | `31.97.146.95` |
| `DEPLOY_USER` | Yes | `truetrek` |
| `DEPLOY_SSH_KEY` | Yes | contents of `/home/truetrek/.ssh/github_actions_deploy` |
| `DEPLOY_PORT` | No | `22` (defaults to 22) |
| `HEALTH_CHECK_URL` | No | `http://31.97.146.95` (defaults to `http://$DEPLOY_HOST`) |

### Variables (optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `/api` | Used during CI frontend build |

### Environment

The deploy job uses the GitHub Environment named `production`. Create it under **Settings → Environments** if it does not exist yet (optional protection rules / required reviewers).

### Bootstrap secrets from the server

```bash
gh auth login
export DEPLOY_HOST=31.97.146.95
export HEALTH_CHECK_URL=http://31.97.146.95
bash /opt/TrueTrek-Knowledge-system/deploy/setup-github-secrets.sh
```

Or set them in GitHub → Settings → Secrets and variables → Actions.

## Server notes

After updating `deploy/sudoers/truetrek` on the server:

```bash
sudo install -m 440 deploy/sudoers/truetrek /etc/sudoers.d/truetrek
sudo visudo -cf /etc/sudoers.d/truetrek
```

The sudoers file allows passwordless `systemctl` restart/status, `nginx -t`, and the controlled `git-pull.sh` helper.
