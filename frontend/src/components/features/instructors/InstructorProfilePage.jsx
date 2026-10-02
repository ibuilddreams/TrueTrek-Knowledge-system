"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { getInstructor } from "@/services/instructorsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import Loader from "@/components/ui/Loader";
import InstructorAbout from "./InstructorAbout";
import InstructorCourses from "./InstructorCourses";
import InstructorFeedbackSection from "./InstructorFeedbackSection";
import InstructorHero from "./InstructorHero";
import InstructorSkills from "./InstructorSkills";

const BACK_LINK =
  "inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors";

// Public instructor page (/instructors/<id>), opened from the course page.
export default function InstructorProfilePage({ instructorId }) {
  const query = useQuery({
    queryKey: ["instructor", String(instructorId)],
    queryFn: async () => (await getInstructor(instructorId)).data,
    retry: (count, error) => error?.status !== 404 && count < 2,
  });
  const instructor = query.data;

  if (query.isLoading) {
    return (
      <div className="min-h-screen cn-page-bg flex items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading instructor..." />
      </div>
    );
  }

  if (query.isError) {
    const isNotFound = query.error?.status === 404;
    return (
      <div className="min-h-screen cn-page-bg px-6 py-16">
        <div role="alert" className="max-w-3xl mx-auto rounded-card border border-line bg-paper p-8 shadow-soft">
          <h1 className="text-2xl font-serif">
            {isNotFound ? "Instructor not found" : "Unable to load this instructor"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {isNotFound
              ? "This instructor page isn't available. Browse the store to find courses."
              : getApiErrorMessage(query.error, "Please try again.")}
          </p>
          <div className="mt-5 flex items-center gap-4">
            {!isNotFound && (
              <button type="button" onClick={() => query.refetch()} className="text-sm font-semibold text-pine underline">
                Retry
              </button>
            )}
            <Link href={ROUTES.STORE} className={BACK_LINK}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="instructor-profile" className="min-h-screen cn-page-bg text-ink pb-24">
      <InstructorHero instructor={instructor} />
      <div className="max-w-6xl mx-auto px-6">
        <div className={instructor.skills?.length ? "" : "pt-12"}>
          <InstructorSkills skills={instructor.skills} />
        </div>
        <div className="mt-14 space-y-16">
          <InstructorAbout instructor={instructor} />
          <InstructorCourses courses={instructor.courses} />
          <InstructorFeedbackSection instructor={instructor} />
        </div>
      </div>
    </div>
  );
}
