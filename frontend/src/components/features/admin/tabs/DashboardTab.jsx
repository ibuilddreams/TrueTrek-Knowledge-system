"use client";

import { useEffect } from "react";
import {
  Activity,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Clock3,
} from "lucide-react";
import { useAdminOverview } from "@/hooks/admin/useAdminOverview";
import AdminStatGrid from "@/components/features/admin/AdminStatGrid";
import AdminChartPanel from "@/components/features/admin/AdminChartPanel";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { formatActivityType, formatDateTime } from "@/lib/adminFormatters";

function Panel({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl shadow-sm overflow-hidden min-h-[280px] flex flex-col">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 border-b border-stone-100">
        <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-700 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </span>
          {title}
        </h3>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
}

export default function DashboardTab() {
  const { data, status, error, loadOverview } = useAdminOverview();

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader fullScreen={false} label="Loading Admin Dashboard..." />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
          Failed to Load Dashboard
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">{error}</p>
        <button
          type="button"
          onClick={() => loadOverview({ force: true })}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const statistics = data?.statistics || {};
  const recentActivities = data?.recent_activities || [];
  const progressSummary = data?.progress_summary || [];
  const charts = data?.charts || {};

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold">
              Live Snapshot
            </p>
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Platform Metrics
            </h2>
          </div>
          <button
            type="button"
            onClick={() => loadOverview({ force: true })}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-500 hover:text-amber-800 transition"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
        <AdminStatGrid statistics={statistics} />
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold">
            Distribution
          </p>
          <h2 className="text-lg font-serif font-bold text-stone-900">
            Analytics Overview
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <AdminChartPanel
            title="Users by Role"
            subtitle="Account composition"
            data={charts.users_by_role}
            dataKey="role"
          />
          <AdminChartPanel
            title="Courses by Status"
            subtitle="Catalog pipeline"
            data={charts.courses_by_status}
            dataKey="status"
          />
          <AdminChartPanel
            title="Enrollments by Status"
            subtitle="Seat lifecycle"
            data={charts.enrollments_by_status}
            dataKey="status"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold">
            Operations
          </p>
          <h2 className="text-lg font-serif font-bold text-stone-900">
            Activity & Progress
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel
            title="Recent Activities"
            icon={Activity}
            action={
              recentActivities.length > 0 && (
                <span className="text-[10px] font-mono font-semibold text-stone-400">
                  {recentActivities.length} total
                </span>
              )
            }
          >
            {recentActivities.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                label="No recent activity"
                description="New enrollments, completions, and admin actions will show up here."
                compact
              />
            ) : (
              <ul className="space-y-2 max-h-90 overflow-y-auto pr-1.5 -mr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar-thumb]:rounded-full [&:hover::-webkit-scrollbar-thumb]:bg-stone-300">
                {recentActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50/60 hover:bg-white hover:border-amber-200/60 hover:shadow-sm transition"
                  >
                    <span className="mt-0.5 w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock3 className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-stone-800 truncate">
                        {formatActivityType(activity.activity_type)}
                      </p>
                      <p className="text-[11px] font-mono text-stone-400 mt-1">
                        {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Progress Summary"
            icon={TrendingUp}
            action={
              progressSummary.length > 0 && (
                <span className="text-[10px] font-mono font-semibold text-stone-400">
                  {progressSummary.length} total
                </span>
              )
            }
          >
            {progressSummary.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                label="No progress data yet"
                description="Course completion averages will populate as learners engage."
                compact
              />
            ) : (
              <ul className="space-y-2.5 max-h-90 overflow-y-auto pr-1.5 -mr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar-thumb]:rounded-full [&:hover::-webkit-scrollbar-thumb]:bg-stone-300">
                {progressSummary.map((entry, index) => {
                  const percent = Number(
                    entry.completion_percentage ?? entry.progress ?? 0
                  );
                  const clampedPercent = Math.min(Math.max(percent, 0), 100);
                  const barColorClass =
                    clampedPercent >= 75
                      ? "from-emerald-500 to-emerald-700"
                      : clampedPercent >= 40
                      ? "from-amber-500 to-amber-700"
                      : "from-rose-400 to-rose-600";
                  return (
                    <li
                      key={entry.id ?? index}
                      className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-white hover:border-amber-200/60 transition"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs font-semibold text-stone-800 truncate">
                          {entry.course_title ||
                            entry.title ||
                            `Entry ${index + 1}`}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-800 shrink-0">
                          {percent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColorClass} transition-all duration-500`}
                          style={{ width: `${clampedPercent}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}
