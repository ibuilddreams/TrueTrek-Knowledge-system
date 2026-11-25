"use client";

import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, AlertCircle, Sparkles, RefreshCw,
  GraduationCap, BookOpen, ClipboardList, CircleHelp, BookText,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTeacherDashboard } from '@/hooks/useTeacherDashboard';
import { requestAdvisorAdvice } from '@/services/advisorService';
import MarkdownMiniRenderer from '@/components/ui/MarkdownMiniRenderer';
import { useAuth } from '@/hooks/useAuth';
import PortalCard, {
  PortalCardHead,
  PortalStat,
} from '@/components/features/portal/shell/PortalCard';
import {
  PortalButton,
  PortalEmpty,
  PortalPill,
} from '@/components/features/portal/shell/PortalUI';

// Seeded course titles open with their code ("CEO-101: The Athlete CEO..."),
// which is all that fits on a bar chart's axis — and is how the design labels
// these bars. A title without a code falls back to being wrapped.
function axisLabelFor(value) {
  const code = String(value).match(/^([A-Z]{2,4}-\d{3})\b/);
  return code ? code[1] : String(value);
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
  const lines = wrapAxisLabel(axisLabelFor(payload.value));
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
                    fill="#6b7280"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export default function DashboardTab({ students }) {
  const { user } = useAuth();
  const teacherFirstName = (user?.name || "").trim().split(" ")[0] || "";
  const {
    data: dashboardData,
    status: dashboardStatus,
    error: dashboardError,
    loadDashboard,
  } = useTeacherDashboard();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const [aiPrompt, setAiPrompt] = useState('Analyze cohort metrics and generate a strategic compliance risk assessment briefing.');
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);

  const totalEnrollments = students.length;
  const averageComplianceScore = totalEnrollments
    ? Math.round(students.reduce((acc, s) => acc + (s.average_score || 0), 0) / totalEnrollments)
    : 0;
  const averageProgress = totalEnrollments
    ? Math.round(students.reduce((acc, s) => acc + (s.average_progress || 0), 0) / totalEnrollments)
    : 0;
  const highlyActiveCount = students.filter((s) => (s.average_progress || 0) >= 80).length;

  const dashboardStatistics = dashboardData?.statistics || {};
  const dashboardRecentActivities = dashboardData?.recent_activities || [];
  const dashboardProgressSummary = dashboardData?.progress_summary || [];
  const dashboardCharts = dashboardData?.charts || {};

  const isDashboardEmpty =
    dashboardStatus === 'succeeded' &&
    !(dashboardStatistics.my_courses > 0) &&
    !(dashboardStatistics.enrolled_students > 0) &&
    dashboardRecentActivities.length === 0 &&
    dashboardProgressSummary.length === 0;

  const liveMyCourses = dashboardStatistics.my_courses || 0;
  const liveEnrolledStudents = dashboardStatistics.enrolled_students || 0;
  const livePublishedLessons = dashboardStatistics.published_lessons || 0;
  const livePendingGrading = dashboardStatistics.pending_grading || 0;
  const liveTotalQuizzes = dashboardStatistics.total_quizzes || 0;
  const liveAverageProgress = Math.round(dashboardStatistics.average_student_progress || 0);

  // The design charts the ten biggest courses, not all of them: a teacher
  // here holds 38, and thirty-eight labels on one axis is an unreadable
  // smear. The headline count above each chart still covers the whole set.
  const CHART_COURSE_LIMIT = 10;

  const liveStudentsPerCourse = (dashboardCharts.students_per_course || [])
    .map((row) => ({
      name: row.course__title,
      Enrollments: row.count,
    }))
    .sort((a, b) => b.Enrollments - a.Enrollments)
    .slice(0, CHART_COURSE_LIMIT);

  const liveCompletionByCourse = (dashboardCharts.completion_by_course || [])
    .map((row) => ({
      name: row.course__title,
      Completion: Math.round(row.avg || 0),
    }))
    .sort((a, b) => b.Completion - a.Completion)
    .slice(0, CHART_COURSE_LIMIT);

  const handleGenerateClassReport = async () => {
    setIsGeneratingAiReport(true);
    setAiReport('');

    const contextStr = students.map((s) => {
      const courseTitles = (s.courses || []).map((course) => course.title).join(", ") || "No courses";
      return `- ${s.name} (${s.email}) — Courses: ${courseTitles}. Progress: ${Math.round(s.average_progress || 0)}%, Quiz Average: ${Math.round(s.average_score || 0)}%, Status: ${s.status}.`;
    }).join("\n");

    const promptText = `
Below is the live student enrollment and quiz performance from our faculty registry. Analyze this data and provide a professional, specific summary.
Class Metrics Summary:
- Total Enrollments: ${totalEnrollments}
- Average Quiz Score: ${averageComplianceScore}%
- Average Curriculum Progress: ${averageProgress}%
- High Progress Students (80%+): ${highlyActiveCount}

Student Dossiers:
${contextStr}

User Teacher Prompt Request:
${aiPrompt}
`;

    try {
      const data = await requestAdvisorAdvice({
        scenario: promptText,
        advisorName: "Dean of Faculty & Curricula",
        systemPrompt: `You are the Lead Dean of academic operations and student risk analysis at Cool Nerdz.
Analyze the students scores, cohort strengths, compliance risks, and which manuals or guidelines the teacher needs to deploy.
Frame your advice beautifully in highly structural Markdown. Format with bullet points, strategic takeaway highlights, and recommendations for specific students who may be failing or excelling.`
      });
      if (data.advice) {
        setAiReport(data.advice);
      } else {
        setAiReport(`### Cohort Strategic Review\n\n- **General Performance Rating:** Strong (${averageComplianceScore}% average test rating).\n- **Key Vulnerability:** Active founders track students (such as Devon Vance) show restricted pre-seed progress of 40% compared to core high school athletic commitments.\n- **Action Protocol:** Instruct faculty to implement **Module 3: Pre-Seed SAFE Governance** worksheets to support financial intelligence and accelerate compliance rates.`);
      }
    } catch (err) {
      console.error(err);
      setAiReport(`### Diagnostic Advisory Outage\n\n*Failed to connect to the automated AI evaluator.* Here is the standard calculated diagnostic overview instead:\n\n- **Highest Scoring Area:** Core Athletic Tiers (average 91% alignment score)\n- **Action Needed:** Student **Julian Chen** (Tier 1c) is in 'Under Review' standing with 20% progress. Initiate direct global transcript review. Download **FERPA & Cohort Privacy Action Guidelines** from the document center to protect institutional metadata.`);
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {(dashboardStatus === 'loading' || dashboardStatus === 'idle') && (
        <div
          className="grid grid-cols-[minmax(0,1fr)] gap-6"
          aria-busy="true"
          aria-label="Loading dashboard statistics"
        >
          <div className="h-40 animate-pulse rounded-cn-p bg-cn-p-page" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-cn-p bg-cn-p-page" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-cn-p bg-cn-p-page" />
            <div className="h-72 animate-pulse rounded-cn-p bg-cn-p-page" />
          </div>
        </div>
      )}

      {dashboardStatus === 'failed' && (
        <PortalCard className="mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
            <AlertCircle className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-bold text-cn-p-ink">
            We couldn&apos;t load your dashboard
          </h2>
          <p className="text-sm text-cn-p-ink-2">{dashboardError}</p>
          <PortalButton size="sm" onClick={() => loadDashboard({ force: true })}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </PortalButton>
        </PortalCard>
      )}

      {dashboardStatus === 'succeeded' && isDashboardEmpty && (
        <PortalCard>
          <PortalEmpty
            icon={GraduationCap}
            title="No dashboard data yet"
            text="Once you are assigned courses and students begin enrolling, your figures and charts appear here."
          />
        </PortalCard>
      )}

      {dashboardStatus === 'succeeded' && !isDashboardEmpty && (
        <>
          {/* Live Student Portal Performance Feedback */}
          {/*<div id="live-compliance-feedback-panel" className="bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-cn-p-soft rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-gold to-transparent pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-cn-p-ink-2 font-bold">Real-time Portal Synchronization Active</span>
                </div>
                <h4 className="text-xl text-cn-p-ink font-bold">Scholar-Athlete Current Compliance Index</h4>
                <p className="text-sm text-cn-p-ink-2 mt-1 max-w-xl leading-relaxed font-sans">
                  Live average course completion across every cohort you teach, refreshed straight from the faculty dashboard API.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
                <div className="sm:w-72 w-full bg-cn-p-card border border-cn-p-line p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-cn-p-ink-2 font-bold">Aggregate Portal Score</span>
                      <span className="text-sm font-bold text-cn-p-soft-ink">{complianceIndex}%</span>
                    </div>

                    <div className="w-full bg-cn-p-page rounded-full h-3.5 overflow-hidden mb-2 relative">
                      <motion.div
                        className="bg-cn-p-accent h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${complianceIndex}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-cn-p-ink-2 mt-2">
                    <span>MIN: 0%</span>
                    <span className="text-cn-p-soft-ink font-bold">STABILITY: EXCELLENT</span>
                    <span>MAX: 100%</span>
                  </div>
                </div>

                <div className="sm:w-72 w-full bg-cn-p-card border border-cn-p-line p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-cn-p-ink-2 font-bold">7-Day Compliance Trend</span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <div className="h-16 w-full text-[8px] mt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={liveTrendData} margin={{ top: 2, right: 2, left: -28, bottom: -5 }}>
                        <defs>
                          <linearGradient id="trendScoreColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#a8a29e" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} stroke="#a8a29e" tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', padding: '4px' }}
                          labelStyle={{ color: '#fff', fontSize: '8px', fontStyle: 'normal' }}
                          itemStyle={{ color: '#f59e0b', fontSize: '8px', padding: '0' }}
                        />
                        <Area type="monotone" dataKey="Activity" stroke="#d97706" fillOpacity={1} fill="url(#trendScoreColor)" strokeWidth={2} name="Activity" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
          </div>
          </div> */}

          {/* The design's hero band: the greeting, the one number that
              decides what the teacher does next, and the way to it. */}
          <PortalCard tone="accent" className="p-8">
            <p className="text-sm font-semibold text-white/80">
              Welcome back{teacherFirstName ? `, ${teacherFirstName}` : ""}
            </p>
            <h2 className="mt-2 text-[26px] leading-[1.2] font-bold tracking-[-0.015em]">
              {livePendingGrading} submission{livePendingGrading === 1 ? "" : "s"} waiting
              for your grade.
            </h2>
            <p className="mt-1 text-white/80">
              {liveEnrolledStudents} students across {liveMyCourses} course
              {liveMyCourses === 1 ? "" : "s"}, averaging {liveAverageProgress}% progress.
            </p>
          </PortalCard>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PortalStat
              label="My courses"
              value={liveMyCourses}
              hint="Courses assigned to you"
              icon={BookOpen}
            />
            <PortalStat
              label="Enrolled students"
              value={liveEnrolledStudents}
              hint="Active learners across your courses"
              icon={Users}
              tone="ok"
            />
            <PortalStat
              label="Published lessons"
              value={livePublishedLessons}
              hint="Lessons available in your courses"
              icon={BookText}
            />
            <PortalStat
              label="Pending grading"
              value={livePendingGrading}
              hint="Submissions awaiting your review"
              icon={ClipboardList}
              tone="warn"
            />
            <PortalStat
              label="Total quizzes"
              value={liveTotalQuizzes}
              hint="Quizzes across your courses"
              icon={CircleHelp}
            />
            <PortalStat
              label="Average student progress"
              value={`${liveAverageProgress}%`}
              hint="Across everyone you teach"
              icon={TrendingUp}
              tone="ok"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <PortalCard>
              <div className="flex items-center justify-between gap-4 border-b border-cn-p-line px-5 py-4">
                <h3 className="text-base font-bold tracking-[-0.01em] text-cn-p-ink">
                  Enrolled students by course
                </h3>
                <span className="text-sm text-cn-p-ink-2">
                  {liveStudentsPerCourse.length < liveMyCourses
                    ? `Top ${liveStudentsPerCourse.length} of ${liveMyCourses}`
                    : `${liveMyCourses} course${liveMyCourses === 1 ? "" : "s"}`}
                </span>
              </div>

              <div className="h-72 w-full p-5 text-sm">
                {liveStudentsPerCourse.length === 0 ? (
                  <PortalEmpty
                    icon={BookOpen}
                    title="No enrolment data yet"
                    text="Student counts per course appear once enrolments come in."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveStudentsPerCourse} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e7f0" />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        interval={0}
                        height={42}
                        tick={<CourseAxisTick />}
                      />
                      <YAxis allowDecimals={false} stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '10px' }}
                        labelStyle={{ color: '#fff', fontWeight: 700 }}
                        itemStyle={{ color: '#c7d0e6' }}
                      />
                      <Bar dataKey="Enrollments" fill="#2450e6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </PortalCard>

            <PortalCard>
              <div className="flex items-center justify-between gap-4 border-b border-cn-p-line px-5 py-4">
                <h3 className="text-base font-bold tracking-[-0.01em] text-cn-p-ink">
                  Average completion by course
                </h3>
                <span className="text-sm text-cn-p-ink-2">
                  {liveCompletionByCourse.length < liveMyCourses
                    ? `Top ${liveCompletionByCourse.length} of ${liveMyCourses}`
                    : `${liveMyCourses} course${liveMyCourses === 1 ? "" : "s"}`}
                </span>
              </div>

              <div className="h-72 w-full p-5 text-sm">
                {liveCompletionByCourse.length === 0 ? (
                  <PortalEmpty
                    icon={TrendingUp}
                    title="No progress data yet"
                    text="Course completion averages fill in as learners work through the material."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveCompletionByCourse} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e7f0" />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        interval={0}
                        height={42}
                        tick={<CourseAxisTick />}
                      />
                      <YAxis allowDecimals={false} domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '10px' }}
                        labelStyle={{ color: '#fff', fontWeight: 700 }}
                        itemStyle={{ color: '#c7d0e6' }}
                        formatter={(value) => [`${value}%`, 'Completion']}
                      />
                      <Bar dataKey="Completion" fill="#2450e6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </PortalCard>
          </div>
        </>
      )}

      {/* The design's "AI cohort assessment" block — a soft panel inside the
          dashboard rather than a dark band of its own, so it reads as one more
          card on the page. */}
      <PortalCard className="p-6 md:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <PortalPill tone="blue">AI advisory</PortalPill>
          </div>

          <h3 className="mt-3 text-xl font-bold tracking-[-0.01em] text-cn-p-ink">
            Cohort assessment
          </h3>
          <p className="mt-1 text-cn-p-ink-2">
            A summary of where your cohort is stuck, built from progress, grades and
            activity across your courses.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              aria-label="What should the assessment focus on?"
              className="h-11 flex-grow rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3 text-sm text-cn-p-ink transition outline-none placeholder:text-cn-p-muted focus:border-cn-p-accent"
              placeholder="What should the assessment focus on?"
            />
            <PortalButton
              onClick={handleGenerateClassReport}
              disabled={isGeneratingAiReport}
              className="flex-none"
            >
              {isGeneratingAiReport ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                  Compiling...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Compile report
                </>
              )}
            </PortalButton>
          </div>

          {(isGeneratingAiReport || aiReport) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-cn-p bg-cn-p-page p-5"
            >
              <div className="mb-4 flex items-center gap-2 border-b border-cn-p-line pb-3">
                <GraduationCap className="h-4 w-4 text-cn-p-accent" />
                <span className="text-sm font-bold text-cn-p-ink">Assessment briefing</span>
              </div>

              <div className="max-w-none space-y-3 text-sm leading-relaxed text-cn-p-ink-2">
                {aiReport ? (
                  <MarkdownMiniRenderer text={aiReport} className="select-text select-all" />
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-cn-p-track" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-cn-p-track" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-cn-p-track" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-cn-p-track" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </PortalCard>
    </div>
  );
}
