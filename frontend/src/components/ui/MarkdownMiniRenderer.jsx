"use client";

import { ShieldCheck } from "lucide-react";

function parseInline(text) {
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={key++} className="text-white font-bold">
          {match[1]}
        </strong>
      );
    } else {
      nodes.push(
        <em key={key++} className="text-amber-300 not-italic font-medium">
          {match[2]}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export default function MarkdownMiniRenderer({ text, className = "", size = "base" }) {
  if (!text) return null;
  const lines = text.split("\n");
  const isLg = size === "lg";

  return (
    <div
      className={`space-y-2.5 font-sans ${isLg ? "text-sm" : "text-xs"} text-stone-300 leading-relaxed text-left ${className}`}
    >
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        if (
          trimmed.startsWith("### ") ||
          trimmed.startsWith("## ") ||
          trimmed.startsWith("# ")
        ) {
          const headerText = trimmed.replace(/^(###\s*|##\s*|#\s*)/, "");
          return (
            <h4
              key={idx}
              className={`${isLg ? "text-sm md:text-base" : "text-xs md:text-sm"} font-bold text-amber-500 font-serif mt-3 mb-1.5 tracking-wide uppercase`}
            >
              {parseInline(headerText)}
            </h4>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 select-text">
              <span
                className={`w-4.5 h-4.5 shrink-0 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 ${isLg ? "text-[10px]" : "text-[9px]"} font-mono font-bold flex items-center justify-center mt-0.5`}
              >
                {numberedMatch[1]}
              </span>
              <span className="flex-1">{parseInline(numberedMatch[2])}</span>
            </div>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 select-text">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="flex-1">{parseInline(bulletText)}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed select-text">
            {parseInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
