"use client";

import { ShieldCheck } from "lucide-react";

/**
 * Two palettes, because this renderer draws an advisor's answer on two very
 * different surfaces: the floating concierge and the store suite sit on the
 * ink panel, while the home page's advisory council sits on paper. `dark` is
 * the original and stays the default, so nothing that already used this
 * component changes.
 */
const TONES = {
  dark: {
    body: "text-paper/75",
    heading: "text-gold font-serif",
    strong: "text-paper",
    em: "text-gold",
    marker: "bg-gold/10 border-gold/30 text-gold",
    bullet: "text-gold",
  },
  light: {
    body: "text-cn-ink-2",
    heading: "text-cn-ink",
    strong: "text-cn-ink",
    em: "text-cn-accent-3",
    marker: "bg-cn-paper-3 border-cn-accent-soft/50 text-cn-accent-3",
    bullet: "text-cn-accent",
  },
};

function parseInline(text, tone) {
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
        <strong key={key++} className={`font-bold ${tone.strong}`}>
          {match[1]}
        </strong>
      );
    } else {
      nodes.push(
        <em key={key++} className={`font-medium not-italic ${tone.em}`}>
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

export default function MarkdownMiniRenderer({
  text,
  className = "",
  size = "base",
  tone = "dark",
}) {
  if (!text) return null;
  const lines = text.split("\n");
  const isLg = size === "lg";
  const palette = TONES[tone] ?? TONES.dark;

  return (
    <div
      className={`space-y-2.5 font-sans ${isLg ? "text-sm" : "text-xs"} ${palette.body} leading-relaxed text-left ${className}`}
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
              className={`${isLg ? "text-sm md:text-base" : "text-xs md:text-sm"} font-bold ${palette.heading} mt-3 mb-1.5 tracking-wide uppercase`}
            >
              {parseInline(headerText, palette)}
            </h4>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 select-text">
              <span
                className={`w-4.5 h-4.5 shrink-0 rounded-full border ${palette.marker} ${isLg ? "text-[10px]" : "text-[9px]"} font-mono font-bold flex items-center justify-center mt-0.5`}
              >
                {numberedMatch[1]}
              </span>
              <span className="flex-1">{parseInline(numberedMatch[2], palette)}</span>
            </div>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 select-text">
              <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${palette.bullet}`} />
              <span className="flex-1">{parseInline(bulletText, palette)}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed select-text">
            {parseInline(trimmed, palette)}
          </p>
        );
      })}
    </div>
  );
}
