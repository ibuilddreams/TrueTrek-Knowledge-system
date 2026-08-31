import logging
import time

from django.conf import settings

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderTransportError

logger = logging.getLogger("advisor")

# Live chat, not a background job — the user is staring at a spinner. Combined
# with settings.AI_CHAT_MODEL (a fast, non-"thinking" model measured at ~3s for
# a chat-sized prompt, vs. 10-20s+ for AI_MODEL's reasoning overhead), 15s is a
# generous ceiling rather than the expected wait.
CHAT_TIMEOUT_SECONDS = 15
CHAT_TEMPERATURE = 0.75

# A transport failure that comes back almost instantly (DNS hiccup, connection
# reset) is worth one quick retry. One that consumes the *entire* timeout means
# Gemini itself is just slow right now — retrying with the same timeout would
# only double the user's wait for a likely-identical outcome, so that case
# fails fast instead (see the elapsed-time check below).
SLOW_FAILURE_THRESHOLD_SECONDS = CHAT_TIMEOUT_SECONDS * 0.75
TRANSPORT_RETRY_BACKOFF_SECONDS = 1

# Mirrors the formatting instruction the old frontend/src/app/api/advisor
# Next.js route used to append to every request, kept so response style is
# unchanged now that the call has moved server-side to Django.
_SHARED_FORMATTING_INSTRUCTION = (
    "\nAlways format your responses inside beautiful, highly professional Markdown "
    "with headings, bold takeaways, and actionable bullet points. Avoid clinical "
    "jargon and be incredibly precise."
)


class AdvisorReplyError(Exception):
    """Raised when the provider could not produce a reply. The message is safe to
    show directly to the caller."""


def get_advisor_reply(scenario, systemPrompt, advisorName=""):
    system_instruction = f"{systemPrompt}{_SHARED_FORMATTING_INSTRUCTION}"
    provider = get_provider(model=settings.AI_CHAT_MODEL)

    start = time.monotonic()
    try:
        result = provider.generate_text(
            scenario, system_instruction, timeout=CHAT_TIMEOUT_SECONDS, temperature=CHAT_TEMPERATURE
        )
    except ProviderTransportError as exc:
        elapsed = time.monotonic() - start
        if elapsed >= SLOW_FAILURE_THRESHOLD_SECONDS:
            logger.warning("Advisor chat timed out after %.1fs — not retrying (provider is slow).", elapsed)
            raise AdvisorReplyError(
                "The advisory desk is responding slowly right now. Please try again in a moment."
            ) from exc

        logger.warning("Advisor chat transport error after %.1fs — retrying once.", elapsed)
        time.sleep(TRANSPORT_RETRY_BACKOFF_SECONDS)
        try:
            result = provider.generate_text(
                scenario, system_instruction, timeout=CHAT_TIMEOUT_SECONDS, temperature=CHAT_TEMPERATURE
            )
        except (ProviderTransportError, ProviderError) as retry_exc:
            logger.error("Advisor chat provider error after retry: %s", retry_exc)
            raise AdvisorReplyError(
                "Unable to reach the advisory desk right now. Please try again in a moment."
            ) from retry_exc
    except ProviderError as exc:
        logger.error("Advisor chat provider error: %s", exc)
        raise AdvisorReplyError(
            "The advisory desk could not process that request. Please try again."
        ) from exc

    return {"advice": result.text}
