"use client";

import { useRef, useState } from "react";
import { FileText, Sparkles, UploadCloud, X } from "lucide-react";

// Mirrors brand_validator/validators.py so a bad file is caught before it is
// sent, not after a round trip.
const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp";
const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_SIZE_MB = 15;

function validate(file) {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return `Upload your media kit as ${ACCEPTED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `Your media kit must not exceed ${MAX_SIZE_MB}MB.`;
  }
  return null;
}

export default function MediaKitUploader({ onSubmit, isSubmitting }) {
  const [file, setFile] = useState(null);
  const [athleteContext, setAthleteContext] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const acceptFile = (nextFile) => {
    if (!nextFile) return;
    const error = validate(nextFile);
    if (error) {
      setFileError(error);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFileError("");
    setFile(nextFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const clearFile = () => {
    setFile(null);
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file || fileError) return;
    onSubmit({ file, athleteContext: athleteContext.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-6 overflow-hidden">

        <h3 className="text-base font-bold text-cn-p-ink">Upload your media kit</h3>
        <p className="text-xs text-cn-p-ink-2 font-light mt-1.5 leading-relaxed">
          One page, as a PDF or an image. A local business owner will read it and tell you
          straight whether they&apos;d write the cheque.
        </p>

        {file ? (
          <div className="mt-5 flex items-center justify-between gap-3 px-4 py-3.5 bg-cn-p-page border border-cn-p-line rounded-xl">
            <span className="inline-flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 shrink-0 text-cn-p-accent" />
              <span className="min-w-0">
                <span className="block text-sm text-cn-p-ink font-medium truncate">{file.name}</span>
                <span className="block text-[11px] text-cn-p-ink-2 font-light">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </span>
            </span>
            <button
              type="button"
              onClick={clearFile}
              disabled={isSubmitting}
              className="text-cn-p-ink-2 hover:text-cn-p-ink transition cursor-pointer shrink-0 disabled:opacity-50"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            className={`mt-5 flex flex-col items-center justify-center gap-2.5 px-6 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cn-p-accent/40 ${
              isDragging ? "border-cn-p-accent bg-cn-p-soft" : "border-cn-p-line hover:border-cn-p-accent/40 hover:bg-cn-p-page/60"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-cn-p-warn-bg border border-cn-p-warn-bg text-cn-p-warn flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-sm text-cn-p-ink font-medium">Drop your media kit here</p>
            <p className="text-[11px] text-cn-p-ink-2 font-light">
              or click to browse — PDF, PNG, JPG or WEBP, up to {MAX_SIZE_MB}MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={(event) => acceptFile(event.target.files?.[0])}
          className="hidden"
        />

        {fileError && <p className="text-[11px] text-cn-p-bad font-light mt-3">{fileError}</p>}
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-6">
        <label
          htmlFor="athlete-context"
          className="block text-[11px] font-semibold text-cn-p-ink-2 mb-2"
        >
          Tell the sponsor about yourself (optional)
        </label>
        <textarea
          id="athlete-context"
          rows={3}
          maxLength={1000}
          value={athleteContext}
          onChange={(event) => setAthleteContext(event.target.value)}
          placeholder="Junior point guard, 4.0 GPA, looking for local sponsors in my hometown."
          className="w-full px-3.5 py-2.5 bg-cn-p-card border border-cn-p-line rounded-xl text-sm text-cn-p-ink font-light placeholder:text-cn-p-muted focus:outline-none focus:ring-2 focus:ring-cn-p-accent/30 focus:border-cn-p-accent transition resize-none"
        />
        <p className="text-[11px] text-cn-p-ink-2 font-light mt-2">
          Context makes the critique specific to you rather than generic.
        </p>
      </div>

      <button
        type="submit"
        disabled={!file || isSubmitting || Boolean(fileError)}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        {isSubmitting ? "Uploading..." : "Validate my brand"}
      </button>
    </form>
  );
}
