"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, ShieldCheck, Clock3, CheckCircle2, ArrowUpRight, Search, MessageSquareText, Mail, Link2, ChevronLeft, ChevronRight } from "lucide-react";
import StarRating, { RATING_LABELS } from "@/components/ui/StarRating";
import Modal from "@/components/ui/Modal";
import { getInvitations, createInvitation, approveInvitation, regenerateInvitationLink, retryInvitationEmail, retryFeedbackEmail } from "@/services/invitationsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const field = "w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-pine px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:opacity-50";
const secondary = "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium transition hover:border-pine/30 hover:bg-porcelain disabled:opacity-40";
const initial = { first_name: "", last_name: "", email: "", role: "STUDENT", nda_approved: false };
const deliveryLabels = { NOT_SENT: "Email not sent", NOT_CONFIGURED: "Email not configured — share setup link manually", SENT: "Email accepted by mail server", FAILED: "Email failed — retry or share setup link" };
const date = (value) => value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export default function InvitationsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [form, setForm] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [approving, setApproving] = useState(null);
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const query = useQuery({ queryKey: ["invitations", page, search], queryFn: () => getInvitations(page, search) });
  const data = query.data?.data;

  async function perform(action) {
    setBusy(true);
    try {
      const response = await action();
      await queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setCreating(false);
      setApproving(null);
      setForm(initial);
      if (response.data?.setup_link) setResult(response.data);
      toastSuccess(response.message);
    } catch (error) { toastError(getApiErrorMessage(error)); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Access &amp; onboarding</p><h2 className="text-2xl sm:text-3xl font-serif text-ink">Invitations</h2><p className="mt-2 text-sm text-muted max-w-xl leading-relaxed">Manage invitations, approve NDAs, and hear from your community.</p></div>
        <button className={button} onClick={() => setCreating(true)}><UserPlus className="h-4 w-4" />Invite user</button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper/80 p-4">
        <div className="flex items-center gap-2 text-sm font-medium"><span>All invitations</span>{data && <span className="rounded-full bg-pine/10 px-2.5 py-0.5 text-xs text-pine">{data.count}</span>}</div>
        <form className="flex w-full gap-2 sm:w-auto" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchDraft.trim()); }}>
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className={`${field} pl-9 sm:w-72`} aria-label="Search invitations by name or email" placeholder="Search name or email…" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} /></div>
          <button className={secondary}>Search</button>
        </form>
      </div>
      {query.isPending && <p role="status">Loading invitations…</p>}
      {query.isError && <div role="alert" className="text-rose-700">Unable to load invitations. <button className={secondary} onClick={() => query.refetch()}>Retry</button></div>}
      {data?.results?.length === 0 && <div className="rounded-2xl border border-line bg-paper p-8 text-muted">No invitations found.</div>}
      <div className="space-y-4">
        {data?.results?.map((invite) => (
          <article key={invite.id} className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pine/10 bg-pine/5 font-serif text-lg text-pine">{invite.name?.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("")}</div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-ink">{invite.name}</h3><span className="rounded-md bg-porcelain px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">{invite.role === "TEACHER" ? "Teacher" : "Student"}</span></div><p className="mt-1 break-all text-xs text-muted">{invite.email}</p></div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${invite.accepted_at ? "border-pine/15 bg-pine/5 text-pine" : "border-gold/30 bg-gold/10 text-ink"}`}>
                {invite.accepted_at ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                {invite.accepted_at ? "Account ready" : invite.nda_approved ? "Awaiting setup" : "NDA pending"}
              </span>
            </div>
            <div className="grid gap-5 border-t border-line bg-porcelain/40 p-5 sm:grid-cols-3 sm:gap-6 sm:px-6">
              <div><p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted"><ShieldCheck className="h-3.5 w-3.5" />NDA approval</p><p className="text-sm font-medium text-ink">{invite.nda_approved ? "Approved" : "Awaiting review"}</p><p className="mt-1 text-xs leading-relaxed text-muted">{invite.nda_approved ? `By ${invite.approved_by_name || "admin"}` : "Approve the NDA to unlock access."}</p>{invite.nda_approved && <p className="mt-1 text-[11px] text-muted">{date(invite.nda_approved_at)}</p>}</div>
              <div><p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted"><Mail className="h-3.5 w-3.5" />Account access</p><p className="text-sm font-medium text-ink">{invite.accepted_at ? "Setup completed" : invite.nda_approved ? "Setup link available" : "Not yet available"}</p><p className="mt-1 text-xs leading-relaxed text-muted">{invite.accepted_at ? date(invite.accepted_at) : invite.nda_approved ? deliveryLabels[invite.email_status] : "Released after NDA approval."}</p>{invite.nda_approved && !invite.accepted_at && <p className="mt-1 text-[11px] text-muted">Expires {date(invite.token_expires_at)}</p>}</div>
              <div><p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted"><MessageSquareText className="h-3.5 w-3.5" />Feedback</p>{invite.feedback ? <><StarRating value={invite.feedback.rating} compact /><p className="mt-1 text-[11px] text-muted">Submitted {date(invite.feedback.submitted_at)}</p></> : <><p className="text-sm font-medium">{invite.nda_approved ? "Awaiting response" : "Locked"}</p><p className="mt-1 text-xs text-muted">{invite.nda_approved ? "Available to this user after login." : "Available after NDA approval."}</p></>}</div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-6">
              <p className="text-[11px] text-muted">Invited {date(invite.created_at)}</p>
              <div className="flex flex-wrap gap-2">
                {!invite.nda_approved && <button className={button} disabled={busy} onClick={() => { setApproving(invite); setChecked(false); }}><ShieldCheck className="h-4 w-4" />Review NDA</button>}
                {invite.nda_approved && !invite.accepted_at && <>
                  <button className={secondary} disabled={busy} onClick={() => perform(() => regenerateInvitationLink(invite.id))}><Link2 className="h-3.5 w-3.5" />New setup link</button>
                  <button className={secondary} disabled={busy} onClick={() => perform(() => regenerateInvitationLink(invite.id, true))}><Mail className="h-3.5 w-3.5" />Send new link</button>
                </>}
                {invite.feedback && <button className={secondary} onClick={() => setFeedback(invite)}>View feedback<ArrowUpRight className="h-3.5 w-3.5" /></button>}
                {!invite.nda_approved && invite.email_status !== "SENT" && <button className={secondary} disabled={busy} onClick={() => perform(() => retryInvitationEmail(invite.id))}><Mail className="h-3.5 w-3.5" />Retry invitation email</button>}
                {invite.feedback && invite.feedback.admin_email_status !== "SENT" && <button className={secondary} disabled={busy} onClick={() => perform(() => retryFeedbackEmail(invite.id))}><Mail className="h-3.5 w-3.5" />Retry admin notification</button>}
              </div>
              {!invite.nda_approved && <p className="w-full text-[11px] text-muted">Invitation email: {invite.email_status === "SENT" ? "Accepted by mail server" : invite.email_status === "FAILED" ? "Failed — please retry" : "Not sent — check email configuration"}</p>}
              {invite.feedback && <p className="w-full text-[11px] text-muted">Admin notification: {invite.feedback.admin_email_status === "SENT" ? "Accepted by mail server" : invite.feedback.admin_email_status === "FAILED" ? "Failed — feedback is saved; retry notification" : "Not sent — check email configuration and retry"}</p>}
              {invite.nda_approved && !invite.accepted_at && <p className="w-full text-[11px] text-muted">Creating a new link invalidates all previous setup links.</p>}
            </div>
          </article>
        ))}
      </div>
      {data && data.count > 0 && <div className="flex flex-wrap items-center justify-between gap-3 px-1"><span className="text-xs text-muted">Page {page} · {data.count} {data.count === 1 ? "invitation" : "invitations"}</span><div className="flex gap-2"><button className={secondary} disabled={!data.previous || query.isFetching} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" />Previous</button><button className={secondary} disabled={!data.next || query.isFetching} onClick={() => setPage(page + 1)}>Next<ChevronRight className="h-4 w-4" /></button></div></div>}

      <Modal isOpen={creating} onClose={() => !busy && setCreating(false)} title="Invite user" icon={UserPlus} maxWidth="max-w-xl">
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); perform(() => createInvitation(form)); }}>
          {[['first_name', 'First name'], ['last_name', 'Last name'], ['email', 'Email']].map(([key, label]) => <label key={key} className="block text-sm space-y-1"><span>{label}</span><input required maxLength={key === "email" ? 254 : 150} type={key === "email" ? "email" : "text"} className={field} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
          <label className="block text-sm space-y-1"><span>Role</span><select className={field} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option></select></label>
          <label className="flex items-start gap-3 rounded-xl bg-porcelain p-4 text-sm"><input className="mt-1" type="checkbox" checked={form.nda_approved} onChange={(event) => setForm({ ...form, nda_approved: event.target.checked })} /><span>I confirm this user&apos;s NDA is completed and approved.</span></label>
          <p className="text-xs text-muted">Leave unchecked if approval is pending. An invitation email is sent now; account setup is released after approval. Your approval is recorded with your name and the date.</p>
          <button className={button} disabled={busy}>{busy ? "Saving…" : "Create invitation"}</button>
        </form>
      </Modal>
      <Modal isOpen={Boolean(approving)} onClose={() => !busy && setApproving(null)} title="Approve NDA" maxWidth="max-w-lg">
        <div className="space-y-4"><p className="text-sm">Approval releases account setup and feedback for <strong>{approving?.email}</strong>.</p><label className="flex gap-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />I confirm their NDA is completed and approved.</label><button className={button} disabled={!checked || busy} onClick={() => perform(() => approveInvitation(approving.id))}>{busy ? "Approving…" : "Save approval"}</button></div>
      </Modal>
      <Modal isOpen={Boolean(result)} onClose={() => setResult(null)} title="Account setup link" maxWidth="max-w-xl">
        <div className="space-y-4"><p className="text-sm">{deliveryLabels[result?.email_status]}</p><p className="text-sm text-muted">Share privately with {result?.email}. This one-time link expires {date(result?.token_expires_at)}.</p><textarea className={field} aria-label="Private account setup link" readOnly rows={4} value={result?.setup_link || ""} /><button className={button} onClick={async () => { try { await navigator.clipboard.writeText(result.setup_link); toastSuccess("Link copied"); } catch { toastError("Select and copy the link above."); } }}>Copy link</button><p className="text-xs text-muted">The link is shown only here. You can generate a replacement if needed.</p></div>
      </Modal>
      <Modal isOpen={Boolean(feedback)} onClose={() => setFeedback(null)} title="Community feedback" subtitle="A closer look at their TrueTrek experience." icon={MessageSquareText} maxWidth="max-w-xl">
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-line pb-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine/10 font-serif text-lg text-pine">{feedback?.name?.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("")}</div><div className="min-w-0"><p className="font-semibold text-ink">{feedback?.name}</p><p className="mt-1 text-xs text-muted">{feedback?.role === "TEACHER" ? "Teacher" : "Student"} · {date(feedback?.feedback?.submitted_at)}</p></div></div>
          <div className="rounded-2xl border border-gold/25 bg-gold/5 p-5 text-center"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Overall experience</p><StarRating value={feedback?.feedback?.rating} /><p className="mt-2 font-serif text-xl text-pine">{RATING_LABELS[feedback?.feedback?.rating]}</p><p className="mt-1 text-xs text-muted">{feedback?.feedback?.rating} out of 5</p></div>
          <div className="space-y-2"><h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Their experience</h4><p className="whitespace-pre-wrap break-words text-sm leading-7 text-ink">{feedback?.feedback?.comments}</p></div>
          <div className="border-t border-line pt-4 space-y-2"><h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Ideas for improvement</h4><p className={`whitespace-pre-wrap break-words text-sm leading-7 ${feedback?.feedback?.suggestions ? "text-ink" : "text-muted italic"}`}>{feedback?.feedback?.suggestions || "No suggestions shared."}</p></div>
          <div className="flex items-center gap-1.5 border-t border-line pt-4 text-[11px] text-muted"><ShieldCheck className="h-3.5 w-3.5 text-pine" />Submitted by an NDA-approved member</div>
        </div>
      </Modal>
    </div>
  );
}
