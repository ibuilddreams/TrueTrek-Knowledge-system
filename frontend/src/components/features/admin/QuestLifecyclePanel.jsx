"use client";

import { ClipboardList, Coins, Shuffle, UserCheck } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "You write the catalog",
    detail:
      "Each quest below is a reusable template — a real-world task, not a quiz. Only PUBLISHED quests are ever handed out.",
  },
  {
    icon: Shuffle,
    title: "It assigns itself daily",
    detail:
      "Every student is given a set each morning, automatically, favouring quests they haven't seen before repeating any.",
  },
  {
    icon: UserCheck,
    title: "Students self-report",
    detail:
      "They tap “I Did This” and may attach a note, link or screenshot. There is no approval queue for you to clear.",
  },
  {
    icon: Coins,
    title: "Points pay out instantly",
    detail:
      "The quest's points land in the student's balance straight away and are spendable in the Rewards catalog.",
  },
];

/**
 * Explains the Daily Quests lifecycle at the top of the admin screen.
 *
 * It exists because the model isn't self-evident from a CRUD table: an admin
 * seeing only a list of quests has no way to tell that assignment is
 * automatic and that completion is self-attested with no review step.
 */
export default function QuestLifecyclePanel({ questsPerDay }) {
  return (
    <div className="relative bg-paper border border-line rounded-card shadow-soft p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />

      <h3 className="text-base font-serif font-light text-ink">How Daily Quests work</h3>
      <p className="text-xs text-muted font-light mt-1">
        Each student is automatically given{" "}
        <span className="font-semibold text-ink">{questsPerDay ?? 3} quests per day</span> from the
        published catalog below.
      </p>

      <ol className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-xl bg-porcelain border border-line p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-lg bg-pine text-paper text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <step.icon className="w-4 h-4 text-pine shrink-0" />
            </div>
            <p className="text-sm font-semibold text-ink leading-snug">{step.title}</p>
            <p className="text-[11px] text-muted font-light mt-1 leading-relaxed">{step.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
