"use client";

import { useState } from "react";
import { Brain, Lightbulb, Package, Plus, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ADVISOR_PERSONAS } from "@/data/curriculum";
import { requestAdvisorAdvice } from "@/services/advisorService";
import MarkdownMiniRenderer from "@/components/ui/MarkdownMiniRenderer";
import PingDotSpinner from "@/components/ui/PingDotSpinner";

// Demo catalog used only to ground the advisor's recommendations — this
// suite is currently disabled (not rendered by MerchantStore) since the
// store now sells real courses, not this hardcoded merchandise. Kept intact
// so the feature can be rewired to real courses and re-enabled later.
const ADVISOR_DEMO_CATALOG = [
  {
    id: "prod-syllabus-license",
    name: "The 11-Tier Legacy Syllabus (Lifetime Licensing)",
    price: 4500,
    image:
      "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "prod-safe-templates",
    name: "Pre-Seed Venture SAFE Templates Pack",
    price: 450,
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "prod-nil-handbook",
    name: "NIL Contract Legal Redline Handbook",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "prod-jersey",
    name: "TrueTrek Learning Branded Athletic Jersey",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "prod-cns-mask",
    name: "Circadian Stabilization Light-Block Mask",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1511295742364-92793113702c?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "prod-workbook",
    name: "Executive Cognitive Strategy Workbook",
    price: 65,
    image:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600",
  },
];

