import PathwaySectionHeading from "./PathwaySectionHeading";

// "Why this pathway" prose, followed by the longer description when the admin
// wrote one. Hidden when neither has been filled in.
export default function PathwayPurposeSection({ purpose, description }) {
  if (!purpose && !description) return null;

  return (
    <section aria-labelledby="pathway-purpose-heading">
      <PathwaySectionHeading id="pathway-purpose-heading" eyebrow="The Brief">
        Why this pathway exists
      </PathwaySectionHeading>
      <div className="space-y-4 border-l-2 border-gold/40 pl-6">
        {purpose && (
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/90">{purpose}</p>
        )}
        {description && (
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/90">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
