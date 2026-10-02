import ExpandableText from "@/components/ui/ExpandableText";
import StarRating from "@/components/ui/StarRating";
import { formatRelativeTime } from "@/lib/relativeTime";

// One review in the course page's two-column list: initial avatar, name,
// stars, relative date and the (collapsible) comment.
export default function CourseReviewItem({ review, showInstructor = false }) {
  const initial = (review.student_name || "?").trim().charAt(0).toUpperCase();

  return (
    <li className="border-t border-line pt-6 pb-2">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="w-12 h-12 shrink-0 rounded-full bg-ink text-paper flex items-center justify-center font-serif text-lg"
        >
          {initial}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink truncate">{review.student_name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <StarRating value={review.rating} compact />
            <span className="text-xs font-medium text-muted">{formatRelativeTime(review.created_at)}</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        {review.comment ? (
          <ExpandableText
            text={review.comment}
            lines={4}
            threshold={240}
            className="text-[15px] leading-relaxed text-ink/90"
          />
        ) : (
          <p className="text-sm italic text-muted">Left a rating without a comment.</p>
        )}
      </div>

      {showInstructor && review.instructor?.name && (
        <p className="mt-3 text-xs text-muted">For instructor {review.instructor.name}</p>
      )}
    </li>
  );
}
