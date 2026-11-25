"use client";

import { useState } from "react";
import { Check, ChevronDown, ListChecks, ShieldAlert } from "lucide-react";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalIcon,
  PortalKicker,
  PortalPageHead,
} from "@/components/features/portal/shell/PortalUI";

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
  // The design renders these as an accordion with one panel open at a time —
  // each manual is three paragraphs plus a checklist, and three of them side
  // by side is a wall of text nobody reads.
  const [openId, setOpenId] = useState(TEACHER_MANUALS[0]?.id ?? null);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Instructional manuals"
        subtitle="Faculty operational protocols: how each module is meant to be taught."
      />

      <PortalCard className="flex items-start gap-4 p-5">
        <PortalIcon icon={ShieldAlert} size="lg" />
        <div>
          <h3 className="text-sm font-bold text-cn-p-ink">
            Faculty operational integrity protocols
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-cn-p-ink-2">
            These manuals contain teaching scripts licensed to registered educational
            networks. Classroom assignments must respect student privacy law, and
            individual student records stay hidden during external audits.
          </p>
        </div>
      </PortalCard>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {TEACHER_MANUALS.map((manual, index) => {
          const isOpen = openId === manual.id;
          const panelId = `manual-panel-${manual.id}`;
          return (
            <PortalCard key={manual.id} className="overflow-hidden">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : manual.id)}
                  className="flex w-full items-center gap-3 p-5 text-left"
                >
                  <PortalIcon icon={ListChecks} size="lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-cn-p-ink">
                      {manual.title}
                    </span>
                    <span className="block text-sm text-cn-p-ink-2">{manual.subtitle}</span>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-[18px] w-[18px] flex-none text-cn-p-ink-2 transition-transform duration-200 ${ isOpen ? "rotate-180" : "" }`}
                  />
                </button>
              </h3>

              {isOpen && (
                <div
                  id={panelId}
                  className="grid gap-3 border-t border-cn-p-line p-5 md:grid-cols-3"
                >
                  <div className="rounded-xl bg-cn-p-page p-3.5">
                    <PortalKicker>Instructional objective</PortalKicker>
                    <p className="mt-1.5 text-sm text-cn-p-ink-2">{manual.objective}</p>
                  </div>
                  <div className="rounded-xl bg-cn-p-page p-3.5">
                    <PortalKicker>Suggested method</PortalKicker>
                    <p className="mt-1.5 text-sm text-cn-p-ink-2">{manual.method}</p>
                  </div>
                  <div className="rounded-xl bg-cn-p-page p-3.5">
                    <PortalKicker>Evaluation</PortalKicker>
                    <ul className="mt-1.5 space-y-1.5 text-sm text-cn-p-ink-2">
                      {manual.checklist.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check
                            aria-hidden="true"
                            className="mt-0.5 h-3.5 w-3.5 flex-none text-cn-p-accent"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-cn-p-muted md:col-span-3">
                    Module {String(index + 1).padStart(2, "0")} · Ref {manual.id}
                  </p>
                </div>
              )}
            </PortalCard>
          );
        })}
      </div>
    </div>
  );
}
