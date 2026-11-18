import StudentPortalRoute from "@/components/features/portal/StudentPortalRoute";

export const metadata = {
  title: "Student Portal | Cool Nerdz",
};

// `/studentportal`, `/studentportal/courses`, `/studentportal/rewards` — one
// optional catch-all segment rather than a folder per screen, because the
// sidebar is already the list of valid slugs (`shell/portalNav.js`) and a
// second copy of it as directories would be one more thing to keep in step.
export default async function StudentPortalPage({ params }) {
  const { slug } = await params;
  return <StudentPortalRoute slug={slug?.[0]} />;
}
