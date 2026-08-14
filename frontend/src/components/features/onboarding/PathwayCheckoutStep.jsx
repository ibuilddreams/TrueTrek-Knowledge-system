"use client";

import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from "lucide-react";
import {
  checkoutPathways,
  getBundleRules,
  getPublicPathwayById,
} from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import { formatCoursePrice } from "@/lib/store";
import Loader from "@/components/ui/Loader";

// Same helpers as StorePaymentModal.jsx's dummy card form.
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
  "w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-600 rounded-xl text-xs font-mono text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white transition";

export default function PathwayCheckoutStep({ selectedPathwayIds, onBack, onComplete }) {
  const queryClient = useQueryClient();
  const [card, setCard] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const pathwayQueries = useQueries({
    queries: selectedPathwayIds.map((id) => ({
      queryKey: ["onboarding-pathway-preview", id],
      queryFn: async () => {
        const response = await getPublicPathwayById(id);
        return response?.data;
      },
    })),
  });

  const pathways = pathwayQueries.map((query) => query.data).filter(Boolean);
  const isLoadingPathways = pathwayQueries.some((query) => query.isLoading);

  // Bundle rules only matter once 2+ pathways are selected — the authoritative
  // discounted price is only known after checkoutPathways() actually runs, so
  // this is shown as an estimate only.
  const { data: bundleRules = [] } = useQuery({
    queryKey: ["onboarding-bundle-rules"],
    queryFn: async () => {
      const response = await getBundleRules();
      return response?.data || [];
    },
    enabled: selectedPathwayIds.length >= 2,
  });

  const subtotal = pathways.reduce((sum, pathway) => sum + (Number(pathway.base_price) || 0), 0);
  const matchingRule = bundleRules.find(
    (rule) => rule.pathway_count === selectedPathwayIds.length
  );
  const discountPercent = matchingRule?.discount_percent || 0;
  const estimatedTotal = discountPercent > 0 ? subtotal * (1 - discountPercent / 100) : subtotal;

  function updateCardField(field, transform) {
    return (event) => {
      const value = transform ? transform(event.target.value) : event.target.value;
      setCard((prev) => ({ ...prev, [field]: value }));
    };
  }

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutPathways(selectedPathwayIds),
    onSuccess: async (response) => {
      const result = response?.data || {
        enrolled_pathways: [],
        already_enrolled_pathways: [],
        failed_pathways: [],
      };
      const successCount =
        (result.enrolled_pathways?.length || 0) + (result.already_enrolled_pathways?.length || 0);

      (result.failed_pathways || []).forEach((item) => {
        const name = pathways.find((p) => p.id === item.pathway_id)?.name || "A pathway";
        toastError(`${name}: ${item.reason}`);
      });

      if (successCount > 0) {
        // Re-fetch (not just invalidate-in-background) before advancing —
        // LmsAccessStep's "Enter My Portal" button navigates to the portal
        // right after this step, and the portal's useNeedsOnboarding guard
        // reads this same cache key synchronously on mount. Without awaiting
        // a real refetch here first, that guard can still see the stale
        // pre-checkout "zero pathways" result and bounce the student straight
        // back into the onboarding wizard.
        await queryClient.invalidateQueries({ queryKey: ["my-pathways-onboarding-check"] });
        // Portal's own pathway summary (MyPathwaysSummary) uses a separate
        // cache key for the same endpoint — refresh it too so newly
        // purchased pathways show up immediately instead of after a reload.
        queryClient.invalidateQueries({ queryKey: ["my-pathways"] });

        toastSuccess(
          successCount === 1
            ? "Payment successful — you're enrolled!"
            : `Payment successful — you're enrolled in ${successCount} pathways!`
        );
        onComplete(result);
      }
    },
    onError: (mutationError) => {
      toastError(getApiErrorMessage(mutationError, "Checkout failed. Please try again."));
    },
  });

  // Dummy checkout — no real payment gateway exists in this codebase yet, so
  // there's nothing to validate here (any card number/expiry/CVV goes
  // through). Real validation arrives with the real payment integration —
  // mirrors the precedent set by StorePaymentModal.jsx.
  function handleSubmit(event) {
    event.preventDefault();
    checkoutMutation.mutate();
  }

  if (isLoadingPathways) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader fullScreen={false} label="Preparing checkout..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="bg-white border border-stone-200/85 rounded-2xl shadow-xl relative overflow-hidden p-8 sm:p-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-stone-900 text-xl">Checkout</h2>
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              Simulated payment — no real charge
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-2 mb-6">
          {pathways.map((pathway) => (
            <div key={pathway.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-stone-600 truncate">{pathway.name}</span>
              <span className="font-mono text-stone-800 shrink-0">
                {formatCoursePrice(pathway.base_price)}
              </span>
            </div>
          ))}
          {discountPercent > 0 && (
            <div className="flex items-center justify-between gap-3 text-xs text-emerald-700">
              <span>Bundle discount ({selectedPathwayIds.length} pathways)</span>
              <span className="font-mono">-{discountPercent}%</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs font-bold">
            <span className="text-stone-900">Estimated Total</span>
            <span className="font-mono text-amber-800">{formatCoursePrice(estimatedTotal)}</span>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 pt-1">
            Estimate only — the final price is calculated at checkout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">
              Cardholder Name
            </label>
            <input
              placeholder="Jane Doe"
              value={card.cardholderName}
              onChange={updateCardField("cardholderName")}
              autoComplete="off"
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">
              Card Number
            </label>
            <input
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              value={card.cardNumber}
              onChange={updateCardField("cardNumber", formatCardNumber)}
              autoComplete="off"
              className={FIELD_CLASS}
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">
                Expiry Date
              </label>
              <input
                placeholder="MM/YY"
                inputMode="numeric"
                value={card.expiry}
                onChange={updateCardField("expiry", formatExpiry)}
                autoComplete="off"
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">
                CVV
              </label>
              <input
                placeholder="123"
                inputMode="numeric"
                type="password"
                value={card.cvv}
                onChange={updateCardField("cvv", (v) => v.replace(/\D/g, "").slice(0, 4))}
                autoComplete="off"
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-[10px] text-stone-400">
            <Lock className="w-3 h-3 shrink-0" />
            This is a demo checkout. Card details are never sent or stored.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              disabled={checkoutMutation.isPending}
              className="flex items-center justify-center gap-2 border border-stone-200 text-stone-600 hover:bg-stone-50 font-mono text-xs font-bold uppercase tracking-wider py-3.5 px-5 rounded-xl transition disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <button
              type="submit"
              disabled={checkoutMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              {checkoutMutation.isPending ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
