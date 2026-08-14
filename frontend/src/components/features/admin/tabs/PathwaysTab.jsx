"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Layers, Percent, Plus, Route, Trash2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteBundleRule, deletePathway, getAdminPathways, getBundleRules } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatAmount, formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import PathwayFormModal from "@/components/features/admin/PathwayFormModal";
import ManagePathwayCoursesModal from "@/components/features/admin/ManagePathwayCoursesModal";
import BundleRuleFormModal from "@/components/features/admin/BundleRuleFormModal";

const PAGE_SIZE = 10;

export default function PathwaysTab() {
  const queryClient = useQueryClient();

  const {
    data: pathways = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["pathways"],
    queryFn: async () => {
      const response = await getAdminPathways({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const bundleRulesQuery = useQuery({
    queryKey: ["bundleRules"],
    queryFn: async () => {
      const response = await getBundleRules();
      return response?.data || [];
    },
  });
  const bundleRules = bundleRulesQuery.data || [];

  const deletePathwayMutation = useMutation({
    mutationFn: (id) => deletePathway(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
    },
  });

  const deleteBundleRuleMutation = useMutation({
    mutationFn: (id) => deleteBundleRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundleRules"] });
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPathway, setEditingPathway] = useState(null);
  const [deletingPathway, setDeletingPathway] = useState(null);
  const [managingCoursesPathway, setManagingCoursesPathway] = useState(null);

  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredPathways = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return pathways;
    return pathways.filter((pathway) => (pathway.name || "").toLowerCase().includes(query));
  }, [pathways, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredPathways.length / PAGE_SIZE));
  const paginatedPathways = filteredPathways.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async () => {
    if (!deletingPathway) return;
    try {
      await deletePathwayMutation.mutateAsync(deletingPathway.id);
      toastSuccess("Pathway deleted successfully.");
      setDeletingPathway(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete pathway."));
    }
  };

  const handleDeleteRuleConfirm = async () => {
    if (!deletingRule) return;
    try {
      await deleteBundleRuleMutation.mutateAsync(deletingRule.id);
      toastSuccess("Bundle rule deleted successfully.");
      setDeletingRule(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete bundle rule."));
    }
  };

  const columns = [
    {
      key: "name",
      header: "Pathway Name",
      render: (pathway) => <span className="font-semibold text-stone-800">{pathway.name}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (pathway) => <StatusBadge status={pathway.status} />,
    },
    {
      key: "base_price",
      header: "Base Price",
      render: (pathway) => (
        <span className="font-mono text-stone-600">{formatAmount(pathway.base_price)}</span>
      ),
    },
    {
      key: "course_count",
      header: "Courses",
      render: (pathway) => pathway.course_count ?? 0,
    },
    {
      key: "created_at",
      header: "Created",
      render: (pathway) => formatDate(pathway.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (pathway) => (
        <ActionMenu
          actions={[
            {
              key: "edit",
              label: "Edit Pathway",
              icon: Edit3,
              onSelect: () => setEditingPathway(pathway),
            },
            {
              key: "manage-courses",
              label: "Manage Courses",
              icon: Layers,
              onSelect: () => setManagingCoursesPathway(pathway),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingPathway(pathway),
            },
          ]}
        />
      ),
    },
  ];

  const ruleColumns = [
    {
      key: "pathway_count",
      header: "Pathway Count",
      render: (rule) => <span className="font-mono text-stone-700">{rule.pathway_count}</span>,
    },
    {
      key: "discount_percent",
      header: "Discount",
      render: (rule) => <span className="font-mono text-stone-700">{rule.discount_percent}%</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (rule) => (
        <ActionMenu
          actions={[
            {
              key: "edit",
              label: "Edit Rule",
              icon: Edit3,
              onSelect: () => setEditingRule(rule),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingRule(rule),
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
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search pathways by name..." />

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
            title="Create a new pathway"
            aria-label="Create a new pathway"
          >
            <Route className="w-4 h-4" />
            ADD PATHWAY
          </button>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
          <DataTable
            columns={columns}
            rows={paginatedPathways}
            isLoading={isLoading}
            error={isError ? getApiErrorMessage(error, "Unable to load pathways.") : null}
            onRetry={refetch}
            emptyLabel="No pathways found."
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${filteredPathways.length} pathway${filteredPathways.length === 1 ? "" : "s"}`}
          />
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900 leading-tight">Bundle Pricing</h3>
              <p className="text-[11px] text-stone-450 font-light">
                Discount rules applied when students bundle multiple pathways.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRuleFormOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-semibold font-mono rounded-xl tracking-wider border border-stone-200 shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            title="Add a bundle pricing rule"
            aria-label="Add a bundle pricing rule"
          >
            <Plus className="w-3.5 h-3.5" />
            ADD RULE
          </button>
        </div>

        <DataTable
          columns={ruleColumns}
          rows={bundleRules}
          isLoading={bundleRulesQuery.isLoading}
          error={
            bundleRulesQuery.isError
              ? getApiErrorMessage(bundleRulesQuery.error, "Unable to load bundle rules.")
              : null
          }
          onRetry={bundleRulesQuery.refetch}
          emptyLabel="No bundle pricing rules yet."
        />
      </div>

      <PathwayFormModal
        isOpen={isFormOpen || Boolean(editingPathway)}
        pathway={editingPathway}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPathway(null);
        }}
      />

      <ManagePathwayCoursesModal
        isOpen={Boolean(managingCoursesPathway)}
        pathway={managingCoursesPathway}
        onClose={() => setManagingCoursesPathway(null)}
      />

      <BundleRuleFormModal
        isOpen={isRuleFormOpen || Boolean(editingRule)}
        rule={editingRule}
        onClose={() => {
          setIsRuleFormOpen(false);
          setEditingRule(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingPathway)}
        onClose={() => setDeletingPathway(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deletePathwayMutation.isPending}
        title="Delete Pathway"
        message={`Are you sure you want to delete "${deletingPathway?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        isOpen={Boolean(deletingRule)}
        onClose={() => setDeletingRule(null)}
        onConfirm={handleDeleteRuleConfirm}
        isConfirming={deleteBundleRuleMutation.isPending}
        title="Delete Bundle Rule"
        message={`Are you sure you want to delete the ${deletingRule?.pathway_count}-pathway bundle rule? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
