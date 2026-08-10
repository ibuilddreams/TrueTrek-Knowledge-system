"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Loader from "@/components/ui/Loader";
import FullScreenPortal from "./FullScreenPortal";

export default function LessonViewPending({ isError, errorMessage, onRetry }) {
  const { isVault } = useTheme();

  return (
    <FullScreenPortal>
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        {isError ? (
          <div className="text-center space-y-4 max-w-sm">
            <div
              className={`w-12 h-12 mx-auto rounded-2xl border flex items-center justify-center ${
                isVault
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-rose-50 border-rose-100 text-rose-600"
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className={`text-sm ${isVault ? "text-stone-400" : "text-stone-500"}`}>
              {errorMessage}
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider rounded-xl transition ${
                  isVault
                    ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                    : "bg-stone-900 hover:bg-stone-800 text-white"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            ) : null}
          </div>
        ) : (
          <Loader fullScreen={false} label="Loading your lesson..." />
        )}
      </div>
    </FullScreenPortal>
  );
}
