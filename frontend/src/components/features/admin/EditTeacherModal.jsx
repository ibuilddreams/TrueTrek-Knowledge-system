"use client";

import { useEffect, useState } from "react";
import { Check, Edit3, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { updateTeacher } from "@/services/teachersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default function EditTeacherModal({ isOpen, onClose, teacher, onUpdated }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    account_status: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !teacher) return;
    setForm({
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      gender: teacher.gender || "",
      account_status: teacher.account_status || "ACTIVE",
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
    const gender = form.gender;
    const accountStatus = form.account_status;

    if (!firstName || !lastName || !gender || !accountStatus) {
      toastError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateTeacher(teacher.id, {
        first_name: firstName,
        last_name: lastName,
        gender,
        account_status: accountStatus,
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Edit3}
      title="Edit Teacher"
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
          <label className={LABEL_CLASS}>Gender</label>
          <select
            value={form.gender}
            onChange={updateField("gender")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          >
            <option value="" disabled>
              Select gender
            </option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Account Status</label>
          <select
            value={form.account_status}
            onChange={updateField("account_status")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
