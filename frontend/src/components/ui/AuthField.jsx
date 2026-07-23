"use client";

import { useTheme } from "@/hooks/useTheme";

export default function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  autoComplete,
  error,
  icon: Icon,
  inputClassName,
  ...rest
}) {
  const { isVault } = useTheme();

  const resolvedInputClassName =
    inputClassName ||
    [
      "w-full p-3 rounded-lg border text-xs font-mono focus:outline-none transition",
      Icon ? "pl-10" : "",
      isVault
        ? "bg-[#0c0b0a] text-stone-200 placeholder:text-stone-600"
        : "bg-white text-stone-800 placeholder:text-stone-400",
      error
        ? "border-red-300 focus:border-red-500"
        : isVault
          ? "border-stone-700 focus:border-amber-600"
          : "border-stone-200 focus:border-amber-600",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div>
      <label
        className={`text-[10px] font-mono block uppercase tracking-wider mb-1.5 ${
          isVault ? "text-stone-500" : "text-stone-400"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className={`w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          />
        )}
        <input
          id={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={resolvedInputClassName}
          {...rest}
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-600 font-mono mt-1.5">{error}</p>
      )}
    </div>
  );
}
