"use client";

import { useState, } from 'react';
import { 
  Users, Award, BookOpen, FileText, CheckCircle, Search, Plus, Filter,
  TrendingUp, Download, Eye, GraduationCap, ChevronRight, X, AlertCircle,
  Clock, ShieldAlert, Sparkles, BookOpenCheck, Edit, Trash, Activity,
  Lock, Unlock, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CURRICULUM_TIERS, DRILL_QUESTIONS } from '@/data/curriculum';
import { requestAdvisorAdvice } from '@/services/advisorService';
import { getDaysAgoDateString, getDaysSinceLastDrill } from '@/lib/dates';
import { useAuth } from '@/hooks/useAuth';
import { AUTH_ROLES } from '@/constants/auth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
 Cell, AreaChart, Area
} from 'recharts';

const INITIAL_STUDENTS = [
  {
    id: 'stud-1',
    name: 'Kyler Ross',
    category: 'Athletic',
    institution: 'University of Alabama',
    activeTierId: 'tier-6',
    progressPercent: 82,
    averageScore: 94,
    streakDays: 14,
    completedDrillIds: ['drill-1', 'drill-2'],
    enrollmentDate: '2026-01-10',
    avatarText: 'KR',
    email: 'k.ross@rolltide.edu',
    status: 'Active',
    lastDrillDate: getDaysAgoDateString(1)
  },
  {
    id: 'stud-2',
    name: 'Elena Rostova',
    category: 'Athletic',
    institution: 'Stanford University',
    activeTierId: 'tier-2',
    progressPercent: 65,
    averageScore: 88,
    streakDays: 8,
    completedDrillIds: ['drill-2'],
    enrollmentDate: '2026-02-15',
    avatarText: 'ER',
    email: 'elena.rostova@stanford.edu',
    status: 'Active',
    lastDrillDate: getDaysAgoDateString(5)
  },
  {
    id: 'stud-3',
    name: 'Marcus Vance',
    category: 'Academic',
    institution: 'Metropolitan Prep Academy',
    activeTierId: 'tier-4',
    progressPercent: 95,
    averageScore: 98,
    streakDays: 21,
    completedDrillIds: ['drill-1', 'drill-3'],
    enrollmentDate: '2025-11-05',
    avatarText: 'MV',
    email: 'm_vance@metroprep.org',
    status: 'Complete',
    lastDrillDate: getDaysAgoDateString(0)
  },
  {
    id: 'stud-4',
    name: 'Devon Vance',
    category: 'Professional',
    institution: 'Vance Ventures Tech',
    activeTierId: 'tier-7',
    progressPercent: 40,
    averageScore: 78,
    streakDays: 4,
    completedDrillIds: ['drill-3'],
    enrollmentDate: '2026-03-01',
    avatarText: 'DV',
    email: 'devon@vanceventures.io',
    status: 'Active',
    lastDrillDate: getDaysAgoDateString(7)
  },
  {
    id: 'stud-5',
    name: 'Sarah Jenkins',
    category: 'Academic',
    institution: 'Lakeside High School',
    activeTierId: 'tier-1',
    progressPercent: 50,
    averageScore: 85,
    streakDays: 12,
    completedDrillIds: ['drill-2'],
    enrollmentDate: '2026-04-12',
    avatarText: 'SJ',
    email: 'sjenkins@lakesideacademy.net',
    status: 'Active',
    lastDrillDate: getDaysAgoDateString(2)
  },
  {
    id: 'stud-6',
    name: 'Julian Chen',
    category: 'Legacy',
    institution: 'Toronto Global Prep',
    activeTierId: 'tier-1c',
    progressPercent: 20,
    averageScore: 92,
    streakDays: 3,
    completedDrillIds: ['drill-1'],
    enrollmentDate: '2026-05-20',
    avatarText: 'JC',
    email: 'julian.chen@torontoglobal.ca',
    status: 'Under Review',
    lastDrillDate: getDaysAgoDateString(6)
  }
];

const CURRICULUM_DOCUMENTS = [
  {
    id: 'doc-syllabus',
    title: 'Framework Syllabus: Institutional Facilitator manual',
    version: 'v4.2.1',
    category: 'Syllabus',
    description: 'Complete compliance roadmap, instructional matrices, and performance diagnostic metrics for Tiers 1 through 11.',
    format: 'PDF (34 Pages)',
    lastUpdated: 'May 2026'
  },
  {
    id: 'doc-ferpa',
    title: 'FERPA & Cohort Privacy Action Guidelines',
    version: 'v2.1.0',
    category: 'Privacy',
    description: 'Required protocols for administrators managing student profile intake dossiers, security locks, and credential records.',
    format: 'DOCX (12 Pages)',
    lastUpdated: 'March 2026'
  },
  {
    id: 'doc-nil-compliance',
    title: 'NIL Contract Redline Compliance Manual',
    version: 'v8.4.2',
    category: 'Athletic Law',
    description: 'Expert regulatory audit checklist for collegiate sponsorships, brand non-competes, and uniform licensing covenants.',
    format: 'PDF (68 Pages)',
    lastUpdated: 'June 2026'
  },
  {
    id: 'doc-cognitive-checklist',
    title: 'Circadian Optimization & Focus Exercise Manual',
    version: 'v3.0.1',
    category: 'Neurobiology',
    description: 'Academic class drill instructions, tracking matrices, and cognitive recovery index protocols.',
    format: 'PDF (18 Pages)',
    lastUpdated: 'April 2026'
  }
];

