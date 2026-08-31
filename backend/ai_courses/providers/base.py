from dataclasses import dataclass


class ProviderTransportError(Exception):
    """Network-level failure (timeout, connection reset, 5xx) — safe to retry once.
    Never raised for a malformed/invalid response body; that is a permanent failure
    and retrying it would just bill the same broken request twice."""


class ProviderError(Exception):
    """Any other provider failure (bad key, bad request, quota exceeded). Not retried."""


@dataclass
class ProviderResult:
    text: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class AIProvider:
    """Interface every provider (Gemini today, OpenAI/Claude later) implements.
    Callers only ever depend on this interface — see ai_courses.services — so the
    provider is chosen entirely by settings.AI_PROVIDER, never hardcoded at a call
    site."""

    def generate_course(self, prompt, response_schema, timeout):
        """Returns a ProviderResult whose .text is the raw JSON string produced by
        the model. Raises ProviderTransportError for a retryable transport failure,
        ProviderError for anything else."""
        raise NotImplementedError

    def generate_text(self, prompt, system_instruction, timeout, temperature=0.7):
        """Returns a ProviderResult whose .text is a plain Markdown/text reply for a
        single free-form turn (no response schema/JSON mode). Same
        ProviderTransportError/ProviderError contract as generate_course."""
        raise NotImplementedError
