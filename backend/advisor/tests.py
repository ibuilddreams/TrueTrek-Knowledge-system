from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.urls import reverse

from ai_courses.providers.base import ProviderError, ProviderResult, ProviderTransportError


class AdvisorChatViewTests(TestCase):
    def setUp(self):
        self.url = reverse("advisor-chat")

    def _post(self, **overrides):
        payload = {
            "scenario": "How do I get recruited?",
            "systemPrompt": "You are Coach Vance Miller, a tough D1 recruiter.",
            "advisorName": "Coach Vance Miller",
        }
        payload.update(overrides)
        return self.client.post(self.url, data=payload, content_type="application/json")

    def test_public_access_no_auth_required(self):
        with patch("advisor.services.get_provider") as mock_get_provider:
            mock_get_provider.return_value.generate_text.return_value = ProviderResult(text="### Hi\n\nAdvice.")
            response = self._post()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["advice"], "### Hi\n\nAdvice.")

    def test_advisor_name_is_optional(self):
        with patch("advisor.services.get_provider") as mock_get_provider:
            mock_get_provider.return_value.generate_text.return_value = ProviderResult(text="ok")
            response = self._post(advisorName="")

        self.assertEqual(response.status_code, 200)

    def test_rejects_blank_scenario(self):
        response = self._post(scenario="   ")
        self.assertEqual(response.status_code, 400)

    def test_rejects_blank_system_prompt(self):
        response = self._post(systemPrompt="")
        self.assertEqual(response.status_code, 400)

    def test_rejects_oversized_scenario(self):
        response = self._post(scenario="x" * 5000)
        self.assertEqual(response.status_code, 400)

    def test_provider_error_returns_502_with_safe_message(self):
        with patch("advisor.services.get_provider") as mock_get_provider:
            mock_get_provider.return_value.generate_text.side_effect = ProviderError("bad key")
            response = self._post()

        self.assertEqual(response.status_code, 502)
        self.assertNotIn("bad key", response.json()["message"])

    def test_transport_error_retries_once_then_succeeds(self):
        provider = MagicMock()
        provider.generate_text.side_effect = [
            ProviderTransportError("timeout"),
            ProviderResult(text="Recovered."),
        ]
        with patch("advisor.services.get_provider", return_value=provider), patch("advisor.services.time.sleep"):
            response = self._post()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["advice"], "Recovered.")
        self.assertEqual(provider.generate_text.call_count, 2)

    def test_slow_timeout_fails_fast_without_retry(self):
        """A transport failure that consumed the full timeout means Gemini itself
        is slow, not a network blip — retrying would just double the wait for a
        likely-identical outcome, so this must not retry."""
        provider = MagicMock()
        provider.generate_text.side_effect = ProviderTransportError("Read timed out")
        with (
            patch("advisor.services.get_provider", return_value=provider),
            patch("advisor.services.time.monotonic", side_effect=[0, 20]),
        ):
            response = self._post()

        self.assertEqual(response.status_code, 502)
        self.assertIn("slowly", response.json()["message"])
        self.assertEqual(provider.generate_text.call_count, 1)

    def test_system_prompt_forwarded_with_shared_formatting_instruction(self):
        with patch("advisor.services.get_provider") as mock_get_provider:
            mock_get_provider.return_value.generate_text.return_value = ProviderResult(text="ok")
            self._post(systemPrompt="You are Amanda Ross, Esq.")

        call_args = mock_get_provider.return_value.generate_text.call_args
        scenario_arg, system_instruction_arg = call_args.args[0], call_args.args[1]
        self.assertEqual(scenario_arg, "How do I get recruited?")
        self.assertIn("You are Amanda Ross, Esq.", system_instruction_arg)
        self.assertIn("Markdown", system_instruction_arg)
