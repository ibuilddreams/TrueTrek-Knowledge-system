"use client";

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
      className={[
        "w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-4 rounded-lg text-xs uppercase tracking-wider transition",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {isSubmitting && loadingLabel ? loadingLabel : label}
      {Icon && <Icon className="w-3.5 h-3.5" />}
    </button>
  );
}
