import StoreCourseDetailPage from "@/components/features/store/detail/StoreCourseDetailPage";

export const metadata = {
  title: "Course Details | Cool Nerds",
  description: "Course overview, what you'll learn, content, and instructors.",
};

export default async function StoreCourseRoute({ params }) {
  const { slug } = await params;
  return <StoreCourseDetailPage slug={slug} />;
}
