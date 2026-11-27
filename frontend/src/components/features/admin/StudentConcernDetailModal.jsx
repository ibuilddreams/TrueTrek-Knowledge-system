"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Loader2, ShieldAlert } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { updateStudentConcern } from "@/services/studentConcernsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";

const ERROR_CLASS = "text-[11px] text-cn-p-bad mt-1";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-cn-p-ink-2 font-light">{label}</span>
      <span className="text-cn-p-ink font-medium text-right">{value}</span>
    </div>
  );
}

export default function StudentConcernDetailModal({ isOpen, onClose, concern }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("PENDING");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [fieldError, setFieldError] = useState("");

  const updateMutation = useMutation({
    mutationFn: (payload) => updateStudentConcern(concern.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-concerns", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
  });

  const isSubmitting = updateMutation.isPending;
  const isResolved = concern?.status === "RESOLVED";

  useEffect(() => {
    if (!isOpen || !concern) return;
    setStatus(concern.status);
    setResolutionNotes(concern.resolution_notes || "");
    setFieldError("");
  }, [isOpen, concern]);

  if (!concern) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSave = async () => {
    const trimmedNotes = resolutionNotes.trim();

    if (status === "RESOLVED" && !trimmedNotes) {
      setFieldError("Resolution notes are required when marking a concern as resolved.");
      return;
    }

    try {
      const response = await updateMutation.mutateAsync({ status, resolution_notes: trimmedNotes });
      toastSuccess(response?.message || "Concern updated successfully.");
      handleClose();
    } catch (error) {
      setFieldError(getApiErrorMessage(error, "Unable to update concern."));
      toastError(getApiErrorMessage(error, "Unable to update concern."));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={ShieldAlert}
      title={`Concern about ${concern.student?.name || "a student"}`}
      subtitle={`Flagged by ${concern.teacher?.name || concern.teacher?.email || "a teacher"}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-cn-p-ink-2 font-semibold">
            {concern.category_display}
          </span>
          <StatusBadge tone="cobalt" size="lg" status={concern.status} />
        </div>

        {concern.requires_admin_attention && (
          <div className="flex items-center gap-2 text-xs text-cn-p-bad bg-cn-p-bad-bg border border-cn-p-bad-bg rounded-lg px-3 py-2">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            Flagged for admin attention
          </div>
        )}

        <div>
          <p className="text-[11px] text-cn-p-ink-2 font-semibold mb-1.5">
            Teacher's description
          </p>
          <p className="text-sm text-cn-p-ink-2 whitespace-pre-wrap leading-relaxed">
            {concern.description}
          </p>
        </div>

        <div className="border-t border-cn-p-line pt-3">
          <InfoRow label="Student" value={concern.student?.email} />
          {concern.course?.title && <InfoRow label="Course" value={concern.course.title} />}
          <InfoRow label="Flagged" value={formatDateTime(concern.created_at)} />
          {concern.handled_by && (
            <InfoRow label="Handled by" value={concern.handled_by?.name || concern.handled_by?.email} />
          )}
          {concern.resolved_at && (
            <InfoRow label="Resolved" value={formatDateTime(concern.resolved_at)} />
          )}
        </div>

        {isResolved ? (
          <div className="flex items-center gap-2 text-sm text-cn-p-ok bg-cn-p-ok-bg border border-cn-p-ok-bg rounded-xl p-4">
            <Check className="w-4 h-4 shrink-0" />
            This concern has been resolved and can no longer be modified.
          </div>
        ) : (
          <div className="border-t border-cn-p-line pt-4 space-y-4">
            <div>
              <label className={LABEL_CLASS}>Status</label>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setFieldError("");
                }}
                disabled={isSubmitting}
                className={`${FIELD_CLASS} cn-p-select`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Resolution Notes {status === "RESOLVED" && <span className="text-cn-p-bad">*</span>}
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(event) => {
                  setResolutionNotes(event.target.value);
                  setFieldError("");
                }}
                disabled={isSubmitting}
                placeholder="Explain how this concern was addressed — the teacher will see this."
                rows={4}
                maxLength={5000}
                className={`${FIELD_CLASS} resize-none`}
              />
              {fieldError && <p className={ERROR_CLASS}>{fieldError}</p>}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
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
                    <Clock3 className="w-3.5 h-3.5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
