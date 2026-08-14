"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookOpen, GripVertical, Trash2 } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatAmount } from "@/lib/adminFormatters";

export default function SortablePathwayCourseItem({ pathwayCourse, onDetach }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pathwayCourse.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const course = pathwayCourse.course;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-stone-300 cursor-grab shrink-0 touch-none"
        title="Drag to reorder"
        aria-hidden="true"
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0 overflow-hidden">
        {course?.image ? (
          <img src={course.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-4 h-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-stone-800 truncate">{course?.title}</p>
          {course?.status && <StatusBadge status={course.status} />}
        </div>
        <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-0.5">
          {course?.code ? `${course.code} · ` : ""}
          {formatAmount(course?.amount)} · Order {pathwayCourse.order}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onDetach(pathwayCourse)}
          title="Detach course"
          aria-label="Detach course"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}
