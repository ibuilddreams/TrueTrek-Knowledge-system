"""The catalog's course thumbnails: which photograph each seeded course gets.

Unlike every other seed asset, these are **shipped in the repository** rather
than downloaded at seed time (`_assets/course_images/`, with provenance and
licensing in its CREDITS.md). A seed run on a server behind a firewall, or one
whose upstream host has moved a file, still ends with every course carrying its
picture — which a 335-row catalog of blank cards made worth the ~2MB.

Images are pooled per category rather than chosen per course. 335 courses do not
have 335 photographs that mean anything, and one photograph per category would
repeat 151 times down the Scholars & Founders grid; a pool of four, handed out by
the course's position within its own category, means adjacent cards never match
while every card still looks like the subject it belongs to.
"""

from pathlib import Path

ASSET_DIR = Path(__file__).resolve().parent / "_assets" / "course_images"

# Where a seeded thumbnail is stored inside MEDIA_ROOT. Kept under its own
# `seed/` folder so `_assign_course_thumbnail` can tell a seeded image from one
# an admin uploaded through the portal (which lands directly in
# `course_thumbnails/`) and never overwrite the latter.
MEDIA_PREFIX = "course_thumbnails/seed"

# Four photographs per category in CATEGORY_NAMES. The file names are the
# category slugified, which is also what `_assets/course_images/` holds.
IMAGES_PER_CATEGORY = 4

CATEGORY_IMAGE_SLUGS = {
    "Academic": "academic",
    "Athletic": "athletic",
    "Foundation": "foundation",
    "Legacy": "legacy",
    "Professional": "professional",
    "Vocational": "vocational",
    "Scholars & Founders": "scholars-founders",
    "Coaches & Mentors": "coaches-mentors",
    "Legacy & Family Offices": "legacy-family-offices",
}


def image_file_names():
    """Every file name this module can ask for, in a stable order."""
    return [
        f"{slug}-{index}.jpg"
        for slug in CATEGORY_IMAGE_SLUGS.values()
        for index in range(1, IMAGES_PER_CATEGORY + 1)
    ]


def source_path(file_name):
    """The shipped file behind `file_name`."""
    return ASSET_DIR / file_name


def media_path(file_name):
    """Where `file_name` lives inside MEDIA_ROOT once stored."""
    return f"{MEDIA_PREFIX}/{file_name}"


def is_seeded_thumbnail(name):
    """True for a thumbnail this module put on a course.

    `Course.thumbnail` is also writable from the admin portal, where it uploads
    to `course_thumbnails/` directly. Only a name under our own `seed/` folder
    may be replaced on a reseed — anything else is somebody's own upload.
    """
    return bool(name) and str(name).startswith(f"{MEDIA_PREFIX}/")


def image_for(category_name, position):
    """The file name for the `position`-th course of `category_name`.

    `position` is that course's index among the courses sharing its category, so
    the pool cycles down the grid instead of repeating. A category with no pool
    returns None and its courses seed without a thumbnail, the same degradation
    as a download that failed.
    """
    slug = CATEGORY_IMAGE_SLUGS.get(category_name)
    if slug is None:
        return None
    return f"{slug}-{position % IMAGES_PER_CATEGORY + 1}.jpg"
