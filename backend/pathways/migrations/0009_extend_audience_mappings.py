"""Bring every audience card up to three pathways.

0008 mapped only the unqualified examples from the 6 October 2026 review, which
left Parents and Coaches on one pathway each, Institutions & Academies on none,
and three pathways unassigned. This adds the rest, following the same review:
a pathway may serve several audiences, so these are additions, never moves.

Additive by design — it only ever calls `.add()`, so an audience an admin has
already attached (or detached) elsewhere is left alone.
"""

from django.db import migrations

# Audiences to add to each pathway, on top of whatever 0008 set.
ADDITIONS = {
    # "athlete recruiting readiness -> Student Athletes and potentially Coaches"
    "Athletic Recruiting Readiness Pathway": ["coaches"],
    # Core academics: what a parent teaches at home and what an academy
    # licenses for a cohort, as well as the Cool Nerds track 0008 set.
    "Education / Academic Pathway": ["parents", "institutions-academies"],
    "Ivy League-Oriented Pathway": ["institutions-academies"],
    # Eligibility rules and transcript strategy for 8th-10th graders — the
    # review put this with Parents and Coaches alike.
    "The Blueprint": ["parents", "coaches"],
    "Strategic Analytics Pathway": ["entrepreneurs"],
    "International Student Pathway": ["institutions-academies"],
}


def extend_audiences(apps, schema_editor):
    Audience = apps.get_model("pathways", "Audience")
    Pathway = apps.get_model("pathways", "Pathway")
    db = schema_editor.connection.alias

    audiences = {a.slug: a for a in Audience.objects.using(db).all()}
    for name, slugs in ADDITIONS.items():
        rows = [audiences[slug] for slug in slugs if slug in audiences]
        if not rows:
            continue
        for pathway in Pathway.objects.using(db).filter(name__iexact=name):
            pathway.audiences.add(*rows)


class Migration(migrations.Migration):
    dependencies = [("pathways", "0008_seed_audience_mappings")]
    # Not reversed: rolling back must not strip audiences an admin has since
    # confirmed or added by hand.
    operations = [migrations.RunPython(extend_audiences, migrations.RunPython.noop)]
