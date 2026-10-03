"""
Django settings for eld_trip_planner_backend project.

Production-safe: all secrets/toggles read from environment variables.
Local dev works out of the box (sane defaults); production requires
SECRET_KEY to be set explicitly via env.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


# --- Core ---
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-5)klgu+1(o=9937$=ryl-bfjpj%_c^e0g4)iuc&7a)cg3fmw4&'  # dev-only fallback
)
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('1', 'true', 'yes', 'on')

# ALLOWED_HOSTS: comma-separated list from env, defaults for local dev
_DEFAULT_HOSTS = 'localhost,127.0.0.1,0.0.0.0'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', _DEFAULT_HOSTS).split(',')
# Render auto-sets RENDER_EXTERNAL_HOSTNAME — append it automatically
_render_host = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if _render_host:
    ALLOWED_HOSTS.append(_render_host)


# --- CORS (frontend origins allowed to call this API) ---
# Comma-separated list of allowed origins in production.
def _clean_origins(raw: str) -> list:
    """Strip whitespace and trailing slashes; drop empties. CORS origins
    must be bare scheme+host (no path, no trailing /)."""
    out = []
    for o in raw.split(','):
        o = o.strip().rstrip('/').strip()
        if o:
            out.append(o)
    return out

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = _clean_origins(
        os.environ.get('CORS_ALLOWED_ORIGINS', 'https://eld-trip-planner.vercel.app')
    )
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r'^https://.*\.vercel\.app$',
    ]
CORS_ALLOW_CREDENTIALS = True


# --- Applications ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'trips',
    'hos',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',   # static files in prod
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'eld_trip_planner_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'eld_trip_planner_backend.wsgi.application'


# --- Database ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# --- Auth ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# --- I18N ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Chicago'
USE_I18N = True
USE_TZ = True


# --- Static files ---
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'   # collectstatic target
STORAGES = {
    'default': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'
                   if DEBUG else 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}


# --- REST Framework ---
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': None,
}


# --- HOS / OSRM constants ---
OSRM_BASE_URL = os.environ.get('OSRM_BASE_URL', 'https://router.project-osrm.org')
NOMINATIM_BASE_URL = os.environ.get('NOMINATIM_BASE_URL', 'https://nominatim.openstreetmap.org')


# --- Email (dev only; prod should set EMAIL_BACKEND via env) ---
MAILERS = {
    'default': {'BACKEND': 'django.core.mail.backends.console.EmailBackend'},
}
