"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BookMarked,
  CircleHelp,
  ClipboardList,
  Gift,
  Play,
  TrendingUp,
  Video,
} from "lucide-react";
import { AUTH_ROLES } from "@/constants/auth";
import { usePortalSession } from "@/hooks/usePortalSession";
import { useStudentAssignments } from "@/hooks/student/useStudentAssignments";
import { useTodaysQuests } from "@/hooks/student/useTodaysQuests";
import { useMyUpcomingClasses } from "@/hooks/student/useStudentClassSessions";
import { getStudentDashboardStats } from "@/services/studentDashboardService";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import Loader from "@/components/ui/Loader";
import PortalCard, {
  PortalBar,
  PortalCardHead,
  PortalStat,
} from "../shell/PortalCard";
import MyPathwaysSummary from "../MyPathwaysSummary";
import { portalHref } from "../shell/portalNav";

// The student's front page, laid out as the design draws it: a cobalt hero
// beside a progress panel, four headline numbers, then three rows of cards.
//
// Every number here comes from an endpoint this app actually serves. The
// design's XP/level ring and its weekly learning-time chart have no data
// behind them yet, so the ring shows overall course progress — which is real
// — and the chart is left out rather than drawn from invented numbers.
const href = (slug) => portalHref(AUTH_ROLES.STUDENT, slug);

function ProgressRing({ value = 0, size = 96, stroke = 9 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-cn-p-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-cn-p-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-cn-out"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="text-xl font-extrabold tabular-nums text-cn-p-ink">
          {Math.round(pct)}%
        </span>
      </span>
    </div>
  );
}

function formatDue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const isOverdue = date.getTime() < today.getTime();
  return {
    isOverdue,
    label: isOverdue
      ? "Overdue"
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };
}

