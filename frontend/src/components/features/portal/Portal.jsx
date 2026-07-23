"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CURRICULUM_TIERS, DRILL_QUESTIONS, ADVISOR_PERSONAS } from '@/data/curriculum';

import {
  Award, ShieldAlert, Sparkles, BookOpen, Brain, Scale, Calendar,
  Send, UserCheck, Flame, Medal, CheckCircle, HelpCircle, Lock, RefreshCw, Zap,
  Trophy, Crown, Clock,

} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { requestAdvisorAdvice } from '@/services/advisorService';
import { getUserLevelDetails } from '@/lib/portalLevels';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import {
  selectPortal,
  setPoints as setPointsAction,
  setCompletedModules as setCompletedModulesAction,
  setConsultationCount as setConsultationCountAction,
  setUnlockedBadges as setUnlockedBadgesAction,
} from '@/store/slices/portal/portalSlice';
import { resolveUpdater } from '@/utils';
import AuthGateCard from '@/components/ui/AuthGateCard';
import AuthField from '@/components/ui/AuthField';
import AuthSubmitButton from '@/components/ui/AuthSubmitButton';
import CloseButton from '@/components/ui/CloseButton';
import PingDotSpinner from '@/components/ui/PingDotSpinner';
import AccountMenu from '@/components/ui/AccountMenu';

