"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import {
  deleteInstructorFeedback,
  getFeedbackEligibility,
  submitInstructorFeedback,
} from "@/services/instructorsService";
import { buildAuthUrl } from "@/lib/authRedirect";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import StarRating from "@/components/ui/StarRating";

const MAX_COMMENT_LENGTH = 1000;

const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm text-ink placeholder:text-muted transition disabled:opacity-60";

function Notice({ children }) {
  return (
    <p className="rounded-card border border-dashed border-line bg-paper/70 px-6 py-5 text-sm text-muted">
      {children}
    </p>
  );
}

// "Leave feedback" for students: pick one of the instructor's courses they're
// enrolled in, rate it and (optionally) comment. Re-submitting updates the
// existing feedback; it can also be deleted. Everyone else sees a hint.
export default function InstructorFeedbackForm({ instructor }) {
  const queryClient = useQueryClient();
  const { status, isAuthenticated, isStudent } = useAuth();
  const isAuthResolved = status !== "idle" && status !== "loading";
  const canGiveFeedback = isAuthResolved && isAuthenticated && isStudent;

  const [courseId, setCourseId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const eligibilityQuery = useQuery({
    queryKey: ["instructor-eligibility", instructor.id],
    queryFn: async () => (await getFeedbackEligibility(instructor.id))?.data || [],
    enabled: canGiveFeedback,
  });
  const entries = useMemo(() => eligibilityQuery.data || [], [eligibilityQuery.data]);
  const selected = entries.find((entry) => String(entry.course.id) === String(courseId));

  // Default to the first course, and load the saved feedback when switching.
  useEffect(() => {
    if (entries.length === 0) return;
    if (!entries.some((entry) => String(entry.course.id) === String(courseId))) {
      setCourseId(String(entries[0].course.id));
    }
  }, [entries, courseId]);

  useEffect(() => {
    setRating(selected?.feedback?.rating || 0);
    setComment(selected?.feedback?.comment || "");
  }, [selected?.course.id, selected?.feedback?.rating, selected?.feedback?.comment]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["instructor-eligibility", instructor.id] });
    queryClient.invalidateQueries({ queryKey: ["instructor-feedback", instructor.id] });
    queryClient.invalidateQueries({ queryKey: ["instructor", String(instructor.id)] });
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      submitInstructorFeedback(instructor.id, {
        course: Number(courseId),
        rating,
        comment: comment.trim(),
      }),
    onSuccess: (response) => {
      toastSuccess(response?.message || "Feedback submitted.");
      refresh();
    },
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to save your feedback.")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInstructorFeedback(instructor.id, Number(courseId)),
    onSuccess: () => {
      toastSuccess("Your feedback was removed.");
      setRating(0);
      setComment("");
      refresh();
    },
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to remove your feedback.")),
  });

  const isBusy = submitMutation.isPending || deleteMutation.isPending;

  if (!isAuthResolved) return null;

  if (!isAuthenticated) {
    return (
      <Notice>
        Taken one of {instructor.name}&apos;s courses?{" "}
        <Link
          href={buildAuthUrl(ROUTES.LOGIN, `${ROUTES.INSTRUCTORS}/${instructor.id}`)}
          className="font-semibold text-pine underline"
        >
          Sign in
        </Link>{" "}
        to leave feedback.
      </Notice>
    );
  }

  if (!isStudent) return null;
  if (eligibilityQuery.isLoading) return null;
  if (eligibilityQuery.isError) {
    return <Notice>{getApiErrorMessage(eligibilityQuery.error, "Couldn't load your courses.")}</Notice>;
  }
  if (entries.length === 0) {
    return <Notice>Enroll in one of {instructor.name}&apos;s courses to leave feedback.</Notice>;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!rating) {
      toastError("Please select a star rating.");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-line bg-paper p-6 md:p-8 shadow-soft space-y-5"
      aria-labelledby="instructor-feedback-form-heading"
    >
      <div>
        <h3 id="instructor-feedback-form-heading" className="text-xl font-serif text-ink">
          {selected?.feedback ? "Update your feedback" : "Leave feedback"}
        </h3>
        <p className="mt-1 text-xs text-muted">
          Share how {instructor.name}&apos;s teaching has worked for you. Your name is shown as
          first name and last initial only.
        </p>
      </div>

      {entries.length > 1 && (
        <div>
          <label
            htmlFor="feedback-course"
            className="text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium"
          >
            Course
          </label>
          <select
            id="feedback-course"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            disabled={isBusy}
            className={FIELD_CLASS}
          >
            {entries.map((entry) => (
              <option key={entry.course.id} value={entry.course.id}>
                {entry.course.title}
              </option>
            ))}
          </select>
        </div>
      )}
      {entries.length === 1 && (
        <p className="text-xs text-muted">
          Course: <span className="font-medium text-ink">{entries[0].course.title}</span>
        </p>
      )}

      <StarRating value={rating} onChange={setRating} disabled={isBusy} />

      <div>
        <label
          htmlFor="feedback-comment"
          className="text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium"
        >
          Comment (optional)
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={isBusy}
          maxLength={MAX_COMMENT_LENGTH}
          rows={4}
          placeholder="What did you like? What could be better?"
          className={`${FIELD_CLASS} resize-y`}
        />
        <p className="mt-1 text-right text-[11px] text-muted">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        {selected?.feedback ? (
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-clay disabled:opacity-60 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleteMutation.isPending ? "Removing..." : "Remove feedback"}
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper text-xs font-sans font-medium uppercase tracking-widest px-6 py-3 rounded-full shadow-soft transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          {submitMutation.isPending
            ? "Saving..."
            : selected?.feedback
              ? "Update feedback"
              : "Submit feedback"}
        </button>
      </div>
    </form>
  );
}
