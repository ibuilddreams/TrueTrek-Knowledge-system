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
    <span className={`font-mono font-bold ${isPositive ? "text-emerald-700" : "text-rose-600"}`}>
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        icon={User}
        title={student?.name}
        subtitle={student?.email}
        maxWidth="max-w-2xl"
      >
        {isLoading ? (
          <Loader fullScreen={false} label="Loading points detail..." />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700/80 font-semibold">
                  Balance
                </p>
                <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{(data?.balance ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-700/80 font-semibold">
                  Total Earned
                </p>
                <p className="text-2xl font-serif font-bold text-stone-900 mt-1">
                  {(data?.total_earned ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
                <p className="text-[10px] font-mono uppercase tracking-widest text-rose-700/80 font-semibold">
                  Total Spent
                </p>
                <p className="text-2xl font-serif font-bold text-stone-900 mt-1">
                  {(data?.total_spent ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAdjustOpen(true)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-mono uppercase tracking-wider rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Adjust Points
            </button>

            <div>
              <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider font-semibold mb-2">
                Recent Activity
              </p>

              {transactions.length === 0 ? (
                <EmptyState icon={Coins} label="No points activity yet." compact />
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm text-stone-700 truncate">
                          {transaction.reason || formatActivityType(transaction.transaction_type)}
                        </p>
                        <p className="text-[11px] text-stone-400 font-light">
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
