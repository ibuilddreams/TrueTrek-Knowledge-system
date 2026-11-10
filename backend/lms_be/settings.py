import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if host.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',')
    if origin.strip()
]


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',

    # Local Apps
    'users',
    'courses',
    'dashboard',
    'modules',
    'lessons',
    'enrollments',
    'progress',
    'quizzes',
    'assignments',
    'carts',
    'wishlists',
    'instructors',
    'daily_drill',
    'pathways',
    'onboarding',
    'future_clients',
    'tiers',
    'reports',
    'search',
    'uploads',
    'audit_logs',
    'ai_courses',
    'messaging',
    'advisor',
    'rewards',
    'teacher_requests',
    'class_feed',
    'warroom',
    'notifications',
    'student_concerns',
    'testimonials',
    'quests',
    'brand_validator',
    'live_sessions',
    'wargamer',
    'class_sessions',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'lms_be.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # Project-level overrides (admin/ holds the changelist that carries the
        # CSV export button) are searched before any app's own templates.
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'lms_be.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTH_USER_MODEL = 'users.CustomUser'

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

_cors_origins = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000',
)
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in _cors_origins.split(',') if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'EXCEPTION_HANDLER': 'common.exceptions.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {

        'ai-generation': '5/hour',
        'message-send': '60/minute',
        'advisor-chat': '15/minute',
        'ai-grading': '20/hour',
        'room-message-send': '60/minute',
        'ai-quiz-regeneration': '10/hour',
        'ai-content-suggestions': '30/minute',
        'testimonial-submit': '5/hour',
        'media-kit-review': '10/hour',
        # One chat turn in the Tactical Wargamer role-play. Higher than
        # advisor-chat's 15/minute because a role-play is a back-and-forth
        # the student is actively typing through, not one-off questions.
        'roleplay-turn': '40/minute',
        # Scoring a finished scene. Bounded per hour rather than per minute:
        # one evaluation per completed run is the expected shape, and the
        # retry path (a failed scoring call) should not be the thing that
        # locks a student out of their own report card.
        'roleplay-evaluation': '40/hour',
    },
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'LMS API',
    'DESCRIPTION': 'API documentation for the LMS backend',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

AUTHENTICATION_BACKENDS = [
    'users.backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email links follow the deployment environment, independently of Django DEBUG.
# Default to production so an unset environment never emails localhost links.
APP_ENV = os.getenv('APP_ENV', 'production').strip().lower()
if APP_ENV not in ('dev', 'development', 'prod', 'production'):
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('APP_ENV must be development or production.')
DEV_FRONTEND_URL = os.getenv('DEV_FRONTEND_URL', 'http://localhost:3000').strip().rstrip('/')
PRODUCTION_FRONTEND_URL = os.getenv('PRODUCTION_FRONTEND_URL', 'https://test.coolnerdz.com').strip().rstrip('/')
FRONTEND_URL = DEV_FRONTEND_URL if APP_ENV in ('dev', 'development') else PRODUCTION_FRONTEND_URL
PASSWORD_RESET_TIMEOUT = int(os.getenv('PASSWORD_RESET_TIMEOUT', 3600))


GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')

EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', '')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'true').strip().lower() in ('true', '1', 'yes')
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'false').strip().lower() in ('true', '1', 'yes')
PRAXIN_CLIENT_EMAIL = os.getenv('PRAXIN_CLIENT_EMAIL', '').strip()
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'no-reply@truetrek.edu')


GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
AI_PROVIDER = os.getenv('AI_PROVIDER', 'gemini')
AI_MODEL = os.getenv('AI_MODEL', 'gemini-3.6-flash')
# Currently unused: course generation moved off Gemini to our own LLM service
# (AI_COURSE_SERVICE_URL below), which picks its own model, so there is no second model
# to fall back to. Kept because restoring the Gemini course path — the commented
# branches in ai_courses/providers/__init__.py and ai_courses/services.py — needs
# it back. Course generation only: a second model to try when AI_MODEL itself is
# unavailable. Gemini answers 503 "this model is currently experiencing high
# demand" per model — measured directly against this key, gemini-3.6/3.7/3.8-flash
# all refused the course-generation request within seconds while gemini-3.5-flash
# served the identical structured request in ~6s. Without this, an overloaded
# primary model is simply a failed generation the admin has to retry by hand.
# Set to an empty string to disable the fallback and fail on the primary model.
AI_FALLBACK_MODEL = os.getenv('AI_FALLBACK_MODEL', 'gemini-3.5-flash')
# Used by the advisor app's live chat instead of AI_MODEL — AI_MODEL is a
# "thinking" model (real-world testing showed 10-20s+ per reply, all of it
# spent on internal reasoning tokens with nothing visible to stream), which is
# fine for a backgrounded, polled course-generation job but far too slow for a
# synchronous chat reply. gemini-3.1-flash-lite measured ~3s for the same kind
# of prompt with no reasoning overhead.
AI_CHAT_MODEL = os.getenv('AI_CHAT_MODEL', 'gemini-3.1-flash-lite')
AI_REQUEST_TIMEOUT = int(os.getenv('AI_REQUEST_TIMEOUT', 120))
AI_MAX_MODULES = int(os.getenv('AI_MAX_MODULES', 12))
AI_MAX_LESSONS = int(os.getenv('AI_MAX_LESSONS', 10))
AI_MONTHLY_LIMIT = int(os.getenv('AI_MONTHLY_LIMIT', 50))

AI_MAX_CONCURRENT_GENERATIONS = int(os.getenv('AI_MAX_CONCURRENT_GENERATIONS', 3))

AI_STALE_JOB_THRESHOLD_SECONDS = int(
    os.getenv('AI_STALE_JOB_THRESHOLD_SECONDS', max(300, AI_REQUEST_TIMEOUT * 2 + 60))
)

# The address of our course-generation LLM service. This is the single value to
# change if that service ever moves; nothing else about it is configurable.
AI_COURSE_SERVICE_DEFAULT_URL = 'https://llm.coolnerdz.com'

# --- Self-hosted course-generation LLM (ai_courses) ---------------------------
# Full-course generation calls our own LLM service instead of Gemini:
#   POST /api/v1/generate/admin/course   -> job_id
#   GET  /api/v1/jobs/<job_id>/events    -> SSE progress
#   GET  /api/v1/jobs/<job_id>           -> the finished course structure
# The service is unauthenticated and there is nothing to configure per
# environment, so its address is the only value here and it has a default — the
# env var exists purely so a staging box can be pointed elsewhere without a code
# change. Everything else (timeouts, poll interval, RAG) lives as a documented
# constant in ai_courses/providers/custom_llm.py.
#
# Every other AI feature — advisor chat, quiz/assignment AI grading, content
# suggestions, the daily drill — still uses AI_PROVIDER/GEMINI_API_KEY above.
AI_COURSE_SERVICE_URL = os.getenv('AI_COURSE_SERVICE_URL', AI_COURSE_SERVICE_DEFAULT_URL).strip().rstrip('/')

# Daily Drill AI generation — a single small MCQ question, not a full course,
# so it's generated synchronously (same pattern as advisor's live chat) on the
# fast AI_CHAT_MODEL rather than the slower "thinking" AI_MODEL used for
# ai_courses' backgrounded/polled generation.
DAILY_DRILL_AI_TIMEOUT_SECONDS = int(os.getenv('DAILY_DRILL_AI_TIMEOUT_SECONDS', 15))
# Flat, backend-controlled reward amount for a *correct* AI-generated drill
# answer (0 for an incorrect one) — the amount itself is never derived from
# the AI's own output, so Gemini never decides how many points a correct
# answer is worth; only the student's own correctness decides whether this
# amount is paid out at all.
DAILY_DRILL_DEFAULT_AI_REWARD_POINTS = int(os.getenv('DAILY_DRILL_DEFAULT_AI_REWARD_POINTS', 100))
# How many of the student's most recent AI-generated drills are checked
# against a new generation's content fingerprint before accepting it, so the
# same student doesn't see near-identical drills day after day.
DAILY_DRILL_VARIATION_LOOKBACK_DAYS = int(os.getenv('DAILY_DRILL_VARIATION_LOOKBACK_DAYS', 7))
# Minimum watched percentage of an admin-scheduled Daily Drill video before
# its quiz can be submitted — enforced server-side on quiz submit, not just
# hidden/disabled client-side.
DAILY_DRILL_VIDEO_WATCH_THRESHOLD_PERCENT = int(
    os.getenv('DAILY_DRILL_VIDEO_WATCH_THRESHOLD_PERCENT', 80)
)
# Task 17 (Phase 5) — a student who hasn't completed a Daily Drill in this
# many consecutive days is flagged inactive (see daily_drill/engagement.py).
# This reuses the same activity signal Task 16's streak is computed from,
# rather than inventing a second notion of "activity".
DAILY_DRILL_INACTIVITY_THRESHOLD_DAYS = int(os.getenv('DAILY_DRILL_INACTIVITY_THRESHOLD_DAYS', 3))
# How often (in days) an already-inactive student gets a repeat re-engagement
# email, so `check_student_engagement` doesn't email them every single day —
# only once on the day they first cross the threshold, then at most this
# often thereafter.
DAILY_DRILL_REENGAGEMENT_REMINDER_INTERVAL_DAYS = int(
    os.getenv('DAILY_DRILL_REENGAGEMENT_REMINDER_INTERVAL_DAYS', 7)
)

