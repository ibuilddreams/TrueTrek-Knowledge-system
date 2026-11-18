// The school licensing offer, in one place: the estimator and the comparison
// table both read it, so a rate can never be quoted differently in the two
// places a visitor will check it against each other.
//
// These are the figures from the design. They are marketing copy rather than
// anything the backend knows about — there is no licensing model server-side —
// so editing this file is how the offer changes.
export const LICENCE_LEVELS = [
  {
    id: "gold",
    name: "Gold",
    rate: 12,
    tiers: "Tiers 1 to 4",
    scope:
      "Tiers 1 to 4: the core modules for athletic and scholastic readiness.",
  },
  {
    id: "platinum",
    name: "Platinum",
    rate: 22,
    tiers: "Tiers 1 to 8",
    popular: true,
    scope:
      "Tiers 1 to 8, with institutional dashboards, custom colors and compliance alerts.",
  },
  {
    id: "legacy",
    name: "Legacy",
    rate: 38,
    tiers: "Every tier",
    scope:
      "Every tier, plus Trust Office guidance and live advisory webinars.",
  },
];

export const DEFAULT_LEVEL_ID = "platinum";

// `true`/`false` render as a tick or a dash; a string renders as itself.
export const COMPARE_ROWS = [
  { label: "Curriculum tiers", values: ["1 to 4", "1 to 8", "All tiers"] },
  { label: "Student portal, drills and quests", values: [true, true, true] },
  { label: "Counselor progress reports", values: [true, true, true] },
  { label: "Institutional dashboard overlays", values: [false, true, true] },
  { label: "Your colors and insignia", values: [false, true, true] },
  { label: "Compliance and burnout alerts", values: [false, true, true] },
  { label: "Trust Office guidance", values: [false, false, true] },
  { label: "Live advisory webinars", values: [false, false, true] },
];

export const COUNSELOR_RATIOS = [50, 200, 250, 500];
export const DEFAULT_COUNSELOR_RATIO = 200;

export const SEATS_MIN = 50;
export const SEATS_MAX = 3000;
export const SEATS_STEP = 50;
export const DEFAULT_SEATS = 500;

export const LICENSING_FAQS = [
  {
    q: "How does school licensing work?",
    a: "We license the full Cool Nerdz framework to high schools, prep schools, athletic conferences and regional academies, with student dashboards and counselor tools.",
  },
  {
    q: "What's the difference between the licensing levels?",
    a: "Gold covers the core modules for athletic and scholastic readiness. Platinum adds institutional dashboards, custom branding and compliance alerts across more tiers. Legacy adds Trust Office guidance and live advisory webinars.",
  },
  {
    q: "Can a partner institution white-label the experience?",
    a: "Yes. Licensed partners can apply school insignia, athletic colors and counselor messaging to the student dashboard, within FERPA and COPPA requirements.",
  },
  {
    q: "How do we request a licensing briefing?",
    a: "Use the estimator above, then send the briefing request from the form at the bottom of this page.",
  },
];
