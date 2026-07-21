import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Backwards-compatible alias for the faculty dashboard. */
export default function TeachersRedirectPage() {
  redirect(ROUTES.DASHBOARD);
}
