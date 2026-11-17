"use client";

import CobaltSectionHead from "@/components/features/home/CobaltSectionHead";

// "The tiers, in order." — the design's ladder. Nine cards, each carrying its
// number, name and what it covers, with a rule across the top that fills
// further the higher the tier: the ladder shows its own progression rather
// than describing it.
//
// Driven by the real tiers from the public course filters, so the names,
// ordering and count are the catalog's own. The design hardcodes nine; this
// scales the top rule by the tier's position in whatever is actually there.
export default function CurriculumTierLadder({ tiers = [] }) {
  if (tiers.length === 0) return null;

  const ordered = [...tiers].sort((a, b) => (a.level || 0) - (b.level || 0));

  return (
    <section id="curriculum-tier-ladder" className="cn-section">
      <div className="cn-container">
        <CobaltSectionHead
          headingId="curriculum-tier-ladder-heading"
          heading="The tiers, in order."
          lead="Earlier tiers build readiness. Later tiers build ventures, trusts and compliance."
        />

        <ol className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((tier, index) => (
            <li
              key={tier.id}
              data-cn-reveal
              style={{ "--cn-d": index % 3 }}
              className="cn-reveal relative grid gap-3 rounded-cn-lg border border-cn-rule bg-white px-6 pt-10 pb-6 shadow-cn-1 transition-[transform,box-shadow] duration-200 ease-cn-out hover:-translate-y-[3px] hover:shadow-cn-2"
            >
              {/* The fill is the tier's share of the ladder, not a progress
                  value — tier 9 of 9 is full, tier 1 is a stub. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-1 origin-left rounded-b-[4px] bg-cn-accent"
                style={{
                  transform: `scaleX(${((index + 1) / ordered.length).toFixed(3)})`,
                }}
              />
              <span className="text-cn-3xl leading-none font-extrabold tracking-[-0.04em] text-cn-accent">
                {String(tier.level ?? index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-cn-lg leading-[1.2] font-bold tracking-[-0.015em] text-cn-ink">
                {tier.name}
              </h3>
              <p className="text-cn-sm text-cn-ink-2">{tier.focus_description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
