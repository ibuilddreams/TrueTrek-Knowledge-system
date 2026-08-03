"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  FilePlus2,
  FileText,
  Image as ImageIcon,
  Link2,
  Upload,
  Video,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createLesson, updateLesson } from "@/services/lessonsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  getVideoEmbedUrl,
  isIframeEmbedCode,
  normalizePastedVideoInput,
} from "@/lib/videoEmbed";

const CONTENT_TYPES = [
  { value: "VIDEO", label: "Video" },
  { value: "PDF", label: "PDF" },
  { value: "DOCUMENT", label: "Document" },
  { value: "IMAGE", label: "Image" },
];

const FILE_ACCEPT = {
  VIDEO: ".mp4,.mov,.webm,.mkv,.avi",
  PDF: ".pdf",
  DOCUMENT: ".doc,.docx",
  IMAGE: ".jpg,.jpeg,.png,.webp",
};

const FILE_LABEL = {
  VIDEO: "Video File",
  PDF: "PDF File",
  DOCUMENT: "Document File",
  IMAGE: "Image File",
};

const FILE_ICON = {
  PDF: FileText,
  DOCUMENT: FileText,
  IMAGE: ImageIcon,
};

const VIDEO_SOURCE_MODES = [
  { value: "UPLOAD", label: "Upload Video", icon: Upload },
  { value: "LINK", label: "Paste Link", icon: Link2 },
];

const INITIAL_FORM = {
  module: "",
  title: "",
  description: "",
  content_type: "VIDEO",
  video_url: "",
  duration_minutes: "",
  order: "1",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function getFileExtension(name) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}

function FilePreviewCard({ file, icon: Icon }) {
  return (
    <div className="mt-3 flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/60">
      <div className="w-10 h-10 rounded-lg bg-amber-600/10 text-amber-700 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-stone-800 truncate">
          {file.name}
        </p>
        <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-0.5">
          {getFileExtension(file.name)} · {formatFileSize(file.size)}
        </p>
      </div>
    </div>
  );
}

