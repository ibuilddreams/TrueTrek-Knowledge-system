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
    <Modal variant="cobalt"
      isOpen={isOpen}
      onClose={onClose}
      icon={BarChart3}
      title="Daily drill performance"
      subtitle={schedule?.title}
      maxWidth="max-w-sm"
    >
      {isLoading ? (
        <Loader tone="cobalt" fullScreen={false} label="Loading performance..." />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-cn-p-page border border-cn-p-line rounded-xl p-4 text-center">
            <p className="text-[10px] text-cn-p-ink-2 font-semibold">Viewed</p>
            <p className="text-2xl font-bold text-cn-p-ink mt-1">{data?.viewed_count ?? 0}</p>
          </div>
          <div className="bg-cn-p-ok-bg border border-cn-p-ok-bg rounded-xl p-4 text-center">
            <p className="text-[10px] text-cn-p-ok font-semibold">
              Completed
            </p>
            <p className="text-2xl font-bold text-cn-p-ink mt-1">{data?.completed_count ?? 0}</p>
          </div>
          <div className="bg-cn-p-soft border border-cn-p-soft rounded-xl p-4 text-center">
            <p className="text-[10px] text-cn-p-soft-ink font-semibold">Points</p>
            <p className="text-2xl font-bold text-cn-p-ink mt-1">{data?.points_awarded_total ?? 0}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
