"""Default audience mapping for the demo pathways created by `seeddata`.

Applied only when `seeddata` first creates a pathway, so re-running the command
never undoes an admin's later audience edits.

Migrations `0008_seed_audience_mappings`, `0009_extend_audience_mappings` and
`0011_link_cool_nerds_and_entrepreneurs` carry the equivalent mapping for
pathways that already exist in a database. 0008 and 0009 map names that no
longer seed (they went with the Numa demo catalog) -- harmless, because they
filter on the names actually present, and a migration must keep working against
the data of its own moment rather than be rewritten.

Mappings follow the 6 October 2026 curriculum review: a pathway may serve more
than one audience ("a pathway does not need to be exclusive to one audience"),
and every audience card should lead somewhere.
"""

# The client's "Courses We need to add" sheet is the whole catalog now, and it
# covers athletes only. Its own audience columns are filled in for just three
# rows: CEO-101 and CEO-102 are ticked for Student Athletes, Coaches and
# Parents, and CEO-201 for Student Athletes and Institutions & Athletes.
# Audiences attach to a pathway rather than a course, so the Athlete CEO mapping
# below is the union of those ticks. The sheet left every Recruiting and Mental
# Toughness row blank, so those two are read from their syllabus instead: both
# run through the athlete, the parent (REC-204 "The Parent/Guardian Protocol",
# MT-204's car ride home) and the coach. Worth confirming with the client, and a
# checkbox away in the admin pathway form either way.
#
# Cool Nerds and Entrepreneurs led nowhere while the catalog was athlete-only.
# They are now mapped from the subject each card advertises in the frontend's
# `data/audiences.js`, rather than by spreading all three pathways across all
# six cards:
#
# - Entrepreneurs ("business knowledge, financial literacy... for life beyond
#   school and sports") gets Athlete CEO alone. That pathway runs governance and
#   OKRs, brand and NIL contracts, tax and wealth preservation, deal structuring
#   and the post-athletic venture transition -- it is the business curriculum.
#   Recruiting Readiness (NCAA eligibility, signing day) and Mental Toughness
#   (pre-game routines, the locker room) are athlete-specific, and filing them
#   here would fill the card by making it lie.
# - Cool Nerds ("rigorous academics with critical thinking, financial literacy,
#   decision-making, stress management, and practical life skills") gets all
#   three, one clause each: Athlete CEO for financial literacy, Recruiting
#   Readiness for the academic-eligibility and offer-math decision-making, and
#   Mental Toughness for stress management.
#
# Institutions & Academies is still reachable through Athlete CEO alone.
DEFAULT_PATHWAY_AUDIENCES = {
    "The Athlete CEO Pathway": [
        "student-athletes",
        "coaches",
        "parents",
        "institutions-academies",
        "entrepreneurs",
        "cool-nerds",
    ],
    "The Recruiting Readiness Pathway": [
        "student-athletes",
        "coaches",
        "parents",
        "cool-nerds",
    ],
    "The Mental Toughness Pathway": [
        "student-athletes",
        "coaches",
        "parents",
        "cool-nerds",
    ],
}
