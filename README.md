# LMS System

Full-stack Learning Management System with a strict separation between backend and frontend.

```
LMS-System/
├── backend/      # Django REST Framework API
├── frontend/     # Next.js (JavaScript, App Router)
└── CLAUDE.md     # Project rules and conventions
```

## Stack

| Layer    | Tech |
|----------|------|
| Backend  | Python, Django 5.1, Django REST Framework, PostgreSQL |
| Frontend | Next.js (App Router), JavaScript, Tailwind CSS v4, Redux Toolkit, Axios |

## Backend

Django REST API. See [backend/README.md](backend/README.md) for setup and [backend/SYSTEM.md](backend/SYSTEM.md) for architecture and API conventions.

```bash
cd backend
python -m venv env
env\Scripts\activate      # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Runs at `http://localhost:8000`.

## Frontend

Next.js app.

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000`.

## Conventions

Both stacks follow the rules in [CLAUDE.md](.claude/CLAUDE.md):

- Backend: Class-Based Views only, all responses through `core/response.py`, business logic in `services.py`, no comments.
- Frontend: JavaScript only (no TypeScript), JSX lives in `components/`, all API calls through `services/`, auth state in cookies (never `localStorage`/`sessionStorage`), no comments.

## Status

- **Backend:** `users` app implemented (custom user model, role-based access, email-or-username login). All other apps (`courses`, `modules`, `lessons`, `enrollments`, `progress`, `quizzes`, `dashboard`, `reports`, `search`, `uploads`, `audit_logs`) are scaffolded but not yet implemented.
- **Frontend:** Marketing/site shell and portal scaffolding in place (auth, curriculum, dashboard, store, teachers, partnerships routes); not yet wired to the backend API for most domains.
