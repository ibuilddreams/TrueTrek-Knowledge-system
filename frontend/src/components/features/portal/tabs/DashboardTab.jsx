"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
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
  Cell,
} from "recharts";
import { getStudentDashboardStats } from "@/services/studentDashboardService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useTheme } from "@/hooks/useTheme";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

function ProgressRing({ value, size = 128, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-serif font-bold text-white leading-none">
          {value}%
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-stone-400 mt-1.5">
          Progress
        </span>
      </div>
    </div>
  );
}

function CourseStat({ label, value, icon: Icon, delay = 0, isVault }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-center gap-3.5 min-w-0"
    >
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
          isVault ? "bg-white/5 border-white/10 text-stone-300" : "bg-stone-100 border-stone-200/80 text-stone-600"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p
          className={`text-[10px] font-mono uppercase tracking-[0.14em] truncate ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          {label}
        </p>
        <p className={`text-2xl font-serif font-bold leading-none mt-1 ${isVault ? "text-stone-50" : "text-stone-900"}`}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function ActionMetric({ label, value, icon: Icon, tone = "stone", delay = 0, isVault }) {
  const tones = {
    stone: isVault
      ? "bg-white/5 border-white/10 text-stone-300"
      : "bg-stone-50 border-stone-200/80 text-stone-600",
    amber: isVault
      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
      : "bg-amber-50/80 border-amber-100 text-amber-800",
    rose: isVault
      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
      : "bg-rose-50/70 border-rose-100 text-rose-700",
    emerald: isVault
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      : "bg-emerald-50/70 border-emerald-100 text-emerald-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`group relative rounded-2xl border p-5 overflow-hidden transition-shadow ${
        isVault
          ? "border-stone-800 bg-[#161412] hover:shadow-[0_14px_40px_-28px_rgba(0,0,0,0.6)]"
          : "border-stone-200/80 bg-white/90 hover:shadow-[0_14px_40px_-28px_rgba(28,25,23,0.45)]"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[10px] font-mono uppercase tracking-[0.14em] ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            {label}
          </p>
          <p
            className={`text-3xl font-serif font-bold mt-2 tracking-tight ${
              isVault ? "text-stone-50" : "text-stone-900"
            }`}
          >
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tones[tone]}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardTab() {
  const { isVault } = useTheme();
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
      <div
        className={`border rounded-2xl p-8 text-center max-w-lg mx-auto ${
          isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200 bg-white"
        }`}
      >
        <div
          className={`w-12 h-12 border rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isVault
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-rose-50 border-rose-100 text-rose-600"
          }`}
        >
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className={`text-xl font-serif font-bold mb-2 ${isVault ? "text-stone-50" : "text-stone-900"}`}>
          Failed to Load Dashboard
        </h2>
        <p className={`text-xs font-light mb-6 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          {getApiErrorMessage(error, "Unable to load your dashboard.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className={`inline-flex items-center gap-2 px-5 py-3 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition ${
            isVault
              ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
              : "bg-stone-900 hover:bg-stone-800 text-stone-100"
          }`}
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

  if (enrolledCourses === 0) {
    return (
      <div
        className={`border rounded-2xl shadow-sm ${
          isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200 bg-white"
        }`}
      >
        <EmptyState
          icon={BookMarked}
          label="No dashboard data yet"
          description="Once you are enrolled in courses, your progress, grades, and learning stats will appear here."
        />
      </div>
    );
  }

  const barColors = ["#b45309", "#d97706", "#f59e0b", "#78716c", "#a8a29e"];

  return (
    <div className="space-y-7">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[1.75rem] border border-stone-800 bg-stone-950 text-white shadow-[0_24px_60px_-36px_rgba(28,25,23,0.85)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(120,113,108,0.35),_transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:28px_28px]" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/90 mb-3">
                Learning pulse
              </p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white leading-[1.1]">
                Your student
                <span className="block text-stone-300 font-light">dashboard</span>
              </h2>
              <p className="text-sm text-stone-400 font-light mt-3 max-w-md leading-relaxed">
                Track enrollments, momentum, and grades in one calm view — built around how you learn.
              </p>

              <div className="mt-7 flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                    Average grade
                  </p>
                  <p className="text-3xl font-serif font-bold text-amber-400 leading-none">
                    {averageGrade}
                    <span className="text-lg text-amber-500/70 ml-0.5">%</span>
                  </p>
                </div>
                <div className="w-px bg-stone-700/80 self-stretch hidden sm:block" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                    Certificates
                  </p>
                  <p className="text-3xl font-serif font-bold text-white leading-none">
                    {certificates}
                  </p>
                </div>
                <div className="w-px bg-stone-700/80 self-stretch hidden sm:block" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                    Active now
                  </p>
                  <p className="text-3xl font-serif font-bold text-white leading-none">
                    {activeCourses}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-end shrink-0">
              <div className="rounded-full p-3 bg-white/5 border border-white/10 backdrop-blur-sm">
                <ProgressRing value={overallProgress} />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section
        className={`rounded-2xl border px-5 sm:px-7 py-5 sm:py-6 shadow-[0_10px_36px_-28px_rgba(28,25,23,0.35)] ${
          isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200/80 bg-white/90"
        }`}
      >
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x ${
            isVault ? "divide-white/10" : "divide-stone-100"
          }`}
        >
          <div className="sm:pr-4 pt-0">
            <CourseStat
              label="Enrolled Courses"
              value={enrolledCourses}
              icon={BookMarked}
              delay={0.05}
              isVault={isVault}
            />
          </div>
          <div className="sm:px-4 pt-6 sm:pt-0">
            <CourseStat
              label="Active Courses"
              value={activeCourses}
              icon={BookOpen}
              delay={0.1}
              isVault={isVault}
            />
          </div>
          <div className="sm:pl-4 pt-6 sm:pt-0">
            <CourseStat
              label="Completed Courses"
              value={completedCourses}
              icon={CheckCircle2}
              delay={0.15}
              isVault={isVault}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionMetric
          label="Pending Assignments"
          value={pendingAssignments}
          icon={ClipboardList}
          tone="rose"
          delay={0.08}
          isVault={isVault}
        />
        <ActionMetric
          label="Upcoming Quizzes"
          value={upcomingQuizzes}
          icon={CircleHelp}
          tone="stone"
          delay={0.12}
          isVault={isVault}
        />
        <ActionMetric
          label="Average Grade"
          value={`${averageGrade}%`}
          icon={TrendingUp}
          tone="amber"
          delay={0.16}
          isVault={isVault}
        />
      </section>

      <section
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-7 shadow-[0_10px_36px_-28px_rgba(28,25,23,0.3)] ${
          isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200/80 bg-white"
        }`}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p
              className={`text-[10px] font-mono uppercase tracking-[0.16em] mb-1 ${
                isVault ? "text-amber-500" : "text-amber-700/80"
              }`}
            >
              Course progress
            </p>
            <h3 className={`text-xl font-serif font-bold ${isVault ? "text-stone-50" : "text-stone-900"}`}>
              Progress by enrolled course
            </h3>
          </div>
          <p className={`text-xs font-light ${isVault ? "text-stone-500" : "text-stone-400"}`}>
            {progressByCourse.length} course
            {progressByCourse.length === 1 ? "" : "s"} tracked
          </p>
        </div>

        {progressByCourse.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            label="No progress recorded yet"
            description="Start a lesson to see your course progress chart here."
            compact
          />
        ) : (
          <div className="h-72 w-full relative">
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
                  cursor={{ fill: "rgba(120,113,108,0.06)" }}
                  contentStyle={{
                    backgroundColor: "#1c1917",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="Progress" radius={[8, 8, 0, 0]} maxBarSize={44}>
                  {progressByCourse.map((_, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={barColors[index % barColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
