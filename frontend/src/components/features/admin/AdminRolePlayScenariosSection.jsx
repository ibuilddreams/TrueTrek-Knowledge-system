"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Edit3, ListChecks, Theater } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  deleteRolePlayScenario,
  getAdminRolePlayScenarios,
} from "@/services/wargamerService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RolePlayScenarioFormModal from "@/components/features/admin/RolePlayScenarioFormModal";

const PAGE_SIZE = 10;

export default function AdminRolePlayScenariosSection({ onViewSessions }) {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [archivingScenario, setArchivingScenario] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-roleplay-scenarios", page, debouncedSearch],
    queryFn: async () => {
      const response = await getAdminRolePlayScenarios({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
      });
      return response?.data || { count: 0, results: [] };
    },
  });

  const scenarios = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // The API archives rather than deletes a scenario students have already
  // run — a scored run backs a points ledger entry. The response message says
  // which happened, so it is surfaced verbatim.
  const handleArchive = async () => {
    if (!archivingScenario) return;
    setIsArchiving(true);
    try {
      const response = await deleteRolePlayScenario(archivingScenario.id);
      toastSuccess(response?.message || "Scenario removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-roleplay-scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["admin-roleplay", "stats"] });
      setArchivingScenario(null);
    } catch (archiveError) {
      toastError(getApiErrorMessage(archiveError, "Unable to remove this scenario."));
    } finally {
      setIsArchiving(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Scenario",
      render: (scenario) => (
        <div>
          <span className="font-semibold text-ink">{scenario.title}</span>
          <p className="text-[11px] text-muted font-light line-clamp-1 max-w-xs">
            {scenario.code} &middot; {scenario.setup}
          </p>
        </div>
      ),
    },
    {
      key: "pressure_type",
      header: "Pressure",
      render: (scenario) => (
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
          {scenario.pressure_type_display}
        </span>
      ),
    },
    {
      key: "counterpart_role",
      header: "AI Plays",
      render: (scenario) => (
        <div>
          <span className="text-xs text-ink">{scenario.counterpart_role}</span>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
            {scenario.persona_display}
          </p>
        </div>
      ),
    },
    {
      key: "points_reward",
      header: "Points",
      render: (scenario) => (
        <span className="font-mono font-bold text-ink">{scenario.points_reward}</span>
      ),
    },
    {
      key: "completion_count",
      header: "Runs",
      render: (scenario) => (
        <span className="text-muted">
          {scenario.completion_count ?? 0}
          <span className="text-[11px] font-light"> / {scenario.session_count ?? 0}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (scenario) => <StatusBadge size="lg" status={scenario.status} />,
    },
    {
      key: "created_at",
      header: "Created",
      render: (scenario) => formatDate(scenario.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (scenario) => (
        <ActionMenu
          actions={[
            {
              key: "sessions",
              label: "View Runs",
              icon: ListChecks,
              onSelect: () => onViewSessions?.(scenario),
            },
            {
              key: "edit",
              label: "Edit Scenario",
              icon: Edit3,
              onSelect: () => setEditingScenario(scenario),
            },
            {
              key: "archive",
              label: "Archive / Delete",
              icon: Archive,
              tone: "danger",
              onSelect: () => setArchivingScenario(scenario),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchBar
          size="lg"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search scenarios by title..."
        />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-pine hover:bg-moss text-paper text-sm font-semibold font-mono rounded-xl tracking-wider shadow-soft hover:shadow-elevated transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          title="Create a new role-play scenario"
          aria-label="Create a new role-play scenario"
        >
          <Theater className="w-4 h-4" />
          ADD SCENARIO
        </button>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={scenarios}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load scenarios.") : null}
          onRetry={refetch}
          emptyLabel="No scenarios found."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${totalCount} scenario${totalCount === 1 ? "" : "s"}`}
        />
      </div>

      <RolePlayScenarioFormModal
        isOpen={isFormOpen || Boolean(editingScenario)}
        scenario={editingScenario}
        onClose={() => {
          setIsFormOpen(false);
          setEditingScenario(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(archivingScenario)}
        onClose={() => setArchivingScenario(null)}
        onConfirm={handleArchive}
        isConfirming={isArchiving}
        tone="danger"
        title="Remove this scenario?"
        message={
          archivingScenario
            ? `"${archivingScenario.title}" will be archived if students have already run it, so their transcripts and points stay intact. If nobody has ever opened it, it will be deleted outright.`
            : ""
        }
        confirmLabel="Remove Scenario"
      />
    </div>
  );
}
