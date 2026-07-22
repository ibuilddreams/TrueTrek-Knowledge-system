"use client";

import { Suspense } from "react";
import ResetPasswordForm from "@/components/features/auth/ResetPasswordForm";
import Loader from "@/components/ui/Loader";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader label="Loading..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
