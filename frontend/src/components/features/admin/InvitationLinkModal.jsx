"use client";

import { useRef, useState } from "react";
import { Check, CheckCircle2, Clock3, Copy, Link2, LockKeyhole, Mail, TriangleAlert } from "lucide-react";
import Modal from "@/components/ui/Modal";

const delivery = {
  SENT: { title: "Invitation email sent", detail: "Accepted by the mail server. You can also share the setup link privately.", success: true },
  FAILED: { title: "Email could not be sent", detail: "The setup link is ready. Share it privately, or retry email delivery from Invitations." },
  NOT_CONFIGURED: { title: "Share this invitation manually", detail: "Email delivery is not configured. Copy the setup link and send it to the invitee." },
  NOT_SENT: { title: "Your setup link is ready", detail: "Copy the link below and share it privately with the invitee." },
};

export default function InvitationLinkModal({ invitation, onClose }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const input = useRef(null);
  const status = delivery[invitation.email_status] || delivery.NOT_SENT;
  const StatusIcon = status.success ? CheckCircle2 : invitation.email_status === "FAILED" ? TriangleAlert : Mail;
  const expires = invitation.token_expires_at ? new Date(invitation.token_expires_at).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  }) : "—";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(invitation.setup_link);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
      input.current?.focus();
      input.current?.select();
    }
  }

  return (
    <Modal variant="cobalt" isOpen onClose={onClose} icon={Link2} title="Share account access" subtitle="A private invitation to join Cool Nerdz." maxWidth="max-w-xl">
      <div className="tt-interactive space-y-5">
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${status.success ? "border-cn-p-accent-soft bg-cn-p-soft" : "border-cn-p-soft bg-cn-p-soft"}`}>
          <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-cn-p-accent" />
          <div><p className="text-sm font-semibold text-cn-p-ink">{status.title}</p><p className="mt-1 text-xs leading-relaxed text-cn-p-ink-2">{status.detail}</p></div>
        </div>
        <div className="rounded-2xl border border-cn-p-line bg-cn-p-page p-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-cn-p-ink-2">Prepared for</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cn-p-soft text-cn-p-accent">{invitation.name?.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("") || "U"}</span>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-cn-p-ink">{invitation.name}</p><p className="mt-0.5 break-all text-xs text-cn-p-ink-2">{invitation.email}</p></div>
            <span className="rounded-md border border-cn-p-line bg-cn-p-card px-2 py-1 text-[10px] font-medium text-cn-p-ink-2">{invitation.role === "TEACHER" ? "Teacher" : "Student"}</span>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2"><label htmlFor="invitation-private-link" className="text-xs font-semibold text-cn-p-ink">Private setup link</label><span className="flex items-center gap-1 text-[10px] text-cn-p-ink-2"><LockKeyhole className="h-3 w-3" />One-time use</span></div>
          <div className="overflow-hidden rounded-xl border border-cn-p-line bg-cn-p-card focus-within:border-cn-p-accent-soft focus-within:ring-2 focus-within:ring-cn-p-soft">
            <textarea ref={input} id="invitation-private-link" readOnly rows={3} spellCheck={false} value={invitation.setup_link} onFocus={(event) => event.target.select()} className="block w-full resize-none bg-transparent p-3 text-[11px] leading-5 text-cn-p-ink-2 outline-none sm:text-xs" />
            <div className="flex items-center gap-2 border-t border-cn-p-line bg-cn-p-page px-3 py-2 text-[11px] text-cn-p-ink-2"><Clock3 className="h-3.5 w-3.5 shrink-0" /><span>Expires {expires}</span></div>
          </div>
          <p role="status" aria-live="polite" className={`mt-2 text-xs ${copyError ? "text-cn-p-bad" : "text-cn-p-accent"}`}>{copyError ? "Clipboard unavailable. The link is selected—copy it manually." : copied ? "Link copied. It’s ready to share with the invitee." : "\u00a0"}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-cn-p-line px-5 py-3 text-sm font-medium transition hover:bg-cn-p-page">Done</button>
          <button type="button" onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-cn-p-sm bg-cn-p-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-cn-p-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-p-accent">{copied ? <Check className="tt-confirm h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied to clipboard" : "Copy invitation link"}</button>
        </div>
        <p className="border-t border-cn-p-line pt-4 text-[11px] leading-relaxed text-cn-p-ink-2">Share only with the person named above. This link is shown once; you can generate a replacement from Invitations if needed.</p>
      </div>
    </Modal>
  );
}
