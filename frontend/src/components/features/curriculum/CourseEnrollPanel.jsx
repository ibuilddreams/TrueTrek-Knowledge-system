"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import { addToCart, checkoutCart, getCart } from "@/services/cartService";
import { getStudentEnrolledCourseDetail } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import StorePaymentModal from "@/components/features/store/StorePaymentModal";

const PRIMARY_BUTTON =
  "mt-4 inline-flex items-center gap-2 rounded-xl bg-pine px-5 py-3 text-sm font-medium text-paper transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-70";

// Puts `course` in the student's cart if it isn't there yet, then checks out
// just that course — the rest of the cart is left untouched.
async function buyCourseNow(course) {
  const cartResponse = await getCart();
  const inCart = (cartResponse?.data || []).some((item) => item.course?.id === course.id);
  if (!inCart) {
    await addToCart(course.id);
  }
  return checkoutCart([course.id]);
}

export default function CourseEnrollPanel({ course }) {
  const queryClient = useQueryClient();
  const { status, user, isAuthenticated, isStudent, role } = useAuth();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

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

  const purchaseMutation = useMutation({
    mutationFn: () => buyCourseNow(course),
    onSuccess: (response) => {
      const result = response?.data || {};
      const failed = result.failed || [];
      failed.forEach((item) => toastError(`${item.course_title}: ${item.reason}`));
      const enrolled = (result.enrolled?.length || 0) > 0;
      const already = (result.already_enrolled?.length || 0) > 0;

      if (enrolled) {
        toastSuccess("Payment successful — you're enrolled in this course!");
      } else if (already) {
        toastInfo("You're already enrolled in this course.");
      }

      if (enrolled || already) {
        queryClient.setQueryData(["curriculum-enrollment", user?.id, courseId], true);
        queryClient.invalidateQueries({ queryKey: ["studentEnrollments"] });
        queryClient.invalidateQueries({ queryKey: ["store-cart"] });
        queryClient.invalidateQueries({ queryKey: ["store-public-courses"] });
        setIsPaymentOpen(false);
      } else if (failed.length === 0) {
        toastError("Checkout failed. Please try again.");
      } else {
        setIsPaymentOpen(false);
      }
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Checkout failed. Please try again."));
    },
  });

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
    body = "Sign in with your student account to purchase this course and start learning.";
    action = (
      <Link href={ROUTES.LOGIN} className={PRIMARY_BUTTON}>
        Sign in to enroll
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
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
    const price = formatCoursePrice(course.amount);
    heading = "Enroll in this course";
    body = "Purchase this course to unlock its lessons, assignments, and quizzes in your learning portal.";
    action = (
      <button
        type="button"
        onClick={() => setIsPaymentOpen(true)}
        className={PRIMARY_BUTTON}
      >
        <ShoppingCart className="h-4 w-4" />
        {price === "Free" ? "Enroll for free" : `Buy this course · ${price}`}
      </button>
    );
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

      {isStudent && (
        <StorePaymentModal
          isOpen={isPaymentOpen}
          items={[course]}
          isSubmitting={purchaseMutation.isPending}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={() => purchaseMutation.mutate()}
          size="lg"
        />
      )}
    </div>
  );
}
