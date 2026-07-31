"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, HelpCircle, ListChecks, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import QuestionFormModal from "@/components/features/admin/QuestionFormModal";
import QuestionChoicesModal from "@/components/features/admin/QuestionChoicesModal";
import { deleteQuestion, getQuestions } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const QUESTION_TYPE_LABELS = {
  MCQ: "Multiple Choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
};

function QuestionRow({ question, onEdit, onDelete, onManageChoices }) {
  return (
    <li className="p-3 rounded-xl border border-stone-200 bg-white">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
          {question.order ?? "—"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-stone-800">{question.text}</p>
          <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{QUESTION_TYPE_LABELS[question.question_type] || question.question_type}</span>
            <span className="text-stone-200">·</span>
            <span>{question.marks} mark{question.marks === 1 ? "" : "s"}</span>
            {question.question_type !== "SHORT_ANSWER" && (
              <>
                <span className="text-stone-200">·</span>
                <span>{question.choices?.length || 0} choice{question.choices?.length === 1 ? "" : "s"}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {question.question_type !== "SHORT_ANSWER" && (
            <button
              type="button"
              onClick={() => onManageChoices(question)}
              title="Manage choices"
              aria-label="Manage choices"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
            >
              <ListChecks className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(question)}
            title="Edit question"
            aria-label="Edit question"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(question)}
            title="Delete question"
            aria-label="Delete question"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function QuizQuestionsModal({ isOpen, onClose, quiz }) {
  const queryClient = useQueryClient();
  const quizId = quiz?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [choicesQuestion, setChoicesQuestion] = useState(null);

  const questionsQuery = useQuery({
    queryKey: ["questions", quizId],
    queryFn: async () => {
      const response = await getQuestions(quizId);
      return response?.data || [];
    },
    enabled: isOpen && Boolean(quizId),
  });
  const questions = questionsQuery.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
      toastSuccess("Question deleted successfully.");
      setDeletingQuestion(null);
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to delete question."));
    },
  });

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setIsFormOpen(true);
  };

  const openEditQuestion = (question) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isFormOpen}
        onClose={onClose}
        icon={HelpCircle}
        title="Quiz Questions"
        subtitle={quiz?.title}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {questionsQuery.isLoading ? (
            <Loader fullScreen={false} label="Loading questions..." />
          ) : questions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              label="No questions yet."
              description="Add questions for students to answer in this quiz."
              compact
            />
          ) : (
            <ul className="space-y-2">
              {questions.map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  onEdit={openEditQuestion}
                  onDelete={setDeletingQuestion}
                  onManageChoices={setChoicesQuestion}
                />
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={openAddQuestion}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </button>
        </div>
      </Modal>

      <QuestionFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        quizId={quizId}
        question={editingQuestion}
        nextOrder={questions.length + 1}
      />

      <QuestionChoicesModal
        isOpen={Boolean(choicesQuestion)}
        onClose={() => setChoicesQuestion(null)}
        question={choicesQuestion}
        quizId={quizId}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingQuestion)}
        onClose={() => setDeletingQuestion(null)}
        onConfirm={() => deleteMutation.mutate(deletingQuestion.id)}
        isConfirming={deleteMutation.isPending}
        title="Delete Question"
        message={`Are you sure you want to delete this question? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}
