"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CURRICULUM_TIERS } from '@/data/curriculum';
import { Compass, Clock, GraduationCap, X, ChevronRight, Filter, CheckCircle, Lock, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortalSession } from '@/hooks/usePortalSession';
import { getTierRequirementText, getTierStatus as resolveTierStatus } from '@/lib/curriculumProgress';
import { ROUTES } from '@/constants/routes';

export default function Curriculum() {
  const router = useRouter();
  const { isLoggedIn, drillCompletedList } = usePortalSession();
  const onNavigateToPortal = () => router.push(ROUTES.PORTAL);
  const [selectedTag, setSelectedTag] = useState('All');
  const [activeTier, setActiveTier] = useState(null);
  const [hoveredBadgeTierId, setHoveredBadgeTierId] = useState(null);

  const getTierStatus = (tierId) =>
    resolveTierStatus(tierId, isLoggedIn, drillCompletedList);

  const requirementText = (tierId, status) =>
    getTierRequirementText(tierId, status, isLoggedIn);

  // Filter tiers depending on picked tag
  const filteredTiers = selectedTag === 'All'
    ? CURRICULUM_TIERS
    : CURRICULUM_TIERS.filter(t => {
        if (selectedTag === 'Legacy & Foundations') {
          return t.tag === 'Legacy' || t.tag === 'Foundation';
        }
        return t.tag === selectedTag;
      });

  const getTagColor = (tag) => {
    switch (tag) {
      case 'Athletic': return 'bg-orange-50 text-orange-700 border-orange-200/50';
      case 'Academic': return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'Professional': return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'Vocational': return 'bg-rose-50 text-rose-700 border-rose-200/50';
      case 'Legacy': return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'Foundation': return 'bg-purple-50 text-purple-700 border-purple-200/50';
      default: return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div id="curriculum-container" className="bg-[#faf9f6] py-16 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Editorial Subheader */}
        <div className="text-center mb-12">
          <span className="text-amber-700 text-xs font-mono uppercase tracking-widest block mb-3">Modular Framework Structure</span>
          <h2 className="text-4xl md:text-5xl font-serif text-stone-900 font-semibold tracking-tight mb-4">
            The 14-Tier Life Incubator
          </h2>
          <p className="text-stone-600 text-sm max-w-2xl mx-auto font-light leading-relaxed mb-4">
            A comprehensive, rigorous framework taking high school prodigies through collegiate recruitment and trademark law, all the way to family office management and generational wealth preservation.
          </p>
        </div>

        {/* Compliance Integration Header Indicator */}
        {isLoggedIn ? (
          <div id="compliance-sync-banner" className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wide">Authorized Student Portal Link Active</p>
                <p className="text-[11px] text-emerald-700 font-light mt-0.5 animate-pulse">Logged in as Marcus Vance Jr. Your progress tracking dashboard is dynamically generating live compliance clearances.</p>
              </div>
            </div>
            <button 
              id="goto-portal-drill-btn"
              onClick={onNavigateToPortal} 
              className="text-[10px] font-mono font-semibold uppercase bg-emerald-700 hover:bg-emerald-850 text-white px-4 py-2 rounded-lg transition duration-200 shadow-sm self-start sm:self-auto shrink-0"
              title="Navigate to the Student Portal Drill Center to complete active tasks"
              aria-label="Navigate to the Student Portal Drill Center to complete active tasks"
            >
              Open Drill Center →
            </button>
          </div>
        ) : (
          <div id="compliance-sync-banner" className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center text-amber-750 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-amber-900 uppercase tracking-wide">Interactive Demo Session Progress</p>
                <p className="text-[11px] text-stone-500 font-light mt-0.5">Access the Student Portal to authenticate compliance, simulate live drill scenarios, and unlock elite tiers.</p>
              </div>
            </div>
            <button 
              id="goto-portal-login-btn"
              onClick={onNavigateToPortal} 
              className="text-[10px] font-mono font-semibold uppercase bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg transition duration-200 shadow-sm self-start sm:self-auto shrink-0 animate-pulse"
              title="Authenticate and open Student Portal to unlock educational tiers"
              aria-label="Authenticate and open Student Portal to unlock educational tiers"
            >
              Sign In & Unlock Tiers
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 border-b border-stone-200 pb-6">
          <span className="mr-2 text-stone-500 font-mono text-xs flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Category:
          </span>
          {['All', 'Athletic', 'Academic', 'Professional', 'Vocational', 'Legacy & Foundations'].map((tag) => (
            <button
              id={`filter-tag-${tag.replace(/\s+/g, '-').toLowerCase()}`}
              key={tag}
              onClick={() => {
                setSelectedTag(tag);
                setActiveTier(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-mono tracking-wide transition duration-300 border ${
                selectedTag === tag
                  ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                  : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200/80 shadow-xs'
              }`}
              title={`Filter curriculum modules to only show ${tag} category`}
              aria-label={`Filter curriculum modules to only show ${tag} category`}
            >
              {tag}
            </button>
          ))}
        </div>        {/* Curriculum Cards Grid */}
        <div id="tiers-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTiers.map((tier) => {
            const status = getTierStatus(tier.id);
            return (
              <div
                id={`tier-card-${tier.id}`}
                key={tier.id}
                onClick={() => setActiveTier(tier)}
                className="bg-white border border-stone-200/80 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-amber-750 font-bold bg-amber-50 px-2.5 py-1 rounded-md">
                        {tier.number}
                      </span>
                      <span className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border ${getTagColor(tier.tag)}`}>
                        {tier.tag}
                      </span>
                    </div>

                    {/* Dynamic Compliance Status Indicator */}
                    <div 
                      className="relative flex items-center gap-1.5 min-h-[26px]"
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredBadgeTierId(tier.id);
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        setHoveredBadgeTierId(null);
                      }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={status}
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 4 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {status === 'Completed' && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
                              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                              COMPLETED
                            </span>
                          )}
                          {status === 'In Progress' && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse">
                              <Flame className="w-3 h-3 text-amber-600 shrink-0 animate-bounce" />
                              IN PROGRESS
                            </span>
                          )}
                          {status === 'Locked' && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-medium bg-stone-100 text-stone-400 border border-stone-200/60 px-2.5 py-1 rounded-full">
                              <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                              LOCKED
                            </span>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      {/* Compliance requirement tooltip */}
                      <AnimatePresence>
                        {hoveredBadgeTierId === tier.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                            exit={{ opacity: 0, y: 6, scale: 0.95, x: '-50%' }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            style={{ left: '50%' }}
                            className="absolute bottom-full mb-3 bg-stone-955 text-stone-100 text-[10px] py-2 px-3.5 rounded-xl shadow-xl w-52 text-center leading-normal z-50 pointer-events-none font-mono border border-stone-800"
                          >
                            <span className="block text-[8px] font-bold text-amber-400 uppercase tracking-widest mb-0.5">COMPLIANCE CRITERIA</span>
                            {requirementText(tier.id, status)}
                            <div className="w-1.5 h-1.5 bg-stone-950 border-r border-b border-stone-800 rotate-45 absolute top-[calc(100%-3px)] left-1/2 -translate-x-1/2 font-sans"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                <h3 className="text-lg font-serif font-semibold text-stone-900 mb-2 group-hover:text-amber-800 transition-colors duration-250">
                  {tier.title}
                </h3>
                <p className="text-xs font-mono text-stone-400 mb-3 tracking-tight">Focus: {tier.subtitle}</p>
                <p className="text-stone-600 text-[13px] leading-relaxed line-clamp-3 font-light mb-4 text-stone-700">
                  {tier.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <span className="text-stone-400 text-[11px] font-mono">
                  {tier.estimatedDuration} Training
                </span>
                <span className="text-amber-700 text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                  Analyze Tier Details
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

        {/* Detailed Side Drawer Presentation */}
        <AnimatePresence>
          {activeTier && (
            <>
              {/* Backdrop Overlay */}
              <div
                id="drawer-backdrop"
                onClick={() => setActiveTier(null)}
                className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 transition-opacity"
              ></div>

              {/* Slide panel */}
              <motion.div
                id="drawer-surface"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 p-6 md:p-8 flex flex-col justify-between overflow-y-auto"
              >
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-amber-800 font-mono text-sm font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/40">
                        {activeTier.number}
                      </span>
                      <span className={`text-xs uppercase font-mono tracking-widest px-3 py-1 rounded-full border ${getTagColor(activeTier.tag)}`}>
                        {activeTier.tag}
                      </span>
                      
                      {/* Drawer Status Indicator */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={getTierStatus(activeTier.id)}
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 4 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="inline-block"
                        >
                          {getTierStatus(activeTier.id) === 'Completed' && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                              COMPLETED
                            </span>
                          )}
                          {getTierStatus(activeTier.id) === 'In Progress' && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/50 px-2.5 py-1 rounded-full animate-pulse">
                              <Flame className="w-3 h-3 text-amber-600 shrink-0" />
                              IN PROGRESS
                            </span>
                          )}
                          {getTierStatus(activeTier.id) === 'Locked' && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-medium bg-stone-100 text-stone-400 border border-stone-200/60 px-2.5 py-1 rounded-full">
                              <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                              LOCKED
                            </span>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <button
                      id="close-drawer-btn"
                      onClick={() => setActiveTier(null)}
                      className="text-stone-400 hover:text-stone-900 p-2 hover:bg-stone-100 rounded-full transition"
                      title="Close details drawer"
                      aria-label="Close details drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Title and descriptions */}
                  <h3 className="text-2xl md:text-3xl font-serif text-stone-900 font-bold mb-1">
                    {activeTier.title}
                  </h3>
                  <p className="text-stone-500 font-mono text-xs tracking-wider uppercase mb-4">{activeTier.subtitle}</p>
                  
                  <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-xl mb-6">
                    <p className="text-stone-400 text-[10px] font-mono uppercase tracking-wider mb-1">AUDIENCE SCOPE</p>
                    <p className="text-stone-850 text-sm font-medium">{activeTier.audience}</p>
                  </div>

                  <p className="text-stone-600 text-sm leading-relaxed mb-8 font-light">
                    {activeTier.desc}
                  </p>

                  {/* Curriculums pills */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Compass className="w-4 h-4 text-amber-700" />
                      <h4 className="text-xs font-mono uppercase tracking-wider text-stone-900">CURRICULUM FOCUS PATHWAYS</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeTier.focusAreas.map((focus, i) => (
                        <span
                          key={i}
                          className="bg-stone-100 text-stone-850 px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-200/40"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expected Outcomes */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-4 h-4 text-amber-700" />
                      <h4 className="text-xs font-mono uppercase tracking-wider text-stone-900">VERIFIABLE MASTER OUTCOMES</h4>
                    </div>
                    <ul className="space-y-2">
                      {activeTier.outcomes.map((outcome, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-stone-650 text-xs leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="pt-6 border-t border-stone-100 flex items-center justify-between bg-stone-50 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6">
                  <div className="flex items-center gap-2 text-stone-500 font-mono text-xs">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>ESTIMATED DURATION: <strong className="text-stone-800">{activeTier.estimatedDuration}</strong></span>
                  </div>
                  <button
                    id="drawer-license-confirm-btn"
                    onClick={() => setActiveTier(null)}
                    className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg tracking-wide transition"
                    title={`Acknowledge and select ${activeTier.title} pathway`}
                    aria-label={`Acknowledge and select ${activeTier.title} pathway`}
                  >
                    Select Pathway
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}