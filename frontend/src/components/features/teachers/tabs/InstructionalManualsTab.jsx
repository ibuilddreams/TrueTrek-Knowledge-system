"use client";

import { ShieldAlert, BookOpenCheck, Plus } from 'lucide-react';

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

export default function InstructionalManualsTab() {
  return (
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
  );
}
