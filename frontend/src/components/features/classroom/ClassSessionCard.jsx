"use client";

import { useState } from "react";
import {
  BookMarked,
  Calendar,
  CalendarX,
  Circle,
  Clapperboard,
  ClipboardList,
  Clock,
  GraduationCap,
  NotebookPen,
  Download,
  Loader2,
  Pencil,
  Radio,
  Users,
  Video,
} from "lucide-react";
import ClassNotesModal from "./ClassNotesModal";
import ClassRecordingModal from "./ClassRecordingModal";
import ClassSessionJoinButton from "./ClassSessionJoinButton";
import { useClassSessionDoor } from "@/hooks/useClassSessionDoor";
import { downloadClassNotesDocument } from "@/services/classSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import {
  CLASS_STATE_LABEL,
  CLASS_STATE_TONE,
  formatClassDate,
  formatClassTime,
  formatCountdown,
  willCancelRatherThanDelete,
} from "./classSessionUtils";

// `variant` is additive, the convention the cobalt rollout follows for a shared
// component. "classic" is the porcelain card and is byte-for-byte what it has
// always been, because the **teacher** portal still renders this card and has
// not been converted; "cobalt" is the student portal's palette. One card, two
// skins, because both portals show the same class and only one has moved.
const SKIN = {
  classic: {
    card: "bg-paper shadow-sm rounded-2xl",
    border: "border-line",
    borderLive: "border-clay/40",
    seam: "from-pine via-moss to-gold",
    seamLive: "from-clay via-rose to-clay",
    avatar: "rounded-2xl border bg-gold/12 text-gold border-gold/25",
    avatarLive: "rounded-2xl border bg-rose/35 text-clay border-clay/25",
    badge: "px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border",
    badgeAlert: "bg-rose/35 text-clay border-clay/25",
    badgeNote: "bg-gold/12 text-gold border-gold/25",
    stateTone: CLASS_STATE_TONE,
    title: "text-base font-serif font-bold text-ink leading-snug",
    meta: "text-[11px] font-mono uppercase tracking-wider text-muted",
    body: "text-xs text-muted font-light",
    small: "text-[11px] text-muted font-light",
    danger: "text-xs text-clay font-light",
    rule: "border-line",
    bullet: "bg-gold",
    btnSec:
      "px-4 py-2 rounded-xl border border-line hover:bg-porcelain text-ink font-bold font-mono text-[11px] uppercase tracking-wider shadow-sm focus-visible:ring-gold",
    btnIcon:
      "w-9 h-9 rounded-xl border border-line hover:bg-porcelain text-ink shadow-sm focus-visible:ring-gold",
    btnPri:
      "px-4 py-2 rounded-xl bg-gold hover:bg-gold/85 text-ink font-bold font-mono text-[11px] uppercase tracking-wider shadow-sm focus-visible:ring-gold",
    btnQuiet:
      "px-3 py-1.5 rounded-lg border border-line text-[11px] font-mono uppercase tracking-wider text-muted hover:text-ink hover:bg-porcelain",
    btnDanger:
      "px-3 py-1.5 rounded-lg border border-clay/30 text-[11px] font-mono uppercase tracking-wider text-clay hover:bg-rose/20",
  },
  cobalt: {
    card: "bg-cn-p-card rounded-cn-p",
    border: "border-cn-p-line",
    borderLive: "border-cn-p-bad/40",
    // The portal marks a card with its border and radius, never a seam.
    seam: null,
    seamLive: null,
    avatar: "rounded-cn-p-sm bg-cn-p-soft text-cn-p-soft-ink",
    avatarLive: "rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad",
    badge: "h-6 px-2.5 rounded-full text-xs font-semibold",
    badgeAlert: "bg-cn-p-bad-bg text-cn-p-bad",
    badgeNote: "bg-cn-p-warn-bg text-cn-p-warn",
    stateTone: {
      LIVE: "bg-cn-p-bad-bg text-cn-p-bad",
      UPCOMING: "bg-cn-p-soft text-cn-p-soft-ink",
      ENDED: "bg-cn-p-neutral-bg text-cn-p-ink-2",
      CANCELLED: "bg-cn-p-neutral-bg text-cn-p-ink-2",
    },
    title: "text-base font-bold text-cn-p-ink leading-snug",
    meta: "text-[13px] text-cn-p-muted",
    body: "text-sm text-cn-p-ink-2",
    small: "text-[13px] text-cn-p-ink-2",
    danger: "text-sm text-cn-p-bad",
    rule: "border-cn-p-line",
    bullet: "bg-cn-p-accent-soft",
    btnSec:
      "h-9 px-3 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card hover:border-cn-p-ink text-cn-p-ink text-[13px] font-semibold focus-visible:ring-cn-p-accent",
    btnIcon:
      "w-9 h-9 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card hover:border-cn-p-ink text-cn-p-ink focus-visible:ring-cn-p-accent",
    btnPri:
      "h-9 px-3 rounded-cn-p-sm bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-[13px] font-semibold focus-visible:ring-cn-p-accent",
    btnQuiet:
      "h-8 px-3 rounded-cn-p-sm border border-cn-p-line text-[13px] font-semibold text-cn-p-ink-2 hover:text-cn-p-ink hover:bg-cn-p-page",
    btnDanger:
      "h-8 px-3 rounded-cn-p-sm border border-cn-p-bad/30 text-[13px] font-semibold text-cn-p-bad hover:bg-cn-p-bad-bg",
  },
};

