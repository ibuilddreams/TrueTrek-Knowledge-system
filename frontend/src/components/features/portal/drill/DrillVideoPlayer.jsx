"use client";

import { useCallback, useRef } from "react";

const REPORT_INTERVAL_MS = 5000;

/**
 * Plain native <video> — this codebase has no video library (see
 * VideoLessonPlayer.jsx for the same convention). Reports watched
 * percentage via `onProgress(percent)` at most once every REPORT_INTERVAL_MS
 * while playing, plus once more on pause — a high-water mark is kept
 * server-side (see daily_drill.admin_drill_services.record_video_progress),
 * so under-reporting here just delays the quiz unlocking, never fabricates
 * progress that wasn't actually watched.
 */
export default function DrillVideoPlayer({ src, onProgress }) {
  const lastReportedAt = useRef(0);

  const reportProgress = useCallback(
    (event) => {
      const video = event.currentTarget;
      if (!video.duration || Number.isNaN(video.duration)) return;
      const percent = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
      onProgress?.(percent);
    },
    [onProgress],
  );

  const handleTimeUpdate = (event) => {
    const now = Date.now();
    if (now - lastReportedAt.current < REPORT_INTERVAL_MS) return;
    lastReportedAt.current = now;
    reportProgress(event);
  };

  return (
    <video
      src={src}
      controls
      playsInline
      onTimeUpdate={handleTimeUpdate}
      onPause={reportProgress}
      onEnded={reportProgress}
      className="w-full aspect-video object-contain bg-black rounded-xl"
    >
      Your browser does not support the video tag.
    </video>
  );
}
