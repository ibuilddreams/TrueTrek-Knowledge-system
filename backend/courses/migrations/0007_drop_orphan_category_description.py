"""Drop the leftover courses_category.description column.

A migration named 0003_add_category_description_column added this column on some
databases and was later deleted from the repository, while 0003_remove_category_description
removed the field from Django's model state. Databases that applied the deleted
migration keep a NOT NULL column Django no longer knows about, so every Category
insert fails. This runs at the database level only; model state already has no field.
"""

from django.db import migrations

TABLE = "courses_category"
COLUMN = "description"


def drop_orphan_column(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, TABLE)
        }

    if COLUMN not in columns:
        return

    schema_editor.execute(
        "ALTER TABLE %s DROP COLUMN %s"
        % (schema_editor.quote_name(TABLE), schema_editor.quote_name(COLUMN))
    )


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0006_merge_0005_course_amount_and_0005_merge"),
    ]

    operations = [
        migrations.RunPython(drop_orphan_column, migrations.RunPython.noop),
    ]
