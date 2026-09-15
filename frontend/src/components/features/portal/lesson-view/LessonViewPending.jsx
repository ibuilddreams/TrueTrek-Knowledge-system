"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import Loader from "@/components/ui/Loader";
import FullScreenPortal from "./FullScreenPortal";

export default function LessonViewPending({ isError, errorMessage, onRetry }) {
  return (
    <FullScreenPortal>
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        {isError ? (
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-12 h-12 mx-auto rounded-2xl border flex items-center justify-center bg-rose-50 border-rose-100 text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-muted">
              {errorMessage}
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl transition bg-pine hover:bg-moss text-paper"
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
