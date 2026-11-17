import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import CourseSectionHeading from "./CourseSectionHeading";

// Shape only. The colours live on each variant below rather than being
// appended to this string: two `bg-*` utilities in one class list do not
// resolve by the order they are written in, they resolve by the order
// Tailwind emits them — which left the category chip rendering as a blank
// white pill because `.bg-white` happens to come after `.bg-cn-accent`.
const CHIP_BASE =
  "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold";

const CHIP_CATEGORY = `${CHIP_BASE} border-cn-accent bg-cn-accent text-white transition-colors duration-150 hover:bg-cn-accent-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent`;

const CHIP_TAG = `${CHIP_BASE} border-cn-rule bg-white text-cn-ink-2 shadow-cn-1`;

// "Explore related topics": the course's subject (links to the filtered
// store) plus its tags.
export default function CourseRelatedTopics({ category, tags = [] }) {
  if (!category && tags.length === 0) return null;

  return (
    <section aria-labelledby="course-topics-heading">
      <CourseSectionHeading tone="cobalt" id="course-topics-heading">Explore related topics</CourseSectionHeading>
      <ul className="flex flex-wrap gap-2">
        {category && (
          <li>
            <Link
              href={`${ROUTES.STORE}?category=${category.id}`}
              className={CHIP_CATEGORY}
            >
              {category.name}
            </Link>
          </li>
        )}
        {tags.map((tag) => (
          <li key={tag.id}>
            <span className={CHIP_TAG}>{tag.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
