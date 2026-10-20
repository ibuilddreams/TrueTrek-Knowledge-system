import {
  Clock,
  DoorOpen,
  Flame,
  HandCoins,
  Handshake,
  MessageSquareWarning,
  Repeat2,
  Users,
} from "lucide-react";

// Mirrors wargamer.models.RolePlayScenario.PressureType — the backend sends
// both the raw key and its display label, so this map only supplies the icon
// and tone the label can't carry (same arrangement as questConstants.js).
export const PRESSURE_TYPE_META = {
  FINANCIAL: { icon: HandCoins, tone: "bg-gold/12 text-gold border-gold/25" },
  ACCESS: { icon: DoorOpen, tone: "bg-sky text-blue border-blue/20" },
  TIME: { icon: Clock, tone: "bg-sage/40 text-pine border-pine/20" },
};

export const RELATIONSHIP_META = {
  FAMILY: { icon: Users },
  FRIENDS: { icon: Handshake },
  COMMUNITY: { icon: Users },
};

// Mirrors wargamer.models.RolePlayScenario.Persona.
export const PERSONA_META = {
  GUILT_TRIP: {
    icon: MessageSquareWarning,
    tone: "bg-gold/12 text-gold border-gold/25",
    blurb: "Leans on everything they've done for you.",
  },
  AGGRESSIVE: {
    icon: Flame,
    tone: "bg-rose/35 text-clay border-clay/25",
    blurb: "Gets confrontational and treats hesitation as disrespect.",
  },
  PASSIVE_AGGRESSIVE: {
    icon: MessageSquareWarning,
    tone: "bg-lavender text-ink border-line",
    blurb: "Sarcasm and hints that you've changed.",
  },
  PERSISTENT: {
    icon: Repeat2,
    tone: "bg-sage/40 text-pine border-pine/20",
    blurb: "Treats every no as an opening bid and counters it.",
  },
};

export const DIFFICULTY_TONE = {
  EASY: "bg-sage/40 text-pine border-pine/20",
  MEDIUM: "bg-gold/12 text-gold border-gold/25",
  HARD: "bg-rose/35 text-clay border-clay/25",
};

// The three steps of the method, in the order the module teaches them. Static
// copy rather than a backend table: it is the same technique for every
// scenario and is never edited per student (the *scenario-specific* model
// answer does come from the backend, and only after a run is scored).
export const ABP_STEPS = [
  {
    key: "acknowledge",
    letter: "A",
    label: "Acknowledge",
    summary: "Show the person you respect them and value the relationship.",
    detail:
      "Name what they've done for you or what they mean to you, in their words, before you say anything else. This is what takes the sting out of the no that's coming.",
    example: "“I appreciate you bringing this to me, and I'll never forget how you looked out for me.”",
  },
  {
    key: "boundary",
    letter: "B",
    label: "Boundary",
    summary: "Say no clearly, and attach it to a rule you already keep.",
    detail:
      "Point at a standing commitment — your training schedule, a team rule, a budget you set — so the refusal is about the rule, not about them. Say it inside the first couple of sentences; a boundary that arrives late reads as an opening offer.",
    example: "“I have a rule I set about money: nothing goes into private businesses outside my plan.”",
  },
  {
    key: "pivot",
    letter: "P",
    label: "Pivot",
    summary: "Offer a low-cost way to stay connected, then close it out.",
    detail:
      "Give them something real that costs you little — a share, a shout-out, time next week — and then end the negotiation rather than leaving it open.",
    example: "“I can't put money in, but send me the link and I'll share it with my followers.”",
  },
];

// Scored bands, matching BrandScoreGauge's thresholds so a 76 reads the same
// colour everywhere in the portal.
export function getScoreTone(score) {
  if (score === null || score === undefined) return "text-muted";
  if (score >= 75) return "text-pine";
  if (score >= 50) return "text-gold";
  return "text-clay";
}

export function getScoreBarTone(score) {
  if (score >= 75) return "bg-pine";
  if (score >= 50) return "bg-gold";
  return "bg-clay";
}

export function getPressureMeta(pressureType) {
  return PRESSURE_TYPE_META[pressureType] || PRESSURE_TYPE_META.FINANCIAL;
}

export function getPersonaMeta(persona) {
  return PERSONA_META[persona] || PERSONA_META.GUILT_TRIP;
}

export function formatSeconds(seconds) {
  if (seconds === null || seconds === undefined) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}
