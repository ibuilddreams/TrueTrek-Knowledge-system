"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit3, GripVertical, HelpCircle, ListChecks, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TeacherQuestionFormModal from "@/components/features/teachers/TeacherQuestionFormModal";
import TeacherQuestionChoicesModal from "@/components/features/teachers/TeacherQuestionChoicesModal";
import { deleteQuestion, getQuestions, reorderQuestions } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const QUESTION_TYPE_LABELS = {
  MCQ: "Multiple Choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
};

function SortableTeacherQuestionRow({ question, onEdit, onDelete, onManageChoices }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-xl border border-stone-200 bg-white ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          {...attributes}
          {...listeners}
          className="text-stone-300 cursor-grab shrink-0 touch-none mt-1.5"
          title="Drag to reorder"
          aria-hidden="true"
        >
          <GripVertical className="w-4 h-4" />
        </span>
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

export default function TeacherQuizQuestionsModal({ isOpen, onClose, quiz }) {
  const queryClient = useQueryClient();
  const quizId = quiz?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [choicesQuestion, setChoicesQuestion] = useState(null);
  const [localOrderIds, setLocalOrderIds] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const reorderMutation = useMutation({
    mutationFn: (entries) => reorderQuestions(quizId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to reorder questions."));
    },
  });

  const displayQuestions = useMemo(() => {
    if (!localOrderIds) return questions;
    const currentIds = questions.map((question) => question.id);
    const sameSet =
      localOrderIds.length === currentIds.length &&
      localOrderIds.every((id) => currentIds.includes(id));
    if (!sameSet) return questions;
    const questionById = new Map(questions.map((question) => [question.id, question]));
    return localOrderIds.map((id) => questionById.get(id));
  }, [questions, localOrderIds]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = displayQuestions.map((question) => question.id);
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderIds = arrayMove(currentIds, oldIndex, newIndex);
    setLocalOrderIds(newOrderIds);

    const payload = newOrderIds.map((id, index) => ({ question_id: id, order: index + 1 }));
    reorderMutation.mutate(payload);
  };

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
          ) : displayQuestions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              label="No questions yet."
              description="Add questions for students to answer in this quiz."
              compact
            />
          ) : (
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={displayQuestions.map((question) => question.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {displayQuestions.map((question) => (
                    <SortableTeacherQuestionRow
                      key={question.id}
                      question={question}
                      onEdit={openEditQuestion}
                      onDelete={setDeletingQuestion}
                      onManageChoices={setChoicesQuestion}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
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

      <TeacherQuestionFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        quizId={quizId}
        question={editingQuestion}
        nextOrder={questions.length + 1}
      />

      <TeacherQuestionChoicesModal
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
        message="Are you sure you want to delete this question? This cannot be undone."
        confirmLabel="Delete"
      />
    </>
  );
}