# Daily Quests (quests/) — how many quests a student is handed each morning.
# The set is drawn from the admin-authored catalog, preferring quests the
# student hasn't seen (see quests/services.py::_pick_quests_for), so a
# catalog smaller than this simply yields a shorter day rather than repeats.
DAILY_QUEST_COUNT = int(os.getenv('DAILY_QUEST_COUNT', 3))

# Tactical Wargamer (wargamer/) — the LS-302 "No Muscle" role-play simulator.
# Both AI calls are synchronous and run on the fast AI_CHAT_MODEL, the same
# arrangement advisor chat and the daily drill use: a student is watching a
# typing indicator, so a backgrounded thread-and-poll (ai_courses,
# brand_validator) would add latency without removing any wait.
ROLEPLAY_TURN_TIMEOUT_SECONDS = int(os.getenv('ROLEPLAY_TURN_TIMEOUT_SECONDS', 20))
# Scoring reads a whole transcript against a three-part rubric and writes a
# report card, so it gets more room than a single in-character line — still
# well under nginx's proxy_read_timeout (60s, deploy/nginx/truetrek.conf).
ROLEPLAY_EVALUATION_TIMEOUT_SECONDS = int(os.getenv('ROLEPLAY_EVALUATION_TIMEOUT_SECONDS', 35))
# How many messages the athlete gets in one scene. A real boundary
# conversation is short; this is a pedagogical limit as much as a cap on AI
# spend, and the counterpart is told to wind down as it approaches.
ROLEPLAY_MAX_ATHLETE_TURNS = int(os.getenv('ROLEPLAY_MAX_ATHLETE_TURNS', 8))
# Below this, there is nothing to grade against a three-part rubric — a single
# "no" would score the same whatever the student wrote after it.
ROLEPLAY_MIN_ATHLETE_TURNS = int(os.getenv('ROLEPLAY_MIN_ATHLETE_TURNS', 2))
# The overall score a run needs before the scenario's points are paid. The
# amount itself is never derived from the AI's output (same rule as
# DAILY_DRILL_DEFAULT_AI_REWARD_POINTS): the model only decides whether this
# threshold was met, never how much a pass is worth.
ROLEPLAY_PASS_SCORE_PERCENT = int(os.getenv('ROLEPLAY_PASS_SCORE_PERCENT', 70))
# The brief's own Time-to-Boundary target, shown to the student beside the
# server-measured time they actually took. It is a display benchmark only —
# the Time-to-Boundary *score* is judged on how early in the conversation an
# unambiguous refusal appeared, not on a stopwatch, because a typed reply and
# a spoken one take very different amounts of wall-clock time to produce.
ROLEPLAY_TIME_TO_BOUNDARY_SECONDS = int(os.getenv('ROLEPLAY_TIME_TO_BOUNDARY_SECONDS', 15))

# Agora RTC (class_sessions/) — the live classroom a teacher schedules for a
# course and their enrolled students join. Both values belong to the same
# Agora project; the App ID is a public identifier the browser also carries as
# NEXT_PUBLIC_AGORA_APP_ID, while the App Certificate is the signing secret
# that must never reach the frontend. The backend needs both because a join
# token is signed *for* an App ID (class_sessions/agora.py).
#
# With either unset, scheduling still works and joining fails with an honest
# "not configured" message rather than a broken video tile — the same loud
# failure GEMINI_API_KEY gets, never a placeholder credential.
AGORA_APP_ID = os.getenv('AGORA_APP_ID', '')
AGORA_APP_CERTIFICATE = os.getenv('AGORA_APP_CERTIFICATE', '')

