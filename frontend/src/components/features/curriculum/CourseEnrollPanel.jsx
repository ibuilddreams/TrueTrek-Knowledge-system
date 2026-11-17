"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import { getStudentEnrolledCourseDetail } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";

// Full-width buttons: this panel is the course page's purchase card, where
// the design stacks its actions down the card rather than sitting them in a
// row (new-design.html `.cdcb .btn { width: 100% }`).
const SECONDARY_BUTTON =
  "inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-cn-sm border border-cn-rule-strong bg-white px-5 text-sm font-semibold text-cn-ink transition-colors duration-150 enabled:hover:border-cn-ink disabled:cursor-not-allowed disabled:opacity-50";

const PRIMARY_BUTTON =
  "inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function CourseEnrollPanel({ course }) {
  const { status, user, isAuthenticated, isStudent, role } = useAuth();
  const router = useRouter();

  const isAuthResolved = status !== "idle" && status !== "loading";
  const courseId = course.id;

  // The enrolled-course endpoint 404s for a course the student hasn't
  // enrolled in, which is exactly the "not enrolled" signal we need here.
  const enrollmentQuery = useQuery({
    queryKey: ["curriculum-enrollment", user?.id, courseId],
    queryFn: async () => {
      try {
        await getStudentEnrolledCourseDetail(courseId);
        return true;
      } catch (error) {
        if (error?.status === 404) return false;
        throw error;
      }
    },
    enabled:
      isAuthResolved && isAuthenticated && isStudent && Boolean(courseId),
    retry: false,
  });

  // Enrolling happens in the portal, where the purchase is made.
  const enrollAction = (
    <button
      type="button"
      onClick={() =>
        router.push(
          `${ROUTES.STUDENT_PORTAL}?buy=${encodeURIComponent(course.slug)}`,
        )
      }
      className={PRIMARY_BUTTON}
    >
      Enroll now
      <ArrowRight className="h-4 w-4" />
    </button>
  );

  const portalCourseUrl = `${ROUTES.STUDENT_PORTAL}?tab=courses&course=${courseId}`;
  let heading;
  let body;
  let action;

  if (!isAuthResolved) {
    heading = "Enroll in this course";
    body = "Checking your account…";
    action = (
      <button type="button" disabled className={PRIMARY_BUTTON}>
        Loading…
      </button>
    );
  } else if (!isAuthenticated) {
    heading = "Enroll in this course";
    body = `Add this course to your cart (${formatCoursePrice(course.amount)}). You'll sign in with your student account when you check out from your cart.`;
    action = enrollAction;
  } else if (!isStudent) {
    heading = "Manage this course";
    body =
      "Course purchases are available to student accounts. Open your portal to manage courses.";
    action = (
      <Link href={getPortalRouteForRole(role)} className={PRIMARY_BUTTON}>
        Open your portal
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  } else if (enrollmentQuery.isLoading) {
    heading = "Enroll in this course";
    body = "Checking your enrollment…";
    action = (
      <button type="button" disabled className={PRIMARY_BUTTON}>
        Loading…
      </button>
    );
  } else if (enrollmentQuery.isError) {
    heading = "Enroll in this course";
    body = getApiErrorMessage(
      enrollmentQuery.error,
      "We couldn't check your enrollment right now.",
    );
    action = (
      <button
        type="button"
        onClick={() => enrollmentQuery.refetch()}
        className={PRIMARY_BUTTON}
      >
        Try again
      </button>
    );
  } else if (enrollmentQuery.data) {
    heading = "You're enrolled";
    body =
      "Pick up where you left off — read the lessons, submit assignments, and take quizzes in your learning portal.";
    action = (
      <Link href={portalCourseUrl} className={PRIMARY_BUTTON}>
        Start learning
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  } else {
    heading = "Enroll in this course";
    body = `Add this course to your cart (${formatCoursePrice(course.amount)}), then purchase it from your cart to unlock its lessons, assignments, and quizzes.`;
    action = enrollAction;
  }

  // No border or background of its own: the course page wraps this in the
  // card that also carries the course image, so this is that card's body.
  return (
    <div className="grid gap-3 p-6">
      <h3 className="flex items-center gap-2 text-cn-lg font-bold tracking-[-0.015em] text-cn-ink">
        {enrollmentQuery.data && isStudent && (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-cn-ok" />
        )}
        {heading}
      </h3>
      <p className="text-sm leading-relaxed text-cn-ink-2">{body}</p>
      <div className="mt-1">{action}</div>
    </div>
  );
}
