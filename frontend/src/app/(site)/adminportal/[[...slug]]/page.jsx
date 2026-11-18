import AdminPortalRoute from "@/components/features/admin/AdminPortalRoute";

export const metadata = {
  title: "Admin Portal | Cool Nerdz",
};

export default async function AdminPortalPage({ params }) {
  const { slug } = await params;
  return <AdminPortalRoute slug={slug?.[0]} />;
}
