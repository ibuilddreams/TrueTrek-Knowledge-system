import requests

from .base import (
    AIProvider,
    ProviderError,
    ProviderQuotaError,
    ProviderResult,
    ProviderTransportError,
)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _parse_retry_delay(value):
    """Google's RetryInfo sends a protobuf duration string like "49225s"."""
    if not isinstance(value, str) or not value.endswith("s"):
        return None
    try:
        return float(value[:-1])
    except ValueError:
        return None


def _describe_error(response):
    """Returns (message, retry_after_seconds) for an error response.

    Google's error bodies are deeply nested JSON whose `message` carries several
    sentences, doc URLs and an embedded quota dump. Putting that raw text in front
    of an admin (it ended up rendered verbatim in the generation modal) is what
    this avoids: take the first sentence, which is the actual reason, and read the
    retry hint from the structured `details` rather than parsing it back out of
    prose.
    """
    try:
        error = response.json().get("error") or {}
    except ValueError:
        error = {}
    if not isinstance(error, dict):
        error = {}

    message = str(error.get("message") or "").strip()
    retry_after = None
    for detail in error.get("details") or []:
        if isinstance(detail, dict) and str(detail.get("@type", "")).endswith("RetryInfo"):
            retry_after = _parse_retry_delay(detail.get("retryDelay"))

    # First sentence only — the rest is links and a metric dump.
    first_sentence = message.split("\n")[0].split(". ")[0].strip().rstrip(".")
    if first_sentence:
        message = f"{first_sentence}."
    else:
        message = (response.text or "").strip()[:200] or "no details given"

    return message, retry_after


class GeminiProvider(AIProvider):
    """Calls Gemini's REST endpoint directly via `requests` (already vendored) rather
    than adding the `google-genai` SDK as a new dependency — the recommended v1 path
    per plan §5. Swapping to the SDK, or to a different provider entirely, only means
    writing a new class here; nothing else in ai_courses depends on this file."""

    def __init__(self, api_key, model):
        if not api_key:
            raise ProviderError(
                "GEMINI_API_KEY is not configured. Set it in the environment before "
                "using AI course generation — there is no offline/placeholder mode."
            )
        self.api_key = api_key
        self.model = model

    def generate_course(self, prompt, response_schema, timeout, files=None):
        parts = [{"text": prompt}]
        for file in files or []:
            parts.append(
                {"inlineData": {"mimeType": file["mime_type"], "data": file["data_base64"]}}
            )
        body = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": response_schema,
            },
        }
        return self._call(body, timeout)

    def generate_text(self, prompt, system_instruction, timeout, temperature=0.7):
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {"temperature": temperature},
        }
        return self._call(body, timeout)

    def _call(self, body, timeout):
        url = f"{GEMINI_API_BASE}/models/{self.model}:generateContent"

        try:
            response = requests.post(
                url,
                params={"key": self.api_key},
                json=body,
                timeout=timeout,
            )
        except requests.RequestException as exc:
            raise ProviderTransportError(f"Gemini request failed: {exc}") from exc

        if response.status_code >= 500:
            raise ProviderTransportError(
                f"Gemini returned a server error ({response.status_code})."
            )
        if response.status_code == 429:
            message, retry_after = _describe_error(response)
            raise ProviderQuotaError(message, retry_after_seconds=retry_after, model=self.model)
        if response.status_code >= 400:
            message, _ = _describe_error(response)
            raise ProviderError(f"Gemini rejected the request ({response.status_code}): {message}")

        try:
            data = response.json()
        except ValueError as exc:
            raise ProviderError(f"Gemini returned a non-JSON response: {exc}") from exc

        try:
            candidates = data["candidates"]
            text = candidates[0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            raise ProviderError(
                f"Gemini response did not contain the expected candidate shape: {data}"
            ) from exc

        usage = data.get("usageMetadata", {})
        return ProviderResult(
            text=text,
            input_tokens=usage.get("promptTokenCount"),
            output_tokens=usage.get("candidatesTokenCount"),
        )
