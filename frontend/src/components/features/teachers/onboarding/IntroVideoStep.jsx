"use client";

import { useRef } from "react";
import { Film, Link2, Paperclip, Trash2 } from "lucide-react";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_SIZE_MB,
} from "@/constants/teacherOnboarding";
import { ERROR_CLASS, FIELD_CLASS, HINT_CLASS, LABEL_CLASS } from "./fieldStyles";

/**
 * Step 4 — a short introduction on camera.
 *
 * Two ways in, because both are ordinary: record something on a phone and
 * upload it, or point at one already on YouTube or Vimeo. The uploaded file
 * wins when both are present, which is the same order
 * `services.intro_video_display_url` resolves them in server-side.
 */
export default function IntroVideoStep({
  form,
  errors,
  onChange,
  onFileSelected,
  onRemoveFile,
  uploadedVideoUrl,
  uploadedVideoName,
  pendingFile,
  disabled,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    onFileSelected(selected);
    // Let the same file be re-picked after a rejection, which a browser
    // otherwise suppresses because the input's value has not changed.
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted font-light leading-relaxed">
        Record a minute or two introducing yourself: who you teach, what you teach, and why a
        student should pick your course. It does not need editing — a phone camera in a quiet
        room is exactly right.
      </p>

      <div className="p-5 bg-paper border border-line rounded-card space-y-4">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-pine" />
          <h3 className="text-sm font-semibold font-sans text-ink">Upload a video</h3>
        </div>

        {uploadedVideoUrl && !pendingFile && (
          <div className="space-y-2">
            <video
              src={uploadedVideoUrl}
              controls
              preload="metadata"
              className="w-full max-h-72 rounded-xl bg-ink"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-mono text-muted truncate">{uploadedVideoName}</p>
              <button
                type="button"
                onClick={onRemoveFile}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-clay transition disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-line bg-porcelain hover:bg-paper text-sm font-mono text-ink transition disabled:opacity-60"
          >
            <Paperclip className="w-4 h-4" />
            {uploadedVideoUrl || pendingFile ? "Choose a different video" : "Choose a video"}
          </button>
          <p className="text-xs font-mono text-muted truncate min-w-0">
            {pendingFile ? `${pendingFile.name} — saves when you continue` : "No new file chosen"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />
        </div>
        {errors.intro_video ? (
          <p className={ERROR_CLASS}>{errors.intro_video}</p>
        ) : (
          <p className={HINT_CLASS}>MP4, WebM or MOV, up to {MAX_VIDEO_SIZE_MB}MB.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[10px] font-sans uppercase tracking-widest text-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="p-5 bg-paper border border-line rounded-card space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-pine" />
          <h3 className="text-sm font-semibold font-sans text-ink">Link to a video</h3>
        </div>
        <div>
          <label htmlFor="onboarding-video-url" className={LABEL_CLASS}>
            Video URL
          </label>
          <input
            id="onboarding-video-url"
            type="url"
            value={form.intro_video_url}
            onChange={(event) => onChange("intro_video_url", event.target.value)}
            disabled={disabled}
            placeholder="https://youtu.be/your-intro"
            className={FIELD_CLASS}
          />
          {errors.intro_video_url ? (
            <p className={ERROR_CLASS}>{errors.intro_video_url}</p>
          ) : (
            <p className={HINT_CLASS}>
              YouTube, Vimeo or anywhere else the review team can open it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
