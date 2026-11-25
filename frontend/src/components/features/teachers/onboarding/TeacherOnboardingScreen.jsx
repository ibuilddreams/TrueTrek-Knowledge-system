"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { GraduationCap, RefreshCw } from "lucide-react";
import { getMyTeacherApplication } from "@/services/teacherOnboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { ROUTES } from "@/constants/routes";
import { EDITABLE_STATUSES, APPLICATION_STATUS } from "@/constants/teacherOnboarding";
import AccountMenu from "@/components/ui/AccountMenu";
import Loader from "@/components/ui/Loader";
import TeacherOnboardingWizard from "./TeacherOnboardingWizard";
import ApplicationStatusPanel from "./ApplicationStatusPanel";
import ReviewNotesBanner from "./ReviewNotesBanner";
import { TEACHER_APPLICATION_QUERY_KEY } from "./queryKeys";

/**
  * What a teacher sees instead of the Faculty Portal until their application is
   * approved: the wizard while it is theirs to edit, and a read-only panel while
   * it is with the review team or after a decision went against them.
   */
export default function TeacherOnboardingScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: TEACHER_APPLICATION_QUERY_KEY,
    queryFn: async () => (await getMyTeacherApplication())?.data,
  });

  if (isLoading) {
    return <Loader tone="cobalt" label="Loading your application..." />;
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto text-center p-8 bg-cn-p-card border border-cn-p-line rounded-cn-p">
        <p className="text-sm text-cn-p-ink-2 font-light mb-5">
          {getApiErrorMessage(error, "Unable to load your application.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-sm font-semibold rounded-cn-p-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  const isEditable = EDITABLE_STATUSES.includes(data.status);

  return (
    <div
      id="teacher-onboarding-view"
      className="py-10 px-4 sm:px-6 md:px-10 max-w-4xl mx-auto min-h-[85vh] font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 mb-8 border-b border-cn-p-line">
        <div className="flex items-center gap-4 min-w-0">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-cn-p bg-cn-p-soft text-cn-p-soft-ink">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <span className="mb-1.5 block text-xs font-semibold tracking-[0.1em] text-cn-p-ink-2">
            Faculty onboarding
          </span>
          <h1 className="text-[26px] leading-[1.2] font-bold tracking-[-0.015em] text-cn-p-ink">
            Apply to teach
          </h1>
          <p className="text-sm text-cn-p-ink-2 font-light mt-2 leading-snug">
            Complete your application and our team will review it before your portal opens.
          </p>
        </div>
        </div>

        {/* Without this the application screen is a room with no door: it
            replaces the portal, so its header is the only place a teacher
            part-way through can reach their profile or sign out. */}
        <div className="relative z-40 flex items-center gap-3 shrink-0">
          <AccountMenu
            onProfile={() => router.push(ROUTES.PROFILE)}
            onMessages={() => router.push(ROUTES.MESSAGES)}
            size="lg"
          />
        </div>
      </div>

      {isEditable ? (
        <div className="space-y-6">
          {data.status === APPLICATION_STATUS.CHANGES_REQUESTED && (
            <ReviewNotesBanner application={data} />
          )}
          <TeacherOnboardingWizard
            application={data}
            queryKey={TEACHER_APPLICATION_QUERY_KEY}
          />
        </div>
      ) : (
        <ApplicationStatusPanel application={data} />
      )}
    </div>
  );
}
