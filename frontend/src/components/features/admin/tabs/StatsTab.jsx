"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAdminOverview } from "@/hooks/admin/useAdminOverview";
import AdminStatGrid from "@/components/features/admin/AdminStatGrid";
import AdminChartPanel from "@/components/features/admin/AdminChartPanel";
import Loader from "@/components/ui/Loader";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

export default function StatsTab() {
  const { data, status, error, loadOverview } = useAdminOverview();

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (status === "loading" || status === "idle") {
    return <Loader tone="cobalt" fullScreen={false} label="Loading statistics..." />;
  }

  if (status === "failed") {
    return (
      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-cn-p-bad-bg border border-cn-p-bad-bg text-cn-p-bad rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-cn-p-ink mb-2">Failed to Load Statistics</h2>
        <p className="text-sm text-cn-p-ink-2 font-light mb-6">{error}</p>
        <button
          type="button"
          onClick={() => loadOverview({ force: true })}
          className="inline-flex items-center gap-2 px-5 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-bold text-sm rounded-cn-p-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const statistics = data?.statistics || {};
  const charts = data?.charts || {};

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Platform metrics"
        subtitle="How the platform is being used, across every account."
      />

      <AdminStatGrid statistics={statistics} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminChartPanel title="Users by role" data={charts.users_by_role} dataKey="role" />
        <AdminChartPanel title="Courses by status" data={charts.courses_by_status} dataKey="status" />
        <AdminChartPanel title="Enrollments by status" data={charts.enrollments_by_status} dataKey="status" />
      </div>
    </div>
  );
}