/**
 * One scheduled class, rendered the same way in both portals.
 *
 * The teacher's extra actions appear only when the handlers are passed, so
 * the student build of this card has no disabled "Edit" to explain — and
 * there is one card to keep in step rather than two that drift.
 *
 * The recording and the meeting notes are the two things this card owns
 * outright rather than delegating upwards: each opens its own reader, so both
 * portals get them without either tab knowing they exist. The card is told
 * only *that* there is one (`recording_available` / `notes_available`) — the
 * playback link is signed per click inside the player and the notes are
 * fetched when their reader opens, never carried in a list payload.
 *
 * They are two buttons rather than one because they are two features on two
 * per-class switches: plenty of classes will have notes and no recording.
 */
export default function ClassSessionCard({
  session,
  onJoin,
  onEdit,
  onCancel,
  onViewAttendance,
  isBusy = false,
  variant = "classic",
}) {
  const skin = SKIN[variant] ?? SKIN.classic;
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isDownloadingNotes, setIsDownloadingNotes] = useState(false);
  // Everything below reads the state the server put on this row, so the card
  // re-asks for it the moment the class is due rather than counting down
  // past its own start time until the next poll.
  useClassSessionDoor(session);
  const state = session.live_state;
  const isLive = state === "LIVE";
  const isEnded = state === "ENDED";
  const isCancelled = state === "CANCELLED";
  const countdown = formatCountdown(session.scheduled_at);
  const hasTeacherActions = Boolean(onEdit || onCancel || onViewAttendance);
  const hasRecording = Boolean(session.recording_available);
  const isBeingRecorded = Boolean(session.recording_in_progress);
  const hasNotes = Boolean(session.notes_available);
  const isBeingNoted = Boolean(session.notes_in_progress);

  /**
   * The notes PDF, straight off the card.
   *
   * The reader beside it has the same download inside it, but the document
   * is the thing most people actually want from a class that has finished —
   * it is what was emailed to them, and this is where they come looking for
   * it afterwards. One click rather than two.
   *
   * No separate flag decides whether to offer it: the server answers that on
   * the request (a class whose notes have no rendered PDF gets a plain 404
   * with a sentence saying so), which is a message on the rare path rather
   * than another subquery on every row of every listing.
   */
  const handleDownloadNotes = async () => {
    if (isDownloadingNotes) return;
    setIsDownloadingNotes(true);
    try {
      const { blob, filename } = await downloadClassNotesDocument(session.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "class-notes.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Couldn't download these notes."));
    } finally {
      setIsDownloadingNotes(false);
    }
  };

  return (
    <div
      className={`relative border p-5 flex flex-col gap-4 overflow-hidden transition-colors ${skin.card} ${
        isLive ? skin.borderLive : skin.border
      } ${isCancelled ? "opacity-70" : ""}`}
    >
      {skin.seam && (
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-80 ${
            isLive ? skin.seamLive : skin.seam
          }`}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 flex items-center justify-center shrink-0 ${
            isLive ? skin.avatarLive : skin.avatar
          }`}
        >
          {isLive ? (
            <Radio className="w-5 h-5 animate-pulse" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Said on the card as well as inside the classroom: somebody
              deciding whether to turn their camera on should know before they
              are in the room, not after. */}
          {isBeingRecorded && (
            <span className={`inline-flex items-center gap-1 ${skin.badge} ${skin.badgeAlert}`}>
              <Circle className="w-2 h-2 fill-current animate-pulse" />
              Rec
            </span>
          )}
          {/* Shown while a live class is being transcribed for the same
              reason the REC badge is, and for a little while after it while
              the notes are written — a student who sees the class has ended
              but the notes haven't arrived should be able to tell that one is
              coming. */}
          {isBeingNoted && (
            <span className={`inline-flex items-center gap-1 ${skin.badge} ${skin.badgeNote}`}>
              <NotebookPen className="w-2.5 h-2.5" />
              Notes
            </span>
          )}
          <span
            className={`inline-flex items-center ${skin.badge} ${
              skin.stateTone[state] || skin.stateTone.UPCOMING
            }`}
          >
            {CLASS_STATE_LABEL[state] || state}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className={skin.title}>
          {session.title}
        </h3>
        <p className={`inline-flex items-center gap-1.5 mt-1 ${skin.meta}`}>
          <BookMarked className="w-3 h-3" />
          {session.course_code} · {session.course_title}
        </p>
        {session.description && (
          <p className={`mt-1.5 leading-relaxed line-clamp-2 ${skin.body}`}>
            {session.description}
          </p>
        )}
      </div>

      {isCancelled && session.cancellation_reason && (
        <p className={`leading-relaxed ${skin.danger}`}>
          {session.cancellation_reason}
        </p>
      )}

      {(session.agenda || []).length > 0 && !isCancelled && (
        <ul className="flex flex-col gap-1">
          {session.agenda.slice(0, 3).map((line, index) => (
            <li
              key={`${session.id}-agenda-${index}`}
              className={`flex items-start gap-1.5 leading-relaxed ${skin.small}`}
            >
              <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${skin.bullet}`} />
              {line}
            </li>
          ))}
        </ul>
      )}

      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${skin.small}`}>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {formatClassDate(session.scheduled_at)} · {formatClassTime(session.scheduled_at)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {session.duration_minutes} min
        </span>
        {!session.is_host && session.teacher_name && (
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="w-3 h-3" />
            {session.teacher_name}
          </span>
        )}
        {session.is_host && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            {session.attendee_count} joined
          </span>
        )}
      </div>

      <div className={`mt-auto pt-3 border-t flex items-center justify-between gap-3 ${skin.rule}`}>
        <span className={skin.small}>
          {isLive
            ? "The room is open"
            : isEnded || isCancelled
              ? formatClassDate(session.scheduled_at)
              : countdown || "Starting soon"}
        </span>

        <div className="flex items-center gap-2">
          {/* An ended class has no join button, so this is what fills that
              corner once there is something to watch back. */}
          {hasNotes && (
            <button
              type="button"
              onClick={() => setIsNotesOpen(true)}
              className={`inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${skin.btnSec}`}
            >
              <NotebookPen className="w-3.5 h-3.5" />
              Class notes
            </button>
          )}
          {hasNotes && (
            <button
              type="button"
              onClick={handleDownloadNotes}
              disabled={isDownloadingNotes}
              title="Download the notes as a PDF"
              aria-label="Download the notes as a PDF"
              className={`inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${skin.btnIcon}`}
            >
              {isDownloadingNotes ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          {hasRecording && (
            <button
              type="button"
              onClick={() => setIsRecordingOpen(true)}
              className={`inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${skin.btnPri}`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              Watch recording
            </button>
          )}
          <ClassSessionJoinButton session={session} onJoin={onJoin} isBusy={isBusy} />
        </div>
      </div>

      {hasTeacherActions && (
        <div className={`flex items-center gap-2 flex-wrap pt-3 border-t ${skin.rule}`}>
          {onViewAttendance && (
            <button
              type="button"
              onClick={() => onViewAttendance(session)}
              className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${skin.btnQuiet}`}
            >
              <ClipboardList className="w-3 h-3" />
              Attendance
            </button>
          )}
          {onEdit && !isCancelled && !isEnded && (
            <button
              type="button"
              onClick={() => onEdit(session)}
              className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${skin.btnQuiet}`}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
          {/* Not offered on a class that has already finished. "Cancel" means
              "this is not going to happen" — a message the students who sat
              through it would be sent, against a class that did. The backend
              agrees (a taught class is cancelled rather than deleted, keeping
              its register), so a button here could only ever stamp the wrong
              word on the record. What an ended class offers instead is what
              it actually has: its register, its notes and its recording. */}
          {onCancel && !isCancelled && !isEnded && (
            <button
              type="button"
              onClick={() => onCancel(session)}
              className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${skin.btnDanger}`}
            >
              <CalendarX className="w-3 h-3" />
              {willCancelRatherThanDelete(session) ? "Cancel" : "Delete"}
            </button>
          )}
        </div>
      )}

      {isRecordingOpen && (
        <ClassRecordingModal
          session={session}
          isOpen={isRecordingOpen}
          onClose={() => setIsRecordingOpen(false)}
        />
      )}

      {isNotesOpen && (
        <ClassNotesModal
          session={session}
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
        />
      )}
    </div>
  );
}
