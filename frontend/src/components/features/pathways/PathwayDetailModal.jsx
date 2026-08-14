"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers,
  Route,
} from "lucide-react";
import { getPublicPathwayById } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";

export default function PathwayDetailModal({
  pathwayId,
  isSelected = false,
  canSelect = true,
  onClose,
  onToggleSelect,
}) {
  const isOpen = Boolean(pathwayId);

  const { data: pathway, isLoading, isError, error } = useQuery({
    queryKey: ["public-pathway-detail", pathwayId],
    queryFn: async () => {
      const response = await getPublicPathwayById(pathwayId);
      return response?.data || null;
    },
    enabled: isOpen,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader fullScreen={false} label="Loading pathway..." />
        </div>
      )}

      {isError && (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-xs text-stone-500">
            {getApiErrorMessage(error, "Unable to load this pathway right now.")}
          </p>
        </div>
      )}

      {!isLoading && !isError && pathway && (
        <div className="space-y-5">
          <div className="relative h-48 -mx-5 -mt-5 sm:-mx-7 sm:-mt-7 rounded-t-2xl overflow-hidden bg-stone-100">
            {pathway.image ? (
              <img
                src={pathway.image}
                alt={pathway.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950">
                <Route className="w-12 h-12 text-amber-500/70" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 to-transparent"></div>
            <div className="absolute bottom-4 left-6 right-6 text-white text-left">
              <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase bg-amber-600 text-white px-2 py-0.5 rounded-md mb-2 inline-flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {pathway.courses?.length || 0} Course
                {(pathway.courses?.length || 0) === 1 ? "" : "s"}
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white leading-tight">
                {pathway.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-semibold text-stone-400 block uppercase tracking-wider">
              Bundle Price
            </span>
            <span className="text-2xl font-mono font-bold text-stone-900">
              {formatCoursePrice(pathway.base_price)}
            </span>
          </div>

          <div className="space-y-2 border-t border-stone-100 pt-4">
            <p className="text-xs font-mono uppercase text-amber-800 tracking-wider font-bold">
              Pathway Overview
            </p>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              {pathway.description ||
                pathway.summary ||
                "No description has been added for this pathway yet."}
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-mono uppercase text-amber-800 tracking-wider font-bold">
              Included Courses
            </p>
            {(pathway.courses || []).length === 0 ? (
              <p className="text-xs text-stone-400 font-light">
                No courses have been attached to this pathway yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {pathway.courses
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50"
                    >
                      <div className="w-10 h-10 rounded-lg border border-stone-200 shrink-0 bg-white overflow-hidden flex items-center justify-center">
                        {entry.course?.image ? (
                          <img
                            src={entry.course.image}
                            alt={entry.course.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <BookOpen className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {entry.course?.title}
                        </p>
                        <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                          {entry.course?.code ? `${entry.course.code} · ` : ""}
                          {formatCoursePrice(entry.course?.amount)}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="pt-2 border-t border-stone-100 flex justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs uppercase font-extrabold py-3 rounded-xl transition"
            >
              Close
            </button>
            {canSelect ? (
              <button
                type="button"
                onClick={() => {
                  onToggleSelect(pathway);
                  onClose();
                }}
                className={`flex-1 font-mono text-xs uppercase font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? "bg-stone-100 hover:bg-red-100 text-stone-700 hover:text-red-700"
                    : "bg-[#141211] hover:bg-amber-600 hover:text-white text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSelected ? "Remove Selection" : "Select for Purchase"}
              </button>
            ) : (
              <span
                className="flex-1 font-mono text-[11px] uppercase font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 bg-stone-100 text-stone-400"
                title="Only student accounts can purchase pathways"
              >
                <GraduationCap className="w-4 h-4" />
                Student Accounts Only
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
