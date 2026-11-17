"use client";

import { useState } from "react";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatCoursePrice } from "@/lib/store";
import CloseButton from "@/components/ui/CloseButton";
import { CN_BTN_PRIMARY } from "@/components/ui/cobaltStyles";

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// The cart is on the cobalt design while onboarding's checkout step is still
// porcelain, and this modal serves both — so the look is a prop defaulting to
// the old values rather than a rewrite, matching the `tone` convention used by
// the other shared components. `porcelain` must keep emitting exactly the
// classes it emitted before this prop existed. Sizing stays on `isLg`, which is
// a separate axis: either tone can be rendered at either size.
const TONES = {
  porcelain: {
    overlay: "bg-ink/60",
    panel: "bg-paper rounded-panel border-line shadow-elevated",
    close:
      "absolute top-4 right-4 text-muted hover:text-ink bg-paper/90 p-2 rounded-full shadow-md z-10 border border-line transition",
    badge: "rounded-xl bg-pine text-paper",
    title: "font-serif font-light text-ink",
    eyebrow: "font-sans font-medium uppercase tracking-widest text-muted",
    summary: "rounded-xl border border-line bg-porcelain/80",
    lineLabel: "text-muted truncate",
    linePrice: "font-sans font-semibold text-ink shrink-0",
    totalRule: "border-line",
    totalLabel: "text-ink",
    totalPrice: "font-sans font-semibold text-ink",
    fieldLabel: "font-sans font-medium uppercase tracking-widest text-muted block mb-1.5",
    field:
      "w-full px-3.5 py-2.5 bg-porcelain border border-line focus:border-pine rounded-xl font-mono text-ink placeholder:text-muted focus:outline-none focus:bg-paper transition",
    note: "text-muted",
    submit:
      "w-full flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper font-sans font-medium uppercase tracking-widest py-3.5 rounded-full shadow-soft transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed",
    // Porcelain's button has no type size of its own, so it takes the modal's.
    submitFollowsSize: true,
  },
  cobalt: {
    overlay: "bg-cn-ink/60",
    panel: "bg-white rounded-cn-lg border-cn-rule shadow-cn-3",
    close:
      "absolute top-4 right-4 z-10 rounded-full border border-cn-rule bg-white/90 p-2 text-cn-muted shadow-cn-1 transition-colors duration-150 hover:text-cn-ink",
    badge: "rounded-cn bg-cn-accent text-white",
    title: "text-cn-lg font-bold tracking-[-0.015em] text-cn-ink",
    eyebrow: "font-semibold uppercase tracking-widest text-cn-muted",
    summary: "rounded-cn border border-cn-rule bg-cn-paper-2",
    lineLabel: "text-cn-muted truncate",
    linePrice: "font-semibold text-cn-ink shrink-0",
    totalRule: "border-cn-rule",
    totalLabel: "text-cn-ink",
    totalPrice: "font-semibold text-cn-accent",
    fieldLabel: "font-semibold uppercase tracking-widest text-cn-muted block mb-1.5",
    field:
      "w-full px-3.5 py-2.5 bg-cn-paper-2 border border-cn-rule focus:border-cn-accent rounded-cn-sm text-cn-ink placeholder:text-cn-muted focus:outline-none focus:bg-white transition-colors duration-150",
    note: "text-cn-muted",
    // The design's standard control: a fixed 50px/14px action. It carries its
    // own `text-sm`, so the modal's size must not append a second type size —
    // two of those resolve by the order Tailwind emits them, not the order
    // they are written, and the appended one would silently lose.
    submit: `${CN_BTN_PRIMARY} w-full`,
    submitFollowsSize: false,
  },
};

function Field({ label, isLg, styles, ...inputProps }) {
  return (
    <div>
      <label className={`${isLg ? "text-[10px]" : "text-[9px]"} ${styles.fieldLabel}`}>
        {label}
      </label>
      <input
        {...inputProps}
        className={`${isLg ? "text-sm" : "text-xs"} ${styles.field}`}
      />
    </div>
  );
}