const TEACHER_MANUALS = [
  {
    id: 'm-1',
    title: 'Module 1: Redline Audits Integration',
    subtitle: 'NIL Contract Compliance Guidelines',
    objective: 'Teach students to identify hidden brand non-competes that violate athletic scholarship laws.',
    method: 'Assign Drill Scenario 1. Have students draft a three-point counter-proposal limiting non-compete domains exclusively to beverage categories, securing their varsity equipment guidelines.',
    checklist: [
      'Ensure students understand Varsity Sponsor uniform requirements',
      'Explain difference between liquid cash and trademark lockouts',
      'Benchmark average scoring target at 90+ before certifying progress'
    ]
  },
  {
    id: 'm-2',
    title: 'Module 2: Cognitive Recovery Indexing',
    subtitle: 'Balancing High-Stakes Schedules',
    objective: 'Train athletes to manage acute sleep debt during scout showcases without compromising reputation.',
    method: 'Deliver daily drills that test recovery negotiation. Shift from aggressive pre-dawn training towards afternoon structural film reviews when cumulative sleep drops below 6.5 hours.',
    checklist: [
      'Monitor collective student sleep trackers weekly',
      'Maintain immediate status reporting channels with principal coaches',
      'Model restoration as an active competitive advantage'
    ]
  },
  {
    id: 'm-3',
    title: 'Module 3: Pre-Seed SAFE Governance',
    subtitle: 'Startup Equity Preservation',
    objective: 'Guide future venture founders to avoid predatory early-stage dilution and retain board control.',
    method: 'Audit pitch and capitalization structures. Practice drafting simple agreements for future equity (SAFE) rather than giving up high strategic voting control to early angel funders.',
    checklist: [
      'Contrast standard common stock against pre-seed SAFE instruments',
      'Highlight the operational paralysis created by seed veto rights',
      'Verify evaluation caps against local geographic peer averages'
    ]
  }
];

