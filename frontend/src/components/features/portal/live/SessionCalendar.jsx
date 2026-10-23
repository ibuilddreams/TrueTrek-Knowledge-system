"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getApiErrorMessage } from "@/lib/apiErrors";
import Loader from "@/components/ui/Loader";
import CalendarAgendaPanel from "./CalendarAgendaPanel";
import CalendarDayCell from "./CalendarDayCell";
import {
  addMonths,
  buildMonthWeeks,
  findFocusDate,
  formatMonthLabel,
  groupSessionsByDay,
  isSameMonth,
  startOfMonth,
  toDayKey,
  WEEKDAY_LABELS,
} from "./calendarUtils";

const LEGEND = [
  { label: "Upcoming", dot: "bg-gold" },
  { label: "Live now", dot: "bg-clay" },
  { label: "Ended", dot: "bg-muted/70" },
  { label: "You're going", dot: "bg-sage border border-pine/25" },
];

export default function SessionCalendar({
  sessions = [],
  isLoading,
  isError,
  error,
  onRetry,
  onRsvp,
  onCancelRsvp,
  onJoin,
  onOpenDetail,
  isBusy = false,
}) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // The sessions arrive after the first render, so the month the calendar
  // opens on is corrected once — and only once, or every background refetch
  // (useLiveSessions polls every 60s) would yank the student back out of the
  // month they had navigated to.
  const hasFocused = useRef(false);
  useEffect(() => {
    if (hasFocused.current || isLoading || sessions.length === 0) return;
    hasFocused.current = true;

    const focus = findFocusDate(sessions);
    if (!focus) return;
    setSelectedDate(focus);
    setMonthCursor(startOfMonth(focus));
  }, [isLoading, sessions]);

  const sessionsByDay = useMemo(() => groupSessionsByDay(sessions), [sessions]);
  const weeks = useMemo(() => buildMonthWeeks(monthCursor), [monthCursor]);

  const today = new Date();
  const todayKey = toDayKey(today);
  const selectedKey = toDayKey(selectedDate);
  const selectedSessions = sessionsByDay.get(selectedKey) || [];

  // Picking a day in a leading/trailing cell moves the month with it, so the
  // grid never shows a selection sitting in a greyed-out row.
  const handleSelect = (date) => {
    setSelectedDate(date);
    if (!isSameMonth(date, monthCursor)) setMonthCursor(startOfMonth(date));
  };

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setMonthCursor(startOfMonth(now));
  };

  if (isLoading) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10">
        <Loader fullScreen={false} label="Loading calendar..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-muted font-light">
          {getApiErrorMessage(error, "Unable to load the calendar.")}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pine hover:bg-moss text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="text-lg font-serif font-light text-ink">
            {formatMonthLabel(monthCursor)}
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-lg border border-line text-muted hover:text-ink hover:bg-porcelain transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setMonthCursor((current) => addMonths(current, -1))}
              aria-label="Previous month"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-line text-muted hover:text-ink hover:bg-porcelain transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMonthCursor((current) => addMonths(current, 1))}
              aria-label="Next month"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-line text-muted hover:text-ink hover:bg-porcelain transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAY_LABELS.map((weekday) => (
            <div
              key={weekday}
              className="text-center text-[10px] font-mono font-semibold uppercase tracking-widest text-muted py-1"
            >
              <span className="hidden sm:inline">{weekday}</span>
              <span className="sm:hidden">{weekday.charAt(0)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weeks.flat().map((date) => {
            const key = toDayKey(date);
            return (
              <CalendarDayCell
                key={key}
                date={date}
                sessions={sessionsByDay.get(key) || []}
                isCurrentMonth={isSameMonth(date, monthCursor)}
                isToday={key === todayKey}
                isSelected={key === selectedKey}
                onSelect={handleSelect}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 pt-4 border-t border-line">
          {LEGEND.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted"
            >
              <span className={`w-2 h-2 rounded-full ${item.dot}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <CalendarAgendaPanel
        date={selectedDate}
        sessions={selectedSessions}
        onRsvp={onRsvp}
        onCancelRsvp={onCancelRsvp}
        onJoin={onJoin}
        onOpenDetail={onOpenDetail}
        isBusy={isBusy}
      />
    </div>
  );
}
