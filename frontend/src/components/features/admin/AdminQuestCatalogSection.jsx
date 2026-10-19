"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Edit3, ListChecks, Swords } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteQuest, getAdminQuests } from "@/services/questsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import QuestFormModal from "@/components/features/admin/QuestFormModal";

const PAGE_SIZE = 10;

export default function AdminQuestCatalogSection({ onViewSubmissions }) {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [archivingQuest, setArchivingQuest] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-quests", page, debouncedSearch],
    queryFn: async () => {
      const response = await getAdminQuests({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
      });
      return response?.data || { count: 0, results: [] };
    },
  });

  const quests = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // The API archives rather than deletes a quest that students have already
  // been assigned — a completed assignment backs a points ledger entry. The
  // response message says which happened, so it's surfaced verbatim.
  const handleArchive = async () => {
    if (!archivingQuest) return;
    setIsArchiving(true);
    try {
      const response = await deleteQuest(archivingQuest.id);
      toastSuccess(response?.message || "Quest removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
      setArchivingQuest(null);
    } catch (archiveError) {
      toastError(getApiErrorMessage(archiveError, "Unable to remove this quest."));
    } finally {
      setIsArchiving(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Quest",
      render: (quest) => (
        <div>
          <span className="font-semibold text-ink">{quest.title}</span>
          <p className="text-[11px] text-muted font-light line-clamp-1 max-w-xs">
            {quest.instructions}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (quest) => (
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
          {quest.category_display}
        </span>
      ),
    },
    {
      key: "difficulty",
      header: "Difficulty",
      render: (quest) => (
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
          {quest.difficulty_display}
        </span>
      ),
    },
    {
      key: "points_reward",
      header: "Points",
      render: (quest) => (
        <span className="font-mono font-bold text-ink">{quest.points_reward}</span>
      ),
    },
    {
      key: "completion_count",
      header: "Completions",
      render: (quest) => (
        <span className="text-muted">
          {quest.completion_count ?? 0}
          <span className="text-[11px] font-light"> / {quest.assignment_count ?? 0}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (quest) => <StatusBadge size="lg" status={quest.status} />,
    },
    {
      key: "created_at",
      header: "Created",
      render: (quest) => formatDate(quest.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (quest) => (
        <ActionMenu
          actions={[
            {
              key: "submissions",
              label: "View Submissions",
              icon: ListChecks,
              onSelect: () => onViewSubmissions?.(quest),
            },
            {
              key: "edit",
              label: "Edit Quest",
              icon: Edit3,
              onSelect: () => setEditingQuest(quest),
            },
            {
              key: "archive",
              label: "Archive / Delete",
              icon: Archive,
              tone: "danger",
              onSelect: () => setArchivingQuest(quest),
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
          placeholder="Search quests by title..."
        />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-pine hover:bg-moss text-paper text-sm font-semibold font-mono rounded-xl tracking-wider shadow-soft hover:shadow-elevated transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          title="Create a new quest"
          aria-label="Create a new quest"
        >
          <Swords className="w-4 h-4" />
          ADD QUEST
        </button>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={quests}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load quests.") : null}
          onRetry={refetch}
          emptyLabel="No quests found."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${totalCount} quest${totalCount === 1 ? "" : "s"}`}
        />
      </div>

      <QuestFormModal
        isOpen={isFormOpen || Boolean(editingQuest)}
        quest={editingQuest}
        onClose={() => {
          setIsFormOpen(false);
          setEditingQuest(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(archivingQuest)}
        onClose={() => setArchivingQuest(null)}
        onConfirm={handleArchive}
        isConfirming={isArchiving}
        tone="danger"
        title="Remove this quest?"
        message={
          archivingQuest
            ? `"${archivingQuest.title}" will be archived if students have already been assigned it, so their history and points stay intact. If it has never been assigned, it will be deleted outright.`
            : ""
        }
        confirmLabel="Remove Quest"
      />
    </div>
  );
}
