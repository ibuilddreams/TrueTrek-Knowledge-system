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
import { CN_BTN_PRIMARY, CN_BTN_SECONDARY } from "@/components/ui/cobaltStyles";

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

// The design's 50px control, the same field /login and /signup use — this step
// is the last screen of the journey those two start, so its inputs match rather
// than borrowing the store modal's shorter one.
const FIELD =
  "h-[50px] w-full rounded-cn-sm border border-cn-muted bg-white px-4 text-cn-ink transition-colors duration-150 hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent";
const LABEL = "text-cn-sm font-semibold text-cn-ink";

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
      <div className="flex min-h-[320px] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} tone="cobalt" label="Preparing checkout..." />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 flex-none place-items-center rounded-cn bg-cn-accent text-white"
        >
          <CreditCard className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
            Checkout.
          </h2>
          <p className="mt-2 text-cn-ink-2">
            Simulated payment — no card is charged and nothing is stored.
          </p>
        </div>
      </div>

      <div className="grid gap-2 rounded-cn border border-cn-rule bg-cn-paper-2 p-4 text-cn-sm">
        {pathways.map((pathway) => (
          <div key={pathway.id} className="flex items-baseline justify-between gap-3">
            <span className="truncate text-cn-ink-2">{pathway.name}</span>
            <span className="shrink-0 font-semibold tabular-nums text-cn-ink">
              {formatCoursePrice(pathway.base_price)}
            </span>
          </div>
        ))}

        {discountPercent > 0 && (
          <div className="flex items-baseline justify-between gap-3 text-cn-ok">
            <span>Bundle discount ({selectedPathwayIds.length} pathways)</span>
            <span className="font-semibold tabular-nums">-{discountPercent}%</span>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3 border-t border-cn-rule pt-2 font-semibold">
          <span className="text-cn-ink">Estimated total</span>
          <span className="tabular-nums text-cn-accent">
            {formatCoursePrice(estimatedTotal)}
          </span>
        </div>

        <p className="text-cn-xs text-cn-muted">
          An estimate — the final price is calculated when you confirm.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-1">
          <label htmlFor="input-checkout-name" className={LABEL}>
            Cardholder name
          </label>
          <input
            id="input-checkout-name"
            placeholder="Jane Doe"
            value={card.cardholderName}
            onChange={updateCardField("cardholderName")}
            autoComplete="off"
            className={FIELD}
          />
        </div>

        <div className="grid gap-1">
          <label htmlFor="input-checkout-number" className={LABEL}>
            Card number
          </label>
          <input
            id="input-checkout-number"
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            value={card.cardNumber}
            onChange={updateCardField("cardNumber", formatCardNumber)}
            autoComplete="off"
            className={FIELD}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <label htmlFor="input-checkout-expiry" className={LABEL}>
              Expiry date
            </label>
            <input
              id="input-checkout-expiry"
              placeholder="MM/YY"
              inputMode="numeric"
              value={card.expiry}
              onChange={updateCardField("expiry", formatExpiry)}
              autoComplete="off"
              className={FIELD}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="input-checkout-cvv" className={LABEL}>
              CVV
            </label>
            <input
              id="input-checkout-cvv"
              placeholder="123"
              inputMode="numeric"
              type="password"
              value={card.cvv}
              onChange={updateCardField("cvv", (v) => v.replace(/\D/g, "").slice(0, 4))}
              autoComplete="off"
              className={FIELD}
            />
          </div>
        </div>

        <p className="flex items-center gap-2 text-cn-sm text-cn-muted">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          This is a demo checkout. Card details are never sent or stored.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={checkoutMutation.isPending}
            className={CN_BTN_SECONDARY}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
            Back
          </button>
          <button
            type="submit"
            disabled={checkoutMutation.isPending}
            className={`${CN_BTN_PRIMARY} flex-1`}
          >
            <ShieldCheck className="h-[18px] w-[18px]" />
            {checkoutMutation.isPending ? "Processing..." : "Confirm payment"}
          </button>
        </div>
      </form>
    </>
  );
}
