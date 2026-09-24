"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, ShieldCheck, CheckCircle2, ArrowRight, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFeedback, submitFeedback } from "@/services/invitationsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import StarRating, { RATING_LABELS } from "@/components/ui/StarRating";
import Loader from "@/components/ui/Loader";

const field = "w-full rounded-xl border border-line bg-porcelain/40 px-4 py-3 text-sm leading-relaxed transition focus:bg-paper focus:outline-none focus:ring-2 focus:ring-pine/30";

export default function FeedbackForm() {
  const { user, status, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["invitationFeedback", user?.id], queryFn: getFeedback, enabled: isAuthenticated, retry: false });

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!rating) { setError("Please select a star rating before submitting."); return; }
    setBusy(true);
    try {
      const result = await submitFeedback({ rating: Number(rating), comments, suggestions });
      queryClient.setQueryData(["invitationFeedback", user?.id], { data: { response: result.data } });
      await queryClient.invalidateQueries({ queryKey: ["feedbackStatus"] });
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  }

  if (status === "idle" || status === "loading") return <Loader label="Checking session…" />;
  const response = query.data?.data?.response;
  return (
    <section className="tt-interactive mx-auto max-w-2xl px-5 py-10 sm:py-16">
      <div className="tt-enter mb-8 text-center">
        <span className="tt-float mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-pine/10 bg-pine/5 text-pine"><MessageSquareText className="h-5 w-5" /></span>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Your voice matters</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink">A better TrueTrek starts with you.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">Share what you enjoyed and where we can do better. Your experience helps shape what comes next.</p>
      </div>
      <div className="tt-enter overflow-hidden rounded-3xl border border-line bg-paper shadow-sm">
        <div className="h-1 bg-gradient-to-r from-pine via-moss to-gold" />
        <div className="space-y-6 p-6 sm:p-9">
          {!isAuthenticated ? <div className="space-y-5 text-center py-5"><ShieldCheck className="mx-auto h-8 w-8 text-pine" /><h2 className="font-serif text-2xl">Your feedback is personal.</h2><p className="text-sm text-muted">Sign in to access your feedback form.</p><Link href="/login?next=/feedback" className="inline-flex items-center gap-2 rounded-xl bg-pine px-5 py-3 text-sm text-white">Sign in to continue<ArrowRight className="h-4 w-4" /></Link></div>
            : query.isPending ? <p role="status" className="py-8 text-center text-sm text-muted">Loading your form…</p>
            : query.isError ? <div role="alert" className="rounded-xl border border-line bg-porcelain/50 p-5 text-sm"><p>{getApiErrorMessage(query.error)}</p>{query.error?.status !== 403 && <button className="underline mt-3" onClick={() => query.refetch()}>Try again</button>}</div>
            : response ? (
              <div className="space-y-6">
                <div className="text-center"><CheckCircle2 className="tt-confirm mx-auto mb-3 h-9 w-9 text-pine" /><h2 className="font-serif text-2xl text-pine">Thank you for sharing.</h2><p className="mt-2 text-sm leading-relaxed text-muted">Your feedback is with our team. We appreciate you helping us make TrueTrek better.</p></div>
                <div className="rounded-2xl border border-gold/25 bg-gold/5 p-5 text-center"><p className="mb-3 text-[10px] uppercase tracking-widest text-muted">Your experience</p><StarRating value={response.rating} /><p className="mt-2 text-sm font-medium text-pine">{RATING_LABELS[response.rating]}</p></div>
                <div><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">What you shared</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{response.comments}</p></div>
                {response.suggestions && <div className="border-t border-line pt-5"><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">Your suggestions</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{response.suggestions}</p></div>}
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-7">
                <div className="rounded-2xl border border-line bg-porcelain/40 px-2 py-6 sm:px-6">
                  <h2 className="mb-1 text-center font-serif text-xl text-ink">How has your experience been?</h2>
                  <p className="mb-5 text-center text-xs text-muted">Choose the stars that best reflect your experience.</p>
                  <StarRating value={rating} onChange={setRating} disabled={busy} />
                </div>
                <label className="block space-y-2"><span className="text-sm font-semibold">Tell us a little more <span className="text-gold" aria-hidden="true">*</span></span><span className="block text-xs text-muted">What stood out to you about your experience?</span><textarea required disabled={busy} maxLength={5000} rows={4} placeholder="The most helpful part of my experience was…" className={field} value={comments} onChange={(event) => setComments(event.target.value)} /></label>
                <label className="block space-y-2"><span className="flex items-center justify-between gap-2 text-sm font-semibold">What could we improve?<span className="text-xs font-normal text-muted">Optional</span></span><textarea disabled={busy} maxLength={5000} rows={3} placeholder="An idea, a suggestion, or something you’d love to see…" className={field} value={suggestions} onChange={(event) => setSuggestions(event.target.value)} /></label>
                {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700 text-sm">{error}</p>}
                <div className="space-y-4 border-t border-line pt-5"><button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pine px-6 py-3.5 text-sm font-medium text-white transition hover:bg-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:opacity-50">{busy ? "Submitting…" : "Submit feedback"}<Send className="h-4 w-4" /></button><p className="flex items-start justify-center gap-2 text-xs leading-relaxed text-muted"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Your response is linked to your account and reviewed by our admin team. You can submit once.</span></p></div>
              </form>
            )}
        </div>
      </div>
    </section>
  );
}
