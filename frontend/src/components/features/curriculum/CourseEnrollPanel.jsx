"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, CheckCircle2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import { getStudentEnrolledCourseDetail } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";

const SECONDARY_BUTTON =
  "mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:bg-porcelain disabled:cursor-not-allowed disabled:opacity-70";

const PRIMARY_BUTTON =
  "mt-4 inline-flex items-center gap-2 rounded-xl bg-pine px-5 py-3 text-sm font-medium text-paper transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-70";

export default function CourseEnrollPanel({ course }) {
  const { status, user, isAuthenticated, isStudent, role } = useAuth();
  const { isInCart, isPending: isCartPending, toggleCourse } = useCart();

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
    enabled: isAuthResolved && isAuthenticated && isStudent && Boolean(courseId),
    retry: false,
  });

  const inCart = isInCart(courseId);
  const cartButton = (
    <button
      type="button"
      onClick={() => toggleCourse(course)}
      disabled={isCartPending(courseId)}
      className={inCart ? SECONDARY_BUTTON : PRIMARY_BUTTON}
    >
      {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      {inCart ? "In cart · remove" : "Add to cart"}
    </button>
  );

  // Purchasing happens from the cart page, never from here.
  const cartActions = (
    <div className="flex flex-wrap items-center gap-3">
      {cartButton}
      {inCart && (
        <Link href={ROUTES.CART} className={PRIMARY_BUTTON}>
          View cart
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
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
    action = cartActions;
  } else if (!isStudent) {
    heading = "Manage this course";
    body = "Course purchases are available to student accounts. Open your portal to manage courses.";
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
      <button type="button" onClick={() => enrollmentQuery.refetch()} className={PRIMARY_BUTTON}>
        Try again
      </button>
    );
  } else if (enrollmentQuery.data) {
    heading = "You're enrolled";
    body = "Pick up where you left off — read the lessons, submit assignments, and take quizzes in your learning portal.";
    action = (
      <Link href={portalCourseUrl} className={PRIMARY_BUTTON}>
        Start learning
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  } else {
    heading = "Enroll in this course";
    body = `Add this course to your cart (${formatCoursePrice(course.amount)}), then purchase it from your cart to unlock its lessons, assignments, and quizzes.`;
    action = cartActions;
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-sage/50 p-6">
      <h3 className="flex items-center gap-2 font-semibold">
        {enrollmentQuery.data && isStudent && (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
        {heading}
      </h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}
