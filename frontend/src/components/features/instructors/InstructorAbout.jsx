"use client";

import { useState } from "react";
import { ChevronDown, PlayCircle } from "lucide-react";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";

const COLLAPSE_THRESHOLD = 700;

// "Hi, I'm …": the bio (collapsible when long) next to the intro video.
// YouTube and Vimeo links are embedded; any other link falls back to a button.
export default function InstructorAbout({ instructor }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bio = (instructor.bio || "").trim();
  const videoUrl = instructor.intro_video_url;
  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;
  const isLong = bio.length > COLLAPSE_THRESHOLD;

  if (!bio && !videoUrl) return null;

  return (
    <section
      aria-labelledby="instructor-about-heading"
      className={`grid grid-cols-1 gap-10 ${bio && videoUrl ? "lg:grid-cols-2" : ""}`}
    >
      {bio && (
        <div className="min-w-0">
          <h2
            id="instructor-about-heading"
            className="text-3xl md:text-4xl font-serif font-light tracking-tight text-ink"
          >
            Hi, I&apos;m {instructor.name}
          </h2>
          <span aria-hidden="true" className="mt-3 block h-0.5 w-10 rounded-full bg-gold" />
          <p
            className={`mt-6 text-[15px] leading-relaxed text-ink/90 whitespace-pre-line ${
              isLong && !isExpanded ? "line-clamp-[12]" : ""
            }`}
          >
            {bio}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded((value) => !value)}
              aria-expanded={isExpanded}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pine hover:text-moss transition"
            >
              {isExpanded ? "Show less" : "Show more"}
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}

      {videoUrl && (
        <div className="min-w-0">
          {embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-card border border-line shadow-elevated bg-ink">
              <iframe
                src={embedUrl}
                title={`${instructor.name} — introduction video`}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full"
              />
            </div>
          ) : (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-pine px-5 py-3 text-xs font-sans font-medium uppercase tracking-widest text-pine hover:bg-pine hover:text-paper transition"
            >
              <PlayCircle className="w-4 h-4" />
              Watch introduction
            </a>
          )}
        </div>
      )}
    </section>
  );
}
