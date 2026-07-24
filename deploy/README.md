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

## Manual deploy

```bash
sudo -u truetrek bash /opt/TrueTrek-Knowledge-system/deploy/deploy.sh
```

## GitHub Actions secrets

| Secret | Example |
|--------|---------|
| `DEPLOY_HOST` | `31.97.146.95` |
| `DEPLOY_USER` | `truetrek` |
| `DEPLOY_SSH_KEY` | private key for deploy user |
| `DEPLOY_PORT` | `22` (optional) |

On every push to `main`, the workflow SSHs in and runs `deploy/deploy.sh`.

## Environment files (not in git)

- `/opt/TrueTrek-Knowledge-system/backend/.env`
- `/opt/TrueTrek-Knowledge-system/frontend/.env`
