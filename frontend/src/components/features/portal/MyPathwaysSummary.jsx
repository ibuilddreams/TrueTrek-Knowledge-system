"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Route } from "lucide-react";
import { getMyPathways } from "@/services/pathwaysService";
import { useAuth } from "@/hooks/useAuth";
import PathwayCoursesModal from "./PathwayCoursesModal";

function formatEnrolledDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

  // Purely informational — course-level access already works independently
  // of pathway entitlements, so this stays silent when there's nothing to
  // show instead of competing for attention with the rest of the dashboard.
  if (pathwayEnrollments.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-5 sm:p-7 shadow-[0_10px_36px_-28px_rgba(28,25,23,0.3)] border-line/80 bg-paper"
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] mb-1 text-pine/80">
            Bundled Access
          </p>
          <h3 className="text-lg font-serif font-bold text-ink">
            My Pathways
          </h3>
        </div>
        <span className="text-sm font-light text-muted">
          {pathwayEnrollments.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pathwayEnrollments.map((entry) => {
          const pathway = entry.pathway || {};
          const enrolledSince = formatEnrolledDate(entry.enrolled_at);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                setActivePathway(pathway);
                setIsModalOpen(true);
              }}
              aria-haspopup="dialog"
              className="group flex gap-3 p-3.5 rounded-xl border border-line bg-porcelain text-left w-full cursor-pointer transition hover:border-gold/50 hover:bg-paper hover:shadow-[0_10px_28px_-22px_rgba(28,25,23,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              <div className="w-11 h-11 rounded-lg border shrink-0 overflow-hidden flex items-center justify-center border-line bg-paper">
                <Route className="w-4 h-4 text-pine" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate text-ink">
                  {pathway.name}
                </span>
                {pathway.summary && (
                  <span className="block text-xs mt-0.5 line-clamp-2 font-light text-muted">
                    {pathway.summary}
                  </span>
                )}
                {enrolledSince && (
                  <span className="block text-[11px] font-mono uppercase tracking-wide mt-1.5 text-muted">
                    Since {enrolledSince}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 mt-1 shrink-0 text-muted group-hover:text-pine group-hover:translate-x-0.5 transition" />
            </button>
          );
        })}
      </div>

      <PathwayCoursesModal
        pathway={activePathway}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
