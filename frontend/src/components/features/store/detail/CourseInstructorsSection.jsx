import Link from "next/link";
import { Award, PlayCircle, Star, Users } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import ExpandableText from "@/components/ui/ExpandableText";
import CourseSectionHeading from "./CourseSectionHeading";

function StatRow({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-3 text-sm text-ink/90">
      <Icon className="w-4 h-4 shrink-0 text-ink" aria-hidden="true" />
      {children}
    </li>
  );
}

function InstructorCard({ instructor }) {
  const { stats } = instructor;
  const href = `${ROUTES.INSTRUCTORS}/${instructor.user_id}`;
  const initial = (instructor.name || "?").trim().charAt(0).toUpperCase();

  return (
    <article className="rounded-card border border-line bg-paper p-6 md:p-8 shadow-soft">
      <h3 className="text-xl font-semibold text-ink">
        <Link
          href={href}
          className="underline decoration-gold/60 decoration-2 underline-offset-4 hover:text-pine hover:decoration-pine transition-colors"
        >
          {instructor.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted">
        {instructor.headline || (instructor.is_lead ? "Lead instructor" : "Instructor")}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-6">
        <Link href={href} aria-label={`View ${instructor.name}'s profile`} className="shrink-0 self-start">
          {instructor.avatar ? (
            <img
              src={instructor.avatar}
              alt=""
              className="w-28 h-28 rounded-full object-cover ring-4 ring-sage/60"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              aria-hidden="true"
              className="w-28 h-28 rounded-full bg-gradient-to-br from-pine to-moss text-paper ring-4 ring-sage/60 flex items-center justify-center font-serif text-4xl"
            >
              {initial}
            </span>
          )}
        </Link>

        <ul className="space-y-3">
          {stats.rating != null && (
            <StatRow icon={Star}>{stats.rating.toFixed(1)} Instructor rating</StatRow>
          )}
          {stats.reviews > 0 && (
            <StatRow icon={Award}>
              {stats.reviews.toLocaleString()} {stats.reviews === 1 ? "Review" : "Reviews"}
            </StatRow>
          )}
          {stats.students > 0 && (
            <StatRow icon={Users}>
              {stats.students.toLocaleString()} {stats.students === 1 ? "Student" : "Students"}
            </StatRow>
          )}
          <StatRow icon={PlayCircle}>
            {stats.courses.toLocaleString()} {stats.courses === 1 ? "Course" : "Courses"}
          </StatRow>
        </ul>
      </div>

      {instructor.bio && (
        <div className="mt-6">
          <ExpandableText
            text={instructor.bio}
            lines={4}
            threshold={320}
            className="text-[15px] leading-relaxed text-ink/90"
          />
        </div>
      )}
    </article>
  );
}

// Instructors, Udemy-style: name link, headline, photo with headline numbers
// and a collapsible bio. Each card opens the instructor's public page; the
// public API never exposes contact details.
export default function CourseInstructorsSection({ instructors }) {
  if (!instructors?.length) return null;

  return (
    <section aria-labelledby="course-instructors-heading">
      <CourseSectionHeading id="course-instructors-heading">
        {instructors.length === 1 ? "Instructor" : "Instructors"}
      </CourseSectionHeading>
      <div className="space-y-5">
        {instructors.map((instructor) => (
          <InstructorCard key={instructor.id} instructor={instructor} />
        ))}
      </div>
    </section>
  );
}
