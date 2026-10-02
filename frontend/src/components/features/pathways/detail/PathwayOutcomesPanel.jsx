import { Check } from "lucide-react";

// "What you'll learn", rendered as a lifted panel directly under the hero —
// the first thing a visitor reads after the headline. Hidden when the admin
// hasn't added any points.
export default function PathwayOutcomesPanel({ outcomes }) {
  if (!outcomes?.length) return null;

  return (
    <section
      aria-labelledby="pathway-outcomes-heading"
      className="rounded-panel border border-line bg-paper p-7 shadow-elevated md:p-9"
    >
      <span className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-gold">
        Outcomes
      </span>
      <h2
        id="pathway-outcomes-heading"
        className="font-serif text-2xl font-light tracking-tight text-ink md:text-3xl"
      >
        What you&apos;ll walk away with
      </h2>

      <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {outcomes.map((outcome, index) => (
          <li key={index} className="flex items-start gap-3 text-sm leading-relaxed text-ink/90">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/70 text-moss"
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
