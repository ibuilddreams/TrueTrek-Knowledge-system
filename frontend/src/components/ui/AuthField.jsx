"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  showPasswordToggle = false,
  inputClassName,
  ...rest
}) {
  const { isVault } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === "password";
  const resolvedType =
    isPasswordField && showPasswordToggle && showPassword ? "text" : type;

  const resolvedInputClassName =
    inputClassName ||
    [
      "w-full p-3 rounded-lg border text-xs font-mono focus:outline-none transition",
      Icon ? "pl-10" : "",
      showPasswordToggle && isPasswordField ? "pr-11" : "",
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
          type={resolvedType}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={resolvedInputClassName}
          {...rest}
        />
        {showPasswordToggle && isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition ${
              isVault
                ? "text-stone-500 hover:text-stone-300"
                : "text-stone-400 hover:text-stone-600"
            }`}
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-red-600 font-mono mt-1.5">{error}</p>
      )}
    </div>
  );
}
