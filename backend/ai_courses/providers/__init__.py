from django.conf import settings

from .base import ProviderError
from .gemini import GeminiProvider


def get_provider(model=None):
    """Returns the configured AIProvider instance. The provider is chosen entirely
    by settings.AI_PROVIDER — shared by every app that needs an AI call (ai_courses,
    advisor) so none of them hardcode a concrete provider class.

    `model` lets a caller override settings.AI_MODEL — e.g. advisor/services.py
    uses a faster, non-"thinking" model for live chat than the one ai_courses
    uses for course generation, where slower/deeper reasoning is worth the wait."""
    provider_name = settings.AI_PROVIDER
    if provider_name == "gemini":
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model=model or settings.AI_MODEL)
    raise ProviderError(f"Unknown AI_PROVIDER '{provider_name}' — no provider implementation registered.")
