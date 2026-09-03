"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { adjustStudentPoints } from "@/services/pointsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export default function AdjustPointsModal({ isOpen, onClose, onAdjusted, student }) {
  const queryClient = useQueryClient();
  const [direction, setDirection] = useState("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const adjustMutation = useMutation({
    mutationFn: (payload) => adjustStudentPoints(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-student-points"] });
      queryClient.invalidateQueries({ queryKey: ["admin-student-points-detail", student?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-points-transactions"] });
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setDirection("add");
    setAmount("");
    setReason("");
    setFieldErrors({});
  }, [isOpen]);

  const handleClose = () => {
    if (adjustMutation.isPending) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const magnitude = Number(amount);
    const errors = {};
    if (!Number.isFinite(magnitude) || magnitude <= 0) errors.amount = "Enter a positive amount.";
    if (!reason.trim()) errors.reason = "A reason is required.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const signedAmount = direction === "add" ? magnitude : -magnitude;

    try {
      await adjustMutation.mutateAsync({
        student_id: student.id,
        amount: signedAmount,
        reason: reason.trim(),
      });
      toastSuccess(`Points ${direction === "add" ? "added to" : "removed from"} ${student.name}'s balance.`);
      onAdjusted?.();
      handleClose();
    } catch (error) {
      const apiFieldErrors = error?.data?.data;
      if (apiFieldErrors && typeof apiFieldErrors === "object") {
        const mapped = {};
        Object.entries(apiFieldErrors).forEach(([key, value]) => {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(mapped);
      }
      toastError(getApiErrorMessage(error, "Unable to adjust points."));
    }
  };

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Sparkles}
      title="Adjust Points"
      subtitle={`Manually add or remove points for ${student.name}. Every adjustment is recorded with a reason.`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDirection("add")}
            disabled={adjustMutation.isPending}
            className={`py-2.5 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider border flex items-center justify-center gap-1.5 transition ${
              direction === "add"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-stone-50 border-stone-200 text-stone-500"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Points
          </button>
          <button
            type="button"
            onClick={() => setDirection("remove")}
            disabled={adjustMutation.isPending}
            className={`py-2.5 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider border flex items-center justify-center gap-1.5 transition ${
              direction === "remove"
                ? "bg-rose-50 border-rose-300 text-rose-700"
                : "bg-stone-50 border-stone-200 text-stone-500"
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            Remove Points
          </button>
        </div>

        <div>
          <label className={LABEL_CLASS}>Amount</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value.replace(/[^0-9]/g, ""));
              setFieldErrors((prev) => ({ ...prev, amount: null }));
            }}
            disabled={adjustMutation.isPending}
            placeholder="100"
            className={FIELD_CLASS}
          />
          {fieldErrors.amount && <p className={ERROR_CLASS}>{fieldErrors.amount}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Reason</label>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setFieldErrors((prev) => ({ ...prev, reason: null }));
            }}
            disabled={adjustMutation.isPending}
            placeholder="e.g. Contest winner bonus"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.reason && <p className={ERROR_CLASS}>{fieldErrors.reason}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={adjustMutation.isPending}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={adjustMutation.isPending}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
          >
            {adjustMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Adjustment"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
