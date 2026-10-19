"""Attach the six later sheet pathways to their audience cards.

0008/0009/0011 mapped the catalog as it stood when each was written. The
client's "Courses We need to add" sheet has since been transcribed in full,
adding Branding & Marketing, Athlete Life Skills, Parent, Cool Nerds,
Entrepreneur and Coaching. `seeddata` sets their audiences when it first
creates each pathway (`pathways/audience_defaults.py`); this does the same for
a database that already has the rows -- which, because `_reset_catalog` drops
and rebuilds every seeded pathway on each run, mostly means a server seeded
between this migration being written and being applied.

Additive by design -- it only ever calls `.add()`, so an audience an admin has
already attached (or detached) elsewhere is left alone. Keep it in step with
`DEFAULT_PATHWAY_AUDIENCES`: the two are the same mapping for two different
situations, and a migration must not import live app code to share it.
"""

from django.db import migrations

ADDITIONS = {
    "The Branding & Marketing Pathway": [
        "student-athletes",
        "entrepreneurs",
        "coaches",
        "parents",
    ],
    "The Athlete Life Skills & Transition Pathway": [
        "student-athletes",
        "cool-nerds",
        "entrepreneurs",
        "parents",
    ],
    "The Parent Pathway": ["parents", "institutions-academies"],
    "The Cool Nerds Pathway": [
        "cool-nerds",
        "parents",
        "institutions-academies",
        "entrepreneurs",
    ],
    "The Entrepreneur Pathway": [
        "entrepreneurs",
        "student-athletes",
        "cool-nerds",
        "institutions-academies",
    ],
    "The Coaching Pathway": ["coaches", "institutions-academies"],
}


def link_audiences(apps, schema_editor):
    Audience = apps.get_model("pathways", "Audience")
    Pathway = apps.get_model("pathways", "Pathway")
    db = schema_editor.connection.alias

    audiences = {a.slug: a for a in Audience.objects.using(db).all()}
    for name, slugs in ADDITIONS.items():
        rows = [audiences[slug] for slug in slugs if slug in audiences]
        if not rows:
            continue
        # A student's own bundle is never part of the catalog, so it must not
        # pick up an audience here.
        for pathway in Pathway.objects.using(db).filter(name__iexact=name, is_custom=False):
            pathway.audiences.add(*rows)


class Migration(migrations.Migration):
    dependencies = [("pathways", "0011_link_cool_nerds_and_entrepreneurs")]
    # Not reversed: rolling back must not strip audiences an admin has since
    # confirmed or added by hand.
    operations = [migrations.RunPython(link_audiences, migrations.RunPython.noop)]
