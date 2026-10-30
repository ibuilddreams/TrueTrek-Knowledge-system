"use client";

import {
  ArrowUpRight,
  Circle,
  Eraser,
  Hand,
  Highlighter,
  MousePointer2,
  Pencil,
  Redo2,
  Slash,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { BOARD_TOOLS } from "@/hooks/useWhiteboard";

/**
 * The pens down the side of the whiteboard.
 *
 * Only ever rendered to someone holding a writer's token — a reader is shown
 * the page controls and nothing else, because every button here would be
 * refused by Netless and a row of buttons that silently do nothing is worse
 * than no row at all.
 */

const TOOLS = [
  { id: BOARD_TOOLS.PENCIL, icon: Pencil, label: "Pen" },
  { id: BOARD_TOOLS.TEXT, icon: Type, label: "Text" },
  { id: BOARD_TOOLS.STRAIGHT, icon: Slash, label: "Line" },
  { id: BOARD_TOOLS.ARROW, icon: ArrowUpRight, label: "Arrow" },
  { id: BOARD_TOOLS.RECTANGLE, icon: Square, label: "Rectangle" },
  { id: BOARD_TOOLS.ELLIPSE, icon: Circle, label: "Ellipse" },
  { id: BOARD_TOOLS.ERASER, icon: Eraser, label: "Eraser" },
  { id: BOARD_TOOLS.SELECTOR, icon: MousePointer2, label: "Select and move" },
  // Points at something without leaving a mark — the tool a teacher reaches
  // for most while talking over a board somebody else has to read.
  { id: BOARD_TOOLS.LASER, icon: Highlighter, label: "Laser pointer" },
  { id: BOARD_TOOLS.HAND, icon: Hand, label: "Pan the board" },
];

// The design system's own colours, minus the ones that vanish on white.
export const PEN_COLOURS = [
  { hex: "#101615", label: "Ink" },
  { hex: "#d96f5f", label: "Clay" },
  { hex: "#c7a85b", label: "Gold" },
  { hex: "#275bd8", label: "Blue" },
  { hex: "#21483f", label: "Moss" },
];

const WIDTHS = [
  { value: 2, label: "Thin" },
  { value: 4, label: "Medium" },
  { value: 10, label: "Thick" },
];

/** Undo / redo / clear — the same square as a tool, but an action not a mode. */
function ToolbarAction({ onClick, disabled = false, danger = false, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "text-rose hover:bg-clay/30"
          : "text-paper/70 hover:bg-paper/10 hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}

export default function WhiteboardToolbar({
  tool,
  onSelectTool,
  strokeColor,
  onSelectColor,
  strokeWidth,
  onSelectWidth,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearPage,
}) {
  return (
    // Wraps rather than scrolls or spills. A one-column rail of twenty
    // controls is taller than the board on any laptop screen, and the
    // original overflowed its box — the stroke widths and undo/redo/clear
    // ended up drawn over the video tile below it. Wrapping turns the
    // overflow into a second column, which costs horizontal space the
    // classroom has plenty of and keeps every control one click away instead
    // of behind a scroll. `content-start` packs the columns to the top edge
    // rather than spreading them down the rail.
    <div className="flex flex-row lg:flex-col flex-wrap content-start justify-center lg:justify-start items-center gap-1.5 p-2 rounded-2xl bg-ink/60 border border-paper/10 max-h-full shrink-0">
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelectTool(id)}
          title={label}
          aria-label={label}
          aria-pressed={tool === id}
          className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            tool === id
              ? "bg-gold text-ink"
              : "text-paper/70 hover:bg-paper/10 hover:text-paper"
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <span className="w-px h-6 lg:w-9 lg:h-px bg-paper/15 shrink-0" aria-hidden="true" />

      {PEN_COLOURS.map(({ hex, label }) => (
        <button
          key={hex}
          type="button"
          onClick={() => onSelectColor(hex)}
          title={label}
          aria-label={`${label} pen`}
          aria-pressed={strokeColor === hex}
          className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            strokeColor === hex ? "bg-paper/20" : "hover:bg-paper/10"
          }`}
        >
          <span
            className="w-4 h-4 rounded-full border border-paper/40"
            style={{ backgroundColor: hex }}
          />
        </button>
      ))}

      <span className="w-px h-6 lg:w-9 lg:h-px bg-paper/15 shrink-0" aria-hidden="true" />

      {WIDTHS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelectWidth(value)}
          title={`${label} stroke`}
          aria-label={`${label} stroke`}
          aria-pressed={strokeWidth === value}
          className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            strokeWidth === value ? "bg-paper/20" : "hover:bg-paper/10"
          }`}
        >
          <span
            className="rounded-full bg-paper"
            // Scaled down from the real stroke width so the thickest swatch
            // still fits the button; the ordering is what the button conveys.
            style={{ width: `${4 + value}px`, height: `${4 + value}px` }}
          />
        </button>
      ))}

      <span className="w-px h-6 lg:w-9 lg:h-px bg-paper/15 shrink-0" aria-hidden="true" />

      <ToolbarAction onClick={onUndo} disabled={!canUndo} label="Undo">
        <Undo2 className="w-4 h-4" />
      </ToolbarAction>
      <ToolbarAction onClick={onRedo} disabled={!canRedo} label="Redo">
        <Redo2 className="w-4 h-4" />
      </ToolbarAction>
      {/* Clearing wipes the page for the whole class, so it is the one
          control in here wearing the warning colour. */}
      <ToolbarAction onClick={onClearPage} danger label="Clear this page for everyone">
        <Trash2 className="w-4 h-4" />
      </ToolbarAction>
    </div>
  );
}
