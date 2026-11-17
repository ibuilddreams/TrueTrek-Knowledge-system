"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourseEnrollment } from "@/hooks/useCourseEnrollment";
import { useEnrollAction } from "@/hooks/useEnrollAction";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";
import { CN_BTN_PRIMARY } from "@/components/ui/cobaltStyles";

const PRIMARY_BUTTON = `w-full ${CN_BTN_PRIMARY}`;

// Sticky purchase card: thumbnail, price, one "Enroll now" action and what's
// included. Enrolling takes a student to their portal, where the purchase
// happens — the same single action the store cards offer. Students who
// already own the course get "Start learning" instead; teachers and admins
// get a link to their own portal.
export default function CoursePurchaseCard({ course }) {
  const { status, isAuthenticated, isStudent, role } = useAuth();
  const enrollmentQuery = useCourseEnrollment(course.id);
  const { enroll, enrollModal } = useEnrollAction();

  const isAuthResolved = status !== "idle" && status !== "loading";


  let actions;
  if (!isAuthResolved || (isAuthenticated && isStudent && enrollmentQuery.isLoading)) {
    actions = (
      <button type="button" disabled className={PRIMARY_BUTTON}>
        Loading…
      </button>
    );
  } else if (isAuthenticated && !isStudent) {
    actions = (
      <Link href={getPortalRouteForRole(role)} className={PRIMARY_BUTTON}>
        Open your portal
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  } else if (enrollmentQuery.data) {
    actions = (
      <>
        <p className="flex items-center gap-2 text-sm font-semibold text-cn-ink">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-cn-ok" />
          You're enrolled in this course
        </p>
        <Link href={`${ROUTES.STUDENT_PORTAL}?tab=courses&course=${course.id}`} className={PRIMARY_BUTTON}>
          Start learning
          <ArrowRight className="w-4 h-4" />
        </Link>
      </>
    );
  } else {
    actions = (
      <button
        type="button"
        onClick={() => enroll(course)}
        className={PRIMARY_BUTTON}
      >
        Enroll now
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-cn-lg border border-cn-rule bg-white shadow-cn-3">
      <div className="aspect-video bg-cn-paper-2">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--color-cn-paper-3),var(--color-cn-paper-4))]">
            <BookOpen className="h-10 w-10 text-cn-accent" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <p className="text-cn-3xl leading-[1.55] font-extrabold tracking-[-0.03em] text-cn-ink tabular-nums">{formatCoursePrice(course.amount)}</p>
        <div className="space-y-3">{actions}</div>
      </div>

      {enrollModal}
    </div>
  );
}
