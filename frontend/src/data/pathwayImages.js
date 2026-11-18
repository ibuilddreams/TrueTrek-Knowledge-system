// Photographs for the nine seeded pathways, extracted from the design file
// into `public/images/design/`. Keyed by the pathway's slug, which is stable
// (`seeddata` upserts these nine in place and keeps their primary keys) and is
// what the API already sends, so nothing has to match on a display name.
//
// A slug with no entry here simply renders the card's gradient placeholder
// rather than a broken image — a pathway an admin adds by hand has no
// photograph of ours, and that is the correct outcome, not a bug.
const PATHWAY_IMAGES = {
  "the-coaching-pathway": "/images/design/path-coaching.webp",
  "the-entrepreneur-pathway": "/images/design/path-entrepreneur.webp",
  "the-cool-nerds-pathway": "/images/design/path-coolnerds.webp",
  "the-parent-pathway": "/images/design/path-parent.webp",
  "the-athlete-life-skills-transition-pathway":
    "/images/design/path-lifeskills.webp",
  "the-branding-marketing-pathway": "/images/design/path-branding.webp",
  "the-mental-toughness-pathway": "/images/design/path-mental.webp",
  "the-recruiting-readiness-pathway": "/images/design/path-recruiting.webp",
  "the-athlete-ceo-pathway": "/images/design/path-ceo.webp",
};

export function pathwayImage(slug) {
  return PATHWAY_IMAGES[slug] || null;
}

// "The Coaching Pathway" -> "Coaching". The chips in the marquee are read at a
// glance while they move, so they carry the distinguishing part of the name
// only; the full name is still the link's accessible label.
export function shortPathwayName(name) {
  return String(name || "")
    .replace(/^The\s+/i, "")
    .replace(/\s+Pathway$/i, "")
    .trim();
}

export default PATHWAY_IMAGES;
