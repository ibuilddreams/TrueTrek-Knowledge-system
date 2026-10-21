import InstructorProfilePage from "@/components/features/instructors/InstructorProfilePage";

export const metadata = {
  title: "Instructor | Cool Nerdz",
  description: "Instructor profile, courses, and student feedback.",
};

export default async function InstructorRoute({ params }) {
  const { id } = await params;
  return <InstructorProfilePage instructorId={id} />;
}
