"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, HelpCircle, Trash2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteQuestion, getAdminQuestions } from "@/services/onboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import OnboardingQuestionFormModal from "@/components/features/admin/OnboardingQuestionFormModal";

const PAGE_SIZE = 10;

export default function QuestionnaireTab() {
  const queryClient = useQueryClient();

  const {
    data: questions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const response = await getAdminQuestions();
      return response?.data || [];
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredQuestions = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return questions;
    return questions.filter((question) => (question.text || "").toLowerCase().includes(query));
  }, [questions, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const paginatedQuestions = filteredQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async () => {
    if (!deletingQuestion) return;
    try {
      await deleteQuestionMutation.mutateAsync(deletingQuestion.id);
      toastSuccess("Question deleted successfully.");
      setDeletingQuestion(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete question."));
    }
  };

  const columns = [
    {
      key: "text",
      header: "Question",
      render: (question) => (
        <span className="font-semibold text-stone-800 line-clamp-2">{question.text}</span>
      ),
    },
    {
      key: "order",
      header: "Order",
      render: (question) => <span className="font-mono text-stone-600">{question.order}</span>,
    },
    {
      key: "options",
      header: "Options",
      render: (question) => question.options?.length || 0,
    },
    {
      key: "is_multi_select",
      header: "Multi-select",
      render: (question) => (question.is_multi_select ? "Yes" : "No"),
    },
    {
      key: "is_active",
      header: "Status",
      render: (question) => <StatusBadge size="lg" status={question.is_active ? "ACTIVE" : "DRAFT"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (question) => (
        <ActionMenu
          actions={[
            {
              key: "edit",
              label: "Edit Question",
              icon: Edit3,
              onSelect: () => setEditingQuestion(question),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingQuestion(question),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchBar size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search questions by text..." />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-sm font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
          title="Create a new question"
          aria-label="Create a new question"
        >
          <HelpCircle className="w-4 h-4" />
          ADD QUESTION
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable size="lg"
          columns={columns}
          rows={paginatedQuestions}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load questions.") : null}
          onRetry={refetch}
          emptyLabel="No questions found."
        />
        <Pagination size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredQuestions.length} question${filteredQuestions.length === 1 ? "" : "s"}`}
        />
      </div>

      <OnboardingQuestionFormModal
        isOpen={isFormOpen || Boolean(editingQuestion)}
        question={editingQuestion}
        onClose={() => {
          setIsFormOpen(false);
          setEditingQuestion(null);
        }}
      />

      <ConfirmDialog size="lg"
        isOpen={Boolean(deletingQuestion)}
        onClose={() => setDeletingQuestion(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteQuestionMutation.isPending}
        title="Delete Question"
        message={`Are you sure you want to delete this question? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
