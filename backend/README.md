# LMS System — Backend

Backend API for a Learning Management System, built with **Django 5.1** and **Django REST Framework**.

For architecture, app responsibilities, and API conventions, see [SYSTEM.md](SYSTEM.md).

## Tech Stack

- **Language / Framework:** Python, Django 5.1, Django REST Framework
- **Database:** PostgreSQL (via `psycopg`)
- **Auth:** Django session auth today; `djangorestframework-simplejwt` included for JWT auth
- **API docs:** `drf-spectacular` (OpenAPI/Swagger)
- **CORS:** `django-cors-headers` (pre-configured for a frontend on `http://localhost:3000`)

## Project Structure

```
backend/
├── lms_be/          # Django project (settings, urls, wsgi/asgi)
├── common/          # Shared utilities (e.g. response.py)
├── users/           # Custom user model, roles, auth backend
├── courses/         # Course management
├── modules/         # Course modules
├── lessons/         # Lessons within modules
├── enrollments/     # Student enrollments
├── progress/        # Learner progress tracking
├── quizzes/         # Quizzes and assessments
├── dashboard/       # Dashboard/summary views
├── reports/         # Reporting
├── search/          # Search
├── uploads/         # File uploads
├── audit_logs/      # Audit logging
└── manage.py
```

## Setup

1. **Create and activate a virtual environment**
   ```bash
   python -m venv env
   env\Scripts\activate      # Windows
   source env/bin/activate   # macOS/Linux
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**

   Create a `.env` file in `backend/` with:
   ```
   SECRET_KEY=your-secret-key
   DEBUG=True
   DB_NAME=lms_db
   DB_USER=postgres
   DB_PASSWORD=your-password
   DB_HOST=localhost
   DB_PORT=5432
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser** (optional, for Django admin)
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

## API Response Format

All API responses follow a single envelope. See [SYSTEM.md](SYSTEM.md#api-response-format) for full details.

```json
// success
{ "status": 200, "message": "...", "data": {} }

// error (no "data" key)
{ "status": 400, "message": "..." }
```

## Status

Early-stage scaffold. `users` (custom user model with ADMIN/TEACHER/STUDENT roles, email-or-username auth) is implemented. All other apps (`courses`, `modules`, `lessons`, `enrollments`, `progress`, `quizzes`, `dashboard`, `reports`, `search`, `uploads`, `audit_logs`) are scaffolded but not yet implemented. No frontend exists yet.
