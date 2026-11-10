"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, Upload } from "lucide-react";
import {
  ACCEPTED_DOCUMENT_TYPES,
  CREDENTIAL_TYPE_OPTIONS,
  MAX_DOCUMENT_SIZE_MB,
} from "@/constants/teacherOnboarding";
import {
  ERROR_CLASS,
  FIELD_CLASS,
  HINT_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "./fieldStyles";

const EMPTY_FORM = {
  credential_type: CREDENTIAL_TYPE_OPTIONS[0].value,
  title: "",
  institution: "",
  year_awarded: "",
};

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Adds one qualification document.
 *
 * The size and extension are checked here as well as on the server, because
 * the alternative is a teacher on a phone connection uploading a 200MB video
 * of their graduation before being told it is the wrong thing — the server
 * re-checks regardless, and `constants/teacherOnboarding.js` says which file
 * the two lists have to move with.
 */
export default function CredentialUploadForm({ onUpload, isUploading, disabled }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setErrors((previous) => ({ ...previous, file: undefined }));

    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
      setErrors((previous) => ({
        ...previous,
        file: `That file is larger than ${MAX_DOCUMENT_SIZE_MB}MB.`,
      }));
      setFile(null);
      event.target.value = "";
      return;
    }
    setFile(selected);
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Give this document a name.";
    if (!file) nextErrors.file = "Choose a file to upload.";
    if (form.year_awarded) {
      const year = Number(form.year_awarded);
      if (!Number.isInteger(year) || year < 1950 || year > CURRENT_YEAR + 1) {
        nextErrors.year_awarded = `Enter a year between 1950 and ${CURRENT_YEAR + 1}.`;
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const uploaded = await onUpload({
      file,
      credentialType: form.credential_type,
      title: form.title.trim(),
      institution: form.institution.trim(),
      yearAwarded: form.year_awarded,
    });
    // Only clear on success — a failed upload should leave the teacher's
    // typing where it was so they can retry without re-entering it.
    if (uploaded) reset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 bg-paper border border-line rounded-card space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="credential-type" className={LABEL_CLASS}>
            Document type
          </label>
          <select
            id="credential-type"
            value={form.credential_type}
            onChange={updateField("credential_type")}
            disabled={disabled || isUploading}
            className={FIELD_CLASS}
          >
            {CREDENTIAL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="credential-title" className={LABEL_CLASS}>
            Title <span className="text-clay">*</span>
          </label>
          <input
            id="credential-title"
            type="text"
            maxLength={200}
            value={form.title}
            onChange={updateField("title")}
            disabled={disabled || isUploading}
            placeholder="e.g. BSc Mathematics"
            className={FIELD_CLASS}
          />
          {errors.title && <p className={ERROR_CLASS}>{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="credential-institution" className={LABEL_CLASS}>
            Institution
          </label>
          <input
            id="credential-institution"
            type="text"
            maxLength={200}
            value={form.institution}
            onChange={updateField("institution")}
            disabled={disabled || isUploading}
            placeholder="e.g. State University"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor="credential-year" className={LABEL_CLASS}>
            Year awarded
          </label>
          <input
            id="credential-year"
            type="number"
            min={1950}
            max={CURRENT_YEAR + 1}
            inputMode="numeric"
            value={form.year_awarded}
            onChange={updateField("year_awarded")}
            disabled={disabled || isUploading}
            placeholder={String(CURRENT_YEAR)}
            className={FIELD_CLASS}
          />
          {errors.year_awarded && <p className={ERROR_CLASS}>{errors.year_awarded}</p>}
        </div>
      </div>

      <div>
        <span className={LABEL_CLASS}>
          File <span className="text-clay">*</span>
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-line bg-porcelain hover:bg-paper text-sm font-mono text-ink transition disabled:opacity-60"
          >
            <Paperclip className="w-4 h-4" />
            {file ? "Choose a different file" : "Choose a file"}
          </button>
          <p className="text-xs font-mono text-muted truncate min-w-0">
            {file ? file.name : "No file chosen"}
          </p>
          <input
            ref={fileInputRef}
            id="credential-file"
            type="file"
            accept={ACCEPTED_DOCUMENT_TYPES}
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
        </div>
        {errors.file ? (
          <p className={ERROR_CLASS}>{errors.file}</p>
        ) : (
          <p className={HINT_CLASS}>
            PDF or image, up to {MAX_DOCUMENT_SIZE_MB}MB. A scan or a clear photo is fine.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={disabled || isUploading} className={PRIMARY_BUTTON_CLASS}>
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              Add Document
            </>
          )}
        </button>
      </div>
    </form>
  );
}
