"""Shared fixtures for the wargamer tests."""

from django.contrib.auth import get_user_model

from ..models import RolePlayScenario

UserModel = get_user_model()


def make_user(username, role=None):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role or UserModel.Roles.STUDENT,
        gender=UserModel.Gender.MALE,
    )


def make_scenario(code="LS-302-S1", **overrides):
    defaults = {
        "title": 'The Financial "Investment"',
        "relationship": RolePlayScenario.Relationship.FAMILY,
        "pressure_type": RolePlayScenario.PressureType.FINANCIAL,
        "key_skill": "Financial boundaries",
        "counterpart_role": "Your older cousin",
        "setup": "A cousin asks you to invest $10,000 in their business.",
        "opening_message": "I just need $10k to get the first inventory order.",
        "exercise": "Decline without insulting them.",
        "ideal_acknowledge": "I appreciate you bringing this to me.",
        "ideal_boundary": "I have a rule about private investments.",
        "ideal_pivot": "Send me the link and I'll share it.",
        "points_reward": 50,
    }
    defaults.update(overrides)
    return RolePlayScenario.objects.create(code=code, **defaults)


TURN_PAYLOAD = {
    "reply": "After everything I did for you, you can't even look at the numbers?",
    "conceded": False,
    "pressure_level": 4,
}

EVALUATION_PAYLOAD = {
    "time_to_boundary_score": 80,
    "time_to_boundary_note": "You refused in your first message.",
    "tone_control_score": 70,
    "tone_control_note": "Steady, slightly apologetic at the end.",
    "deflection_to_policy_score": 90,
    "deflection_to_policy_note": "You pointed at a rule you already keep.",
    "boundary_turn": 1,
    "verdict": "Held the line",
    "summary": "You said no early and stayed warm.",
    "strengths": [{"title": "Clear refusal", "detail": "No hedging."}],
    "improvements": [{"title": "Stop apologising", "detail": "You said sorry three times."}],
    "suggested_response": "I appreciate you asking. I don't invest outside my plan. Send me the link.",
    "used_fabricated_excuse": False,
}