# Agora Interactive Whiteboard (class_sessions/whiteboard.py) — the board a
# teacher presents on during a live class. A *different* Agora product from
# the RTC credentials above, with its own section of the console and its own
# keys: the App Identifier is a public value the browser is handed with its
# room token, while the Access Key / Secret Key pair is the signing secret
# that never leaves the server. They must all belong to the same whiteboard
# app — a room token signed by one team's keys is meaningless under another
# App Identifier, and Netless says so only as a failed join.
#
# The region is where a whiteboard room physically lives. It is read here only
# when a room is *created*; the one a room was actually created in is stored
# on the session (`ClassSession.whiteboard_region`), so changing this later
# moves new boards without orphaning old ones.
#
# All three unset is an ordinary, supported state: video classes run exactly
# as before and the whiteboard button says it isn't configured, rather than
# failing inside the whiteboard SDK.
AGORA_WHITEBOARD_APP_IDENTIFIER = os.getenv('AGORA_WHITEBOARD_APP_IDENTIFIER', '')
AGORA_WHITEBOARD_ACCESS_KEY = os.getenv('AGORA_WHITEBOARD_ACCESS_KEY', '')
AGORA_WHITEBOARD_SECRET_KEY = os.getenv('AGORA_WHITEBOARD_SECRET_KEY', '')
AGORA_WHITEBOARD_REGION = os.getenv('AGORA_WHITEBOARD_REGION', 'us-sv')

# Agora Cloud Recording (class_sessions/recording_api.py) — the recording of a
# live class that enrolled students watch afterwards. A *third* Agora product
# alongside the two above, with a third set of credentials: the Customer ID /
# Customer Secret pair is the console's RESTful API key, and it is unrelated to
# both the RTC App Certificate and the whiteboard's Access Key. All three fail
# independently, which is the point — a server that can run classes but cannot
# record them is an ordinary state, and the classroom simply doesn't offer the
# button (`services.is_recording_configured`).
# The Agora console's RESTful API key. There is exactly **one per account**,
# not one per product: Cloud Recording and Real-Time Transcription (and every
# other Agora REST API) authenticate with the same pair, which is why this is
# named for the account rather than for a feature.
#
# `class_sessions/services.py::_customer_key` resolves it, preferring a
# product-specific pair where one is set — AGORA_RECORDING_* for recording and
# AGORA_STT_* for transcription — so a deployment that was issued a second key,
# or that wants to revoke one product's access without touching the other, can
# say so. Those two exist only for that; the ordinary case is this pair alone.
AGORA_CUSTOMER_ID = os.getenv('AGORA_CUSTOMER_ID', '')
AGORA_CUSTOMER_SECRET = os.getenv('AGORA_CUSTOMER_SECRET', '')

# Recording-only override of the pair above. Also the name this setting had
# before transcription existed, so an older .env keeps working unchanged.
AGORA_RECORDING_CUSTOMER_ID = os.getenv('AGORA_RECORDING_CUSTOMER_ID', '')
AGORA_RECORDING_CUSTOMER_SECRET = os.getenv('AGORA_RECORDING_CUSTOMER_SECRET', '')

# Where the recordings land. Agora does not host them: the recorder uploads
# straight into a bucket we own, and these credentials are handed to Agora in
# the start request so it can write there. The same pair signs the playback
# URLs below, because it is the same bucket and the same object.
#
# VENDOR and STORAGE_REGION are *Agora's own integer enums*, from the
# `storageConfig` section of its cloud-recording start API. Vendor 1 is
# Amazon S3; a store that merely speaks S3 (Cloudflare R2, MinIO,
# DigitalOcean Spaces, Wasabi) is vendor 11 and additionally needs
# AGORA_RECORDING_S3_ENDPOINT, which `services._storage_config` forwards as
# `extensionParams.endpoint`. STORAGE_REGION's numbering is Agora's own and
# is not documented on the same page — look it up before changing it from 0.
#
# S3_REGION is the same region written the way AWS itself writes it, used to
# sign playback URLs. Both are asked for rather than one derived from the
# other because Agora's enum is theirs to renumber and a mapping baked in
# here would silently rot — they must describe the same region, or recordings
# upload to one place and play back from another.
AGORA_RECORDING_VENDOR = int(os.getenv('AGORA_RECORDING_VENDOR', 1))
AGORA_RECORDING_STORAGE_REGION = int(os.getenv('AGORA_RECORDING_STORAGE_REGION', 0))
AGORA_RECORDING_BUCKET = os.getenv('AGORA_RECORDING_BUCKET', '')
AGORA_RECORDING_ACCESS_KEY = os.getenv('AGORA_RECORDING_ACCESS_KEY', '')
AGORA_RECORDING_SECRET_KEY = os.getenv('AGORA_RECORDING_SECRET_KEY', '')

