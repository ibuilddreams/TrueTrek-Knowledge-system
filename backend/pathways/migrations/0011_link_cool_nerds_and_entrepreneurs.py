"""Give the Cool Nerds and Entrepreneurs cards pathways to lead to.

0008 and 0009 mapped the Numa demo catalog, which went away with the client's
athlete-only "Courses We need to add" sheet. That left both cards leading
nowhere, against the 6 October 2026 review's ask that every audience card lead
somewhere. This maps the three current pathways onto them by the subject each
card advertises -- see the reasoning in `pathways/audience_defaults.py`, which
holds the same mapping for pathways `seeddata` creates from scratch.

Additive by design — it only ever calls `.add()`, so an audience an admin has
already attached (or detached) elsewhere is left alone.
"""

from django.db import migrations

# Audiences to add to each pathway, on top of whatever 0008/0009 and `seeddata`
# have already set.
ADDITIONS = {
    # Governance and OKRs, NIL contracts, tax and wealth preservation, deal
    # structuring, the post-athletic venture transition: the business
    # curriculum, and the financial-literacy clause of the Cool Nerds card.
    "The Athlete CEO Pathway": ["entrepreneurs", "cool-nerds"],
    # NCAA academic eligibility, a data-driven target list and offer math —
    # the critical-thinking/decision-making clause.
    "The Recruiting Readiness Pathway": ["cool-nerds"],
    # Emotional literacy, pressure protocols, resetting after mistakes —
    # the stress-management clause.
    "The Mental Toughness Pathway": ["cool-nerds"],
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
    dependencies = [("pathways", "0010_pathway_created_by_pathway_is_custom")]
    # Not reversed: rolling back must not strip audiences an admin has since
    # confirmed or added by hand.
    operations = [migrations.RunPython(link_audiences, migrations.RunPython.noop)]
