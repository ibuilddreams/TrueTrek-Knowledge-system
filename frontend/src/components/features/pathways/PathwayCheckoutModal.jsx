"use client";

import { useState } from "react";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatCoursePrice } from "@/lib/store";
import CloseButton from "@/components/ui/CloseButton";

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const FIELD_CLASS =
  "w-full px-3.5 py-2.5 bg-porcelain border border-line focus:border-moss rounded-xl text-xs font-sans text-ink placeholder:text-muted focus:outline-none focus:bg-paper transition";

function Field({ label, ...inputProps }) {
  return (
    <div>
      <label className="text-[9px] font-sans font-medium uppercase tracking-widest text-muted block mb-1.5">
        {label}
      </label>
      <input {...inputProps} className={FIELD_CLASS} />
    </div>
  );
}

export default function PathwayCheckoutModal({
  isOpen,
  pathways = [],
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
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
          className="fixed inset-0 z-[110] overflow-y-auto flex items-center justify-center p-6 bg-ink/60 backdrop-blur-xs"
          id="pathway-checkout-modal-layout"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-paper rounded-panel overflow-hidden max-w-md w-full border border-line shadow-2xl"
          >
            <CloseButton
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted hover:text-ink bg-paper/90 p-2 rounded-full shadow-md z-10 border border-line transition"
              iconClassName="w-4 h-4"
            />

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pine text-paper flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-light text-ink">Pathway Checkout</h3>
                  <p className="text-[10px] font-sans uppercase tracking-widest font-medium text-muted">
                    Simulated payment — no real charge
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-porcelain/80 p-3.5 space-y-2">
                {pathways.map((pathway) => (
                  <div key={pathway.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted truncate">{pathway.name}</span>
                    <span className="font-sans text-ink shrink-0">
                      {formatCoursePrice(pathway.base_price)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-line text-xs font-bold">
                  <span className="text-ink">Total</span>
                  <span className="font-sans font-semibold text-moss">{formatCoursePrice(subtotal)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <Field
                  label="Cardholder Name"
                  placeholder="Jane Doe"
                  value={form.cardholderName}
                  onChange={updateField("cardholderName")}
                  autoComplete="off"
                />
                <Field
                  label="Card Number"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  value={form.cardNumber}
                  onChange={updateField("cardNumber", formatCardNumber)}
                  autoComplete="off"
                />
                <div className="grid grid-cols-2 gap-3.5">
                  <Field
                    label="Expiry Date"
                    placeholder="MM/YY"
                    inputMode="numeric"
                    value={form.expiry}
                    onChange={updateField("expiry", formatExpiry)}
                    autoComplete="off"
                  />
                  <Field
                    label="CVV"
                    placeholder="123"
                    inputMode="numeric"
                    type="password"
                    value={form.cvv}
                    onChange={updateField("cvv", (v) => v.replace(/\D/g, "").slice(0, 4))}
                    autoComplete="off"
                  />
                </div>

                <p className="flex items-center gap-1.5 text-[10px] text-muted">
                  <Lock className="w-3 h-3 shrink-0" />
                  This is a demo checkout. Card details are never sent or stored.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || pathways.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:brightness-95 text-ink font-sans text-xs font-semibold uppercase tracking-widest py-3.5 rounded-full shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
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
