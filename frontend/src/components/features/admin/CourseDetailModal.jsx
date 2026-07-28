"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import Loader from "@/components/ui/Loader";
import { getCourseById } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";

export default function CourseDetailModal({ isOpen, onClose, courseId }) {
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !courseId) return;

    let isMounted = true;
    setIsLoading(true);
    setCourse(null);

    (async () => {
      try {
        const response = await getCourseById(courseId);
        if (isMounted) setCourse(response?.data || null);
      } catch (error) {
        if (isMounted) toastError(getApiErrorMessage(error, "Unable to load course details."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, courseId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={BookOpen} title="Course Details" maxWidth="max-w-xl">
      {isLoading ? (
        <Loader fullScreen={false} label="Loading course..." />
      ) : course ? (
        <div className="space-y-4">
          <div className="relative w-full h-40 rounded-lg border border-stone-100 overflow-hidden">
            {course.image ? (
              <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-stone-50 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-stone-300" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/30 to-transparent p-3 flex items-center justify-between gap-3">
              <h4 className="text-base font-serif font-bold text-white">{course.title}</h4>
              <StatusBadge status={course.status} />
            </div>
          </div>
          {course.description && (
            <p className="text-xs text-stone-500 font-light leading-relaxed">{course.description}</p>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-1">Category</p>
              <p className="text-stone-700 font-semibold">{course.category?.name || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-1">Tags</p>
              <p className="text-stone-700 font-semibold">
                {course.tags?.length ? course.tags.map((tag) => tag.name).join(", ") : "—"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-2">Instructors</p>
            {course.instructors?.length ? (
              <ul className="space-y-2">
                {course.instructors.map((instructor) => (
                  <li
                    key={instructor.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-stone-100 bg-stone-50/60 text-xs"
                  >
                    <span className="font-semibold text-stone-800">{instructor.name}</span>
                    <span className="text-stone-400 font-mono">{instructor.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-400 font-light">No instructors assigned.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400 font-light">Course details unavailable.</p>
      )}
    </Modal>
  );
}
