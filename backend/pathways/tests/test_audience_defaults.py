"""Consistency checks on the seed audience mapping.

Pure data assertions — no DB seeding, so these stay fast. They guard the shape
the 6 October 2026 review asked for: every audience card leads somewhere, every
pathway belongs to someone, and a pathway may serve several audiences.

The mapping itself lives in `pathways/audience_defaults.py` (fresh `seeddata`
runs) and is mirrored by migrations 0008/0009/0011 (databases that already have
the rows) — change one and the other needs the same edit.

They also catch the easy mistake of adding a pathway to PATHWAY_DEFS and
forgetting to file it under an audience, which would leave it unreachable from
any audience page.
"""

from collections import Counter

from django.test import SimpleTestCase

from courses.management.commands.seeddata import PATHWAY_DEFS

from ..audience_defaults import DEFAULT_PATHWAY_AUDIENCES

# The audience slugs seeded by migration 0008. Each is paired with hand-authored
# copy and artwork in the frontend's `data/audiences.js`.
KNOWN_AUDIENCE_SLUGS = {
    "student-athletes",
    "cool-nerds",
    "parents",
    "institutions-academies",
    "coaches",
    "entrepreneurs",
}

# How many pathways an audience card may lead to. The 6 October 2026 review
# curated every card down to three or four, which held while the catalogue was
# fifteen demo pathways across six cards.
#
# Those pathways went with the Numa catalog, leaving the client's three -- all
# athlete-facing. The floor is therefore 1, not 3: it holds the review's actual
# requirement, that every card leads somewhere, without pretending three
# pathways can fill six cards four deep. Cool Nerds and Entrepreneurs are now
# mapped by the subject each card advertises (see `audience_defaults`), and
# Institutions & Academies leads to Athlete CEO alone.
#
# Raise this back toward 3 as the client's curriculum grows past the athlete
# track. The ceiling bites at the total number of pathways, so a card cannot
# list the same pathway twice or drift past the catalogue, and
# `test_every_seeded_pathway_has_an_audience` guards the reverse direction:
# no pathway is orphaned.
MIN_PATHWAYS_PER_CARD = 1


class AudienceDefaultsTests(SimpleTestCase):
    def test_every_slug_is_a_real_audience(self):
        used = {slug for slugs in DEFAULT_PATHWAY_AUDIENCES.values() for slug in slugs}
        self.assertEqual(used - KNOWN_AUDIENCE_SLUGS, set())

    def test_every_seeded_pathway_has_an_audience(self):
        seeded_names = {d["name"] for d in PATHWAY_DEFS}
        self.assertEqual(
            seeded_names - set(DEFAULT_PATHWAY_AUDIENCES),
            set(),
            "every pathway in PATHWAY_DEFS needs an audience, or it reaches no audience page",
        )

    def test_mapping_names_a_real_pathway(self):
        seeded_names = {d["name"] for d in PATHWAY_DEFS}
        self.assertEqual(set(DEFAULT_PATHWAY_AUDIENCES) - seeded_names, set())

    def test_every_audience_card_leads_to_a_balanced_set_of_pathways(self):
        counts = Counter(
            slug for slugs in DEFAULT_PATHWAY_AUDIENCES.values() for slug in slugs
        )
        for slug in KNOWN_AUDIENCE_SLUGS:
            with self.subTest(audience=slug):
                self.assertGreaterEqual(
                    counts[slug],
                    MIN_PATHWAYS_PER_CARD,
                    f"{slug} has {counts[slug]} pathways, expected at least "
                    f"{MIN_PATHWAYS_PER_CARD} — that card would lead nowhere",
                )
                self.assertLessEqual(
                    counts[slug],
                    len(PATHWAY_DEFS),
                    f"{slug} lists {counts[slug]} pathways but only "
                    f"{len(PATHWAY_DEFS)} exist — a duplicate or a stale name",
                )

    def test_a_pathway_may_serve_several_audiences(self):
        # Not decoration: the review was explicit that "a pathway does not need
        # to be exclusive to one audience", so at least one must prove it.
        shared = [name for name, slugs in DEFAULT_PATHWAY_AUDIENCES.items() if len(slugs) > 1]
        self.assertTrue(shared)

    def test_no_pathway_lists_the_same_audience_twice(self):
        for name, slugs in DEFAULT_PATHWAY_AUDIENCES.items():
            with self.subTest(pathway=name):
                self.assertEqual(len(slugs), len(set(slugs)))
