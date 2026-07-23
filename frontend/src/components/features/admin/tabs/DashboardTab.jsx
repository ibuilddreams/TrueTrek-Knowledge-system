"use client";

import { useEffect } from "react";
import { Activity, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { useAdminOverview } from "@/hooks/admin/useAdminOverview";
import AdminStatGrid from "@/components/features/admin/AdminStatGrid";
import AdminChartPanel from "@/components/features/admin/AdminChartPanel";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { formatActivityType, formatDateTime } from "@/lib/adminFormatters";

export default function DashboardTab() {
  const { data, status, error, loadOverview } = useAdminOverview();

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (status === "loading" || status === "idle") {
    return <Loader fullScreen={false} label="Loading Admin Dashboard..." />;
  }

  if (status === "failed") {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">Failed to Load Dashboard</h2>
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
    <div className="space-y-10">
      <AdminStatGrid statistics={statistics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminChartPanel title="Users by Role" data={charts.users_by_role} dataKey="role" />
        <AdminChartPanel title="Courses by Status" data={charts.courses_by_status} dataKey="status" />
        <AdminChartPanel title="Enrollments by Status" data={charts.enrollments_by_status} dataKey="status" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            Recent Activities
          </h3>
          {recentActivities.length === 0 ? (
            <EmptyState label="No recent activity." />
          ) : (
            <ul className="space-y-3">
              {recentActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-stone-100 bg-stone-50/60"
                >
                  <span className="text-xs font-semibold text-stone-800">
                    {formatActivityType(activity.activity_type)}
                  </span>
                  <span className="text-[11px] font-mono text-stone-400 shrink-0">
                    {formatDateTime(activity.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            Progress Summary
          </h3>
          {progressSummary.length === 0 ? (
            <EmptyState label="No progress data available yet." />
          ) : (
            <ul className="space-y-3">
              {progressSummary.map((entry, index) => (
                <li
                  key={entry.id ?? index}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-stone-100 bg-stone-50/60"
                >
                  <span className="text-xs font-semibold text-stone-800">
                    {entry.course_title || entry.title || `Entry ${index + 1}`}
                  </span>
                  <span className="text-[11px] font-mono text-stone-400 shrink-0">
                    {entry.completion_percentage ?? entry.progress ?? 0}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
