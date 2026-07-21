import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/**
 * Login entry point — student vault authentication lives in the portal.
 */
export default function LoginPage() {
  redirect(ROUTES.PORTAL);
}
