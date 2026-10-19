"use client";

import { Calendar, CalendarCheck, Clock, Mic, PlayCircle, Radio, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SpeakerChip from "./SpeakerChip";
import {
  formatCountdown,
  formatSessionDate,
  formatSessionTime,
  LIVE_STATE_LABEL,
  LIVE_STATE_TONE,
} from "./sessionUtils";

export default function SessionDetailModal({
  isOpen,
  onClose,
  session,
  onRsvp,
  onCancelRsvp,
  onJoin,
  isBusy = false,
}) {
  if (!session) return null;

  const state = session.live_state;
  const isLive = state === "LIVE";
  const isEnded = state === "ENDED";
  const isCancelled = state === "CANCELLED";
  const talkingPoints = session.talking_points || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Mic}
      title={session.title}
      subtitle={session.topic}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border ${
              LIVE_STATE_TONE[state] || LIVE_STATE_TONE.UPCOMING
            }`}
          >
            {LIVE_STATE_LABEL[state] || state}
          </span>
          {session.is_rsvped && !isEnded && !isCancelled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border bg-sage/40 text-pine border-pine/20">
              <CalendarCheck className="w-3 h-3" />
              You&apos;re going
            </span>
          )}
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            {session.meeting_method_display}
          </span>
        </div>

        {isCancelled && session.cancellation_reason && (
          <div className="rounded-xl bg-rose/20 border border-clay/20 p-3.5">
            <p className="text-xs text-clay font-light leading-relaxed">
              {session.cancellation_reason}
            </p>
          </div>
        )}

        {session.description && (
          <p className="text-sm text-muted font-light leading-relaxed">{session.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: Calendar,
              label: "Date",
              value: formatSessionDate(session.scheduled_at),
            },
            {
              icon: Clock,
              label: "Time",
              value: `${formatSessionTime(session.scheduled_at)} · ${session.duration_minutes} min`,
            },
            {
              icon: Users,
              label: "Going",
              value:
                session.seats_remaining === null || session.seats_remaining === undefined
                  ? `${session.rsvp_count ?? 0}`
                  : `${session.rsvp_count ?? 0} · ${session.seats_remaining} left`,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-porcelain border border-line p-3.5">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
                <item.icon className="w-3 h-3" />
                {item.label}
              </p>
              <p className="text-sm text-ink font-medium">{item.value}</p>
            </div>
          ))}
        </div>

        {talkingPoints.length > 0 && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2.5">
              What we&apos;ll cover
            </p>
            <ul className="space-y-2">
              {talkingPoints.map((point, index) => (
                <li key={`${point}-${index}`} className="flex gap-2.5 text-sm text-ink font-light">
                  <span className="text-gold shrink-0">—</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(session.speakers || []).length > 0 && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3">
              Speakers
            </p>
            <div className="space-y-4">
              {session.speakers.map((speaker) => (
                <div key={speaker.id}>
                  <SpeakerChip speaker={speaker} size="lg" />
                  {speaker.bio && (
                    <p className="text-xs text-muted font-light leading-relaxed mt-2 pl-[50px]">
                      {speaker.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isEnded && session.recap && (
          <div className="rounded-xl bg-porcelain border border-line p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
              Session recap
            </p>
            <p className="text-sm text-ink font-light leading-relaxed whitespace-pre-line">
              {session.recap}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1 border-t border-line mt-1">
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg border border-line text-muted hover:text-ink hover:bg-porcelain transition cursor-pointer"
          >
            Close
          </button>

          {isEnded || isCancelled ? (
            session.recording_url ? (
              <a
                href={session.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg bg-pine hover:bg-moss text-paper shadow-sm transition"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Play recording
              </a>
            ) : null
          ) : session.can_join ? (
            <button
              type="button"
              onClick={() => onJoin?.(session)}
              disabled={isBusy}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg bg-clay hover:bg-clay/90 text-paper shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              Join live
            </button>
          ) : session.is_rsvped ? (
            <button
              type="button"
              onClick={() => onCancelRsvp?.(session)}
              disabled={isBusy}
              className="mt-4 px-4 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg border border-line text-muted hover:text-ink hover:bg-porcelain transition disabled:opacity-50 cursor-pointer"
            >
              Cancel RSVP
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRsvp?.(session)}
              disabled={isBusy || session.seats_remaining === 0}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg bg-pine hover:bg-moss text-paper shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              {session.seats_remaining === 0 ? "Session full" : "Save my spot"}
            </button>
          )}
        </div>

        {!isEnded && !isCancelled && !session.can_join && (
          <p className="text-[11px] text-muted font-light text-center">
            {isLive
              ? "This session is live, but a join link hasn't been published yet."
              : `The room opens 15 minutes before the session starts${
                  formatCountdown(session.join_opens_at)
                    ? ` — ${formatCountdown(session.join_opens_at)}.`
                    : "."
                }`}
          </p>
        )}
      </div>
    </Modal>
  );
}