export default function TeacherPortal({ aggregateScore = 100 }) {
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [quickViewStudent, setQuickViewStudent] = useState(null);

  const { loginFaculty, logout, isFacultySession, isAuthenticated, role } = useAuth();
  const isFacultyLoggedIn = isAuthenticated && role === AUTH_ROLES.FACULTY;
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyPasscode, setFacultyPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [successAnimation, setSuccessAnimation] = useState(false);
  
  // UI Tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Roster Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');
  
  // Create / Edit Student State
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    category: 'Academic' ,
    activeTierId: 'tier-1',
    progressPercent: 50,
    averageScore: 85,
    streakDays: 5,
    status: 'Active' 
  });

  // AI Diagnostic Advisor Section State
  const [aiPrompt, setAiPrompt] = useState('Analyze cohort metrics and generate a strategic compliance risk assessment briefing.');
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);

  // Stats Calculations
  const totalEnrollments = students.length;
  const averageComplianceScore = Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / totalEnrollments);
  const averageProgress = Math.round(students.reduce((acc, s) => acc + s.progressPercent, 0) / totalEnrollments);
  const highlyActiveCount = students.filter(s => s.streakDays >= 10).length;

  // Chart Data preparation
  const tierDistributionData = CURRICULUM_TIERS.map(tier => {
    const enrollCount = students.filter(s => s.activeTierId === tier.id).length;
    return {
      name: tier.number,
      title: tier.title,
      Enrollments: enrollCount
    };
  }).filter(t => t.Enrollments > 0 || ['Tier 1', 'Tier 2', 'Tier 4', 'Tier 6', 'Tier 7'].includes(t.name));

  const performanceDistributionData = students.map(s => ({
    name: s.name,
    Score: s.averageScore,
    Progress: s.progressPercent
  }));

  // 7-day trend for aggregate score
  const trendDates = (() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  })();

  const trendData = trendDates.map((date, idx) => {
    const offsets = [-14, -9, -11, -6, -3, -5, 0];
    const score = Math.max(0, Math.min(100, aggregateScore + offsets[idx]));
    return {
      date,
      Score: score
    };
  });

  const handleFacultyLogin = async (e) => {
    e.preventDefault();
    if (!facultyEmail.trim()) {
      setLoginError('Please enter a valid institutional faculty email.');
      return;
    }
    if (!facultyPasscode) {
      setLoginError('Please enter your security clearance passcode.');
      return;
    }

    setSuccessAnimation(true);
    try {
      await loginFaculty({
        email: facultyEmail,
        password: facultyPasscode,
        name: 'Faculty Operator',
      });
      setLoginError('');
    } catch (err) {
      setLoginError(err?.message || 'Faculty login failed.');
    } finally {
      setSuccessAnimation(false);
    }
  };

  const handleFacultyLogout = async () => {
    await logout();
    setFacultyEmail('');
    setFacultyPasscode('');
  };

  const handleBypassOrPreview = async (previewRole) => {
    if (previewRole === 'dean') {
      setFacultyEmail('dean@truetrek.edu');
      setFacultyPasscode('DEAN2026');
    } else if (previewRole === 'partner') {
      setFacultyEmail('partner.facilitator@academy.edu');
      setFacultyPasscode('PARTNER2026');
    } else {
      setFacultyEmail('preview.auditor@truetrek.edu');
      setFacultyPasscode('AUDIT2026');
    }
    
    setSuccessAnimation(true);
    const email =
      previewRole === 'dean'
        ? 'dean@truetrek.edu'
        : previewRole === 'partner'
          ? 'partner.facilitator@academy.edu'
          : 'preview.auditor@truetrek.edu';
    try {
      await loginFaculty({
        email,
        password: 'simulated',
        name: 'Faculty Operator',
      });
      setLoginError('');
    } catch (err) {
      setLoginError(err?.message || 'Faculty login failed.');
    } finally {
      setSuccessAnimation(false);
    }
  };

  // Handle student create / update
  const handleOpenRegister = () => {
    setFormData({
      name: '',
      email: '',
      institution: '',
      category: 'Academic',
      activeTierId: 'tier-1',
      progressPercent: 10,
      averageScore: 80,
      streakDays: 0,
      status: 'Active'
    });
    setEditingStudentId(null);
    setIsRegistering(true);
  };

  const handleOpenEdit = (student) => {
    setFormData({
      name: student.name,
      email: student.email,
      institution: student.institution,
      category: student.category,
      activeTierId: student.activeTierId,
      progressPercent: student.progressPercent,
      averageScore: student.averageScore,
      streakDays: student.streakDays,
      status: student.status
    });
    setEditingStudentId(student.id);
    setIsRegistering(true);
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    
    if (editingStudentId) {
      // Update existing
      setStudents(prev => prev.map(s => {
        if (s.id === editingStudentId) {
          return {
            ...s,
            name: formData.name,
            email: formData.email,
            institution: formData.institution,
            category: formData.category,
            activeTierId: formData.activeTierId,
            progressPercent: Number(formData.progressPercent),
            averageScore: Number(formData.averageScore),
            streakDays: Number(formData.streakDays),
            status: formData.status,
            avatarText: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
          };
        }
        return s;
      }));
    } else {
      // Create new
      const newStudent = {
        id: `stud-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        institution: formData.institution,
        category: formData.category,
        activeTierId: formData.activeTierId,
        progressPercent: Number(formData.progressPercent),
        averageScore: Number(formData.averageScore),
        streakDays: Number(formData.streakDays),
        completedDrillIds: ['drill-1'], // defaults to initial completed drill
        enrollmentDate: new Date().toISOString().split('T')[0],
        avatarText: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'ST',
        status: formData.status,
        lastDrillDate: getDaysAgoDateString(0)
      };
      setStudents(prev => [...prev, newStudent]);
    }
    
    setIsRegistering(false);
    setEditingStudentId(null);
  };

  const handleDeleteStudent = (id, name) => {
    const confirmed = window.confirm(`Are you sure you want to withdraw ${name} from active TrueTrek curriculum slots?`);
    if (confirmed) {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategoryFilter === 'all' || student.category === selectedCategoryFilter;
    const matchesTier = selectedTierFilter === 'all' || student.activeTierId === selectedTierFilter;
    
    return matchesSearch && matchesCategory && matchesTier;
  });

  // Call the Simulated/Real Class AI Report generator
  const handleGenerateClassReport = async () => {
    setIsGeneratingAiReport(true);
    setAiReport('');
    
    const contextStr = students.map(s => 
      `- ${s.name} at ${s.institution} of ${s.category} tract is in ${s.activeTierId}. Progress: ${s.progressPercent}%, Average Score: ${s.averageScore}. Drills done: ${s.completedDrillIds.join(', ')}`
    ).join('\n');

    const promptText = `
Below is the live student enrollment and compliance test scores from our faculty registry. Analyze this data and provide a professional, specific summary.
Class Metrics Summary:
- Total Enrollments: ${totalEnrollments}
- Average Compliance Assessment: ${averageComplianceScore}/100
- Average Curriculum Progress: ${averageProgress}%
- Streak Leader Count: ${highlyActiveCount}

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

  if (!isFacultyLoggedIn) {
    return (
      <div id="faculty-gate-container" className="py-16 px-4 max-w-lg mx-auto font-sans">
        <div className="bg-white border border-stone-250/95 rounded-2xl shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800"></div>
          
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-50 border border-amber-200/50 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-2xl font-serif text-stone-900 font-black tracking-tight">Faculty Suite Authorization</h2>
              <p className="text-xs text-stone-500 font-light mt-1.5">
                Authentication required to access student registries, edit compliance grades, or load lesson guides.
              </p>
            </div>

            {loginError && (
              <div className="mb-5 bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-705 animate-headShake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleFacultyLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold">Faculty Email Address</label>
                <input
                  id="faculty-email-input"
                  type="email"
                  placeholder="name@truetrek.edu"
                  value={facultyEmail}
                  onChange={(e) => setFacultyEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-stone-455 block uppercase tracking-wider mb-1.5 font-semibold">Security Passcode</label>
                <div className="relative">
                  <input
                    id="faculty-passcode-input"
                    type="password"
                    placeholder="Enter security key"
                    value={facultyPasscode}
                    onChange={(e) => setFacultyPasscode(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-350">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <button
                id="faculty-auth-submit-btn"
                type="submit"
                disabled={successAnimation}
                className="w-full mt-2 py-3.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-700 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
                title="Authenticate credentials and access the faculty system"
                aria-label="Authenticate credentials and access the faculty system"
              >
                {successAnimation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-100 border-t-transparent rounded-full animate-spin"></div>
                    Authenticating Faculty...
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    AUTHORIZED ACCESS ENTRY
                  </>
                )}
              </button>
            </form>

            {/* Premium Demonstration & Quick Preview Section */}
            <div className="mt-8 pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-600">
                  Institutional Demo Bypass & Previewer
                </h4>
              </div>
              <p className="text-[11px] text-stone-400 font-light leading-relaxed mb-4">
                To showcase the faculty dashboard directly to school boards, organizations, and evaluators, select one of the following official accounts to login instantly:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  id="demo-dean-bypass"
                  type="button"
                  onClick={() => handleBypassOrPreview('dean')}
                  className="flex items-center justify-between text-left p-2.5 rounded-xl border border-stone-200 hover:border-amber-650 hover:bg-amber-50/10 transition group"
                  title="Bypass login as Dean of Admissions"
                  aria-label="Bypass login as Dean of Admissions"
                >
                  <div>
                    <p className="text-[10px] font-mono font-bold tracking-wider text-stone-800 group-hover:text-amber-800 transition">Dean of Admissions</p>
                    <p className="text-[9px] text-stone-400">dean@truetrek.edu</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-350 group-hover:text-amber-700 transition" />
                </button>

                <button
                  id="demo-partner-bypass"
                  type="button"
                  onClick={() => handleBypassOrPreview('partner')}
                  className="flex items-center justify-between text-left p-2.5 rounded-xl border border-stone-200 hover:border-amber-650 hover:bg-amber-50/10 transition group"
                  title="Bypass login as Partner Facilitator"
                  aria-label="Bypass login as Partner Facilitator"
                >
                  <div>
                    <p className="text-[10px] font-mono font-bold tracking-wider text-stone-800 group-hover:text-amber-800 transition">Partner Facilitator</p>
                    <p className="text-[9px] text-stone-400">partner@academy.edu</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-350 group-hover:text-amber-700 transition" />
                </button>
              </div>

              <button
                id="demo-visitor-instant-preview"
                type="button"
                onClick={() => handleBypassOrPreview('visitor')}
                className="w-full mt-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-850 font-bold text-[10px] font-mono uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 border border-amber-200/50"
                title="Bypass login and open dashboard in Guest Preview mode"
                aria-label="Bypass login and open dashboard in Guest Preview mode"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Instant Guest Preview (No Passcode)
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="teacher-portal-view" className="py-10 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto min-h-[85vh] font-sans">
      
      {/* Header Block with high-end Display Typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-10 border-b border-stone-200">
        <div>
          <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-bold block mb-1">Administrative Terminal</span>
          <h1 className="text-3xl font-serif font-black tracking-tight text-stone-900 flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-amber-700" />
            Teacher & Faculty Suite
          </h1>
          <p className="text-sm text-stone-500 font-light mt-0.5">
            Review student progress analytics, adjust test scores, administer curriculum manuals, and manage cohort enrollment slots.
          </p>
        </div>
        
        {/* Actions bar for Portal */}
        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            onClick={handleFacultyLogout}
            className="px-4 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-xl tracking-wider hover:scale-[1.01] transition-all flex items-center gap-2 border border-stone-200 shadow-sm"
            title="Log out of the Faculty administrative terminal workspace"
            aria-label="Log out of the Faculty administrative terminal workspace"
          >
            <Lock className="w-4 h-4 text-stone-400" />
            SIGN OUT
          </button>
          
          <button
            onClick={handleOpenRegister}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:scale-[1.01] transition-all flex items-center gap-2"
            title="Add and configure a new scholar-athlete registration profile"
            aria-label="Add and configure a new scholar-athlete registration profile"
          >
            <Plus className="w-4 h-4" />
            ENROLL STUDENT
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-stone-200/80 mb-8 overflow-x-auto whitespace-nowrap scrollbar-none gap-2 font-mono text-xs font-semibold tracking-wider uppercase text-stone-500">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-4 px-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-amber-700 text-amber-800 font-bold' : 'border-transparent hover:text-stone-850'}`}
          title="Switch tab to Faculty Analytics Dashboard"
          aria-label="Switch tab to Faculty Analytics Dashboard"
        >
          <TrendingUp className="w-4 h-4" />
          Analytics Dashboard
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-4 px-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'students' ? 'border-amber-700 text-amber-800 font-bold' : 'border-transparent hover:text-stone-850'}`}
          title="Switch tab to Scholar-Athlete Enrollment Slots and Compliance Scores"
          aria-label="Switch tab to Scholar-Athlete Enrollment Slots and Compliance Scores"
        >
          <Users className="w-4 h-4" />
          Enrollment & Scores ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('manuals')}
          className={`pb-4 px-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'manuals' ? 'border-amber-700 text-amber-800 font-bold' : 'border-transparent hover:text-stone-850'}`}
          title="Switch tab to Curriculum Instruction Manuals"
          aria-label="Switch tab to Curriculum Instruction Manuals"
        >
          <BookOpenCheck className="w-4 h-4" />
          Instructional Manuals
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-4 px-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'documents' ? 'border-amber-700 text-amber-800 font-bold' : 'border-transparent hover:text-stone-850'}`}
          title="Switch tab to Curriculum PDF Resources and Guides"
          aria-label="Switch tab to Curriculum PDF Resources and Guides"
        >
          <FileText className="w-4 h-4" />
          Curriculum Documents
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.22 }}
        >
          
          {/* TAB 1: ANALYTICS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              
              {/* Live Student Portal Performance Feedback */}
              <div id="live-compliance-feedback-panel" className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-amber-500 to-transparent pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">Real-time Portal Synchronization Active</span>
                    </div>
                    <h4 className="text-xl font-serif text-stone-900 font-bold">Scholar-Athlete Current Compliance Index</h4>
                    <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed font-sans">
                      Monitoring Marcus Vance Jr.&apos;s live progress. Scoring updates occur dynamically as drills are completed, scenarios are analyzed, and regulatory covenants are certified in the Student Portal.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
                    {/* Current Score card */}
                    <div className="sm:w-72 w-full bg-white border border-stone-200/80 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-stone-500 font-bold uppercase">Aggregate Portal Score</span>
                          <span className="text-sm font-mono font-bold text-amber-850">{aggregateScore}%</span>
                        </div>
                        
                        {/* Animated visual progress bar */}
                        <div className="w-full bg-stone-100 rounded-full h-3.5 overflow-hidden mb-2 relative">
                          <motion.div 
                            className="bg-gradient-to-r from-amber-500 to-amber-700 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${aggregateScore}%` }}
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

                    {/* Trend Chart card! */}
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
                          <AreaChart data={trendData} margin={{ top: 2, right: 2, left: -28, bottom: -5 }}>
                            <defs>
                              <linearGradient id="trendScoreColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d97706" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#a8a29e" tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 100]} stroke="#a8a29e" tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', padding: '4px' }}
                              labelStyle={{ color: '#fff', fontSize: '8px', fontStyle: 'normal' }}
                              itemStyle={{ color: '#f59e0b', fontSize: '8px', padding: '0' }}
                            />
                            <Area type="monotone" dataKey="Score" stroke="#d97706" fillOpacity={1} fill="url(#trendScoreColor)" strokeWidth={2} name="Score" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick High-Contrast Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-stone-400">Total Enrolled</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-2">{totalEnrollments}</p>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1 font-mono">
                      <span>● Active Slots Filled</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-750">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-stone-400">Class Avg Score</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-2">{averageComplianceScore}%</p>
                    <p className="text-[11px] text-stone-400 font-medium mt-1 font-mono">
                      Scored out of 100 on quiz drills
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-750">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-stone-400">Avg Program Progress</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-2">{averageProgress}%</p>
                    <div className="w-24 bg-stone-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div className="bg-amber-600 h-full" style={{ width: `${averageProgress}%` }} />
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-750">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-stone-400">Active Streaks ≥ 10d</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-2">{highlyActiveCount}</p>
                    <p className="text-[11px] text-stone-400 mt-1 font-mono">
                      Continuous daily learning cycles
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-750">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                
              </div>

              {/* Graphical Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Recharts Chart 1: Enrollment Distribution */}
                <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                    <div>
                      <h3 className="font-serif font-bold text-base text-stone-900">Enrolled Students by Curriculum Tier</h3>
                      <p className="text-xs text-stone-400 font-light mt-0.5">Active registration load across key program tiers</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-stone-50 border border-stone-200 text-stone-500 rounded-lg">TTL Spectrum</span>
                  </div>
                  
                  <div className="h-72 w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tierDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                        <XAxis dataKey="name" stroke="#78716c" />
                        <YAxis allowDecimals={false} stroke="#78716c" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '12px' }}
                          labelStyle={{ color: '#fff', fontFamily: 'serif', fontWeight: 'bold' }}
                          itemStyle={{ fontFamily: 'monospace', color: '#f59e0b' }}
                        />
                        <Bar dataKey="Enrollments" fill="#d97706" radius={[4, 4, 0, 0]}>
                          {tierDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#b45309' : '#d97706'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recharts Chart 2: Scores & Progress Comparison */}
                <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                    <div>
                      <h3 className="font-serif font-bold text-base text-stone-900">Compliance score vs. Course Progress</h3>
                      <p className="text-xs text-stone-400 font-light mt-0.5">Individual candidate compliance compared with curriculum velocity</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-stone-50 border border-stone-200 text-stone-500 rounded-lg">Data Overlay</span>
                  </div>

                  <div className="h-72 w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b45309" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#b45309" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="progressColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                        <XAxis dataKey="name" stroke="#78716c" />
                        <YAxis stroke="#78716c" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '12px' }}
                          labelStyle={{ color: '#fff', fontFamily: 'serif', fontWeight: 'bold' }}
                          itemStyle={{ fontFamily: 'monospace' }}
                        />
                        <Area type="monotone" dataKey="Score" stroke="#b45309" fillOpacity={1} fill="url(#scoreColor)" strokeWidth={2} name="Test Score" />
                        <Area type="monotone" dataKey="Progress" stroke="#10b981" fillOpacity={1} fill="url(#progressColor)" strokeWidth={1.5} name="Prog %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Faculty Risk Council AI Diagnostic Advisor */}
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

                  {/* AI Response Output Block */}
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
                          <div className="whitespace-pre-wrap font-sans select-text select-all">
                            {aiReport}
                          </div>
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
          )}

          {/* TAB 2: STUDENTS REGISTRY & SCORE UPDATER */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              
              {/* Filter controls row */}
              <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-450">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-600 transition"
                    placeholder="Search candidate name, email, or institution..."
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/90 rounded-xl px-3 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-stone-400" />
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="bg-transparent text-xs font-mono text-stone-605 border-none focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all">All Specialties</option>
                      <option value="Academic">Academic</option>
                      <option value="Athletic">Athletic</option>
                      <option value="Professional">Professional</option>
                      <option value="Legacy">Legacy</option>
                    </select>
                  </div>

                  {/* Tier Filter */}
                  <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/90 rounded-xl px-3 py-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                    <select
                      value={selectedTierFilter}
                      onChange={(e) => setSelectedTierFilter(e.target.value)}
                      className="bg-transparent text-xs font-mono text-stone-605 border-none focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all">All Tiers</option>
                      {CURRICULUM_TIERS.map(tier => (
                        <option key={tier.id} value={tier.id}>{tier.number} ({tier.tag})</option>
                      ))}
                    </select>
                  </div>

                </div>

              </div>

              {/* Roster Database Table */}
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    
                    <thead>
                      <tr className="bg-stone-50 text-stone-450 font-mono text-[10px] uppercase tracking-wider border-b border-stone-200/80">
                        <th className="py-4 px-6 font-semibold">Student Name / Email</th>
                        <th className="py-4 px-6 font-semibold">Institution</th>
                        <th className="py-4 px-6 font-semibold">Category</th>
                        <th className="py-4 px-6 font-semibold text-center">Active Class Tier</th>
                        <th className="py-4 px-6 font-semibold text-center">Average Score</th>
                        <th className="py-4 px-6 font-semibold">Progress Ratio</th>
                        <th className="py-4 px-6 font-semibold text-center">Streak</th>
                        <th className="py-4 px-6 font-semibold text-center">Status</th>
                        <th className="py-4 px-6 font-semibold text-right">Faculty Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-stone-100 text-stone-702 text-xs">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => {
                          const activeTier = CURRICULUM_TIERS.find(t => t.id === student.activeTierId);
                          const daysSinceLast = getDaysSinceLastDrill(student.lastDrillDate);
                          const isAtRisk = daysSinceLast > 3;
                          return (
                            <tr 
                              key={student.id} 
                              className={`hover:bg-amber-50/10 transition-colors ${selectedStudent?.id === student.id ? 'bg-amber-50/20' : ''}`}
                            >
                              <td className="py-4.5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs shadow-inner shrink-0">
                                    {student.avatarText}
                                  </div>
                                  <div>
                                    <div className="flex items-center flex-wrap gap-2">
                                      <button
                                        onClick={() => setQuickViewStudent(student)}
                                        className="font-serif font-black text-stone-900 hover:text-amber-800 transition-colors cursor-pointer hover:underline text-left block"
                                        title={`Quick View compliance progress for ${student.name}`}
                                        aria-label={`Quick View compliance progress for ${student.name}`}
                                      >
                                        {student.name}
                                      </button>
                                      {isAtRisk && (
                                        <span 
                                          className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-md px-1.5 py-0.5 text-[8.5px] font-mono font-bold animate-pulse"
                                          title={`Alert: Inactive for ${daysSinceLast === 999 ? 'over 7' : daysSinceLast} days without completed drills`}
                                        >
                                          <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                                          RISK: {daysSinceLast === 999 ? '>7' : daysSinceLast}D
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-mono text-stone-400 mt-0.5">{student.email}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4.5 px-6 font-normal text-stone-600">
                                {student.institution}
                              </td>

                              <td className="py-4.5 px-6">
                                <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-bold ${
                                  student.category === 'Athletic' ? 'bg-emerald-55 text-emerald-700 border border-emerald-200/50' :
                                  student.category === 'Academic' ? 'bg-indigo-55 text-indigo-700 border border-indigo-200/50' :
                                  student.category === 'Professional' ? 'bg-amber-55 text-amber-700 border border-amber-200/50' :
                                  'bg-stone-100 text-stone-700'
                                }`}>
                                  {student.category}
                                </span>
                              </td>

                              <td className="py-4.5 px-6 text-center text-stone-850 font-mono font-semibold">
                                {activeTier ? activeTier.number : 'N/A'}
                                <span className="block text-[8px] font-light text-stone-400 font-sans mt-0.5 tracking-tight truncate max-w-[120px]">
                                  {activeTier ? activeTier.title : ''}
                                </span>
                              </td>

                              <td className="py-4.5 px-6 text-center font-mono font-bold text-stone-900">
                                <span className={`inline-block px-2 py-0.5 rounded-md ${
                                  student.averageScore >= 90 ? 'text-emerald-700 bg-emerald-50' :
                                  student.averageScore >= 80 ? 'text-amber-700 bg-amber-50' :
                                  'text-rose-700 bg-rose-50'
                                }`}>
                                  {student.averageScore}/100
                                </span>
                              </td>

                              <td className="py-4.5 px-6">
                                <div className="space-y-1 max-w-[120px]">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                                    <span>{student.progressPercent}%</span>
                                  </div>
                                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${student.progressPercent >= 80 ? 'bg-emerald-500' : 'bg-amber-650'}`} 
                                      style={{ width: `${student.progressPercent}%` }} 
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="py-4.5 px-6 text-center font-mono text-amber-700 font-bold">
                                {student.streakDays}d
                              </td>

                              <td className="py-4.5 px-6 text-center">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                                  student.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                  student.status === 'Complete' ? 'bg-amber-600' :
                                  'bg-amber-400'
                                }`} title={student.status} />
                                <span className="block text-[8px] font-mono text-stone-400 uppercase mt-0.5 tracking-wider">{student.status}</span>
                              </td>

                              <td className="py-4.5 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedStudent(student)}
                                    title="View Student Dossier & Test Details"
                                    aria-label="View Student Dossier & Test Details"
                                    className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEdit(student)}
                                    title="Edit Scores & Class Enrollment"
                                    aria-label="Edit Scores & Class Enrollment"
                                    className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(student.id, student.name)}
                                    title="Withdraw Candidate Slot"
                                    aria-label="Withdraw Candidate Slot"
                                    className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-stone-400 font-light">
                            <span className="block font-mono text-xs uppercase text-amber-700 mb-1">NO RECORDS FOUND</span>
                            No student dossiers match the selected active directory filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>

                  </table>
                </div>
              </div>

              {/* Drawer Detail Panel for Student Analysis */}
              <AnimatePresence>
                {selectedStudent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex justify-end"
                  >
                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 180 }}
                      className="w-full max-w-lg bg-white h-screen shadow-2xl p-6 sm:p-8 overflow-y-auto flex flex-col justify-between"
                    >
                      <div className="space-y-6">
                        {/* Upper Details Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-600/10 border border-amber-600/30 rounded-2xl flex items-center justify-center font-bold text-amber-750 text-base">
                              {selectedStudent.avatarText}
                            </div>
                            <div>
                              <h3 className="font-serif font-black text-xl text-stone-900 flex items-center flex-wrap gap-2">
                                {selectedStudent.name}
                                {getDaysSinceLastDrill(selectedStudent.lastDrillDate) > 3 && (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold animate-pulse">
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    RISK ALERT
                                  </span>
                                )}
                              </h3>
                              <p className="text-xs font-mono text-stone-400 mt-0.5">{selectedStudent.email}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setSelectedStudent(null)}
                            className="p-1.5 border border-stone-200 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        {/* Metadata blocks */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Institution</p>
                            <p className="text-xs text-stone-800 font-medium mt-1">{selectedStudent.institution}</p>
                          </div>
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Last Active Drill</p>
                            <p className={`text-xs font-bold mt-1 ${getDaysSinceLastDrill(selectedStudent.lastDrillDate) > 3 ? 'text-rose-700' : 'text-stone-850'}`}>
                              {selectedStudent.lastDrillDate ? `${selectedStudent.lastDrillDate} (${getDaysSinceLastDrill(selectedStudent.lastDrillDate)}d ago)` : 'Never'}
                            </p>
                          </div>
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Active Curriculum Placement</p>
                            <p className="text-xs text-stone-800 font-bold mt-1">
                              {CURRICULUM_TIERS.find(t => t.id === selectedStudent.activeTierId)?.number} 
                              <span className="font-normal font-sans text-stone-500 block text-[10px] truncate">
                                {CURRICULUM_TIERS.find(t => t.id === selectedStudent.activeTierId)?.title}
                              </span>
                            </p>
                          </div>
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Class Standings Score</p>
                            <p className="text-xs font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                              <span className="text-amber-700 text-sm">{selectedStudent.averageScore}/100</span>
                              <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">PASSED</span>
                            </p>
                          </div>
                        </div>

                        {/* Drill records status checklist of test scores */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">COMPLETED ASSESSMENTS & DRILLS</h4>
                          
                          {DRILL_QUESTIONS.map((drill, index) => {
                            const isCompleted = selectedStudent.completedDrillIds.includes(drill.id);
                            return (
                              <div 
                                key={drill.id} 
                                className={`p-4.5 rounded-xl border transition duration-200 ${
                                  isCompleted ? 'bg-emerald-58/5 border-emerald-200/60' : 'bg-stone-50 border-stone-200/40 text-stone-400'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <span className="text-[9px] font-mono uppercase block mb-1 font-bold">
                                      Drill #{index + 1} - {isCompleted ? 'CERTIFIED COMPLIANT' : 'OUTSTANDING'}
                                    </span>
                                    <p className="text-xs font-serif font-med line-clamp-2 leading-relaxed">
                                      {drill.scenario}
                                    </p>
                                  </div>
                                  <div className="shrink-0 pt-0.5">
                                    {isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border border-stone-300"></div>
                                    )}
                                  </div>
                                </div>
                                {isCompleted && (
                                  <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-emerald-800">Scored: {selectedStudent.averageScore} / 100</span>
                                    <span className="text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">VERIFIED ENTRY</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                      </div>

                      {/* Lower Actions Section in Drawer */}
                      <div className="pt-6 border-t border-stone-200 flex gap-3">
                        <button
                          onClick={() => {
                            handleOpenEdit(selectedStudent);
                            setSelectedStudent(null);
                          }}
                          className="flex-grow py-2.5 bg-stone-900 border hover:bg-stone-850 text-stone-100 text-xs font-mono uppercase font-bold rounded-xl tracking-wider text-center"
                        >
                          EDIT RECORD
                        </button>
                        <button
                          onClick={() => setSelectedStudent(null)}
                          className="px-5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-650 text-xs font-mono uppercase font-semibold rounded-xl"
                        >
                          CLOSE
                        </button>
                      </div>

                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* COMPACT STUDENT QUICK VIEW MODAL */}
              <AnimatePresence>
                {quickViewStudent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
                    onClick={() => setQuickViewStudent(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 15 }}
                      transition={{ type: "spring", duration: 0.4 }}
                      className="bg-white border border-stone-250 w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header with avatar & main stats */}
                      <div className="flex items-start justify-between pb-3.5 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center font-bold text-amber-750 text-sm shrink-0">
                            {quickViewStudent.avatarText}
                          </div>
                          <div>
                            <h3 className="font-serif font-black text-base text-stone-900 flex items-center flex-wrap gap-1.5">
                              {quickViewStudent.name}
                              {getDaysSinceLastDrill(quickViewStudent.lastDrillDate) > 3 && (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-md px-1.5 py-0.5 text-[8.5px] font-mono font-bold animate-pulse">
                                  <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                                  RISK
                                </span>
                              )}
                            </h3>
                            <p className="text-[10px] font-mono text-stone-400 mt-0.5">{quickViewStudent.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setQuickViewStudent(null)}
                          className="p-1 border border-stone-200 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition shrink-0"
                          title="Close Quick View"
                          aria-label="Close Quick View"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Brief Metadata Context */}
                      <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100 font-mono text-[10px]">
                        <div>
                          <span className="text-stone-400 uppercase block">Institution</span>
                          <span className="text-stone-850 font-bold font-sans truncate block mt-0.5">{quickViewStudent.institution}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 uppercase block">Category</span>
                          <span className="text-stone-850 font-bold block mt-0.5">{quickViewStudent.category}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-stone-200/50">
                          <span className="text-stone-400 uppercase block">Last Active Drill</span>
                          <span className={`font-bold block mt-0.5 ${getDaysSinceLastDrill(quickViewStudent.lastDrillDate) > 3 ? 'text-rose-700' : 'text-stone-850'}`}>
                            {quickViewStudent.lastDrillDate ? `${quickViewStudent.lastDrillDate} (${getDaysSinceLastDrill(quickViewStudent.lastDrillDate)} days ago)` : 'No recorded activity'}
                          </span>
                        </div>
                      </div>

                      {/* Progress and Score breakdown */}
                      <div className="space-y-3.5">
                        <div>
                          <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                            <span className="text-stone-450 uppercase font-semibold">Course Velocity & Progress</span>
                            <span className="text-amber-850 font-bold">{quickViewStudent.progressPercent}%</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden relative">
                            <motion.div 
                              className="bg-gradient-to-r from-amber-500 to-amber-700 h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${quickViewStudent.progressPercent}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                            <span className="text-stone-450 uppercase font-semibold">Compliance Assessment Rating</span>
                            <span className="text-emerald-700 font-bold">{quickViewStudent.averageScore}/100</span>
                          </div>
                          
                          {/* Score bar */}
                          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden relative">
                            <motion.div 
                              className="bg-emerald-600 h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${quickViewStudent.averageScore}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Completed drills summary checklist */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">DRILLED SYLLABUS SYNC</h4>
                        <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-stone-200">
                          {DRILL_QUESTIONS.map((drill, index) => {
                            const isCompleted = quickViewStudent.completedDrillIds.includes(drill.id);
                            return (
                              <div 
                                key={drill.id} 
                                className={`p-2.5 rounded-lg border flex items-center justify-between text-[10.5px] leading-relaxed transition ${
                                  isCompleted ? 'bg-emerald-50/20 border-emerald-100 text-stone-800' : 'bg-stone-50/50 border-stone-200/30 text-stone-400'
                                }`}
                              >
                                <span className="font-serif truncate max-w-[280px]">
                                  {index + 1}. {drill.scenario}
                                </span>
                                {isCompleted ? (
                                  <span className="text-[8px] font-mono bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded shrink-0 font-bold">CERTIFIED</span>
                                ) : (
                                  <span className="text-[8px] font-mono bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded shrink-0 font-medium">PENDING</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="pt-3 border-t border-stone-100 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(quickViewStudent);
                            setQuickViewStudent(null);
                          }}
                          className="flex-1 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase font-bold rounded-lg transition text-center"
                          title="Open full student dossier with detailed diagnostic history"
                        >
                          Open Full Dossier
                        </button>
                        <button
                          onClick={() => setQuickViewStudent(null)}
                          className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-650 font-mono text-[10px] uppercase font-semibold rounded-lg transition"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modal Candidate Dialog for enrolling and updating score */}
              <AnimatePresence>
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  >
                    <motion.form
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onSubmit={handleSaveStudent}
                      className="bg-white border border-stone-250 w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5"
                    >
                      
                      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                        <div>
                          <h3 className="font-serif font-black text-lg text-stone-950">
                            {editingStudentId ? 'Adjust Scholar-Athlete Metrics' : 'Enroll Candidate into Registry'}
                          </h3>
                          <p className="text-[11px] text-stone-450 mt-0.5">TrueTrek Cohort validation slot allocation</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsRegistering(false)}
                          className="p-1 border border-stone-200 rounded-full text-stone-450 hover:bg-stone-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4 text-xs font-mono">
                        
                        {/* Name and Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Candidate Name *</label>
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-650 font-sans"
                              placeholder="e.g. Richard Pierce"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Advisor Notification Email *</label>
                            <input 
                              type="email" 
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-650 font-sans"
                              placeholder="e.g. r_pierce@crimson.ua.edu"
                            />
                          </div>
                        </div>

                        {/* Institution and Specialty Tract */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Institution / Affiliated Academy *</label>
                            <input 
                              type="text" 
                              required
                              value={formData.institution}
                              onChange={(e) => setFormData({...formData, institution: e.target.value})}
                              className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-650 font-sans"
                              placeholder="e.g. Auburn University"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Specialty Focus Tract</label>
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value })}
                              className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                            >
                              <option value="Academic">Academic</option>
                              <option value="Athletic">Athletic</option>
                              <option value="Professional">Professional</option>
                              <option value="Legacy">Legacy</option>
                            </select>
                          </div>
                        </div>

                        {/* Course Placement and Enrollment Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Curriculum Placement Tier</label>
                            <select
                              value={formData.activeTierId}
                              onChange={(e) => setFormData({...formData, activeTierId: e.target.value})}
                              className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                            >
                              {CURRICULUM_TIERS.map(t => (
                                <option key={t.id} value={t.id}>{t.number}: {t.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Enrollment Standing Status</label>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({...formData, status: e.target.value })}
                              className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                            >
                              <option value="Active">Active Student</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Complete">Complete (Tier Alumni)</option>
                            </select>
                          </div>
                        </div>

                        {/* Scores & Progress Slider settings */}
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 gap-4 space-y-3.5">
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold mb-1">
                              <span>VERIFIED COMPLIANCE DRILL SCORE</span>
                              <span className="text-amber-800 font-mono">{formData.averageScore} / 100</span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              value={formData.averageScore}
                              onChange={(e) => setFormData({...formData, averageScore: Number(e.target.value)})}
                              className="w-full accent-amber-600 cursor-pointer"
                            />
                            <p className="text-[9px] text-stone-400 font-sans tracking-tight">Updates the aggregate test score on the active database profile</p>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold mb-1">
                              <span>CURRICULUM MODULES PROGRESS PROGRESSION</span>
                              <span className="text-amber-800 font-mono">{formData.progressPercent}%</span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              value={formData.progressPercent}
                              onChange={(e) => setFormData({...formData, progressPercent: Number(e.target.value)})}
                              className="w-full accent-amber-600 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-stone-450 uppercase mb-1 font-bold">Continuous Learning Streak (Days)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={formData.streakDays}
                              onChange={(e) => setFormData({...formData, streakDays: Number(e.target.value)})}
                              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none placeholder:text-stone-300 font-sans"
                            />
                          </div>
                        </div>

                      </div>

                      {/* Bottom action controls */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => setIsRegistering(false)}
                          className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-stone-900 border hover:bg-stone-850 text-stone-100 font-bold rounded-xl"
                        >
                          {editingStudentId ? 'SAVE CHANCES' : 'ENROLL CANDIDATE'}
                        </button>
                      </div>

                    </motion.form>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}

          {/* TAB 3: INSTRUCTIONAL MANUALS */}
          {activeTab === 'manuals' && (
            <div className="space-y-8">
              
              {/* Alert Warning Box */}
              <div className="bg-amber-500/5 border border-amber-500/30 p-5 rounded-2xl flex items-start gap-4">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">Faculty Operational Integrity Protocols</h4>
                  <p className="text-xs text-stone-605 leading-relaxed font-light mt-0.5">
                    Under standard covenants, these teaching manuals contain proprietary cognitive behavioral and contract evaluation scripts licensed to registered educational networks. All classroom assignments must respect federal FERPA protections. Hide individual student performance records during external audits.
                  </p>
                </div>
              </div>

              {/* Grid of Manual modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TEACHER_MANUALS.map((manual, idx) => (
                  <div 
                    key={manual.id}
                    id={`manual-card-${manual.id}`}
                    className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:border-amber-600/30 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest bg-stone-100 text-stone-600 px-2.5 py-1 rounded-md font-bold">
                          MODULE 0{idx + 1}
                        </span>
                        <BookOpenCheck className="w-5 h-5 text-amber-600" />
                      </div>
                      
                      <h4 className="font-serif font-bold text-stone-900 text-base leading-snug mb-1">
                        {manual.title}
                      </h4>
                      <p className="text-[10px] font-mono text-amber-800 font-bold uppercase tracking-tight mb-4">
                        {manual.subtitle}
                      </p>

                      <div className="space-y-3.5 text-xs text-stone-650 font-light leading-relaxed">
                        <div className="p-3 bg-[#faf9f6] rounded-xl border border-stone-200/50">
                          <p className="font-mono text-[9px] uppercase text-stone-400 font-bold mb-1">Instructional Objective</p>
                          <p className="text-stone-700">{manual.objective}</p>
                        </div>
                        
                        <div className="p-3 bg-[#faf9f6] rounded-xl border border-stone-200/50">
                          <p className="font-mono text-[9px] uppercase text-stone-400 font-bold mb-1">Suggested Method Flow</p>
                          <p className="text-stone-700">{manual.method}</p>
                        </div>

                        <div>
                          <p className="font-mono text-[9px] uppercase text-stone-400 font-bold mb-2">Evaluation Checklist</p>
                          <ul className="space-y-1.5 text-stone-600 text-[11px]">
                            {manual.checklist.map((item, idy) => (
                              <li key={idy} className="flex items-start gap-1 w-full text-left">
                                <span className="text-amber-500 font-mono mt-0.5 shrink-0">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-450">
                      <span>Ref ID: {manual.id}</span>
                      <button 
                        onClick={() => window.alert(`Manual detail guide for ${manual.title} registered to licensed institutional network account. Printable framework generated successfully.`)}
                        className="text-amber-700 hover:text-amber-905 font-bold flex items-center gap-1 hover:underline"
                      >
                        PRINT SYLLABUS
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 4: CURRICULUM DOCUMENTS VAULT */}
          {activeTab === 'documents' && (
            <div className="space-y-8">
              
              {/* Document Repository list */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-stone-100 gap-4 mb-6">
                  <div>
                    <h3 className="font-serif font-black text-xl text-stone-900">Document Locker & Credentials Assets</h3>
                    <p className="text-xs text-stone-500 font-light mt-0.5">Deploy licensed publications directly with classrooms, students, and legal guardians.</p>
                  </div>
                  
                  <span className="text-xs font-mono bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-200/50 rounded-xl font-bold">
                    4 LICID REPOSITORY ASSETS ACTIVE
                  </span>
                </div>

                <div className="divide-y divide-stone-100">
                  {CURRICULUM_DOCUMENTS.map((doc) => (
                    <div 
                      key={doc.id}
                      className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-stone-50/50 px-4 -mx-4 rounded-xl transition-colors duration-250"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200/50 rounded">
                            {doc.category}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">Version {doc.version}</span>
                        </div>
                        <h4 className="font-serif font-bold text-stone-900 text-base leading-snug">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-stone-550 leading-relaxed font-light">
                          {doc.description}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-stone-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 stroke-2" />
                            Compiled: {doc.lastUpdated}
                          </span>
                          <span>Format: {doc.format}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => window.alert(`Syllabus framework preview for "${doc.title}" initiated. Contact licensing representatve for physical prints.`)}
                          className="px-4 py-2 bg-stone-50 border border-stone-200 hover:bg-stone-100 rounded-xl text-stone-700 text-xs font-mono font-semibold flex items-center gap-1.5 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          PREVIEW
                        </button>
                        <button
                          onClick={() => window.alert(`Licensing Verified. Download of "${doc.title}" formatted for institutional use has begun. Check your browser downloads directory.`)}
                          className="px-4 py-2 bg-stone-900 hover:bg-stone-850 rounded-xl text-stone-100 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          DOWNLOAD PDF
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}