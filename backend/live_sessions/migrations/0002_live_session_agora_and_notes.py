"""War Room Live moves onto this platform's own Agora project, and learns to
write itself up.

Three things happen here, and the order of the first two is the whole reason
this migration is written by hand rather than generated:

1. `channel_name` is added **without** its unique constraint, filled in row by
   row, and only then made unique. A generated `AddField` would evaluate the
   callable default once and write the same channel name to every existing
   session, which the unique index then refuses — and the sessions already in
   the database are real ones people RSVP'd to.
2. `meeting_method` gains AGORA and takes it as its default. Rows already
   scheduled on Zoom or X Spaces keep the method they were scheduled with;
   this only decides what the next session is created as.
3. The notes a session can now take on itself — the same local-audio shape
   the live classes use, minus the transcription service and the bucket.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import live_sessions.models


def fill_channel_names(apps, schema_editor):
    """One channel per existing session, assigned individually.

    `update` rather than `save()` so nothing on these rows is touched but the
    column being filled.
    """
    LiveSession = apps.get_model("live_sessions", "LiveSession")
    for pk in LiveSession.objects.values_list("pk", flat=True):
        LiveSession.objects.filter(pk=pk).update(
            channel_name=live_sessions.models.generate_channel_name()
        )


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("live_sessions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="livesession",
            name="channel_name",
            field=models.CharField(default="", max_length=64),
            preserve_default=False,
        ),
        migrations.RunPython(fill_channel_names, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="livesession",
            name="channel_name",
            field=models.CharField(
                default=live_sessions.models.generate_channel_name,
                max_length=64,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name="livesession",
            name="audience_access",
            field=models.CharField(
                choices=[
                    ("LISTEN_ONLY", "Hosts and speakers only"),
                    ("EVERYONE", "Everyone in the room"),
                ],
                default="LISTEN_ONLY",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="livesession",
            name="takes_notes",
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name="livesession",
            name="meeting_method",
            field=models.CharField(
                choices=[
                    ("AGORA", "Cool Nerds Live Audio"),
                    ("ZOOM", "Zoom"),
                    ("GOOGLE_MEET", "Google Meet"),
                    ("TEAMS", "Microsoft Teams"),
                    ("X_SPACES", "X Spaces"),
                    ("DISCORD", "Discord Stage"),
                    ("OTHER", "Other"),
                ],
                default="AGORA",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="sessionrsvp",
            name="role",
            field=models.CharField(
                choices=[("HOST", "Host"), ("AUDIENCE", "Audience")],
                default="AUDIENCE",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="LiveSessionNotes",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("TRANSCRIBING", "Transcribing"),
                            ("PAUSED", "Paused"),
                            ("COLLECTING", "Collecting the audio"),
                            ("SUMMARIZING", "Writing the notes"),
                            ("AVAILABLE", "Available"),
                            ("FAILED", "Failed"),
                        ],
                        default="TRANSCRIBING",
                        max_length=20,
                    ),
                ),
                ("transcript", models.TextField(blank=True, default="")),
                ("title", models.CharField(blank=True, default="", max_length=255)),
                ("summary", models.TextField(blank=True, default="")),
                ("key_topics", models.JSONField(blank=True, default=list)),
                ("important_points", models.JSONField(blank=True, default=list)),
                ("action_items", models.JSONField(blank=True, default=list)),
                ("next_class", models.TextField(blank=True, default="")),
                ("document", models.FileField(blank=True, null=True, upload_to="meeting-notes/")),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("stopped_at", models.DateTimeField(blank=True, null=True)),
                ("duration_seconds", models.PositiveIntegerField(blank=True, null=True)),
                ("notified_at", models.DateTimeField(blank=True, null=True)),
                ("error_message", models.CharField(blank=True, default="", max_length=500)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notes_runs",
                        to="live_sessions.livesession",
                    ),
                ),
                (
                    "started_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="started_live_session_notes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="LiveSessionNotesAudio",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("index", models.PositiveIntegerField()),
                ("client_key", models.CharField(max_length=64)),
                ("file", models.FileField(upload_to="live-session-audio/")),
                ("content_type", models.CharField(blank=True, default="", max_length=100)),
                ("size_bytes", models.PositiveBigIntegerField(default=0)),
                ("duration_seconds", models.PositiveIntegerField(blank=True, null=True)),
                ("speakers", models.JSONField(blank=True, default=list)),
                ("transcript", models.TextField(blank=True, default="")),
                ("transcribed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "notes",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="audio_segments",
                        to="live_sessions.livesessionnotes",
                    ),
                ),
            ],
            options={"ordering": ["index"]},
        ),
        migrations.AddIndex(
            model_name="livesessionnotes",
            index=models.Index(fields=["session", "status"], name="live_sessio_session_799be5_idx"),
        ),
        migrations.AddIndex(
            model_name="livesessionnotes",
            index=models.Index(fields=["status", "created_at"], name="live_sessio_status_192d62_idx"),
        ),
        migrations.AddConstraint(
            model_name="livesessionnotes",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("status__in", ["TRANSCRIBING", "PAUSED", "COLLECTING", "SUMMARIZING"])
                ),
                fields=("session",),
                name="one_in_flight_notes_run_per_live_session",
            ),
        ),
        migrations.AddConstraint(
            model_name="livesessionnotesaudio",
            constraint=models.UniqueConstraint(
                fields=("notes", "index"), name="one_audio_segment_per_index_per_live_run"
            ),
        ),
        migrations.AddConstraint(
            model_name="livesessionnotesaudio",
            constraint=models.UniqueConstraint(
                fields=("notes", "client_key"),
                name="one_audio_segment_per_client_key_per_live_run",
            ),
        ),
    ]