export default function Portal({
  isLoggedIn,
  setIsLoggedIn,
  drillCompletedList,
  setDrillCompletedList,
  streakDays,
  setStreakDays,
  aggregateScore,
  setAggregateScore
}) {
  const [loginEmail, setLoginEmail] = useState('aiguy503@gmail.com');
  const [loginPass, setLoginPass] = useState('••••••••');
  
  // Tab state (dashboard, drill, warroom, and achievements progress center)
  const [activeTab, setActiveTab] = useState('dashboard');

  // Gamification progress — Redux session state (not localStorage)
  const router = useRouter();
  const dispatch = useDispatch();
  const portalState = useSelector(selectPortal);
  const { loginStudent } = useAuth();

  const points = portalState.points;
  const setPoints = (value) =>
    dispatch(setPointsAction(resolveUpdater(value, portalState.points)));

  const completedModules = portalState.completedModules;
  const setCompletedModules = (value) =>
    dispatch(
      setCompletedModulesAction(
        resolveUpdater(value, portalState.completedModules)
      )
    );

  const consultationCount = portalState.consultationCount;
  const setConsultationCount = (value) =>
    dispatch(
      setConsultationCountAction(
        resolveUpdater(value, portalState.consultationCount)
      )
    );

  const unlockedBadges = portalState.unlockedBadges;
  const setUnlockedBadges = (value) =>
    dispatch(
      setUnlockedBadgesAction(resolveUpdater(value, portalState.unlockedBadges))
    );

  const [lastNotification, setLastNotification] = useState(null);
  
  // Detail audit module view popup state
  const [auditingTier, setAuditingTier] = useState(null);

  // Auto-dismiss layout timer for on-screen HUD popups
  React.useEffect(() => {
    if (lastNotification) {
      const timer = setTimeout(() => {
        setLastNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastNotification]);

    const currentLevelInfo = getUserLevelDetails(points);

  // High quality elite master badge roster
  const BADGES = [
    {
      id: 'recruit',
      title: 'Fresh Recruit',
      desc: 'Simulated access granted to the Elite Mastermind Portal.',
      criteria: 'Log in to the Student Portal',
      icon: 'UserCheck',
      category: 'milestone',
      isUnlocked: isLoggedIn
    },
    {
      id: 'first-drill',
      title: 'Strategic Pulse',
      desc: 'Completed your first high-stakes situational tactical drill.',
      criteria: 'Solve 1 situational drill',
      icon: 'Brain',
      category: 'drill',
      isUnlocked: drillCompletedList.length >= 1
    },
    {
      id: 'perfect-drill',
      title: 'Tactical Maverick',
      desc: 'Achieved a perfect score of 100/100 on a situational drill.',
      criteria: 'Score 100 points in any drill',
      icon: 'Zap',
      category: 'drill',
      isUnlocked: aggregateScore === 100 && drillCompletedList.length >= 1
    },
    {
      id: 'governance-master',
      title: 'Grand Tactician',
      desc: 'Completed all compliance drills inside the situational portfolio.',
      criteria: 'Solve all 3 core drills',
      icon: 'Trophy',
      category: 'drill',
      isUnlocked: drillCompletedList.length === 3
    },
    {
      id: 'advisor-consult',
      title: 'Council Protégé',
      desc: 'Sought strategic feedback from the elite Advisor Council.',
      criteria: 'Run 1 consultant query in War Room',
      icon: 'Scale',
      category: 'advisor',
      isUnlocked: consultationCount >= 1
    },
    {
      id: 'streak-champ',
      title: 'Relentless Scholar',
      desc: 'Maintained a persistent streak in situational drills.',
      criteria: 'Reach a daily streak of 7+ days',
      icon: 'Flame',
      category: 'milestone',
      isUnlocked: streakDays >= 7
    },
    {
      id: 'ivy-scholar',
      title: 'Academy Laureate',
      desc: 'Audited and certified multiple modules in the 11-Tier program.',
      criteria: 'Certify 3 or more Educational Tiers',
      icon: 'BookOpen',
      category: 'educational',
      isUnlocked: completedModules.length >= 3
    },
    {
      id: 'legacy-guardian',
      title: 'Sovereign Steward',
      desc: 'Completed Tier 9 (Legacy & Wealth Preservation) curriculum.',
      criteria: 'Certify Tier 9 module',
      icon: 'Crown',
      category: 'educational',
      isUnlocked: completedModules.includes('tier-9')
    }
  ];

  // Helper routine to render matching badge vectors dynamically without index typing issues
  const renderBadgeIcon = (iconName, unlocked) => {
    const cls = `w-6 h-6 ${unlocked ? 'text-amber-600' : 'text-stone-400'}`;
    switch (iconName) {
      case 'UserCheck': return <UserCheck className={cls} />;
      case 'Brain': return <Brain className={cls} />;
      case 'Zap': return <Zap className={cls} />;
      case 'Trophy': return <Trophy className={cls} />;
      case 'Scale': return <Scale className={cls} />;
      case 'Flame': return <Flame className={cls} />;
      case 'BookOpen': return <BookOpen className={cls} />;
      case 'Crown': return <Crown className={cls} />;
      default: return <Award className={cls} />;
    }
  };

  const handleCertifyModule = (moduleId, title) => {
    if (completedModules.includes(moduleId)) return;
    
    const updated = [...completedModules, moduleId];
    setCompletedModules(updated);

    // Reward points
    const reward = 200;
    setPoints((prev) => {
      const next = prev + reward;

      return next;
    });

    setLastNotification({
      title: `📚 MODULE CERTIFIED (+200 XP)`,
      desc: `Compliance verified for ${title}. Your certificate has been authenticated.`,
      type: 'points'
    });

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#d97706', '#10b981']
    });
  };

  // Synchronize badge unlocks
  React.useEffect(() => {
    if (!isLoggedIn) return;
    
    BADGES.forEach((badge) => {
      if (badge.isUnlocked && !unlockedBadges.includes(badge.id)) {
        setUnlockedBadges((prev) => {
          if (prev.includes(badge.id)) return prev;
          const updated = [...prev, badge.id];

          // Notify user
          setLastNotification({
            title: `🏆 BADGE UNLOCKED!`,
            desc: `${badge.title}: ${badge.desc}`,
            type: 'badge'
          });

          confetti({
            particleCount: 100,
            spread: 70,
            colors: ['#fbbf24', '#f59e0b', '#d97706']
          });

          return updated;
        });
      }
    });
  }, [points, completedModules, drillCompletedList, streakDays, consultationCount, isLoggedIn]);

  // Dashboard configuration states
  const [brandReach, setBrandReach] = useState('optimized');

  // Drill tracking states
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  // War Room strategic states
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('recruiter');
  const [customScenario, setCustomScenario] = useState('');
  const [advisorAdvice, setAdvisorAdvice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic NIL Earnings calculator based on Reach Multiplier
  const baseTransactions = [
    { quarter: 'Q1', brandingRevenue: 4000, partnershipRevenue: 2500, licensingRevenue: 1500 },
    { quarter: 'Q2', brandingRevenue: 6500, partnershipRevenue: 4200, licensingRevenue: 2800 },
    { quarter: 'Q3', brandingRevenue: 12000, partnershipRevenue: 8500, licensingRevenue: 5000 },
    { quarter: 'Q4', brandingRevenue: 18500, partnershipRevenue: 14000, licensingRevenue: 9500 }
  ];

  const calculatedNILData = baseTransactions.map((tx) => {
    let multiplier = 1.0;
    if (brandReach === 'optimized') multiplier = 1.45;
    if (brandReach === 'viral') multiplier = 2.2;

    return {
      quarter: tx.quarter,
      'Personal Branding': Math.round(tx.brandingRevenue * multiplier),
      'Sponsorships & Teams': Math.round(tx.partnershipRevenue * multiplier),
      'Avatar Licensing': Math.round(tx.licensingRevenue * multiplier),
    };
  });

  const selectedAdvisor = ADVISOR_PERSONAS.find(a => a.id === selectedAdvisorId) || ADVISOR_PERSONAS[0];

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginStudent({
        email: loginEmail,
        password: loginPass,
        name: 'Marcus Vance Jr.',
      });
    } catch (err) {
      console.error('Student login failed', err);
      return;
    }
    // Initial welcome confetti burst
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#d97706', '#b45309', '#1c1917']
    });
  };

  const selectPrebuiltScenario = (presetText) => {
    setCustomScenario(presetText);
  };

  const handleQueryAdvisor = async () => {
    if (!customScenario.trim()) return;
    setIsGenerating(true);
    setAdvisorAdvice('');

    try {
      const data = await requestAdvisorAdvice({
          scenario: customScenario,
          systemPrompt: selectedAdvisor.systemPrompt,
          advisorName: selectedAdvisor.name
        });
      if (data.advice) {
        setAdvisorAdvice(data.advice);
        
        // Award points & consultations count for seeking expert advisory counsel
        setConsultationCount((prev) => {
          const next = prev + 1;

          return next;
        });

        setPoints((prev) => {
          const next = prev + 100;

          return next;
        });

        setLastNotification({
          title: '🧠 COUNSEL OBTAINED (+100 XP)',
          desc: `You consulted ${selectedAdvisor.name} and received strategic clarity on your scenario!`,
          type: 'points'
        });
      } else if (data.error) {
        setAdvisorAdvice(`### Operational Error\n\n${data.error}\n\n*Please ensure your configuration schemas are compiled properly.*`);
      }
    } catch (err) {
      console.error('Advisor fetch error:', err);
      setAdvisorAdvice(`### Connection Interrupt\n\nFailed to establish a secure link with the regional council matrix. Server returned: "${err.message || err}".`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionKey, score) => {
    setSelectedOption(optionKey);
    const activeDrill = DRILL_QUESTIONS[activeDrillIndex];
    
    if (!drillCompletedList.includes(activeDrill.id)) {
      const updatedList = [...drillCompletedList, activeDrill.id];
      setDrillCompletedList(updatedList);
      
      const isPerfect = score === 100;
      let earnedXP = score * 2;
      if (isPerfect) {
        earnedXP += 100; // Perfect score bonus
      }

      setPoints((prev) => {
        const next = prev + earnedXP;

        return next;
      });

      setLastNotification({
        title: `🔥 DRILL COMPLETED (+${earnedXP} XP)`,
        desc: `You scored ${score}/100. ${isPerfect ? 'PERFECT SCORE BONUS! ' : ''}Your cumulative scorecard metrics have been elevated.`,
        type: 'points'
      });
      
      // Update streak and aggregate averages
      if (score === 100) {
        setStreakDays((prev) => {
          const nextStreak = prev + 1;

          return nextStreak;
        });
        // Play perfect mark confetti!
        confetti({
          particleCount: 120,
          spread: 80,
          colors: ['#059669', '#10b981', '#fbbf24']
        });
      }
      setAggregateScore((prev) => Math.round((prev + score) / 2));
    }
  };

  // Skip or reset drills
  const handleNextDrill = () => {
    setSelectedOption(null);
    setActiveDrillIndex((prev) => (prev + 1) % DRILL_QUESTIONS.length);
  };


  return (
    <div id="portal-dashboard-page" className="bg-[#faf9f6] min-h-screen border-t border-stone-200">
      
      {/* Toast Notification HUD Popup */}
      {lastNotification && (
        <div 
          id="hud-toast-notification" 
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-stone-900 border border-stone-800 text-white rounded-2xl shadow-2xl p-5 flex items-start gap-4 animate-fade-in transition duration-300 transform scale-100"
        >
          <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
            lastNotification.type === 'badge' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {lastNotification.type === 'badge' ? <Trophy className="w-5 h-5 animate-bounce" /> : <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />}
          </div>
          <div className="flex-grow space-y-1">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">{lastNotification.title}</h5>
            <p className="text-[11px] text-stone-300 font-light leading-normal">{lastNotification.desc}</p>
          </div>
          <button 
            onClick={() => setLastNotification(null)}
            className="text-stone-500 hover:text-white p-1 hover:bg-stone-850 rounded-full transition"
            title="Dismiss compliance notification and close toast"
            aria-label="Dismiss compliance notification and close toast"
          >
            ✕
          </button>
        </div>
      )}

      {/* Student credentials banner element */}
      <section id="portal-credential-banner" className="bg-stone-900 text-white py-6 px-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-stone-950 font-black rounded-full flex items-center justify-center text-lg shadow-inner shrink-0">
                MJ
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-serif font-bold text-white">Marcus Vance Jr. (Scholar-Athlete)</h3>
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded">
                    D1 Varsity Recruited
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5 font-light">
                  Primary Focus: <strong className="text-stone-300">Tier 2: Recruiting Window</strong> & <strong className="text-stone-300">Tier 6: NIL Intellectual IP</strong>
                </p>
              </div>
            </div>

            <AccountMenu variant="dark" onProfile={() => router.push(ROUTES.PROFILE)} />
          </div>

          {/* KPI Mini boxes */}
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="bg-stone-850 border border-stone-800 p-2.5 rounded-xl flex items-center gap-2.5 flex-1 md:flex-initial">
              <Award className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <p className="text-[9px] font-mono uppercase text-stone-450 tracking-wider">INTELLIGENCE XP POINTS</p>
                <p className="text-xs font-mono font-bold text-stone-100">{points} PTS (Lvl {getUserLevelDetails(points).level})</p>
              </div>
            </div>

            <div className="bg-stone-850 border border-stone-800 p-2.5 rounded-xl flex items-center gap-2.5 flex-1 md:flex-initial">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[9px] font-mono uppercase text-stone-450 tracking-wider">DAILY DRILLS STREAK</p>
                <p className="text-xs font-mono font-bold text-stone-100">{streakDays} Days</p>
              </div>
            </div>

            <div className="bg-stone-850 border border-stone-800 p-2.5 rounded-xl flex items-center gap-2.5 flex-1 md:flex-initial">
              <Medal className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="w-full">
                <p className="text-[9px] font-mono uppercase text-stone-450 tracking-wider">AVERAGE COMPLIANCE SCORE</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs font-mono font-bold text-stone-100 shrink-0">{aggregateScore}% Green</p>
                  <div className="w-16 bg-stone-900 h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                    <motion.div 
                      className="bg-amber-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${aggregateScore}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main portal tab structure layout */}
      <section className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navigation drawer sidebar */}
          <aside className="space-y-2">
            {[
              { id: 'dashboard', label: 'Incubator Dashboard', icon: BookOpen, desc: 'NIL Progress & Progressions' },
              { id: 'drill', label: 'The Daily Drill', icon: Brain, desc: 'Situational Intelligence Training' },
              { id: 'warroom', label: 'The War Room', icon: Scale, desc: 'AI Mastermind Advisor Console' },
              { id: 'achievements', label: 'Progress & Badges', icon: Award, desc: 'Scholar Accomplishments & XP' }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  id={`portal-nav-tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id )}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                    activeTab === tab.id
                      ? 'bg-amber-100/60 border-amber-300/40 text-amber-900 shadow-xs'
                      : 'bg-white hover:bg-stone-50 border-stone-250/50 text-stone-600'
                  }`}
                  title={`Switch tab view to ${tab.label}: ${tab.desc}`}
                  aria-label={`Switch tab view to ${tab.label}: ${tab.desc}`}
                >
                  <TabIcon className={`w-5 h-5 shrink-0 ${activeTab === tab.id ? 'text-amber-700' : 'text-stone-400 group-hover:text-stone-700'}`} />
                  <div>
                    <span className="block text-xs font-semibold tracking-wide uppercase font-mono">{tab.label}</span>
                    <span className="block text-[11px] text-stone-500 mt-0.5 leading-tight font-light">{tab.desc}</span>
                  </div>
                </button>
              );
            })}

            <div className="p-4 bg-white border border-stone-250/50 rounded-xl mt-6 space-y-4">
              <p className="text-xs font-mono uppercase text-stone-400 tracking-wider">Upcoming Covenants</p>
              <div className="space-y-3">
                <div className="text-[11px] leading-relaxed flex gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-stone-800">NIL Trademark Redlines</p>
                    <p className="text-stone-500 font-light">With Amanda Ross, Esq — Today (2 hrs)</p>
                  </div>
                </div>
                <div className="text-[11px] leading-relaxed flex gap-2 border-t border-stone-100 pt-3">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-stone-800">C-Suite Bias Foundations</p>
                    <p className="text-stone-505 font-light">With Richard Sterling — June 2nd</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Interactive tab displays column */}
          <main className="lg:col-span-3 space-y-8">
            
            {/* TAB 1: DASHBOARD OVERLAY */}
            {activeTab === 'dashboard' && (
              <div id="tab-dashboard-wrapper" className="space-y-6">
                
                {/* Visual streak tracker milestones progress bar */}
                <div className="bg-white border border-stone-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <span className="text-stone-400 text-[10px] font-mono uppercase tracking-widest block mb-1">Incubation Progression Tracker</span>
                    <h4 className="text-lg font-serif text-stone-900 font-bold mb-3">Mastery Level Milestones</h4>
                    
                    <div className="w-full bg-stone-100 rounded-full h-2 mb-2">
                      <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${(drillCompletedList.length / DRILL_QUESTIONS.length) * 100 || 22}%` }}></div>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Completed <strong className="text-stone-800">{drillCompletedList.length}</strong> of <strong className="text-stone-800">{DRILL_QUESTIONS.length}</strong> core situational drills to advance to Academic Spike Level.
                    </p>
                  </div>

                  <div className="bg-stone-50 border p-4 rounded-xl flex items-center gap-3 md:w-56 justify-center">
                    <Medal className="text-amber-500 w-8 h-8 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-mono uppercase text-stone-400">NEXT CERTIFICATION</p>
                      <p className="text-xs font-bold text-stone-800 mt-0.5">Recruit Governance (Tier 2)</p>
                    </div>
                  </div>
                </div>
                
                {/* Live Real-Time Compliance Performance Index */}
                <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 p-6 rounded-2xl text-white shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">Performance Matrix Feed</span>
                      </div>
                      <h4 className="text-lg font-serif font-bold text-white mb-2">Real-Time Compliance Evaluation</h4>
                      <p className="text-xs text-stone-300 leading-relaxed max-w-xl font-sans">
                        Your compliance index is assessed in real-time based on your responses during daily situational drills and certified education modules. Higher scores guarantee elite Tier status and program credits.
                      </p>
                    </div>

                    <div className="md:w-72 w-full bg-stone-950/60 border border-stone-800 p-4 rounded-xl shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-stone-450 uppercase font-semibold">Active Rating Index</span>
                        <span className="text-xs font-mono font-black text-amber-500">{aggregateScore}% Green</span>
                      </div>

                      {/* Visual Animating Progress Bar */}
                      <div className="w-full bg-stone-900 rounded-full h-3.5 overflow-hidden mb-2 relative border border-stone-800/50">
                        <motion.div 
                          className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${aggregateScore}%` }}
                          transition={{ duration: 0.9, ease: "easeOut" }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-mono text-stone-500">
                        <span>CRITICAL</span>
                        <span className="text-emerald-400 font-bold uppercase">
                          {aggregateScore >= 90 ? '★ PLATINUM' : aggregateScore >= 80 ? '✓ SECURE' : '⚠ AUDIT'}
                        </span>
                        <span>PERFECT</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Revenue Tracking & Recharts Graph */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-6">
                    <div>
                      <span className="text-amber-700 text-xs font-mono uppercase tracking-wider block mb-1">Analytical Projection Engine</span>
                      <h4 className="text-lg font-serif font-bold text-stone-900">NIL Revenue Capital Projections</h4>
                    </div>

                    {/* Interactive reach settings toggler */}
                    <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
                      <span className="text-[10px] font-mono text-stone-500 uppercase px-2">Reach Multiplier:</span>
                      {[
                        { id: 'normal', label: 'Standard' },
                        { id: 'optimized', label: 'Optimized' },
                        { id: 'viral', label: 'Viral Apex' }
                      ].map((multiplier) => (
                        <button
                          id={`reach-multiplier-btn-${multiplier.id}`}
                          key={multiplier.id}
                          onClick={() => setBrandReach(multiplier.id )}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wide transition ${
                            brandReach === multiplier.id
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'text-stone-600 hover:bg-stone-200'
                          }`}
                          title={`Simulate revenue projection with ${multiplier.label} reach level`}
                          aria-label={`Simulate revenue projection with ${multiplier.label} reach level`}
                        >
                          {multiplier.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recharts chart segment wrapper */}
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={calculatedNILData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="quarter" stroke="#78716c" fontSize={11} tickLine={false} />
                        <YAxis stroke="#78716c" fontSize={11} tickFormatter={(v) => `$${v}`} tickLine={false} />
                        <Tooltip 
                          formatter={(value) => [`$${value.toLocaleString()}`, '']}
                          contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff', fontSize: '11px' }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="Personal Branding" fill="#d97706" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Sponsorships & Teams" fill="#78716c" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Avatar Licensing" fill="#b45309" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 pt-4 border-t text-[11px] text-stone-500 leading-relaxed font-light">
                    *The projection utilizes active licensing data models based on TrueTrek Learning athlete benchmark algorithms. Optimize reach strategies in Tier 6 to secure branding scalability.
                  </div>
                </div>

                {/* Task alerts notices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0 border border-orange-100">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 mb-1">Trademark Compliancy Alert</h5>
                      <p className="text-[12px] text-stone-500 leading-relaxed font-light">
                        Marcus, your brand trademark registration for &quot;MJ-Prime&quot; has a non-compete clause pending legal redlines. Schedule review in The War Room.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 mb-1">Acquisitions Progress</h5>
                      <p className="text-[12px] text-stone-500 leading-relaxed font-light">
                        Excellent performance inside sleep stabilization metrics. Your physical fatigue indicator score moved up to 92% green rating!
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: ACTIVE STRATEGIC DRILLS */}
            {activeTab === 'drill' && (
              <div id="tab-drill-wrapper" className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6">
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-amber-700 text-xs font-mono uppercase tracking-wider block mb-0.5">SITUATIONAL DRILLS ENGINE</span>
                    <h4 className="text-lg font-serif font-bold text-stone-900">Drills Module: Recruit & NIL Integrity</h4>
                  </div>

                  {/* Indicator showing current drill progression index */}
                  <div className="flex items-center gap-1 text-xs font-mono text-stone-500">
                    <span>Exercise {activeDrillIndex + 1} of {DRILL_QUESTIONS.length}</span>
                  </div>
                </div>

                {/* Dilemma Segment Card */}
                <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-600/10 blur-xl"></div>
                  <div className="flex gap-3 mb-4">
                    <div className="bg-amber-600 text-stone-950 font-bold px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase rounded">
                      DILEMMA CASE
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono tracking-wide">Governance Scenario</span>
                  </div>
                  <p className="text-sm md:text-base leading-relaxed font-medium text-stone-50">
                    {DRILL_QUESTIONS[activeDrillIndex].scenario}
                  </p>
                  <p className="text-xs text-amber-500 font-mono mt-4 flex items-center gap-1.5 bg-stone-950/80 p-2.5 rounded border border-stone-800">
                    <HelpCircle className="w-4 h-4 shrink-0" /> Guidelines: {DRILL_QUESTIONS[activeDrillIndex].guidelines}
                  </p>
                </div>

                {/* Multiple choice selections */}
                <div className="space-y-3.5">
                  <p className="text-xs font-mono uppercase text-stone-400 tracking-wider">Select Your Executive Action Covenants</p>
                  {DRILL_QUESTIONS[activeDrillIndex].options.map((option) => (
                    <button
                      id={`drill-option-btn-${option.key}`}
                      key={option.key}
                      onClick={() => handleSelectOption(option.key, option.score)}
                      className={`w-full text-left p-4 rounded-xl border flex gap-4 transition-all ${
                        selectedOption === option.key
                          ? option.score === 100 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                            : 'bg-orange-50 border-orange-500 text-orange-950 shadow-xs'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                      title={`Select option ${option.key}: ${option.text}`}
                      aria-label={`Select option ${option.key}: ${option.text}`}
                    >
                      <span className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                        selectedOption === option.key
                          ? option.score === 100 ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {option.key}
                      </span>
                      
                      <div className="space-y-1.5 flex-1">
                        <p className="text-xs font-semibold leading-relaxed">{option.text}</p>
                        {selectedOption === option.key && (
                          <div className="border-t border-dotted border-current/20 pt-2 text-[11px] leading-relaxed">
                            <p className={`font-bold ${option.score === 100 ? 'text-emerald-700' : 'text-orange-700'}`}>
                              Tactical Assessment: SCORE {option.score}/100 — {option.score === 100 ? 'SUCCESS' : 'DILUTED RESULTS'}
                            </p>
                            <p className="not-italic opacity-90 mt-1 font-light">{option.impact}</p>
                            <p className="font-medium mt-1">Steward Rationale: {option.rationale}</p>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Next controller */}
                {selectedOption && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-stone-500">
                      Completed drill tracking updates automatically inside student scorecard data.
                    </span>
                    <button
                      id="next-drill-trigger-btn"
                      onClick={handleNextDrill}
                      className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg tracking-wide flex items-center gap-1 transition"
                      title="Load and display the next simulated compliance scenario case"
                      aria-label="Load and display the next simulated compliance scenario case"
                    >
                      Cycle Next Exercitation
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 3: THE WAR ROOM (AI Strategic Advisor Console) */}
            {activeTab === 'warroom' && (
              <div id="tab-warroom-wrapper" className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6">
                
                <div>
                  <span className="text-amber-700 text-xs font-mono uppercase tracking-wider block mb-0.5">ACADEMY STRATEGIC COMMAND</span>
                  <h4 className="text-xl font-serif font-bold text-stone-900">The Strategic Mentor Advisory Council</h4>
                  <p className="text-stone-500 text-xs font-light mt-1">
                    Select an expert from the master council and present your dilemma to simulate real-time regulatory, legal, or psychological feedback powered by Gemini AI.
                  </p>
                </div>

                {/* Mentor Personas List Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  {ADVISOR_PERSONAS.map((advisor) => (
                    <button
                      id={`advisor-card-${advisor.id}`}
                      key={advisor.id}
                      onClick={() => {
                        setSelectedAdvisorId(advisor.id);
                        setAdvisorAdvice('');
                      }}
                      className={`p-3.5 rounded-xl border text-left flex flex-col items-start gap-2.5 transition relative overflow-hidden ${
                        selectedAdvisorId === advisor.id
                          ? 'border-amber-500 bg-amber-50/50 text-stone-950'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      title={`Select ${advisor.name} (${advisor.title}) as your strategic mentor`}
                      aria-label={`Select ${advisor.name} (${advisor.title}) as your strategic mentor`}
                    >
                      <img src={advisor.avatar} alt={advisor.name} className="w-11 h-11 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <p className="text-xs font-bold leading-tight text-stone-900">{advisor.name}</p>
                        <p className="text-[9px] uppercase font-mono tracking-widest text-stone-500 mt-1">{advisor.id}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Active Advisor Showcase card */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-mono font-bold text-amber-970 uppercase tracking-widest">ACTIVE ADVISOR ENTRUSTED</h5>
                      <p className="text-sm font-semibold text-stone-850 mt-1">{selectedAdvisor.name} — {selectedAdvisor.title}</p>
                      <p className="text-xs text-stone-650 italic mt-1 font-light">&quot;{selectedAdvisor.quote}&quot;</p>
                    </div>
                  </div>
                  <span className="bg-stone-100 text-stone-700 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1.5 rounded border">
                    Specialty: {selectedAdvisor.specialty.split(',')[0]}
                  </span>
                </div>

                {/* Problem input */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-stone-400 block uppercase tracking-wider mb-2">Formulate Strategic Dilemma Scenario</label>
                    <textarea
                      id="txt-custom-scenario"
                      rows={4}
                      value={customScenario}
                      onChange={(e) => setCustomScenario(e.target.value)}
                      placeholder="e.g. An athletic equipment brand wants to sign a contract, but includes high physical diagnostic and workout metric tracking access codes. What risks should I counter with?"
                      className="w-full border p-3.5 rounded-xl bg-stone-50 text-xs font-mono text-stone-800 focus:outline-none focus:border-amber-600 leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Prebuilt prompts recommendations */}
                  <div>
                    <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-2">Quick Pre-Injected Consultation Queries</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        `A wealthy booster offered $25,000 to fund my podcast but demands licensing royalties on all adjacent merchandise designs.`,
                        `D1 coaching staff is demanding I skip organic recovery days to run scout exhibitions, triggering muscle fatigue alerts.`,
                        `A regional venture group wants me to license my trademark "MJ-Prime" for 10 years for $10k cash upfront.`
                      ].map((preset, index) => (
                        <button
                          id={`preset-prompt-btn-${index}`}
                          key={index}
                          onClick={() => selectPrebuiltScenario(preset)}
                          className="bg-stone-100 hover:bg-stone-200 border border-stone-200 max-w-full text-left truncate text-[10px] text-stone-600 py-1.5 px-3 rounded-lg"
                          title={`Pre-inject prompt: "${preset}"`}
                          aria-label={`Pre-inject query: "${preset}"`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      id="query-advisor-trigger-btn"
                      onClick={handleQueryAdvisor}
                      disabled={isGenerating || !customScenario.trim()}
                      className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wider uppercase py-3 px-6 rounded-xl inline-flex items-center gap-2 transition disabled:opacity-40"
                      title={isGenerating ? 'Awaiting council feedback...' : 'Submit dilemma to chosen advisor'}
                      aria-label={isGenerating ? 'Awaiting council feedback...' : 'Submit dilemma to chosen advisor'}
                    >
                      {isGenerating ? 'Generative Analytical Calculations...' : 'Submit to Council Council'}
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Output feedback Strategic Brief */}
                {(isGenerating || advisorAdvice) && (
                  <div id="ai-advice-output-wrapper" className="border border-stone-200 rounded-xl p-5 md:p-6 bg-stone-50/50 space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600"></div>

                    <div className="flex justify-between items-center border-b pb-3.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-amber-700 w-4.5 h-4.5" />
                        <span className="text-xs font-mono font-bold text-stone-800 uppercase tracking-widest">
                          COUNCIL STRATEGIC COVENANT RESPONSE
                        </span>
                      </div>
                      <span className="text-[9px] font-mono uppercase text-stone-450 bg-stone-100 px-2 py-0.5 rounded">
                        Active Server Feed
                      </span>
                    </div>

                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-stone-500 font-mono">Consulting Mastermind schemas with Gemini...</p>
                      </div>
                    ) : (
                      <div className="prose max-w-none text-stone-800 text-xs md:text-sm leading-relaxed overflow-x-auto">
                        <div className="whitespace-pre-line text-stone-700 space-y-4">
                          {advisorAdvice}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: SCHOLASTIC PROGRESS, POINTS, BADGES & MODULE AUDITING */}
            {activeTab === 'achievements' && (
              <div id="tab-achievements-wrapper" className="space-y-8 animate-fade-in">
                
                {/* Level Progress Banner */}
                <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 relative overflow-hidden">
                  {/* Subtle decorative background gradient */}
                  <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 text-left">
                    <div className="space-y-2 flex-grow">
                      <span className="text-amber-500 font-mono text-[10px] uppercase tracking-widest block font-medium">SCHOLAR INTELLECTUAL INDEX</span>
                      <div className="flex items-baseline gap-2.5">
                        <h4 className="text-2xl font-serif font-black tracking-tight">Level {currentLevelInfo.level}: {currentLevelInfo.name}</h4>
                        <span className="text-xs text-amber-500/85 font-mono font-medium">({points} XP)</span>
                      </div>
                      
                      {/* Level progress bar */}
                      <div className="space-y-1.5 pt-1 max-w-xl">
                        <div className="flex justify-between text-[11px] font-mono text-stone-400">
                          <span>{currentLevelInfo.prevThreshold} XP</span>
                          <span>XP to Level {currentLevelInfo.level + 1}</span>
                          <span>{currentLevelInfo.nextThreshold} XP</span>
                        </div>
                        <div className="w-full bg-stone-800 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(((points - currentLevelInfo.prevThreshold) / (currentLevelInfo.nextThreshold - currentLevelInfo.prevThreshold)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-4 p-4 bg-stone-950/60 border border-stone-800 rounded-xl w-full md:w-auto shrink-0">
                      <div className="text-center">
                        <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">Total XP</p>
                        <p className="text-base font-mono font-bold text-amber-550">{points}</p>
                      </div>
                      <div className="text-center border-l border-stone-800/80 px-2">
                        <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider font-light">Certified</p>
                        <p className="text-base font-mono font-bold text-white">{completedModules.length} / 11</p>
                      </div>
                      <div className="text-center border-l border-stone-800/80 px-2">
                        <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">Drills</p>
                        <p className="text-base font-mono font-bold text-white">{drillCompletedList.length} / 3</p>
                      </div>
                      <div className="text-center border-l border-stone-800/80 px-2 font-light">
                        <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">Badges</p>
                        <p className="text-base font-mono font-bold text-amber-500">{unlockedBadges.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subgrid: Achievements & Milestones Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  
                  {/* Badges Display Card Section (span-2) */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-lg font-serif font-bold text-stone-900">Compliance Medal Showcase</h4>
                      <p className="text-stone-500 text-xs font-light">Accolades earned solving compliance, regulatory, and recruiting scenarios.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {BADGES.map((badge) => {
                        const unlocked = unlockedBadges.includes(badge.id);
                        return (
                          <div 
                            id={`badge-card-${badge.id}`}
                            key={badge.id}
                            className={`p-4 rounded-xl border flex gap-4 transition-all relative overflow-hidden ${
                              unlocked 
                                ? 'bg-gradient-to-br from-amber-50/40 to-white hover:shadow-md border-amber-250/60 shadow-xs' 
                                : 'bg-stone-50/55 border-stone-200/80 opacity-60'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${
                              unlocked 
                                ? 'bg-amber-100/60 text-amber-700 border border-amber-200 shadow-inner' 
                                : 'bg-stone-200 text-stone-400 border border-stone-300'
                            }`}>
                              {renderBadgeIcon(badge.icon, unlocked)}
                            </div>
                            
                            <div className="space-y-1.5 flex-1 pr-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className={`text-xs font-bold leading-none ${unlocked ? 'text-stone-900' : 'text-stone-500'}`}>{badge.title}</h5>
                                {unlocked && <span className="bg-amber-100/60 text-amber-800 text-[8px] uppercase px-1 rounded font-semibold font-mono tracking-wide">Earned</span>}
                              </div>
                              <p className="text-[11px] text-stone-600 font-light leading-snug">{badge.desc}</p>
                              <div className="flex items-center gap-1 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
                                <Clock className="w-2.5 h-2.5" />
                                <span className="truncate">Guide: {badge.criteria}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Milestones Side Checklist Panel */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-serif font-bold text-stone-900">Strategic Milestones</h4>
                      <p className="text-stone-500 text-xs font-light">Checklists tracking pathfinder checkpoints advancement.</p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      {[
                        { 
                          label: "Operational Initiation", 
                          desc: "Exceed 500 cumulative Intelligence XP Points", 
                          progress: Math.min(((points / 500) * 100), 100) 
                        },
                        { 
                          label: "Drill Specialist", 
                          desc: "Complete 2 or more daily situational drills", 
                          progress: Math.min(((drillCompletedList.length / 2) * 100), 100) 
                        },
                        { 
                          label: "Scholar Certification", 
                          desc: "Certify and sign 3 educational curriculum modules", 
                          progress: Math.min(((completedModules.length / 3) * 100), 100) 
                        },
                        { 
                          label: "Council Advisory Link", 
                          desc: "Complete at least one consultation query in War Room", 
                          progress: Math.min((consultationCount * 100), 100) 
                        },
                        { 
                          label: "Daily Resilience", 
                          desc: "Maintain situational drill streak of 7+ days", 
                          progress: Math.min(((streakDays / 7) * 100), 100) 
                        }
                      ].map((milestone, idx) => {
                        const isDone = milestone.progress === 100;
                        return (
                          <div id={`milestone-row-${idx}`} key={idx} className="space-y-1.5 border-t border-stone-100 first:border-0 pt-3.5 first:pt-0">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold ${isDone ? 'text-amber-800' : 'text-stone-700'}`}>{milestone.label}</span>
                              <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                                {isDone ? 'COMPLETED' : `${Math.round(milestone.progress)}%`}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-450 leading-tight font-light">{milestone.desc}</p>
                            <div className="w-full bg-stone-100 rounded-full h-1">
                              <div className={`h-1 rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${milestone.progress}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Educational Curriculum Tiers compliance audits */}
                <div className="space-y-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs text-left">
                  <div>
                    <h4 className="text-lg font-serif font-bold text-stone-900">Curriculum Compliance Audits & Certifications</h4>
                    <p className="text-stone-500 text-xs font-light">Browse the core educational curriculum structures. Fully audit and certify tiers to earn 200 XP Academic points for each verification.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {CURRICULUM_TIERS.map((tier) => {
                      const isCert = completedModules.includes(tier.id);
                      return (
                        <div 
                          id={`curriculum-audit-card-${tier.id}`}
                          key={tier.id}
                          className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${
                            isCert 
                              ? 'border-emerald-250 bg-emerald-50/20' 
                              : 'border-stone-200 hover:border-amber-350 bg-white shadow-inner-xs'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2.5">
                              <span className="text-[9px] uppercase font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200 font-semibold tracking-wider">
                                {tier.number}
                              </span>
                              {isCert ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1 animate-pulse">
                                  <CheckCircle className="w-3 h-3" /> Certified
                                </span>
                              ) : (
                                <span className="bg-amber-100/50 text-amber-800 text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded font-semibold border border-amber-200/40">
                                  Pending
                                </span>
                              )}
                            </div>
                            <h5 className="text-sm font-serif font-black text-stone-850 truncate leading-snug">{tier.title}</h5>
                            <p className="text-[11px] text-stone-500 font-normal leading-normal line-clamp-2 mt-1 font-light">{tier.desc}</p>
                          </div>

                          <div className="border-t border-dotted border-stone-200 mt-4 pt-3 flex justify-between items-center">
                            <span className="text-[9px] font-mono text-stone-400">Time: {tier.estimatedDuration}</span>
                            {isCert ? (
                              <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">✓ Academic Credit Received</span>
                            ) : (
                              <button 
                                id={`certify-btn-${tier.id}`}
                                onClick={() => setAuditingTier(tier)}
                                className="bg-stone-900 hover:bg-stone-800 text-white font-serif font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition animate-bounce"
                                title={`Review and sign the compliance dossier for ${tier.title}`}
                                aria-label={`Review and sign the compliance dossier for ${tier.title}`}
                              >
                                Review & Sign
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* AUDITING MODAL OVERLAY SHEET */}
            {auditingTier && (
              <div 
                id="auditing-dialog-modal-shield" 
                className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
              >
                <div 
                  id="auditing-dialog-card" 
                  className="bg-white border border-stone-250/90 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative"
                >
                  <CloseButton
                    onClick={() => setAuditingTier(null)}
                    className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 p-1.5 hover:bg-stone-100 rounded-full transition"
                    title="Close certification dialog"
                  >
                    ✕
                  </CloseButton>

                  <div className="space-y-1.5 pb-3 border-b text-left">
                    <span className="text-amber-700 uppercase font-mono text-[10px] tracking-widest font-bold block">{auditingTier.number} compliance dossier review</span>
                    <h4 className="text-xl font-serif text-stone-900 font-black tracking-tight leading-tight">{auditingTier.title}</h4>
                    <p className="text-xs text-stone-500 font-light">{auditingTier.subtitle}</p>
                  </div>

                  <div className="space-y-4 text-xs text-stone-705 leading-relaxed text-left">
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#d97706] font-bold">COURSE CONTENT DEPLOYMENT</p>
                      <p className="not-italic text-stone-700 font-light leading-normal">{auditingTier.desc}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
                        <span className="block font-semibold text-stone-850 font-mono text-[9px] uppercase tracking-widest font-medium">TACTICAL FOCUS AREAS</span>
                        <ul className="list-disc list-inside space-y-1 pt-1.5 leading-normal font-light">
                          {auditingTier.focusAreas.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
                        <span className="block font-semibold text-stone-850 font-mono text-[9px] uppercase tracking-widest font-medium">EXPECTED OUTCOMES</span>
                        <ul className="list-disc list-inside space-y-1 pt-1.5 leading-normal font-light">
                          {auditingTier.outcomes.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-50/40 border border-amber-200/50 rounded-xl text-[11px] leading-relaxed flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-750 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <strong>Academic Compliance Covenant:</strong> By clicking below to certify, you agree that you have studied the instructional curriculum modules under this Tier, maintained regular tactical drill habits, and agree to hold TrueTrek Learning LLC harmless against any external NIL athletic eligibility challenges.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs font-mono text-stone-400">XP Reward: +200 Intelligence points</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAuditingTier(null)}
                        className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs transition font-semibold"
                        title="Decline agreement and exit certification process"
                        aria-label="Decline agreement and exit certification process"
                      >
                        Decline & Close
                      </button>
                      <button 
                        onClick={() => {
                          handleCertifyModule(auditingTier.id, auditingTier.title);
                          setAuditingTier(null);
                        }}
                        className="bg-stone-950 hover:bg-stone-850 text-white font-serif font-black text-xs px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
                        title={`Certify and sign module for ${auditingTier.title}`}
                        aria-label={`Certify and sign module for ${auditingTier.title}`}
                      >
                        ✓ Certify & Earn Credit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </section>
    </div>
  );
}