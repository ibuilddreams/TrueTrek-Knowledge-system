"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, UserRound, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createSpeaker, updateSpeaker } from "@/services/liveSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = {
  name: "",
  headline: "",
  sport: "",
  school: "",
  graduation_year: "",
  bio: "",
  instagram_handle: "",
  is_active: true,
};

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";

const ERROR_CLASS = "text-[11px] text-cn-p-bad mt-1";

export default function SessionSpeakerFormModal({ isOpen, onClose, onSaved, speaker }) {
  const isEditMode = Boolean(speaker);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [avatarFile, setAvatarFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const invalidateSpeakers = () => {
    queryClient.invalidateQueries({ queryKey: ["live-session-speakers"] });
    queryClient.invalidateQueries({ queryKey: ["admin-live-sessions"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createSpeaker(payload),
    onSuccess: invalidateSpeakers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateSpeaker(id, payload),
    onSuccess: invalidateSpeakers,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setAvatarFile(null);
    setForm(
      speaker
        ? {
            name: speaker.name || "",
            headline: speaker.headline || "",
            sport: speaker.sport || "",
            school: speaker.school || "",
            graduation_year:
              speaker.graduation_year != null ? String(speaker.graduation_year) : "",
            bio: speaker.bio || "",
            instagram_handle: speaker.instagram_handle || "",
            is_active: speaker.is_active ?? true,
          }
        : INITIAL_FORM,
    );
  }, [isOpen, speaker]);

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

    const name = form.name.trim();
    if (!name) {
      setFieldErrors({ name: "Name is required." });
      return;
    }

    // An avatar is a file, so the whole payload goes up as multipart whenever
    // one is attached — the API accepts both shapes.
    let payload;
    if (avatarFile) {
      payload = new FormData();
      payload.append("name", name);
      payload.append("headline", form.headline.trim());
      payload.append("sport", form.sport.trim());
      payload.append("school", form.school.trim());
      if (form.graduation_year) payload.append("graduation_year", form.graduation_year);
      payload.append("bio", form.bio.trim());
      payload.append("instagram_handle", form.instagram_handle.trim());
      payload.append("is_active", form.is_active ? "true" : "false");
      payload.append("avatar", avatarFile);
    } else {
      payload = {
        name,
        headline: form.headline.trim(),
        sport: form.sport.trim(),
        school: form.school.trim(),
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        bio: form.bio.trim(),
        instagram_handle: form.instagram_handle.trim(),
        is_active: form.is_active,
      };
    }

    try {
      const response = isEditMode
        ? await updateMutation.mutateAsync({ id: speaker.id, payload })
        : await createMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Speaker ${isEditMode ? "updated" : "added"} successfully.`);
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
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "add"} speaker.`));
    }
  };

  return (
    <Modal variant="cobalt"
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : UserRound}
      title={isEditMode ? "Edit speaker" : "Add speaker"}
      subtitle="Guest athletes who appear on War Room Live sessions."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={updateField("name")}
            disabled={isSubmitting}
            placeholder="e.g. Jordan Reyes"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.name && <p className={ERROR_CLASS}>{fieldErrors.name}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Headline</label>
          <input
            type="text"
            value={form.headline}
            onChange={updateField("headline")}
            disabled={isSubmitting}
            placeholder="e.g. D1 Wide Receiver — University of Oregon"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.headline && <p className={ERROR_CLASS}>{fieldErrors.headline}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>Sport</label>
            <input
              type="text"
              value={form.sport}
              onChange={updateField("sport")}
              disabled={isSubmitting}
              placeholder="Football"
              className={FIELD_CLASS}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>School</label>
            <input
              type="text"
              value={form.school}
              onChange={updateField("school")}
              disabled={isSubmitting}
              placeholder="Oregon"
              className={FIELD_CLASS}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Grad Year</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.graduation_year}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  graduation_year: event.target.value.replace(/[^0-9]/g, "").slice(0, 4),
                }))
              }
              disabled={isSubmitting}
              placeholder="2027"
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Bio</label>
          <textarea
            value={form.bio}
            onChange={updateField("bio")}
            disabled={isSubmitting}
            placeholder="A short bio shown on the session detail panel."
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.bio && <p className={ERROR_CLASS}>{fieldErrors.bio}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Instagram Handle</label>
            <input
              type="text"
              value={form.instagram_handle}
              onChange={updateField("instagram_handle")}
              disabled={isSubmitting}
              placeholder="@jordanreyes"
              className={FIELD_CLASS}
              autoComplete="off"
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
              disabled={isSubmitting}
              className="block w-full text-xs text-cn-p-ink-2 font-light file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border file:border-cn-p-line file:text-xs file:font-semibold file:bg-cn-p-page file:text-cn-p-ink hover:file:bg-cn-p-neutral-bg file:cursor-pointer cursor-pointer"
            />
            {fieldErrors.avatar && <p className={ERROR_CLASS}>{fieldErrors.avatar}</p>}
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_active: event.target.checked }))
            }
            disabled={isSubmitting}
            className="w-4 h-4 accent-cn-p-accent cursor-pointer"
          />
          <span className="text-xs font-sans text-cn-p-ink-2">
            Active — available to add to new sessions
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-cn-p-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Update Speaker" : "Add Speaker"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
