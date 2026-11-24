"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Gift, RefreshCw } from "lucide-react";
import { getRewardsCatalog, redeemReward } from "@/services/rewardsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import { PortalButton, PortalEmpty } from "./shell/PortalUI";
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
      <div className="p-10">
        <Loader fullScreen={false} tone="cobalt" label="Loading rewards catalog..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-5 w-5" />
        </span>
        <p className="text-sm text-cn-p-ink-2">
          {getApiErrorMessage(error, "Unable to load the rewards catalog.")}
        </p>
        <PortalButton size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </PortalButton>
      </div>
    );
  }

  const rewards = data?.rewards || [];
  const balance = data?.balance ?? 0;

  if (rewards.length === 0) {
    return (
      <PortalEmpty
        icon={Gift}
        title="No rewards available right now"
        text="New rewards appear here as the team adds them."
      />
    );
  }

  return (
    <>
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            balance={balance}
            onRedeem={setConfirmingReward}
          />
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
