import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function TeachersRedirectPage() {
  redirect(ROUTES.TEACHER_PORTAL);
}
