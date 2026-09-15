"use client";

import { Construction } from "lucide-react";
import { motion } from "motion/react";

export default function DevelopmentPhasePanel({
  title,
  description = "This section is currently in development and will be available soon.",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[1.75rem] border border-gold/30 bg-gradient-to-br from-gold/10 via-paper to-porcelain shadow-[0_18px_50px_-36px_rgba(199,168,91,0.35)]"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 w-64 h-64 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 w-48 h-48 rounded-full bg-pine/10 blur-3xl" />

      <div className="relative px-6 py-16 sm:px-10 sm:py-20 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-paper/80 px-3 py-1 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-gold">
            Development phase
          </span>
        </div>

        <div className="w-14 h-14 rounded-2xl border border-gold/30 bg-paper text-gold flex items-center justify-center mx-auto mb-5 shadow-sm">
          <Construction className="w-6 h-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted font-light mt-3 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
