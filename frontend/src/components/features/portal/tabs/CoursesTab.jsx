"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Award,
  BookMarked,
  BookOpen,
  Play,
  RefreshCw,
  Route,
  Search,
  TrendingUp,
} from "lucide-react";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Loader from "@/components/ui/Loader";
import PortalCard, { PortalBar, PortalStat } from "../shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPageHead,
  PortalPill,
  PortalSearchBox,
  PortalSegmented,
} from "../shell/PortalUI";
import CourseDetailScreen from "../course-detail/CourseDetailScreen";
import LessonViewPending from "../lesson-view/LessonViewPending";
import MorePathwaysPicker from "../MorePathwaysPicker";

// The design's four filters are read off progress, not enrollment status:
// a student browsing their library is asking "what have I not started?",
// which no enrollment status answers.
const FILTERS = [
  { value: "all", label: "All" },
  { value: "in-progress", label: "In progress" },
  { value: "not-started", label: "Not started" },
  { value: "completed", label: "Completed" },
];

function progressOf(enrollment) {
  return Math.round(Number(enrollment?.completion_percentage) || 0);
}

function matchesFilter(enrollment, filter) {
  const percent = progressOf(enrollment);
  if (filter === "completed") return percent === 100 || enrollment.is_completed;
  if (filter === "in-progress") return percent > 0 && percent < 100;
  if (filter === "not-started") return percent === 0;
  return true;
}

