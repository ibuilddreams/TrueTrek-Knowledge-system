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
      render: (tier) => <span className="font-mono text-stone-600">#{tier.level}</span>,
    },
    {
      key: "name",
      header: "Tier Name",
      render: (tier) => <span className="font-semibold text-stone-800">{tier.name}</span>,
    },
    {
      key: "audience",
      header: "Audience",
      render: (tier) => <span className="text-stone-600">{tier.audience || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (tier) => <StatusBadge status={tier.status} />,
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
              label: "Edit Tier",
              icon: Edit3,
              onSelect: () => setEditingTier(tier),
            },
            {
              key: "manage-pathways",
              label: "Manage Pathways",
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
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search tiers by name..." />

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
            title="Create a new tier"
            aria-label="Create a new tier"
          >
            <Layers3 className="w-4 h-4" />
            ADD TIER
          </button>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
          <DataTable
            columns={columns}
            rows={paginatedTiers}
            isLoading={isLoading}
            error={isError ? getApiErrorMessage(error, "Unable to load tiers.") : null}
            onRetry={refetch}
            emptyLabel="No tiers found."
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${filteredTiers.length} tier${filteredTiers.length === 1 ? "" : "s"}`}
          />
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

      <ConfirmDialog
        isOpen={Boolean(deletingTier)}
        onClose={() => setDeletingTier(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteTierMutation.isPending}
        title="Delete Tier"
        message={`Are you sure you want to delete "${deletingTier?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
