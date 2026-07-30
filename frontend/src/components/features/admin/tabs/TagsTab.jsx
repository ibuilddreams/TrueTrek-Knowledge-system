"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Edit3, RefreshCw, Tag as TagIcon, Trash2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteTag, getTags } from "@/services/tagsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import Pagination from "@/components/ui/Pagination";
import SearchBar from "@/components/ui/SearchBar";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import IconBadge from "@/components/ui/IconBadge";
import TagFormModal from "@/components/features/admin/TagFormModal";

const PAGE_SIZE = 12;

export default function TagsTab() {
  const queryClient = useQueryClient();

  const {
    data: tags = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await getTags();
      return response?.data || [];
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredTags = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter((tag) => (tag.name || "").toLowerCase().includes(query));
  }, [tags, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTags.length / PAGE_SIZE));
  const paginatedTags = filteredTags.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async () => {
    if (!deletingTag) return;
    try {
      await deleteTagMutation.mutateAsync(deletingTag.id);
      toastSuccess("Tag deleted successfully.");
      setDeletingTag(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete tag."));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search tags by name..." />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
          title="Create a new tag"
          aria-label="Create a new tag"
        >
          <TagIcon className="w-4 h-4" />
          ADD TAG
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl border border-stone-100 bg-stone-50/60 animate-pulse"
              >
                <div className="w-9 h-9 rounded-lg bg-stone-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-stone-200" />
                  <div className="h-2.5 w-1/3 rounded bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-stone-500 font-light">
              {getApiErrorMessage(error, "Unable to load tags.")}
            </p>
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-[11px] uppercase tracking-wider rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : paginatedTags.length === 0 ? (
          <EmptyState icon={TagIcon} label="No tags found." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedTags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-3 p-4 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all"
              >
                <IconBadge
                  icon={TagIcon}
                  size="w-9 h-9"
                  iconSize="w-4 h-4"
                  className="bg-amber-600/10 text-amber-700 rounded-lg border border-amber-200/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800 truncate">{tag.name}</p>
                  <p className="text-[11px] font-mono text-stone-400 truncate">/{tag.slug}</p>
                </div>
                <ActionMenu
                  actions={[
                    {
                      key: "edit",
                      label: "Edit Tag",
                      icon: Edit3,
                      onSelect: () => setEditingTag(tag),
                    },
                    {
                      key: "delete",
                      label: "Delete",
                      icon: Trash2,
                      tone: "danger",
                      onSelect: () => setDeletingTag(tag),
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredTags.length} tag${filteredTags.length === 1 ? "" : "s"}`}
        />
      </div>

      <TagFormModal
        isOpen={isFormOpen || Boolean(editingTag)}
        tag={editingTag}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTag(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingTag)}
        onClose={() => setDeletingTag(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteTagMutation.isPending}
        title="Delete Tag"
        message={`Are you sure you want to delete "${deletingTag?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
