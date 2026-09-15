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
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import MyPathwaysSummary from "../MyPathwaysSummary";

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
          stroke="#c7a85b"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-serif font-bold text-paper leading-none">
          {value}%
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-paper/60 mt-1.5">
          Progress
        </span>
      </div>
    </div>
  );
}

function CourseStat({ label, value, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-center gap-3.5 min-w-0"
    >
      <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 bg-porcelain border-line/80 text-muted">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] truncate text-muted">
          {label}
        </p>
        <p className="text-2xl font-serif font-bold leading-none mt-1 text-ink">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function ActionMetric({ label, value, icon: Icon, tone = "stone", delay = 0 }) {
  const tones = {
    stone: "bg-porcelain border-line/80 text-muted",
    amber: "bg-gold/12 border-gold/25 text-gold",
    rose: "bg-rose-50/70 border-rose-100 text-rose-700",
    emerald: "bg-emerald-50/70 border-emerald-100 text-emerald-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group relative rounded-2xl border p-5 overflow-hidden transition-shadow border-line/80 bg-paper/90 hover:shadow-[0_14px_40px_-28px_rgba(28,25,23,0.45)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
            {label}
          </p>
          <p className="text-3xl font-serif font-bold mt-2 tracking-tight text-ink">
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

function wrapAxisLabel(value, maxCharsPerLine = 16) {
  const words = String(value).split(" ");
  const lines = [""];
  for (const word of words) {
    const lineIndex = lines.length - 1;
    const candidate = lines[lineIndex] ? `${lines[lineIndex]} ${word}` : word;
    if (!lines[lineIndex] || candidate.length <= maxCharsPerLine) {
      lines[lineIndex] = candidate;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      lines[lineIndex] = `${lines[lineIndex]}…`;
      break;
    }
  }
  return lines;
}

function CourseAxisTick({ x, y, payload }) {
  const lines = wrapAxisLabel(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={0}
          dy={12 + index * 13}
          textAnchor="middle"
          fontSize={11}
          fill="#78716c"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

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
      <div className="border rounded-2xl p-8 text-center max-w-lg mx-auto border-line bg-paper">
        <div className="w-12 h-12 border rounded-2xl flex items-center justify-center mx-auto mb-4 bg-rose-50 border-rose-100 text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold mb-2 text-ink">
          Failed to Load Dashboard
        </h2>
        <p className="text-sm font-light mb-6 text-muted">
          {getApiErrorMessage(error, "Unable to load your dashboard.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 font-bold font-mono text-sm uppercase tracking-wider rounded-xl transition bg-pine hover:bg-moss text-paper"
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
      <div className="border rounded-card shadow-soft border-line bg-paper">
        <EmptyState
          icon={BookMarked}
          label="No dashboard data yet"
          description="Once you are enrolled in courses, your progress, grades, and learning stats will appear here."
          size="lg"
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
        className="relative overflow-hidden rounded-[1.75rem] border border-paper/10 cn-page-bg-vault text-paper shadow-[0_24px_60px_-36px_rgba(8,31,28,0.85)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(199,168,91,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(217,111,95,0.14),_transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-size-[28px_28px]" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold/90 mb-3">
                Learning pulse
              </p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-paper leading-[1.1]">
                Your student
                <span className="block text-paper/75 font-light">dashboard</span>
              </h2>
              <p className="text-sm text-paper/60 font-light mt-3 max-w-md leading-relaxed">
                Track enrollments, momentum, and grades in one calm view — built around how you learn.
              </p>

              <div className="mt-7 flex flex-wrap gap-8">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-paper/50 mb-1.5">
                    Average grade
                  </p>
                  <p className="text-3xl font-serif font-bold text-gold leading-none">
                    {averageGrade}
                    <span className="text-lg text-gold/70 ml-0.5">%</span>
                  </p>
                </div>
                <div className="w-px bg-paper/15 self-stretch hidden sm:block" />
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-paper/50 mb-1.5">
                    Certificates
                  </p>
                  <p className="text-3xl font-serif font-bold text-paper leading-none">
                    {certificates}
                  </p>
                </div>
                <div className="w-px bg-paper/15 self-stretch hidden sm:block" />
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-paper/50 mb-1.5">
                    Active now
                  </p>
                  <p className="text-3xl font-serif font-bold text-paper leading-none">
                    {activeCourses}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-end shrink-0">
              <div className="rounded-full p-3 bg-paper/5 border border-paper/10 backdrop-blur-sm">
                <ProgressRing value={overallProgress} />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="rounded-2xl border px-5 sm:px-7 py-5 sm:py-6 shadow-[0_10px_36px_-28px_rgba(28,25,23,0.35)] border-line/80 bg-paper/90">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
          <div className="sm:pr-4 pt-0">
            <CourseStat
              label="Enrolled Courses"
              value={enrolledCourses}
              icon={BookMarked}
              delay={0.05}
            />
          </div>
          <div className="sm:px-4 pt-6 sm:pt-0">
            <CourseStat
              label="Active Courses"
              value={activeCourses}
              icon={BookOpen}
              delay={0.1}
            />
          </div>
          <div className="sm:pl-4 pt-6 sm:pt-0">
            <CourseStat
              label="Completed Courses"
              value={completedCourses}
              icon={CheckCircle2}
              delay={0.15}
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
        />
        <ActionMetric
          label="Upcoming Quizzes"
          value={upcomingQuizzes}
          icon={CircleHelp}
          tone="stone"
          delay={0.12}
        />
        <ActionMetric
          label="Average Grade"
          value={`${averageGrade}%`}
          icon={TrendingUp}
          tone="amber"
          delay={0.16}
        />
      </section>

      <MyPathwaysSummary />

      <section className="relative overflow-hidden rounded-2xl border p-5 sm:p-7 shadow-[0_10px_36px_-28px_rgba(28,25,23,0.3)] border-line/80 bg-paper">
        <div className="pointer-events-none absolute -right-16 -top-20 w-56 h-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] mb-1 text-pine/80">
              Course progress
            </p>
            <h3 className="text-xl font-serif font-bold text-ink">
              Progress by enrolled course
            </h3>
          </div>
          <p className="text-sm font-light text-muted">
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
            size="lg"
          />
        ) : (
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={progressByCourse}
                margin={{ top: 8, right: 8, left: -16, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#a8a29e"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={42}
                  tick={<CourseAxisTick />}
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
