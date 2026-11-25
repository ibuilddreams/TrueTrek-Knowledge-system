"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Layers3, Route, Trash2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteTier, getAdminTiers } from "@/services/tiersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import TierFormModal from "@/components/features/admin/TierFormModal";
import ManageTierPathwaysModal from "@/components/features/admin/ManageTierPathwaysModal";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const PAGE_SIZE = 10;

export default function TiersTab() {
  const queryClient = useQueryClient();

  const {
    data: tiers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => {
      const response = await getAdminTiers({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: (id) => deleteTier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [deletingTier, setDeletingTier] = useState(null);
  const [managingPathwaysTier, setManagingPathwaysTier] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredTiers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return tiers;
    return tiers.filter((tier) => (tier.name || "").toLowerCase().includes(query));
  }, [tiers, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTiers.length / PAGE_SIZE));
  const paginatedTiers = filteredTiers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async () => {
    if (!deletingTier) return;
    try {
      await deleteTierMutation.mutateAsync(deletingTier.id);
      toastSuccess("Tier deleted successfully.");
      setDeletingTier(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete tier."));
    }
  };

  const columns = [
    {
      key: "level",
      header: "Level",
      render: (tier) => <span className="text-cn-p-ink-2">#{tier.level}</span>,
    },
    {
      key: "name",
      header: "Tier name",
      render: (tier) => <span className="font-semibold text-cn-p-ink">{tier.name}</span>,
    },
    {
      key: "audience",
      header: "Audience",
      render: (tier) => <span className="text-cn-p-ink-2">{tier.audience || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (tier) => <StatusBadge tone="cobalt" size="lg" status={tier.status} />,
    },
    {
      key: "pathway_count",
      header: "Pathways",
      render: (tier) => tier.pathway_count ?? 0,
    },
    {
      key: "created_at",
      header: "Created",
      render: (tier) => formatDate(tier.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (tier) => (
        <ActionMenu
          actions={[
            {
              key: "edit",
              label: "Edit tier",
              icon: Edit3,
              onSelect: () => setEditingTier(tier),
            },
            {
              key: "manage-pathways",
              label: "Manage pathways",
              icon: Route,
              onSelect: () => setManagingPathwaysTier(tier),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingTier(tier),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Tiers"
        subtitle="The nine tiers of the Cool Nerdz curriculum. Each pathway sits in one tier."
      />

      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-cn-p border border-cn-p-line bg-cn-p-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar tone="cobalt" size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search tiers by name..." />

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center gap-2 shrink-0"
            title="Create a new tier"
            aria-label="Create a new tier"
          >
            <Layers3 className="w-4 h-4" />
            Add tier
          </button>
        </div>

        <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
          <DataTable tone="cobalt" size="lg"
            columns={columns}
            rows={paginatedTiers}
            isLoading={isLoading}
            error={isError ? getApiErrorMessage(error, "Unable to load tiers.") : null}
            onRetry={refetch}
            emptyLabel="No tiers found."
          />
          <div className="px-4 pb-4">

            <Pagination tone="cobalt" size="lg"
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`${filteredTiers.length} tier${filteredTiers.length === 1 ? "" : "s"}`}
            />

          </div>
        </div>
      </div>

      <TierFormModal
        isOpen={isFormOpen || Boolean(editingTier)}
        tier={editingTier}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTier(null);
        }}
      />

      <ManageTierPathwaysModal
        isOpen={Boolean(managingPathwaysTier)}
        tier={managingPathwaysTier}
        onClose={() => setManagingPathwaysTier(null)}
      />

      <ConfirmDialog variant="cobalt" size="lg"
        isOpen={Boolean(deletingTier)}
        onClose={() => setDeletingTier(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteTierMutation.isPending}
        title="Delete tier"
        message={`Are you sure you want to delete "${deletingTier?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
