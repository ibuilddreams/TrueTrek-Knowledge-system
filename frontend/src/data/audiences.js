import {
  Target,
  GraduationCap,
  HeartHandshake,
  Building2,
  Users,
  BriefcaseBusiness,
} from "lucide-react";

// The audience cards shown on the homepage and at /audiences, and the pages
// each one opens (/audiences/<slug>).
//
// `slug` is the contract with the backend: it must match a `pathways.Audience`
// row (seeded in migration 0008) for the page to find any pathways. The rest
// is hand-authored marketing copy and artwork, which is why audiences are not
// creatable through the API — a row with no profile here would have no page.
//
// `code` is the short audience label the 6 Oct review asked for in place of
// generic "Tier 9" style numbering, for pathway categorisation and internal
// tracking. It is only rendered where it stands on its own and so carries
// information the name isn't already giving: the admin Pathways table and the
// "Also for" badges on a pathway card. Both render it as an <abbr> so the full
// name is on hover. Public headings and nav chips use the full name instead.
//
// The two `featured` entries are the tall bookend columns of the homepage
// bento grid; the rest fill the middle columns. Artwork is self-hosted under
// `public/images/home/` (Unsplash-licensed, free for commercial use, no
// attribution required) rather than hotlinked, so the cards render identically
// in production without a third-party dependency.
export const AUDIENCE_PROFILES = [
  {
    id: "student-athletes",
    slug: "student-athletes",
    code: "ATH",
    featured: true,
    tag: "Recruiting & NIL",
    title: "Student Athletes",
    description:
      "Build recruiting readiness, understand brand management and NIL marketing, and develop athlete business skills for opportunities in sport and beyond.",
    chips: ["NIL Education"],
    icon: Target,
    iconClassName: "bg-sky text-pine",
    image: "/images/home/student-athletes.jpg",
  },
  {
    id: "scholars-founders",
    slug: "cool-nerds",
    code: "CNS",
    tag: "Academics & Life Skills",
    title: "Cool Nerds",
    description:
      "Combine rigorous academics with critical thinking, financial literacy, decision-making, stress management, and practical life skills.",
    icon: GraduationCap,
    iconClassName: "bg-sage text-pine",
    image: "/images/home/scholars-founders.jpg",
  },
  {
    id: "parents-families",
    slug: "parents",
    code: "PAR",
    tag: "Education & Sports",
    title: "Parents",
    description:
      "Support your student through education and sports, understand their progress, and help them make informed decisions along the way.",
    icon: HeartHandshake,
    iconClassName: "bg-rose/60 text-clay",
    image: "/images/home/parents-families.jpg",
  },
  {
    id: "institutions-academies",
    slug: "institutions-academies",
    code: "INS",
    featured: true,
    tag: "Support Programs",
    title: "Institutions & Academies",
    description:
      "Curriculum for your cohort, with compliance-grade reporting built in.",
    chips: ["Cohort Licensing", "Compliance Reporting"],
    icon: Building2,
    iconClassName: "bg-lavender text-pine",
    image: "/images/home/institutions-academies.jpg",
  },
  {
    id: "coaches-mentors",
    slug: "coaches",
    code: "CCH",
    tag: "Talent Management",
    title: "Coaches",
    description:
      "Manage talent and high-profile players, understand NIL, and support athletes through recruiting and brand opportunities.",
    icon: Users,
    iconClassName: "bg-mint text-pine",
    image: "/images/home/coaches-mentors.jpg",
  },
  {
    id: "entrepreneurs",
    slug: "entrepreneurs",
    code: "ENT",
    tag: "Entrepreneurship",
    title: "Entrepreneurs",
    description:
      "Build business knowledge, financial literacy, and practical trade and vocational skills for life beyond school and sports.",
    icon: BriefcaseBusiness,
    iconClassName: "bg-gold/15 text-gold",
    image: "/images/home/legacy-family-offices.jpg",
  },
];

export function getAudienceProfile(slug) {
  return AUDIENCE_PROFILES.find((profile) => profile.slug === slug);
}

/**
 * Short code + full name for one of the audiences the API returns on a
 * pathway. Falls back to the API's own name for an audience that has been
 * seeded in the backend but has no profile here yet.
 */
export function getAudienceLabel(audience) {
  const profile = getAudienceProfile(audience?.slug);
  return {
    code: profile?.code || audience?.name || "",
    name: profile?.title || audience?.name || "",
  };
}
