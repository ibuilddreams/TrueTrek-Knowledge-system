"use client";

import { useQuery } from "@tanstack/react-query";
import { Route } from "lucide-react";
import { getMyPathways } from "@/services/pathwaysService";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

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
  const { isVault } = useTheme();
  const { isStudent } = useAuth();

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
      className={`rounded-2xl border p-5 sm:p-7 shadow-[0_10px_36px_-28px_rgba(28,25,23,0.3)] ${
        isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200/80 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p
            className={`text-[10px] font-mono uppercase tracking-[0.16em] mb-1 ${
              isVault ? "text-amber-500" : "text-amber-700/80"
            }`}
          >
            Bundled Access
          </p>
          <h3 className={`text-lg font-serif font-bold ${isVault ? "text-stone-50" : "text-stone-900"}`}>
            My Pathways
          </h3>
        </div>
        <span className={`text-xs font-light ${isVault ? "text-stone-500" : "text-stone-400"}`}>
          {pathwayEnrollments.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pathwayEnrollments.map((entry) => {
          const pathway = entry.pathway || {};
          const enrolledSince = formatEnrolledDate(entry.enrolled_at);
          return (
            <div
              key={entry.id}
              className={`flex gap-3 p-3.5 rounded-xl border ${
                isVault ? "border-stone-800 bg-stone-900/40" : "border-stone-200 bg-stone-50"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-lg border shrink-0 overflow-hidden flex items-center justify-center ${
                  isVault ? "border-stone-700 bg-stone-950" : "border-stone-200 bg-white"
                }`}
              >
                {pathway.image ? (
                  <img
                    src={pathway.image}
                    alt={pathway.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Route className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs font-bold truncate ${isVault ? "text-stone-100" : "text-stone-900"}`}
                >
                  {pathway.name}
                </p>
                {pathway.summary && (
                  <p
                    className={`text-[11px] mt-0.5 line-clamp-2 font-light ${
                      isVault ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    {pathway.summary}
                  </p>
                )}
                {enrolledSince && (
                  <p
                    className={`text-[10px] font-mono uppercase tracking-wide mt-1.5 ${
                      isVault ? "text-stone-500" : "text-stone-400"
                    }`}
                  >
                    Since {enrolledSince}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
