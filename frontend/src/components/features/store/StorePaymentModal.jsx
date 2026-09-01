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

function Field({ label, isLg, ...inputProps }) {
  const fieldClass = `w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-600 rounded-xl ${
    isLg ? "text-sm" : "text-xs"
  } font-mono text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white transition`;
  return (
    <div>
      <label
        className={`${isLg ? "text-[10px]" : "text-[9px]"} font-mono uppercase tracking-wider text-stone-400 block mb-1.5`}
      >
        {label}
      </label>
      <input {...inputProps} className={fieldClass} />
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
}) {
  const isLg = size === "lg";
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
          className="fixed inset-0 z-[110] overflow-y-auto flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-xs"
          id="store-payment-modal-layout"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-3xl overflow-hidden max-w-md w-full border border-stone-200 shadow-2xl"
          >
            <CloseButton
              onClick={handleClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 bg-white/90 p-2 rounded-full shadow-md z-10 border border-stone-200 transition"
              iconClassName="w-4 h-4"
            />

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900">Checkout</h3>
                  <p
                    className={`${isLg ? "text-[11px]" : "text-[10px]"} font-mono uppercase tracking-wider text-stone-400`}
                  >
                    Simulated payment — no real charge
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2">
                {items.map((course) => (
                  <div
                    key={course.id}
                    className={`flex items-center justify-between gap-3 ${isLg ? "text-sm" : "text-xs"}`}
                  >
                    <span className="text-stone-600 truncate">{course.title}</span>
                    <span className="font-mono text-stone-800 shrink-0">
                      {formatCoursePrice(course.amount)}
                    </span>
                  </div>
                ))}
                <div
                  className={`flex items-center justify-between pt-2 border-t border-stone-200 font-bold ${isLg ? "text-sm" : "text-xs"}`}
                >
                  <span className="text-stone-900">Total</span>
                  <span className="font-mono text-amber-800">{formatCoursePrice(subtotal)}</span>
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
                />
                <Field
                  label="Card Number"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  value={form.cardNumber}
                  onChange={updateField("cardNumber", formatCardNumber)}
                  autoComplete="off"
                  isLg={isLg}
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
                  />
                </div>

                <p
                  className={`flex items-center gap-1.5 ${isLg ? "text-[11px]" : "text-[10px]"} text-stone-400`}
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  This is a demo checkout. Card details are never sent or stored.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-mono ${isLg ? "text-sm" : "text-xs"} font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`}
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