# Playback (class_sessions/storage.py). The bucket stays **private**: a
# recording is released only as a short-lived signed URL, minted per viewer by
# `GET /class-sessions/<id>/recording/` behind the same enrolment check that
# guards the class itself — exactly how `live_sessions` withholds a meeting
# link from a listing. A public bucket would make every class recording a URL
# anybody can forward.
#
# Signing is plain AWS SigV4, so any S3-compatible store works (S3, Cloudflare
# R2, DigitalOcean Spaces, MinIO, Wasabi) by pointing S3_ENDPOINT at it; leave
# it empty for AWS itself. PATH_STYLE is what MinIO and some R2 setups need.
AGORA_RECORDING_S3_REGION = os.getenv('AGORA_RECORDING_S3_REGION', 'us-east-1')
AGORA_RECORDING_S3_ENDPOINT = os.getenv('AGORA_RECORDING_S3_ENDPOINT', '')
AGORA_RECORDING_S3_PATH_STYLE = os.getenv('AGORA_RECORDING_S3_PATH_STYLE', 'false').lower() == 'true'

# Optional CDN in front of the bucket. When set, playback URLs are this base
# plus the object key and nothing is signed — which means the objects behind
# it are public, so set it only if that is what you intend.
AGORA_RECORDING_PUBLIC_BASE_URL = os.getenv('AGORA_RECORDING_PUBLIC_BASE_URL', '')

# How long a playback URL stays valid. Short on purpose: the student's "Watch
# recording" button asks for a fresh one every time, so a link that leaks has
# a few hours of life rather than the life of the course.
AGORA_RECORDING_URL_TTL_SECONDS = int(os.getenv('AGORA_RECORDING_URL_TTL_SECONDS', 6 * 60 * 60))

# Recording is billed by the minute on top of the class's own RTC minutes, so
# it can be switched off for the whole deployment without unpicking the
# per-class setting teachers see (`ClassSession.is_recorded`).
AGORA_RECORDING_ENABLED = os.getenv('AGORA_RECORDING_ENABLED', 'true').lower() == 'true'

# Whether a finished recording is emailed to the class as well as announced in
# the portal. The email carries a link to the class in the portal, never the
# recording's own URL: a playback link is signed and expires in hours, while
# an email outlives it and can be forwarded to anyone.
CLASS_RECORDING_EMAIL_ENABLED = os.getenv('CLASS_RECORDING_EMAIL_ENABLED', 'true').lower() == 'true'

# Where that email points. One screen holds both the class and its recording,
# so there is one link rather than a route per notification type.
CLASS_RECORDING_PORTAL_PATH = os.getenv(
    'CLASS_RECORDING_PORTAL_PATH', '/studentportal?tab=live-classes'
)
CLASS_RECORDING_TEACHER_PORTAL_PATH = os.getenv(
    'CLASS_RECORDING_TEACHER_PORTAL_PATH', '/teacherportal?tab=classes'
)

# Agora Real-Time Transcription — the AI meeting notes a class is written up
# into afterwards (class_sessions/transcription_api.py). A FOURTH Agora
# product beside the RTC call, the whiteboard and Cloud Recording, enabled
# separately on an Agora project and failing separately here: a server that
# can run and record a class but not write it up is an ordinary state, and
# the classroom simply shows the notes button disabled with the reason.
#
# It needs no bucket settings of its own. Agora writes a class's captions
# into storage we own, exactly as its recorder writes the video there, so the
# AGORA_RECORDING_BUCKET / _ACCESS_KEY / _SECRET_KEY / _VENDOR /
# _STORAGE_REGION / _S3_ENDPOINT block above serves both — one bucket, one
# place to get it right.
#
# It needs no RESTful key of its own either: AGORA_CUSTOMER_ID / _SECRET above
# is the account's one key and every Agora REST product uses it. These two
# exist only for a deployment that was issued a second one, or that wants to
# revoke transcription's access without touching recording's; left empty,
# which is the normal case, the account pair is used.
AGORA_STT_CUSTOMER_ID = os.getenv('AGORA_STT_CUSTOMER_ID', '')
AGORA_STT_CUSTOMER_SECRET = os.getenv('AGORA_STT_CUSTOMER_SECRET', '')

