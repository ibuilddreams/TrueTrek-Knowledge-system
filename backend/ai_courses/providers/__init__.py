from django.conf import settings

from .base import ProviderError
from .custom_llm import CustomLLMProvider
from .gemini import GeminiProvider


def get_provider(model=None):
    """Returns the configured AIProvider instance. The provider is chosen entirely
    by settings.AI_PROVIDER — shared by every app that needs a prompt-based AI call
    (advisor chat, quiz/assignment AI grading, AI content suggestions, daily drill)
    so none of them hardcode a concrete provider class.

    `model` lets a caller override settings.AI_MODEL — e.g. advisor/services.py
    uses a faster, non-"thinking" model for live chat.

    Note: full-course generation does NOT come through here any more — see
    get_course_provider() below."""
    provider_name = settings.AI_PROVIDER
    if provider_name == "gemini":
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model=model or settings.AI_MODEL)
    raise ProviderError(f"Unknown AI_PROVIDER '{provider_name}' — no provider implementation registered.")


def get_course_provider():
    """Returns the provider used for full-course generation (ai_courses).

    Deliberately separate from get_provider(): our own service is a job API
    (submit -> follow -> read), not a prompt API, so it cannot satisfy the
    AIProvider.generate_course(prompt, response_schema, ...) contract the other
    callers rely on. Keeping the two factories apart is what lets course
    generation move to our LLM without touching advisor chat, AI grading, content
    suggestions or the daily drill, which all still run on Gemini.

    To put course generation back on Gemini, restore the commented-out branch
    below and the commented-out Gemini path in ai_courses/services.py — the
    prompt (ai_courses/prompts/course.py) and its response schema are kept intact
    for exactly that.
    """

    # --- Gemini course generation (replaced by our own LLM) -------------------
    # if settings.AI_PROVIDER == "gemini":
    #     return get_provider()
    # -------------------------------------------------------------------------

    # No arguments: the service is unauthenticated and reads its address from
    # settings.AI_COURSE_SERVICE_URL, with every other knob a documented constant
    # in providers/custom_llm.py. There is nothing to configure per environment.
    return CustomLLMProvider()
