"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  ArrowRight,
  Award,
  BookOpen,
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import IntroVideo from "@/components/features/media/IntroVideo";
import MarkdownMiniRenderer from "@/components/ui/MarkdownMiniRenderer";
import { ADVISOR_PERSONAS } from "@/data/curriculum";
import { INDEX_FAQ_ITEMS } from "@/constants/faq";
import { ROUTES } from "@/constants/routes";
import { requestAdvisorAdvice } from "@/services/advisorService";
import {
  getPublicPathwayById,
  getPublicPathways,
} from "@/services/pathwaysService";
import { formatCoursePrice } from "@/lib/store";
import SectionHeading from "@/components/ui/SectionHeading";
import PingDotSpinner from "@/components/ui/PingDotSpinner";
import PresetPromptPills from "@/components/ui/PresetPromptPills";

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

export default function Home() {
  const router = useRouter();
  const onExploreTiers = () => router.push(ROUTES.CURRICULUM);
  const onNavigateToPortal = () => router.push(ROUTES.STUDENT_PORTAL);
  // New/unauthenticated visitors are guided into the onboarding wizard
  // (signup -> questionnaire -> pathway recommendation -> payment) rather
  // than dropped straight into passive browsing, so the hero's primary CTA
  // and the post-quiz recommendation CTA use this instead of onExploreTiers.
  const onStartOnboarding = () => router.push(ROUTES.ONBOARDING);
  const [selectedPathwayId, setSelectedPathwayId] = useState(null);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Inline Interactive Consultation Board states
  const [selectedConsultAdvisorId, setSelectedConsultAdvisorId] =
    useState("legal");
  const [consultQuery, setConsultQuery] = useState("");
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

You are serving as the Senior Advisor on the TrueTrek Learning LLC Academy Home Screen.
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
      const response = await getPublicPathways({ pageSize: 12 });
      return response?.data?.results || [];
    },
  });
  const pathways = pathwaysData || [];

  useEffect(() => {
    if (!selectedPathwayId && pathways.length > 0) {
      setSelectedPathwayId(pathways[0].id);
    }
  }, [pathways, selectedPathwayId]);

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

  return (
    <div
      id="home-container"
      className="relative overflow-hidden w-full bg-transparent text-ink"
    >
      {/* Decorative ambient background */}
      <div
        id="ambient-sphere-1"
        className="absolute top-10 left-10 w-96 h-96 rounded-full bg-gold/10 blur-[120px] animate-pulse"
      ></div>
      <div
        id="ambient-sphere-2"
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-sky/20 blur-[120px] animate-pulse"
      ></div>

      {/* Hero Header Section */}
      <div
        id="hero-header-section"
        className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative z-10 flex flex-col items-center justify-center min-h-[85vh]"
      >
        <motion.div
          id="badge-banner"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-pine/10 border border-pine/15 px-4 py-2 rounded-full text-pine font-sans uppercase tracking-widest text-xs font-medium mb-8"
        >
          <Flame className="w-3.5 h-3.5 text-gold" />
          Incubator for Elite Pathfinders & Scholars
        </motion.div>

        <motion.h1
          id="hero-headline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif text-ink tracking-tight leading-[0.88] max-w-4xl font-light mb-6"
        >
          Build Your{" "}
          <span className="italic text-pine font-light">Legacy</span>.
        </motion.h1>

        <motion.p
          id="hero-subline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-muted text-lg md:text-xl font-sans max-w-2xl font-light mb-10 leading-relaxed"
        >
          The premier 9-tier educational roadmap and strategic incubator
          helping high-potential athletes, world-class scholars, and
          entrepreneurial pathfinders master real-world capital, law, and
          legacy.
        </motion.p>

        <motion.div
          id="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md"
        >
          <button
            id="btn-explore-curriculum"
            onClick={onExploreTiers}
            className="w-full sm:w-auto bg-pine hover:bg-moss text-paper font-semibold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition duration-300 shadow-elevated text-sm tracking-wide"
          >
            Explore 9-Tier Curriculum
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="btn-portal-access"
            onClick={onNavigateToPortal}
            className="w-full sm:w-auto bg-paper hover:bg-porcelain text-ink border border-line px-8 py-3.5 rounded-full text-sm font-semibold transition duration-300 tracking-wide"
          >
            Enter Student Portal
          </button>
        </motion.div>

        {/* Global Impact Dashboard Section */}
        <div
          id="stats-dashboard"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mt-24 border-t border-line pt-16"
        >
          <div id="stat-students" className="text-center md:text-left">
            <p className="text-4xl md:text-5xl font-serif font-light text-pine tracking-tight">
              12,400+
            </p>
            <p className="text-muted font-sans uppercase tracking-widest text-xs font-medium mt-2">
              Active Global Pathfinders
            </p>
          </div>
          <div
            id="stat-admissions"
            className="text-center md:text-left border-y md:border-y-0 md:border-x border-line py-6 md:py-0 md:px-8"
          >
            <p className="text-4xl md:text-5xl font-serif font-light text-ink tracking-tight">
              98.4%
            </p>
            <p className="text-muted font-sans uppercase tracking-widest text-xs font-medium mt-2">
              Collegiate Selection Rate
            </p>
          </div>
          <div id="stat-capital" className="text-center md:text-right">
            <p className="text-4xl md:text-5xl font-serif font-light text-ink tracking-tight">
              $145M+
            </p>
            <p className="text-muted font-sans uppercase tracking-widest text-xs font-medium mt-2">
              Aggregate Venture Valuation
            </p>
          </div>
        </div>
      </div>

      {/* Cinematic Walkthrough Broadcast Section */}
      <section
        id="cinematic-walkthrough-section"
        className="bg-transparent border-t border-line py-20 px-6 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            className="mb-12"
            eyebrow="Multi-Channel Orientation Broadcast"
            heading="Step Inside the Academy Briefing Room"
            subtitle="Explore the interactive dashboard, browse core orientation channels, and auto-track high-compliance transcript decoders with Amanda Ross, Esq. and Dr. Simone Chen."
          />

          <IntroVideo />
        </div>
      </section>

      {/* Profile Discovery Segment (Bento Panel) */}
      <section
        id="pathway-audit-section"
        className="bg-transparent border-t border-line py-20 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            className="mb-16"
            eyebrow="Custom Diagnostics"
            heading="Determine Your TrueTrek Learning Pathway"
            subtitle="Select your high-potential profile archetype below and see your recommended developmental curriculum, custom metrics, and action blueprint."
          />

          {isPathwaysLoading && (
            <div className="flex items-center justify-center min-h-[200px] text-muted font-sans uppercase tracking-widest text-xs font-medium">
              Loading pathways...
            </div>
          )}

          {!isPathwaysLoading && pathways.length === 0 && (
            <div className="flex items-center justify-center min-h-[200px] text-muted font-sans uppercase tracking-widest text-xs font-medium">
              No pathways published yet — check back soon.
            </div>
          )}

          {!isPathwaysLoading && pathways.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Selection Columns */}
              <div
                id="audit-selector-group"
                className="lg:col-span-4 space-y-3 lg:max-h-128 lg:overflow-y-auto pr-1"
              >
                {pathways.map((pathway) => (
                  <button
                    id={`audit-profile-btn-${pathway.id}`}
                    key={pathway.id}
                    onClick={() => setSelectedPathwayId(pathway.id)}
                    className={`w-full text-left p-4 rounded-card border transition-all duration-300 flex flex-col gap-1 ${
                      selectedPathwayId === pathway.id
                        ? "bg-pine/10 border-pine/60 text-ink shadow-soft"
                        : "bg-paper border-line text-muted hover:bg-porcelain hover:border-pine/30"
                    }`}
                  >
                    <span className="font-medium text-sm text-ink">
                      {pathway.name}
                    </span>
                    <span
                      className={`font-sans uppercase tracking-widest text-xs font-medium ${
                        selectedPathwayId === pathway.id
                          ? "text-pine"
                          : "text-muted"
                      }`}
                    >
                      {pathway.course_count} Course
                      {pathway.course_count === 1 ? "" : "s"} Bundle
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Audit Recommendation Container */}
              <div
                id="audit-results-container"
                className="lg:col-span-8 bg-paper border border-line rounded-panel p-6 md:p-8 relative min-h-[380px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4 mb-6">
                    <div>
                      <span className="text-gold font-sans uppercase tracking-widest text-xs font-medium block mb-1">
                        RECOMMENDED PATHWAY
                      </span>
                      <h3 className="text-xl md:text-2xl font-serif font-light tracking-tight text-ink">
                        {selectedPathway?.name || "..."}
                      </h3>
                    </div>
                    <div className="bg-gold/15 border border-gold/20 px-3 py-1.5 rounded-lg text-gold font-sans text-sm font-semibold">
                      {formatCoursePrice(selectedPathway?.base_price)} Bundle
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-muted text-sm leading-relaxed mb-6">
                      <span className="font-semibold text-ink">
                        Objective Profile Target:
                      </span>{" "}
                      {selectedPathway?.description ||
                        selectedPathway?.summary ||
                        "Loading pathway details..."}
                    </p>
                    <div className="bg-porcelain p-3 rounded-lg border border-line mb-6 flex gap-2.5 items-center">
                      <Target className="text-pine w-5 h-5 shrink-0" />
                      <p className="text-sm text-muted">
                        <span className="font-sans font-medium text-pine block uppercase tracking-widest text-[11px]">
                          Primary Core Curriculum Licensing
                        </span>
                        {pathwayCourses.length > 0
                          ? pathwayCourses
                              .map(({ course }) => course.title)
                              .join(", ")
                          : "Course lineup coming soon."}
                      </p>
                    </div>

                    <p className="font-sans uppercase text-muted tracking-widest text-xs font-medium mb-3">
                      Included In This Pathway
                    </p>
                    <ul className="space-y-2.5">
                      {pathwayCourses.map(({ course }) => (
                        <li
                          key={course.id}
                          className="flex items-start gap-2.5 text-muted text-sm leading-relaxed"
                        >
                          <ShieldCheck className="w-4 h-4 text-pine mt-0.5 shrink-0" />
                          <span>{course.title}</span>
                        </li>
                      ))}
                      {pathwayCourses.length === 0 && (
                        <li className="flex items-start gap-2.5 text-muted text-sm leading-relaxed">
                          <BookOpen className="w-4 h-4 text-muted/70 mt-0.5 shrink-0" />
                          <span>No courses attached to this pathway yet.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-line text-right pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-muted text-sm font-light text-left">
                    Licensed across 40+ educational administrations. Verified
                    athletic and academic compliance.
                  </span>
                  <button
                    id="btn-recommendation-cta"
                    onClick={onStartOnboarding}
                    className="bg-pine hover:bg-moss text-paper text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-1.5 transition duration-350 shrink-0 shadow-sm"
                  >
                    Explore {selectedPathway?.name || "This Pathway"}
                    <Zap className="w-3.5 h-3.5 text-gold" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Inline Academy live advisor interactive board */}
      <section
        id="live-advisors-consultation-section"
        className="bg-transparent border-t border-line py-20 px-6 relative overflow-hidden z-10"
      >
        <div
          id="inline-consult-glow"
          className="absolute -top-12 -left-12 w-80 h-80 rounded-full bg-gold/10 blur-[100px] pointer-events-none"
        ></div>
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <SectionHeading
            eyebrow="Live Consulting Board"
            heading="Connect With the Senior Advisory Council"
            headingClassName="text-3xl md:text-4xl font-serif font-light leading-[0.92] tracking-tight text-ink"
            subtitle="Formulate a custom strategic curriculum roadmap in real-time. Describe your targets and get advice back from our leading advisors immediately."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Advisor Avatars selector */}
            <div className="lg:col-span-5 space-y-4">
              <label className="text-xs font-sans uppercase text-muted tracking-widest block text-left font-medium">
                Choose Direct Session Advisor
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ADVISOR_PERSONAS.map((advisor) => (
                  <button
                    id={`consult-advisor-btn-${advisor.id}`}
                    key={advisor.id}
                    onClick={() => {
                      setSelectedConsultAdvisorId(advisor.id);
                      setConsultAdvice("");
                    }}
                    className={`p-4 rounded-card text-left border transition-all duration-300 flex flex-col gap-3 cursor-pointer ${
                      selectedConsultAdvisorId === advisor.id
                        ? "bg-pine/10 border-pine text-ink shadow-elevated"
                        : "bg-paper border-line text-muted hover:bg-porcelain hover:border-pine/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={advisor.avatar}
                        alt={advisor.name}
                        className="w-11 h-11 rounded-full border border-line object-cover bg-porcelain shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-base font-black text-ink leading-tight">
                          {advisor.name}
                        </p>
                        <p className="text-[11px] font-sans uppercase text-muted mt-0.5 tracking-widest leading-snug font-medium">
                          {advisor.title.split("&")[0]}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted italic leading-relaxed line-clamp-2">
                      &quot;{advisor.quote}&quot;
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Consultation Panel & Feedback Reports */}
            <div className="lg:col-span-7 bg-ink border border-white/10 rounded-panel p-6 md:p-8 space-y-6">
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center bg-white/5 p-1 rounded-md">
                  <span className="text-xs font-sans uppercase text-sage/70 tracking-widest block font-bold">
                    Configure Your Custom Scenario
                  </span>
                  <span className="text-xs font-sans uppercase text-gold font-semibold tracking-widest">
                    Active Session
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="consult-query-input-box"
                    rows={4}
                    value={consultQuery}
                    onChange={(e) => setConsultQuery(e.target.value)}
                    placeholder={`e.g., I am an aspiring independent developer looking to structure simple seed-funding parameters. Which core tiers and steps do I need to prevent venture dilution?`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base font-sans text-paper placeholder-sage/40 focus:outline-none focus:border-gold focus:bg-white/10 leading-relaxed resize-none"
                  />
                  <div className="absolute bottom-3 right-3 text-[11px] font-sans text-sage/50 select-none">
                    {consultQuery.length} chars
                  </div>
                </div>
              </div>

              {/* Suggestions pills */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-sans uppercase text-sage/60 tracking-widest block font-semibold">
                  Suggested Inquiries:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "How can high school athletes protect their brand trademark assets early?",
                    "What stress regulation protocols maximize focus score during college exam weeks?",
                    "What multi-generational trusts prevent estate erosion across generations?",
                  ].map((preset, pIdx) => (
                    <button
                      id={`consult-preset-btn-${pIdx}`}
                      key={pIdx}
                      onClick={() => setConsultQuery(preset)}
                      className="bg-white/5 hover:bg-white/10 text-sage/70 hover:text-paper border border-white/10 hover:border-white/20 text-xs px-3.5 py-1.5 rounded-lg transition text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit trigger */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-left text-sage/60 text-xs">
                  <Sparkles className="w-4 h-4 text-gold shrink-0 select-none" />
                  <span>Secure satellite routing active</span>
                </div>
                <button
                  id="consult-submit-query-btn"
                  onClick={handleSpeakToConsultAdvisor}
                  disabled={isConsulting || !consultQuery.trim()}
                  className="w-full sm:w-auto bg-gold hover:brightness-95 disabled:opacity-40 text-ink text-base font-sans font-extrabold uppercase tracking-widest py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isConsulting
                    ? "Analyzing Parameters..."
                    : "Ask Live Advisor"}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Advice consultation output panel */}
              <AnimatePresence>
                {(isConsulting || consultAdvice) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    id="consult-output-result"
                    className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden text-left shadow-inner"
                  >
                    <div className="absolute top-0 left-0 w-1 bg-gold h-full"></div>

                    <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                      <p className="text-xs font-sans uppercase tracking-widest text-sage/60 flex items-center gap-2">
                        <Award className="w-4 h-4 text-gold" />
                        Formal analysis by{" "}
                        {
                          ADVISOR_PERSONAS.find(
                            (a) => a.id === selectedConsultAdvisorId,
                          )?.name
                        }
                      </p>
                      <span className="text-[11px] font-sans uppercase bg-white/10 text-gold border border-gold/20 px-2 py-0.5 rounded tracking-widest">
                        REPORT ACTIVE
                      </span>
                    </div>

                    {isConsulting ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <PingDotSpinner />
                        <p className="text-base font-sans text-sage/60 animate-pulse tracking-wide">
                          {isConsultReplySlow
                            ? "STILL CONNECTING TO THE DESK..."
                            : "SECURE LINK PIPELINE CONFIGURED..."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <MarkdownMiniRenderer text={consultAdvice} size="lg" />

                        {/* Interactive dynamic matching callback anchors inside advisor response */}
                        <div className="border-t border-white/10 pt-4 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sage/60 text-sm">
                          <span className="font-sans text-sage/60">
                            Need immediate execution? Visit our syllabus tier
                            files.
                          </span>
                          <button
                            onClick={onExploreTiers}
                            className="bg-gold text-ink hover:brightness-95 font-sans text-xs uppercase font-bold py-1.5 px-4 rounded-md transition flex items-center gap-1.5 cursor-pointer tracking-widest"
                          >
                            Browse Curriculum File Tiers
                            <ArrowRight className="w-3 h-3 text-ink" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Core Philosophies */}
      <section
        id="philosophies-section"
        className="py-20 px-6 max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-line bg-paper rounded-card text-left">
            <span className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center font-serif font-light text-lg mb-4">
              I
            </span>
            <h4 className="text-lg font-serif font-light leading-[0.92] tracking-tight text-ink mb-2">
              Architectural Integrity
            </h4>
            <p className="text-muted text-sm leading-relaxed">
              We provide real tactical metrics, redline contract examples, and
              legal codes. No placeholders or shallow advice blocks.
            </p>
          </div>
          <div className="p-6 border border-line bg-paper rounded-card text-left">
            <span className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center font-serif font-light text-lg mb-4">
              II
            </span>
            <h4 className="text-lg font-serif font-light leading-[0.92] tracking-tight text-ink mb-2">
              Cognitive Science First
            </h4>
            <p className="text-muted text-sm leading-relaxed">
              Mental capacity, diagnostic evaluation scores, and nervous system
              recovery habits drive genuine career longevity.
            </p>
          </div>
          <div className="p-6 border border-line bg-paper rounded-card text-left">
            <span className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center font-serif font-light text-lg mb-4">
              III
            </span>
            <h4 className="text-lg font-serif font-light leading-[0.92] tracking-tight text-ink mb-2">
              Multi-Generation Focus
            </h4>
            <p className="text-muted text-sm leading-relaxed">
              NIL deals and admission spikes are merely entry gates. We prepare
              you to build robust, generational wealth offices.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq-section"
        className="py-24 px-6 border-t border-line bg-transparent relative z-10"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Heading and Badge */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <span className="text-gold font-sans uppercase tracking-widest text-xs font-medium block">
              Institutional FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-light leading-[0.92] tracking-tight text-ink mb-2">
              Syllabus & Partnership Intelligence
            </h2>
            <p className="text-muted text-sm font-light leading-relaxed">
              Have specific inquiries regarding TrueTrek Learning&apos;s
              curriculum modules, security compliance pathways, and school
              licensing structures? Review our comprehensive advisory dossier.
            </p>
            <div className="pt-6 border-t border-line flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-sans text-ink font-bold uppercase tracking-widest">
                  Direct Consultation Portal
                </p>
                <p className="text-xs text-muted font-light mt-0.5">
                  Need customized criteria evaluations? Utilize our live
                  advisors or our virtual concierge chat desk below.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Accordion Questions */}
          <div className="lg:col-span-7 space-y-4">
            {INDEX_FAQ_ITEMS.map((item, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div
                  key={idx}
                  id={`faq-item-${idx}`}
                  className="bg-paper border border-line rounded-panel overflow-hidden transition-all duration-300 hover:border-pine/30"
                >
                  <button
                    id={`faq-trigger-${idx}`}
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="w-full py-5 px-6 flex items-center justify-between text-left gap-4 transition-colors hover:text-pine"
                  >
                    <span className="font-serif text-sm md:text-base font-light tracking-tight text-ink">
                      {item.question}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-full bg-porcelain border border-line flex items-center justify-center shrink-0 text-muted transition-transform duration-300 ${isOpen ? "rotate-180 text-gold border-gold/20 bg-gold/5" : ""}`}
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
                        <div className="pb-6 px-6 font-sans text-sm md:text-sm text-muted leading-relaxed border-t border-line pt-4 bg-porcelain/40 select-text">
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
              className="w-[320px] sm:w-[380px] md:w-[410px] h-[520px] bg-ink border border-white/10 shadow-2xl rounded-panel flex flex-col justify-between overflow-hidden relative mb-4"
            >
              {/* Header block with selected advisor */}
              <div className="bg-black/20 border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-extrabold text-paper font-serif uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
                      Academy AI Desk
                    </p>
                    <p className="text-[10px] font-sans uppercase text-sage/50 tracking-wide truncate">
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
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-sage/60 hover:text-paper hover:bg-white/10 cursor-pointer transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="close-concierge-chat-btn"
                    onClick={() => setIsChatOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-sage/60 hover:text-paper hover:bg-white/10 cursor-pointer transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Advisor Tab strip selector */}
              <div className="bg-white/5 border-b border-white/10 p-2 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none items-center justify-start">
                {ADVISOR_PERSONAS.map((adv) => (
                  <button
                    id={`chat-strip-btn-${adv.id}`}
                    key={adv.id}
                    onClick={() => setSelectedChatAdvisorId(adv.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-sans uppercase tracking-widest shrink-0 transition flex items-center gap-1 cursor-pointer ${
                      selectedChatAdvisorId === adv.id
                        ? "bg-gold/15 border border-gold/20 text-gold"
                        : "bg-black/20 border border-white/10 text-sage/60 hover:text-paper"
                    }`}
                  >
                    <img
                      src={adv.avatar}
                      alt={adv.name}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span>{adv.name.split(" ")[1] || adv.name}</span>
                  </button>
                ))}
              </div>

              {/* Message scroll area pane */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10 select-text">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "advisor" && (
                      <img
                        src={
                          ADVISOR_PERSONAS.find(
                            (a) => a.id === selectedChatAdvisorId,
                          )?.avatar
                        }
                        alt="Advisor"
                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10 bg-ink mt-1"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 flex flex-col gap-1 shadow-sm text-left ${
                        msg.sender === "user"
                          ? "bg-gold text-ink rounded-tr-none text-sm font-sans font-semibold leading-relaxed"
                          : "bg-white/5 border border-white/10 text-paper rounded-tl-none font-sans text-sm leading-relaxed"
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
                    <img
                      src={
                        ADVISOR_PERSONAS.find(
                          (a) => a.id === selectedChatAdvisorId,
                        )?.avatar
                      }
                      alt="Advisor"
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10 bg-ink animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                    <div className="bg-white/5 text-sage/70 text-sm py-2 px-3.5 rounded-xl border border-white/10 flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold"></span>
                      </span>
                      <p className="font-sans uppercase tracking-widest text-[11px] animate-pulse">
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
              <div className="p-3 bg-black/20 border-t border-white/10 shrink-0 space-y-2.5 text-left">
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
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm font-sans text-paper placeholder-sage/40 focus:outline-none focus:border-gold focus:bg-white/10"
                  />
                  <button
                    id="floating-chat-send-btn"
                    onClick={() => handleSendChatMessage()}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="w-9 h-9 bg-gold hover:brightness-95 disabled:opacity-40 text-ink rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer"
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
          className={`w-14 h-14 bg-gradient-to-tr from-pine to-moss text-paper rounded-full flex items-center justify-center cursor-pointer shadow-2xl hover:scale-105 active:scale-95 border-2 border-ink transition-transform duration-200 select-none relative group ${
            isChatOpen ? "bg-ink from-ink to-ink border-white/10" : ""
          }`}
        >
          {isChatOpen ? (
            <X className="w-6 h-6 text-sage/70" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 bg-gold text-ink font-bold text-[9.5px] px-1.5 py-0.5 rounded-full border border-ink uppercase tracking-widest animate-bounce">
                live
              </div>
            </>
          )}

          {/* on hover tooltip detail */}
          <span className="absolute right-16 bg-ink/95 text-sage/70 border border-white/10 px-3.5 py-2 rounded-xl text-[11.5px] uppercase tracking-widest font-sans font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl select-none">
            Live Academy Concierge
          </span>
        </button>
      </div>
    </div>
  );
}