export default function StorePaymentModal({
  isOpen,
  items = [],
  isSubmitting = false,
  onClose,
  onConfirm,
  size = "base",
  tone = "porcelain",
}) {
  const isLg = size === "lg";
  const styles = TONES[tone] ?? TONES.porcelain;
  const [form, setForm] = useState({ cardholderName: "", cardNumber: "", expiry: "", cvv: "" });

  const subtotal = items.reduce((sum, course) => sum + (Number(course.amount) || 0), 0);

  function updateField(field, transform) {
    return (event) => {
      const value = transform ? transform(event.target.value) : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  function handleClose() {
    setForm({ cardholderName: "", cardNumber: "", expiry: "", cvv: "" });
    onClose();
  }

  // Dummy checkout — no real payment gateway yet, so there's nothing to
  // validate here (any card number/expiry/CVV goes through). Real validation
  // arrives with the real payment integration.
  function handleSubmit(event) {
    event.preventDefault();
    onConfirm();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-[110] overflow-y-auto flex items-center justify-center p-6 backdrop-blur-xs ${styles.overlay}`}
          id="store-payment-modal-layout"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`relative overflow-hidden max-w-md w-full border ${styles.panel}`}
          >
            <CloseButton
              onClick={handleClose}
              className={styles.close}
              iconClassName="w-4 h-4"
            />

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 flex items-center justify-center shrink-0 ${styles.badge}`}
                >
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={styles.title}>Checkout</h3>
                  <p className={`${isLg ? "text-[11px]" : "text-[10px]"} ${styles.eyebrow}`}>
                    Simulated payment — no real charge
                  </p>
                </div>
              </div>

              <div className={`p-3.5 space-y-2 ${styles.summary}`}>
                {items.map((course) => (
                  <div
                    key={course.id}
                    className={`flex items-center justify-between gap-3 ${isLg ? "text-sm" : "text-xs"}`}
                  >
                    <span className={styles.lineLabel}>{course.title}</span>
                    <span className={styles.linePrice}>
                      {formatCoursePrice(course.amount)}
                    </span>
                  </div>
                ))}
                <div
                  className={`flex items-center justify-between pt-2 border-t font-bold ${isLg ? "text-sm" : "text-xs"} ${styles.totalRule}`}
                >
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalPrice}>{formatCoursePrice(subtotal)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <Field
                  label="Cardholder Name"
                  placeholder="Jane Doe"
                  value={form.cardholderName}
                  onChange={updateField("cardholderName")}
                  autoComplete="off"
                  isLg={isLg}
                  styles={styles}
                />
                <Field
                  label="Card Number"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  value={form.cardNumber}
                  onChange={updateField("cardNumber", formatCardNumber)}
                  autoComplete="off"
                  isLg={isLg}
                  styles={styles}
                />
                <div className="grid grid-cols-2 gap-3.5">
                  <Field
                    label="Expiry Date"
                    placeholder="MM/YY"
                    inputMode="numeric"
                    value={form.expiry}
                    onChange={updateField("expiry", formatExpiry)}
                    autoComplete="off"
                    isLg={isLg}
                    styles={styles}
                  />
                  <Field
                    label="CVV"
                    placeholder="123"
                    inputMode="numeric"
                    type="password"
                    value={form.cvv}
                    onChange={updateField("cvv", (v) => v.replace(/\D/g, "").slice(0, 4))}
                    autoComplete="off"
                    isLg={isLg}
                    styles={styles}
                  />
                </div>

                <p
                  className={`flex items-center gap-1.5 ${isLg ? "text-[11px]" : "text-[10px]"} ${styles.note}`}
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  This is a demo checkout. Card details are never sent or stored.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${styles.submit}${
                    styles.submitFollowsSize ? (isLg ? " text-sm" : " text-xs") : ""
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? "Processing..." : "Confirm Payment"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
