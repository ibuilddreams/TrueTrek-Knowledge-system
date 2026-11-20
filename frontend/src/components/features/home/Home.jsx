"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Flame,
  ShieldCheck,
  Zap,
  MessageSquare,
  Send,
  X,
  RefreshCw,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Lock,
  // Layers, // Restore with the Learning Pathways Showcase.
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import useScrollReveal from "@/hooks/useScrollReveal";
import AudienceCard from "@/components/features/audiences/AudienceCard";
import MarkdownMiniRenderer from "@/components/ui/MarkdownMiniRenderer";
import AdvisorAvatar, { advisorInitial } from "@/components/ui/AdvisorAvatar";
import { ADVISOR_PERSONAS } from "@/data/curriculum";
import { AUDIENCE_PROFILES } from "@/data/audiences";
import { INDEX_FAQ_ITEMS } from "@/constants/faq";
import { ROUTES } from "@/constants/routes";
import { requestAdvisorAdvice } from "@/services/advisorService";
import {
  getPublicPathwayById,
  getPublicPathways,
} from "@/services/pathwaysService";
import { formatCoursePrice } from "@/lib/store";
import { toPathwayParagraphs } from "@/lib/pathwayDescription";
import { usePathwayPricing } from "@/hooks/usePathwayPricing";
import SignInToSelectModal from "@/components/features/pathways/SignInToSelectModal";
import SectionHeading from "@/components/ui/SectionHeading";
import PathwayMarquee from "./PathwayMarquee";
import { pathwayImage, shortPathwayName } from "@/data/pathwayImages";
import CobaltSectionHead from "./CobaltSectionHead";
import BriefingRoom from "./BriefingRoom";
import CountUp from "./CountUp";
import PortalBento from "./PortalBento";
import { spellNumber } from "@/lib/numberWords";
import { CATALOG_COURSE_COUNT, CURRICULUM_TIER_COUNT } from "@/lib/catalog";
import PingDotSpinner from "@/components/ui/PingDotSpinner";
import PresetPromptPills from "@/components/ui/PresetPromptPills";
import styles from "./Home.module.css";

// The hero's three headline numbers. The course total is the catalog's own
// (COURSE_DEFS seeds 335) and the audience count is derived from
// `AUDIENCE_PROFILES` rather than hard-coded, so adding a seventh card moves
// the number instead of leaving it wrong.
const HERO_STATS = [
  {
    value: String(CURRICULUM_TIER_COUNT),
    label: "Curriculum tiers",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="6" cy="19" r="2" />
        <circle cx="18" cy="5" r="2" />
        <path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7" />
      </svg>
    ),
  },
  {
    value: String(CATALOG_COURSE_COUNT),
    label: "Courses",
    icon: <BookOpen className="w-[18px] h-[18px]" />,
  },
  {
    value: String(AUDIENCE_PROFILES.length),
    label: "Audiences",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </svg>
    ),
  },
];

const HERO_CERTS = ["NCAA bylaws certified", "FERPA and COPPA secure"];

// "One curriculum, six ways in." — one per audience card.
const SPELLED_WAYS_IN = spellNumber(AUDIENCE_PROFILES.length);

// True once `active` has stayed true for longer than delayMs — used to swap in
// a "taking longer than usual" message so a slow AI response doesn't look frozen.
function useDelayedFlag(active, delayMs) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return isSlow;
}

// How many pathways the explorer's rail offers. The catalog publishes nine
// today, so this only bites once a tenth and an eleventh are added — the rail
// is a column beside one panel, not a directory.
const HOME_PATHWAY_LIMIT = 10;

const PATHWAY_DIFFICULTY_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

// One cell of the chosen pathway's at-a-glance strip — the design's
// `.facts div`: a soft tile carrying a small grey label over a bold value.
function PathwayFact({ label, children }) {
  return (
    <div className="rounded-cn-sm bg-cn-paper-2 px-4 py-3">
      <dt className="text-cn-xs text-cn-muted">{label}</dt>
      <dd className="m-0 font-bold text-cn-ink">{children}</dd>
    </div>
  );
}

// The advisory council's four topics, in the design's order. `id` is the
// `ADVISOR_PERSONAS` id, so choosing a topic chooses the persona the AI call
// already ran against — the topic rail is a second way into the same
// selection, not a second list of advisors. The portraits are the design's
// own, and `firstName` is what the submit button says ("Send to Richard"),
// derived exactly as the design derives it: drop the honorific, take the
// first word of the name before any comma.
const ADVISORY_TOPICS = [
  {
    id: "recruiter",
    topic: "Recruiting",
    name: "Coach Vance Miller",
    firstName: "Vance",
    role: "Executive of recruiting",
    focus: "Collegiate recruitment",
    photo: "/images/design/adv-miller.webp",
    prompts: [
      "When should my son start contacting college coaches?",
      "How do I make a highlight reel coaches will watch?",
      "Is a D2 scholarship better than a D1 walk-on spot?",
    ],
  },
  {
    id: "legal",
    topic: "NIL and contracts",
    name: "Amanda Ross, Esq.",
    firstName: "Amanda",
    role: "Lead NIL specialist",
    focus: "Trademark governance",
    photo: "/images/design/adv-ross.webp",
    prompts: [
      "My son has an NIL offer from a local dealership. What should we check before signing?",
      "Can my daughter trademark her nickname?",
      "Can NIL income affect eligibility?",
    ],
  },
  {
    id: "psychology",
    topic: "Wellbeing",
    name: "Dr. Simone Chen",
    firstName: "Simone",
    role: "Head of high-performance neurobiology",
    focus: "Circadian stabilization",
    photo: "/images/design/adv-chen.webp",
    prompts: [
      "How do I sleep well around early-morning practices?",
      "How can I tell burnout from a normal slump?",
      "What should a calm game-day routine look like?",
    ],
  },
  {
    id: "legacy",
    topic: "Money",
    name: "Oumar Hill",
    firstName: "Oumar",
    role: "Co-founder",
    focus: "Generational philanthropy",
    photo: "/images/design/adv-oumar.webp",
    prompts: [
      "What should a teenager do with a first NIL payment?",
      "How does a family start giving in a structured way?",
      "When does it make sense to set up a trust?",
    ],
  },
  {
    id: "tech",
    topic: "Tech",
    name: "Waqar",
    firstName: "Waqar",
    role: "Technology advisor",
    focus: "Software and product",
    // No portrait yet — `AdvisorAvatar` draws the initial in the same box, so
    // the pill and the stage keep their shape until a photograph arrives.
    photo: null,
    prompts: [
      "How do I start learning to code with no background?",
      "What should a student build to show employers?",
      "Is a computer science degree still worth it?",
    ],
  },
];

// The cobalt design system's section head (new-design.html `.head.center`):
// an accent eyebrow, a tight 800-weight display line and a 46ch lead. Passed
// to the shared SectionHeading rather than baked into it, so the pages still
// on the porcelain system keep that component's own defaults.
const CN_HEADING = {
  eyebrowClassName: "text-cn-accent",
  headingClassName:
    "mx-auto max-w-[22ch] text-cn-section font-extrabold tracking-[-0.035em] text-balance text-cn-ink",
  subtitleClassName:
    "mx-auto max-w-[46ch] text-lg leading-[1.5] text-pretty text-cn-ink-2",
};

// The same head over the ink band, where the three colours invert.
const CN_HEADING_DARK = {
  eyebrowClassName: "text-cn-accent-soft",
  headingClassName:
    "mx-auto max-w-[22ch] text-cn-section font-extrabold tracking-[-0.035em] text-balance text-cn-on-ink",
  subtitleClassName:
    "mx-auto max-w-[46ch] text-lg leading-[1.5] text-pretty text-cn-on-ink-2",
};

// Cycled per advisor card index purely for visual variety in the consult board.
const ADVISOR_TINTS = [
  "bg-cn-paper-3",
  "bg-cn-paper-2",
  "bg-cn-paper-4",
  "bg-cn-paper-3",
];

