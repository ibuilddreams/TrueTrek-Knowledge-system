"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Gift, PauseCircle, PlayCircle } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { activateReward, deactivateReward, getAdminRewards } from "@/services/rewardsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import RewardFormModal from "@/components/features/admin/RewardFormModal";

const PAGE_SIZE = 10;

export default function RewardsTab() {
  const queryClient = useQueryClient();

  const {
    data: rewards = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      const response = await getAdminRewards({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [togglingRewardId, setTogglingRewardId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredRewards = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return rewards;
    return rewards.filter((reward) => (reward.name || "").toLowerCase().includes(query));
  }, [rewards, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRewards.length / PAGE_SIZE));
  const paginatedRewards = filteredRewards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleStatus = async (reward) => {
    setTogglingRewardId(reward.id);
    try {
      if (reward.status === "ACTIVE") {
        await deactivateReward(reward.id);
        toastSuccess("Reward deactivated successfully.");
      } else {
        await activateReward(reward.id);
        toastSuccess("Reward activated successfully.");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
    } catch (toggleError) {
      toastError(getApiErrorMessage(toggleError, "Unable to update reward status."));
    } finally {
      setTogglingRewardId(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Reward",
      render: (reward) => (
        <div>
          <span className="font-semibold text-stone-800">{reward.name}</span>
          {reward.description && (
            <p className="text-[11px] text-stone-400 font-light line-clamp-1 max-w-xs">{reward.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "reward_type",
      header: "Type",
      render: (reward) => (
        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500">{reward.reward_type}</span>
      ),
    },
    {
      key: "points_required",
      header: "Points",
      render: (reward) => <span className="font-mono font-bold text-stone-800">{reward.points_required.toLocaleString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (reward) => <StatusBadge size="lg" status={reward.status} />,
    },
    {
      key: "redemptions_count",
      header: "Redemptions",
      render: (reward) => reward.redemptions_count ?? 0,
    },
    {
      key: "created_at",
      header: "Created",
      render: (reward) => formatDate(reward.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (reward) => (
        <ActionMenu
          actions={[
            {
              key: "edit",
              label: "Edit Reward",
              icon: Edit3,
              onSelect: () => setEditingReward(reward),
            },
            {
              key: "toggle",
              label: reward.status === "ACTIVE" ? "Deactivate" : "Activate",
              icon: reward.status === "ACTIVE" ? PauseCircle : PlayCircle,
              tone: reward.status === "ACTIVE" ? "danger" : "default",
              disabled: togglingRewardId === reward.id,
              onSelect: () => handleToggleStatus(reward),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchBar size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search rewards by name..." />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-sm font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
          title="Create a new reward"
          aria-label="Create a new reward"
        >
          <Gift className="w-4 h-4" />
          ADD REWARD
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={paginatedRewards}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load rewards.") : null}
          onRetry={refetch}
          emptyLabel="No rewards found."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredRewards.length} reward${filteredRewards.length === 1 ? "" : "s"}`}
        />
      </div>

      <RewardFormModal
        isOpen={isFormOpen || Boolean(editingReward)}
        reward={editingReward}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReward(null);
        }}
      />
    </div>
  );
}
