"use client";

import { useState } from "react";
import { CheckCircle, Send, Sparkles } from "lucide-react";
import { ADVISOR_PERSONAS } from "@/data/curriculum";
import { requestAdvisorAdvice } from "@/services/advisorService";
import { WAR_ROOM_PRESETS } from "../portalConstants";

export default function WarRoomTab({
  setConsultationCount,
  setPoints,
  onNotify,
}) {
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("recruiter");
  const [customScenario, setCustomScenario] = useState("");
  const [advisorAdvice, setAdvisorAdvice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedAdvisor =
    ADVISOR_PERSONAS.find((advisor) => advisor.id === selectedAdvisorId) ||
    ADVISOR_PERSONAS[0];

  const handleQueryAdvisor = async () => {
    if (!customScenario.trim()) return;
    setIsGenerating(true);
    setAdvisorAdvice("");

    try {
      const data = await requestAdvisorAdvice({
        scenario: customScenario,
        systemPrompt: selectedAdvisor.systemPrompt,
        advisorName: selectedAdvisor.name,
      });

      if (data.advice) {
        setAdvisorAdvice(data.advice);
        setConsultationCount((prev) => prev + 1);
        setPoints((prev) => prev + 100);
        onNotify?.({
          title: "🧠 COUNSEL OBTAINED (+100 XP)",
          desc: `You consulted ${selectedAdvisor.name} and received strategic clarity.`,
          type: "points",
        });
      } else if (data.error) {
        setAdvisorAdvice(
          `### Operational Error\n\n${data.error}\n\n*Please try again shortly.*`
        );
      }
    } catch (err) {
      setAdvisorAdvice(
        `### Connection Interrupt\n\nFailed to reach the advisory council. ${err.message || err}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-sm">
      <div>
        <span className="text-amber-700 text-sm font-mono uppercase tracking-wider block mb-0.5">
          Strategic Command
        </span>
        <h4 className="text-xl font-serif font-bold text-stone-900">
          Mentor Advisory Council
        </h4>
        <p className="text-stone-500 text-sm font-light mt-1">
          Select an expert and present your dilemma for regulatory, legal, or
          psychological feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ADVISOR_PERSONAS.map((advisor) => (
          <button
            key={advisor.id}
            type="button"
            onClick={() => {
              setSelectedAdvisorId(advisor.id);
              setAdvisorAdvice("");
            }}
            className={`p-3.5 rounded-xl border text-left flex flex-col items-start gap-2.5 transition ${
              selectedAdvisorId === advisor.id
                ? "border-amber-500 bg-amber-50/50 text-stone-950"
                : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <img
              src={advisor.avatar}
              alt={advisor.name}
              className="w-11 h-11 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-sm font-bold leading-tight text-stone-900">
                {advisor.name}
              </p>
              <p className="text-[10px] uppercase font-mono tracking-widest text-stone-500 mt-1">
                {advisor.id}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-mono font-bold text-amber-800 uppercase tracking-widest">
              Active Advisor
            </h5>
            <p className="text-sm font-semibold text-stone-850 mt-1">
              {selectedAdvisor.name} — {selectedAdvisor.title}
            </p>
            <p className="text-sm text-stone-600 italic mt-1 font-light">
              &quot;{selectedAdvisor.quote}&quot;
            </p>
          </div>
        </div>
        <span className="bg-stone-100 text-stone-700 text-[11px] font-mono uppercase tracking-widest px-2.5 py-1.5 rounded border border-stone-200">
          {selectedAdvisor.specialty.split(",")[0]}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-mono text-stone-400 block uppercase tracking-wider mb-2">
            Strategic Dilemma
          </label>
          <textarea
            rows={4}
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            placeholder="Describe your scenario for advisory review..."
            className="w-full border border-stone-200 p-3.5 rounded-xl bg-stone-50 text-sm font-mono text-stone-800 focus:outline-none focus:border-amber-600 leading-relaxed"
          />
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-2">
            Quick Prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {WAR_ROOM_PRESETS.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCustomScenario(preset)}
                className="bg-stone-100 hover:bg-stone-200 border border-stone-200 max-w-full text-left truncate text-[11px] text-stone-600 py-1.5 px-3 rounded-lg"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={handleQueryAdvisor}
            disabled={isGenerating || !customScenario.trim()}
            className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm tracking-wider uppercase py-3 px-6 rounded-xl inline-flex items-center gap-2 transition disabled:opacity-40"
          >
            {isGenerating ? "Consulting..." : "Submit to Council"}
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {(isGenerating || advisorAdvice) && (
        <div className="border border-stone-200 rounded-xl p-5 md:p-6 bg-stone-50/50 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600" />
          <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-700 w-4 h-4" />
              <span className="text-sm font-mono font-bold text-stone-800 uppercase tracking-widest">
                Council Response
              </span>
            </div>
          </div>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-stone-500 font-mono">
                Consulting mastermind schemas...
              </p>
            </div>
          ) : (
            <div className="whitespace-pre-line text-stone-700 text-sm md:text-sm leading-relaxed space-y-4">
              {advisorAdvice}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
