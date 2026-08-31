"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Circle, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { createChoice, deleteChoice, getChoices, updateChoice } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-lg text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

function ChoiceRow({ choice, onMarkCorrect, onEdit, onDelete, isMutating }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(choice.text);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onEdit(choice, trimmed);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50/40">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className={FIELD_CLASS}
          autoFocus
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isMutating}
          title="Save"
          aria-label="Save choice"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition cursor-pointer disabled:opacity-60"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setText(choice.text);
            setIsEditing(false);
          }}
          title="Cancel"
          aria-label="Cancel edit"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => onMarkCorrect(choice)}
        disabled={isMutating || choice.is_correct}
        title={choice.is_correct ? "Correct answer" : "Mark as correct"}
        aria-label={choice.is_correct ? "Correct answer" : "Mark as correct"}
        className={`w-6 h-6 flex items-center justify-center rounded-full shrink-0 transition cursor-pointer disabled:cursor-not-allowed ${
          choice.is_correct ? "text-emerald-600" : "text-stone-300 hover:text-emerald-500"
        }`}
      >
        {choice.is_correct ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>
      <p className="min-w-0 flex-1 text-sm font-semibold text-stone-800 truncate">{choice.text}</p>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          title="Edit choice"
          aria-label="Edit choice"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(choice)}
          title="Delete choice"
          aria-label="Delete choice"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

export default function QuestionChoicesModal({ isOpen, onClose, question, quizId }) {
  const queryClient = useQueryClient();
  const questionId = question?.id;
  const [newChoiceText, setNewChoiceText] = useState("");
  const [deletingChoice, setDeletingChoice] = useState(null);

  const choicesQuery = useQuery({
    queryKey: ["choices", questionId],
    queryFn: async () => {
      const response = await getChoices(questionId);
      return response?.data || [];
    },
    enabled: isOpen && Boolean(questionId),
  });
  const choices = choicesQuery.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["choices", questionId] });
    if (quizId) queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createChoice(questionId, payload),
    onSuccess: () => {
      invalidate();
      toastSuccess("Choice added successfully.");
      setNewChoiceText("");
    },
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to add choice.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateChoice(id, payload),
    onSuccess: invalidate,
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to update choice.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteChoice(id),
    onSuccess: () => {
      invalidate();
      toastSuccess("Choice deleted successfully.");
      setDeletingChoice(null);
    },
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to delete choice.")),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleAddChoice = (event) => {
    event.preventDefault();
    const trimmed = newChoiceText.trim();
    if (!trimmed) return;
    createMutation.mutate({ text: trimmed, is_correct: choices.length === 0 });
  };

  const handleMarkCorrect = async (choice) => {
    const previouslyCorrect = choices.filter((item) => item.is_correct && item.id !== choice.id);
    try {
      await Promise.all(previouslyCorrect.map((item) => updateChoice(item.id, { is_correct: false })));
      await updateMutation.mutateAsync({ id: choice.id, payload: { is_correct: true } });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to update correct answer."));
    }
  };

  const handleEditChoice = (choice, text) => {
    updateMutation.mutate({ id: choice.id, payload: { text } });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        icon={ListChecks}
        title="Answer Choices"
        subtitle={question?.text}
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          {choicesQuery.isLoading ? (
            <Loader fullScreen={false} label="Loading choices..." />
          ) : choices.length === 0 ? (
            <EmptyState size="lg"
              icon={ListChecks}
              label="No choices yet."
              description="Add options for students to select from, then mark one as correct."
              compact
            />
          ) : (
            <ul className="space-y-2">
              {choices.map((choice) => (
                <ChoiceRow
                  key={choice.id}
                  choice={choice}
                  onMarkCorrect={handleMarkCorrect}
                  onEdit={handleEditChoice}
                  onDelete={setDeletingChoice}
                  isMutating={isMutating}
                />
              ))}
            </ul>
          )}

          <form onSubmit={handleAddChoice} className="flex items-center gap-2">
            <input
              type="text"
              value={newChoiceText}
              onChange={(event) => setNewChoiceText(event.target.value)}
              placeholder="New choice text"
              disabled={createMutation.isPending}
              className={FIELD_CLASS}
            />
            <button
              type="submit"
              disabled={createMutation.isPending || !newChoiceText.trim()}
              className="shrink-0 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>
          <p className="text-[11px] font-mono text-stone-400 tracking-wider">
            Click the circle to mark a choice as the correct answer.
          </p>
        </div>
      </Modal>

      <ConfirmDialog size="lg"
        isOpen={Boolean(deletingChoice)}
        onClose={() => setDeletingChoice(null)}
        onConfirm={() => deleteMutation.mutate(deletingChoice.id)}
        isConfirming={deleteMutation.isPending}
        title="Delete Choice"
        message={`Are you sure you want to delete "${deletingChoice?.text}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}
