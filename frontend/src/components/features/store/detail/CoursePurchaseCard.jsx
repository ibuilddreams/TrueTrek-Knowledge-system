"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check, CheckCircle2, Play, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourseEnrollment } from "@/hooks/useCourseEnrollment";
import { useEnrollAction } from "@/hooks/useEnrollAction";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";

// The design's `.cdcard`/`.cdcb`, measured against it: a 50px full-width
// control at 16px/600, not the 14px the shared cobalt button uses.
const ACTION =
  "inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-cn-sm border border-transparent px-6 py-px text-cn-base font-semibold no-underline transition-[background-color,border-color,transform] duration-150 ease-cn-out focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cn-accent";
const ACTION_PRIMARY = `${ACTION} bg-cn-accent text-white enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 disabled:cursor-not-allowed disabled:opacity-50`;

// What a course includes, as the design lists it. The two content lines are
// dropped for a course that has no modules yet (the catalog carries a handful
// that are a page and a price while their curriculum is written), because the
// card must not promise lessons that are not there.
const INCLUDES = [
  { key: "lessons", icon: Play, text: "Video lessons in every module", needsContent: true },
  { key: "practice", icon: Zap, text: "Practice drills and quizzes", needsContent: true },
  { key: "progress", icon: Check, text: "Progress tracking in your dashboard", needsContent: false },
];

export default function CoursePurchaseCard({ course, hasContent = true }) {
  const { status, isAuthenticated, isStudent, role } = useAuth();
  const enrollmentQuery = useCourseEnrollment(course.id);
  const { enroll, enrollModal } = useEnrollAction();

  const isAuthResolved = status !== "idle" && status !== "loading";
  const isOwned = Boolean(enrollmentQuery.data);

  let action;
  if (!isAuthResolved || (isAuthenticated && isStudent && enrollmentQuery.isLoading)) {
    action = (
      <button type="button" disabled className={ACTION_PRIMARY}>
        Loading…
      </button>
    );
  } else if (isAuthenticated && !isStudent) {
    action = (
      <Link href={getPortalRouteForRole(role)} className={ACTION_PRIMARY}>
        Open your portal
        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </Link>
    );
  } else if (isOwned) {
    action = (
      <Link
        href={`${ROUTES.STUDENT_PORTAL}/courses?course=${course.id}`}
        className={ACTION_PRIMARY}
      >
        Start learning
        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </Link>
    );
  } else {
    action = (
      <button type="button" onClick={() => enroll(course)} className={ACTION_PRIMARY}>
        Enroll now
        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </button>
    );
  }

  const includes = INCLUDES.filter((item) => hasContent || !item.needsContent);

  return (
    <div className="overflow-hidden rounded-cn-lg border border-cn-rule bg-cn-paper shadow-cn-3">
      <figure className="m-0 aspect-16/9 bg-cn-paper-2">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-135 from-cn-paper-3 via-cn-paper-4 to-cn-accent-soft">
            <BookOpen className="h-10 w-10 text-cn-accent" strokeWidth={1.5} />
          </div>
        )}
      </figure>

      <div className="grid gap-3 p-6">
        <div className="flex items-baseline gap-1.5">
          <b className="text-cn-3xl leading-[1.55] font-extrabold tracking-[-0.03em] tabular-nums text-cn-ink">
            {formatCoursePrice(course.amount)}
          </b>
          <small className="text-cn-sm text-cn-muted">one-time</small>
        </div>

        {isOwned && (
          <p className="flex items-center gap-2 text-cn-sm font-semibold text-cn-ink">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-cn-ok" />
            You&apos;re enrolled in this course
          </p>
        )}

        {action}

        <p className="m-0 text-center text-cn-xs text-cn-muted">
          Enrollment and payment happen in your dashboard.
        </p>

        <div className="mt-2 grid gap-3 border-t border-cn-rule pt-4 text-cn-sm">
          <b>This course includes</b>
          <ul className="m-0 grid list-none gap-2 p-0 text-cn-ink-2">
            {includes.map(({ key, icon: Icon, text }) => (
              <li key={key} className="flex items-center gap-3">
                <Icon
                  aria-hidden="true"
                  className="h-4 w-4 flex-none text-cn-accent"
                  strokeWidth={key === "progress" ? 2.4 : 2.2}
                />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {enrollModal}
    </div>
  );
}
