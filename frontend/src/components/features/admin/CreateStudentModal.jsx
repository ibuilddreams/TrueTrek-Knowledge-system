"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, UserPlus, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createStudent } from "@/services/studentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
};

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";

export default function CreateStudentModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    setForm(INITIAL_FORM);
    setShowPassword(false);
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = form.username.trim();
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!username || !firstName || !lastName || !email || !password) {
      toastError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createStudent({
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      toastSuccess(response?.message || "Student created successfully.");
      onCreated?.();
      handleClose();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to create student."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={UserPlus}
      title="Add student"
      subtitle="Create a new student account."
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
          <label className={LABEL_CLASS}>Username</label>
          <input
            type="text"
            value={form.username}
            onChange={updateField("username")}
            disabled={isSubmitting}
            placeholder="Username"
            className={FIELD_CLASS}
            autoComplete="off"
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={updateField("email")}
            disabled={isSubmitting}
            placeholder="student@example.com"
            className={FIELD_CLASS}
            autoComplete="off"
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={updateField("password")}
              disabled={isSubmitting}
              placeholder="Create a password"
              className={`${FIELD_CLASS} pr-11`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-cn-p-ink-2 hover:text-cn-p-ink transition disabled:opacity-60"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-cn-p-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-2 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed"
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
                Creating...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Create student
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
