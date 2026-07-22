"use client";

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
  const resolvedInputClassName =
    inputClassName ||
    `w-full p-3 ${Icon ? "pl-10" : ""} rounded-lg border text-xs font-mono bg-stone-50 text-stone-800 focus:outline-none focus:bg-white transition ${
      error
        ? "border-red-300 focus:border-red-500"
        : "border-stone-200 focus:border-amber-600"
    }`;

  return (
    <div>
      <label className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
