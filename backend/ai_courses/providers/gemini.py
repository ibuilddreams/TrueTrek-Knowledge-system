import requests

from .base import AIProvider, ProviderError, ProviderResult, ProviderTransportError

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


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

    def generate_course(self, prompt, response_schema, timeout):
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
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
        if response.status_code >= 400:
            raise ProviderError(
                f"Gemini rejected the request ({response.status_code}): {response.text[:500]}"
            )

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
