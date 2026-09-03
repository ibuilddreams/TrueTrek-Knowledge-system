"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, FileWarning, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { updateTeacherRequest } from "@/services/teacherRequestsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-stone-500 font-light">{label}</span>
      <span className="text-stone-800 font-medium text-right">{value}</span>
    </div>
  );
}

export default function TeacherRequestDetailModal({ isOpen, onClose, request }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("PENDING");
  const [resolutionDescription, setResolutionDescription] = useState("");
  const [fieldError, setFieldError] = useState("");

  const updateMutation = useMutation({
    mutationFn: (payload) => updateTeacherRequest(request.id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-requests", "admin"] }),
  });

  const isSubmitting = updateMutation.isPending;
  const isCompleted = request?.status === "COMPLETED";

  useEffect(() => {
    if (!isOpen || !request) return;
    setStatus(request.status);
    setResolutionDescription(request.resolution_description || "");
    setFieldError("");
  }, [isOpen, request]);

  if (!request) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSave = async () => {
    const trimmedResolution = resolutionDescription.trim();

    if (status === "COMPLETED" && !trimmedResolution) {
      setFieldError("A completion description is required when marking a request as completed.");
      return;
    }

    try {
      const response = await updateMutation.mutateAsync({
        status,
        resolution_description: trimmedResolution,
      });
      toastSuccess(response?.message || "Request updated successfully.");
      handleClose();
    } catch (error) {
      setFieldError(getApiErrorMessage(error, "Unable to update request."));
      toastError(getApiErrorMessage(error, "Unable to update request."));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={FileWarning}
      title={request.title}
      subtitle={`Submitted by ${request.teacher?.name || request.teacher?.email || "a teacher"}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
            {request.request_type_display}
          </span>
          <StatusBadge size="lg" status={request.status} />
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-semibold mb-1.5">
            Teacher's Description
          </p>
          <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{request.description}</p>
        </div>

        <div className="border-t border-stone-100 pt-3">
          <InfoRow label="Submitted" value={formatDateTime(request.created_at)} />
          <InfoRow label="Last Updated" value={formatDateTime(request.updated_at)} />
          {request.handled_by && (
            <InfoRow label="Handled By" value={request.handled_by?.name || request.handled_by?.email} />
          )}
          {request.completed_at && (
            <InfoRow label="Completed" value={formatDateTime(request.completed_at)} />
          )}
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <Check className="w-4 h-4 shrink-0" />
            This request has been completed and can no longer be modified.
          </div>
        ) : (
          <div className="border-t border-stone-100 pt-4 space-y-4">
            <div>
              <label className={LABEL_CLASS}>Status</label>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setFieldError("");
                }}
                disabled={isSubmitting}
                className={FIELD_CLASS}
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
                Completion / Fix Description {status === "COMPLETED" && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={resolutionDescription}
                onChange={(event) => {
                  setResolutionDescription(event.target.value);
                  setFieldError("");
                }}
                disabled={isSubmitting}
                placeholder="Explain what was done to resolve this request — the teacher will see this."
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
                className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
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
