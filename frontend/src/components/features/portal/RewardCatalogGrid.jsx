"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Gift, RefreshCw } from "lucide-react";
import { getRewardsCatalog, redeemReward } from "@/services/rewardsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import RewardCard from "./RewardCard";
import RedeemConfirmDialog from "./RedeemConfirmDialog";

export default function RewardCatalogGrid({ onRedeemed }) {
  const queryClient = useQueryClient();
  const [confirmingReward, setConfirmingReward] = useState(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["rewards", "catalog"],
    queryFn: async () => {
      const response = await getRewardsCatalog();
      return response?.data || { balance: 0, rewards: [] };
    },
  });

  const redeemMutation = useMutation({
    mutationFn: ({ id, note }) => redeemReward(id, note),
  });

  const handleConfirmRedeem = async (note) => {
    if (!confirmingReward) return;
    try {
      await redeemMutation.mutateAsync({ id: confirmingReward.id, note });
      toastSuccess(`Redeemed "${confirmingReward.name}" successfully.`);
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["points"] });
      setConfirmingReward(null);
      onRedeemed?.();
    } catch (redeemError) {
      toastError(getApiErrorMessage(redeemError, "Unable to redeem this reward."));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-10">
        <Loader fullScreen={false} label="Loading rewards catalog..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-stone-500 font-light">
          {getApiErrorMessage(error, "Unable to load the rewards catalog.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const rewards = data?.rewards || [];
  const balance = data?.balance ?? 0;

  if (rewards.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <EmptyState icon={Gift} label="No rewards available right now." size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} onRedeem={setConfirmingReward} />
        ))}
      </div>

      <RedeemConfirmDialog
        isOpen={Boolean(confirmingReward)}
        onClose={() => setConfirmingReward(null)}
        onConfirm={handleConfirmRedeem}
        reward={confirmingReward}
        balance={balance}
        isConfirming={redeemMutation.isPending}
      />
    </>
  );
}
