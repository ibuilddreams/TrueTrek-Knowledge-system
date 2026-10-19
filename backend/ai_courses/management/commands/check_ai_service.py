"""Smoke-check the self-hosted course-generation LLM service.

Why this exists: `ai_courses/custom_llm_mapping.py` has to read a response schema
this repo does not own and cannot pin. This command points the real mapping code
at the real service and prints what it managed to read, so a field this
integration guessed wrong is a one-line diff in the mapping rather than a
mysteriously empty course.

    python manage.py check_ai_service                 # config + reachability only
    python manage.py check_ai_service --job-id <id>   # read an existing job, report the mapping
    python manage.py check_ai_service --generate      # submit a tiny course, follow it, report

Nothing here writes a Course or an AICourseGeneration row — it stops after
validation and prints. `--generate` does spend one real generation on the
service.
"""

import json

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from courses.models import Category

from ...custom_llm_mapping import adapt_job_result, build_request_payload
from ...providers import custom_llm, get_course_provider
from ...providers.base import ProviderError, ProviderTransportError
from ...validators import PlanValidationError, validate_and_repair

UserModel = get_user_model()


class Command(BaseCommand):
    help = "Check the custom LLM course-generation service and how its output maps onto a course."

    def add_arguments(self, parser):
        parser.add_argument("--job-id", help="Read an existing service job instead of generating.")
        parser.add_argument(
            "--generate",
            action="store_true",
            help="Submit a real (small) generation and follow it to completion.",
        )
        parser.add_argument(
            "--title", default="Integration Smoke Test", help="Title used with --generate."
        )
        parser.add_argument(
            "--raw", action="store_true", help="Also print the service's full job body."
        )

    def handle(self, *args, **options):
        self._report_config()

        provider = self._provider()
        self._report_health(provider)
        job_id = options["job_id"]

        if options["generate"]:
            job_id = self._generate(provider, options["title"])
        elif not job_id:
            self.stdout.write(
                "\nNo --job-id and no --generate: configuration looks readable, but nothing "
                "was fetched.\nRun again with --generate to exercise the whole path."
            )
            return

        job_body = self._fetch(provider, job_id)

        if options["raw"]:
            self.stdout.write("\n--- raw job body ---")
            self.stdout.write(json.dumps(job_body, indent=2, default=str)[:20000])

        self._report_mapping(job_body)

    # -- steps --------------------------------------------------------------

    def _report_config(self):
        self.stdout.write("--- service ---")
        self.stdout.write(f"url          {settings.AI_COURSE_SERVICE_URL or '(empty)'}")
        self.stdout.write("auth         none (the service is unauthenticated)")
        self.stdout.write(f"job timeout  {custom_llm.JOB_TIMEOUT_SECONDS}s")
        self.stdout.write(f"rag_enabled  {custom_llm.RAG_ENABLED}")

    def _report_health(self, provider):
        """The service exposes /health (outside /api/v1). Worth printing first:
        most "generation failed" reports turn out to be ollama or qdrant down,
        which this answers in one line instead of a full generation."""

        try:
            response = provider.session.request(
                "GET",
                f"{provider.base_url}/health",
                timeout=(provider.connect_timeout, provider.request_timeout),
            )
            body = response.json()
        except Exception as exc:  # noqa: BLE001 — a probe must never mask the real run
            self.stdout.write(self.style.WARNING(f"\nhealth       unreachable ({exc})"))
            return

        data = body.get("data") if isinstance(body, dict) else None
        if not isinstance(data, dict):
            self.stdout.write(f"\nhealth       {str(body)[:200]}")
            return

        services = data.get("services") or {}
        rendered = ", ".join(f"{name}={state}" for name, state in services.items())
        unhealthy = [name for name, state in services.items() if str(state).lower() != "ok"]
        style = self.style.ERROR if unhealthy else self.style.SUCCESS
        self.stdout.write(style(f"\nhealth       {rendered or 'no services reported'}"))
        self.stdout.write(f"model        {data.get('generation_model') or '(not reported)'}")
        self.stdout.write(f"concurrency  {data.get('max_concurrency')} job(s) at a time")

    def _provider(self):
        try:
            return get_course_provider()
        except ProviderError as exc:
            raise CommandError(str(exc)) from exc

    def _generate(self, provider, title):
        category = Category.objects.order_by("id").first()
        instructor = UserModel.objects.filter(role=UserModel.Roles.TEACHER).order_by("id").first()
        if category is None or instructor is None:
            raise CommandError(
                "--generate needs at least one Category and one teacher account to build a "
                "realistic request. Seed the database first (python manage.py seeddata)."
            )

        form_payload = {
            "title": title,
            "description": "A deliberately tiny course used to check the integration.",
            "category": category,
            "difficulty": "BEGINNER",
            "instructors": [instructor],
            "amount": "0",
            "target_audience": "",
            "objectives": [],
            "tier": None,
            "modules_count": 1,
            "lessons_per_module": 1,
            "include_quizzes": True,
            "questions_per_quiz": 2,
            "include_assignments": True,
            "ai_grading": True,
            "weeks_between_modules": 2,
            "additional_instructions": "",
        }
        request_payload = build_request_payload(
            form_payload, rag_enabled=custom_llm.RAG_ENABLED
        )

        self.stdout.write("\n--- request ---")
        self.stdout.write(json.dumps(request_payload, indent=2))

        try:
            job_id = provider.submit_course_job(request_payload)
        except (ProviderTransportError, ProviderError) as exc:
            raise CommandError(f"Submitting the generation failed: {exc}") from exc

        self.stdout.write(self.style.SUCCESS(f"\nAccepted as job {job_id}. Following progress..."))

        def on_event(event):
            self.stdout.write(
                f"  [{event.status or '...'}] "
                f"{'' if event.progress is None else f'{event.progress:.0f}% '}"
                f"{event.label}"
            )

        try:
            provider.await_course_job(job_id, on_event=on_event)
        except (ProviderTransportError, ProviderError) as exc:
            raise CommandError(f"The generation did not complete: {exc}") from exc

        return job_id

    def _fetch(self, provider, job_id):
        try:
            return provider.fetch_job(job_id)
        except (ProviderTransportError, ProviderError) as exc:
            raise CommandError(f"Reading job {job_id} failed: {exc}") from exc

    def _report_mapping(self, job_body):
        warnings = []
        plan = adapt_job_result(job_body, warnings)

        self.stdout.write("\n--- what the mapping read ---")
        self.stdout.write(f"summary            {'yes' if plan['summary'] else 'MISSING'}")
        self.stdout.write(f"objectives         {len(plan['objectives'])}")
        self.stdout.write(f"learning_outcomes  {len(plan['learning_outcomes'])}")
        self.stdout.write(f"modules            {len(plan['modules'])}")

        for index, module in enumerate(plan["modules"], start=1):
            kinds = [item.get("kind") for item in module["items"]]
            questions = sum(
                len(item.get("questions") or []) for item in module["items"] if item.get("kind") == "quiz"
            )
            empty_lessons = sum(
                1
                for item in module["items"]
                if item.get("kind") == "lesson" and not item.get("body")
            )
            self.stdout.write(
                f"  {index}. {module['title'][:50]!r}: "
                f"{kinds.count('lesson')} lesson(s), {kinds.count('quiz')} quiz "
                f"({questions} question(s)), {kinds.count('assignment')} assignment(s)"
                + (f"  [{empty_lessons} lesson(s) with NO body]" if empty_lessons else "")
            )

        if warnings:
            self.stdout.write("\n--- mapping warnings ---")
            for warning in warnings:
                self.stdout.write(f"  - {warning}")

        # The same validation a real generation runs, so a shape that maps but
        # cannot survive repair is visible here too.
        form_payload = {
            "modules_count": max(len(plan["modules"]), 1),
            "lessons_per_module": settings.AI_MAX_LESSONS,
            "include_quizzes": True,
            "questions_per_quiz": 20,
            "include_assignments": True,
            "objectives": plan["objectives"],
        }
        try:
            normalized, repair_warnings = validate_and_repair(
                json.dumps(plan), form_payload, settings.AI_MAX_MODULES
            )
        except PlanValidationError as exc:
            self.stdout.write(
                self.style.ERROR(f"\nValidation would REJECT this response: {exc}")
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"\nValidation accepts it: {len(normalized['modules'])} module(s) would be written."
            )
        )
        if repair_warnings:
            self.stdout.write("Repairs that would be recorded on the draft course:")
            for warning in repair_warnings:
                self.stdout.write(f"  - {warning}")
