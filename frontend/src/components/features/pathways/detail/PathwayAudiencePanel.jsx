import { ListChecks, Users } from "lucide-react";
import PathwaySectionHeading from "./PathwaySectionHeading";

function Column({ icon: Icon, title, items, tone }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-serif text-lg font-light tracking-tight text-ink">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/85">
            <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// "Who this is for" and "Before you start" side by side — two short lists read
// better as a pair than as two more full-width stacked sections.
export default function PathwayAudiencePanel({ whoIsFor, prerequisites }) {
  if (!whoIsFor?.length && !prerequisites?.length) return null;

  return (
    <section aria-labelledby="pathway-fit-heading">
      <PathwaySectionHeading id="pathway-fit-heading" eyebrow="Fit Check">
        Is this the right route for you?
      </PathwaySectionHeading>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Column
          icon={Users}
          title="Who this is for"
          items={whoIsFor}
          tone="bg-sky text-pine"
        />
        <Column
          icon={ListChecks}
          title="Before you start"
          items={prerequisites}
          tone="bg-gold/20 text-[#8a6f2e]"
        />
      </div>
    </section>
  );
}
