"use client";

import { ExternalLink, FileCheck2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime, formatPlainDate } from "@/lib/adminFormatters";

/**
 * What one student actually submitted for one quest.
 *
 * Read-only: completion is self-attested and already paid out, so there is
 * nothing to approve here. Correcting a wrongly awarded quest is a points
 * adjustment in Rewards, which keeps the ledger append-only.
 */
export default function QuestSubmissionDetailModal({ isOpen, onClose, submission }) {
  if (!submission) return null;

  const isImageProof = /\.(jpe?g|png|webp|gif)$/i.test(
    submission.proof_original_name || submission.proof_file_url || "",
  );

  const facts = [
    { label: "Student", value: submission.student_name || submission.student_email },
    { label: "Email", value: submission.student_email },
    { label: "Assigned", value: formatPlainDate(submission.assigned_date) },
    {
      label: "Completed",
      value: submission.completed_at ? formatDateTime(submission.completed_at) : "—",
    },
    { label: "Category", value: submission.quest_category },
    { label: "Points awarded", value: submission.points_awarded || "—" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={FileCheck2}
      title={submission.quest_title}
      subtitle="Quest submission"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <StatusBadge size="lg" status={submission.status} />
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
            {submission.quest_difficulty}
          </span>
        </div>

        <div className="rounded-xl bg-porcelain border border-line p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {facts.map((fact) => (
            <p key={fact.label} className="text-sm text-muted font-light">
              {fact.label}:{" "}
              <span className="text-ink font-semibold break-words">{fact.value || "—"}</span>
            </p>
          ))}
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            Student&apos;s note
          </p>
          {submission.reflection ? (
            <p className="text-sm text-ink font-light leading-relaxed whitespace-pre-line rounded-xl border border-line bg-paper p-3.5">
              {submission.reflection}
            </p>
          ) : (
            <p className="text-xs text-muted font-light">No note was added.</p>
          )}
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">Proof</p>

          {!submission.proof_file_url && !submission.proof_url && (
            <p className="text-xs text-muted font-light">
              No proof attached — proof is always optional.
            </p>
          )}

          {submission.proof_url && (
            <a
              href={submission.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-pine hover:text-moss transition break-all"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              {submission.proof_url}
            </a>
          )}

          {submission.proof_file_url && (
            <div className="mt-3">
              {isImageProof ? (
                // Student uploads are served from the API host, which isn't in
                // next.config's image domains — a plain <img> is the pattern
                // used elsewhere in the portal for user-supplied media.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={submission.proof_file_url}
                  alt={`Proof submitted by ${submission.student_name || "student"}`}
                  className="max-h-80 w-auto rounded-xl border border-line"
                />
              ) : null}
              <a
                href={submission.proof_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-pine hover:text-moss transition mt-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {submission.proof_original_name || "Open attachment"}
              </a>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
