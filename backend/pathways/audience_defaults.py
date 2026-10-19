"""Default audience mapping for the demo pathways created by `seeddata`.

Applied only when `seeddata` first creates a pathway, so re-running the command
never undoes an admin's later audience edits.

Migrations `0008_seed_audience_mappings`, `0009_extend_audience_mappings`,
`0011_link_cool_nerds_and_entrepreneurs` and `0012_map_remaining_sheet_pathways`
carry the equivalent mapping for pathways that already exist in a database.
0008 and 0009 map names that no longer seed (they went with the Numa demo
catalog) -- harmless, because they filter on the names actually present, and a
migration must keep working against the data of its own moment rather than be
rewritten.

Mappings follow the 6 October 2026 curriculum review: a pathway may serve more
than one audience ("a pathway does not need to be exclusive to one audience"),
and every audience card should lead somewhere.
"""

# The client's "Courses We need to add" sheet is the whole catalog, and it is
# now transcribed in full: the three athlete pathways (CEO/REC/MT) plus the six
# that arrived with them on the same sheet (Branding & Marketing, Athlete Life
# Skills, Parent, Cool Nerds, Entrepreneur, Coaching).
#
# That changes what this file is doing. While the catalog was athlete-only,
# four of the six homepage cards had to be filled by spreading athlete pathways
# across them -- Cool Nerds got all three, Entrepreneurs got Athlete CEO,
# Parents and Coaches got everything athlete-facing on the grounds that they
# read over the athlete's shoulder. Four of those cards now have curriculum
# written FOR them, so each card leads with its own pathway and keeps only the
# athlete pathways it can honestly claim:
#
# - Parents keeps the athlete pathways (a parent genuinely uses REC-204 and the
#   car ride home in MT-204) but now leads with The Parent Pathway, 23 courses
#   addressed to the parent directly.
# - Coaches likewise leads with The Coaching Pathway.
# - Cool Nerds leads with The Cool Nerds Pathway -- the one track in the catalog
#   with no athletic premise at all -- and keeps Athlete CEO (financial
#   literacy), Recruiting Readiness (academic eligibility and offer maths) and
#   Mental Toughness (stress management), the three clauses its card advertises.
# - Entrepreneurs leads with The Entrepreneur Pathway (55 courses) alongside
#   Athlete CEO and the money half of Athlete Life Skills.
#
# The sheet's own audience column is only filled in for three rows (CEO-101 and
# CEO-102 ticked for Student Athletes, Coaches and Parents; CEO-201 for Student
# Athletes and Institutions & Athletes), so everything else is read from each
# pathway's syllabus. Still worth confirming with the client, and a checkbox
# away in the admin pathway form either way.
#
# Institutions & Academies is the one card with no pathway of its own: an
# academy licenses what it teaches its cohort, so it gets the tracks a program
# would actually run -- the athlete business curriculum, the coaching one, and
# the two student tracks.
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
    # The athlete's own brand: the pitch to local businesses is the first money
    # most of them make, which is why Entrepreneurs claims it too, and a coach
    # placing NIL deals (COH-304) works from the same material.
    "The Branding & Marketing Pathway": [
        "student-athletes",
        "entrepreneurs",
        "coaches",
        "parents",
    ],
    # Money, boundaries and the exit from sport. Cool Nerds for the practical
    # life-skills clause, Entrepreneurs for the wealth and venture half.
    "The Athlete Life Skills & Transition Pathway": [
        "student-athletes",
        "cool-nerds",
        "entrepreneurs",
        "parents",
    ],
    # Written to the parent. An academy that runs parent evenings teaches from
    # it too; nothing in it is addressed to the athlete, so it stops there.
    "The Parent Pathway": [
        "parents",
        "institutions-academies",
    ],
    # The only track with no athletic premise -- it belongs to the Cool Nerds
    # card first. Parents of those students use it, schools license it, and
    # STU-303 ("Creating Your Own Company") is why Entrepreneurs is here.
    "The Cool Nerds Pathway": [
        "cool-nerds",
        "parents",
        "institutions-academies",
        "entrepreneurs",
    ],
    # ENT-114's athlete-founder case studies and ENT-313's "NIL to LLC"
    # pipeline are what earn it the Student Athletes card as well.
    "The Entrepreneur Pathway": [
        "entrepreneurs",
        "student-athletes",
        "cool-nerds",
        "institutions-academies",
    ],
    # The coach's own curriculum, and the thing an academy buys when it is
    # developing its staff rather than its players.
    "The Coaching Pathway": [
        "coaches",
        "institutions-academies",
    ],
}
