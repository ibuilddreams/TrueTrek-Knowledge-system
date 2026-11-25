"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRouteForRole } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";
import { CN_BTN_PRIMARY } from "@/components/ui/cobaltStyles";

export default function LmsAccessStep({ checkoutResult }) {
  const router = useRouter();
  const { user, role } = useAuth();

  const enrolledPathways = checkoutResult?.enrolled_pathways || [];
  const alreadyEnrolledPathways = checkoutResult?.already_enrolled_pathways || [];
  const unlocked = [...enrolledPathways, ...alreadyEnrolledPathways];

  function handleEnterPortal() {
    router.push(getPortalRouteForRole(role));
  }

  return (
    <>
      <div className="grid justify-items-center gap-3 text-center">
        <span
          aria-hidden="true"
          className="grid h-14 w-14 place-items-center rounded-cn bg-cn-ok-bg text-cn-ok"
        >
          <PartyPopper className="h-7 w-7" />
        </span>
        <h2 className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
          You&apos;re in.
        </h2>
        <p className="max-w-[460px] text-cn-ink-2">
          Welcome to Cool Nerdz, {user?.name || user?.email}. Your account is ready
          {unlocked.length > 0
            ? ` and your pathway${unlocked.length === 1 ? " is" : "s are"} waiting in your portal.`
            : "."}
        </p>
      </div>

      {unlocked.length > 0 && (
        <div className="grid gap-2.5 rounded-cn border border-cn-rule bg-cn-paper-2 p-4">
          <p className="text-cn-sm font-semibold text-cn-ink">Unlocked</p>
          {unlocked.map((item) => (
            <div
              key={item.pathway_enrollment_id || item.pathway_id}
              className="flex items-baseline gap-2.5 text-cn-sm"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 translate-y-0.5 text-cn-ok" />
              <span className="font-medium text-cn-ink">{item.pathway_name}</span>
              {"price_paid" in item && (
                <span className="ml-auto shrink-0 tabular-nums text-cn-muted">
                  {formatCoursePrice(item.price_paid)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleEnterPortal}
        className={`${CN_BTN_PRIMARY} w-full`}
      >
        Enter my portal
        <ArrowRight className="h-[18px] w-[18px]" />
      </button>
    </>
  );
}
