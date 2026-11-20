"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import Loader from "@/components/ui/Loader";
import PortalCard from "../shell/PortalCard";
import { PortalButton, PortalEmpty } from "../shell/PortalUI";

/**
 * The lesson screen before its course has loaded — shown on a refresh that
 * lands straight on a lesson URL, so the student sees the reader's own card
 * settling rather than the course library flashing past first.
 */
export default function LessonViewPending({ isError, errorMessage, onRetry }) {
  if (isError) {
    return (
      <PortalCard>
        <PortalEmpty
          icon={AlertCircle}
          title="Couldn't open this lesson"
          text={errorMessage || "Unable to load this course right now."}
        >
          {onRetry && (
            <PortalButton onClick={onRetry}>
              <RefreshCw className="h-[18px] w-[18px]" />
              Retry
            </PortalButton>
          )}
        </PortalEmpty>
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading lesson..." />
      </div>
    </PortalCard>
  );
}
