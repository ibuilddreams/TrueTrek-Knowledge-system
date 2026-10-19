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
import TabNav from "@/components/ui/TabNav";
import MediaKitUploader from "../brand/MediaKitUploader";
import ReviewProgressPanel from "../brand/ReviewProgressPanel";
import MediaKitReviewResult from "../brand/MediaKitReviewResult";
import NotAMediaKitPanel from "../brand/NotAMediaKitPanel";
import MediaKitHistoryList from "../brand/MediaKitHistoryList";

const SECTIONS = [
  { id: "validator", label: "Brand Validator", icon: ShieldCheck },
  { id: "history", label: "Past Reviews", icon: History },
];

export default function BrandValidatorTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("validator");
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
        <div className="bg-paper border border-line rounded-2xl p-10">
          <Loader fullScreen={false} label="Loading your brand review..." />
        </div>
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
        <div className="bg-paper border border-line rounded-2xl p-10">
          <Loader fullScreen={false} label="Loading your brand review..." />
        </div>
      );
    }

    if (isReviewRunning(review)) {
      return <ReviewProgressPanel fileName={review?.original_name} />;
    }

    if (review?.status === "FAILED") {
      return (
        <div className="bg-paper border border-line rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose/35 border border-clay/25 text-clay flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-serif font-light text-ink">
            We couldn&apos;t finish that review
          </h3>
          <p className="text-sm text-muted font-light max-w-sm leading-relaxed">
            {review.error_message || "Something went wrong while reviewing your media kit."}
          </p>
          <button
            type="button"
            onClick={handleStartOver}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-pine hover:bg-moss text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
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

  return (
    <div className="space-y-6">
      <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-serif font-light text-ink">The Brand Validator</h2>
            <p className="text-xs text-muted font-light mt-1 leading-relaxed">
              Upload your one-page media kit and have it read the way a local business owner
              would read it — before you send it to one.
            </p>
          </div>
        </div>
      </div>

      <TabNav
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        ariaLabel="Brand validator sections"
        size="lg"
      />

      {activeSection === "validator" && renderValidator()}
      {activeSection === "history" && <MediaKitHistoryList onOpenReview={handleOpenReview} />}
    </div>
  );
}
