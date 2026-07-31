"use client";

import { useMemo, useState } from "react";
import { Medal, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { DRILL_QUESTIONS } from "@/data/curriculum";
import {
  NIL_BASE_TRANSACTIONS,
  REACH_MULTIPLIERS,
} from "../portalConstants";

export default function DashboardTab({
  drillCompletedList,
  aggregateScore,
}) {
  const [brandReach, setBrandReach] = useState("optimized");

  const calculatedNILData = useMemo(
    () =>
      NIL_BASE_TRANSACTIONS.map((tx) => {
        const multiplier = REACH_MULTIPLIERS[brandReach] || 1;
        return {
          quarter: tx.quarter,
          "Personal Branding": Math.round(tx.brandingRevenue * multiplier),
          "Sponsorships & Teams": Math.round(tx.partnershipRevenue * multiplier),
          "Avatar Licensing": Math.round(tx.licensingRevenue * multiplier),
        };
      }),
    [brandReach]
  );

  const drillProgress =
    (drillCompletedList.length / DRILL_QUESTIONS.length) * 100 || 22;

  const ratingLabel =
    aggregateScore >= 90
      ? "★ PLATINUM"
      : aggregateScore >= 80
        ? "✓ SECURE"
        : "⚠ AUDIT";

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <span className="text-stone-400 text-[10px] font-mono uppercase tracking-widest block mb-1">
            Progression Tracker
          </span>
          <h4 className="text-lg font-serif text-stone-900 font-bold mb-3">
            Mastery Level Milestones
          </h4>
          <div className="w-full bg-stone-100 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all"
              style={{ width: `${drillProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-stone-500">
            Completed{" "}
            <strong className="text-stone-800">{drillCompletedList.length}</strong> of{" "}
            <strong className="text-stone-800">{DRILL_QUESTIONS.length}</strong>{" "}
            core situational drills.
          </p>
        </div>
        <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl flex items-center gap-3 md:w-56 justify-center">
          <Medal className="text-amber-500 w-8 h-8 shrink-0" />
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400">
              Next Certification
            </p>
            <p className="text-xs font-bold text-stone-800 mt-0.5">
              Recruit Governance (Tier 2)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Performance Matrix
              </span>
            </div>
            <h4 className="text-lg font-serif font-bold text-white mb-2">
              Real-Time Compliance Evaluation
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
              Your compliance index updates from daily drills and certified
              education modules. Higher scores unlock elite tier status.
            </p>
          </div>
          <div className="md:w-72 w-full bg-stone-950/60 border border-stone-800 p-4 rounded-xl shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-stone-400 uppercase font-semibold">
                Active Rating
              </span>
              <span className="text-xs font-mono font-black text-amber-500">
                {aggregateScore}%
              </span>
            </div>
            <div className="w-full bg-stone-900 rounded-full h-3.5 overflow-hidden mb-2 border border-stone-800/50">
              <motion.div
                className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${aggregateScore}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-stone-500">
              <span>CRITICAL</span>
              <span className="text-emerald-400 font-bold uppercase">
                {ratingLabel}
              </span>
              <span>PERFECT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-6">
          <div>
            <span className="text-amber-700 text-xs font-mono uppercase tracking-wider block mb-1">
              Projection Engine
            </span>
            <h4 className="text-lg font-serif font-bold text-stone-900">
              NIL Revenue Capital Projections
            </h4>
          </div>
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
            <span className="text-[10px] font-mono text-stone-500 uppercase px-2">
              Reach:
            </span>
            {[
              { id: "normal", label: "Standard" },
              { id: "optimized", label: "Optimized" },
              { id: "viral", label: "Viral Apex" },
            ].map((multiplier) => (
              <button
                key={multiplier.id}
                type="button"
                onClick={() => setBrandReach(multiplier.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wide transition ${
                  brandReach === multiplier.id
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-200"
                }`}
              >
                {multiplier.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={calculatedNILData}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="quarter"
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#78716c"
                fontSize={11}
                tickFormatter={(v) => `$${v}`}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, ""]}
                contentStyle={{
                  backgroundColor: "#1c1917",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "11px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar dataKey="Personal Branding" fill="#d97706" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="Sponsorships & Teams"
                fill="#78716c"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="Avatar Licensing" fill="#b45309" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0 border border-orange-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 mb-1">
              Trademark Alert
            </h5>
            <p className="text-[12px] text-stone-500 leading-relaxed font-light">
              Brand trademark registration for &quot;MJ-Prime&quot; has a
              non-compete clause pending legal redlines. Review it in the War
              Room.
            </p>
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 mb-1">
              Recovery Progress
            </h5>
            <p className="text-[12px] text-stone-500 leading-relaxed font-light">
              Sleep stabilization metrics look strong. Your fatigue indicator
              score moved up to a 92% green rating.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
