"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import {
  submitMyTeacherApplication,
  updateMyTeacherApplication,
  updateMyTeacherApplicationVideo,
} from "@/services/teacherOnboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  MAX_VIDEO_SIZE_MB,
  MIN_BIO_LENGTH,
  MIN_TEACHING_STATEMENT_LENGTH,
  ONBOARDING_STEPS,
} from "@/constants/teacherOnboarding";
import {
  TEACHER_APPLICATION_QUERY_KEY,
  TEACHER_ONBOARDING_STATUS_QUERY_KEY,
} from "./queryKeys";
import OnboardingStepper from "./OnboardingStepper";
import ProfileStep from "./ProfileStep";
import ExpertiseStep from "./ExpertiseStep";
import CredentialsStep from "./CredentialsStep";
import IntroVideoStep from "./IntroVideoStep";
import ReviewSubmitStep from "./ReviewSubmitStep";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "./fieldStyles";

const STEP_COPY = {
  PROFILE: {
    title: "Tell us about you",
    subtitle: "The details students and reviewers see first.",
  },
  EXPERTISE: {
    title: "What you teach",
    subtitle: "The subjects you can take, and how you teach them.",
  },
  CREDENTIALS: {
    title: "Your qualifications",
    subtitle: "Proof of what you have listed, so a reviewer can verify it.",
  },
  VIDEO: {
    title: "Introduce yourself",
    subtitle: "A short video does more than a paragraph ever will.",
  },
  REVIEW: {
    title: "Review and submit",
    subtitle: "Check it over, then send it to the review team.",
  },
};

const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(value);

function toForm(application) {
  return {
    headline: application.headline || "",
    bio: application.bio || "",
    highest_qualification: application.highest_qualification || "",
    years_of_experience:
      application.years_of_experience === null || application.years_of_experience === undefined
        ? ""
        : String(application.years_of_experience),
    linkedin_url: application.linkedin_url || "",
    portfolio_url: application.portfolio_url || "",
    expertise: application.expertise || [],
    teaching_statement: application.teaching_statement || "",
    intro_video_url: application.intro_video_url || "",
  };
}

function stepIndexOf(stepKey) {
  const index = ONBOARDING_STEPS.findIndex((step) => step.key === stepKey);
  return index === -1 ? 0 : index;
}

/**
 * The five-step application a teacher fills in before an admin reviews it.
 *
 * Each step saves as it is left rather than everything at the end, and the
 * step itself is saved with it — so closing the browser and signing in again
 * resumes where they stopped, the same promise `onboarding.OnboardingProgress`
 * makes to students.
 */