export default function StoreAdvisorSuite({ onAcquireAsset = () => {} }) {
  const [selectedAIAdvisorId, setSelectedAIAdvisorId] = useState("legal");
  const [userQuery, setUserQuery] = useState("");
  const [advisorFeedback, setAdvisorFeedback] = useState("");
  const [isAIRecommending, setIsAIRecommending] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState([]);

  const handleConsultAdvisor = async () => {
    if (!userQuery.trim()) return;
    setIsAIRecommending(true);
    setAdvisorFeedback("");
    setMatchedProducts([]);

    const advisor =
      ADVISOR_PERSONAS.find((a) => a.id === selectedAIAdvisorId) || ADVISOR_PERSONAS[0];

    const customizedSystemPrompt = `${advisor.systemPrompt}

You are serving as the Senior Advisory Concierge for the TrueTrek Learning LLC Strategic Store.
Analyze the student or organization's goals, and guide them with specific tactical advice.
In your advice, you MUST recommend one or premium items from our official depository inventory below.

Official Depository Catalog:
- "The 11-Tier Legacy Syllabus (Lifetime Licensing)" (Price: $4,500) - For institution-wide academic frameworks, licensing compliance, and teacher-ready print materials. Best for schools, recruiters, or booster networks. (Product ID: prod-syllabus-license)
- "Pre-Seed Venture SAFE Templates Pack" (Price: $450) - Pre-vetted simple agreements for future equity. High-yield terms to address valuation targets and block early predatory dilution. Best for founders or aspiring independent software builders. (Product ID: prod-safe-templates)
- "NIL Contract Legal Redline Handbook" (Price: $299) - Essential manual of real-world licensing clauses, compliance forms, uniform guides, and trademark safeguards. Best for high school recruited or collegiate varsity athletes. (Product ID: prod-nil-handbook)
- "TrueTrek Learning Branded Athletic Jersey" (Price: $120) - Strategic light-weight performance mesh with elite TTL monogram styling. Best for active field athletes or physical specialists. (Product ID: prod-jersey)
- "Circadian Stabilization Light-Block Mask" (Price: $45) - Absolute blackout contours with micro-aerated memory foam to maximize REM sleep and metabolic restoration. Best for high-performance competitors or hard-working executives. (Product ID: prod-cns-mask)
- "Executive Cognitive Strategy Workbook" (Price: $65) - Linen-hardbound gold-debossed journal for charting cap-table distributions, decision matrices, and daily logging. Best for leaders, venture directors, or active scholars. (Product ID: prod-workbook)

Instructions:
- Keep your tone completely in-character as ${advisor.name} (${advisor.title}).
- Review the user's specific query and deliver structured, high-IQ feedback.
- Explicitly recommend at least one and up to three specific matching products list from above. Write out their exact names in your explanation so the customer recognizes them.
- Explain clearly and in bullet points why those products perfectly match their current developmental track.
- Keep your output beautifully formatted in professional Markdown with solid headers. Avoid filler text.`;

    try {
      const data = await requestAdvisorAdvice({
        scenario: `User Specific Goals & Query:\n"${userQuery}"\n\nAdvisor, please evaluate my case and advise which items from our Strategic Store inventory I should acquire.`,
        systemPrompt: customizedSystemPrompt,
        advisorName: advisor.name,
      });
      if (data.advice) {
        setAdvisorFeedback(data.advice);

        const detected = ADVISOR_DEMO_CATALOG.filter((p) => {
          const lowerText = data.advice.toLowerCase();
          const lowerId = p.id.toLowerCase();
          const lowerName = p.name.toLowerCase();

          if (lowerText.includes(lowerId)) return true;
          if (lowerText.includes(lowerName)) return true;

          if (
            p.id === "prod-syllabus-license" &&
            (lowerText.includes("syllabus") ||
              lowerText.includes("licensing") ||
              lowerText.includes("11-tier"))
          )
            return true;
          if (
            p.id === "prod-safe-templates" &&
            (lowerText.includes("safe") ||
              lowerText.includes("templates") ||
              lowerText.includes("dilution"))
          )
            return true;
          if (
            p.id === "prod-nil-handbook" &&
            (lowerText.includes("nil") ||
              lowerText.includes("handbook") ||
              lowerText.includes("redline"))
          )
            return true;
          if (
            p.id === "prod-jersey" &&
            (lowerText.includes("jersey") ||
              lowerText.includes("athletic apparel") ||
              lowerText.includes("LE monogram"))
          )
            return true;
          if (
            p.id === "prod-cns-mask" &&
            (lowerText.includes("mask") ||
              lowerText.includes("circadian") ||
              lowerText.includes("light-block") ||
              lowerText.includes("sleep"))
          )
            return true;
          if (
            p.id === "prod-workbook" &&
            (lowerText.includes("workbook") ||
              lowerText.includes("journal") ||
              lowerText.includes("strategy book"))
          )
            return true;

          return false;
        });

        setMatchedProducts(detected);
      } else if (data.error) {
        setAdvisorFeedback(
          `### Operational Outage\n\nFailed to get strategic recommendations from ${advisor.name}.\n\nDetails: *${data.error}*`,
        );
      }
    } catch (err) {
      console.error("Advisor recommender fetch exception:", err);
      setAdvisorFeedback(
        `### Council Offline\n\nFailed to route secure recommendations dispatch. Reason: "${err.message || err}".`,
      );
    } finally {
      setIsAIRecommending(false);
    }
  };

  return (
    <section
      id="procurement-advisor-suite"
      className="mb-14 bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 relative overflow-hidden text-stone-205"
    >
      <div
        id="advisor-suite-glow"
        className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-amber-600/10 blur-[110px] pointer-events-none"
      ></div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="flex items-start gap-4 border-b border-stone-800 pb-5">
          <div className="w-12 h-12 bg-amber-600/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shrink-0">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1 text-left">
            <span className="text-amber-500 font-mono text-[9px] font-bold tracking-widest uppercase block">
              Intellectual Telemetry Analysis
            </span>
            <h3 className="text-xl md:text-2xl font-serif font-black tracking-tight text-white">
              Advisory Procurement Suite
            </h3>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              Connect your personal scenarios directly with council advisors to formulate
              targeted pathway acquisitions. Get professional feedback on compliance rules and
              purchase-ready materials.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block text-left">
            Select Your Strategic Advisor
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ADVISOR_PERSONAS.map((advisor) => (
              <button
                id={`store-advisor-btn-${advisor.id}`}
                key={advisor.id}
                onClick={() => {
                  setSelectedAIAdvisorId(advisor.id);
                  setAdvisorFeedback("");
                  setMatchedProducts([]);
                }}
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                  selectedAIAdvisorId === advisor.id
                    ? "bg-amber-600/10 border-amber-500 text-white shadow-lg shadow-amber-970/10"
                    : "bg-stone-850/40 border-stone-800 text-stone-400 hover:bg-stone-800 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <img
                    src={advisor.avatar}
                    alt={advisor.name}
                    className="w-10 h-10 rounded-full border object-cover border-stone-700 bg-stone-900 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-100 truncate">{advisor.name}</p>
                    <p className="text-[9px] font-mono text-stone-450 truncate uppercase mt-0.5">
                      {advisor.title.split("&")[0]}
                    </p>
                  </div>
                </div>
                <p className="text-[9.5px] text-stone-400 font-light line-clamp-2 italic leading-normal">
                  &quot;{advisor.quote}&quot;
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-stone-950 rounded-2xl p-6 border border-stone-850 space-y-4">
          <div className="text-left">
            <label className="text-[10px] font-mono text-[#faece1] uppercase tracking-widest block mb-2 font-bold">
              Configure Your Growth Goals / Scenario
            </label>
            <div className="relative">
              <textarea
                id="store-advisor-query-input"
                rows={3}
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="e.g., I am a high school varsity athlete navigating college recruitment and NIL options. I want to build a compliant media presence and avoid contract traps. What do I need?"
                className="w-full bg-stone-900/60 border border-stone-800 rounded-xl p-4 pr-12 text-xs font-mono text-stone-100 placeholder-stone-550 focus:outline-none focus:border-amber-600 focus:bg-stone-900 leading-relaxed"
              />
              <div className="absolute bottom-3.5 right-3.5 text-stone-500 text-[10px] font-mono select-none">
                {userQuery.length} chars
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <p className="text-[9px] font-mono text-stone-550 uppercase tracking-wider font-semibold">
              Quick Inquiries
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "I am establishing a collegiate-backed project and need institutional licensing materials.",
                "I am launching a tech seed venture and want template SAFE legal covenants.",
                "High stress and morning training is depleting my REM sleep recovery cycles.",
              ].map((preset, idx) => (
                <button
                  id={`preset-store-query-${idx}`}
                  key={idx}
                  onClick={() => setUserQuery(preset)}
                  className="bg-[#141211] hover:bg-stone-800 border border-stone-800 text-stone-300 text-[10px] px-3.5 py-1.5 rounded-lg transition text-left cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <p className="text-[10px] font-mono text-stone-400 uppercase flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Advisor recommendations appear below instantly
            </p>
            <button
              id="query-store-advisor-btn"
              onClick={handleConsultAdvisor}
              disabled={isAIRecommending || !userQuery.trim()}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 text-xs font-mono font-extrabold uppercase tracking-widest py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-amber-970/15 cursor-pointer"
            >
              {isAIRecommending ? "Compiling Parameters..." : "Ask AI Advisor"}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {(isAIRecommending || advisorFeedback) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              id="store-advisor-result-panel"
              className="bg-[#141211] border border-stone-800 rounded-2xl p-6 relative overflow-hidden space-y-6 shadow-inner text-left"
            >
              <div className="absolute top-0 left-0 w-1 bg-amber-600 h-full"></div>

              <div className="flex justify-between items-center border-b border-stone-850 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-205">
                    Analysis Report from{" "}
                    {ADVISOR_PERSONAS.find((a) => a.id === selectedAIAdvisorId)?.name}
                  </span>
                </div>
                <span className="text-[9px] font-mono uppercase bg-stone-850 px-2 py-0.5 rounded text-stone-400">
                  Clearance Protocol Active
                </span>
              </div>

              {isAIRecommending ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <PingDotSpinner />
                  <p className="text-xs font-mono text-stone-450 animate-pulse uppercase tracking-wider">
                    Retrieving Council Match Intelligence...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <MarkdownMiniRenderer text={advisorFeedback} />

                  {matchedProducts.length > 0 && (
                    <div className="border-t border-stone-850 pt-5 mt-4 space-y-4">
                      <div className="flex items-center gap-2 text-left">
                        <Package className="w-4.5 h-4.5 text-amber-500" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                          RECOMMENDED ACQUISITION PATHWAY ASSETS ({matchedProducts.length})
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        {matchedProducts.map((p) => (
                          <div
                            id={`matched-recommendation-${p.id}`}
                            key={p.id}
                            className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex gap-4 items-center justify-between hover:border-stone-700 transition"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-lg shrink-0 border border-stone-800 bg-stone-900"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0 text-left">
                                <p className="text-xs font-bold text-white truncate">{p.name}</p>
                                <p className="text-[10px] font-mono text-amber-500 mt-0.5">
                                  ${p.price.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <button
                              id={`add-matched-to-cart-${p.id}`}
                              onClick={() => onAcquireAsset(p)}
                              className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-mono text-[10px] uppercase font-bold py-2 px-3.5 rounded-lg shrink-0 transition cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Acquire Asset
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
