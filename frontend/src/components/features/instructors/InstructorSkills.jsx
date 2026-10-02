// "Skills I teach": a card that overlaps the hero's bottom edge. Hidden when
// the instructor hasn't listed any.
export default function InstructorSkills({ skills }) {
  if (!skills?.length) return null;

  return (
    <section
      aria-labelledby="instructor-skills-heading"
      className="relative z-10 -mt-16 rounded-panel border border-line bg-paper p-6 md:p-8 shadow-elevated"
    >
      <h2
        id="instructor-skills-heading"
        className="text-center text-xs font-sans font-medium uppercase tracking-[0.25em] text-muted"
      >
        Skills I teach
      </h2>
      <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
        {skills.map((skill) => (
          <li
            key={skill}
            className="rounded-full border border-line bg-porcelain px-4 py-2 text-sm font-sans text-ink"
          >
            {skill}
          </li>
        ))}
      </ul>
    </section>
  );
}
