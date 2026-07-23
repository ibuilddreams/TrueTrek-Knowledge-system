"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Activity,
  Lock,
  AlertCircle,
  RefreshCw,
  Inbox,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { getDashboardOverview } from "@/services/adminService";
import StatCard from "@/components/ui/StatCard";
import Loader from "@/components/ui/Loader";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AccountMenu from "@/components/ui/AccountMenu";
import { toastSuccess } from "@/lib/toast";

const CHART_COLORS = ["#d97706", "#b45309", "#92400e", "#78350f", "#57534e"];

function formatActivityType(activityType) {
  if (!activityType) return "Activity";
  return activityType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await getDashboardOverview();
      setOverview(response?.data || null);
      setStatus("succeeded");
    } catch (err) {
      setError(err?.message || "Unable to load dashboard data.");
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadOverview();
    }
  }, [isAuthenticated, isAdmin, loadOverview]);

  const handleSignOut = async () => {
    await logout();
    toastSuccess("Logged out.");
    router.replace(ROUTES.LOGIN);
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <AuthGateCard
        id="admin-gate-container"
        icon={Lock}
        title="Admin Access Required"
        subtitle="Sign in with an administrator account to view system-wide statistics and activity."
      >
        <button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition"
        >
          Go to Sign In
        </button>
      </AuthGateCard>
    );
  }

  if (status === "loading" || status === "idle") {
    return <Loader label="Loading Admin Dashboard..." />;
  }

  if (status === "failed") {
    return (
      <div id="admin-dashboard-error" className="py-16 px-4 max-w-lg mx-auto font-sans">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-xs text-stone-500 font-light mb-6">{error}</p>
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statistics = overview?.statistics || {};
  const recentActivities = overview?.recent_activities || [];
  const progressSummary = overview?.progress_summary || [];
  const charts = overview?.charts || {};

  return (
    <div id="admin-dashboard-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Admin Control Center</h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            System-wide statistics, analytics, and recent activity.
          </p>
        </div>
        <AccountMenu onProfile={() => router.push(ROUTES.PROFILE)} onSignOut={handleSignOut} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard label="Total Users" value={statistics.total_users ?? 0} icon={Users} />
        <StatCard label="Total Students" value={statistics.total_students ?? 0} icon={GraduationCap} />
        <StatCard label="Total Teachers" value={statistics.total_teachers ?? 0} icon={Users} />
        <StatCard label="Total Courses" value={statistics.total_courses ?? 0} icon={BookOpen} />
        <StatCard label="Total Enrollments" value={statistics.total_enrollments ?? 0} icon={ClipboardList} />
        <StatCard
          label="Avg. Course Completion"
          value={`${statistics.average_course_completion ?? 0}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <ChartPanel title="Users by Role" data={charts.users_by_role} dataKey="role" />
        <ChartPanel title="Courses by Status" data={charts.courses_by_status} dataKey="status" />
        <ChartPanel title="Enrollments by Status" data={charts.enrollments_by_status} dataKey="status" />
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

function ChartPanel({ title, data, dataKey }) {
  const chartData = data || [];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-700 mb-4">{title}</h3>
      {chartData.length === 0 ? (
        <EmptyState label="No data available." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey={dataKey} tick={{ fontSize: 11, fill: "#78716c" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, borderColor: "#e7e5e4", fontSize: 12 }}
              labelStyle={{ color: "#292524", fontWeight: 600 }}
              itemStyle={{ color: "#78350f" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={entry[dataKey] || index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-stone-400">
      <Inbox className="w-6 h-6" />
      <p className="text-xs font-light">{label}</p>
    </div>
  );
}
