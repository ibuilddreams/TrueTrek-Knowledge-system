import PathwayDetailPage from "@/components/features/pathways/detail/PathwayDetailPage";

export const metadata = {
  title: "Pathway Details | TrueTrek Learning",
  description: "Pathway purpose, what you'll learn, included courses, and pricing.",
};

export default async function PathwayDetailRoute({ params }) {
  const { slug } = await params;
  return <PathwayDetailPage slug={slug} />;
}
