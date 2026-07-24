# System Overview

Architecture and conventions for the LMS backend. For setup instructions, see [README.md](README.md).

## Stacks

| Concern       | Choice                                            |
|---------------|----------------------------------------------------|
| Framework     | Django 5.1 + Django REST Framework                |
| Database      | PostgreSQL                                         |
| Auth          | Session auth (`SessionAuthentication`); `djangorestframework-simplejwt` installed for future JWT auth |
| Custom auth backend | `users.backends.EmailOrUsernameModelBackend` — login with username or email |
| API docs      | `drf-spectacular` (installed, not yet wired into `urls.py`) |
| CORS          | `django-cors-headers`, allowed origin `http://localhost:3000` (reserved for a future frontend) |

## Apps

| App           | Status        | Purpose |
|---------------|---------------|---------|
| `users`       | Implemented   | Custom user model (`CustomUser`), role-based access (`ADMIN`, `TEACHER`, `STUDENT`), email-or-username login |
| `courses`     | Scaffold only | Course catalog |
| `modules`     | Scaffold only | Modules within a course |
| `lessons`     | Scaffold only | Lessons within a module |
| `enrollments` | Scaffold only | Student enrollment in courses |
| `progress`    | Scaffold only | Learner progress tracking |
| `quizzes`     | Scaffold only | Quizzes and assessments |
| `dashboard`   | Scaffold only | Aggregated summary views |
| `reports`     | Scaffold only | Reporting |
| `search`      | Scaffold only | Search across LMS content |
| `uploads`     | Scaffold only | File uploads |
| `audit_logs`  | Scaffold only, not yet in `INSTALLED_APPS` | Audit trail of user/system actions |
| `common`      | Implemented   | Shared, cross-app utilities (currently: API response helpers) |

The intended domain hierarchy is `courses → modules → lessons`, with `enrollments` and `progress` tracking a student's relationship to a course, and `quizzes` attached to lessons/modules for assessment.

## Auth & Roles

`users.CustomUser` extends `AbstractUser` with:
- `email` (unique, used as the primary login identifier)
- `name`
- `role`: one of `ADMIN`, `TEACHER`, `STUDENT` (`TextChoices`)
- `is_admin` / `is_teacher` / `is_student` convenience properties

`AUTH_USER_MODEL = 'users.CustomUser'`. Login accepts either username or email via the custom `EmailOrUsernameModelBackend`, chained before the default `ModelBackend`.

`DEFAULT_PERMISSION_CLASSES` is `IsAuthenticated` globally — every endpoint requires an authenticated user unless a view explicitly overrides it.

## API Response Format

Every API endpoint returns a single JSON envelope shaped as:

```json
{
  "status": 200,
  "message": "",
  "data": ""
}
```

Rules:
- **`status`** — the actual HTTP status code (`200`, `201`, `400`, `404`, `500`, ...), not a `"success"`/`"error"` string.
- **`message`** — human-readable, specific to that endpoint/action (not a generic string reused across APIs).
- **`data`** — present **only on success**. On error, the `data` key is omitted entirely (not `null`, not `[]`).

**Success:**
```json
{
  "status": 200,
  "message": "Course created successfully",
  "data": {
    "id": 1,
    "title": "Intro to Python"
  }
}
```

**Error:**
```json
{
  "status": 400,
  "message": "Course title is required"
}
```

### Implementation

Defined in [`common/response.py`](common/response.py) and used by all views instead of returning a raw DRF `Response`:

```python
from common.response import success_response, error_response

def get(self, request):
    return success_response(data=serializer.data, message="Courses fetched successfully")

def post(self, request):
    if not serializer.is_valid():
        return error_response(message="Invalid data", status_code=400)
    ...
```

`success_response(data, message="Success", status_code=200)` and `error_response(message="Something went wrong", status_code=400)` both wrap DRF's `Response`, so the usual HTTP status codes still apply — the envelope shape is just standardized on top of them.

## Database

PostgreSQL, configured via environment variables (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`) loaded through `python-dotenv`. Only `users` has migrations applied; all other apps have no models defined yet.

## Known Gaps

- No frontend exists yet; `CORS_ALLOWED_ORIGINS` anticipates one on `localhost:3000`.
- JWT auth (`simplejwt`) is installed but not configured — `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES` only lists `SessionAuthentication`.
- `drf-spectacular` is installed but not registered in `urls.py` — no live OpenAPI schema/Swagger UI yet.
- `audit_logs` app exists on disk but isn't in `INSTALLED_APPS`.
- No `.env.example`; `.env` holds real local credentials and must stay out of version control (see `.gitignore`).
