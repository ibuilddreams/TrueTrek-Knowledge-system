from django.db import migrations


def backfill_attachment_order(apps, schema_editor):
    AssignmentAttachment = apps.get_model("assignments", "AssignmentAttachment")
    assignment_ids = (
        AssignmentAttachment.objects.values_list("assignment_id", flat=True).distinct()
    )
    for assignment_id in assignment_ids:
        attachments = AssignmentAttachment.objects.filter(assignment_id=assignment_id).order_by("id")
        for index, attachment in enumerate(attachments):
            attachment.order = index + 1
            attachment.save(update_fields=["order"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0003_alter_assignmentattachment_options_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_attachment_order, noop),
    ]
