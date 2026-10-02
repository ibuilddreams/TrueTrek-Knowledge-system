import { BookOpen, Star, Users } from "lucide-react";
import { pluralize } from "@/lib/courseOutline";
import InstructorSocialLinks from "./InstructorSocialLinks";

function Stat({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-sans text-paper/85">
      <Icon className="w-4 h-4 text-gold" aria-hidden="true" />
      {children}
    </span>
  );
}

// Top banner of the instructor page: name, headline, headline numbers,
// links and photo. The skills card below overlaps its bottom edge.
export default function InstructorHero({ instructor }) {
  const { stats } = instructor;
  const initial = (instructor.name || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="relative isolate overflow-hidden bg-pine text-paper">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold/15 blur-[110px]"
      />
      <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-28 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-10">
        <div className="min-w-0 max-w-2xl space-y-5">
          <p className="text-[11px] font-sans font-medium uppercase tracking-[0.25em] text-gold">
            Instructor
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {stats.students > 0 && <Stat icon={Users}>{pluralize(stats.students, "learner")}</Stat>}
            {stats.rating != null && (
              <Stat icon={Star}>
                <span className="font-semibold text-paper">{stats.rating.toFixed(1)}</span>
                <span className="text-paper/70">({pluralize(stats.reviews, "review")})</span>
              </Stat>
            )}
            <Stat icon={BookOpen}>{pluralize(stats.courses, "course")}</Stat>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-light tracking-tight leading-[1.05]">
            {instructor.name}
          </h1>

          {instructor.headline && (
            <p className="text-base md:text-lg font-light leading-relaxed text-paper/80">
              {instructor.headline}
            </p>
          )}

          <InstructorSocialLinks instructor={instructor} />
        </div>

        <div className="shrink-0 self-start md:self-center">
          {instructor.avatar ? (
            <img
              src={instructor.avatar}
              alt={instructor.name}
              className="w-36 h-36 md:w-52 md:h-52 rounded-full object-cover ring-4 ring-gold/60 shadow-elevated"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              aria-hidden="true"
              className="w-36 h-36 md:w-52 md:h-52 rounded-full bg-gradient-to-br from-moss to-ink ring-4 ring-gold/60 shadow-elevated flex items-center justify-center font-serif text-6xl md:text-7xl text-gold"
            >
              {initial}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
