"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import Loader from "@/components/ui/Loader";
import { getStudentById } from "@/services/studentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError } from "@/lib/toast";

export default function StudentProfileModal({ isOpen, onClose, studentId, enrollmentCount = 0 }) {
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    let isMounted = true;
    setIsLoading(true);
    setStudent(null);

    (async () => {
      try {
        const response = await getStudentById(studentId);
        if (isMounted) setStudent(response?.data || null);
      } catch (error) {
        if (isMounted) toastError(getApiErrorMessage(error, "Unable to load student profile."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, studentId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={GraduationCap} title="Student Profile" maxWidth="max-w-md">
      {isLoading ? (
        <Loader fullScreen={false} label="Loading profile..." />
      ) : student ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-serif font-bold text-stone-900">{student.full_name}</h4>
            <StatusBadge size="lg" status={student.account_status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Email</p>
              <p className="text-stone-700 font-semibold break-all">{student.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Username</p>
              <p className="text-stone-700 font-semibold">{student.username}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Gender</p>
              <p className="text-stone-700 font-semibold">{student.gender || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Joined Date</p>
              <p className="text-stone-700 font-semibold">{formatDate(student.date_joined)}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Total Enrollments</p>
              <p className="text-stone-700 font-semibold">{enrollmentCount}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-400 font-light">Student profile unavailable.</p>
      )}
    </Modal>
  );
}
