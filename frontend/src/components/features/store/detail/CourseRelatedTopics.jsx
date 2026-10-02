import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import CourseSectionHeading from "./CourseSectionHeading";

const CHIP_CLASS =
  "inline-flex items-center rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-sans font-medium text-ink shadow-xs";

// "Explore related topics": the course's subject (links to the filtered
// store) plus its tags.
export default function CourseRelatedTopics({ category, tags = [] }) {
  if (!category && tags.length === 0) return null;

  return (
    <section aria-labelledby="course-topics-heading">
      <CourseSectionHeading id="course-topics-heading">Explore related topics</CourseSectionHeading>
      <ul className="flex flex-wrap gap-2">
        {category && (
          <li>
            <Link
              href={`${ROUTES.STORE}?category=${category.id}`}
              className={`${CHIP_CLASS} bg-pine text-paper border-pine hover:bg-moss transition`}
            >
              {category.name}
            </Link>
          </li>
        )}
        {tags.map((tag) => (
          <li key={tag.id}>
            <span className={CHIP_CLASS}>{tag.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
