"use client";

import { Loader2 } from "lucide-react";

export default function AuthSubmitButton({
  id,
  label,
  loadingLabel,
  isSubmitting = false,
  icon: Icon,
  className = "",
  ...rest
}) {
  return (
    <button
      id={id}
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className={[
        "w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-4 rounded-lg text-xs uppercase tracking-wider transition disabled:cursor-not-allowed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {loadingLabel || label}
        </>
      ) : (
        <>
          {label}
          {Icon && <Icon className="w-3.5 h-3.5" />}
        </>
      )}
    </button>
  );
}
