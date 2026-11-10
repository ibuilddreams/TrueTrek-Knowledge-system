"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, Mic, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import MultiSelect from "@/components/ui/MultiSelect";
import { createSession, getSpeakers, updateSession } from "@/services/liveSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

// Mirrors live_sessions.models.LiveSession.MeetingMethod. AGORA is first and
// is the default because the session now runs here, in the portals — the rest
// are still offered for a guest who insists on their own room, and for the
// sessions already scheduled on them.
const MEETING_METHOD_OPTIONS = [
  { value: "AGORA", label: "Cool Nerds Live Audio (in the portal)" },
  { value: "ZOOM", label: "Zoom" },
  { value: "GOOGLE_MEET", label: "Google Meet" },
  { value: "TEAMS", label: "Microsoft Teams" },
  { value: "X_SPACES", label: "X Spaces" },
  { value: "DISCORD", label: "Discord Stage" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CANCELLED", label: "Cancelled" },
];

// Mirrors live_sessions.models.LiveSession.AudienceAccess. It decides the role
// inside every Agora token the room mints, which is why it is a saved setting
// rather than something the room decides in the browser — a student who
// arrives after the floor was opened has to turn up able to speak.
const AUDIENCE_ACCESS_OPTIONS = [
  { value: "LISTEN_ONLY", label: "Hosts and guests only" },
  { value: "EVERYONE", label: "Everyone can unmute" },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  topic: "",
  talking_points: "",
  scheduled_at: "",
  duration_minutes: "60",
  meeting_method: "AGORA",
  meeting_url: "",
  audience_access: "LISTEN_ONLY",
  takes_notes: true,
  capacity: "",
  status: "SCHEDULED",
  recording_url: "",
  recap: "",
  cancellation_reason: "",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function sanitizeIntegerInput(rawValue) {
  return rawValue.replace(/[^0-9]/g, "");
}

/**
 * <input type="datetime-local"> speaks local wall-clock time with no zone,
 * while the API speaks ISO instants. These two helpers are the only place
 * that conversion happens, so a session can't be saved an hour off.
 */
function isoToLocalInput(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function localInputToIso(localValue) {
  if (!localValue) return null;
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function LiveSessionFormModal({ isOpen, onClose, onSaved, session }) {
  const isEditMode = Boolean(session);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [speakerIds, setSpeakerIds] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const speakerQuery = useQuery({
    queryKey: ["live-session-speakers"],
    queryFn: async () => {
      const response = await getSpeakers({ pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });

  const speakerOptions = (speakerQuery.data || []).map((speaker) => ({
    value: speaker.id,
    label: speaker.headline ? `${speaker.name} — ${speaker.headline}` : speaker.name,
  }));

  const createMutation = useMutation({
    mutationFn: (payload) => createSession(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-live-sessions"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateSession(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-live-sessions"] }),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    if (session) {
      setForm({
        title: session.title || "",
        description: session.description || "",
        topic: session.topic || "",
        talking_points: (session.talking_points || []).join("\n"),
        scheduled_at: isoToLocalInput(session.scheduled_at),
        duration_minutes: String(session.duration_minutes ?? "60"),
        meeting_method: session.meeting_method || "AGORA",
        meeting_url: session.meeting_url || "",
        audience_access: session.audience_access || "LISTEN_ONLY",
        takes_notes: session.takes_notes !== false,
        capacity: session.capacity != null ? String(session.capacity) : "",
        status: session.status || "SCHEDULED",
        recording_url: session.recording_url || "",
        recap: session.recap || "",
        cancellation_reason: session.cancellation_reason || "",
      });
      setSpeakerIds((session.speakers || []).map((speaker) => speaker.id));
    } else {
      setForm(INITIAL_FORM);
      setSpeakerIds([]);
    }
  }, [isOpen, session]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateIntegerField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: sanitizeIntegerInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Whether this session runs in the portals or on somebody else's link. It
  // is the one choice on this form that changes what the rest of it means:
  // a hosted session has no join link, and has a room with a floor to open.
  const isHostedHere = form.meeting_method === "AGORA";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const scheduledAt = localInputToIso(form.scheduled_at);
    const duration = Number(form.duration_minutes);

    const errors = {};
    if (!title) errors.title = "Title is required.";
    if (!scheduledAt) errors.scheduled_at = "Pick a date and time for this session.";
    if (!Number.isFinite(duration) || duration < 5) {
      errors.duration_minutes = "A session must run for at least 5 minutes.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      title,
      description: form.description.trim(),
      topic: form.topic.trim(),
      talking_points: form.talking_points
        .split("\n")
        .map((point) => point.trim())
        .filter(Boolean),
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      meeting_method: form.meeting_method,
      // A session hosted here has no link at all — the server clears it too,
      // so a stale Zoom URL can never be handed out for a room that moved.
      meeting_url: isHostedHere ? null : form.meeting_url.trim() || null,
      audience_access: form.audience_access,
      takes_notes: Boolean(form.takes_notes),
      speaker_ids: speakerIds,
      capacity: form.capacity ? Number(form.capacity) : null,
      status: form.status,
      recording_url: form.recording_url.trim() || null,
      recap: form.recap.trim(),
      cancellation_reason: form.cancellation_reason.trim(),
    };

    try {
      const response = isEditMode
        ? await updateMutation.mutateAsync({ id: session.id, payload })
        : await createMutation.mutateAsync(payload);
      toastSuccess(
        response?.message || `Session ${isEditMode ? "updated" : "scheduled"} successfully.`,
      );
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
      toastError(
        getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "schedule"} session.`),
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : Mic}
      title={isEditMode ? "Edit Session" : "Schedule Session"}
      subtitle={
        isEditMode
          ? "Update this War Room Live session."
          : "Schedule a live audio session with guest athletes."
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
            disabled={isSubmitting}
            placeholder="e.g. Building Your Brand in High School"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Topic</label>
          <input
            type="text"
            value={form.topic}
            onChange={updateField("topic")}
            disabled={isSubmitting}
            placeholder="e.g. NIL & Sponsorship"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.topic && <p className={ERROR_CLASS}>{fieldErrors.topic}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isSubmitting}
            placeholder="What this session is about."
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Talking Points (one per line)</label>
          <textarea
            value={form.talking_points}
            onChange={updateField("talking_points")}
            disabled={isSubmitting}
            placeholder={"What worked in high school\nHow I grew my following\nWhat I regret posting"}
            rows={4}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.talking_points && (
            <p className={ERROR_CLASS}>{fieldErrors.talking_points}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Date &amp; Time</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={updateField("scheduled_at")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            {fieldErrors.scheduled_at && <p className={ERROR_CLASS}>{fieldErrors.scheduled_at}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Duration (minutes)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.duration_minutes}
              onChange={updateIntegerField("duration_minutes")}
              disabled={isSubmitting}
              placeholder="60"
              className={FIELD_CLASS}
            />
            {fieldErrors.duration_minutes && (
              <p className={ERROR_CLASS}>{fieldErrors.duration_minutes}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Platform</label>
            <select
              value={form.meeting_method}
              onChange={updateField("meeting_method")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {MEETING_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.meeting_method && <p className={ERROR_CLASS}>{fieldErrors.meeting_method}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Capacity (blank = unlimited)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.capacity}
              onChange={updateIntegerField("capacity")}
              disabled={isSubmitting}
              placeholder="Unlimited"
              className={FIELD_CLASS}
            />
            {fieldErrors.capacity && <p className={ERROR_CLASS}>{fieldErrors.capacity}</p>}
          </div>
        </div>

        {isHostedHere ? (
          <>
            <div>
              <label className={LABEL_CLASS}>Who can speak</label>
              <select
                value={form.audience_access}
                onChange={updateField("audience_access")}
                disabled={isSubmitting}
                className={FIELD_CLASS}
              >
                {AUDIENCE_ACCESS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-light text-muted mt-1.5">
                You can open and close the floor from inside the room at any
                point, without editing the session.
              </p>
              {fieldErrors.audience_access && (
                <p className={ERROR_CLASS}>{fieldErrors.audience_access}</p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 px-4 py-3 bg-porcelain border border-line rounded-xl cursor-pointer hover:border-pine/40 transition-colors">
                <input
                  type="checkbox"
                  checked={form.takes_notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, takes_notes: event.target.checked }))
                  }
                  disabled={isSubmitting}
                  className="mt-0.5 w-4 h-4 accent-pine cursor-pointer"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-mono text-ink">
                    Take AI notes on this session
                  </span>
                  <span className="block text-[11px] font-light text-muted mt-0.5 leading-relaxed">
                    The room is recorded while it runs and written up
                    afterwards — a summary, what was covered, the key points
                    and anything the guest told people to go and do. Everyone
                    in the room is shown that it is on, and everybody who was
                    there is emailed the notes. Leave it unticked and nothing
                    starts by itself — you can still start and stop the notes
                    from inside the room.
                  </span>
                </span>
              </label>
            </div>
          </>
        ) : (
          <div>
            <label className={LABEL_CLASS}>Join Link</label>
            <input
              type="url"
              value={form.meeting_url}
              onChange={updateField("meeting_url")}
              disabled={isSubmitting}
              placeholder="https://zoom.us/j/..."
              className={FIELD_CLASS}
              autoComplete="off"
            />
            <p className="text-[11px] font-light text-muted mt-1.5">
              Released to students only once the room opens — 15 minutes before the start time.
            </p>
            {fieldErrors.meeting_url && <p className={ERROR_CLASS}>{fieldErrors.meeting_url}</p>}
          </div>
        )}

        <MultiSelect
          size="lg"
          label="Speakers"
          placeholder="Select speakers"
          searchPlaceholder="Search speakers..."
          options={speakerOptions}
          values={speakerIds}
          onChange={setSpeakerIds}
          loading={speakerQuery.isPending}
          disabled={isSubmitting}
          emptyLabel="No speakers added yet."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={form.status}
              onChange={updateField("status")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.status && <p className={ERROR_CLASS}>{fieldErrors.status}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Recording Link (after)</label>
            <input
              type="url"
              value={form.recording_url}
              onChange={updateField("recording_url")}
              disabled={isSubmitting}
              placeholder="https://..."
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.recording_url && <p className={ERROR_CLASS}>{fieldErrors.recording_url}</p>}
          </div>
        </div>

        {form.status === "CANCELLED" && (
          <div>
            <label className={LABEL_CLASS}>Cancellation Reason</label>
            <input
              type="text"
              value={form.cancellation_reason}
              onChange={updateField("cancellation_reason")}
              disabled={isSubmitting}
              placeholder="Shown to students who already RSVP'd."
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.cancellation_reason && (
              <p className={ERROR_CLASS}>{fieldErrors.cancellation_reason}</p>
            )}
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>Recap (after the session)</label>
          <textarea
            value={form.recap}
            onChange={updateField("recap")}
            disabled={isSubmitting}
            placeholder="Key takeaways, so a student who missed it still gets the value."
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.recap && <p className={ERROR_CLASS}>{fieldErrors.recap}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-porcelain text-ink text-sm font-semibold font-mono rounded-full tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-line shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper text-sm font-semibold font-mono rounded-full tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Updating..." : "Scheduling..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Update Session" : "Schedule Session"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
