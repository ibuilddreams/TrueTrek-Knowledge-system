"use client";

import { getVideoEmbedUrl } from "@/lib/videoEmbed";

export default function VideoLessonPlayer({ lesson }) {
  if (lesson.file) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        controls
        className="w-full aspect-video rounded-xl bg-stone-950"
        src={lesson.file}
      >
        Your browser does not support the video tag.
      </video>
    );
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

    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        controls
        className="w-full aspect-video rounded-xl bg-stone-950"
        src={lesson.video_url}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center">
      <p className="text-xs text-stone-500">No video source is attached to this lesson.</p>
    </div>
  );
}
