"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { scheduleRedemption } from "@/services/rewardsService";
import { getTeachers } from "@/services/teachersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatPlainTime } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";

const MEETING_METHOD_OPTIONS = [
  { value: "", label: "Select method" },
  { value: "ZOOM", label: "Zoom" },
  { value: "GOOGLE_MEET", label: "Google Meet" },
  { value: "TEAMS", label: "Microsoft Teams" },
  { value: "IN_PERSON", label: "In Person" },
];

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function computeEndTime(startTime, durationMinutes) {
  if (!startTime || !durationMinutes) return null;
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + Number(durationMinutes);
  const endHours = String(Math.floor((totalMinutes / 60) % 24)).padStart(2, "0");
  const endMinutes = String(totalMinutes % 60).padStart(2, "0");
  return `${endHours}:${endMinutes}`;
}

export default function ScheduleRewardModal({ isOpen, onClose, onSaved, redemption }) {
  const queryClient = useQueryClient();
  const isReschedule = redemption?.status === "SCHEDULED";

  const [form, setForm] = useState({
    mentor_id: "", scheduled_date: "", start_time: "", meeting_method: "", meeting_url: "", notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const { data: teachers = [] } = useQuery({
    queryKey: ["admin-teachers-for-mentor-select"],
    queryFn: async () => {
      const response = await getTeachers({ pageSize: 100 });
      // Teacher list responses key the paginated array as "users", not
      // "results" — same quirk as the student admin list (see PROJECT.md §6.1).
      return response?.data?.users || [];
    },
    enabled: isOpen,
  });

  const scheduleMutation = useMutation({
    mutationFn: (payload) => scheduleRedemption(redemption.id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-redemptions"] }),
  });

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    const existing = redemption?.fulfillment;
    setForm({
      mentor_id: existing?.mentor?.id ? String(existing.mentor.id) : "",
      scheduled_date: existing?.scheduled_date || "",
      start_time: existing?.start_time ? existing.start_time.slice(0, 5) : "",
      meeting_method: existing?.meeting_method || "",
      meeting_url: existing?.meeting_url || "",
      notes: existing?.notes || "",
    });
  }, [isOpen, redemption]);

  if (!redemption) return null;

  const durationMinutes = redemption.reward?.duration_minutes;
  const endTimePreview = computeEndTime(form.start_time, durationMinutes);

  const handleClose = () => {
    if (scheduleMutation.isPending) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!form.scheduled_date) errors.scheduled_date = "Date is required.";
    if (!form.start_time) errors.start_time = "Start time is required.";
    if (form.meeting_method && form.meeting_method !== "IN_PERSON" && !form.meeting_url.trim()) {
      errors.meeting_url = "A meeting link is required for an online meeting method.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      scheduled_date: form.scheduled_date,
      start_time: form.start_time,
      meeting_method: form.meeting_method,
      meeting_url: form.meeting_url.trim(),
      notes: form.notes.trim(),
    };
    if (form.mentor_id) payload.mentor_id = Number(form.mentor_id);

    try {
      const response = await scheduleMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Reward ${isReschedule ? "rescheduled" : "scheduled"} successfully.`);
      onSaved?.();
      handleClose();
    } catch (error) {
      const apiFieldErrors = error?.data?.data;
      if (apiFieldErrors && typeof apiFieldErrors === "object") {
        const mapped = {};
        Object.entries(apiFieldErrors).forEach(([key, value]) => {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(mapped);
      }
      toastError(getApiErrorMessage(error, `Unable to ${isReschedule ? "reschedule" : "schedule"} the reward.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Calendar}
      title={isReschedule ? "Reschedule Reward" : "Schedule Reward"}
      subtitle={`${redemption.reward?.name} — ${redemption.student?.name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Mentor</label>
          <select value={form.mentor_id} onChange={updateField("mentor_id")} disabled={scheduleMutation.isPending} className={FIELD_CLASS}>
            <option value="">Unassigned</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Date</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={updateField("scheduled_date")}
              disabled={scheduleMutation.isPending}
              className={FIELD_CLASS}
            />
            {fieldErrors.scheduled_date && <p className={ERROR_CLASS}>{fieldErrors.scheduled_date}</p>}
          </div>
          <div>
            <label className={LABEL_CLASS}>Start Time</label>
            <input
              type="time"
              value={form.start_time}
              onChange={updateField("start_time")}
              disabled={scheduleMutation.isPending}
              className={FIELD_CLASS}
            />
            {fieldErrors.start_time && <p className={ERROR_CLASS}>{fieldErrors.start_time}</p>}
          </div>
        </div>

        {durationMinutes && (
          <p className="text-xs font-mono text-stone-500">
            Duration: {durationMinutes} minutes
            {endTimePreview && ` — ends at ${formatPlainTime(endTimePreview)}`}
          </p>
        )}

        <div>
          <label className={LABEL_CLASS}>Meeting Method</label>
          <select
            value={form.meeting_method}
            onChange={updateField("meeting_method")}
            disabled={scheduleMutation.isPending}
            className={FIELD_CLASS}
          >
            {MEETING_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {form.meeting_method && form.meeting_method !== "IN_PERSON" && (
          <div>
            <label className={LABEL_CLASS}>Meeting Link</label>
            <input
              type="text"
              value={form.meeting_url}
              onChange={updateField("meeting_url")}
              disabled={scheduleMutation.isPending}
              placeholder="https://..."
              className={FIELD_CLASS}
            />
            {fieldErrors.meeting_url && <p className={ERROR_CLASS}>{fieldErrors.meeting_url}</p>}
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>Admin Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={updateField("notes")}
            disabled={scheduleMutation.isPending}
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={scheduleMutation.isPending}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={scheduleMutation.isPending}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
          >
            {scheduleMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isReschedule ? "Reschedule" : "Schedule"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
