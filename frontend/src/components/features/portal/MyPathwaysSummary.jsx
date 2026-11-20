"use client";

import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Route, Wand2 } from "lucide-react";
import {
  getMyPathways,
  getPublicPathwayById,
} from "@/services/pathwaysService";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import PortalCard, { PortalBar, PortalCardHead } from "./shell/PortalCard";
import { portalHref } from "./shell/portalNav";
import PathwayCoursesModal from "./PathwayCoursesModal";

// "Since 4 Nov 2026" — day before month, as the design writes it.
function formatEnrolledDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// What the design's own card counts and averages: the courses *in this
// pathway the student is actually enrolled on*, and the mean of their
// completion. A pathway course they never took counts in neither — the line
// reads "N courses enrolled", not "N courses in the bundle".
function summarise(detail, enrollments) {
  if (!detail) return null;
  const pathwayCourseIds = new Set(
    (detail.courses || [])
      .map((entry) => entry.course?.id)
      .filter((id) => id != null),
  );
  const rows = enrollments.filter((row) =>
    pathwayCourseIds.has(row.course?.id),
  );
  const percent = rows.length
    ? Math.round(
        rows.reduce(
          (total, row) => total + (Number(row.completion_percentage) || 0),
          0,
        ) / rows.length,
      )
    : 0;
  return { enrolledCount: rows.length, percent };
}

export default function MyPathwaysSummary() {
  const { isStudent } = useAuth();
  // Keep the pathway around after closing so the modal's exit animation
  // doesn't flash empty content.
  const [activePathway, setActivePathway] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: pathwayEnrollments = [] } = useQuery({
    queryKey: ["my-pathways"],
    queryFn: async () => {
      const response = await getMyPathways();
      return response?.data || [];
    },
    enabled: isStudent,
  });

  // The same key the dashboard's "Continue learning" panel already uses, so
  // the progress line costs no extra request on the screen that shows it.
  const { data: courseEnrollments = [] } = useQuery({
    queryKey: ["student-enrollments", "dashboard"],
    queryFn: async () => {
      const response = await getStudentEnrollments({ pageSize: 100 });
      const data = response?.data;
      return data?.results ?? data ?? [];
    },
    enabled: isStudent,
  });

  // Which courses a pathway holds isn't on the enrolment payload, so each
  // bundle's public detail is read for it — the same query key (and therefore
  // the same cached response) the courses modal below uses.
  const detailQueries = useQueries({
    queries: pathwayEnrollments.map((entry) => ({
      queryKey: ["public-pathway-detail", entry.pathway?.id],
      queryFn: async () => {
        const response = await getPublicPathwayById(entry.pathway.id);
        return response?.data || null;
      },
      enabled: Boolean(entry.pathway?.id),
    })),
  });

  // Purely informational — course-level access already works independently
  // of pathway entitlements, so this stays silent when there's nothing to
  // show instead of competing for attention with the rest of the dashboard.
  if (pathwayEnrollments.length === 0) return null;

  const isOne = pathwayEnrollments.length === 1;

  return (
    <PortalCard className="flex flex-col">
      <PortalCardHead
        title={isOne ? "My pathway" : "My pathways"}
        action="Open"
        href={portalHref(AUTH_ROLES.STUDENT, "courses")}
      />

      <div className="flex flex-1 flex-col">
        {pathwayEnrollments.map((entry, index) => {
          const pathway = entry.pathway || {};
          const enrolledSince = formatEnrolledDate(entry.enrolled_at);
          const stats = summarise(detailQueries[index]?.data, courseEnrollments);
          const Icon = pathway.is_custom ? Wand2 : Route;

          return (
            <div
              key={entry.id}
              className={`flex flex-1 flex-col gap-4 p-5 ${
                index > 0 ? "border-t border-cn-p-line" : ""
              }`}
            >
              {/* The pathway itself. A button, because its course list is a
                  dialog rather than a page of its own. */}
              <button
                type="button"
                onClick={() => {
                  setActivePathway(pathway);
                  setIsModalOpen(true);
                }}
                aria-haspopup="dialog"
                className="group flex items-start gap-3 text-left"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-cn-p-soft text-cn-p-soft-ink">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <b className="font-bold text-cn-p-ink group-hover:underline">
                    {pathway.name}
                  </b>
                  {/* Bundles the student built themselves on /pathways/build,
                      so they're not mistaken for an official pathway. */}
                  {pathway.is_custom && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-cn-p-soft px-2 py-0.5 text-xs font-semibold text-cn-p-soft-ink">
                      <Wand2 className="h-3 w-3" />
                      Built by you
                    </span>
                  )}
                  {pathway.summary && (
                    <span className="text-[13px] leading-[1.5] text-cn-p-muted">
                      {pathway.summary}
                    </span>
                  )}
                </span>
              </button>

              {/* The closing line, pinned to the bottom of the card so this
                  column's base sits level with the two beside it. */}
              <div className="mt-auto flex flex-col gap-2">
                {stats ? (
                  <>
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="text-cn-p-muted">
                        {stats.enrolledCount} course
                        {stats.enrolledCount === 1 ? "" : "s"} enrolled
                      </span>
                      <b className="font-bold tabular-nums text-cn-p-ink">
                        {stats.percent}%
                      </b>
                    </div>
                    <PortalBar value={stats.percent} size="lg" />
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="block h-4 w-32 rounded bg-cn-p-neutral-bg"
                    />
                    <PortalBar value={0} size="lg" />
                  </>
                )}
                {enrolledSince && (
                  <span className="text-xs text-cn-p-muted">
                    Since {enrolledSince}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PathwayCoursesModal
        pathway={activePathway}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </PortalCard>
  );
}
