// Section heading for the pathway page: a small gold eyebrow over a serif
// title. Deliberately different from the course page's heading (serif title
// with a gold underline rule) so the two public pages don't read as one
// template with the nouns swapped.
export default function PathwaySectionHeading({ id, eyebrow, children, subtitle }) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <span className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-gold">
          {eyebrow}
        </span>
      )}
      <h2 id={id} className="font-serif text-2xl font-light tracking-tight text-ink md:text-3xl">
        {children}
      </h2>
      {subtitle && <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>}
    </div>
  );
}
