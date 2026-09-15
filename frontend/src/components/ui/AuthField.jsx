"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === "password";
  const resolvedType =
    isPasswordField && showPasswordToggle && showPassword ? "text" : type;

  const resolvedInputClassName =
    inputClassName ||
    [
      "w-full p-3 rounded-xl border text-xs font-sans focus:outline-none transition",
      Icon ? "pl-10" : "",
      showPasswordToggle && isPasswordField ? "pr-11" : "",
      "bg-paper text-ink placeholder:text-muted",
      error ? "border-red-300 focus:border-red-500" : "border-line focus:border-pine",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div>
      <label className="text-[10px] font-sans uppercase tracking-widest font-medium block mb-1.5 text-muted">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
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
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition text-muted hover:text-ink"
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
        <p className="text-[11px] text-red-600 font-sans uppercase tracking-widest font-medium mt-1.5">{error}</p>
      )}
    </div>
  );
}
