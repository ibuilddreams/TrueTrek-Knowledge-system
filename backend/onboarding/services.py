from django.db.models import Q, Sum
from django.db.models.functions import Coalesce

from common.models import Status
from pathways.models import Pathway

from .models import QuestionnaireAnswer


def submit_answers(user, answers):
    """Upserts one QuestionnaireAnswer per question — re-taking the questionnaire
    simply overwrites the previous answer for a given question (unique_together
    on user+question)."""
    saved = []
    for entry in answers:
        answer, _ = QuestionnaireAnswer.objects.update_or_create(
            user=user,
            question=entry["question"],
            defaults={"option": entry["option"]},
        )
        saved.append(answer)
    return saved


def compute_pathway_recommendations(user):
    """Ranks every published pathway by the total weight of the user's answered
    options — pathways with no matching weight still appear (score 0) so the
    user can see and freely choose any pathway, not just the top match."""
    answered_option_ids = QuestionnaireAnswer.objects.filter(user=user).values_list(
        "option_id", flat=True
    )

    return (
        Pathway.objects.filter(status=Status.PUBLISHED)
        .annotate(
            score=Coalesce(
                Sum(
                    "question_weights__weight",
                    filter=Q(question_weights__option_id__in=answered_option_ids),
                ),
                0,
            )
        )
        .order_by("-score", "name")
    )
