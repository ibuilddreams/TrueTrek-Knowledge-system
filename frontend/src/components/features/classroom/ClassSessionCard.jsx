"use client";

import {
  BookMarked,
  Calendar,
  CalendarX,
  ClipboardList,
  Clock,
  GraduationCap,
  Pencil,
  Radio,
  Users,
  Video,
} from "lucide-react";
import ClassSessionJoinButton from "./ClassSessionJoinButton";
import {
  CLASS_STATE_LABEL,
  CLASS_STATE_TONE,
  formatClassDate,
  formatClassTime,
  formatCountdown,
  willCancelRatherThanDelete,
} from "./classSessionUtils";

/**
 * One scheduled class, rendered the same way in both portals.
 *
 * The teacher's extra actions appear only when the handlers are passed, so
 * the student build of this card has no disabled "Edit" to explain — and
 * there is one card to keep in step rather than two that drift.
 */
export default function ClassSessionCard({
  session,
  onJoin,
  onEdit,
  onCancel,
  onViewAttendance,
  isBusy = false,
}) {
  const state = session.live_state;
  const isLive = state === "LIVE";
  const isEnded = state === "ENDED";
  const isCancelled = state === "CANCELLED";
  const countdown = formatCountdown(session.scheduled_at);
  const hasTeacherActions = Boolean(onEdit || onCancel || onViewAttendance);

  return (
    <div
      className={`relative bg-paper border rounded-2xl shadow-sm p-5 flex flex-col gap-4 overflow-hidden transition-colors ${
        isLive ? "border-clay/40" : "border-line"
      } ${isCancelled ? "opacity-70" : ""}`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-80 ${
          isLive ? "from-clay via-rose to-clay" : "from-pine via-moss to-gold"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
            isLive
              ? "bg-rose/35 text-clay border-clay/25"
              : "bg-gold/12 text-gold border-gold/25"
          }`}
        >
          {isLive ? (
            <Radio className="w-5 h-5 animate-pulse" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </div>

        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border shrink-0 ${
            CLASS_STATE_TONE[state] || CLASS_STATE_TONE.UPCOMING
          }`}
        >
          {CLASS_STATE_LABEL[state] || state}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-serif font-bold text-ink leading-snug">
          {session.title}
        </h3>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted mt-1">
          <BookMarked className="w-3 h-3" />
          {session.course_code} · {session.course_title}
        </p>
        {session.description && (
          <p className="text-xs text-muted font-light mt-1.5 leading-relaxed line-clamp-2">
            {session.description}
          </p>
        )}
      </div>

      {isCancelled && session.cancellation_reason && (
        <p className="text-xs text-clay font-light leading-relaxed">
          {session.cancellation_reason}
        </p>
      )}

      {(session.agenda || []).length > 0 && !isCancelled && (
        <ul className="flex flex-col gap-1">
          {session.agenda.slice(0, 3).map((line, index) => (
            <li
              key={`${session.id}-agenda-${index}`}
              className="text-[11px] text-muted font-light flex items-start gap-1.5 leading-relaxed"
            >
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gold shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted font-light">
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

      <div className="mt-auto pt-3 border-t border-line flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted font-light">
          {isLive
            ? "The room is open"
            : isEnded || isCancelled
              ? formatClassDate(session.scheduled_at)
              : countdown || "Starting soon"}
        </span>

        <ClassSessionJoinButton session={session} onJoin={onJoin} isBusy={isBusy} />
      </div>

      {hasTeacherActions && (
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-line">
          {onViewAttendance && (
            <button
              type="button"
              onClick={() => onViewAttendance(session)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-[11px] font-mono uppercase tracking-wider text-muted hover:text-ink hover:bg-porcelain transition-colors cursor-pointer"
            >
              <ClipboardList className="w-3 h-3" />
              Attendance
            </button>
          )}
          {onEdit && !isCancelled && !isEnded && (
            <button
              type="button"
              onClick={() => onEdit(session)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-[11px] font-mono uppercase tracking-wider text-muted hover:text-ink hover:bg-porcelain transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
          {onCancel && !isCancelled && (
            <button
              type="button"
              onClick={() => onCancel(session)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-clay/30 text-[11px] font-mono uppercase tracking-wider text-clay hover:bg-rose/20 transition-colors cursor-pointer"
            >
              <CalendarX className="w-3 h-3" />
              {willCancelRatherThanDelete(session) ? "Cancel" : "Delete"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
