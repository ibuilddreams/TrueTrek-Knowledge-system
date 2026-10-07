"""Seed the audience cards and map the pathways that already existed.

The same mapping lives in `pathways/audience_defaults.py` for pathways that
`seeddata` creates from scratch. Keeping a copy here is deliberate — a
migration must not import live app code, which is free to change under it.
"""

from django.db import migrations


def seed_audiences(apps, schema_editor):
    Audience = apps.get_model("pathways", "Audience")
    Pathway = apps.get_model("pathways", "Pathway")
    db = schema_editor.connection.alias
    definitions = [
        ("student-athletes", "Student Athletes"),
        ("cool-nerds", "Cool Nerds"),
        ("parents", "Parents"),
        ("institutions-academies", "Institutions & Academies"),
        ("coaches", "Coaches"),
        ("entrepreneurs", "Entrepreneurs"),
    ]
    audiences = {
        slug: Audience.objects.using(db).get_or_create(
            slug=slug, defaults={"name": name, "order": order}
        )[0]
        for order, (slug, name) in enumerate(definitions)
    }
    # Only unqualified examples from the 6 October review. Conditional examples
    # (International Student for athletes, recruiting for coaches, business for
    # some athletes) and the two unmapped pathways await an admin decision.
    mappings = {
        "Elite Athlete Business Pathway": ["student-athletes"],
        "Athletic Recruiting Readiness Pathway": ["student-athletes"],
        "Athlete / Sports Pathway": ["student-athletes", "coaches"],
        "Education / Academic Pathway": ["cool-nerds"],
        "Ivy League-Oriented Pathway": ["cool-nerds"],
        "Business Pathway": ["cool-nerds", "entrepreneurs"],
        "Parent / Homeschool Pathway": ["parents"],
        "Trade & Vocational Skills Pathway": ["entrepreneurs"],
    }
    for name, slugs in mappings.items():
        for pathway in Pathway.objects.using(db).filter(name__iexact=name):
            pathway.audiences.add(*(audiences[slug] for slug in slugs))


class Migration(migrations.Migration):
    dependencies = [("pathways", "0007_audience_relations")]
    # Do not remove later admin assignments on rollback.
    operations = [migrations.RunPython(seed_audiences, migrations.RunPython.noop)]
