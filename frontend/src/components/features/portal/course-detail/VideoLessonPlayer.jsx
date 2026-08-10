"use client";

import { useEffect, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";
import { useTheme } from "@/hooks/useTheme";

const SKIP_AMOUNTS = [-10, -5, 5, 10];

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function OverlaySkipButton({ seconds, onSkip }) {
  const isForward = seconds > 0;
  const Icon = isForward ? RotateCw : RotateCcw;

  return (
    <button
      type="button"
      onClick={() => onSkip(seconds)}
      className="inline-flex items-center gap-1 text-white/80 hover:text-white transition"
      title={`${isForward ? "Forward" : "Back"} ${Math.abs(seconds)}s`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-mono hidden sm:inline">
        {isForward ? "+" : "-"}
        {Math.abs(seconds)}s
      </span>
    </button>
  );
}

function NativeVideoPlayer({ src }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  function skip(seconds) {
    const video = videoRef.current;
    if (!video) return;
    const max = Number.isFinite(video.duration) ? video.duration : Infinity;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), max);
  }

  function handleSeek(event) {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(event.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-stone-800 bg-black shadow-inner"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={src}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        playsInline
        className="w-full aspect-video object-contain bg-black cursor-pointer select-none"
      >
        Your browser does not support the video tag.
      </video>

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors"
        >
          <span className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-600 hover:bg-amber-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1" />
          </span>
        </button>
      )}

      <div
        onClick={(event) => event.stopPropagation()}
        className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-linear-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2.5"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold text-white/90 w-9 shrink-0 select-none">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={handleSeek}
            className="w-full h-1 rounded-lg appearance-auto cursor-pointer accent-amber-500 bg-white/20"
          />
          <span className="text-[10px] font-mono text-white/60 w-9 shrink-0 text-right select-none">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={togglePlay}
              className="text-white/90 hover:text-white transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="text-white/90 hover:text-white transition"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-3 border-l border-white/20 pl-3.5">
              {SKIP_AMOUNTS.map((seconds) => (
                <OverlaySkipButton key={seconds} seconds={seconds} onSkip={skip} />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="text-white/90 hover:text-white transition"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoLessonPlayer({ lesson }) {
  const { isVault } = useTheme();

  if (lesson.file) {
    return <NativeVideoPlayer src={lesson.file} />;
  }

  if (lesson.video_url) {
    const embedUrl = getVideoEmbedUrl(lesson.video_url);

    if (embedUrl) {
      return (
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-stone-800">
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
    <div
      className={`rounded-2xl border border-dashed px-4 py-10 text-center ${
        isVault ? "border-stone-700 bg-white/5" : "border-stone-200 bg-stone-50"
      }`}
    >
      <p className={`text-xs ${isVault ? "text-stone-400" : "text-stone-500"}`}>
        No video source is attached to this lesson.
      </p>
    </div>
  );
}
