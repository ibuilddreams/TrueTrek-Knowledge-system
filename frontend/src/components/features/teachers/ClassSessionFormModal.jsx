"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Video, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { getTeacherAssignedCourses } from "@/services/teacherCoursesService";
import {
  createClassSession,
  updateClassSession,
} from "@/services/classSessionsService";
import { toDateTimeLocalValue } from "@/components/features/classroom/classSessionUtils";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = {
  course: "",
  title: "",
  description: "",
  agenda: "",
  scheduledAt: "",
  durationMinutes: "60",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function extractFieldErrors(error) {
  const apiFieldErrors = error?.data?.data;
  if (apiFieldErrors && typeof apiFieldErrors === "object") {
    const mapped = {};
    Object.entries(apiFieldErrors).forEach(([key, value]) => {
      mapped[key] = Array.isArray(value) ? value[0] : String(value);
    });
    return mapped;
  }
  return null;
}

/**
 * Schedule or edit a live class.
 *
 * The course can only be chosen when creating: moving an existing class onto
 * another course would change who is expected to attend it, under students
 * who have already been told about it, so the backend refuses it too.
 */
export default function ClassSessionFormModal({ isOpen, onClose, editingSession }) {
  const isEditMode = Boolean(editingSession);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ["teacherAssignedCourses", "class-picker"],
    queryFn: async () => {
      const response = await getTeacherAssignedCourses();
      return response?.data?.courses || [];
    },
    enabled: isOpen && !isEditMode,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createClassSession(payload),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateClassSession(id, payload),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    if (editingSession) {
      setForm({
        course: String(editingSession.course ?? ""),
        title: editingSession.title || "",
        description: editingSession.description || "",
        agenda: (editingSession.agenda || []).join("\n"),
        scheduledAt: toDateTimeLocalValue(editingSession.scheduled_at),
        durationMinutes: String(editingSession.duration_minutes ?? 60),
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setFieldErrors({});
  }, [isOpen, editingSession]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const duration = Number(form.durationMinutes);
    const errors = {};

    if (!isEditMode && !form.course) errors.course = "Pick the course this class is for.";
    if (!title) errors.title = "Give the class a title.";
    if (!form.scheduledAt) errors.scheduled_at = "Pick a start date and time.";
    if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
      errors.duration_minutes = "A class runs between 5 minutes and 8 hours.";
    }
    // The server rejects a past start too; checking here saves a round trip
    // and points at the field instead of a banner.
    if (form.scheduledAt && new Date(form.scheduledAt).getTime() <= Date.now()) {
      errors.scheduled_at = "Pick a start time in the future.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      title,
      description: form.description.trim(),
      agenda: form.agenda
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      // A `datetime-local` value has no timezone; the teacher means their own
      // clock, so it's converted here rather than being sent as a naive string.
      scheduled_at: new Date(form.scheduledAt).toISOString(),
      duration_minutes: duration,
    };
    if (!isEditMode) payload.course = Number(form.course);

    try {
      const response = isEditMode
        ? await updateMutation.mutateAsync({ id: editingSession.id, payload })
        : await createMutation.mutateAsync(payload);

      queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      toastSuccess(
        response?.message || `Class ${isEditMode ? "updated" : "scheduled"} successfully.`,
      );
      onClose();
    } catch (error) {
      const mapped = extractFieldErrors(error);
      if (mapped) setFieldErrors(mapped);
      toastError(
        getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "schedule"} this class.`),
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Video}
      title={isEditMode ? "Edit Live Class" : "Schedule a Live Class"}
      subtitle={
        isEditMode
          ? editingSession?.title
          : "Everyone enrolled on the course is invited and notified"
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEditMode ? (
          <div>
            <label className={LABEL_CLASS}>Course</label>
            <p className="px-4 py-3 bg-porcelain border border-line rounded-xl text-sm font-mono text-muted">
              {editingSession.course_code} · {editingSession.course_title}
            </p>
            <p className="mt-1.5 text-[11px] font-mono text-muted">
              A class stays with the course it was announced to.
            </p>
          </div>
        ) : (
          <div>
            <SearchableSelect
              label="Course"
              placeholder="Select one of your courses"
              searchPlaceholder="Search your courses..."
              options={courses.map((course) => ({
                value: String(course.id),
                label: `${course.code} — ${course.title}`,
              }))}
              value={form.course}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, course: value }));
                setFieldErrors((prev) => ({ ...prev, course: null }));
              }}
              loading={isCoursesLoading}
              disabled={isSubmitting}
              emptyLabel="You aren't assigned to any courses yet."
              size="lg"
            />
            {fieldErrors.course && <p className={ERROR_CLASS}>{fieldErrors.course}</p>}
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>Class Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            disabled={isSubmitting}
            placeholder="e.g. Film Review: Week 4"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Starts</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={updateField("scheduledAt")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            <p className="mt-1.5 text-[11px] font-mono text-muted">Your local time</p>
            {fieldErrors.scheduled_at && (
              <p className={ERROR_CLASS}>{fieldErrors.scheduled_at}</p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Duration (minutes)</label>
            <input
              type="number"
              min="5"
              max="480"
              step="5"
              value={form.durationMinutes}
              onChange={updateField("durationMinutes")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            <p className="mt-1.5 text-[11px] font-mono text-muted">
              The room opens 15 min early for students
            </p>
            {fieldErrors.duration_minutes && (
              <p className={ERROR_CLASS}>{fieldErrors.duration_minutes}</p>
            )}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isSubmitting}
            placeholder="What this class is about"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Agenda</label>
          <textarea
            value={form.agenda}
            onChange={updateField("agenda")}
            disabled={isSubmitting}
            placeholder={"One point per line\nUp to 10 lines"}
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.agenda && <p className={ERROR_CLASS}>{fieldErrors.agenda}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-porcelain text-ink text-sm font-semibold font-mono rounded-full tracking-wider transition-all flex items-center justify-center gap-2 border border-line shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper text-sm font-semibold font-mono rounded-full tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Saving..." : "Scheduling..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Save Changes" : "Schedule Class"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
