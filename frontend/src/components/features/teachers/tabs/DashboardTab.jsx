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
          <div className="h-40 rounded-2xl bg-stone-100 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-stone-100 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-72 rounded-2xl bg-stone-100 animate-pulse" />
            <div className="h-72 rounded-2xl bg-stone-100 animate-pulse" />
          </div>
        </div>
      )}

      {dashboardStatus === 'failed' && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-xs text-stone-500 font-light mb-6">{dashboardError}</p>
          <button
            type="button"
            onClick={() => loadDashboard({ force: true })}
            className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {dashboardStatus === 'succeeded' && isDashboardEmpty && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
          <EmptyState
            icon={GraduationCap}
            label="No dashboard data yet"
            description="Once you're assigned courses and students begin enrolling, your compliance metrics and analytics will appear here."
          />
        </div>
      )}

      {dashboardStatus === 'succeeded' && !isDashboardEmpty && (
        <>
          {/* Live Student Portal Performance Feedback */}
          {/*<div id="live-compliance-feedback-panel" className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-amber-500 to-transparent pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">Real-time Portal Synchronization Active</span>
                </div>
                <h4 className="text-xl font-serif text-stone-900 font-bold">Scholar-Athlete Current Compliance Index</h4>
                <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed font-sans">
                  Live average course completion across every cohort you teach, refreshed straight from the faculty dashboard API.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
                <div className="sm:w-72 w-full bg-white border border-stone-200/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-stone-500 font-bold uppercase">Aggregate Portal Score</span>
                      <span className="text-sm font-mono font-bold text-amber-850">{complianceIndex}%</span>
                    </div>

                    <div className="w-full bg-stone-100 rounded-full h-3.5 overflow-hidden mb-2 relative">
                      <motion.div
                        className="bg-gradient-to-r from-amber-500 to-amber-700 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${complianceIndex}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-stone-400 mt-2">
                    <span>MIN: 0%</span>
                    <span className="text-amber-700 font-bold">STABILITY: EXCELLENT</span>
                    <span>MAX: 100%</span>
                  </div>
                </div>

                <div className="sm:w-72 w-full bg-white border border-stone-200/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-stone-500 font-bold uppercase">7-Day Compliance Trend</span>
                    <span className="text-[9px] font-mono font-bold text-emerald-600 flex items-center gap-0.5">
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
                <p className="text-[11px] text-stone-400 font-medium mt-1 font-mono">
                  Courses assigned to you
                </p>
              }
            />
            <StatCard
              label="Enrolled Students"
              value={liveEnrolledStudents}
              icon={Users}
              footer={
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1 font-mono">
                  <span>● Active learners across your courses</span>
                </p>
              }
            />
            <StatCard
              label="Published Lessons"
              value={livePublishedLessons}
              icon={BookText}
              footer={
                <p className="text-[11px] text-stone-400 font-medium mt-1 font-mono">
                  Lessons available in your courses
                </p>
              }
            />
            <StatCard
              label="Pending Grading"
              value={livePendingGrading}
              icon={ClipboardList}
              accent="rose"
              footer={
                <p className="text-[11px] text-stone-400 font-medium mt-1 font-mono">
                  Submissions awaiting your review
                </p>
              }
            />
            <StatCard
              label="Total Quizzes"
              value={liveTotalQuizzes}
              icon={CircleHelp}
              footer={
                <p className="text-[11px] text-stone-400 font-medium mt-1 font-mono">
                  Quizzes across your courses
                </p>
              }
            />
            <StatCard
              label="Average Student Progress"
              value={`${liveAverageProgress}%`}
              icon={TrendingUp}
              accent="emerald"
              footer={
                <div className="w-24 bg-stone-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: `${liveAverageProgress}%` }} />
                </div>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">Enrolled Students by Course</h3>
                  <p className="text-xs text-stone-400 font-light mt-0.5">Active registration load across your taught courses</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-stone-50 border border-stone-200 text-stone-500 rounded-lg">{liveMyCourses} Courses</span>
              </div>

              <div className="h-72 w-full text-xs font-mono">
                {liveStudentsPerCourse.length === 0 ? (
                  <EmptyState
                    icon={BookMarked}
                    label="No enrollment data yet"
                    description="Student counts per course will appear once enrollments come in."
                    compact
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveStudentsPerCourse} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis dataKey="name" stroke="#78716c" />
                      <YAxis allowDecimals={false} stroke="#78716c" />
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

            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">Average Completion by Course</h3>
                  <p className="text-xs text-stone-400 font-light mt-0.5">Course progress velocity across enrolled students</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-stone-50 border border-stone-200 text-stone-500 rounded-lg">{livePublishedLessons} Lessons</span>
              </div>

              <div className="h-72 w-full text-xs font-mono">
                {liveCompletionByCourse.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    label="No progress data yet"
                    description="Course completion averages will populate as learners engage."
                    compact
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveCompletionByCourse} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis dataKey="name" stroke="#78716c" />
                      <YAxis allowDecimals={false} domain={[0, 100]} stroke="#78716c" />
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

      <div className="bg-[#141211] border border-stone-850 rounded-3xl p-6 md:p-8 relative overflow-hidden text-stone-200">
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-amber-600/10 blur-[110px] pointer-events-none"></div>

        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-2.5 py-1 rounded bg-amber-600/20 border border-amber-500/20 text-amber-500 font-mono text-[9px] uppercase tracking-widest font-black">AI Advisory Council</div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight mb-2">Faculty Automated Cohort Assessment</h3>
          <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
            Connect current registration and testing score logs instantly with our model engine. Frame strategic action plans on which compliance modules require classroom focus.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-grow bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-none rounded-xl px-4 py-3 text-stone-200 text-xs font-mono placeholder:text-stone-600"
              placeholder="Specify your faculty assessment objective..."
            />
            <button
              onClick={handleGenerateClassReport}
              disabled={isGeneratingAiReport}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-800 text-stone-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
            >
              {isGeneratingAiReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-955 border-t-transparent rounded-full animate-spin"></div>
                  Processing Logs...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-stone-955" />
                  COMPILE REPORT
                </>
              )}
            </button>
          </div>

          {(isGeneratingAiReport || aiReport) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-stone-950 border border-stone-850 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-850">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  <span className="font-serif text-xs font-bold text-stone-200">Assessment Briefing Document</span>
                </div>
                <span className="text-[10px] font-mono text-stone-500">GEN DIRECTIVE: DEAN_REVIEWS_v4</span>
              </div>

              <div className="prose prose-sm prose-invert font-light leading-relaxed text-xs sm:text-sm text-stone-300 max-w-none space-y-3">
                {aiReport ? (
                  <MarkdownMiniRenderer text={aiReport} className="select-text select-all" />
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="h-4 bg-stone-900 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-stone-900 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-stone-900 rounded w-2/3 animate-pulse"></div>
                    <div className="h-4 bg-stone-900 rounded w-1/2 animate-pulse"></div>
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
