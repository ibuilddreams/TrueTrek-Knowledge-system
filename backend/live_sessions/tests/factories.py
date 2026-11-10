"""Shared fixtures for the War Room Live tests.

Kept together so the two halves of the feature — the room and the notes it
takes on itself — build their sessions the same way, and so the one thing a
test is always explicit about is the thing it is testing: whether the session
runs here or on somebody else's link.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from ..models import LiveSession, SessionSpeaker

UserModel = get_user_model()


def make_user(username, role=None):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        name=username.title(),
        role=role or UserModel.Roles.STUDENT,
        gender=UserModel.Gender.MALE,
    )


def make_speaker(name="Maya Torres", headline="D1 Track & Field — LSU"):
    return SessionSpeaker.objects.create(name=name, headline=headline)


def make_session(*, starts_in_minutes=-10, duration=60, **kwargs):
    """A War Room Live session hosted on this platform.

    Live right now by default — started ten minutes ago, running for an hour
    — because almost everything about a room is only true while it is open.
    """
    kwargs.setdefault("title", "Landing Your First Local Sponsor")
    kwargs.setdefault("topic", "Sponsorship")
    kwargs.setdefault("meeting_method", LiveSession.MeetingMethod.AGORA)
    return LiveSession.objects.create(
        scheduled_at=timezone.now() + timedelta(minutes=starts_in_minutes),
        duration_minutes=duration,
        **kwargs,
    )
