"use client";

export default function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  autoComplete,
  inputClassName = "w-full p-3 rounded-lg border border-stone-200 text-xs font-mono bg-stone-50 text-stone-800 focus:outline-none focus:border-amber-600",
}) {
  return (
    <div>
      <label className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={inputClassName}
      />
    </div>
  );
}
