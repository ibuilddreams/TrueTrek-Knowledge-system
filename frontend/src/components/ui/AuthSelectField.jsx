"use client";

/**
 * Select field for the auth screens — the `<select>` sibling of AuthField, so
 * the signup form's two dropdowns (account type and gender) can't drift apart
 * from each other or from the text inputs beside them.
 *
 * The placeholder row is `disabled` rather than selectable, matching the
 * native "required select" pattern: an empty value never passes validation, so
 * the browser blocks submit on it instead of posting a blank choice.
 */
export default function AuthSelectField({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  error,
  hint,
  selectClassName,
  ...rest
}) {
  const resolvedSelectClassName =
    selectClassName ||
    [
      "w-full p-3 rounded-xl border text-xs font-sans focus:outline-none transition",
      "bg-paper",
      value ? "text-ink" : "text-muted",
      error ? "border-red-300 focus:border-red-500" : "border-line focus:border-pine",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] font-sans uppercase tracking-widest font-medium block mb-1.5 text-muted"
      >
        {label}
      </label>
      <select
        id={id}
        required={required}
        value={value}
        onChange={onChange}
        className={resolvedSelectClassName}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="text-[11px] font-light leading-relaxed mt-1.5 text-muted">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600 font-sans uppercase tracking-widest font-medium mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
