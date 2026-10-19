"use client";

import { useEffect, useState } from "react";
import { Eye, FileSearch, Loader2, ScanLine } from "lucide-react";

// The backend runs the critique as one model call, so there is no real
// per-stage progress to report. These labels are an honest narration of what
// that single call is doing rather than a fake percentage — the panel never
// claims a completion figure it doesn't have.
const STAGES = [
  { icon: FileSearch, label: "Reading your media kit" },
  { icon: ScanLine, label: "Checking for engagement stats and deliverables" },
  { icon: Eye, label: "Judging it as a sponsor would" },
];

const STAGE_INTERVAL_MS = 4000;

export default function ReviewProgressPanel({ fileName }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // Stops on the last stage instead of looping, so a slow review doesn't
      // appear to restart from the beginning.
      setStageIndex((current) => Math.min(current + 1, STAGES.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-8 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />

      <div className="flex flex-col items-center text-center gap-3 mb-7">
        <div className="w-12 h-12 rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <h3 className="text-lg font-serif font-light text-ink">Reviewing your media kit</h3>
        {fileName && <p className="text-xs text-muted font-light">{fileName}</p>}
        <p className="text-xs text-muted font-light max-w-sm leading-relaxed">
          This usually takes under a minute. You can leave this tab — your review keeps running
          and will be here when you come back.
        </p>
      </div>

      <ol className="space-y-3 max-w-sm mx-auto">
        {STAGES.map((stage, index) => {
          const StageIcon = stage.icon;
          const isActive = index === stageIndex;
          const isDone = index < stageIndex;

          return (
            <li
              key={stage.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                isActive
                  ? "border-pine/30 bg-sage/20"
                  : isDone
                    ? "border-line bg-porcelain"
                    : "border-line bg-paper opacity-50"
              }`}
            >
              <StageIcon
                className={`w-4 h-4 shrink-0 ${isActive ? "text-pine" : "text-muted"}`}
              />
              <span className={`text-xs font-light ${isActive ? "text-ink" : "text-muted"}`}>
                {stage.label}
              </span>
              {isActive && <Loader2 className="w-3.5 h-3.5 ml-auto animate-spin text-pine" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