# Transcription is billed by the minute on top of the class's own RTC minutes
# — and separately from recording — so it can be switched off for the whole
# deployment without unpicking the per-class setting teachers see
# (`ClassSession.takes_notes`).
CLASS_NOTES_ENABLED = os.getenv('CLASS_NOTES_ENABLED', 'true').lower() == 'true'

# What Agora is asked to listen for, comma-separated BCP-47 tags. It accepts
# at most four and refuses the whole request when given more, so the list is
# clamped (`class_sessions/services.py::notes_languages`) rather than passed
# through. Every extra language costs accuracy on the others, so this is a
# deliberate choice rather than a net to cast wide.
CLASS_NOTES_LANGUAGES = os.getenv('CLASS_NOTES_LANGUAGES', 'en-US')

# Whether finished notes are emailed to the class as well as announced in the
# portal. The email carries a link to the class in the portal, never to the
# notes document: the document is served behind the class's own roster, and
# an email outlives any check and forwards to anyone.
CLASS_NOTES_EMAIL_ENABLED = os.getenv('CLASS_NOTES_EMAIL_ENABLED', 'true').lower() == 'true'

# Where the audio a class is written up from actually comes from. Two sources,
# one pipeline from the transcript onwards:
#
#   'local'  (the default) — the **teacher's own browser** mixes everybody's
#            audio, records it in segments and uploads them to this server,
#            where they are kept in MEDIA_ROOT (`class-audio/`) and handed to
#            the AI model to transcribe. Nothing leaves this machine except
#            the model call, and **no bucket of any kind is needed** — which is
#            the point: a deployment with no S3 can still take notes today,
#            and the files are ordinary Django FileFields, so pointing them at
#            a bucket later is a storage change rather than a rewrite.
#
#   'agora'  — Agora Real-Time Transcription sends a bot into the channel and
#            writes WebVTT captions into the bucket above. Needs the AGORA_STT
#            / AGORA_CUSTOMER key *and* the AGORA_RECORDING_BUCKET block to be
#            filled in, and bills per minute on top of the call.
#
# Both end at the same place: a transcript on the row, the same model prompt,
# the same notes, the same PDF, the same emails.
CLASS_NOTES_SOURCE = os.getenv('CLASS_NOTES_SOURCE', 'local').strip().lower()

# How long each recorded segment of a class is, in seconds ('local' only).
# Segments exist for two reasons and both are worth keeping: a browser that
# crashes mid-class loses only the slice it was recording rather than the
# whole class, and a model call is given minutes of audio rather than hours,
# which keeps every request well inside the inline-upload limit.
#
# Four minutes, for two reasons beyond the two above. A segment has to stay
# inside nginx's *default* client_max_body_size of 1 MB — a proxy left at
# that rejects every upload with a 413 before Django ever sees it, and the
# only symptom is classes that quietly produce no notes — and this number and
# the bitrate below are what decide that: 24 kbps x 240 s / 8 = **720 KB**.
# Move one and check the other. And a class shorter than one segment never
# rotates at all, so everything rides on the closing flush; at four minutes
# even a short lesson gets audio onto the server while it is still running.
CLASS_NOTES_AUDIO_SEGMENT_SECONDS = int(os.getenv('CLASS_NOTES_AUDIO_SEGMENT_SECONDS', 240))

# The bitrate the browser records at, in bits per second ('local' only). Low,
# because this is mono speech being read by a model rather than music — but
# not as low as it can go. A classroom is a far-field recording of several
# people at different distances from different microphones, and the first
# real transcripts off 16 kbps came back peppered with [inaudible]. 24 kbps
# buys that back for half as many bytes again, which the segment length above
# is sized around.
CLASS_NOTES_AUDIO_BITRATE = int(os.getenv('CLASS_NOTES_AUDIO_BITRATE', 24000))

# The largest single segment this server will accept, in megabytes ('local'
# only). A ceiling on what one request can push onto the disk, not a tuning
# knob — at the bitrate above a ten-minute segment is about 1.2 MB, so
# anything near this is a client sending something it should not.
CLASS_NOTES_AUDIO_MAX_MB = int(os.getenv('CLASS_NOTES_AUDIO_MAX_MB', 40))

