"""Default audience mapping for the demo pathways created by `seeddata`.

Applied only when `seeddata` first creates a pathway, so re-running the command
never undoes an admin's later audience edits.

Migrations `0008_seed_audience_mappings` and `0009_extend_audience_mappings`
carry the equivalent mapping for the pathways that already existed when
audiences were introduced; the four pathways written for the review's own
audiences arrive with `seeddata` itself. The duplication is deliberate: a
migration must keep working against the schema and data of its own moment, so
it cannot import this module.

Mappings follow the 6 October 2026 curriculum review: a pathway may serve more
than one audience ("a pathway does not need to be exclusive to one audience"),
and every audience card leads somewhere. Each card resolves to three or four
pathways — the review's examples alone would have left Student Athletes with
six and Institutions & Academies, which it never mentions, with none.
"""

DEFAULT_PATHWAY_AUDIENCES = {
    # --- mappings the review stated outright -------------------------------
    # "athlete business / NIL branding -> Student Athletes"
    "Elite Athlete Business Pathway": ["student-athletes"],
    # "athlete recruiting readiness -> Student Athletes and potentially Coaches"
    "Athletic Recruiting Readiness Pathway": ["student-athletes", "coaches"],
    # "sports pathways -> athletes and coaches"
    "Athlete / Sports Pathway": ["student-athletes", "coaches"],
    # "academic / elite-school pathways -> Cool Nerds"
    "Education / Academic Pathway": ["cool-nerds", "parents", "institutions-academies"],
    "Ivy League-Oriented Pathway": ["cool-nerds", "institutions-academies"],
    # "business pathways -> entrepreneurs, Cool Nerds, and some athletes". The
    # athlete half was left off to keep that card inside its 3-4 range; it is a
    # checkbox away in the admin pathway form.
    "Business Pathway": ["cool-nerds", "entrepreneurs"],
    # "parent homeschool pathway -> Parents"
    "Parent / Homeschool Pathway": ["parents"],
    # "trade and vocational skills -> entrepreneurship/life-after-school audience"
    "Trade & Vocational Skills Pathway": ["entrepreneurs"],
    # "international student pathway -> athletes where appropriate" — in
    # practice the academies hosting them, for the same ranging reason.
    "International Student Pathway": ["institutions-academies"],

    # --- read from the audience briefs rather than the mapping list --------
    # Eligibility rules, transcript strategy and highlight-tape basics for
    # 8th-10th graders: Parents ("helping students navigate education and
    # sports") and Coaches ("supporting athletes through recruiting").
    "The Blueprint": ["parents", "coaches"],
    # Data-informed decision-making, grouped with the business audience.
    "Strategic Analytics Pathway": ["entrepreneurs"],

    # --- written for audiences the catalogue did not already serve ---------
    # The fifth audience, "Entrepreneurship" / "Life After Sports/School", plus
    # the athlete brief's "preparation for opportunities beyond sports".
    "Life After Sports Pathway": ["student-athletes", "entrepreneurs"],
    # "financial literacy, decision-making, critical thinking, stress
    # management ... identified as desirable curriculum themes" for Cool Nerds.
    "Life Skills & Financial Literacy Pathway": ["cool-nerds"],
    # "parenting athletes, helping students navigate education and sports,
    # understanding progress, and supporting decision-making".
    "Parenting the Student-Athlete Pathway": ["parents"],
    # "talent management, managing high-profile players, NIL-related guidance".
    "Talent Management for Coaches Pathway": ["coaches"],
}