/* Preserved for restoring the commented-out Learning Pathways Showcase.
// Cycled per pathway card for the soft corner wash — same idea as ADVISOR_TINTS.
const PATHWAY_TINTS = [
  "bg-sky/70",
  "bg-sage/70",
  "bg-rose/50",
  "bg-lavender/70",
  "bg-mint/70",
  "bg-gold/25",
];

// Mirrors PathwayCard's badge wording (components/features/pathways/PathwayCard.jsx)
// so a pathway reads identically on the home teaser and in the /pathways store.
// The card itself isn't reused: that one carries select/purchase controls bound
// to auth + cart state, which this marketing teaser deliberately has none of.
function getPathwayTierLabel(tiers) {
  if (!tiers || tiers.length === 0) return "Standalone";
  if (tiers.length === 1) return `Tier ${tiers[0].level}`;
  return `${tiers.length} Tiers`;
}
*/

export default function Home() {
  const homeRef = useRef(null);
  const heroScreenRef = useRef(null);

  // The hero screen's tilt: 1 while the hero is at the top, easing to 0 over
  // the first 480px of scroll, so the product straightens as it leaves. The
  // value is written to a CSS variable rather than to `transform` itself,
  // because the transform is three functions deep and belongs in the
  // stylesheet; this only supplies the number. Reduced motion opts out
  // entirely and the element's own `motion-reduce:` class flattens it.
  useEffect(() => {
    const screen = heroScreenRef.current;
    if (!screen) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let queued = false;
    const apply = () => {
      queued = false;
      const tilt = Math.max(0, 1 - window.scrollY / 480);
      screen.style.setProperty("--tilt", tilt.toFixed(3));
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const router = useRouter();
  const onExploreTiers = () => router.push(ROUTES.CURRICULUM);
  const onNavigateToPortal = () => router.push(ROUTES.STUDENT_PORTAL);
  const onExplorePathways = () => router.push(ROUTES.CURRICULUM);
  // New/unauthenticated visitors are guided into the onboarding wizard
  // (signup -> questionnaire -> pathway recommendation -> payment) rather
  // than dropped straight into passive browsing, so the hero's primary CTA
  // and the post-quiz recommendation CTA use this instead of onExploreTiers.
  const onStartOnboarding = () => router.push(ROUTES.ONBOARDING);
  const [selectedPathwayId, setSelectedPathwayId] = useState(null);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Bundle pricing is members-only, here as everywhere else a pathway is
  // shown; the recommendation panel offers the sign-in instead of the number.
  const { canSeePrice, isResolved: isPriceResolved } = usePathwayPricing();
  const [isPriceSignInOpen, setIsPriceSignInOpen] = useState(false);

  // Inline Interactive Consultation Board states
  const [selectedConsultAdvisorId, setSelectedConsultAdvisorId] =
    useState(ADVISORY_TOPICS[0].id);
  const [consultQuery, setConsultQuery] = useState("");
  const [consultEmail, setConsultEmail] = useState("");
  const [consultAdvice, setConsultAdvice] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);
  const isConsultReplySlow = useDelayedFlag(isConsulting, 6000);

  // Floating chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatAdvisorId, setSelectedChatAdvisorId] =
    useState("recruiter");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const isChatReplySlow = useDelayedFlag(isChatLoading, 6000);
  const messagesEndRef = useRef(null);

  // Hot reset welcome message for selected chat advisor
  useEffect(() => {
    const advisor =
      ADVISOR_PERSONAS.find((a) => a.id === selectedChatAdvisorId) ||
      ADVISOR_PERSONAS[0];
    setChatMessages([
      {
        id: "welcome-" + selectedChatAdvisorId,
        sender: "advisor",
        text: `### Academic Security Briefing

Hello! I am **${advisor.name}**, serving as your **${advisor.title}**.

"${advisor.quote}"

**My Strategic Specialities:**
- ${advisor.specialty.split(", ").join("\n- ")}

How can I help you map out your high-compliance curriculum track or resolve specific training/academic bottlenecks today?`,
      },
    ]);
  }, [selectedChatAdvisorId]);

  // Handle auto scroll inside active chat window
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading, isChatOpen]);

  // Speak to Advisor on the Inline consultation Board
  const handleSpeakToConsultAdvisor = async () => {
    if (!consultQuery.trim()) return;
    setIsConsulting(true);
    setConsultAdvice("");

    const advisor =
      ADVISOR_PERSONAS.find((a) => a.id === selectedConsultAdvisorId) ||
      ADVISOR_PERSONAS[0];
    const systemPrompt = `${advisor.systemPrompt}

You are serving as the Senior Advisor on the Cool Nerdz Academy Home Screen.
Your goal is to guide prospective or active students, parents, and partners.
Analyze their query, provide a professional, specific analysis report, and recommend:
- At least one specific **Curriculum Tier** (Tiers 1 to 9) that matches their goals. Explain specifically why.
- Provide 2 or 3 hyper-targeted high-compliance action checklist items.

Formatting: Keep your response elegant, structured with crystal-clear headers, and keep your tone completely in-character. Use Markdown headers and bullets. Do not make up facts; explain things cleanly and authoritatively.`;

    try {
      const data = await requestAdvisorAdvice({
        scenario: `User Consultation Query:\n"${consultQuery}"`,
        systemPrompt,
        advisorName: advisor.name,
      });
      if (data.advice) {
        setConsultAdvice(data.advice);
      } else if (data.error) {
        setConsultAdvice(
          `### Advisory Outage\n\nFailed to receive a direct secure dispatch from ${advisor.name}.\n\nDetails: *${data.error}*`,
        );
      }
    } catch (err) {
      console.error("Advisor consult exception:", err);
      setConsultAdvice(
        `### Operational Interrupt\n\nUnable to establish direct satellite link with ${advisor.name}. Reason: "${err.message || err}".`,
      );
    } finally {
      setIsConsulting(false);
    }
  };

  // Speak to advisor on the floating chat bubble
  const handleSendChatMessage = async (presetText) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    // Add user message
    const userMsgId = "user-" + Date.now();
    setChatMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: textToSend },
    ]);
    if (!presetText) setChatInput("");
    setIsChatLoading(true);

    const advisor =
      ADVISOR_PERSONAS.find((a) => a.id === selectedChatAdvisorId) ||
      ADVISOR_PERSONAS[0];
    const systemPrompt = `${advisor.systemPrompt}

You are speaking on our live floating Concierge desk on the Academy Home page.
Keep your response concise but highly tailored and strategic (approx 150-250 words is optimal. Use clean line breaks).
Always remain strictly in character as **${advisor.name}**, **${advisor.title}**.
Guide them, explain how the curriculum tiers relate to their query, and propose concrete physical/mental/legal protocols.`;

    try {
      const data = await requestAdvisorAdvice({
        scenario: `Live Chat Consultation. Message history ending in user query:\n"${textToSend}"`,
        systemPrompt,
        advisorName: advisor.name,
      });
      const responseText =
        data.advice ||
        `I apologize, but I am currently offline. Please try to send this message through our standard Secure student channels.`;

      setChatMessages((prev) => [
        ...prev,
        {
          id: "advisor-" + Date.now(),
          sender: "advisor",
          text: responseText,
        },
      ]);
    } catch (err) {
      console.error("Chat advice request failed:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: "chk-err-" + Date.now(),
          sender: "advisor",
          text: `### Connection Timeout\n\nUnable to reach ${advisor.name}. Let's re-establish the connection in a moment. Try sending again.`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Pathways shown in the "Determine Your Pathway" diagnostic below are the
  // real, purchasable pathways from the backend (same data as /pathways),
  // not hardcoded copy — so this section always reflects what's actually
  // for sale.
  const { data: pathwaysData, isLoading: isPathwaysLoading } = useQuery({
    queryKey: ["home-pathways"],
    queryFn: async () => {
      // The whole published catalog, because the explorer below ranks it
      // before it takes the top ten — a page of twelve would rank twelve
      // arbitrary rows rather than the catalog's biggest bundles.
      const response = await getPublicPathways({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });
  const pathways = useMemo(() => pathwaysData || [], [pathwaysData]);

  // The explorer's rail: the catalog's ten biggest bundles, largest first.
  // Pathways holding the same number of courses keep the catalog's own order
  // (the sort carries an index tiebreak rather than relying on the engine's
  // stability), so the four ten-course pathways never shuffle between
  // renders. The ledger above still counts `pathways`, not this — it states
  // how many pathways the catalog has, which is not the same question.
  const topPathways = useMemo(
    () =>
      pathways
        .map((pathway, index) => ({ pathway, index }))
        .sort(
          (a, b) =>
            (b.pathway.course_count || 0) - (a.pathway.course_count || 0) ||
            a.index - b.index,
        )
        .slice(0, HOME_PATHWAY_LIMIT)
        .map((row) => row.pathway),
    [pathways],
  );

  useEffect(() => {
    if (!selectedPathwayId && topPathways.length > 0) {
      setSelectedPathwayId(topPathways[0].id);
    }
  }, [topPathways, selectedPathwayId]);

  const { data: selectedPathway } = useQuery({
    queryKey: ["home-pathway-detail", selectedPathwayId],
    queryFn: async () => {
      const response = await getPublicPathwayById(selectedPathwayId);
      return response?.data;
    },
    enabled: Boolean(selectedPathwayId),
  });

  const pathwayCourses = [...(selectedPathway?.courses || [])].sort(
    (a, b) => a.order - b.order,
  );

  // The list row already carries the name, price and course count, so the
  // panel can render them the moment a pathway is picked instead of blanking
  // out while its detail request is in flight. Detail fields win where both
  // have one.
  const selectedPathwayRow = topPathways.find(
    (pathway) => pathway.id === selectedPathwayId,
  );
  const recommended = {
    ...(selectedPathwayRow || {}),
    ...(selectedPathway || {}),
  };

  const recommendedParagraphs = toPathwayParagraphs(
    recommended.description || recommended.summary,
  );
  const activeAdvisoryTopic =
    ADVISORY_TOPICS.find((topic) => topic.id === selectedConsultAdvisorId) ||
    ADVISORY_TOPICS[0];
  const activeChatAdvisor =
    ADVISOR_PERSONAS.find((advisor) => advisor.id === selectedChatAdvisorId) ||
    ADVISOR_PERSONAS[0];

  // Every `data-cn-reveal` element below rises in once as it is scrolled to.
  // The sweep is re-run when the pathway list arrives, since that section's
  // cards do not exist on the first pass.
  useScrollReveal(homeRef, [isPathwaysLoading, pathways.length]);

  // The ledger's four figures. Each note is written from the data rather than
  // fixed, so "the largest bundle" stays true if a pathway overtakes Coaching.
  const biggestPathway = pathways.reduce(
    (best, pathway) =>
      (pathway.course_count || 0) > (best?.course_count || 0) ? pathway : best,
    null,
  );
  const ledgerFigures = [
    {
      label: "Tiers",
      value: CURRICULUM_TIER_COUNT,
      note: "From The Blueprint to Critical Thinking, taken in order.",
    },
    {
      label: "Pathways",
      value: pathways.length,
      note: biggestPathway
        ? `${shortPathwayName(biggestPathway.name)} is the largest bundle, at ${biggestPathway.course_count} courses.`
        : "Each one bundles a run of courses taken together.",
    },
    {
      label: "Courses",
      value: CATALOG_COURSE_COUNT,
      note: "Every one sits in a tier and at least one pathway.",
    },
    {
      label: "Audiences",
      value: AUDIENCE_PROFILES.length,
      note: "Athletes, scholars, parents, coaches, founders and schools.",
    },
  ];

  const easeOut = [0.16, 1, 0.3, 1];

  return (
    <div
      id="home-container"
      ref={homeRef}
      className={`${styles.home} relative w-full overflow-hidden bg-cn-paper text-cn-ink`}
    >
      {/* Hero. Two columns: the copy, and the "stage" — the portal screenshot
          tilted in perspective with a photo and three state chips floating
          over it. The dot field and the blue bloom behind it are painted by
          `.cn-hero` (app/globals.css) and masked out before they reach the
          type, which is what keeps the headline on plain paper. */}
      <section className="cn-hero relative isolate overflow-hidden pt-16 pb-6">
        <div
          id="hero-header-section"
          className="cn-container relative z-10 grid items-center gap-12 lg:min-h-[calc(100svh-var(--cn-nav-h)-140px)] lg:grid-cols-2 lg:gap-16"
        >
          <div className="min-w-0">
            <Link
              id="hero-pillnote"
              href={ROUTES.PARTNERSHIPS}
              className="cn-enter mb-6 inline-flex h-[34px] items-center gap-2 rounded-full border border-cn-rule bg-white pr-3 pl-1 text-cn-sm font-medium text-cn-ink-2 no-underline shadow-cn-1 transition-colors duration-150 hover:border-cn-accent-soft"
            >
              <b className="inline-grid h-[26px] place-items-center rounded-full bg-cn-accent px-2 text-cn-xs font-bold text-white">
                New
              </b>
              School licensing with live cost estimates
            </Link>

            {/* One span per word, each landing 90ms after the last. */}
            <h1
              id="hero-headline"
              className="max-w-[12ch] text-cn-display font-extrabold tracking-[-0.035em] text-cn-ink"
            >
              <span className="cn-word" style={{ "--cn-i": 0 }}>
                Build
              </span>{" "}
              <span className="cn-word" style={{ "--cn-i": 1 }}>
                Your
              </span>{" "}
              <span className="cn-word" style={{ "--cn-i": 2 }}>
                Legacy.
              </span>
            </h1>

            <p
              id="hero-subline"
              className="cn-enter mt-6 max-w-[34ch] text-[clamp(1.125rem,0.4vw+1rem,1.375rem)] leading-[1.5] text-cn-ink-2"
              style={{ "--cn-delay": "450ms" }}
            >
              Nine tiers of capital, law and legacy for athletes, scholars and
              builders.
            </p>

            <div
              id="hero-actions"
              className="cn-enter mt-10 flex flex-wrap gap-3"
              style={{ "--cn-delay": "550ms" }}
            >
              <button
                id="btn-explore-pathways"
                type="button"
                onClick={onExplorePathways}
                className="inline-flex h-[50px] min-w-[200px] flex-1 items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2 sm:flex-none"
              >
                Discover the 9 tiers
                <ArrowRight className="w-[18px] h-[18px]" />
              </button>
              <button
                id="btn-portal-access"
                type="button"
                onClick={onNavigateToPortal}
                className="inline-flex h-[50px] min-w-[200px] flex-1 items-center justify-center rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink shadow-cn-1 transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink sm:flex-none"
              >
                Enter the portal
              </button>
            </div>

            {/* The three headline numbers. `HERO_STATS` reads the real
                catalog counts rather than repeating the design's mock ones. */}
            <div
              id="hero-stats"
              className="cn-enter mt-10 grid max-w-[540px] grid-cols-1 rounded-cn-lg border border-cn-rule bg-white shadow-cn-1 sm:grid-cols-3"
              style={{ "--cn-delay": "650ms" }}
            >
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-w-0 items-center gap-3 border-t border-cn-rule p-4 first:border-t-0 sm:border-t-0 sm:border-l sm:first:border-l-0"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-cn-paper-3 text-cn-accent">
                    {stat.icon}
                  </span>
                  <span className="min-w-0">
                    <b className="block text-cn-xl leading-[1.1] font-extrabold tracking-[-0.02em] tabular-nums text-cn-ink">
                      {stat.value}
                    </b>
                    <small className="block text-cn-xs whitespace-nowrap text-cn-muted">
                      {stat.label}
                    </small>
                  </span>
                </div>
              ))}
            </div>

            <ul
              id="hero-certs"
              className="cn-enter mt-4 flex list-none flex-wrap gap-2 p-0"
              style={{ "--cn-delay": "750ms" }}
            >
              {HERO_CERTS.map((cert) => (
                <li
                  key={cert}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cn-rule bg-white py-[5px] pr-3 pl-2.5 text-cn-xs font-semibold text-cn-ink-2"
                >
                  <ShieldCheck className="w-[15px] h-[15px] text-cn-ok" />
                  {cert}
                </li>
              ))}
            </ul>
          </div>

          {/* The stage. `--tilt` runs 1 → 0 over the first 480px of scroll
              (see the effect above), straightening the screen as the hero
              leaves; the chips float on their own loop regardless. */}
          <div
            id="hero-stage"
            className="cn-enter relative pt-6 pb-16 [perspective:1600px] max-lg:hidden"
            style={{ "--cn-delay": "300ms", "--cn-dur": "1.1s" }}
          >
            <div
              ref={heroScreenRef}
              id="hero-screen"
              className="relative rounded-cn-lg border border-cn-rule bg-white p-2.5 shadow-cn-3 [transform-origin:60%_50%] [transform:rotateY(calc(-14deg*var(--tilt,1)))_rotateX(calc(7deg*var(--tilt,1)))_scale(calc(1-0.03*var(--tilt,1)))] [transition:transform_0.1s_linear] will-change-transform motion-reduce:[transform:none]"
            >
              <img
                src="/images/design/portal-dashboard.webp"
                alt="The Cool Nerdz student dashboard: next lesson, level, assignments and courses in progress"
                width={1600}
                height={1000}
                fetchPriority="high"
                className="w-full rounded-2xl"
              />
            </div>

            <div className="absolute bottom-[2%] left-[-6%] w-[28%] overflow-hidden rounded-cn border-[6px] border-white shadow-cn-3 [rotate:-4deg]">
              <img
                src="/images/design/hero-athlete-study.webp"
                alt="A student athlete studying at a library table"
                width={640}
                height={800}
                className="block aspect-4/5 w-full object-cover"
              />
            </div>

            <div className="cn-float absolute top-[2%] right-[-3%] flex items-center gap-3 rounded-cn border border-cn-rule bg-white px-4 py-3 text-cn-sm whitespace-nowrap shadow-cn-2">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-cn-ok-bg text-cn-ok">
                <Check className="w-[18px] h-[18px]" strokeWidth={2.4} />
              </span>
              <span>
                <b className="block text-cn-sm">Assignment graded</b>
                <span className="text-cn-xs text-cn-muted">
                  CEO-101 · 132 / 150
                </span>
              </span>
            </div>

            <div
              className="cn-float absolute top-[46%] right-[-6%] flex items-center gap-3 rounded-cn border border-cn-rule bg-white px-4 py-3 text-cn-sm whitespace-nowrap shadow-cn-2"
              style={{ animationDelay: "-2s" }}
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-cn-paper-3 text-cn-accent">
                <Zap className="w-[18px] h-[18px]" />
              </span>
              <span>
                <b className="block text-cn-sm">+20 XP</b>
                <span className="text-cn-xs text-cn-muted">
                  Daily drill complete
                </span>
              </span>
            </div>

            <div
              className="cn-float absolute bottom-[8%] left-[30%] flex items-center gap-3 rounded-cn border border-cn-rule bg-white px-4 py-3 text-cn-sm whitespace-nowrap shadow-cn-2"
              style={{ animationDelay: "-4s" }}
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-[#fdecec] text-cn-live">
                <span className="cn-livedot h-2 w-2 rounded-full bg-cn-live" />
              </span>
              <span>
                <b className="block text-cn-sm">Live now</b>
                <span className="text-cn-xs text-cn-muted">
                  Office hours · COH-412
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The pathway strip, directly under the hero as the design places it.
          Driven by the same `pathways` query the sections below use, so it
          shows the real catalog rather than a fixed list. */}
      <PathwayMarquee pathways={pathways} />

      {/* Audience Role Map Section. scroll-mt clears the sticky navbar when an
          audience page links back here by anchor (ROUTES.HOME_AUDIENCES). */}
      <section
        id="audience-role-map-section"
        className="cn-section relative z-10 scroll-mt-28"
      >
        <div className="cn-container">
          <CobaltSectionHead
            headingId="audience-role-map-heading"
            heading="Built for every profile in the ecosystem."
            lead={`One curriculum, ${SPELLED_WAYS_IN} ways in. Each profile gets its own pathways.`}
          />

          {/* The design's audience bento: a four-column grid on 260px rows
              where the two featured profiles hold a 2x2 block each. */}
          <div
            id="audience-cards-grid"
            className="grid grid-cols-1 gap-6 sm:auto-rows-[minmax(260px,auto)] sm:grid-cols-2 lg:grid-cols-4"
          >
            {AUDIENCE_PROFILES.map((profile, index) => (
              <div
                key={profile.id}
                data-cn-reveal
                style={{ "--cn-d": index % 4 }}
                className={`cn-reveal flex min-h-[260px] ${
                  profile.featured ? "sm:col-span-2 lg:row-span-2" : ""
                }`}
              >
                <AudienceCard
                  profile={profile}
                  variant="cobalt"
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "The curriculum, by the numbers." The design's ledger: a sticky
          title column beside a two-up grid of figures that count up as they
          arrive. The numbers are the catalog's real ones. */}
      <section
        id="curriculum-numbers-section"
        className="cn-section relative z-10"
      >
        <div className="cn-container">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
            <div
              data-cn-reveal
              className="cn-reveal grid justify-items-start gap-4 lg:sticky lg:top-[120px]"
            >
              <h2 className="max-w-[12ch] text-cn-section font-extrabold tracking-[-0.035em] text-cn-ink">
                The curriculum, by the numbers.
              </h2>
              <p className="max-w-[30ch] text-cn-lg leading-[1.55] text-cn-ink-2">
                From a first plan to a family office, in one connected portal.
              </p>
              <button
                type="button"
                onClick={onExploreTiers}
                className="mt-3 inline-flex h-[50px] items-center justify-center gap-2 rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink shadow-cn-1 transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink"
              >
                Explore the curriculum
                <ArrowRight className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* The rule above the first row is ink rather than grey: it is the
                ledger's top edge, not a divider between two figures. */}
            <dl className="m-0 grid grid-cols-1 border-t border-cn-ink sm:grid-cols-2">
              {ledgerFigures.map((figure, index) => (
                <div
                  key={figure.label}
                  data-cn-reveal
                  style={{ "--cn-d": index }}
                  className="cn-reveal border-b border-cn-rule py-10 pr-4 sm:pr-10 sm:even:border-l sm:even:border-cn-rule sm:even:pl-10"
                >
                  <dt className="text-cn-sm font-semibold text-cn-ink-2">
                    {figure.label}
                  </dt>
                  <dd className="m-0 mt-3 grid gap-3">
                    <CountUp
                      value={figure.value}
                      className="text-[clamp(4rem,6vw+1rem,7.5rem)] leading-[0.9] font-extrabold tracking-[-0.055em] tabular-nums text-cn-ink"
                    />
                    <span className="max-w-[30ch] text-cn-ink-2">
                      {figure.note}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* "Everything happens in the portal." The design's bento of portal
          features, directly after the ledger. */}
      <section id="portal-bento-section" className="cn-section relative z-10">
        <div className="cn-container">
          <CobaltSectionHead
            headingId="portal-bento-heading"
            heading="Everything happens in the portal."
            lead="Courses, drills, live classes and rewards, in one place for students and their teachers."
          />
          <PortalBento />
        </div>
      </section>

      {/* Curated Core Philosophies — the design's ink band, the one dark
          surface on the page, with its engraved grid fading out downwards. */}
      <section
        id="philosophies-section"
        className="cn-section cn-band cn-dark-grid relative isolate overflow-hidden bg-cn-ink"
      >
        <div className="cn-container relative">
          <CobaltSectionHead
            tone="ink"
            headingId="philosophies-heading"
            heading="Three principles shape every tier."
            lead="The reasons the curriculum is built the way it is."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                numeral: "I",
                title: "Architectural integrity",
                body: "Real tactical metrics, redline contract examples and the legal codes behind them.",
              },
              {
                numeral: "II",
                title: "Cognitive science first",
                body: "Mental capacity, diagnostic scores and nervous system recovery come before tactics.",
              },
              {
                numeral: "III",
                title: "Multi-generation focus",
                body: "NIL deals and admissions are entry gates. The goal is a generational wealth office.",
              },
            ].map((principle, index) => (
              <article
                key={principle.numeral}
                data-cn-reveal
                style={{ "--cn-d": index }}
                className="cn-reveal grid content-start gap-4 rounded-cn-lg border border-cn-ink-line bg-white/[0.04] p-10 text-left transition-[background-color,border-color] duration-200 ease-cn-out hover:border-cn-accent-soft hover:bg-white/[0.07]"
              >
                <span className="text-cn-3xl font-extrabold tracking-[-0.02em] text-cn-accent-soft">
                  {principle.numeral}
                </span>
                <h4 className="text-cn-xl font-bold tracking-[-0.015em] text-cn-on-ink">
                  {principle.title}
                </h4>
                <p className="text-cn-on-ink-2">{principle.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* "Choose your pathway." — the design's explorer (`.explorer` in
          new-design.html): a rail of the published pathways on the left over
          four columns, the chosen one's panel on the right over eight. */}
      <section id="pathway-audit-section" className="cn-section relative z-10">
        <div className="cn-container">
          <CobaltSectionHead
            headingId="pathway-audit-heading"
            heading="Choose your pathway."
            lead="Pick one to see what it covers and how many courses it holds."
          />

          {isPathwaysLoading && (
            <div className="flex min-h-[200px] items-center justify-center text-cn-sm font-medium text-cn-muted">
              Loading pathways...
            </div>
          )}

          {!isPathwaysLoading && topPathways.length === 0 && (
            <div className="flex min-h-[200px] items-center justify-center text-cn-sm font-medium text-cn-muted">
              No pathways published yet — check back soon.
            </div>
          )}

          {!isPathwaysLoading && topPathways.length > 0 && (
            // Both columns share the row's height (`items-stretch`), so the
            // rail runs the full depth of the panel beside it rather than
            // stopping short of it — the design's `grid-auto-rows: 1fr`.
            <div
              data-cn-reveal
              className="cn-reveal grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
            >
              {/* The pathway rail. */}
              <div
                id="audit-selector-group"
                role="tablist"
                aria-label="Pathways"
                aria-orientation="vertical"
                className="grid h-full auto-rows-fr gap-1"
              >
                {topPathways.map((pathway) => {
                  const isActive = selectedPathwayId === pathway.id;
                  return (
                    <button
                      id={`audit-profile-btn-${pathway.id}`}
                      key={pathway.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => setSelectedPathwayId(pathway.id)}
                      className={`flex h-full min-h-[52px] items-center justify-between gap-4 rounded-cn-sm border px-4 py-3 text-left transition-[background-color,color] duration-150 ease-cn-out ${
                        isActive
                          ? "border-cn-rule bg-white font-semibold text-cn-ink shadow-cn-1"
                          : "border-transparent bg-transparent font-medium text-cn-ink-2 hover:bg-white hover:text-cn-ink"
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        {shortPathwayName(pathway.name)}
                      </span>
                      <small
                        className={`shrink-0 text-cn-sm font-medium whitespace-nowrap ${
                          isActive ? "text-cn-accent" : "text-cn-muted"
                        }`}
                      >
                        {pathway.course_count} course
                        {pathway.course_count === 1 ? "" : "s"}
                      </small>
                    </button>
                  );
                })}
              </div>

              {/* The chosen pathway's panel: its photograph on the left, what
                  it covers on the right. */}
              <div
                id="audit-results-container"
                role="tabpanel"
                aria-labelledby={
                  selectedPathwayId
                    ? `audit-profile-btn-${selectedPathwayId}`
                    : undefined
                }
                className="grid h-full grid-cols-1 overflow-hidden rounded-cn-lg border border-cn-rule bg-white shadow-cn-2 md:grid-cols-2"
              >
                <figure className="relative m-0 grid h-full min-h-[240px] place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--color-cn-paper-3),var(--color-cn-paper-4)_60%,var(--color-cn-accent-soft))] md:min-h-[440px]">
                  {pathwayImage(recommended.slug) && (
                    <img
                      src={pathwayImage(recommended.slug)}
                      alt={recommended.name || ""}
                      className="h-full w-full object-cover"
                    />
                  )}
                </figure>

                <div className="flex flex-col gap-6 p-6 md:p-10">
                  <div className="text-[clamp(4rem,5vw+1rem,6rem)] leading-[0.9] font-extrabold tracking-[-0.05em] text-cn-ink tabular-nums">
                    {recommended.course_count ?? pathwayCourses.length}
                    <small className="mt-2 block text-cn-base font-semibold tracking-normal text-cn-ink-2">
                      courses in this pathway
                    </small>
                  </div>

                  <h3 className="text-cn-xl font-bold tracking-[-0.015em] text-cn-ink">
                    {recommended.name || "..."}
                  </h3>

                  {recommendedParagraphs.length > 0 ? (
                    <div className="space-y-3">
                      {recommendedParagraphs.map((paragraph, index) => (
                        <p key={index} className="text-cn-ink-2">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-cn-ink-2">Loading pathway details...</p>
                  )}

                  {/* At a glance. The bundle price is members-only here as
                      everywhere else, so that one cell offers the sign-in
                      instead of the number. */}
                  <dl className="m-0 grid grid-cols-2 gap-3">
                    <PathwayFact label="Bundle">
                      {!isPriceResolved ? (
                        <span
                          aria-hidden="true"
                          className="block h-5 w-16 rounded bg-cn-paper-3"
                        />
                      ) : canSeePrice ? (
                        formatCoursePrice(recommended.base_price)
                      ) : (
                        <button
                          id="btn-recommendation-price"
                          type="button"
                          onClick={() => setIsPriceSignInOpen(true)}
                          className="inline-flex items-center gap-1.5 text-cn-sm font-semibold text-cn-accent transition-colors duration-150 hover:text-cn-accent-3"
                        >
                          <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                          Sign in to view
                        </button>
                      )}
                    </PathwayFact>
                    <PathwayFact label="Level">
                      {PATHWAY_DIFFICULTY_LABELS[recommended.difficulty] ||
                        "All levels"}
                    </PathwayFact>
                    <PathwayFact label="Access">
                      {recommended.duration_weeks > 0
                        ? `${recommended.duration_weeks} week${
                            recommended.duration_weeks === 1 ? "" : "s"
                          }`
                        : "Lifetime"}
                    </PathwayFact>
                    <PathwayFact label="Courses">
                      {recommended.course_count ?? pathwayCourses.length}
                    </PathwayFact>
                  </dl>

                  <button
                    id="btn-recommendation-cta"
                    type="button"
                    onClick={onStartOnboarding}
                    className="mt-auto inline-flex h-[50px] items-center justify-center gap-2 self-start rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
                  >
                    Explore the pathway
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Learning Pathways Showcase — temporarily hidden; preserved for future use.
      <section
        id="learning-pathways-section"
        className="bg-transparent border-t border-line py-14 md:py-16 px-6 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            className="mb-10"
            eyebrow="Guided Learning Pathways"
            heading="Find the Pathway Built for Your Ambition"
            subtitle="Each pathway bundles a hand-picked sequence of courses into a single enrolment — ordered so every course builds on the one before it."
          />

          {isPathwaysLoading && (
            <div className="flex items-center justify-center min-h-[200px] text-muted font-sans uppercase tracking-widest text-cn-xs font-medium">
              Loading pathways...
            </div>
          )}

          {!isPathwaysLoading && pathways.length === 0 && (
            <div className="flex items-center justify-center min-h-[200px] text-muted font-sans uppercase tracking-widest text-cn-xs font-medium">
              No pathways published yet — check back soon.
            </div>
          )}

          {!isPathwaysLoading && pathways.length > 0 && (
            <>
              <div
                id="learning-pathways-grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {pathways.slice(0, 6).map((pathway, pathwayIdx) => {
                  const courseCount = pathway.course_count ?? 0;
                  return (
                    <Link
                      key={pathway.id}
                      id={`home-pathway-card-${pathway.id}`}
                      href={`${ROUTES.PATHWAYS}/${pathway.slug}`}
                      className="group relative isolate flex flex-col overflow-hidden rounded-panel border border-line bg-paper p-6 text-left shadow-soft transition duration-500 hover:-translate-y-1 hover:border-pine/25 hover:shadow-elevated"
                    >
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-2xl opacity-70 transition-opacity duration-500 group-hover:opacity-100 ${
                          PATHWAY_TINTS[pathwayIdx % PATHWAY_TINTS.length]
                        }`}
                      ></div>

                      <div className="relative flex items-center justify-between gap-3">
                        <span className="font-serif text-3xl font-light leading-none text-ink/25 tabular-nums">
                          {String(pathwayIdx + 1).padStart(2, "0")}
                        </span>
                        <span className="rounded-full border border-line bg-paper/80 px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-widest text-pine backdrop-blur-sm">
                          {getPathwayTierLabel(pathway.tiers)}
                        </span>
                      </div>

                      <h3 className="relative mt-6 font-serif text-xl font-light leading-[1.15] tracking-tight text-ink line-clamp-2 transition-colors duration-300 group-hover:text-moss">
                        {pathway.name}
                      </h3>
                      <p className="relative mt-2.5 text-cn-sm font-light leading-relaxed text-muted line-clamp-3">
                        {pathway.summary ||
                          "A guided sequence of courses drawn from the 9-tier curriculum."}
                      </p>

                      <div className="relative mt-auto pt-6">
                        <div className="flex items-center gap-3 border-t border-line pt-4">
                          <span className="flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-widest text-muted">
                            <Layers className="h-3.5 w-3.5" />
                            {courseCount} Course{courseCount === 1 ? "" : "s"}
                          </span>
                          <span className="ml-auto font-sans text-cn-base font-semibold text-ink">
                            {formatCoursePrice(pathway.base_price)}
                          </span>
                        </div>
                        <span className="mt-4 flex items-center gap-1.5 text-cn-xs font-sans font-semibold uppercase tracking-widest text-moss">
                          Explore Pathway
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  id="btn-view-all-pathways"
                  type="button"
                  onClick={onExplorePathways}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-8 py-3.5 text-cn-sm font-semibold tracking-wide text-ink transition duration-300 hover:bg-porcelain"
                >
                  View All Pathways
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      */}

      {/* "Step inside the briefing room." — the design's `.brief`. */}
      <section
        id="cinematic-walkthrough-section"
        className="cn-section relative z-10"
      >
        <div className="cn-container">
          <CobaltSectionHead
            headingId="briefing-room-heading"
            heading="Step inside the briefing room."
            lead="Sixteen minutes from the founder on how the academy works."
          />

          <BriefingRoom />
        </div>
      </section>

      {/* "Ask the senior advisory council." — the design's `.adv4`: the topic
          pills across the top, the chosen specialist's portrait on the left
          over four columns, the question card on the right over seven. */}
      <section id="live-advisors-consultation-section" className="cn-section relative z-10">
        <div className="cn-container">
          <CobaltSectionHead
            headingId="advisory-council-heading"
            heading="Ask the senior advisory council."
            lead="Choose what you need help with. The right specialist reads your question and replies to you privately."
          />

          <form
            data-cn-reveal
            className="cn-reveal grid grid-cols-1 items-stretch gap-x-6 gap-y-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              handleSpeakToConsultAdvisor();
            }}
          >
            {/* The topic rail. Picking a topic picks the specialist, which is
                the same selection the card and the portrait both read. */}
            <fieldset className="m-0 border-0 p-0 lg:col-span-2">
              <legend className="mb-3 p-0 text-cn-sm text-cn-muted">
                Choose a topic
              </legend>
              <div className="flex flex-wrap gap-2">
                {ADVISORY_TOPICS.map((option) => {
                  const isActive = selectedConsultAdvisorId === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`relative flex items-center gap-3 rounded-full border py-1.5 pr-3.5 pl-1.5 text-cn-sm font-semibold transition-[background-color,border-color,color] duration-200 ease-cn-out ${
                        isActive
                          ? "border-cn-ink bg-cn-ink text-white"
                          : "border-cn-rule bg-white text-cn-ink hover:border-cn-rule-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ask-topic"
                        value={option.topic}
                        checked={isActive}
                        onChange={() => {
                          setSelectedConsultAdvisorId(option.id);
                          setConsultAdvice("");
                        }}
                        className="pointer-events-none absolute opacity-0"
                      />
                      <span className="shrink-0">
                        <AdvisorAvatar
                          name={option.name}
                          src={option.photo}
                          className="h-8 w-8 rounded-full object-cover text-cn-xs"
                        />
                      </span>
                      <span className="whitespace-nowrap">{option.topic}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* The specialist's portrait. */}
            <div className="flex min-h-full">
              {/* The column stretches to the card beside it, but the portrait
                  stops at a height its 4:5 source can still fill honestly —
                  past that, `object-cover` just magnifies the face. */}
              <figure className="relative m-0 max-h-[680px] flex-1 overflow-hidden rounded-cn-lg">
                {activeAdvisoryTopic.photo ? (
                  <img
                    src={activeAdvisoryTopic.photo}
                    alt={activeAdvisoryTopic.name}
                    className="h-full min-h-[420px] w-full object-cover object-[50%_22%]"
                  />
                ) : (
                  /* The design's own empty-media treatment (`.ph` with no
                     `.has`): the cobalt wash, with the advisor's initial where
                     the face would be. */
                  <span
                    aria-hidden="true"
                    className="grid h-full min-h-[420px] w-full place-items-center bg-[linear-gradient(135deg,var(--color-cn-paper-3),var(--color-cn-paper-4)_60%,var(--color-cn-accent-soft))] text-[clamp(5rem,12vw,9rem)] leading-none font-extrabold tracking-[-0.04em] text-white select-none"
                  >
                    {advisorInitial(activeAdvisoryTopic.name)}
                  </span>
                )}
                <figcaption className="absolute inset-x-0 bottom-0 grid gap-0.5 bg-[rgba(10,16,40,0.62)] px-6 pt-10 pb-6 text-white [mask-image:linear-gradient(180deg,transparent,#000_40%)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_40%)]">
                  <b className="text-cn-2xl leading-[1.1] tracking-[-0.03em]">
                    {activeAdvisoryTopic.name}
                  </b>
                  <span className="text-cn-on-ink-2">
                    {activeAdvisoryTopic.role}
                  </span>
                  <em className="mt-2 text-cn-sm not-italic text-white">
                    Focus: {activeAdvisoryTopic.focus}
                  </em>
                </figcaption>
              </figure>
            </div>

            {/* The question card. */}
            <div className="grid content-start rounded-cn-lg border border-cn-rule bg-white shadow-cn-1">
              <div className="flex items-center gap-3 border-b border-cn-rule px-4 py-4 text-cn-sm md:px-10">
                <span className="text-cn-sm text-cn-muted">To</span>
                <b className="font-semibold">{activeAdvisoryTopic.name}</b>
                <span className="ml-auto rounded-full bg-cn-paper-3 px-2.5 py-[3px] text-cn-xs font-semibold text-cn-accent-3">
                  {activeAdvisoryTopic.topic}
                </span>
              </div>

              <label className="sr-only" htmlFor="consult-query-input-box">
                Your question
              </label>
              <textarea
                id="consult-query-input-box"
                rows={6}
                required
                value={consultQuery}
                onChange={(event) => setConsultQuery(event.target.value)}
                placeholder="Describe your situation the way you’d explain it to a friend."
                className="min-h-[180px] resize-y border-0 bg-transparent p-4 text-cn-lg leading-[1.5] text-cn-ink placeholder:text-cn-muted focus:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-cn-accent)] md:px-10 md:py-6"
              />

              <div className="grid gap-3 px-4 pb-6 md:px-10">
                <span className="text-cn-sm text-cn-muted">
                  Not sure how to start? Try one of these
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeAdvisoryTopic.prompts.map((prompt, index) => (
                    <button
                      id={`consult-preset-btn-${index}`}
                      key={prompt}
                      type="button"
                      onClick={() => setConsultQuery(prompt)}
                      className="rounded-full border border-cn-rule bg-cn-paper-2 px-3.5 py-[7px] text-left text-cn-sm text-cn-ink-2 transition-[background-color,border-color,color] duration-200 ease-cn-out hover:border-cn-accent hover:bg-white hover:text-cn-accent-3"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 border-t border-cn-rule bg-white px-4 pt-6 pb-3 sm:flex-row sm:items-center md:px-10">
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor="consult-email-input">
                    Email for the reply
                  </label>
                  <input
                    id="consult-email-input"
                    type="email"
                    autoComplete="email"
                    value={consultEmail}
                    onChange={(event) => setConsultEmail(event.target.value)}
                    placeholder="Your email for the reply"
                    className="h-[52px] w-full rounded-cn border border-cn-rule bg-white px-4 text-cn-ink placeholder:text-cn-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent"
                  />
                </div>
                <button
                  id="consult-submit-query-btn"
                  type="submit"
                  disabled={isConsulting}
                  className="inline-flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isConsulting
                    ? "Sending..."
                    : `Send to ${activeAdvisoryTopic.firstName}`}
                  <ArrowRight className="w-[18px] h-[18px]" />
                </button>
              </div>

              <p className="flex items-center gap-1.5 px-4 pb-6 text-cn-xs text-cn-muted md:px-10">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-[15px] w-[15px] shrink-0 text-cn-accent"
                />
                Private reply, usually within two working days.
              </p>

              {/* The specialist's answer, in the card it was asked from. */}
              <AnimatePresence>
                {(isConsulting || consultAdvice) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    id="consult-output-result"
                    className="mx-4 mb-6 flex flex-col overflow-hidden rounded-cn border border-cn-rule bg-cn-paper-2 p-5 text-left md:mx-10"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-cn-rule pb-3">
                      <p className="flex items-center gap-2 text-cn-xs font-semibold text-cn-muted">
                        <Award
                          aria-hidden="true"
                          className="h-4 w-4 text-cn-accent"
                        />
                        Reply from {activeAdvisoryTopic.name}
                      </p>
                      <span className="rounded-full bg-cn-paper-3 px-2.5 py-[3px] text-cn-xs font-semibold text-cn-accent-3">
                        {activeAdvisoryTopic.topic}
                      </span>
                    </div>

                    {isConsulting ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-10">
                        <PingDotSpinner />
                        <p className="animate-pulse text-cn-sm text-cn-ink-2">
                          {isConsultReplySlow
                            ? "Still reaching the desk..."
                            : "Reading your question..."}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* The answer scrolls inside the card rather than
                            growing it. A long reply otherwise pushed the card
                            past a thousand pixels, and the portrait beside it
                            — which stretches to match — became a face blown up
                            two and a half times. `overscroll-contain` keeps a
                            flick inside the panel from scrolling the page on
                            once it reaches the end. */}
                        <div className="max-h-[min(55vh,420px)] overflow-y-auto overscroll-contain pr-1">
                          <MarkdownMiniRenderer
                            text={consultAdvice}
                            size="lg"
                            tone="light"
                          />
                        </div>

                        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-cn-rule pt-4 text-cn-sm sm:flex-row">
                          <span className="text-cn-ink-2">
                            Need the curriculum behind this answer?
                          </span>
                          <button
                            type="button"
                            onClick={onExploreTiers}
                            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-cn-sm bg-cn-accent px-4 text-cn-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
                          >
                            Browse the tiers
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="cn-section relative z-10">
        <div className="cn-container grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-6">
          {/* Left Column: Heading and Badge */}
          <div className="space-y-4 lg:sticky lg:top-[calc(var(--cn-nav-h)+40px)] lg:col-span-5">
            <span className="block text-cn-xs font-semibold tracking-widest text-cn-accent uppercase">
              Institutional FAQ
            </span>
            <h2 className="mb-2 max-w-[18ch] text-cn-2xl font-extrabold tracking-[-0.035em] text-balance text-cn-ink">
              Syllabus & Partnership Intelligence
            </h2>
            <p className="max-w-[44ch] leading-relaxed text-pretty text-cn-ink-2">
              Have specific inquiries regarding Cool Nerdz&apos;s curriculum
              modules, security compliance pathways, and school licensing
              structures? Review our comprehensive advisory dossier.
            </p>
            <div className="flex items-center gap-3 border-t border-cn-rule pt-6">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-cn-sm bg-cn-paper-3 text-cn-accent">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-cn-sm font-bold text-cn-ink">
                  Direct Consultation Portal
                </p>
                <p className="mt-0.5 text-cn-sm text-cn-muted">
                  Need customized criteria evaluations? Utilize our live
                  advisors or our virtual concierge chat desk below.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Accordion Questions */}
          <div className="space-y-3 lg:col-span-7">
            {INDEX_FAQ_ITEMS.map((item, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div
                  key={idx}
                  id={`faq-item-${idx}`}
                  className={`overflow-hidden rounded-cn border bg-white transition-[border-color,box-shadow] duration-200 ease-cn-out ${
                    isOpen
                      ? "border-cn-paper-4 shadow-cn-2"
                      : "border-cn-rule hover:border-cn-rule-strong"
                  }`}
                >
                  <button
                    id={`faq-trigger-${idx}`}
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                  >
                    <span className="text-cn-base font-semibold tracking-[-0.01em] text-cn-ink">
                      {item.question}
                    </span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform duration-200 ease-cn-out ${
                        isOpen
                          ? "rotate-180 bg-cn-accent text-white"
                          : "bg-cn-paper-3 text-cn-accent"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="max-w-[65ch] px-6 pt-4 pb-6 text-cn-sm leading-relaxed text-cn-ink-2 select-text">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing Enrollment CTA */}
      <section id="enrollment-cta-section" className="cn-section relative z-10">
        <div className="cn-container">
          {/* The design's closing panel: the page's one full cobalt field,
              lit by a dot pattern that fades in from the left. */}
          <div
            id="enrollment-cta-card"
            data-cn-reveal
            className="cn-reveal cn-cta-dots relative isolate overflow-hidden rounded-cn-xl bg-cn-accent px-6 py-16 shadow-cn-3 md:px-16 md:py-24"
          >
            {/* The design's watermark: the mark bled off the bottom-right
                corner at low opacity, under the dot field and the copy. */}
            <img
              src="/images/design/mark-white.png"
              alt=""
              aria-hidden="true"
              width={300}
              height={367}
              className="pointer-events-none absolute -right-[30px] -bottom-[60px] w-[300px] opacity-[0.16]"
            />

            <div className="relative grid items-end gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <div>
                <h2 className="max-w-[14ch] text-cn-section font-extrabold tracking-[-0.035em] text-cn-on-ink">
                  Begin your ascent through the 9 tiers.
                </h2>
                <p className="mt-4 text-cn-lg leading-[1.55] text-cn-on-ink-2">
                  Apply once. An advisor places you in the right pathway.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <button
                  id="btn-cta-start-onboarding"
                  type="button"
                  onClick={onStartOnboarding}
                  className="inline-flex h-[50px] items-center justify-center gap-2 rounded-cn-sm bg-white px-6 text-cn-base font-semibold text-cn-accent-3 transition-transform duration-150 ease-cn-out hover:-translate-y-px"
                >
                  Start your application
                  <ArrowRight className="w-[18px] h-[18px]" />
                </button>
                <button
                  id="btn-cta-explore-curriculum"
                  type="button"
                  onClick={onExploreTiers}
                  className="inline-flex h-[50px] items-center justify-center rounded-cn-sm border border-white/30 bg-white/12 px-6 text-cn-base font-semibold text-white transition-colors duration-150 ease-cn-out hover:bg-white/20"
                >
                  Browse the curriculum
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Academy Concierge Chatbot Widget */}
      <div
        id="floating-concierge-suite"
        className="fixed bottom-6 right-6 z-50 font-sans tracking-tight"
      >
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 35 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 35 }}
              id="concierge-chat-panel"
              className="relative mb-4 flex h-[520px] w-[320px] flex-col justify-between overflow-hidden rounded-cn-lg bg-cn-ink shadow-cn-3 sm:w-[380px] md:w-[410px]"
            >
              {/* Header block with selected advisor */}
              <div className="flex shrink-0 items-center justify-between border-b border-cn-ink-line bg-black/20 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="cn-livedot h-2.5 w-2.5 shrink-0 rounded-full bg-cn-live"></div>
                  <div className="min-w-0 text-left">
                    <p className="flex items-center gap-1.5 truncate text-cn-sm font-bold tracking-[-0.01em] text-white">
                      <Sparkles className="w-3.5 h-3.5 text-cn-accent-soft shrink-0" />
                      Academy AI Desk
                    </p>
                    <p className="truncate text-cn-xs text-cn-on-ink-2">
                      Live dispatch connection
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="reset-concierge-chat-btn"
                    onClick={() => {
                      const advisor =
                        ADVISOR_PERSONAS.find(
                          (a) => a.id === selectedChatAdvisorId,
                        ) || ADVISOR_PERSONAS[0];
                      setChatMessages([
                        {
                          id: "welcome-" + selectedChatAdvisorId,
                          sender: "advisor",
                          text: `### Academic Security Briefing\n\nHello! I am **${advisor.name}**, serving as your **${advisor.title}**.\n\n"${advisor.quote}"\n\n**My Strategic Specialities:**\n- ${advisor.specialty.split(", ").join("\n- ")}\n\nHow can I help you map out your high-compliance curriculum track or resolve specific training/academic bottlenecks today?`,
                        },
                      ]);
                    }}
                    title="Reset advisor briefing channel"
                    className="grid h-8 w-8 cursor-pointer place-items-center rounded-cn-sm border border-cn-ink-line bg-white/5 text-cn-on-ink-2 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="close-concierge-chat-btn"
                    onClick={() => setIsChatOpen(false)}
                    className="grid h-8 w-8 cursor-pointer place-items-center rounded-cn-sm border border-cn-ink-line bg-white/5 text-cn-on-ink-2 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Advisor Tab strip selector */}
              <div className="flex shrink-0 items-center justify-start gap-1.5 overflow-x-auto border-b border-cn-ink-line bg-white/5 p-2 scrollbar-none">
                {ADVISOR_PERSONAS.map((adv) => (
                  <button
                    id={`chat-strip-btn-${adv.id}`}
                    key={adv.id}
                    onClick={() => setSelectedChatAdvisorId(adv.id)}
                    className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-cn-sm border px-2 py-1 text-cn-xs font-semibold transition-colors duration-150 ${
                      selectedChatAdvisorId === adv.id
                        ? "border-cn-accent-soft/40 bg-cn-accent/25 text-white"
                        : "border-cn-ink-line bg-black/20 text-cn-on-ink-2 hover:text-white"
                    }`}
                  >
                    <AdvisorAvatar
                      name={adv.name}
                      src={adv.avatar}
                      className="h-5 w-5 shrink-0 rounded-full object-cover text-[9px]"
                      fallbackClassName="bg-cn-accent/30 text-white"
                    />
                    <span>{adv.name.split(" ")[1] || adv.name}</span>
                  </button>
                ))}
              </div>

              {/* Message scroll area pane */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-black/10 p-4 select-text">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "advisor" && (
                      <AdvisorAvatar
                        name={activeChatAdvisor?.name}
                        src={activeChatAdvisor?.avatar}
                        className="mt-1 h-7 w-7 shrink-0 rounded-full border border-cn-ink-line object-cover text-[10px]"
                        fallbackClassName="bg-cn-ink text-white"
                      />
                    )}

                    <div
                      className={`flex max-w-[85%] flex-col gap-1 rounded-cn px-3.5 py-2.5 text-left ${
                        msg.sender === "user"
                          ? "rounded-tr-none bg-cn-accent text-cn-sm leading-relaxed font-medium text-white"
                          : "rounded-tl-none border border-cn-ink-line bg-white/5 text-cn-sm leading-relaxed text-white"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <p className="whitespace-pre-line leading-relaxed">
                          {msg.text}
                        </p>
                      ) : (
                        <MarkdownMiniRenderer text={msg.text} size="lg" />
                      )}
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex gap-2.5 justify-start">
                    <AdvisorAvatar
                      name={activeChatAdvisor?.name}
                      src={activeChatAdvisor?.avatar}
                      className="h-7 w-7 shrink-0 animate-pulse rounded-full border border-cn-ink-line object-cover text-[10px]"
                      fallbackClassName="bg-cn-ink text-white"
                    />
                    <div className="flex items-center gap-2 rounded-cn border border-cn-ink-line bg-white/5 px-3.5 py-2 text-cn-sm text-cn-on-ink-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cn-accent-soft opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cn-accent-soft"></span>
                      </span>
                      <p className="animate-pulse text-cn-xs tracking-widest uppercase">
                        {isChatReplySlow
                          ? "STILL CONNECTING TO THE DESK..."
                          : "FORMULATING RECOMMENDATIONS..."}
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat footer layout */}
              <div className="shrink-0 space-y-2.5 border-t border-cn-ink-line bg-black/20 p-3 text-left">
                {/* suggested pills shortcut */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5 items-center justify-start">
                  {selectedChatAdvisorId === "legal" && (
                    <PresetPromptPills
                      idPrefix="chat-preset-legal"
                      prompts={[
                        "What NIL traps exist in contracts?",
                        "How do I protect my trademark?",
                        "What should I redline in a non-compete?",
                      ]}
                      onSelect={handleSendChatMessage}
                    />
                  )}

                  {selectedChatAdvisorId === "recruiter" && (
                    <PresetPromptPills
                      idPrefix="chat-preset-recruiter"
                      prompts={[
                        "What do D1 scouts look for?",
                        "How do I get more scout exposure?",
                        "How do I audit my team culture fit?",
                      ]}
                      onSelect={handleSendChatMessage}
                    />
                  )}

                  {selectedChatAdvisorId === "psychology" && (
                    <PresetPromptPills
                      idPrefix="chat-preset-psych"
                      prompts={[
                        "How do I stabilize my sleep cycle?",
                        "How does sleep impact my focus?",
                        "How do I lower stress before exams?",
                      ]}
                      onSelect={handleSendChatMessage}
                    />
                  )}

                  {selectedChatAdvisorId === "legacy" && (
                    <PresetPromptPills
                      idPrefix="chat-preset-legacy"
                      prompts={[
                        "How do family offices structure trusts?",
                        "What is a family values charter?",
                        "How do I steward my venture reserves?",
                      ]}
                      onSelect={handleSendChatMessage}
                    />
                  )}
                </div>

                {/* text input form bar */}
                <div className="flex items-center gap-2">
                  <input
                    id="floating-chat-text-input"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendChatMessage();
                      }
                    }}
                    placeholder={`Query ${ADVISOR_PERSONAS.find((a) => a.id === selectedChatAdvisorId)?.name}...`}
                    className="flex-1 rounded-cn-sm border border-cn-ink-line bg-white/5 px-3 py-2.5 text-cn-sm text-white placeholder-white/35 focus:border-cn-accent-soft focus:bg-white/10 focus:outline-none"
                  />
                  <button
                    id="floating-chat-send-btn"
                    onClick={() => handleSendChatMessage()}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-cn-sm bg-cn-accent text-white transition-colors duration-150 hover:bg-cn-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Float bubble triggers */}
        <button
          id="toggle-concierge-chat-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`group relative grid h-14 w-14 cursor-pointer place-items-center rounded-full text-white shadow-cn-3 transition-[transform,background-color] duration-200 ease-cn-out select-none hover:scale-105 active:scale-95 ${
            isChatOpen ? "bg-cn-ink" : "bg-cn-accent"
          }`}
        >
          {!isChatOpen && (
            <span
              id="concierge-pulse-ring"
              className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-cn-accent/50"
            ></span>
          )}
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 rounded-full border-2 border-white bg-cn-live px-1.5 py-0.5 text-[9.5px] font-bold tracking-widest text-white uppercase">
                live
              </div>
            </>
          )}

          {/* on hover tooltip detail */}
          <span className="pointer-events-none absolute right-16 shrink-0 rounded-cn-sm bg-cn-ink px-3.5 py-2 text-cn-xs font-semibold tracking-widest whitespace-nowrap text-white uppercase opacity-0 shadow-cn-3 transition-opacity duration-150 select-none group-hover:opacity-100">
            Live Academy Concierge
          </span>
        </button>
      </div>

      {/* `next` is the homepage, so a visitor who signs in from the withheld
          price lands back on the section they were reading. */}
      <SignInToSelectModal
        isOpen={isPriceSignInOpen}
        pathwayName={recommended.name}
        intent="price"
        closeLabel="Keep Browsing"
        nextPath={ROUTES.HOME}
        onClose={() => setIsPriceSignInOpen(false)}
      />
    </div>
  );
}
