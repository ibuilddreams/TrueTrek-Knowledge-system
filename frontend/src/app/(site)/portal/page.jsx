import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function PortalRedirectPage() {
  redirect(ROUTES.STUDENT_PORTAL);
}