export default function AddLessonModal({
  isOpen,
  onClose,
  modules = [],
  defaultModuleId,
  lesson,
  onSaved,
}) {
  const isEditMode = Boolean(lesson);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [videoSourceMode, setVideoSourceMode] = useState("UPLOAD");
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const createLessonMutation = useMutation({
    mutationFn: (formData) => createLesson(formData),
    onSuccess: (_data, formData) => {
      const moduleId = Number(formData.get("module"));
      queryClient.invalidateQueries({ queryKey: ["lessons", moduleId] });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, formData }) => updateLesson(id, formData),
    onSuccess: (_data, { formData }) => {
      const moduleId = Number(formData.get("module"));
      queryClient.invalidateQueries({ queryKey: ["lessons", moduleId] });
    },
  });

  const isSubmitting =
    createLessonMutation.isPending || updateLessonMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    if (lesson) {
      setForm({
        module: String(lesson.module?.id ?? lesson.module ?? ""),
        title: lesson.title || "",
        description: lesson.description || "",
        content_type: lesson.content_type || "VIDEO",
        video_url: lesson.video_url || "",
        duration_minutes:
          lesson.duration_minutes != null
            ? String(lesson.duration_minutes)
            : "",
        order: String(lesson.order ?? 1),
      });
      setVideoSourceMode(lesson.video_url ? "LINK" : "UPLOAD");
      setExistingFileUrl(lesson.file || null);
    } else {
      setForm({
        ...INITIAL_FORM,
        module: defaultModuleId
          ? String(defaultModuleId)
          : String(modules[0]?.id || ""),
        order: "1",
      });
      setVideoSourceMode("UPLOAD");
      setExistingFileUrl(null);
    }
    setFile(null);
    setFieldErrors({});
  }, [isOpen, defaultModuleId, lesson, modules]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleContentTypeChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      content_type: value,
      video_url: "",
      duration_minutes: "",
    }));
    setVideoSourceMode("UPLOAD");
    setFile(null);
    setExistingFileUrl(null);
    setFieldErrors({});
  };

  const handleVideoSourceModeChange = (mode) => {
    setVideoSourceMode(mode);
    setForm((prev) => ({ ...prev, video_url: "" }));
    setFile(null);
    setExistingFileUrl(null);
    setFieldErrors({});
  };

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setFieldErrors((prev) => ({ ...prev, file: null }));
  };

  const handleVideoUrlChange = (event) => {
    const value = normalizePastedVideoInput(event.target.value);
    setForm((prev) => ({ ...prev, video_url: value }));
    setFieldErrors((prev) => ({ ...prev, video_url: null }));
  };

  const validate = () => {
    const errors = {};
    const title = form.title.trim();
    const hasExistingFile = Boolean(existingFileUrl);

    if (!form.module) errors.module = "Module is required.";
    if (!title) errors.title = "Title is required.";
    if (title.length > 255)
      errors.title = "Title must be at most 255 characters.";

    const order = Number(form.order);
    if (!Number.isFinite(order) || order < 1 || !Number.isInteger(order)) {
      errors.order = "Order must be 1, 2, 3... only.";
    }

    if (form.content_type === "VIDEO") {
      if (videoSourceMode === "LINK") {
        const trimmedUrl = form.video_url.trim();
        if (!trimmedUrl) {
          errors.video_url = "Video URL is required.";
        } else if (isIframeEmbedCode(trimmedUrl)) {
          errors.video_url =
            "Couldn't read a video link from that embed code. Please check it and try again.";
        }
      } else if (!file && !hasExistingFile) {
        errors.file = "Please select a video file to upload.";
      }
    } else {
      if (!file && !hasExistingFile)
        errors.file = "File is required for this lesson type.";
      const duration = Number(form.duration_minutes);
      if (
        !form.duration_minutes ||
        !Number.isFinite(duration) ||
        duration <= 0
      ) {
        errors.duration_minutes = "Duration must be greater than zero.";
      }
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const formData = new FormData();
    formData.append("module", form.module);
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("content_type", form.content_type);
    formData.append("order", form.order);

    if (form.content_type === "VIDEO") {
      if (videoSourceMode === "LINK") {
        formData.append("video_url", form.video_url.trim());
      } else if (file) {
        formData.append("file", file);
      }
    } else {
      if (file) {
        formData.append("file", file);
      }
      formData.append("duration_minutes", form.duration_minutes);
    }

    try {
      const response = isEditMode
        ? await updateLessonMutation.mutateAsync({ id: lesson.id, formData })
        : await createLessonMutation.mutateAsync(formData);
      toastSuccess(
        response?.message ||
          `Lesson ${isEditMode ? "updated" : "created"} successfully.`,
      );
      onSaved?.(response?.data);
      onClose();
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
        getApiErrorMessage(
          error,
          `Unable to ${isEditMode ? "update" : "create"} lesson.`,
        ),
      );
    }
  };

  const isVideo = form.content_type === "VIDEO";
  const requiresDuration = !isVideo;
  const trimmedVideoUrl = form.video_url.trim();
  const videoEmbedUrl = trimmedVideoUrl ? getVideoEmbedUrl(trimmedVideoUrl) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Video}
      title={isEditMode ? "Edit Lesson" : "Add Lesson"}
      subtitle={
        isEditMode ? lesson?.title : "Create a new lesson for this course"
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Module</label>
          <select
            value={form.module}
            onChange={updateField("module")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          >
            <option value="">Select a module</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
          {fieldErrors.module && (
            <p className={ERROR_CLASS}>{fieldErrors.module}</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>Lesson Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            disabled={isSubmitting}
            placeholder="Lesson title"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.title && (
            <p className={ERROR_CLASS}>{fieldErrors.title}</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isSubmitting}
            placeholder="Lesson description"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && (
            <p className={ERROR_CLASS}>{fieldErrors.description}</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>Content Type</label>
          <select
            value={form.content_type}
            onChange={handleContentTypeChange}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          >
            {CONTENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isVideo && (
          <div>
            <label className={LABEL_CLASS}>Video Source</label>
            <div className="flex gap-2">
              {VIDEO_SOURCE_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => handleVideoSourceModeChange(mode.value)}
                  disabled={isSubmitting}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-[11px] font-semibold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                    videoSourceMode === mode.value
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isVideo && videoSourceMode === "LINK" && (
          <div>
            <label className={LABEL_CLASS}>Video URL</label>
            <input
              type="text"
              value={form.video_url}
              onChange={handleVideoUrlChange}
              disabled={isSubmitting}
              placeholder="Paste a YouTube/Vimeo link or an <iframe> embed code"
              className={FIELD_CLASS}
              autoComplete="off"
            />
            <p className="mt-1.5 text-[10px] font-mono text-stone-400">
              Paste a video link, or the full &lt;iframe&gt; embed code — we&apos;ll extract the link automatically.
            </p>
            {fieldErrors.video_url && (
              <p className={ERROR_CLASS}>{fieldErrors.video_url}</p>
            )}

            {trimmedVideoUrl && !isIframeEmbedCode(trimmedVideoUrl) && (
              <div className="mt-3 rounded-xl overflow-hidden border border-stone-200 bg-stone-900 aspect-video">
                {videoEmbedUrl ? (
                  <iframe
                    src={videoEmbedUrl}
                    title="Video preview"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={trimmedVideoUrl} controls className="w-full h-full" />
                )}
              </div>
            )}
          </div>
        )}

        {isVideo && videoSourceMode === "UPLOAD" && (
          <div>
            <label className={LABEL_CLASS}>{FILE_LABEL.VIDEO}</label>
            <input
              type="file"
              accept={FILE_ACCEPT.VIDEO}
              onChange={handleFileChange}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            {fieldErrors.file && (
              <p className={ERROR_CLASS}>{fieldErrors.file}</p>
            )}

            {!file && existingFileUrl && (
              <p className="text-[10px] font-mono text-stone-500 mt-2">
                Current file:{" "}
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 underline"
                >
                  view
                </a>{" "}
                — leave empty to keep it.
              </p>
            )}

            {file && <FilePreviewCard file={file} icon={Video} />}
          </div>
        )}

        {requiresDuration && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>
                {FILE_LABEL[form.content_type]}
              </label>
              <input
                type="file"
                accept={FILE_ACCEPT[form.content_type]}
                onChange={handleFileChange}
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
              {fieldErrors.file && (
                <p className={ERROR_CLASS}>{fieldErrors.file}</p>
              )}

              {!file && existingFileUrl && (
                <p className="text-[10px] font-mono text-stone-500 mt-2">
                  Current file:{" "}
                  <a
                    href={existingFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-700 underline"
                  >
                    view
                  </a>{" "}
                  — leave empty to keep it.
                </p>
              )}
            </div>
            <div>
              <label className={LABEL_CLASS}>Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={updateField("duration_minutes")}
                disabled={isSubmitting}
                placeholder="e.g. 15"
                className={FIELD_CLASS}
              />
              {fieldErrors.duration_minutes && (
                <p className={ERROR_CLASS}>{fieldErrors.duration_minutes}</p>
              )}
            </div>
          </div>
        )}

        {requiresDuration && file && (
          <FilePreviewCard
            file={file}
            icon={FILE_ICON[form.content_type] || FileText}
          />
        )}

        <div className="w-32">
          <label className={LABEL_CLASS}>Order</label>
          <input
            type="number"
            min="1"
            step="1"
            value={form.order}
            onChange={updateField("order")}
            onKeyDown={(event) => {
              if (event.key === "-" || event.key === "e" || event.key === "E" || event.key === "+") {
                event.preventDefault();
              }
            }}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
          <p className="mt-1.5 text-[10px] font-mono text-stone-400">1 = first position</p>
          {fieldErrors.order && (
            <p className={ERROR_CLASS}>{fieldErrors.order}</p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || modules.length === 0}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Save Changes" : "Create Lesson"}
              </>
            )}
          </button>
        </div>

        {modules.length === 0 && (
          <p className="text-[10px] font-mono text-amber-700 flex items-center gap-1.5">
            <FilePlus2 className="w-3 h-3" />
            Create a module first before adding a lesson.
          </p>
        )}
      </form>
    </Modal>
  );
}
