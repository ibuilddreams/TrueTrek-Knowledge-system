"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, Edit3, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createAdminDrillSchedule, updateAdminDrillSchedule } from "@/services/dailyDrillService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const VIDEO_ACCEPT = ".mp4,.mov,.webm,.mkv,.avi";

const INITIAL_FORM = {
  title: "",
  description: "",
  scheduled_date: "",
  reward_points: "",
  passing_score_percent: "60",
  video_url: "",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function sanitizeIntegerInput(rawValue) {
  return rawValue.replace(/[^0-9]/g, "");
}

export default function DailyDrillScheduleFormModal({ isOpen, onClose, onSaved, schedule }) {
  const isEditMode = Boolean(schedule);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [videoMode, setVideoMode] = useState("LINK");
  const [file, setFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: (formData) => createAdminDrillSchedule(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-daily-drills"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => updateAdminDrillSchedule(id, formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-daily-drills"] }),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLocked = isEditMode && schedule?.scheduled_date < new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setFile(null);
    if (schedule) {
      setForm({
        title: schedule.title || "",
        description: schedule.description || "",
        scheduled_date: schedule.scheduled_date || "",
        reward_points: String(schedule.reward_points ?? ""),
        passing_score_percent: String(schedule.passing_score_percent ?? "60"),
        video_url: schedule.video_url || "",
      });
      setVideoMode(schedule.video_url ? "LINK" : "UPLOAD");
    } else {
      setForm(INITIAL_FORM);
      setVideoMode("LINK");
    }
  }, [isOpen, schedule]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setFieldErrors((prev) => ({ ...prev, file: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const points = Number(form.reward_points);
    const passing = Number(form.passing_score_percent);

    const errors = {};
    if (!title) errors.title = "Title is required.";
    if (!form.scheduled_date) errors.scheduled_date = "Scheduled date is required.";
    if (!Number.isFinite(points) || points <= 0) errors.reward_points = "Reward points must be greater than zero.";
    if (!Number.isFinite(passing) || passing < 0 || passing > 100) {
      errors.passing_score_percent = "Passing score must be between 0 and 100.";
    }
    if (videoMode === "LINK" && !form.video_url.trim() && !schedule?.file_url) {
      errors.video_url = "A video URL is required.";
    }
    if (videoMode === "UPLOAD" && !file && !schedule?.file_url) {
      errors.file = "A video file is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", form.description.trim());
    formData.append("scheduled_date", form.scheduled_date);
    formData.append("reward_points", String(points));
    formData.append("passing_score_percent", String(passing));

    if (videoMode === "LINK") {
      if (form.video_url.trim()) formData.append("video_url", form.video_url.trim());
    } else if (file) {
      formData.append("file", file);
    }

    try {
      const response = isEditMode
        ? await updateMutation.mutateAsync({ id: schedule.id, formData })
        : await createMutation.mutateAsync(formData);
      toastSuccess(response?.message || `Daily Drill ${isEditMode ? "updated" : "created"} successfully.`);
      onSaved?.(response?.data);
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
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} Daily Drill.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : Calendar}
      title={isEditMode ? "Edit Daily Drill" : "Schedule Daily Drill"}
      subtitle={
        isLocked
          ? "This Daily Drill's date has already passed and can no longer be edited."
          : "Upload a video and schedule it for a future date."
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            disabled={isSubmitting || isLocked}
            placeholder="e.g. Handling Difficult Feedback"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isSubmitting || isLocked}
            placeholder="What this drill covers"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Video Source</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={() => setVideoMode("LINK")}
              disabled={isSubmitting || isLocked}
              className={`py-2.5 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider border transition ${
                videoMode === "LINK" ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-stone-50 border-stone-200 text-stone-500"
              }`}
            >
              Video Link
            </button>
            <button
              type="button"
              onClick={() => setVideoMode("UPLOAD")}
              disabled={isSubmitting || isLocked}
              className={`py-2.5 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider border transition ${
                videoMode === "UPLOAD" ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-stone-50 border-stone-200 text-stone-500"
              }`}
            >
              Upload File
            </button>
          </div>

          {videoMode === "LINK" ? (
            <input
              key="video-url-input"
              type="text"
              value={form.video_url}
              onChange={updateField("video_url")}
              disabled={isSubmitting || isLocked}
              placeholder="https://..."
              className={FIELD_CLASS}
              autoComplete="off"
            />
          ) : (
            <input
              key="video-file-input"
              type="file"
              accept={VIDEO_ACCEPT}
              onChange={handleFileChange}
              disabled={isSubmitting || isLocked}
              className={FIELD_CLASS}
            />
          )}
          {schedule?.file_url && !file && (
            <p className="text-[11px] font-mono text-stone-500 mt-2">
              Current file:{" "}
              <a href={schedule.file_url} target="_blank" rel="noreferrer" className="text-amber-700 underline">
                view
              </a>{" "}
              — leave empty to keep it.
            </p>
          )}
          {(fieldErrors.video_url || fieldErrors.file) && (
            <p className={ERROR_CLASS}>{fieldErrors.video_url || fieldErrors.file}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>Scheduled Date</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={updateField("scheduled_date")}
              disabled={isSubmitting || isLocked}
              className={FIELD_CLASS}
            />
            {fieldErrors.scheduled_date && <p className={ERROR_CLASS}>{fieldErrors.scheduled_date}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Reward Points</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.reward_points}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, reward_points: sanitizeIntegerInput(event.target.value) }));
                setFieldErrors((prev) => ({ ...prev, reward_points: null }));
              }}
              disabled={isSubmitting || isLocked}
              placeholder="100"
              className={FIELD_CLASS}
            />
            {fieldErrors.reward_points && <p className={ERROR_CLASS}>{fieldErrors.reward_points}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Passing Score %</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.passing_score_percent}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, passing_score_percent: sanitizeIntegerInput(event.target.value) }));
                setFieldErrors((prev) => ({ ...prev, passing_score_percent: null }));
              }}
              disabled={isSubmitting || isLocked}
              placeholder="60"
              className={FIELD_CLASS}
            />
            {fieldErrors.passing_score_percent && <p className={ERROR_CLASS}>{fieldErrors.passing_score_percent}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          {!isLocked && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {isEditMode ? "Update Drill" : "Create Drill"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
