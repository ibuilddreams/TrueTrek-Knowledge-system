import TeacherPortalRoute from "@/components/features/teachers/TeacherPortalRoute";

export const metadata = {
  title: "Teacher Portal | Cool Nerdz",
};

export default async function TeacherPortalPage({ params }) {
  const { slug } = await params;
  return <TeacherPortalRoute slug={slug?.[0]} />;
}
