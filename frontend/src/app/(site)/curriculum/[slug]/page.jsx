import CourseCatalogDetail from "@/components/features/curriculum/CourseCatalogDetail";

export const metadata = {
  title: "Course Details | TrueTrek Learning",
  description: "Course overview, modules, lessons, assignments, and quizzes.",
};

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  return <CourseCatalogDetail slug={slug} />;
}