/** `.ccard` — one course in the library grid. */
function CourseCard({ enrollment, onOpen }) {
  const course = enrollment.course || {};
  const percent = progressOf(enrollment);
  const isComplete = percent === 100 || enrollment.is_completed;
  const stats = enrollment.stats || {};
  const moduleCount = stats.total_modules ?? course.modules?.length ?? null;
  const lessonCount = stats.total_lessons ?? null;
  const instructor =
    enrollment.teacher?.name ||
    course.instructors?.find((item) => item.is_lead)?.name ||
    course.instructors?.[0]?.name;

  const meta = [
    instructor,
    moduleCount != null ? `${moduleCount} module${moduleCount === 1 ? "" : "s"}` : null,
    lessonCount != null ? `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer flex-col gap-3.5 rounded-cn-p border border-cn-p-line bg-cn-p-card p-5 text-left transition-[border-color,box-shadow] duration-150 hover:border-cn-p-accent-soft hover:shadow-[0_8px_24px_-18px_rgba(36,80,230,0.6)]"
    >
      <div className="flex items-center justify-between gap-3">
        <PortalPill tone="blue">{course.code || "Course"}</PortalPill>
        {isComplete ? (
          <PortalPill tone="ok">Completed</PortalPill>
        ) : percent > 0 ? (
          <PortalPill tone="warn">In progress</PortalPill>
        ) : (
          <PortalPill>Not started</PortalPill>
        )}
      </div>

      <span className="text-base leading-[1.3] font-bold text-cn-p-ink">
        {course.title}
      </span>

      {meta && <span className="text-[13px] text-cn-p-ink-2">{meta}</span>}

      <div className="mt-auto flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span className="truncate text-cn-p-ink-2">
            {isComplete
              ? "Finished"
              : enrollment.next_lesson?.title
                ? `Next: ${enrollment.next_lesson.title}`
                : ""}
          </span>
          <b className="flex-none font-bold tabular-nums text-cn-p-ink">{percent}%</b>
        </div>
        <PortalBar value={percent} />
      </div>
    </button>
  );
}

export default function CoursesTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCourseId = searchParams.get("course");
  // Deep-linking straight into a lesson/quiz/assignment — while enrollments are still
  // loading, show the same takeover the lesson view itself uses instead of this tab's
  // own inline loader, so the screen never flashes the library on refresh.
  const isDeepLinkingIntoContent = Boolean(selectedCourseId && searchParams.get("content"));

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [filter, setFilter] = useState("all");

  function openCourse(courseId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("course", String(courseId));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function closeCourse() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("course");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const {
    data: enrollments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["studentEnrollments"],
    queryFn: async () => {
      const response = await getStudentEnrollments({ page: 1, pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [selectedCourseId]);

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      const course = enrollment.course || {};
      const haystack = `${course.title || ""} ${course.code || ""} ${
        course.category?.name || ""
      }`.toLowerCase();
      return (!query || haystack.includes(query)) && matchesFilter(enrollment, filter);
    });
  }, [enrollments, debouncedSearch, filter]);

  const averageProgress = useMemo(() => {
    if (enrollments.length === 0) return 0;
    const total = enrollments.reduce((sum, item) => sum + progressOf(item), 0);
    return Math.round(total / enrollments.length);
  }, [enrollments]);

  const inProgressCount = enrollments.filter((item) => {
    const percent = progressOf(item);
    return percent > 0 && percent < 100;
  }).length;
  const completedCount = enrollments.filter(
    (item) => item.is_completed || progressOf(item) === 100,
  ).length;

  if (isLoading) {
    if (isDeepLinkingIntoContent) return <LessonViewPending />;
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading your courses..." />
      </div>
    );
  }

  if (isError) {
    if (isDeepLinkingIntoContent) {
      return (
        <LessonViewPending
          isError
          errorMessage={getApiErrorMessage(error, "Unable to load your enrolled courses.")}
          onRetry={() => refetch()}
        />
      );
    }
    return (
      <PortalCard>
        <PortalEmpty
          icon={AlertCircle}
          title="Couldn't load your courses"
          text={getApiErrorMessage(error, "Unable to load your enrolled courses.")}
        >
          <PortalButton onClick={() => refetch()}>
            <RefreshCw className="h-[18px] w-[18px]" />
            Retry
          </PortalButton>
        </PortalEmpty>
      </PortalCard>
    );
  }

  if (selectedCourseId) {
    const selectedEnrollment = enrollments.find(
      (item) => String(item.course?.id) === String(selectedCourseId),
    );

    if (!selectedEnrollment) {
      return (
        <PortalCard>
          <PortalEmpty
            icon={AlertCircle}
            title="Course not found"
            text="We couldn't find that course in your enrollments."
          >
            <PortalButton onClick={closeCourse}>Back to My courses</PortalButton>
          </PortalEmpty>
        </PortalCard>
      );
    }

    return <CourseDetailScreen enrollment={selectedEnrollment} onBack={closeCourse} />;
  }

  if (enrollments.length === 0) {
    return (
      <>
        <PortalPageHead
          title="My courses"
          subtitle="Every course you are enrolled in, grouped by progress."
        />
        <PortalCard>
          <PortalEmpty
            icon={BookMarked}
            title="No courses yet"
            text="Once you are enrolled in a course, it will appear here with your live progress."
          />
        </PortalCard>
        <MorePathwaysPicker />
      </>
    );
  }

  return (
    <>
      <PortalPageHead
        title="My courses"
        subtitle="Every course you are enrolled in, grouped by progress."
      >
        <PortalButton variant="sec" onClick={() => router.push("/pathways")}>
          <Route className="h-[18px] w-[18px]" />
          Explore pathways
        </PortalButton>
      </PortalPageHead>

      <section className="grid grid-cols-4 gap-5 max-[73.75rem]:grid-cols-2 max-[40rem]:grid-cols-1">
        <PortalStat
          label="Average progress"
          value={`${averageProgress}%`}
          hint={`Across ${enrollments.length} course${enrollments.length === 1 ? "" : "s"}`}
          icon={TrendingUp}
        />
        <PortalStat
          label="Enrolled"
          value={enrollments.length}
          hint="Total enrollments"
          icon={BookOpen}
        />
        <PortalStat
          label="In progress"
          value={inProgressCount}
          hint="Started, not finished"
          icon={Play}
          tone="warn"
        />
        <PortalStat
          label="Completed"
          value={completedCount}
          hint="Certificates earned"
          icon={Award}
          tone="ok"
        />
      </section>

      <PortalCard>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-cn-p-line p-4">
          <PortalSearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search by title, code or category"
          />
          <PortalSegmented
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            ariaLabel="Filter courses by progress"
          />
          <span className="ml-auto text-[13px] text-cn-p-ink-2">
            {filtered.length} course{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <PortalEmpty
            icon={Search}
            title="No courses match"
            text="Try another filter."
          />
        ) : (
          <div className="grid grid-cols-3 gap-5 p-5 max-[73.75rem]:grid-cols-2 max-[40rem]:grid-cols-1">
            {filtered.map((enrollment) => (
              <CourseCard
                key={enrollment.id}
                enrollment={enrollment}
                onOpen={() => openCourse(enrollment.course?.id)}
              />
            ))}
          </div>
        )}
      </PortalCard>

      <MorePathwaysPicker />
    </>
  );
}