export default function StudentDashboard({ onNavigate }) {
  const { points } = usePortalSession();

  const statsQuery = useQuery({
    queryKey: ["student-dashboard-stats"],
    queryFn: async () => (await getStudentDashboardStats()).data,
  });
  // Continue learning reads the enrolments rather than the dashboard's
  // `progress_summary`, because a CourseProgress row only appears once a
  // lesson has been opened — a student with thirty courses and no lesson
  // started yet would otherwise be told they have nothing in progress.
  const enrollmentsQuery = useQuery({
    queryKey: ["student-enrollments", "dashboard"],
    queryFn: async () => {
      const response = await getStudentEnrollments({ pageSize: 100 });
      const data = response?.data;
      return data?.results ?? data ?? [];
    },
  });
  const assignmentsQuery = useStudentAssignments();
  const questsQuery = useTodaysQuests();
  const classesQuery = useMyUpcomingClasses({ pageSize: 3 });

  const stats = statsQuery.data?.statistics ?? {};

  // Courses still under way, the furthest along first — the one they are
  // closest to finishing is the one worth offering.
  const inProgress = useMemo(() => {
    const rows = enrollmentsQuery.data ?? [];
    return rows
      .filter((row) => row.status === "ACTIVE" && !row.is_completed)
      .map((row) => ({
        id: row.id,
        courseId: row.course?.id,
        title: row.course?.title,
        code: row.course?.code,
        teacher: row.teacher?.name || row.course?.instructors?.[0]?.name,
        percent: Number(row.completion_percentage) || 0,
      }))
      // Most seeded titles already begin with their own course code, so
      // prefixing blindly produced "CEO-304: CEO-304: The Capstone".
      .map((row) => ({
        ...row,
        label:
          row.code && !row.title?.startsWith(row.code)
            ? `${row.code}: ${row.title}`
            : row.title,
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);
  }, [enrollmentsQuery.data]);

  const leadCourse = inProgress[0];

  // "Due this week" is the next few assignments that are still open, by due
  // date. An assignment with no due date cannot be "due this week", so it is
  // left out rather than sorted to one end.
  const dueSoon = useMemo(() => {
    const rows = assignmentsQuery.data ?? [];
    return rows
      .filter((row) => row.due_date && row.submission?.status !== "GRADED")
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 4);
  }, [assignmentsQuery.data]);

  const quests = questsQuery.data?.quests ?? [];
  const questsDone = quests.filter((q) => q.status === "COMPLETED").length;
  const upcomingClasses = classesQuery.data ?? [];

  if (statsQuery.isLoading) {
    return <Loader fullScreen={false} label="Loading your dashboard..." />;
  }

  return (
    <div className="grid gap-5">
      {/* Hero + progress panel */}
      <div className="grid grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-5 max-[72rem]:grid-cols-[minmax(0,1fr)]">
        <PortalCard tone="accent" className="relative overflow-hidden p-8">
          <p className="text-xs font-bold tracking-[0.12em] text-white/70 uppercase">
            Welcome back
          </p>
          {leadCourse ? (
            <>
              <h2 className="mt-2 max-w-[22ch] text-[32px] leading-[1.12] font-extrabold tracking-[-0.02em]">
                Pick up where you left off in{" "}
                <span className="text-white/75">{leadCourse.title}</span>
              </h2>
              <div className="mt-6 flex flex-wrap items-center gap-5">
                <div className="min-w-[220px] flex-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-white/80">In progress</span>
                    <span className="font-semibold tabular-nums">
                      {Math.round(leadCourse.percent)}%
                    </span>
                  </div>
                  <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                    <span
                      className="block h-full rounded-full bg-white transition-[width] duration-500 ease-cn-out"
                      style={{
                        width: `${Math.max(0, Math.min(100, leadCourse.percent))}%`,
                      }}
                    />
                  </span>
                </div>
                <Link
                  href={`${href("courses")}?course=${leadCourse.courseId}`}
                  className="inline-flex h-11 items-center gap-2 rounded-cn-p-sm bg-white px-5 text-sm font-semibold text-cn-p-accent no-underline transition-transform duration-150 ease-cn-out hover:-translate-y-px"
                >
                  <Play className="h-4 w-4" />
                  Continue course
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 max-w-[22ch] text-[32px] leading-[1.12] font-extrabold tracking-[-0.02em]">
                Your courses are waiting.
              </h2>
              <p className="mt-3 max-w-[46ch] text-white/80">
                Open a course to start the first lesson — your progress shows up
                here as soon as you do.
              </p>
              <Link
                href={href("courses")}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-cn-p-sm bg-white px-5 text-sm font-semibold text-cn-p-accent no-underline transition-transform duration-150 ease-cn-out hover:-translate-y-px"
              >
                <BookMarked className="h-4 w-4" />
                Go to my courses
              </Link>
            </>
          )}
        </PortalCard>

        <PortalCard className="p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold tracking-[0.1em] text-cn-p-muted uppercase">
              Your progress
            </p>

          </div>

          <div className="mt-4 flex items-center gap-5">
            <ProgressRing value={stats.overall_progress} />
            <div className="min-w-0">
              <p className="font-semibold text-cn-p-ink">Across every course</p>
              <p className="mt-1 text-[13px] text-cn-p-ink-2">
                {stats.completed_courses ?? 0} completed ·{" "}
                {stats.active_courses ?? 0} in progress
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href={href("certificates")}
              className="rounded-cn-p-sm bg-cn-p-page p-4 no-underline transition-colors duration-150 hover:bg-cn-p-soft"
            >
              <span className="flex items-center gap-2 text-[13px] text-cn-p-ink-2">
                <Award className="h-4 w-4 text-cn-p-accent" />
                Certificates
              </span>
              <span className="mt-1 block text-2xl font-extrabold tabular-nums text-cn-p-ink">
                {stats.certificates ?? 0}
              </span>
            </Link>
            <Link
              href={href("rewards")}
              className="rounded-cn-p-sm bg-cn-p-page p-4 no-underline transition-colors duration-150 hover:bg-cn-p-soft"
            >
              <span className="flex items-center gap-2 text-[13px] text-cn-p-ink-2">
                <Gift className="h-4 w-4 text-cn-p-accent" />
                Reward points
              </span>
              <span className="mt-1 block text-2xl font-extrabold tabular-nums text-cn-p-ink">
                {points ?? 0}
              </span>
            </Link>
          </div>
        </PortalCard>
      </div>

      {/* Four headline numbers */}
      <div className="grid grid-cols-4 gap-5 max-[72rem]:grid-cols-2 max-[40rem]:grid-cols-1">
        <PortalStat
          label="Enrolled courses"
          value={stats.enrolled_courses ?? 0}
          hint={`${stats.active_courses ?? 0} in progress · ${stats.completed_courses ?? 0} completed`}
          icon={BookMarked}
        />
        <PortalStat
          label="Pending assignments"
          value={stats.pending_assignments ?? 0}
          hint="Waiting on your submission"
          icon={ClipboardList}
          tone="warn"
        />
        <PortalStat
          label="Open quizzes"
          value={stats.upcoming_quizzes ?? 0}
          hint="Available to attempt"
          icon={CircleHelp}
        />
        <PortalStat
          label="Average grade"
          value={`${Math.round(Number(stats.average_grade) || 0)}%`}
          hint="Across your graded work"
          icon={TrendingUp}
          tone="ok"
        />
      </div>

      {/* Continue learning + due this week */}
      <div className="grid grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-5 max-[72rem]:grid-cols-[minmax(0,1fr)]">
        <PortalCard>
          <PortalCardHead
            title="Continue learning"
            action="All courses"
            href={href("courses")}
          />
          {inProgress.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-cn-p-muted">
              Nothing in progress yet. Open a course to get started.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {inProgress.map((row) => (
                <li key={row.id} className="border-b border-cn-p-line last:border-b-0">
                  <Link
                    href={`${href("courses")}?course=${row.courseId}`}
                    className="flex items-center gap-4 px-5 py-4 no-underline transition-colors duration-150 hover:bg-cn-p-page"
                  >
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-cn-p-sm bg-cn-p-soft text-xs font-bold text-cn-p-soft-ink">
                      {row.code ? row.code.split("-")[0] : <BookMarked className="h-5 w-5" strokeWidth={1.9} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-cn-p-ink">
                        {row.label}
                      </span>
                      {row.teacher && (
                        <span className="mt-0.5 block truncate text-[13px] text-cn-p-muted">
                          {row.teacher}
                        </span>
                      )}
                    </span>
                    <span className="flex w-[120px] flex-none flex-col items-end gap-1.5">
                      <span className="text-sm font-semibold tabular-nums text-cn-p-ink">
                        {Math.round(row.percent)}%
                      </span>
                      <PortalBar value={row.percent} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>

        <PortalCard>
          <PortalCardHead
            title="Due this week"
            action="View all"
            href={href("assignments")}
          />
          {dueSoon.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-cn-p-muted">
              Nothing due. You&apos;re all caught up.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {dueSoon.map((row) => {
                const due = formatDue(row.due_date);
                return (
                  <li
                    key={row.id}
                    className="border-b border-cn-p-line last:border-b-0"
                  >
                    <Link
                      href={href("assignments")}
                      className="flex items-center gap-3 px-5 py-4 no-underline transition-colors duration-150 hover:bg-cn-p-page"
                    >
                      <span className="grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm bg-cn-p-soft text-cn-p-soft-ink">
                        <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-cn-p-ink">
                          {row.title}
                        </span>
                        <span className="block truncate text-xs text-cn-p-muted">
                          {row.course?.title || row.module?.title || "Assignment"}
                        </span>
                      </span>
                      {due && (
                        <span
                          className={`flex-none rounded-full px-2.5 py-1 text-xs font-semibold ${
                            due.isOverdue
                              ? "bg-cn-p-bad-bg text-cn-p-bad"
                              : "bg-cn-p-warn-bg text-cn-p-warn"
                          }`}
                        >
                          {due.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </PortalCard>
      </div>

      {/* Pathway, today's activity, what's next */}
      <div className="grid grid-cols-3 gap-5 max-[72rem]:grid-cols-1">
        <MyPathwaysSummary />

        <PortalCard>
          <PortalCardHead
            title="Today's activity"
            action={`${questsDone} of ${quests.length} done`}
            href={`${href("daily")}/quests`}
          />
          {quests.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-cn-p-muted">
              Today&apos;s quests aren&apos;t ready yet.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {quests.slice(0, 4).map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border-b border-cn-p-line px-5 py-3.5 last:border-b-0"
                >
                  <span
                    className={`grid h-5 w-5 flex-none place-items-center rounded-full border-2 ${
                      row.status === "COMPLETED"
                        ? "border-cn-p-ok bg-cn-p-ok text-white"
                        : "border-cn-p-line-2"
                    }`}
                  >
                    {row.status === "COMPLETED" && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-cn-p-ink">
                    {row.quest?.title}
                  </span>
                  <span className="flex-none text-xs font-semibold text-cn-p-accent">
                    +{row.quest?.points_reward ?? 0} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>

        <PortalCard>
          <PortalCardHead
            title="Up next"
            action="Live classes"
            href={href("live-classes")}
          />
          {upcomingClasses.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-cn-p-muted">
              No classes scheduled yet.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {upcomingClasses.slice(0, 3).map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border-b border-cn-p-line px-5 py-4 last:border-b-0"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm bg-cn-p-soft text-cn-p-soft-ink">
                    <Video className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-cn-p-ink">
                      {row.title}
                    </span>
                    <span className="block truncate text-xs text-cn-p-muted">
                      {row.course?.title || "Live class"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>
      </div>
    </div>
  );
}
