import { notFound } from "next/navigation";
import { AUDIENCE_PROFILES, getAudienceProfile } from "@/data/audiences";
import AudienceDetail from "@/components/features/audiences/AudienceDetail";

// The audience set is fixed, hand-authored data, so every page is known at
// build time.
export function generateStaticParams() {
  return AUDIENCE_PROFILES.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const profile = getAudienceProfile(slug);

  if (!profile) {
    return { title: "Audience Not Found | Cool Nerds" };
  }

  return {
    title: `${profile.title} | Cool Nerds`,
    description: profile.description,
  };
}

export default async function AudienceRoute({ params }) {
  const { slug } = await params;

  // An audience page is only meaningful with its copy and artwork, which live
  // in the static profile list — an unmapped slug is a 404, not an empty page.
  if (!getAudienceProfile(slug)) notFound();

  // Keyed by slug so switching between audiences remounts the page rather than
  // carrying the previous one's pagination cursors over to a shorter list.
  return <AudienceDetail key={slug} slug={slug} />;
}
