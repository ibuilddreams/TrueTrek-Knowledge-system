"use client";

import { ExternalLink, FileText, Loader2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/adminFormatters";

function formatSize(bytes) {
  if (!bytes) return null;
  const megabytes = bytes / (1024 * 1024);
  return megabytes >= 1 ? `${megabytes.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * One uploaded qualification document.
 *
 * `readOnly` is what the admin review modal renders it with: the same row,
 * minus the delete button, so a reviewer sees exactly the list the applicant
 * sees rather than a second rendering of the same data.
 */
export default function CredentialRow({ credential, onDelete, isDeleting = false, readOnly = false }) {
  const size = formatSize(credential.file_size);
  const meta = [
    credential.institution,
    credential.year_awarded ? String(credential.year_awarded) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-start gap-3 p-4 bg-porcelain border border-line rounded-xl">
      <span className="w-9 h-9 shrink-0 rounded-lg bg-paper border border-line text-pine flex items-center justify-center">
        <FileText className="w-4 h-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink truncate">{credential.title}</p>
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-paper border border-line text-muted shrink-0">
            {credential.credential_type_display}
          </span>
        </div>
        {meta && <p className="text-xs text-muted font-light mt-0.5">{meta}</p>}
        <p className="text-[11px] text-muted font-mono mt-1 truncate">
          {credential.original_name}
          {size ? ` · ${size}` : ""}
          {credential.created_at ? ` · ${formatDate(credential.created_at)}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {credential.document_url && (
          <a
            href={credential.document_url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${credential.title}`}
            aria-label={`Open ${credential.title}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-pine hover:bg-paper transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={() => onDelete(credential)}
            disabled={isDeleting}
            title={`Remove ${credential.title}`}
            aria-label={`Remove ${credential.title}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-clay hover:bg-paper transition disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </li>
  );
}
