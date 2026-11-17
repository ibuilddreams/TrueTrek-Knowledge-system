"use client";

import { Check, ShieldCheck, Zap, BookMarked } from "lucide-react";
import CobaltSectionHead from "@/components/features/home/CobaltSectionHead";

// "What a licence includes." Three cards, each over a small mock of the screen
// it describes — the design's `.sviz`, a window cropped by its own frame so it
// reads as a screenshot rather than a diagram.
const WINDOW =
  "flex h-full w-full flex-col overflow-hidden rounded-t-cn border border-b-0 border-cn-rule bg-white shadow-cn-2 transition-transform duration-200 ease-cn-out group-hover:-translate-y-1";
const WINDOW_HEAD =
  "flex items-center gap-2 border-b border-cn-rule px-3.5 py-2.5 text-[13px] leading-[1.55]";
const WINDOW_BADGE =
  "grid h-6 w-6 flex-none place-items-center rounded-[7px] bg-cn-accent text-white";
const FRAME =
  "mb-3 flex h-[236px] items-end overflow-hidden rounded-cn-lg border border-cn-rule bg-cn-paper-2 px-6 pt-6";

const ALERTS = [
  { initials: "EM", name: "Student E.M.", note: "No activity for 12 days", tag: "Check in", high: true },
  { initials: "MM", name: "Student M.M.", note: "Progress under 20%", tag: "Watch" },
  { initials: "NW", name: "Student N.W.", note: "2 assignments overdue", tag: "Watch" },
];

const COMPLIANCE = [
  "NIL contract template",
  "Booster gift policy covenant",
  "Eligibility checklist by season",
];

export default function SchoolsLicence() {
  return (
    <section id="schools-licence" className="cn-section">
      <div className="cn-container">
        <CobaltSectionHead
          headingId="schools-licence-heading"
          heading="What a licence includes."
          lead="Everything your students use, plus the tools your staff need to support them."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {/* 1 — the branded student dashboard */}
          <article data-cn-reveal className="cn-reveal group grid content-start gap-3">
            <div className={FRAME}>
              <div className={WINDOW}>
                <div className={WINDOW_HEAD}>
                  <span className={WINDOW_BADGE}>
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <b>Your school</b>
                  <span className="ml-auto flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <i key={i} className="block h-[5px] w-[18px] rounded-[3px] bg-cn-paper-4" />
                    ))}
                  </span>
                </div>
                <div className="grid content-start gap-2.5 px-3.5 py-3">
                  <div>
                    <small className="block text-[11px] text-cn-muted">Welcome back</small>
                    <b>Ava&apos;s dashboard</b>
                  </div>
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                    <div className="grid gap-0.5 rounded-[10px] border border-cn-accent bg-cn-accent p-2.5 text-white">
                      <small className="block text-[11px] text-cn-on-ink-2">Pathway progress</small>
                      <b className="text-cn-lg tracking-[-0.02em]">64%</b>
                      <span className="mt-1 block h-1 rounded-sm bg-white/30">
                        <i className="block h-full w-[64%] rounded-sm bg-white" />
                      </span>
                    </div>
                    <div className="grid gap-0.5 rounded-[10px] border border-cn-rule p-2.5">
                      <small className="block text-[11px] text-cn-muted">Drills</small>
                      <b className="text-cn-lg tracking-[-0.02em]">12</b>
                    </div>
                    <div className="grid gap-0.5 rounded-[10px] border border-cn-rule p-2.5">
                      <small className="block text-[11px] text-cn-muted">Quests</small>
                      <b className="text-cn-lg tracking-[-0.02em]">3</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-cn-lg leading-[1.2] font-bold tracking-[-0.015em] text-cn-ink">
              Your school, on the dashboard
            </h3>
            <p className="text-cn-ink-2">
              Student dashboards carry your insignia, athletic colors and
              counselor messages, within FERPA and COPPA.
            </p>
          </article>

          {/* 2 — counselor early warning */}
          <article
            data-cn-reveal
            style={{ "--cn-d": 1 }}
            className="cn-reveal group grid content-start gap-3"
          >
            <div className={FRAME}>
              <div className={WINDOW}>
                <div className={WINDOW_HEAD}>
                  <span className={WINDOW_BADGE}>
                    <Zap className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <b>Counselor alerts</b>
                  <span className="ml-auto rounded-full bg-cn-paper-3 px-2 py-0.5 text-[11px] font-semibold text-cn-accent-3">
                    3 new
                  </span>
                </div>
                <div className="grid content-start gap-2.5 px-3.5 py-3">
                  {ALERTS.map((alert) => (
                    <div
                      key={alert.initials}
                      className="flex items-center gap-2.5 border-b border-cn-rule py-1.5 last:border-b-0"
                    >
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-cn-paper-3 text-[10px] font-bold text-cn-accent-3">
                        {alert.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block text-[13px] leading-[1.3]">{alert.name}</b>
                        <small className="block text-[11px] text-cn-muted">{alert.note}</small>
                      </span>
                      <em
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap not-italic ${
                          alert.high
                            ? "bg-cn-accent text-white"
                            : "bg-cn-paper-3 text-cn-accent-3"
                        }`}
                      >
                        {alert.tag}
                      </em>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <h3 className="text-cn-lg leading-[1.2] font-bold tracking-[-0.015em] text-cn-ink">
              Early warning for counselors
            </h3>
            <p className="text-cn-ink-2">
              Spot fatigue, burnout triggers and long low-performance streaks
              early, with anonymized escalation guidelines.
            </p>
          </article>

          {/* 3 — the compliance kit */}
          <article
            data-cn-reveal
            style={{ "--cn-d": 2 }}
            className="cn-reveal group grid content-start gap-3"
          >
            <div className={FRAME}>
              <div className={WINDOW}>
                <div className={WINDOW_HEAD}>
                  <span className={WINDOW_BADGE}>
                    <BookMarked className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <b>Compliance kit</b>
                  <span className="ml-auto rounded-full bg-cn-ok-bg px-2 py-0.5 text-[11px] font-semibold text-cn-ok">
                    Pre-audited
                  </span>
                </div>
                <div className="grid content-start gap-2.5 px-3.5 py-3">
                  {COMPLIANCE.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 border-b border-cn-rule py-2 text-[13px] font-medium last:border-b-0"
                    >
                      <Check className="h-5 w-5 flex-none rounded-full bg-cn-paper-3 p-1 text-cn-accent" strokeWidth={3} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <h3 className="text-cn-lg leading-[1.2] font-bold tracking-[-0.015em] text-cn-ink">
              Athletic and scholastic shield
            </h3>
            <p className="text-cn-ink-2">
              Pre-audited template covenants that protect your program from NCAA
              sanctions and NIL compliance risk.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
