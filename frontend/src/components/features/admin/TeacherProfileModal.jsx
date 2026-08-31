"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import Loader from "@/components/ui/Loader";
import { getTeacherById } from "@/services/teachersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError } from "@/lib/toast";

export default function TeacherProfileModal({ isOpen, onClose, teacherId, courseCount = 0 }) {
  const [teacher, setTeacher] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !teacherId) return;

    let isMounted = true;
    setIsLoading(true);
    setTeacher(null);

    (async () => {
      try {
        const response = await getTeacherById(teacherId);
        if (isMounted) setTeacher(response?.data || null);
      } catch (error) {
        if (isMounted) toastError(getApiErrorMessage(error, "Unable to load teacher profile."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, teacherId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={Users} title="Teacher Profile" maxWidth="max-w-md">
      {isLoading ? (
        <Loader fullScreen={false} label="Loading profile..." />
      ) : teacher ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-serif font-bold text-stone-900">{teacher.full_name}</h4>
            <StatusBadge size="lg" status={teacher.account_status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Email</p>
              <p className="text-stone-700 font-semibold break-all">{teacher.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Username</p>
              <p className="text-stone-700 font-semibold">{teacher.username}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Gender</p>
              <p className="text-stone-700 font-semibold">{teacher.gender || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Joined Date</p>
              <p className="text-stone-700 font-semibold">{formatDate(teacher.date_joined)}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Assigned Courses</p>
              <p className="text-stone-700 font-semibold">{courseCount}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-400 font-light">Teacher profile unavailable.</p>
      )}
    </Modal>
  );
}
