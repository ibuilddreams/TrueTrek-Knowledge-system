"use client";

import { useRef, useState } from "react";

// The design's briefing room (`.brief` in new-design.html): the founder's
// video on the left over eight columns, the chapter list on the right over
// four. The design file ships it as a still with a "video coming" note; here
// the same furniture drives the real `/welcome.mp4` the page has always
// played, so the play button, the chapter rail and the progress strip are
// wired rather than decorative.
//
// Durations are the design's own and double as the segment strip's flex
// weights (372s / 285s / 330s), so the three bars under the title are drawn
// in proportion to the chapters they stand for.
const CHAPTERS = [
  {
    id: "ch-philosophy",
    title: "Orientation, mission and core philosophy",
    duration: "06:12",
    seconds: 372,
    videoUrl: "/welcome.mp4",
  },
  {
    id: "ch-curriculum",
    title: "The 9-tier curriculum pathing guide",
    duration: "04:45",
    seconds: 285,
    videoUrl: "/welcome.mp4",
  },
  {
    id: "ch-portal",
    title: "The portal and live drills walkthrough",
    duration: "05:30",
    seconds: 330,
    videoUrl: "/welcome.mp4",
  },
];

function formatTime(secs) {
  const safe = Number.isFinite(secs) ? Math.max(0, secs) : 0;
  const mins = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  return `${String(mins).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function BriefingRoom() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  const active = CHAPTERS[activeIndex];

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  };

  const handleSelectChapter = (index) => {
    setActiveIndex(index);
    setCurrentTime(0);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  return (
    <div
      data-cn-reveal
      className="cn-reveal grid grid-cols-1 overflow-hidden rounded-cn-lg border border-cn-rule bg-white shadow-cn-1 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]"
    >
      {/* The video. `min-h-full` lets it run the full depth of the chapter
          list beside it; below the breakpoint it falls back to 4/3, exactly
          as the design's own media query does. */}
      <div className="relative aspect-[4/3] min-h-full overflow-hidden bg-cn-ink lg:aspect-auto">
        <video
          ref={videoRef}
          src={active.videoUrl}
          poster="/images/design/briefing-room.webp"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) play();
            else video.pause();
          }}
          className="h-full w-full cursor-pointer object-cover select-none"
        />

        {/* The design's two scrims: a flat wash over the whole frame and a
            masked band under the caption so white type stays legible. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[rgba(10,16,40,0.28)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[45%] bg-[rgba(10,16,40,0.55)] [mask-image:linear-gradient(180deg,transparent,#000_70%)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_70%)]"
        />

        <span className="absolute top-6 left-6 z-[2] rounded-full border border-white/[0.22] bg-white/[0.14] px-3 py-[5px] text-cn-xs font-semibold text-white backdrop-blur-[8px]">
          Founder briefing
        </span>

        {!isPlaying && (
          <button
            type="button"
            aria-label="Play chapter"
            onClick={play}
            className="absolute top-1/2 left-1/2 z-[3] grid h-14 w-14 -translate-x-1/2 -translate-y-[70%] place-items-center rounded-full border-0 bg-white text-cn-accent transition-transform duration-200 ease-cn-out hover:scale-[1.06] active:scale-[0.97] sm:h-[72px] sm:w-[72px] sm:-translate-y-[60%]"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="translate-x-[2px]"
            >
              <path d="M7 4l13 8-13 8z" />
            </svg>
          </button>
        )}

        <div className="absolute right-6 bottom-6 left-6 z-[2] grid gap-3 text-white sm:right-10 sm:left-10">
          <div className="grid gap-1">
            <span className="text-cn-sm text-cn-on-ink-2">
              Chapter {activeIndex + 1} of {CHAPTERS.length}
            </span>
            <strong className="hidden text-cn-xl leading-[1.2] tracking-[-0.02em] sm:block">
              {active.title}
            </strong>
          </div>
          <div aria-hidden="true" className="mt-2 flex gap-1">
            {CHAPTERS.map((chapter, index) => (
              <i
                key={chapter.id}
                style={{ flex: chapter.seconds }}
                className={`h-1 rounded-[2px] ${
                  index <= activeIndex ? "bg-white" : "bg-white/[0.28]"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-cn-xs text-cn-on-ink-2 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{active.duration}</span>
          </div>
        </div>
      </div>

      {/* The chapter list. */}
      <div className="flex flex-col border-t border-cn-rule bg-white lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between border-b border-cn-rule px-6 py-4">
          <b className="text-cn-base">Chapters</b>
          <span className="rounded-full bg-cn-paper-3 px-2.5 py-[3px] text-cn-xs font-semibold text-cn-accent-3">
            {CHAPTERS.length} parts, 16 min
          </span>
        </div>

        <ol className="m-0 grid flex-1 list-none content-start gap-0.5 p-2">
          {CHAPTERS.map((chapter, index) => {
            const isCurrent = index === activeIndex;
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={() => handleSelectChapter(index)}
                  className={`group grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 rounded-cn border-0 p-4 text-left text-cn-ink transition-colors duration-200 ease-cn-out ${
                    isCurrent
                      ? "bg-cn-paper-2 shadow-[inset_3px_0_0_var(--color-cn-accent)]"
                      : "bg-transparent hover:bg-cn-paper-2"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full border text-cn-sm font-bold ${
                      isCurrent
                        ? "border-cn-accent bg-cn-accent text-white"
                        : "border-cn-rule-strong bg-white text-cn-ink-2"
                    }`}
                  >
                    <span className={isCurrent ? "hidden" : "group-hover:hidden"}>
                      {index + 1}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className={isCurrent ? "block" : "hidden group-hover:block"}
                    >
                      <path d="M7 4l13 8-13 8z" />
                    </svg>
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <span
                      className={`text-cn-xs font-semibold ${
                        isCurrent ? "text-cn-accent" : "text-cn-muted"
                      }`}
                    >
                      Chapter {index + 1}
                    </span>
                    <span className="font-semibold leading-[1.35]">
                      {chapter.title}
                    </span>
                  </span>
                  <span className="text-cn-sm text-cn-muted tabular-nums">
                    {chapter.duration}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center gap-3 border-t border-cn-rule px-6 py-4 text-cn-sm text-cn-ink-2">
          <img
            src="/images/design/founder.webp"
            alt="Marcus Vance Sr."
            className="h-10 w-10 shrink-0 rounded-full object-cover shadow-[0_0_0_2px_var(--color-cn-paper),0_0_0_3px_var(--color-cn-rule)]"
          />
          <span>
            <small className="block text-cn-xs text-cn-muted">Narrated by</small>
            <b className="text-cn-ink">Marcus Vance Sr.</b>, founder
          </span>
        </div>
      </div>
    </div>
  );
}
