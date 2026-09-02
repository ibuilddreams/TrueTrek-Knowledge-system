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
        "w-full bg-pine hover:bg-moss text-paper font-sans font-semibold py-3.5 px-4 rounded-full text-xs uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2",
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
