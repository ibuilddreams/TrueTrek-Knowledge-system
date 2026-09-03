"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import { getAdminDrillSchedulePerformance } from "@/services/dailyDrillService";

export default function DailyDrillPerformanceModal({ isOpen, onClose, schedule }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-daily-drill-performance", schedule?.id],
    queryFn: async () => {
      const response = await getAdminDrillSchedulePerformance(schedule.id);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(schedule?.id),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={BarChart3}
      title="Daily Drill Performance"
      subtitle={schedule?.title}
      maxWidth="max-w-sm"
    >
      {isLoading ? (
        <Loader fullScreen={false} label="Loading performance..." />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-semibold">Viewed</p>
            <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{data?.viewed_count ?? 0}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-700/80 font-semibold">
              Completed
            </p>
            <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{data?.completed_count ?? 0}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700/80 font-semibold">Points</p>
            <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{data?.points_awarded_total ?? 0}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
