"use client";

import { useEffect, useState } from "react";
import { Check, Edit3, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { updateTeacher } from "@/services/teachersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default function EditTeacherModal({ isOpen, onClose, teacher, onUpdated }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    account_status: "",
    is_advisor: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !teacher) return;
    setForm({
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      account_status: teacher.account_status || "ACTIVE",
      is_advisor: Boolean(teacher.is_advisor),
    });
  }, [isOpen, teacher]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!teacher) return;

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const accountStatus = form.account_status;

    if (!firstName || !lastName || !accountStatus) {
      toastError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateTeacher(teacher.id, {
        first_name: firstName,
        last_name: lastName,
        account_status: accountStatus,
        is_advisor: form.is_advisor,
      });
      toastSuccess(response?.message || "Teacher updated successfully.");
      onUpdated?.();
      handleClose();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to update teacher."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!teacher) return null;

  return (
    <Modal variant="cobalt"
      isOpen={isOpen}
      onClose={handleClose}
      icon={Edit3}
      title="Edit teacher"
      subtitle={teacher.email}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>First Name</label>
            <input
              type="text"
              value={form.first_name}
              onChange={updateField("first_name")}
              disabled={isSubmitting}
              placeholder="First name"
              className={FIELD_CLASS}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Last Name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={updateField("last_name")}
              disabled={isSubmitting}
              placeholder="Last name"
              className={FIELD_CLASS}
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Account Status</label>
          <select
            value={form.account_status}
            onChange={updateField("account_status")}
            disabled={isSubmitting}
            className={`${FIELD_CLASS} cn-p-select`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-cn-p-line bg-cn-p-page text-sm text-cn-p-ink cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_advisor}
            onChange={() => setForm((prev) => ({ ...prev, is_advisor: !prev.is_advisor }))}
            disabled={isSubmitting}
          />
          <span>
            Advisor
            <span className="block text-xs font-sans text-cn-p-ink-2 normal-case tracking-normal">
              Students can reach this teacher directly from "Ask an Advisor"
            </span>
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-cn-p-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
