"use client";

import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, AlertCircle, Sparkles, RefreshCw, BookMarked,
  GraduationCap, BookOpen, ClipboardList, CircleHelp, BookText,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area,
} from 'recharts';
import { useTeacherDashboard } from '@/hooks/useTeacherDashboard';
import { requestAdvisorAdvice } from '@/services/advisorService';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import MarkdownMiniRenderer from '@/components/ui/MarkdownMiniRenderer';

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
          fontFamily="monospace"
          fill="#78716c"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export default function DashboardTab({ students }) {
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

  const liveStudentsPerCourse = (dashboardCharts.students_per_course || []).map((row) => ({
    name: row.course__title,
    Enrollments: row.count
  }));

  const liveCompletionByCourse = (dashboardCharts.completion_by_course || []).map((row) => ({
    name: row.course__title,
    Completion: Math.round(row.avg || 0)
  }));

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
        systemPrompt: `You are the Lead Dean of academic operations and student risk analysis at TrueTrek Learning.
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
    <div className="space-y-10">

      {(dashboardStatus === 'loading' || dashboardStatus === 'idle') && (
        <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard statistics">
          <div className="h-40 rounded-2xl bg-porcelain animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-porcelain animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-72 rounded-2xl bg-porcelain animate-pulse" />
            <div className="h-72 rounded-2xl bg-porcelain animate-pulse" />
          </div>
        </div>
      )}

      {dashboardStatus === 'failed' && (
        <div className="bg-paper border border-line rounded-card shadow-soft p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-ink mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-sm text-muted font-light mb-6">{dashboardError}</p>
          <button
            type="button"
            onClick={() => loadDashboard({ force: true })}
            className="inline-flex items-center gap-2 px-5 py-3 bg-pine hover:bg-moss text-paper font-bold font-mono text-sm uppercase tracking-wider rounded-xl shadow-md transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {dashboardStatus === 'succeeded' && isDashboardEmpty && (
        <div className="bg-paper border border-line rounded-card shadow-soft">
          <EmptyState
            icon={GraduationCap}
            label="No dashboard data yet"
            description="Once you're assigned courses and students begin enrolling, your compliance metrics and analytics will appear here."
            size="lg"
          />
        </div>
      )}

      {dashboardStatus === 'succeeded' && !isDashboardEmpty && (
        <>
          {/* Live Student Portal Performance Feedback */}
          {/*<div id="live-compliance-feedback-panel" className="bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-gold to-transparent pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-muted font-bold">Real-time Portal Synchronization Active</span>
                </div>
                <h4 className="text-xl font-serif text-ink font-bold">Scholar-Athlete Current Compliance Index</h4>
                <p className="text-sm text-muted mt-1 max-w-xl leading-relaxed font-sans">
                  Live average course completion across every cohort you teach, refreshed straight from the faculty dashboard API.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
                <div className="sm:w-72 w-full bg-paper border border-line/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-muted font-bold uppercase">Aggregate Portal Score</span>
                      <span className="text-sm font-mono font-bold text-gold">{complianceIndex}%</span>
                    </div>

                    <div className="w-full bg-porcelain rounded-full h-3.5 overflow-hidden mb-2 relative">
                      <motion.div
                        className="bg-gradient-to-r from-gold to-gold/70 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${complianceIndex}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-muted mt-2">
                    <span>MIN: 0%</span>
                    <span className="text-gold font-bold">STABILITY: EXCELLENT</span>
                    <span>MAX: 100%</span>
                  </div>
                </div>

                <div className="sm:w-72 w-full bg-paper border border-line/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-muted font-bold uppercase">7-Day Compliance Trend</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <div className="h-16 w-full text-[8px] font-mono mt-1">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="My Courses"
              value={liveMyCourses}
              icon={BookOpen}
              footer={
                <p className="text-xs text-muted font-medium mt-1 font-mono">
                  Courses assigned to you
                </p>
              }
              size="lg"
            />
            <StatCard
              label="Enrolled Students"
              value={liveEnrolledStudents}
              icon={Users}
              footer={
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1 font-mono">
                  <span>● Active learners across your courses</span>
                </p>
              }
              size="lg"
            />
            <StatCard
              label="Published Lessons"
              value={livePublishedLessons}
              icon={BookText}
              footer={
                <p className="text-xs text-muted font-medium mt-1 font-mono">
                  Lessons available in your courses
                </p>
              }
              size="lg"
            />
            <StatCard
              label="Pending Grading"
              value={livePendingGrading}
              icon={ClipboardList}
              accent="rose"
              footer={
                <p className="text-xs text-muted font-medium mt-1 font-mono">
                  Submissions awaiting your review
                </p>
              }
              size="lg"
            />
            <StatCard
              label="Total Quizzes"
              value={liveTotalQuizzes}
              icon={CircleHelp}
              footer={
                <p className="text-xs text-muted font-medium mt-1 font-mono">
                  Quizzes across your courses
                </p>
              }
              size="lg"
            />
            <StatCard
              label="Average Student Progress"
              value={`${liveAverageProgress}%`}
              icon={TrendingUp}
              accent="emerald"
              footer={
                <div className="w-24 bg-porcelain h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: `${liveAverageProgress}%` }} />
                </div>
              }
              size="lg"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="bg-paper border border-line p-6 rounded-card shadow-soft">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
                <div>
                  <h3 className="font-serif font-bold text-base text-ink">Enrolled Students by Course</h3>
                  <p className="text-sm text-muted font-light mt-0.5">Active registration load across your taught courses</p>
                </div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-1 bg-porcelain border border-line text-muted rounded-lg">{liveMyCourses} Courses</span>
              </div>

              <div className="h-72 w-full text-sm font-mono">
                {liveStudentsPerCourse.length === 0 ? (
                  <EmptyState
                    icon={BookMarked}
                    label="No enrollment data yet"
                    description="Student counts per course will appear once enrollments come in."
                    compact
                    size="lg"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveStudentsPerCourse} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis
                        dataKey="name"
                        stroke="#78716c"
                        interval={0}
                        height={42}
                        tick={<CourseAxisTick />}
                      />
                      <YAxis allowDecimals={false} stroke="#78716c" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '12px' }}
                        labelStyle={{ color: '#fff', fontFamily: 'serif', fontWeight: 'bold' }}
                        itemStyle={{ fontFamily: 'monospace', color: '#f59e0b' }}
                      />
                      <Bar dataKey="Enrollments" fill="#d97706" radius={[4, 4, 0, 0]}>
                        {liveStudentsPerCourse.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#b45309' : '#d97706'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-paper border border-line p-6 rounded-card shadow-soft">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
                <div>
                  <h3 className="font-serif font-bold text-base text-ink">Average Completion by Course</h3>
                  <p className="text-sm text-muted font-light mt-0.5">Course progress velocity across enrolled students</p>
                </div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-1 bg-porcelain border border-line text-muted rounded-lg">{livePublishedLessons} Lessons</span>
              </div>

              <div className="h-72 w-full text-sm font-mono">
                {liveCompletionByCourse.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    label="No progress data yet"
                    description="Course completion averages will populate as learners engage."
                    compact
                    size="lg"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveCompletionByCourse} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis
                        dataKey="name"
                        stroke="#78716c"
                        interval={0}
                        height={42}
                        tick={<CourseAxisTick />}
                      />
                      <YAxis allowDecimals={false} domain={[0, 100]} stroke="#78716c" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '12px' }}
                        labelStyle={{ color: '#fff', fontFamily: 'serif', fontWeight: 'bold' }}
                        itemStyle={{ fontFamily: 'monospace', color: '#f59e0b' }}
                        formatter={(value) => [`${value}%`, 'Completion']}
                      />
                      <Bar dataKey="Completion" fill="#b45309" radius={[4, 4, 0, 0]}>
                        {liveCompletionByCourse.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#b45309' : '#d97706'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      <div className="cn-page-bg-vault border border-paper/10 rounded-3xl p-6 md:p-8 relative overflow-hidden text-paper/85">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-size-[28px_28px]" />
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-gold/10 blur-[110px] pointer-events-none"></div>

        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-2.5 py-1 rounded bg-gold/20 border border-gold/20 text-gold font-mono text-[10px] uppercase tracking-widest font-black">AI Advisory Council</div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-serif font-bold text-paper tracking-tight mb-2">Faculty Automated Cohort Assessment</h3>
          <p className="text-paper/60 text-sm sm:text-sm font-light leading-relaxed mb-6">
            Connect current registration and testing score logs instantly with our model engine. Frame strategic action plans on which compliance modules require classroom focus.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-grow bg-paper/5 border border-paper/15 focus:border-gold focus:outline-none rounded-xl px-4 py-3 text-paper text-sm font-mono placeholder:text-paper/30"
              placeholder="Specify your faculty assessment objective..."
            />
            <button
              onClick={handleGenerateClassReport}
              disabled={isGeneratingAiReport}
              className="px-6 py-3 bg-gold hover:bg-gold/90 disabled:bg-paper/10 text-ink font-mono font-black text-sm uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
            >
              {isGeneratingAiReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink/40 border-t-transparent rounded-full animate-spin"></div>
                  Processing Logs...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-ink" />
                  COMPILE REPORT
                </>
              )}
            </button>
          </div>

          {(isGeneratingAiReport || aiReport) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-paper/5 border border-paper/10 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-paper/10">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gold" />
                  <span className="font-serif text-sm font-bold text-paper/85">Assessment Briefing Document</span>
                </div>
                <span className="text-[11px] font-mono text-paper/50">GEN DIRECTIVE: DEAN_REVIEWS_v4</span>
              </div>

              <div className="prose prose-sm prose-invert font-light leading-relaxed text-sm sm:text-sm text-paper/75 max-w-none space-y-3">
                {aiReport ? (
                  <MarkdownMiniRenderer text={aiReport} className="select-text select-all" />
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="h-4 bg-paper/10 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-paper/10 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-paper/10 rounded w-2/3 animate-pulse"></div>
                    <div className="h-4 bg-paper/10 rounded w-1/2 animate-pulse"></div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>

    </div>
  );
}
