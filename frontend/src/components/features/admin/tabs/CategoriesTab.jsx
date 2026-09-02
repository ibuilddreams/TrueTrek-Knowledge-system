"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, FolderPlus, Trash2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteCategory, getCategories } from "@/services/categoriesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CategoryFormModal from "@/components/features/admin/CategoryFormModal";

const PAGE_SIZE = 10;

export default function CategoriesTab() {
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredCategories = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) => (category.name || "").toLowerCase().includes(query));
  }, [categories, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const paginatedCategories = filteredCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategoryMutation.mutateAsync(deletingCategory.id);
      toastSuccess("Category deleted successfully.");
      setDeletingCategory(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete category."));
    }
  };

  const columns = [
    {
      key: "name",
      header: "Category Name",
      render: (category) => <span className="font-semibold text-ink">{category.name}</span>,
    },
    { key: "slug", header: "Slug", render: (category) => category.slug },
    {
      key: "courses",
      header: "Courses",
      render: (category) => category.courses?.length || 0,
    },
    {
      key: "created_at",
      header: "Created",
      render: (category) => formatDate(category.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (category) => (
        <ActionMenu
          actions={[
            {
              key: "edit",
              label: "Edit Category",
              icon: Edit3,
              onSelect: () => setEditingCategory(category),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingCategory(category),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchBar size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search categories by name..." />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-5 py-2.5 bg-pine hover:bg-moss text-paper text-xs font-medium uppercase tracking-widest rounded-full shadow-soft hover:shadow-elevated transition-all flex items-center gap-2 shrink-0"
          title="Create a new category"
          aria-label="Create a new category"
        >
          <FolderPlus className="w-4 h-4" />
          ADD CATEGORY
        </button>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable size="lg"
          columns={columns}
          rows={paginatedCategories}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load categories.") : null}
          onRetry={refetch}
          emptyLabel="No categories found."
        />
        <Pagination size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredCategories.length} categor${filteredCategories.length === 1 ? "y" : "ies"}`}
        />
      </div>

      <CategoryFormModal
        isOpen={isFormOpen || Boolean(editingCategory)}
        category={editingCategory}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
      />

      <ConfirmDialog size="lg"
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteCategoryMutation.isPending}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
