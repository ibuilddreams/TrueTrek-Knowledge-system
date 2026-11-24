"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, History, RotateCcw, ShieldCheck } from "lucide-react";
import {
  getLatestMediaKitReview,
  uploadMediaKit,
} from "@/services/brandValidatorService";
import { isReviewRunning, useMediaKitReview } from "@/hooks/student/useMediaKitReview";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import PortalCard from "../shell/PortalCard";
import { PortalButton, PortalPageHead } from "../shell/PortalUI";
import MediaKitUploader from "../brand/MediaKitUploader";
import ReviewProgressPanel from "../brand/ReviewProgressPanel";
import MediaKitReviewResult from "../brand/MediaKitReviewResult";
import NotAMediaKitPanel from "../brand/NotAMediaKitPanel";
import MediaKitHistoryList from "../brand/MediaKitHistoryList";

export default function BrandValidatorTab() {
  const queryClient = useQueryClient();
  // `null` means "show the uploader"; an id means "show that review". Kept
  // separate from the latest-review query so "Review a new version" can
  // return to the uploader without discarding the completed review.
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [hasRestored, setHasRestored] = useState(false);

  // On mount, pick up whatever the student left behind — a finished review to
  // read, or an in-flight one to keep polling after a refresh or tab change.
  const { data: latest, isLoading: isLoadingLatest } = useQuery({
    queryKey: ["media-kit-review", "latest"],
    queryFn: async () => {
      const response = await getLatestMediaKitReview();
      return response?.data || null;
    },
  });

  useEffect(() => {
    if (hasRestored || isLoadingLatest) return;
    if (latest?.id) setActiveReviewId(latest.id);
    setHasRestored(true);
  }, [hasRestored, isLoadingLatest, latest]);

  const { data: review, isLoading: isLoadingReview } = useMediaKitReview(activeReviewId);

  const uploadMutation = useMutation({
    mutationFn: ({ file, athleteContext }) => uploadMediaKit({ file, athleteContext }),
  });

  const handleUpload = async ({ file, athleteContext }) => {
    try {
      const response = await uploadMutation.mutateAsync({ file, athleteContext });
      const created = response?.data;
      if (created?.id) {
        // Seed the cache so the progress panel renders immediately instead of
        // flashing a loader while the first poll lands.
        queryClient.setQueryData(["media-kit-review", created.id], created);
        setActiveReviewId(created.id);
      }
      toastSuccess("Media kit uploaded — your review is being generated.");
      queryClient.invalidateQueries({ queryKey: ["media-kit-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["media-kit-review", "latest"] });
    } catch (uploadError) {
      toastError(getApiErrorMessage(uploadError, "Unable to upload your media kit."));
    }
  };

  const handleStartOver = () => setActiveReviewId(null);

  const handleOpenReview = (id) => {
    setActiveReviewId(id);
    setActiveSection("validator");
  };

  const renderValidator = () => {
    if (isLoadingLatest && !hasRestored) {
      return (
        <PortalCard className="p-10">
          <Loader fullScreen={false} tone="cobalt" label="Loading your brand review..." />
        </PortalCard>
      );
    }

    if (!activeReviewId) {
      return (
        <MediaKitUploader
          onSubmit={handleUpload}
          isSubmitting={uploadMutation.isPending}
        />
      );
    }

    if (isLoadingReview && !review) {
      return (
        <div className="bg-cn-p-card border border-cn-p-line rounded-2xl p-10">
          <Loader fullScreen={false} label="Loading your brand review..." />
        </div>
      );
    }

    if (isReviewRunning(review)) {
      return <ReviewProgressPanel fileName={review?.original_name} />;
    }

    if (review?.status === "FAILED") {
      return (
        <PortalCard className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h3 className="text-lg font-bold text-cn-p-ink">
            We couldn&apos;t finish that review
          </h3>
          <p className="max-w-sm text-sm leading-relaxed text-cn-p-ink-2">
            {review.error_message || "Something went wrong while reviewing your media kit."}
          </p>
          <PortalButton size="sm" onClick={handleStartOver}>
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </PortalButton>
        </PortalCard>
      );
    }

    if (review?.status === "COMPLETED") {
      // A completed review of something that wasn't a media kit gets its own
      // screen — a 0/100 scorecard would misrepresent what happened.
      if (review.is_media_kit === false) {
        return <NotAMediaKitPanel review={review} onStartOver={handleStartOver} />;
      }
      return <MediaKitReviewResult review={review} onStartOver={handleStartOver} />;
    }

    return (
      <MediaKitUploader onSubmit={handleUpload} isSubmitting={uploadMutation.isPending} />
    );
  };

  // The uploader shares the page with past reviews, as the design lays it out;
  // anything that is a *result* — a review in flight, a finished scorecard, a
  // failure, a not-a-media-kit — takes the whole width instead, because that
  // is the one thing the reader is there to read.
  const isResultView =
    Boolean(activeReviewId) || isReviewRunning(review) || Boolean(review?.status);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Brand validator"
        subtitle="Upload your one-page media kit and get an AI critique before a sponsor sees it."
      />

      {/* Same stable-position rule as the wargamer screen: one wrapper whose
          columns change, never two different trees holding the same child. */}
      <div
        className={
          isResultView
            ? "grid grid-cols-[minmax(0,1fr)] gap-6"
            : "grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        }
      >
        <div className="min-w-0">{renderValidator()}</div>
        {!isResultView && <MediaKitHistoryList onOpenReview={handleOpenReview} />}
      </div>
    </div>
  );
}
