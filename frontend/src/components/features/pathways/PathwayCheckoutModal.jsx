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

// This modal opens over four different screens, and they are not all on the
// same design: `/pathways` is cobalt while the pathway detail page, the custom
// builder and the student portal's picker are still porcelain. So the look is
// a prop with the old values as its default, rather than a rewrite — the same
// `tone` convention the other shared components here use. `porcelain` must keep
// emitting exactly the classes it emitted before this prop existed.
const TONES = {
  porcelain: {
    overlay: "bg-ink/60",
    panel: "bg-paper rounded-panel border-line shadow-2xl",
    close:
      "absolute top-4 right-4 text-muted hover:text-ink bg-paper/90 p-2 rounded-full shadow-md z-10 border border-line transition",
    badge: "rounded-xl bg-pine text-paper",
    title: "font-serif font-light text-ink",
    eyebrow: "text-[10px] font-sans uppercase tracking-widest font-medium text-muted",
    summary: "rounded-xl border border-line bg-porcelain/80",
    lineLabel: "text-muted truncate",
    linePrice: "font-sans text-ink shrink-0",
    totalRule: "border-line",
    totalLabel: "text-ink",
    totalPrice: "font-sans font-semibold text-moss",
    fieldLabel:
      "text-[9px] font-sans font-medium uppercase tracking-widest text-muted block mb-1.5",
    field:
      "w-full px-3.5 py-2.5 bg-porcelain border border-line focus:border-moss rounded-xl text-xs font-sans text-ink placeholder:text-muted focus:outline-none focus:bg-paper transition",
    note: "text-muted",
    submit:
      "w-full flex items-center justify-center gap-2 bg-gold hover:brightness-95 text-ink font-sans text-xs font-semibold uppercase tracking-widest py-3.5 rounded-full shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed",
  },
  cobalt: {
    overlay: "bg-cn-ink/60",
    panel: "bg-white rounded-cn-lg border-cn-rule shadow-cn-3",
    close:
      "absolute top-4 right-4 z-10 rounded-full border border-cn-rule bg-white/90 p-2 text-cn-muted shadow-cn-1 transition-colors duration-150 hover:text-cn-ink",
    badge: "rounded-cn bg-cn-accent text-white",
    title: "text-cn-lg font-bold tracking-[-0.015em] text-cn-ink",
    eyebrow: "text-[13px] text-cn-muted",
    summary: "rounded-cn border border-cn-rule bg-cn-paper-2",
    lineLabel: "text-cn-muted truncate",
    linePrice: "font-semibold text-cn-ink shrink-0",
    totalRule: "border-cn-rule",
    totalLabel: "text-cn-ink",
    totalPrice: "font-semibold text-cn-accent",
    // The design's `.flabel` is a 13px semibold label, not a tracked kicker.
    fieldLabel: "mb-1.5 block text-[13px] font-semibold text-cn-ink",
    field:
      "w-full px-3.5 py-2.5 bg-cn-paper-2 border border-cn-rule focus:border-cn-accent rounded-cn-sm text-xs text-cn-ink placeholder:text-cn-muted focus:outline-none focus:bg-white transition-colors duration-150",
    note: "text-cn-muted",
    submit: `${CN_BTN_PRIMARY} w-full`,
  },
};

function Field({ label, styles, ...inputProps }) {
  return (
    <div>
      <label className={styles.fieldLabel}>{label}</label>
      <input {...inputProps} className={styles.field} />
    </div>
  );
}

export default function PathwayCheckoutModal({
  isOpen,
  pathways = [],
  isSubmitting = false,
  onClose,
  onConfirm,
  tone = "porcelain",
}) {
  const styles = TONES[tone] ?? TONES.porcelain;
  const [form, setForm] = useState({ cardholderName: "", cardNumber: "", expiry: "", cvv: "" });

  const subtotal = pathways.reduce((sum, pathway) => sum + (Number(pathway.base_price) || 0), 0);

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
          id="pathway-checkout-modal-layout"
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
                  <h3 className={styles.title}>Pathway Checkout</h3>
                  <p className={styles.eyebrow}>Simulated payment — no real charge</p>
                </div>
              </div>

              <div className={`p-3.5 space-y-2 ${styles.summary}`}>
                {pathways.map((pathway) => (
                  <div key={pathway.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className={styles.lineLabel}>{pathway.name}</span>
                    <span className={styles.linePrice}>
                      {formatCoursePrice(pathway.base_price)}
                    </span>
                  </div>
                ))}
                <div
                  className={`flex items-center justify-between pt-2 border-t text-xs font-bold ${styles.totalRule}`}
                >
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalPrice}>{formatCoursePrice(subtotal)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <Field
                  label="Cardholder name"
                  placeholder="Jane Doe"
                  value={form.cardholderName}
                  onChange={updateField("cardholderName")}
                  autoComplete="off"
                  styles={styles}
                />
                <Field
                  label="Card number"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  value={form.cardNumber}
                  onChange={updateField("cardNumber", formatCardNumber)}
                  autoComplete="off"
                  styles={styles}
                />
                <div className="grid grid-cols-2 gap-3.5">
                  <Field
                    label="Expiry date"
                    placeholder="MM/YY"
                    inputMode="numeric"
                    value={form.expiry}
                    onChange={updateField("expiry", formatExpiry)}
                    autoComplete="off"
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
                    styles={styles}
                  />
                </div>

                <p className={`flex items-center gap-1.5 text-[10px] ${styles.note}`}>
                  <Lock className="w-3 h-3 shrink-0" />
                  This is a demo checkout. Card details are never sent or stored.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || pathways.length === 0}
                  className={styles.submit}
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
