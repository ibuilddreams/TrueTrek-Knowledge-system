"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clapperboard, Download, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useClassRecording } from "@/hooks/useClassRecording";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  formatClassDate,
  formatClassTime,
  formatRecordingLength,
} from "./classSessionUtils";

/**
 * Watching back a class that has finished.
 *
 * The link is fetched when this opens and never before: the server signs a
 * fresh one per request and it expires in hours
 * (class_sessions/services.py::recording_playback_url), so there is nothing
 * to cache and nothing forwardable sitting in a list payload. The card that
 * opens this knows only *that* a recording exists, from a flag on the class.
 */

/**
 * Whether this browser can play the file we were given.
 *
 * Almost every recording is an MP4, which plays everywhere. The HLS playlist
 * is only ever handed out when a class ended without the server noticing
 * (`services._pick_playable_file`), and Safari plays it natively while Chrome
 * and Firefox do not — so rather than pull in a streaming library for a rare
 * fallback, those browsers are told plainly and offered the file to download.
 */
function canPlayUrl(url) {
  if (!url) return true;
  const path = String(url).split("?")[0].toLowerCase();
  if (!path.endsWith(".m3u8")) return true;
  if (typeof document === "undefined") return true;
  const probe = document.createElement("video");
  return Boolean(probe.canPlayType("application/vnd.apple.mpegurl"));
}

export default function ClassRecordingModal({ session, isOpen, onClose }) {
  const { data, isLoading, isError, error } = useClassRecording(session?.id, {
    enabled: Boolean(isOpen && session?.id),
  });
  const [playable, setPlayable] = useState(true);
  const videoRef = useRef(null);

  const url = data?.url || null;

  useEffect(() => {
    setPlayable(canPlayUrl(url));
  }, [url]);

  // Stop the audio the moment the dialog closes. A <video> inside an unmounted
  // tree is normally torn down with it, but the modal animates out, and half a
  // second of a teacher's voice after the close button is startling.
  useEffect(() => {
    if (isOpen) return;
    videoRef.current?.pause();
  }, [isOpen]);

  const length = formatRecordingLength(data?.duration_seconds);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Clapperboard}
      title="Class Recording"
      subtitle={session?.title}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono uppercase tracking-wider text-muted">
          <span>
            {session?.course_code} · {session?.course_title}
          </span>
          <span>
            {formatClassDate(session?.scheduled_at)} ·{" "}
            {formatClassTime(session?.scheduled_at)}
          </span>
          {length && <span>{length}</span>}
        </div>

        {isLoading && (
          <div className="aspect-video rounded-2xl bg-porcelain border border-line flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-muted animate-spin" />
            <p className="text-xs font-mono uppercase tracking-wider text-muted">
              Fetching the recording…
            </p>
          </div>
        )}

        {!isLoading && (isError || !url) && (
          <div className="aspect-video rounded-2xl bg-porcelain border border-line flex flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="w-11 h-11 rounded-2xl bg-rose/25 border border-clay/25 text-clay flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <p className="text-sm font-light text-muted leading-relaxed max-w-sm">
              {isError
                ? getApiErrorMessage(error, "This recording couldn't be loaded.")
                : data?.is_processing
                  ? "This class has finished and the recording is still being put together. You'll get a notification the moment it's ready."
                  : "There's no recording of this class."}
            </p>
          </div>
        )}

        {!isLoading && url && playable && (
          <video
            ref={videoRef}
            src={url}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-video rounded-2xl bg-ink border border-line"
          />
        )}

        {!isLoading && url && !playable && (
          <div className="aspect-video rounded-2xl bg-porcelain border border-line flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-sm font-light text-muted leading-relaxed max-w-sm">
              This recording is in a streaming format your browser can&apos;t play.
              Safari plays it directly, or you can download it and open it in a
              video player.
            </p>
            <a
              href={url}
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pine hover:bg-moss text-paper text-xs font-semibold font-mono uppercase tracking-wider transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        )}

        <p className="text-[11px] font-light text-muted leading-relaxed">
          This recording is only available to people on this course, and the link
          above is tied to you and expires. Please don&apos;t share it on.
        </p>
      </div>
    </Modal>
  );
}
