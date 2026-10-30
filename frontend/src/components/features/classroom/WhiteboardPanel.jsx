"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  Maximize2,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import PingDotSpinner from "@/components/ui/PingDotSpinner";
import { BOARD_STATUS, WHITEBOARD_ACCESS, useWhiteboard } from "@/hooks/useWhiteboard";
import WhiteboardToolbar from "./WhiteboardToolbar";

/**
 * The whiteboard inside a live class.
 *
 * Mounted by `ClassroomStage` only while the board is open, which is what
 * makes "open the whiteboard" and "join the room" the same action: the hook
 * connects on mount and disconnects on unmount, so there is no half-open
 * state to reconcile and nothing keeps a Netless seat after the panel closes.
 *
 * Three audiences share this one component, exactly as the classroom does.
 * The teacher gets the pens and the pen-sharing switch; a student gets the
 * page controls and a read-only canvas; and a student whose teacher has
 * opened the board up gets the pens too, having quietly re-joined with a
 * token that says so.
 */
export default function WhiteboardPanel({ sessionId, onClose }) {
  const board = useWhiteboard(sessionId);
  const { open, status } = board;

  // One open per mount — `open` itself guards a second call, which is what
  // makes React's development double-mount harmless.
  useEffect(() => {
    open();
  }, [open]);

  // The toolbar appearing or disappearing (a student handed the pen, or given
  // it back) takes a column away from the canvas in the same frame it
  // re-renders.
  const { refreshView, isWritable } = board;
  useEffect(() => {
    refreshView();
  }, [refreshView, isWritable, status]);

  const isEveryone = board.access === WHITEBOARD_ACCESS.EVERYONE;

  return (
    <section
      className="relative flex-1 min-h-0 flex flex-col gap-3"
      aria-label="Class whiteboard"
    >
      {/* Both of these cover the board rather than replacing it. The SDK binds
          to the canvas node at join time and measures it then, so a container
          that was `display: none` while connecting would be bound at 0×0 and
          come back a board nobody can draw on. */}
      {(status === BOARD_STATUS.CONNECTING || status === BOARD_STATUS.IDLE) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-pine border border-paper/10">
          <PingDotSpinner />
          <p className="text-sm text-paper/70 font-light">Opening the whiteboard…</p>
        </div>
      )}

      {status === BOARD_STATUS.ERROR && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-pine border border-paper/10 p-6">
          <div className="max-w-md w-full text-center">
            <span className="w-12 h-12 mx-auto mb-4 rounded-xl bg-clay/20 border border-clay/40 text-rose flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </span>
            <h2 className="text-lg font-serif font-bold mb-2">
              Couldn&apos;t open the whiteboard
            </h2>
            <p className="text-sm text-paper/70 font-light leading-relaxed mb-6">
              {board.error}
            </p>
            {/* The class is unaffected by a board that won't open, so both
                ways out leave the call running. */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  board.clearError();
                  open();
                }}
                className="px-5 py-2.5 rounded-xl bg-gold text-ink font-bold font-mono text-xs uppercase tracking-wider cursor-pointer hover:bg-gold/85 transition-colors"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-paper/20 text-paper/80 font-mono text-xs uppercase tracking-wider cursor-pointer hover:bg-paper/10 transition-colors"
              >
                Back to the class
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        {board.isWritable && (
          <WhiteboardToolbar
            tool={board.tool}
            onSelectTool={board.setTool}
            strokeColor={board.strokeColor}
            onSelectColor={board.setStrokeColor}
            strokeWidth={board.strokeWidth}
            onSelectWidth={board.setStrokeWidth}
            canUndo={board.canUndo}
            canRedo={board.canRedo}
            onUndo={board.undo}
            onRedo={board.redo}
            onClearPage={board.clearPage}
          />
        )}

        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <div
            ref={board.containerRef}
            // Netless draws onto a white canvas, so the board is a sheet of
            // paper in a dark room rather than another dark surface.
            className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-paper border border-paper/20"
          />

          <div className="shrink-0 flex items-center justify-between gap-3 flex-wrap text-paper/70">
            <div className="flex items-center gap-1">
              <PageButton
                onClick={board.previousPage}
                disabled={board.pageIndex <= 0}
                label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </PageButton>
              <span className="px-2 font-mono text-[11px] uppercase tracking-wider tabular-nums">
                Page {board.pageIndex + 1} / {board.pageCount}
              </span>
              <PageButton
                onClick={board.nextPage}
                disabled={board.pageIndex >= board.pageCount - 1}
                label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </PageButton>

              {board.isWritable && (
                <>
                  <PageButton onClick={board.addPage} label="Add a page">
                    <Plus className="w-4 h-4" />
                  </PageButton>
                  <PageButton
                    onClick={board.removePage}
                    label={
                      board.pageCount <= 1
                        ? "Clear this page"
                        : "Delete this page"
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </PageButton>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <PageButton onClick={board.resetView} label="Reset the view">
                <Maximize2 className="w-4 h-4" />
              </PageButton>

              {/* The teacher drives the view; everyone else can step out of
                  it to read something at their own pace, and step back. */}
              {!board.isHost && (
                <button
                  type="button"
                  onClick={board.toggleFollowHost}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    board.isFollowingHost
                      ? "bg-paper/15 text-paper"
                      : "text-paper/60 hover:bg-paper/10"
                  }`}
                  aria-pressed={board.isFollowingHost}
                >
                  <Eye className="w-4 h-4" />
                  {board.isFollowingHost ? "Following teacher" : "Free view"}
                </button>
              )}

              {board.isHost && (
                <button
                  type="button"
                  onClick={() =>
                    board.changeAccess(
                      isEveryone
                        ? WHITEBOARD_ACCESS.HOST_ONLY
                        : WHITEBOARD_ACCESS.EVERYONE,
                    )
                  }
                  disabled={board.isAccessSaving}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEveryone
                      ? "bg-gold text-ink hover:bg-gold/85"
                      : "text-paper/60 hover:bg-paper/10"
                  }`}
                  aria-pressed={isEveryone}
                  title={
                    isEveryone
                      ? "Take the pen back — only you will be able to draw"
                      : "Let everyone in this class draw on the board"
                  }
                >
                  {isEveryone ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {isEveryone ? "Class can draw" : "You're presenting"}
                </button>
              )}
            </div>
          </div>

          {/* Said plainly rather than left to be worked out from a missing
              toolbar — a student who starts drawing on a read-only board gets
              no feedback at all from the canvas itself. */}
          {!board.isWritable && status === BOARD_STATUS.CONNECTED && (
            <p className="shrink-0 text-center text-[11px] text-paper/50 font-light">
              Your teacher is presenting on this board. You can follow along and
              change pages, but not draw.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function PageButton({ onClick, disabled = false, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer text-paper/70 hover:bg-paper/10 hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
