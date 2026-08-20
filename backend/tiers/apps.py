from django.apps import AppConfig


class TiersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tiers'

    def ready(self):
        from . import signals  # noqa: F401
