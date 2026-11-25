"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Sparkles, User } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { getAdminStudentPointsDetail } from "@/services/pointsService";
import { formatActivityType, formatDateTime } from "@/lib/adminFormatters";
import AdjustPointsModal from "./AdjustPointsModal";

function AmountCell({ amount }) {
  const isPositive = amount >= 0;
  return (
    <span className={`font-bold ${isPositive ? "text-cn-p-ok" : "text-cn-p-bad"}`}>
      {isPositive ? "+" : ""}
      {amount.toLocaleString()}
    </span>
  );
}

export default function StudentPointsDetailModal({ isOpen, onClose, student }) {
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-student-points-detail", student?.id],
    queryFn: async () => {
      const response = await getAdminStudentPointsDetail(student.id);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(student?.id),
  });

  const transactions = data?.recent_transactions || [];

  return (
    <>
      <Modal variant="cobalt"
        isOpen={isOpen}
        onClose={onClose}
        icon={User}
        title={student?.name}
        subtitle={student?.email}
        maxWidth="max-w-2xl"
      >
        {isLoading ? (
          <Loader tone="cobalt" fullScreen={false} label="Loading points detail..." />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-cn-p-soft border border-cn-p-soft rounded-xl p-4 text-center">
                <p className="text-[10px] text-cn-p-soft-ink font-semibold">
                  Balance
                </p>
                <p className="text-2xl font-bold text-cn-p-ink mt-1">{(data?.balance ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-cn-p-ok-bg border border-cn-p-ok-bg rounded-xl p-4 text-center">
                <p className="text-[10px] text-cn-p-ok font-semibold">
                  Total earned
                </p>
                <p className="text-2xl font-bold text-cn-p-ink mt-1">
                  {(data?.total_earned ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-cn-p-bad-bg border border-cn-p-bad-bg rounded-xl p-4 text-center">
                <p className="text-[10px] text-cn-p-bad font-semibold">
                  Total spent
                </p>
                <p className="text-2xl font-bold text-cn-p-ink mt-1">
                  {(data?.total_spent ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAdjustOpen(true)}
              className="w-full py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Adjust points
            </button>

            <div>
              <p className="text-[11px] text-cn-p-ink-2 font-semibold mb-2">
                Recent activity
              </p>

              {transactions.length === 0 ? (
                <EmptyState tone="portal" icon={Coins} label="No points activity yet." compact />
              ) : (
                <div className="divide-y divide-cn-p-line border border-cn-p-line rounded-xl overflow-hidden">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm text-cn-p-ink-2 truncate">
                          {transaction.reason || formatActivityType(transaction.transaction_type)}
                        </p>
                        <p className="text-[11px] text-cn-p-ink-2 font-light">
                          {formatDateTime(transaction.created_at)}
                        </p>
                      </div>
                      <AmountCell amount={transaction.amount} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <AdjustPointsModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onAdjusted={refetch}
        student={student}
      />
    </>
  );
}
