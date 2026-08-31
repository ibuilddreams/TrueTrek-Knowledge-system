"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import Loader from "@/components/ui/Loader";
import { getFutureClientApplication } from "@/services/futureClientsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError } from "@/lib/toast";

export default function FutureClientDetailModal({ isOpen, onClose, applicationId }) {
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !applicationId) return;

    let isMounted = true;
    setIsLoading(true);
    setApplication(null);

    (async () => {
      try {
        const response = await getFutureClientApplication(applicationId);
        if (isMounted) setApplication(response?.data || null);
      } catch (error) {
        if (isMounted) toastError(getApiErrorMessage(error, "Unable to load application."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, applicationId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={UserPlus} title="Application Details" maxWidth="max-w-lg">
      {isLoading ? (
        <Loader fullScreen={false} label="Loading application..." />
      ) : application ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-serif font-bold text-stone-900">{application.full_name}</h4>
            <StatusBadge size="lg" status={application.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Email</p>
              <p className="text-stone-700 font-semibold break-all">{application.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Submitted</p>
              <p className="text-stone-700 font-semibold">{formatDate(application.submitted_at)}</p>
            </div>
            {application.reviewed_by && (
              <>
                <div>
                  <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Reviewed By</p>
                  <p className="text-stone-700 font-semibold">{application.reviewed_by.full_name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-1">Reviewed At</p>
                  <p className="text-stone-700 font-semibold">{formatDate(application.reviewed_at)}</p>
                </div>
              </>
            )}
          </div>

          {application.status === "REJECTED" && application.rejection_reason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 leading-relaxed">
              <p className="text-[11px] font-mono uppercase tracking-wider mb-1 font-semibold">
                Rejection Reason
              </p>
              {application.rejection_reason}
            </div>
          )}

          <div>
            <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mb-2">
              Requested Courses
            </p>
            <div className="space-y-2">
              {application.courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                >
                  <span className="text-sm font-semibold text-stone-800">{course.title}</span>
                  <span className="text-sm font-mono text-stone-500">${course.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-400 font-light">Application unavailable.</p>
      )}
    </Modal>
  );
}
