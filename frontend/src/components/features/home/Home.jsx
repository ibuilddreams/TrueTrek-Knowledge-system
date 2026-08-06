"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  ArrowRight,
  Award,
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
import SectionHeading from "@/components/ui/SectionHeading";
import PingDotSpinner from "@/components/ui/PingDotSpinner";
import PresetPromptPills from "@/components/ui/PresetPromptPills";

export default function Home() {
  const router = useRouter();
  const onExploreTiers = () => router.push(ROUTES.CURRICULUM);
  const onNavigateToPortal = () => router.push(ROUTES.STUDENT_PORTAL);
  const [selectedAuditProfile, setSelectedAuditProfile] = useState("athlete");
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Inline Interactive Consultation Board states
  const [selectedConsultAdvisorId, setSelectedConsultAdvisorId] =
    useState("legal");
  const [consultQuery, setConsultQuery] = useState("");
  const [consultAdvice, setConsultAdvice] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);

  // Floating chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatAdvisorId, setSelectedChatAdvisorId] =
    useState("recruiter");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
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

  const auditRecommendations = {
    athlete: {
      title: "D1 Collegiate / Pro Athlete Track",
      targetTiers:
        "Tier 1 (Youth Athletics), Tier 2 (Recruiting Window), Tier 6 (Elite Pros & NIL)",
      objective:
        "Secure high-impact athletic scholarship offers and structure durable NIL personal brand capitalization.",
      impactScore: "98.4% Collegiate Selection Rate",
      roadmap: [
        "Complete high school recruitment video architecture auditing.",
        "Run deep social media footprint compliance diagnostic.",
        "Adopt daily Sleep Stabilization & Cortisol reduction drills.",
        "Establish single-member LLC for tax-sheltered brand endorsements.",
      ],
      actionLabel: "Assess NIL Feasibility",
    },
    scholar: {
      title: "Elite Scholarship & Academic Spike Track",
      targetTiers:
        "Tier 3 (Early Academic Spike), Tier 4 (Common App Mastery), Tier 8 (Cognitive Bias)",
      objective:
        "Master competitive academic portfolios, write elite college personal statements, and structure custom spikes.",
      impactScore: "4.8x Ivy League Admission Multiplier",
      roadmap: [
        "Outline your personal Extracurricular Spike Profile.",
        "Audit common application essays with Ivy scout feedback.",
        "Train on system cognitive diagnostics & executive bias matrices.",
        "Formulate elite master recommendation solicitations.",
      ],
      actionLabel: "Audit Academic Portfolio",
    },
    founder: {
      title: "Venture & Professional Pathfinder",
      targetTiers:
        "Tier 5 (Pathfinders), Tier 7 (Startup Foundations), Tier 8 (Executive Mastery)",
      objective:
        "Translate raw craft into scalable technological projects, secure seed financing, and build robust capital models.",
      impactScore: "$145M+ Aggregate Portfolio Value",
      roadmap: [
        "Draft a compliant simple pre-seed Simple Agreement for Future Equity (SAFE).",
        "Deploy dynamic MVP prototyping and alpha release testing scheme.",
        "Audit pre-revenue capitalization boards to screen out predatory investors.",
        "Implement structural crisis-strategy Response Protocols.",
      ],
      actionLabel: "Simulate Venture Cap-Table",
    },
    parent: {
      title: "Parent Coach & Stewardship Track",
      targetTiers:
        "Tier 1b (Parent Playbook), Tier 9 (Legacy Office Foundations)",
      objective:
        "Navigate the high-pressure scouting maze safely while maintaining values-based family stewardship structures.",
      impactScore: "100% Parent Advisory Trust Factor",
      roadmap: [
        "Analyze regional club team ROI metrics and travel fee structures.",
        "Review early pre-contract agency representation traps.",
        "Establish multi-generational values-driven trust frameworks.",
        "Coordinate holistic cognitive-behavioral support structures.",
      ],
      actionLabel: "Review Parenting Playbook",
    },
  };

  return (
    <div
      id="home-container"
      className="relative overflow-hidden w-full bg-[#1c1917] text-white"
    >
      {/* Decorative ambient background */}
      <div
        id="ambient-sphere-1"
        className="absolute top-10 left-10 w-96 h-96 rounded-full bg-amber-600/15 blur-[120px] animate-pulse"
      ></div>
      <div
        id="ambient-sphere-2"
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-stone-500/15 blur-[120px] animate-pulse"
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
          className="inline-flex items-center gap-2 bg-stone-800/80 border border-stone-700/60 px-4 py-2 rounded-full text-stone-300 text-xs font-mono mb-8 tracking-wide uppercase"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          Incubator for Elite Pathfinders & Scholars
        </motion.div>

        <motion.h1
          id="hero-headline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif text-white tracking-tight leading-[1.08] max-w-4xl font-semibold mb-6"
        >
          Build Your{" "}
          <span className="italic text-stone-100 font-normal">Legacy</span>.
        </motion.h1>

        <motion.p
          id="hero-subline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-stone-300 text-lg md:text-xl font-sans max-w-2xl font-light mb-10 leading-relaxed"
        >
          The premier 11-tier educational roadmap and strategic incubator
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
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-semibold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-amber-950/40 text-sm tracking-wide"
          >
            Explore 11-Tier Curriculum
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="btn-portal-access"
            onClick={onNavigateToPortal}
            className="w-full sm:w-auto bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-850 px-8 py-3.5 rounded-full text-sm font-semibold transition duration-300 tracking-wide"
          >
            Enter Student Portal
          </button>
        </motion.div>

        {/* Global Impact Dashboard Section */}
        <div
          id="stats-dashboard"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mt-24 border-t border-stone-800/80 pt-16"
        >
          <div id="stat-students" className="text-center md:text-left">
            <p className="text-4xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-amber-500 tracking-tight">
              12,400+
            </p>
            <p className="text-stone-400 text-xs font-mono uppercase mt-2 tracking-wider">
              Active Global Pathfinders
            </p>
          </div>
          <div
            id="stat-admissions"
            className="text-center md:text-left border-y md:border-y-0 md:border-x border-stone-800/80 py-6 md:py-0 md:px-8"
          >
            <p className="text-4xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-white tracking-tight">
              98.4%
            </p>
            <p className="text-stone-400 text-xs font-mono uppercase mt-2 tracking-wider">
              Collegiate Selection Rate
            </p>
          </div>
          <div id="stat-capital" className="text-center md:text-right">
            <p className="text-4xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-stone-200 tracking-tight">
              $145M+
            </p>
            <p className="text-stone-400 text-xs font-mono uppercase mt-2 tracking-wider">
              Aggregate Venture Valuation
            </p>
          </div>
        </div>
      </div>

      {/* Cinematic Walkthrough Broadcast Section */}
      <section
        id="cinematic-walkthrough-section"
        className="bg-[#141211] border-t border-stone-800/85 py-20 px-6 relative z-10"
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
        className="bg-[#141211] border-t border-stone-800/60 py-20 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            className="mb-16"
            eyebrow="Custom Diagnostics"
            heading="Determine Your TrueTrek Learning Pathway"
            subtitle="Select your high-potential profile archetype below and see your recommended developmental curriculum, custom metrics, and action blueprint."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Selection Columns */}
            <div id="audit-selector-group" className="lg:col-span-4 space-y-3">
              {[
                {
                  id: "athlete",
                  label: "Pro & Collegiate Athlete",
                  accent: "D1 Prospects",
                },
                {
                  id: "scholar",
                  label: "Scholarly Academic Elite",
                  accent: "Ivy League Candidates",
                },
                {
                  id: "founder",
                  label: "Venture Founder / Craftsman",
                  accent: "Scale Builders",
                },
                {
                  id: "parent",
                  label: "Parent Advisor / Steward",
                  accent: "Family Wealth Stewards",
                },
              ].map((item) => (
                <button
                  id={`audit-profile-btn-${item.id}`}
                  key={item.id}
                  onClick={() => setSelectedAuditProfile(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex flex-col gap-1 ${
                    selectedAuditProfile === item.id
                      ? "bg-amber-600/10 border-amber-500/80 text-white shadow-md"
                      : "bg-stone-900/60 border-stone-800/40 text-stone-400 hover:bg-stone-900 hover:border-stone-800"
                  }`}
                >
                  <span className="font-medium text-sm text-stone-200">
                    {item.label}
                  </span>
                  <span
                    className={`text-xs font-mono uppercase tracking-wider ${
                      selectedAuditProfile === item.id
                        ? "text-amber-500"
                        : "text-stone-500"
                    }`}
                  >
                    {item.accent}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Audit Recommendation Container */}
            <div
              id="audit-results-container"
              className="lg:col-span-8 bg-stone-900 border border-stone-800/80 rounded-2xl p-6 md:p-8 relative min-h-[380px] flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4 mb-6">
                  <div>
                    <span className="text-amber-500 text-xs font-mono tracking-widest uppercase block mb-1">
                      RECOMMENDED SUB-TRACK
                    </span>
                    <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-white">
                      {auditRecommendations[selectedAuditProfile].title}
                    </h3>
                  </div>
                  <div className="bg-amber-600/15 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-500 font-mono text-xs font-semibold">
                    {auditRecommendations[selectedAuditProfile].impactScore}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-stone-300 text-sm leading-relaxed mb-6">
                    <span className="font-semibold text-stone-200">
                      Objective Profile Target:
                    </span>{" "}
                    {auditRecommendations[selectedAuditProfile].objective}
                  </p>
                  <div className="bg-stone-950 p-3 rounded-lg border border-stone-850 mb-6 flex gap-2.5 items-center">
                    <Target className="text-amber-500 w-5 h-5 flex-shrink-0" />
                    <p className="text-xs text-stone-300">
                      <span className="font-mono font-medium text-amber-500 block uppercase tracking-wider text-[10px]">
                        Primary Core Curriculum Licensing
                      </span>
                      {auditRecommendations[selectedAuditProfile].targetTiers}
                    </p>
                  </div>

                  <p className="text-xs font-mono uppercase text-stone-400 tracking-wider mb-3">
                    Incubator Strategic Checklist
                  </p>
                  <ul className="space-y-2.5">
                    {auditRecommendations[selectedAuditProfile].roadmap.map(
                      (step, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2.5 text-stone-300 text-xs leading-relaxed"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>

              <div className="border-t border-stone-800 text-right pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-stone-400 text-xs font-light text-left">
                  Licensed across 40+ educational administrations. Verified
                  athletic and academic compliance.
                </span>
                <button
                  id="btn-recommendation-cta"
                  onClick={onExploreTiers}
                  className="bg-white hover:bg-stone-50 text-stone-950 text-xs font-semibold px-5 py-2.5 rounded-full flex items-center gap-1.5 transition duration-350 shrink-0 shadow-sm"
                >
                  {auditRecommendations[selectedAuditProfile].actionLabel}
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inline Academy live advisor interactive board */}
      <section
        id="live-advisors-consultation-section"
        className="bg-[#141211] border-t border-stone-800/60 py-20 px-6 relative overflow-hidden z-10"
      >
        <div
          id="inline-consult-glow"
          className="absolute -top-12 -left-12 w-80 h-80 rounded-full bg-amber-600/5 blur-[100px] pointer-events-none"
        ></div>
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <SectionHeading
            eyebrow="Live Consulting Board"
            heading="Connect With the Senior Advisory Council"
            headingClassName="text-3xl md:text-4xl font-serif font-black tracking-tight text-white"
            subtitle="Formulate a custom strategic curriculum roadmap in real-time. Describe your targets and get advice back from our leading advisors immediately."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Advisor Avatars selector */}
            <div className="lg:col-span-5 space-y-4">
              <label className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block text-left">
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
                    className={`p-4 rounded-2xl text-left border transition-all duration-300 flex flex-col gap-3 cursor-pointer ${
                      selectedConsultAdvisorId === advisor.id
                        ? "bg-amber-600/10 border-amber-500 text-white shadow-xl shadow-amber-950/10"
                        : "bg-stone-904 border-stone-800/80 text-stone-400 hover:bg-stone-900 hover:border-stone-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={advisor.avatar}
                        alt={advisor.name}
                        className="w-11 h-11 rounded-full border border-stone-700 object-cover bg-stone-950 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-stone-100 truncate">
                          {advisor.name}
                        </p>
                        <p className="text-[9px] font-mono text-stone-500 mt-0.5 uppercase tracking-wider truncate">
                          {advisor.title.split("&")[0]}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 italic leading-relaxed line-clamp-2">
                      &quot;{advisor.quote}&quot;
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Consultation Panel & Feedback Reports */}
            <div className="lg:col-span-7 bg-stone-900/40 border border-stone-800/80 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center bg-[#141211]/30 p-1 rounded-md">
                  <span className="text-[10px] font-mono text-stone-300 uppercase tracking-wider block font-bold">
                    Configure Your Custom Scenario
                  </span>
                  <span className="text-[10px] font-mono text-amber-500 uppercase font-semibold">
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
                    className="w-full bg-stone-950/70 border border-stone-800 rounded-xl p-4 text-xs font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:bg-stone-950 leading-relaxed resize-none"
                  />
                  <div className="absolute bottom-3 right-3 text-[9px] font-mono text-stone-500 select-none">
                    {consultQuery.length} chars
                  </div>
                </div>
              </div>

              {/* Suggestions pills */}
              <div className="space-y-2 text-left">
                <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wide block font-semibold">
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
                      className="bg-stone-950/90 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800/80 hover:border-stone-700 text-[10px] px-3.5 py-1.5 rounded-lg transition text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit trigger */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-stone-800/80">
                <div className="flex items-center gap-2 text-left text-stone-500 text-[10.5px]">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 select-none" />
                  <span>Secure satellite routing active</span>
                </div>
                <button
                  id="consult-submit-query-btn"
                  onClick={handleSpeakToConsultAdvisor}
                  disabled={isConsulting || !consultQuery.trim()}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 text-xs font-mono font-extrabold uppercase tracking-widest py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-950/20"
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
                    className="bg-stone-950 border border-stone-800/80 rounded-xl p-5 relative overflow-hidden text-left shadow-inner"
                  >
                    <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full"></div>

                    <div className="flex justify-between items-center border-b border-stone-850 pb-3 mb-4">
                      <p className="text-[10px] font-mono uppercase tracking-wide text-stone-400 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        Formal analysis by{" "}
                        {
                          ADVISOR_PERSONAS.find(
                            (a) => a.id === selectedConsultAdvisorId,
                          )?.name
                        }
                      </p>
                      <span className="text-[9px] font-mono bg-stone-900 text-amber-500 border border-amber-500/10 px-2 py-0.5 rounded uppercase">
                        REPORT ACTIVE
                      </span>
                    </div>

                    {isConsulting ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <PingDotSpinner />
                        <p className="text-xs font-mono text-stone-500 animate-pulse tracking-wider">
                          SECURE LINK PIPELINE CONFIGURED...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <MarkdownMiniRenderer text={consultAdvice} />

                        {/* Interactive dynamic matching callback anchors inside advisor response */}
                        <div className="border-t border-stone-850 pt-4 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-450 text-[11px]">
                          <span className="font-mono text-stone-500">
                            Need immediate execution? Visit our syllabus tier
                            files.
                          </span>
                          <button
                            onClick={onExploreTiers}
                            className="bg-white/95 text-stone-950 hover:bg-stone-100 font-mono text-[10px] uppercase font-bold py-1.5 px-4 rounded-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            Browse Curriculum File Tiers
                            <ArrowRight className="w-3 h-3 text-amber-600" />
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
          <div className="p-6 border border-stone-800 bg-[#1c1917] rounded-xl text-left">
            <span className="w-10 h-10 rounded-lg bg-amber-600/10 text-amber-500 flex items-center justify-center font-[family-name:var(--font-display)] font-black text-lg mb-4">
              I
            </span>
            <h4 className="text-lg font-serif font-semibold tracking-tight text-white mb-2">
              Architectural Integrity
            </h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              We provide real tactical metrics, redline contract examples, and
              legal codes. No placeholders or shallow advice blocks.
            </p>
          </div>
          <div className="p-6 border border-stone-800 bg-[#1c1917] rounded-xl text-left">
            <span className="w-10 h-10 rounded-lg bg-amber-600/10 text-amber-500 flex items-center justify-center font-[family-name:var(--font-display)] font-black text-lg mb-4">
              II
            </span>
            <h4 className="text-lg font-serif font-semibold tracking-tight text-white mb-2">
              Cognitive Science First
            </h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              Mental capacity, diagnostic evaluation scores, and nervous system
              recovery habits drive genuine career longevity.
            </p>
          </div>
          <div className="p-6 border border-stone-800 bg-[#1c1917] rounded-xl text-left">
            <span className="w-10 h-10 rounded-lg bg-amber-600/10 text-amber-500 flex items-center justify-center font-[family-name:var(--font-display)] font-black text-lg mb-4">
              III
            </span>
            <h4 className="text-lg font-serif font-semibold tracking-tight text-white mb-2">
              Multi-Generation Focus
            </h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              NIL deals and admission spikes are merely entry gates. We prepare
              you to build robust, generational wealth offices.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq-section"
        className="py-24 px-6 border-t border-stone-800/60 bg-[#141211]/30 relative z-10"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Heading and Badge */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <span className="text-amber-500 text-xs font-mono uppercase tracking-widest block">
              Institutional FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-white mb-2">
              Syllabus & Partnership Intelligence
            </h2>
            <p className="text-stone-400 text-sm font-light leading-relaxed">
              Have specific inquiries regarding TrueTrek Learning&apos;s
              curriculum modules, security compliance pathways, and school
              licensing structures? Review our comprehensive advisory dossier.
            </p>
            <div className="pt-6 border-t border-stone-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-500 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-mono text-stone-300 font-bold uppercase tracking-wider">
                  Direct Consultation Portal
                </p>
                <p className="text-[11px] text-stone-500 font-light mt-0.5">
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
                  className="bg-stone-900/40 border border-stone-800/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-stone-700"
                >
                  <button
                    id={`faq-trigger-${idx}`}
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="w-full py-5 px-6 flex items-center justify-between text-left gap-4 transition-colors hover:text-white"
                  >
                    <span className="font-serif text-sm md:text-base font-semibold tracking-tight text-stone-200">
                      {item.question}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0 text-stone-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-amber-500 border-amber-500/20 bg-amber-600/5" : ""}`}
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
                        <div className="pb-6 px-6 font-sans text-xs md:text-sm text-stone-400 leading-relaxed border-t border-stone-850/65 pt-4 bg-[#141211]/25 select-text">
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
              className="w-[320px] sm:w-[380px] md:w-[410px] h-[520px] bg-stone-950 border border-stone-850 shadow-2xl rounded-2xl flex flex-col justify-between overflow-hidden relative mb-4"
            >
              {/* Header block with selected advisor */}
              <div className="bg-[#141211] border-b border-stone-850 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-extrabold text-white font-serif uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Academy AI Desk
                    </p>
                    <p className="text-[9px] font-mono text-stone-500 uppercase tracking-wide truncate">
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
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="close-concierge-chat-btn"
                    onClick={() => setIsChatOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Advisor Tab strip selector */}
              <div className="bg-stone-900 border-b border-stone-850 p-2 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none items-center justify-start">
                {ADVISOR_PERSONAS.map((adv) => (
                  <button
                    id={`chat-strip-btn-${adv.id}`}
                    key={adv.id}
                    onClick={() => setSelectedChatAdvisorId(adv.id)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-mono uppercase tracking-wider shrink-0 transition flex items-center gap-1 cursor-pointer ${
                      selectedChatAdvisorId === adv.id
                        ? "bg-amber-600/15 border border-amber-500/20 text-amber-500"
                        : "bg-stone-950/40 border border-stone-850 text-stone-400 hover:text-stone-200"
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-950/30 select-text">
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
                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-stone-850 bg-stone-950 mt-1"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 flex flex-col gap-1 shadow-sm text-left ${
                        msg.sender === "user"
                          ? "bg-amber-600 text-stone-950 rounded-tr-none text-xs font-sans font-semibold leading-relaxed"
                          : "bg-stone-900 border border-stone-850 text-stone-200 rounded-tl-none font-sans text-xs leading-relaxed"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <p className="whitespace-pre-line leading-relaxed">
                          {msg.text}
                        </p>
                      ) : (
                        <MarkdownMiniRenderer text={msg.text} />
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
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-stone-850 bg-stone-950 animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                    <div className="bg-stone-900 text-stone-400 text-xs py-2 px-3.5 rounded-xl border border-stone-850 flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600"></span>
                      </span>
                      <p className="font-mono text-[10px] animate-pulse">
                        FORMULATING RECOMMENDATIONS...
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat footer layout */}
              <div className="p-3 bg-[#141211] border-t border-stone-850 shrink-0 space-y-2.5 text-left">
                {/* suggested pills shortcut */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5 items-center justify-start">
                  {selectedChatAdvisorId === "legal" && (
                    <PresetPromptPills
                      idPrefix="chat-preset-legal"
                      prompts={[
                        "What NIL traps exist in contracts?",
                        "How to file single-member LLC?",
                        "Protecting my brand assets",
                      ]}
                      onSelect={handleSendChatMessage}
                    />
                  )}

                  {selectedChatAdvisorId === "recruiter" && (
                    <PresetPromptPills
                      idPrefix="chat-preset-recruiter"
                      prompts={[
                        "What do D1 scouts look for?",
                        "Auditing highlight videos",
                        "Coach communications syntax",
                      ]}
                      onSelect={handleSendChatMessage}
                    />
                  )}

                  {selectedChatAdvisorId === "psychology" && (
                    <PresetPromptPills
                      idPrefix="chat-preset-psych"
                      prompts={[
                        "Daily Circadian checklist",
                        "How sleep impacts focus?",
                        "Lower exam stress drills",
                      ]}
                      onSelect={handleSendChatMessage}
                    />
                  )}

                  {selectedChatAdvisorId === "legacy" && (
                    <PresetPromptPills
                      idPrefix="chat-preset-legacy"
                      prompts={[
                        "How family offices build trusts?",
                        "Axiological family charters",
                        "Stewardship of venture reserves",
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
                    className="flex-1 bg-stone-900 border border-stone-800 rounded-lg py-2 px-3 text-xs font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:bg-stone-950"
                  />
                  <button
                    id="floating-chat-send-btn"
                    onClick={() => handleSendChatMessage()}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="w-9 h-9 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer"
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
          className={`w-14 h-14 bg-gradient-to-tr from-amber-600 to-amber-800 text-white rounded-full flex items-center justify-center cursor-pointer shadow-2xl shadow-amber-950/50 hover:scale-105 active:scale-95 border-2 border-stone-900 transition-transform duration-200 select-none relative group ${
            isChatOpen
              ? "bg-stone-900 from-stone-900 to-stone-950 border-stone-800"
              : ""
          }`}
        >
          {isChatOpen ? (
            <X className="w-6 h-6 text-stone-300" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 font-bold text-[8.5px] px-1.5 py-0.5 rounded-full border border-stone-950 uppercase tracking-widest animate-bounce">
                live
              </div>
            </>
          )}

          {/* on hover tooltip detail */}
          <span className="absolute right-16 bg-[#141211]/95 text-stone-300 border border-stone-850 px-3.5 py-2 rounded-xl text-[10.5px] uppercase tracking-widest font-mono font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl select-none">
            Live Academy Concierge
          </span>
        </button>
      </div>
    </div>
  );
}
