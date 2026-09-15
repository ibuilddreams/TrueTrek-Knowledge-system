"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Route, Trash2 } from "lucide-react";

export default function SortableTierPathwayItem({ pathway, onDetach }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pathway.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border border-line bg-paper ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-muted cursor-grab shrink-0 touch-none"
        title="Drag to reorder"
        aria-hidden="true"
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <div className="w-9 h-9 rounded-lg bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
        <Route className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink truncate">{pathway.name}</p>
        <p className="text-[11px] font-mono uppercase text-muted tracking-wider mt-0.5">
          {pathway.course_count ?? 0} course{pathway.course_count === 1 ? "" : "s"} · Order {pathway.order}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onDetach(pathway)}
          title="Remove from tier"
          aria-label="Remove from tier"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-line text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}
