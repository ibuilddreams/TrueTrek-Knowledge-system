"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers,
} from "lucide-react";
import { getPublicPathwayById } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";

export default function PathwayDetailModal({
  pathwayId,
  isSelected = false,
  isOwned = false,
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
          <p className="text-xs text-muted">
            {getApiErrorMessage(error, "Unable to load this pathway right now.")}
          </p>
        </div>
      )}

      {!isLoading && !isError && pathway && (
        <div className="space-y-5">
          <div className="space-y-3 border-b border-line pb-4">
            <span className="font-sans text-xs font-medium uppercase tracking-widest px-2.5 py-1 rounded-md text-[#8a6f2e] bg-gold/15 inline-flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              {pathway.courses?.length || 0} Course
              {(pathway.courses?.length || 0) === 1 ? "" : "s"}
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-light tracking-tight text-ink leading-tight">
              {pathway.name}
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[9px] font-sans font-medium text-muted block uppercase tracking-widest">
              Bundle Price
            </span>
            <span className="text-2xl font-sans font-semibold text-ink">
              {formatCoursePrice(pathway.base_price)}
            </span>
          </div>

          <div className="space-y-2 border-t border-line pt-4">
            <p className="text-xs font-sans uppercase text-moss tracking-widest font-medium">
              Pathway Overview
            </p>
            <p className="text-xs text-muted leading-relaxed font-light">
              {pathway.description ||
                pathway.summary ||
                "No description has been added for this pathway yet."}
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-sans uppercase text-moss tracking-widest font-medium">
              Included Courses
            </p>
            {(pathway.courses || []).length === 0 ? (
              <p className="text-xs text-muted font-light">
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
                      className="flex items-center gap-3 p-3 rounded-xl border border-line bg-porcelain"
                    >
                      <div className="w-10 h-10 rounded-lg border border-line shrink-0 bg-paper overflow-hidden flex items-center justify-center">
                        {entry.course?.image ? (
                          <img
                            src={entry.course.image}
                            alt={entry.course.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <BookOpen className="w-4 h-4 text-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink truncate">
                          {entry.course?.title}
                        </p>
                        <p className="text-[10px] font-sans text-muted mt-0.5">
                          {entry.course?.code ? `${entry.course.code} · ` : ""}
                          {formatCoursePrice(entry.course?.amount)}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="pt-2 border-t border-line flex justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-line hover:bg-porcelain text-ink font-sans text-xs uppercase font-medium tracking-widest py-3 rounded-full transition"
            >
              Close
            </button>
            {isOwned ? (
              <span
                className="flex-1 font-sans text-[11px] uppercase font-medium tracking-widest py-3 rounded-full flex items-center justify-center gap-1.5 bg-sage text-moss border border-moss/30"
                title="You already have access to this pathway"
              >
                <CheckCircle2 className="w-4 h-4" />
                Already Purchased
              </span>
            ) : canSelect ? (
              <button
                type="button"
                onClick={() => {
                  onToggleSelect(pathway);
                  onClose();
                }}
                className={`flex-1 font-sans text-xs uppercase font-semibold tracking-widest py-3 rounded-full transition flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? "bg-porcelain hover:bg-rose text-ink hover:text-clay"
                    : "bg-pine hover:bg-moss text-paper"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSelected ? "Remove Selection" : "Select for Purchase"}
              </button>
            ) : (
              <span
                className="flex-1 font-sans text-[11px] uppercase font-medium tracking-widest py-3 rounded-full flex items-center justify-center gap-1.5 bg-porcelain text-muted"
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
