"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, UserPlus, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createTeacher } from "@/services/teachersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  gender: "",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

export default function CreateTeacherModal({ isOpen, onClose, onCreated }) {
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
    const gender = form.gender;

    if (!username || !firstName || !lastName || !email || !password || !gender) {
      toastError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createTeacher({
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        gender,
      });
      toastSuccess(response?.message || "Teacher created successfully.");
      onCreated?.();
      handleClose();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to create teacher."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={UserPlus}
      title="Add Teacher"
      subtitle="Create a new teacher account."
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
            placeholder="teacher@example.com"
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
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition disabled:opacity-60"
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

        <div>
          <label className={LABEL_CLASS}>Gender</label>
          <select
            value={form.gender}
            onChange={updateField("gender")}
            disabled={isSubmitting}
            className={`${FIELD_CLASS} ${form.gender ? "text-stone-850" : "text-stone-400"}`}
          >
            <option value="" disabled>
              Select gender
            </option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Create Teacher
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
