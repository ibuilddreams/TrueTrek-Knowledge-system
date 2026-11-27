"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Gavel, Loader2 } from "lucide-react";
import {
  getAdminTeacherApplication,
  reviewTeacherApplication,
} from "@/services/teacherOnboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import { APPLICATION_STATUS } from "@/constants/teacherOnboarding";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import ApplicationSummary from "@/components/features/teachers/onboarding/ApplicationSummary";

// The four decisions an admin can record. DRAFT is absent because an
// unsubmitted application isn't theirs to touch, and the server refuses it.
const DECISION_OPTIONS = [
  {
    value: APPLICATION_STATUS.UNDER_REVIEW,
    label: "Under review — I'm looking at this",
    requiresNotes: false,
  },
  {
    value: APPLICATION_STATUS.CHANGES_REQUESTED,
    label: "Request changes — send it back to them",
    requiresNotes: true,
  },
  {
    value: APPLICATION_STATUS.APPROVED,
    label: "Approve — open their portal",
    requiresNotes: false,
  },
  {
    value: APPLICATION_STATUS.REJECTED,
    label: "Reject — turn the application down",
    requiresNotes: true,
  },
];

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";
const LABEL_CLASS =
  "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 text-sm py-1.5">
      <span className="text-cn-p-ink-2 font-light shrink-0">{label}</span>
      <span className="text-cn-p-ink font-medium text-right truncate">{value}</span>
    </div>
  );
}

/**
 * One teacher application, in full, with the decision controls under it.
 *
 * The row in the queue table is a flattened summary and carries no documents,
 * so the modal fetches the detail itself rather than rendering a half-row —
 * and renders it through the same `ApplicationSummary` the applicant saw, so
 * a reviewer is judging what was actually sent.
 */
export default function TeacherOnboardingDetailModal({ isOpen, onClose, applicationId }) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState(APPLICATION_STATUS.UNDER_REVIEW);
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["teacher-onboarding", "admin", applicationId],
    queryFn: async () => (await getAdminTeacherApplication(applicationId))?.data,
    enabled: isOpen && Boolean(applicationId),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload) => reviewTeacherApplication(applicationId, payload),
  });

  useEffect(() => {
    if (!isOpen) return;
    setDecision(APPLICATION_STATUS.UNDER_REVIEW);
    setNotes("");
    setFieldError("");
  }, [isOpen, applicationId]);

  const isSubmitting = reviewMutation.isPending;
  const isApproved = data?.status === APPLICATION_STATUS.APPROVED;
  const isDraft = data?.status === APPLICATION_STATUS.DRAFT;
  const requiresNotes = DECISION_OPTIONS.find(
    (option) => option.value === decision
  )?.requiresNotes;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSave = async () => {
    const trimmedNotes = notes.trim();
    if (requiresNotes && !trimmedNotes) {
      setFieldError("Explain your decision — the teacher reads this note.");
      return;
    }

    try {
      const response = await reviewMutation.mutateAsync({
        status: decision,
        reviewNotes: trimmedNotes,
      });
      // Prefix match: this one call refreshes the queue pages, the summary
      // counts and this application's own detail query.
      await queryClient.invalidateQueries({ queryKey: ["teacher-onboarding", "admin"] });
      toastSuccess(response?.message || "Application updated successfully.");
      handleClose();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "Unable to update this application.");
      setFieldError(message);
      toastError(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Gavel}
      title={data?.teacher?.name || "Teacher application"}
      subtitle={data?.teacher?.email || "Review this application"}
      maxWidth="max-w-3xl"
    >
      {isLoading && <Loader tone="cobalt" label="Loading application..." />}

      {isError && (
        <p className="text-sm text-cn-p-ink-2 font-light py-6 text-center">
          {getApiErrorMessage(error, "Unable to load this application.")}
        </p>
      )}

      {data && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-cn-p-ink-2 font-semibold">
              {data.credentials?.length || 0} document
              {(data.credentials?.length || 0) === 1 ? "" : "s"}
            </span>
            <StatusBadge tone="cobalt" size="lg" status={data.status} />
          </div>

          <div className="border-t border-cn-p-line pt-3">
            <InfoRow label="Submitted" value={formatDateTime(data.submitted_at)} />
            <InfoRow label="Last updated" value={formatDateTime(data.updated_at)} />
            <InfoRow label="Reviewed by" value={data.reviewed_by?.name} />
            <InfoRow label="Reviewed" value={formatDateTime(data.reviewed_at)} />
          </div>

          {data.review_notes && (
            <div className="p-4 rounded-xl bg-cn-p-page border border-cn-p-line">
              <p className="text-[10px] font-sans text-cn-p-ink-2 font-medium mb-1.5">
                Previous review notes
              </p>
              <p className="text-sm text-cn-p-ink font-light leading-relaxed whitespace-pre-wrap">
                {data.review_notes}
              </p>
            </div>
          )}

          <div className="border-t border-cn-p-line pt-1">
            <ApplicationSummary application={data} withDocuments />
          </div>

          {isApproved ? (
            <div className="flex items-center gap-2 text-sm text-cn-p-ok bg-cn-p-ok-bg border border-cn-p-ok-bg rounded-xl p-4">
              <Check className="w-4 h-4 shrink-0" />
              This teacher has been approved. To withdraw their access, suspend the account from
              Admin → Teachers.
            </div>
          ) : isDraft ? (
            <div className="text-sm text-cn-p-ink-2 font-light bg-cn-p-page border border-cn-p-line rounded-xl p-4">
              This application hasn't been submitted yet, so there's nothing to decide on. It
              will appear in the queue as soon as the teacher sends it.
            </div>
          ) : (
            <div className="border-t border-cn-p-line pt-5 space-y-4">
              <div>
                <label htmlFor="onboarding-decision" className={LABEL_CLASS}>
                  Decision
                </label>
                <select
                  id="onboarding-decision"
                  value={decision}
                  onChange={(event) => {
                    setDecision(event.target.value);
                    setFieldError("");
                  }}
                  disabled={isSubmitting}
                  className={`${FIELD_CLASS} cn-p-select`}
                >
                  {DECISION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="onboarding-review-notes" className={LABEL_CLASS}>
                  Notes to the teacher {requiresNotes && <span className="text-cn-p-bad">*</span>}
                </label>
                <textarea
                  id="onboarding-review-notes"
                  value={notes}
                  onChange={(event) => {
                    setNotes(event.target.value);
                    setFieldError("");
                  }}
                  disabled={isSubmitting}
                  rows={4}
                  maxLength={4000}
                  placeholder="The teacher reads this word for word, and it is emailed to them."
                  className={`${FIELD_CLASS} resize-none`}
                />
                {fieldError && (
                  <p className="text-[11px] text-cn-p-bad mt-1">{fieldError}</p>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Gavel className="w-3.5 h-3.5" />
                      Record decision
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
