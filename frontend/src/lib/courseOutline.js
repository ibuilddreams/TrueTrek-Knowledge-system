// Totals for a public course outline (`modules` from the public detail API).
export function summarizeOutline(modules = []) {
  return modules.reduce(
    (totals, module) => ({
      lessons: totals.lessons + (module.lessons?.length || 0),
      assignments: totals.assignments + (module.assignments?.length || 0),
      quizzes: totals.quizzes + (module.quizzes?.length || 0),
      minutes:
        totals.minutes +
        (module.lessons || []).reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0),
    }),
    { lessons: 0, assignments: 0, quizzes: 0, minutes: 0 },
  );
}

// "1h 25m" / "45m" — compact lecture/section length.
export function formatMinutesCompact(minutes) {
  const value = Math.round(Number(minutes) || 0);
  if (value <= 0) return null;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

// "K" -> "Grade K", "K–2" -> "Grades K–2"; text labels ("Kindergarten") pass through.
export function formatGradeLabel(label) {
  const value = (label || "").trim();
  if (!value) return null;
  if (!/^[\dK–-]+$/i.test(value)) return value;
  return /[–-]/.test(value) ? `Grades ${value}` : `Grade ${value}`;
}