export default function TeacherOnboardingWizard({ application, queryKey }) {
  const queryClient = useQueryClient();
  // Lazy initial state on purpose: the application query refetches whenever a
  // document is uploaded, and re-deriving these from it would throw away
  // whatever the teacher had typed on the step they are standing on.
  const [activeIndex, setActiveIndex] = useState(() => stepIndexOf(application.step));
  const [form, setForm] = useState(() => toForm(application));
  const [errors, setErrors] = useState({});
  const [pendingVideo, setPendingVideo] = useState(null);
  const [removeVideo, setRemoveVideo] = useState(false);

  const saveMutation = useMutation({
    mutationFn: ({ multipart, ...payload }) =>
      multipart
        ? updateMyTeacherApplicationVideo(payload)
        : updateMyTeacherApplication(payload),
  });
  const submitMutation = useMutation({ mutationFn: submitMyTeacherApplication });

  const isBusy = saveMutation.isPending || submitMutation.isPending;
  const activeStep = ONBOARDING_STEPS[activeIndex];

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleVideoSelected = (file) => {
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setErrors((previous) => ({
        ...previous,
        intro_video: `That video is larger than ${MAX_VIDEO_SIZE_MB}MB. Trim it or upload it elsewhere and paste the link.`,
      }));
      return;
    }
    setErrors((previous) => ({ ...previous, intro_video: undefined }));
    setPendingVideo(file);
    setRemoveVideo(false);
  };

  const handleRemoveVideo = () => {
    setPendingVideo(null);
    setRemoveVideo(true);
  };

  // Only the fields the current step owns are sent, so saving one step can
  // never overwrite another with stale state the teacher has since changed.
  const validateStep = () => {
    const nextErrors = {};

    if (activeStep.key === "PROFILE") {
      if (!form.headline.trim()) nextErrors.headline = "A headline is required.";
      if (form.bio.trim().length < MIN_BIO_LENGTH) {
        nextErrors.bio = `Write at least ${MIN_BIO_LENGTH} characters.`;
      }
      if (!form.highest_qualification) {
        nextErrors.highest_qualification = "Choose your highest qualification.";
      }
      const years = Number(form.years_of_experience);
      if (form.years_of_experience === "" || !Number.isInteger(years) || years < 0 || years > 70) {
        nextErrors.years_of_experience = "Enter a whole number between 0 and 70.";
      }
      if (form.linkedin_url.trim() && !isHttpUrl(form.linkedin_url.trim())) {
        nextErrors.linkedin_url = "Enter a full URL starting with http:// or https://";
      }
      if (form.portfolio_url.trim() && !isHttpUrl(form.portfolio_url.trim())) {
        nextErrors.portfolio_url = "Enter a full URL starting with http:// or https://";
      }
    }

    if (activeStep.key === "EXPERTISE") {
      if (form.expertise.length === 0) {
        nextErrors.expertise = "Add at least one subject.";
      }
      if (form.teaching_statement.trim().length < MIN_TEACHING_STATEMENT_LENGTH) {
        nextErrors.teaching_statement = `Write at least ${MIN_TEACHING_STATEMENT_LENGTH} characters.`;
      }
    }

    if (activeStep.key === "VIDEO") {
      const url = form.intro_video_url.trim();
      if (url && !isHttpUrl(url)) {
        nextErrors.intro_video_url = "Enter a full URL starting with http:// or https://";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (nextStepKey) => {
    if (activeStep.key === "PROFILE") {
      return {
        step: nextStepKey,
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        highest_qualification: form.highest_qualification,
        years_of_experience: Number(form.years_of_experience),
        linkedin_url: form.linkedin_url.trim(),
        portfolio_url: form.portfolio_url.trim(),
      };
    }
    if (activeStep.key === "EXPERTISE") {
      return {
        step: nextStepKey,
        expertise: form.expertise,
        teaching_statement: form.teaching_statement.trim(),
      };
    }
    if (activeStep.key === "VIDEO") {
      return {
        multipart: true,
        file: pendingVideo,
        remove: removeVideo,
        fields: { step: nextStepKey, intro_video_url: form.intro_video_url.trim() },
      };
    }
    // Credentials save themselves as they are uploaded; only the resume point
    // is left to record.
    return { step: nextStepKey };
  };

  const goToStep = async (index) => {
    if (index === activeIndex) return;

    // Moving backwards never validates — a half-filled step the teacher is
    // stepping away from is exactly what a draft is for.
    if (index < activeIndex) {
      setErrors({});
      setActiveIndex(index);
      return;
    }
    if (!validateStep()) return;

    const nextStepKey = ONBOARDING_STEPS[index].key;
    try {
      await saveMutation.mutateAsync(buildPayload(nextStepKey));
      await queryClient.invalidateQueries({ queryKey });
      setPendingVideo(null);
      setRemoveVideo(false);
      setActiveIndex(index);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to save your application."));
    }
  };

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync();
      // Both queries, not just the application: submitting is what opens the
      // portal, and the gate decides that from the *status* query. Refreshing
      // only the application would leave the teacher looking at a read-only
      // copy of what they just sent, with the portal one stale poll away.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TEACHER_APPLICATION_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TEACHER_ONBOARDING_STATUS_QUERY_KEY }),
      ]);
      toastSuccess("Your application is with the review team.");
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to submit your application."));
    }
  };

  const copy = STEP_COPY[activeStep.key];

  return (
    <div className="space-y-6">
      <div className="p-5 sm:p-6 bg-paper border border-line rounded-card shadow-soft">
        <OnboardingStepper
          steps={ONBOARDING_STEPS}
          activeIndex={activeIndex}
          onStepSelect={goToStep}
          disabled={isBusy}
        />
      </div>

      <div className="p-5 sm:p-7 bg-paper border border-line rounded-card shadow-soft">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-serif font-light text-ink">{copy.title}</h2>
          <p className="text-sm text-muted font-light mt-1">{copy.subtitle}</p>
        </div>

        {activeStep.key === "PROFILE" && (
          <ProfileStep form={form} errors={errors} onChange={updateField} disabled={isBusy} />
        )}
        {activeStep.key === "EXPERTISE" && (
          <ExpertiseStep form={form} errors={errors} onChange={updateField} disabled={isBusy} />
        )}
        {activeStep.key === "CREDENTIALS" && (
          <CredentialsStep
            credentials={application.credentials}
            queryKey={queryKey}
            disabled={isBusy}
          />
        )}
        {activeStep.key === "VIDEO" && (
          <IntroVideoStep
            form={form}
            errors={errors}
            onChange={updateField}
            onFileSelected={handleVideoSelected}
            onRemoveFile={handleRemoveVideo}
            uploadedVideoUrl={removeVideo ? null : application.intro_video_file_url}
            uploadedVideoName={application.intro_video_name}
            pendingFile={pendingVideo}
            disabled={isBusy}
          />
        )}
        {activeStep.key === "REVIEW" && (
          <ReviewSubmitStep
            application={application}
            onSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
          />
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-7 mt-7 border-t border-line">
          <button
            type="button"
            onClick={() => goToStep(activeIndex - 1)}
            disabled={activeIndex === 0 || isBusy}
            className={`${SECONDARY_BUTTON_CLASS} inline-flex items-center justify-center gap-2`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {activeIndex < ONBOARDING_STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => goToStep(activeIndex + 1)}
              disabled={isBusy}
              className={PRIMARY_BUTTON_CLASS}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save and Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