# --- War Room Live -------------------------------------------------------
#
# The monthly drop-in audio sessions (live_sessions/) run on the SAME Agora
# project as the live classes — AGORA_APP_ID / AGORA_APP_CERTIFICATE above are
# the whole of what a room needs, and there is deliberately nothing else to
# fill in. A session is never filmed and never transcribed by a third party:
# its notes are written from the room's own audio, recorded by the host's
# browser and posted to this server, so an AI key is all the write-up needs
# (live_sessions/notes.py).
#
# The recording settings those browsers use are CLASS_NOTES_AUDIO_* above
# rather than a second set of their own: it is the same recorder posting to
# the same kind of endpoint, and two numbers that had to stay in step would
# not.
LIVE_SESSION_NOTES_ENABLED = os.getenv('LIVE_SESSION_NOTES_ENABLED', 'true').lower() == 'true'

# Whether the finished notes are emailed out with the PDF attached. Turns the
# email off without touching the in-app notification, exactly as
# CLASS_NOTES_EMAIL_ENABLED does for a class.
LIVE_SESSION_NOTES_EMAIL_ENABLED = (
    os.getenv('LIVE_SESSION_NOTES_EMAIL_ENABLED', 'true').lower() == 'true'
)

# Where that email sends people. The notes live in the portal, which is where
# the session, its recording and any later correction are — the attachment is
# a snapshot, the portal is the record.
LIVE_SESSION_PORTAL_PATH = os.getenv(
    'LIVE_SESSION_PORTAL_PATH', '/studentportal?tab=warroom-live'
)
LIVE_SESSION_ADMIN_PORTAL_PATH = os.getenv(
    'LIVE_SESSION_ADMIN_PORTAL_PATH', '/adminportal?tab=live-sessions'
)

# AI-graded assignment review (assignments/ai_review/) and quiz short-answer
# grading (quizzes/ai_grading.py) — reuses AI_CHAT_MODEL (the fast path), same
# rationale as DAILY_DRILL_AI_TIMEOUT_SECONDS above, but a submission can
# include a multi-page PDF/image evaluated multimodally rather than a single
# MCQ question, so it gets its own, larger timeout rather than sharing the
# drill's 15s. Raised from 45s after real-world testing showed the Gemini API
# occasionally stalling past 45s on both workloads (including on the small,
# text-only quiz-answer prompt) — 75s gives more headroom before either path
# gives up and falls back (assignments: FAILED + retry button; quizzes: stays
# PENDING_GRADING for manual grading).
AI_GRADING_TIMEOUT_SECONDS = int(os.getenv('AI_GRADING_TIMEOUT_SECONDS', 75))

# Quiz question regeneration (quizzes/ai_generation.py) — every attempt after
# a student's first on a given quiz gets a freshly AI-generated question set
# instead of repeating the original bank. One synchronous call for up to
# ~20 questions of structured JSON on the fast AI_CHAT_MODEL, comparable in
# size/latency to a single AI-graded submission — but kept deliberately well
# under nginx's proxy_read_timeout (60s, deploy/nginx/truetrek.conf) rather
# than reusing AI_GRADING_TIMEOUT_SECONDS (75s), which already exceeds that
# ceiling. Uses the "don't retry a slow failure" heuristic (see
# daily_drill/ai_generation.py), not ai_grading.py's "always retry once" —
# that pattern is only safe there because grading's timeout budget is
# separately generous; here it would risk pushing past the proxy ceiling.
AI_QUIZ_REGENERATION_TIMEOUT_SECONDS = int(os.getenv('AI_QUIZ_REGENERATION_TIMEOUT_SECONDS', 40))

# Title/description suggestions for the Add Assignment/Add Quiz modals
# (common/ai_content_suggestions.py) — a live-typing UI call like advisor chat, not a background
# job, so this stays short (15s) rather than reusing the heavier AI_QUIZ_REGENERATION_TIMEOUT_SECONDS.
AI_CONTENT_SUGGESTION_TIMEOUT_SECONDS = int(os.getenv('AI_CONTENT_SUGGESTION_TIMEOUT_SECONDS', 15))

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{asctime} {levelname} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'ai_courses': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Production security hardening (active when DEBUG is False)
if not DEBUG:
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
    CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False') == 'True'
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True

# Approved invitation links expire after three days by default.
INVITATION_EXPIRY_HOURS = int(os.getenv("INVITATION_EXPIRY_HOURS", "72"))
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "10"))
