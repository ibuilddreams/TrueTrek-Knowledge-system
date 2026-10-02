// Shared heading for every section of the course page: serif title with a
// short gold rule, plus an optional one-line subtitle.
export default function CourseSectionHeading({ id, children, subtitle }) {
  return (
    <div className="mb-5">
      <h2 id={id} className="text-2xl font-serif tracking-tight text-ink">
        {children}
      </h2>
      <span aria-hidden="true" className="mt-2 block h-0.5 w-10 rounded-full bg-gold" />
      {subtitle && <p className="mt-3 text-xs text-muted font-sans">{subtitle}</p>}
    </div>
  );
}
