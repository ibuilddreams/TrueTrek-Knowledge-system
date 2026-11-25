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
import PortalCard from "@/components/features/portal/shell/PortalCard";
import EmptyState from "@/components/ui/EmptyState";
import { formatActivityType, formatDateTime } from "@/lib/adminFormatters";

function Panel({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden min-h-[280px] flex flex-col">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 border-b border-cn-p-line">
        <h3 className="text-base font-bold tracking-[-0.01em] text-cn-p-ink flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-cn-p-soft border border-cn-p-soft text-cn-p-soft-ink flex items-center justify-center">
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
        <Loader tone="cobalt" fullScreen={false} label="Loading admin dashboard..." />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-cn-p-bad-bg border border-cn-p-bad-bg text-cn-p-bad rounded-cn-p flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-cn-p-ink mb-2">
          Failed to load dashboard
        </h2>
        <p className="text-sm text-cn-p-ink-2 font-light mb-6">{error}</p>
        <button
          type="button"
          onClick={() => loadOverview({ force: true })}
          className="inline-flex items-center gap-2 px-5 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-semibold text-sm rounded-cn-p-sm transition"
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {/* The design's control-center hero. Its mock leads with a queue of
          things awaiting a decision — applications, redemptions, requests and
          concerns — but the admin overview endpoint returns none of those four
          counts, so this states what the API actually knows rather than
          inventing a number. */}
      <PortalCard tone="accent" className="p-8">
        <p className="text-sm font-semibold text-white/80">Control center</p>
        <h2 className="mt-2 text-[26px] leading-[1.2] font-bold tracking-[-0.015em]">
          {(statistics.total_users ?? 0).toLocaleString()} accounts across{" "}
          {(statistics.total_courses ?? 0).toLocaleString()} courses.
        </h2>
        <p className="mt-1 text-white/80">
          {(statistics.total_enrollments ?? 0).toLocaleString()} enrolments, averaging{" "}
          {Math.round(statistics.average_course_completion ?? 0)}% completion.
        </p>
      </PortalCard>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-cn-p-ink">
            Platform metrics
          </h2>
          <button
            type="button"
            onClick={() => loadOverview({ force: true })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-cn-p-accent transition hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
        <AdminStatGrid statistics={statistics} />
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-cn-p-ink">
          Analytics overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <AdminChartPanel
            title="Users by role"
            subtitle="Account composition"
            data={charts.users_by_role}
            dataKey="role"
          />
          <AdminChartPanel
            title="Courses by status"
            subtitle="Catalog pipeline"
            data={charts.courses_by_status}
            dataKey="status"
          />
          <AdminChartPanel
            title="Enrollments by status"
            subtitle="Seat lifecycle"
            data={charts.enrollments_by_status}
            dataKey="status"
          />
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-cn-p-ink">
          Activity &amp; progress
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Panel
            title="Recent activities"
            icon={Activity}
            action={
              recentActivities.length > 0 && (
                <span className="text-xs font-sans font-medium text-cn-p-ink-2">
                  {recentActivities.length} total
                </span>
              )
            }
          >
            {recentActivities.length === 0 ? (
              <EmptyState tone="portal" size="lg"
                icon={Sparkles}
                label="No recent activity"
                description="New enrollments, completions, and admin actions will show up here."
                compact
              />
            ) : (
              <ul className="space-y-2 max-h-90 overflow-y-auto pr-1.5 -mr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-cn-p-line [&::-webkit-scrollbar-thumb]:rounded-full [&:hover::-webkit-scrollbar-thumb]:bg-cn-p-line-2">
                {recentActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-cn-p border border-cn-p-line bg-cn-p-page hover:bg-cn-p-card hover:border-cn-p-soft hover:shadow-soft transition"
                  >
                    <span className="mt-0.5 w-8 h-8 rounded-cn-p bg-cn-p-soft border border-cn-p-soft text-cn-p-soft-ink flex items-center justify-center shrink-0">
                      <Clock3 className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-cn-p-ink truncate">
                        {formatActivityType(activity.activity_type)}
                      </p>
                      <p className="text-sm text-cn-p-ink-2 mt-1">
                        {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Progress summary"
            icon={TrendingUp}
            action={
              progressSummary.length > 0 && (
                <span className="text-xs font-sans font-medium text-cn-p-ink-2">
                  {progressSummary.length} total
                </span>
              )
            }
          >
            {progressSummary.length === 0 ? (
              <EmptyState tone="portal" size="lg"
                icon={TrendingUp}
                label="No progress data yet"
                description="Course completion averages will populate as learners engage."
                compact
              />
            ) : (
              <ul className="space-y-2.5 max-h-90 overflow-y-auto pr-1.5 -mr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-cn-p-line [&::-webkit-scrollbar-thumb]:rounded-full [&:hover::-webkit-scrollbar-thumb]:bg-cn-p-line-2">
                {progressSummary.map((entry, index) => {
                  const percent = Number(
                    entry.completion_percentage ?? entry.progress ?? 0
                  );
                  const clampedPercent = Math.min(Math.max(percent, 0), 100);
                  const barColorClass =
                    clampedPercent >= 75
                      ? "bg-cn-p-ok"
                      : clampedPercent >= 40
                      ? "bg-cn-p-accent"
                      : "bg-cn-p-bad";
                  return (
                    <li
                      key={entry.id ?? index}
                      className="p-3.5 rounded-cn-p border border-cn-p-line bg-cn-p-page hover:bg-cn-p-card hover:border-cn-p-soft transition"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm font-semibold text-cn-p-ink truncate">
                          {entry.course_title ||
                            entry.title ||
                            `Entry ${index + 1}`}
                        </span>
                        <span className="text-sm font-bold text-cn-p-accent shrink-0">
                          {percent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-cn-p-page overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColorClass} transition-all duration-500`}
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
