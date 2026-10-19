"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Paperclip, X } from "lucide-react";
import Modal from "@/components/ui/Modal";

// Mirrors quests/validators.py so a bad file is caught before upload.
const ACCEPTED_PROOF = ".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm";
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 50;

function validateProof(file) {
  const name = file.name.toLowerCase();
  const isVideo = VIDEO_EXTENSIONS.some((extension) => name.endsWith(extension));
  const limitMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;

  if (file.size > limitMb * 1024 * 1024) {
    return `Proof must not exceed ${limitMb}MB for this file type.`;
  }
  return null;
}

/**
 * Confirms a task completion. Opened from a task card's "I Did This".
 *
 * A modal rather than an inline panel because the tasks sit in a grid, and
 * expanding one card in place would reflow every card beside it.
 *
 * Every field is optional: completion is self-attested (no admin review
 * queue), so proof is only ever a keepsake for the student's own history.
 */
export default function QuestCompleteModal({ isOpen, onClose, quest, onConfirm, isSubmitting }) {
  const [reflection, setReflection] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  // Reset between quests so one task's note doesn't follow the student into
  // the next card they open.
  useEffect(() => {
    if (!isOpen) return;
    setReflection("");
    setProofUrl("");
    setProofFile(null);
    setFileError("");
  }, [isOpen, quest?.id]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProofFile(null);
      setFileError("");
      return;
    }

    const error = validateProof(file);
    if (error) {
      setFileError(error);
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileError("");
    setProofFile(file);
  };

  const clearFile = () => {
    setProofFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (fileError) return;
    onConfirm({
      reflection: reflection.trim(),
      proofUrl: proofUrl.trim(),
      proofFile,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      icon={Check}
      title="Nice work — log it"
      subtitle={quest?.title}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl bg-porcelain border border-line p-3.5">
          <p className="text-xs text-muted font-light leading-relaxed">
            We take you at your word — notes and proof are optional, and only ever for your own
            record. Your points are awarded as soon as you confirm.
          </p>
        </div>

        <div>
          <label
            htmlFor="quest-reflection"
            className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2"
          >
            What did you do? (optional)
          </label>
          <textarea
            id="quest-reflection"
            rows={3}
            maxLength={2000}
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="Removed 3 posts from freshman year that didn't match my brand."
            className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink font-light placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="quest-proof-url"
            className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2"
          >
            Link (optional)
          </label>
          <input
            id="quest-proof-url"
            type="url"
            value={proofUrl}
            onChange={(event) => setProofUrl(event.target.value)}
            placeholder="https://instagram.com/p/..."
            className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink font-light placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition"
          />
        </div>

        <div>
          <span className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            {quest?.proof_hint || "Screenshot or clip (optional)"}
          </span>

          {proofFile ? (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-porcelain border border-line rounded-xl">
              <span className="inline-flex items-center gap-2 text-xs text-ink font-light min-w-0">
                <Paperclip className="w-3.5 h-3.5 shrink-0 text-pine" />
                <span className="truncate">{proofFile.name}</span>
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="text-muted hover:text-ink transition cursor-pointer shrink-0"
                aria-label="Remove attached file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_PROOF}
              onChange={handleFileChange}
              className="block w-full text-xs text-muted font-light file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-line file:text-xs file:font-mono file:uppercase file:tracking-wider file:bg-porcelain file:text-ink hover:file:bg-line/40 file:cursor-pointer cursor-pointer"
            />
          )}

          {fileError && <p className="text-[11px] text-clay font-light mt-2">{fileError}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg border border-line text-muted hover:text-ink hover:bg-porcelain transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || Boolean(fileError)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg bg-pine hover:bg-moss text-paper shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {isSubmitting ? "Saving..." : `Complete +${quest?.points_reward ?? 0} pts`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
