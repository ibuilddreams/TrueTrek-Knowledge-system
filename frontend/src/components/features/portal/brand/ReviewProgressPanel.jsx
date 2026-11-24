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
    <div className="relative bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-8 overflow-hidden">

      <div className="flex flex-col items-center text-center gap-3 mb-7">
        <div className="w-12 h-12 rounded-2xl bg-cn-p-warn-bg border border-cn-p-warn-bg text-cn-p-warn flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <h3 className="text-lg font-light text-cn-p-ink">Reviewing your media kit</h3>
        {fileName && <p className="text-xs text-cn-p-ink-2 font-light">{fileName}</p>}
        <p className="text-xs text-cn-p-ink-2 font-light max-w-sm leading-relaxed">
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
                  ? "border-cn-p-accent-soft bg-cn-p-soft"
                  : isDone
                    ? "border-cn-p-line bg-cn-p-page"
                    : "border-cn-p-line bg-cn-p-card opacity-50"
              }`}
            >
              <StageIcon
                className={`w-4 h-4 shrink-0 ${isActive ? "text-cn-p-accent" : "text-cn-p-ink-2"}`}
              />
              <span className={`text-xs font-light ${isActive ? "text-cn-p-ink" : "text-cn-p-ink-2"}`}>
                {stage.label}
              </span>
              {isActive && <Loader2 className="w-3.5 h-3.5 ml-auto animate-spin text-cn-p-accent" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
