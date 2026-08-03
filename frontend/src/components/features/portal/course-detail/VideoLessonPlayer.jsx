"use client";

import { useRef } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";

const SKIP_AMOUNTS = [-10, -5, 5, 10];

function SkipButton({ seconds, onSkip }) {
  const isForward = seconds > 0;
  const Icon = isForward ? RotateCw : RotateCcw;

  return (
    <button
      type="button"
      onClick={() => onSkip(seconds)}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-amber-300 hover:text-amber-800 text-stone-600 text-[11px] font-mono transition"
    >
      <Icon className="w-3.5 h-3.5" />
      {isForward ? "+" : "-"}
      {Math.abs(seconds)}s
    </button>
  );
}

function NativeVideoPlayer({ src }) {
  const videoRef = useRef(null);

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), duration);
  };

  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        controls
        className="w-full aspect-video rounded-xl bg-stone-950"
        src={src}
      >
        Your browser does not support the video tag.
      </video>
      <div className="flex items-center justify-center gap-2">
        {SKIP_AMOUNTS.map((seconds) => (
          <SkipButton key={seconds} seconds={seconds} onSkip={skip} />
        ))}
      </div>
    </div>
  );
}

export default function VideoLessonPlayer({ lesson }) {
  if (lesson.file) {
    return <NativeVideoPlayer src={lesson.file} />;
  }

  if (lesson.video_url) {
    const embedUrl = getVideoEmbedUrl(lesson.video_url);

    if (embedUrl) {
      return (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-stone-950">
          <iframe
            src={embedUrl}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    return <NativeVideoPlayer src={lesson.video_url} />;
  }

  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center">
      <p className="text-xs text-stone-500">No video source is attached to this lesson.</p>
    </div>
  );
}
