"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { submitTestimonial } from "@/services/testimonialsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import StarRating from "@/components/ui/StarRating";

const field =
  "w-full bg-porcelain border border-line rounded-card p-3 text-sm focus:ring-1 focus:ring-pine/40 focus:border-pine focus:outline-none focus:bg-paper transition disabled:opacity-60";

export default function TestimonialForm({ onSubmitted }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [school, setSchool] = useState("");
  const [sport, setSport] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: submitTestimonial,
    onSuccess: () => setIsSubmitted(true),
    onError: (error) =>
      toastError(getApiErrorMessage(error, "Unable to submit your testimonial. Please try again.")),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim() || !quote.trim()) {
      toastError("Please share your name and a few words about your experience.");
      return;
    }
    if (!rating) {
      toastError("Please select a star rating.");
      return;
    }

    mutation.mutate({
      name: name.trim(),
      role: role.trim(),
      school: school.trim(),
      sport: sport.trim(),
      quote: quote.trim(),
      rating,
    });
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-sage/30 text-moss flex items-center justify-center border border-line">
          <CheckCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-lg font-serif font-light text-ink">Thank you!</h4>
          <p className="text-muted text-sm font-light leading-relaxed">
            Your testimonial has been submitted and is pending review. Once approved, it&apos;ll appear on this page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSubmitted?.()}
          className="bg-pine hover:bg-moss text-paper font-sans font-semibold text-sm py-3 px-6 rounded-full transition shadow-soft"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">
            Your Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Miller"
            required
            maxLength={150}
            disabled={mutation.isPending}
            className={field}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">
            Role / Title
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="PAC-12 Basketball Recruit"
            maxLength={200}
            disabled={mutation.isPending}
            className={field}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">
            School / Organization
          </label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="University of Oregon"
            maxLength={200}
            disabled={mutation.isPending}
            className={field}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">
            Sport / Field
          </label>
          <input
            type="text"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="Basketball (D1)"
            maxLength={200}
            disabled={mutation.isPending}
            className={field}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">
          Your Rating *
        </label>
        <StarRating value={rating} onChange={setRating} disabled={mutation.isPending} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">
          Your Testimonial *
        </label>
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Share your experience with TrueTrek Learning..."
          required
          rows={4}
          maxLength={2000}
          disabled={mutation.isPending}
          className={`${field} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper font-sans font-semibold text-sm uppercase tracking-wider py-4 px-4 rounded-full transition duration-150 flex items-center justify-center gap-2 shadow-soft"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Submit Testimonial
          </>
        )}
      </button>
    </form>
  );
}
