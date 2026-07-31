"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Award,
  BookMarked,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { getStudentDashboardStats } from "@/services/studentDashboardService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

export default function DashboardTab() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["studentDashboard"],
    queryFn: async () => {
      const response = await getStudentDashboardStats();
      return response?.data || null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading your dashboard..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
          Failed to Load Dashboard
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">
          {getApiErrorMessage(error, "Unable to load your dashboard.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const stats = data?.statistics || {};
  const progressByCourse = (data?.charts?.progress_by_course || []).map((row) => ({
    name: row.course,
    Progress: Math.round(Number(row.percentage) || 0),
  }));

  const enrolledCourses = stats.enrolled_courses || 0;
  const activeCourses = stats.active_courses || 0;
  const completedCourses = stats.completed_courses || 0;
  const overallProgress = Math.round(stats.overall_progress || 0);
  const pendingAssignments = stats.pending_assignments || 0;
  const upcomingQuizzes = stats.upcoming_quizzes || 0;
  const certificates = stats.certificates || 0;
  const averageGrade = Math.round(stats.average_grade || 0);

  const isEmpty = enrolledCourses === 0;

  if (isEmpty) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
        <EmptyState
          icon={BookMarked}
          label="No dashboard data yet"
          description="Once you are enrolled in courses, your progress, grades, and learning stats will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="max-w-xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-700/80 mb-2">
            Learning Overview
          </p>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Your student dashboard
          </h2>
          <p className="text-sm text-stone-500 font-light mt-1.5 leading-relaxed">
            A clear snapshot of enrollments, progress, assignments, and grades across your courses.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3 min-w-[160px]">
          <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
            Overall progress
          </p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-serif font-bold text-amber-800 leading-none">
              {overallProgress}%
            </p>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-2.5">
            <motion.div
              className="h-full rounded-full bg-amber-600"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Enrolled Courses"
          value={enrolledCourses}
          icon={BookMarked}
          accent="amber"
          hint="Total courses assigned to you"
        />
        <StatCard
          label="Active Courses"
          value={activeCourses}
          icon={BookOpen}
          accent="stone"
          hint="Currently in progress"
        />
        <StatCard
          label="Completed Courses"
          value={completedCourses}
          icon={CheckCircle2}
          accent="emerald"
          hint="Finished learning paths"
        />
        <StatCard
          label="Overall Progress"
          value={`${overallProgress}%`}
          icon={TrendingUp}
          accent="amber"
          hint="Average across all courses"
        />
        <StatCard
          label="Pending Assignments"
          value={pendingAssignments}
          icon={ClipboardList}
          accent="rose"
          hint="Still waiting on your work"
        />
        <StatCard
          label="Upcoming Quizzes"
          value={upcomingQuizzes}
          icon={CircleHelp}
          accent="stone"
          hint="Available quizzes to take"
        />
        <StatCard
          label="Certificates"
          value={certificates}
          icon={Award}
          accent="emerald"
          hint="Earned from completed courses"
        />
        <StatCard
          label="Average Grade"
          value={`${averageGrade}%`}
          icon={TrendingUp}
          accent="amber"
          hint="Across graded quiz attempts"
        />
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-700/80 mb-1">
            Course progress
          </p>
          <h3 className="text-lg font-serif font-bold text-stone-900">
            Progress by enrolled course
          </h3>
        </div>

        {progressByCourse.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            label="No progress recorded yet"
            description="Start a lesson to see your course progress chart here."
            compact
          />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={progressByCourse}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#a8a29e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fill: "#78716c" }}
                />
                <YAxis
                  stroke="#a8a29e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Progress"]}
                  contentStyle={{
                    backgroundColor: "#1c1917",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="Progress" fill="#d97706" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
