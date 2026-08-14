"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRouteForRole } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";

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
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="bg-white border border-stone-200/85 rounded-2xl shadow-xl relative overflow-hidden p-8 sm:p-10 text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />

        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl border bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center justify-center">
          <PartyPopper className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-serif font-bold mb-2 text-stone-900">You&apos;re In!</h2>
        <p className="text-xs font-light leading-relaxed text-stone-500 mb-8 max-w-md mx-auto">
          Welcome to TrueTrek Learning, {user?.name || user?.email}. Your account is ready
          {unlocked.length > 0
            ? ` and your pathway${unlocked.length === 1 ? " is" : "s are"} unlocked in your student portal.`
            : "."}
        </p>

        {unlocked.length > 0 && (
          <div className="text-left rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-2 mb-8">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Unlocked
            </p>
            {unlocked.map((item) => (
              <div
                key={item.pathway_enrollment_id || item.pathway_id}
                className="flex items-center gap-2.5 text-xs text-stone-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium">{item.pathway_name}</span>
                {"price_paid" in item && (
                  <span className="font-mono text-[10px] text-stone-400 ml-auto">
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
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-200"
        >
          Enter My Portal →
        </button>
      </div>
    </div>
  );
}
