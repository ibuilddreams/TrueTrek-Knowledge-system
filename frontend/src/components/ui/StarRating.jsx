"use client";

import { useId, useState } from "react";
import { Star } from "lucide-react";

export const RATING_LABELS = ["Select a rating", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function StarRating({ value = 0, onChange, disabled = false, compact = false }) {
  const id = useId();
  const [hovered, setHovered] = useState(0);
  const selected = Number(value);
  const preview = hovered || selected;
  if (!onChange) return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${selected} out of 5 stars — ${RATING_LABELS[selected]}`}>
      {[1, 2, 3, 4, 5].map((star) => <Star key={star} aria-hidden="true" className={`${compact ? "h-4 w-4" : "h-6 w-6"} ${star <= selected ? "fill-gold text-gold" : "text-muted/30"}`} strokeWidth={1.5} />)}
    </span>
  );
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="sr-only">Rate your experience from 1 to 5 stars</legend>
      <div className="flex justify-center gap-0.5 sm:gap-3" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className={`relative ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`} onMouseEnter={() => !disabled && setHovered(star)}>
            <input className="peer sr-only" type="radio" name={`rating-${id}`} value={star} checked={selected === star} onChange={() => { setHovered(0); onChange(star); }} required aria-label={`${star} ${star === 1 ? "star" : "stars"} — ${RATING_LABELS[star]}`} />
            <span className={`tt-star flex h-12 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-pine peer-focus-visible:ring-offset-4 ${star <= preview ? "border-gold/40 bg-gold/10 shadow-sm" : "border-line bg-paper hover:border-gold/40"}`}>
              <Star aria-hidden="true" className={`h-7 w-7 transition-colors ${star <= preview ? "fill-gold text-gold" : "text-muted/40"}`} strokeWidth={1.5} />
            </span>
          </label>
        ))}
      </div>
      <p className="text-center text-sm font-medium text-pine" aria-live="polite">{RATING_LABELS[preview]}</p>
    </fieldset>
  );
}
