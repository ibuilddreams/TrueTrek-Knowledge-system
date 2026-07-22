"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, User, X } from "lucide-react";
import { getProfile, updateProfile } from "@/services/profileService";
import { toastError, toastSuccess } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import AuthField from "@/components/ui/AuthField";
import Loader from "@/components/ui/Loader";
import AvatarCropModal from "./AvatarCropModal";
import DiscardChangesDialog from "./DiscardChangesDialog";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  dob: "",
};

function mapProfileToForm(profile) {
  return {
    fullName: profile?.full_name || "",
    email: profile?.email || "",
    phone: profile?.profile?.phone_number || "",
    gender: profile?.gender || "",
    dob: profile?.profile?.date_of_birth || "",
  };
}

function validateForm(form) {
  const errors = {};
  if (!form.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }
  if (!form.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

export default function ProfileForm() {
  const router = useRouter();
  const { updateUserName } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [initialAvatarPreview, setInitialAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    return (
      JSON.stringify(form) !== JSON.stringify(initialForm) ||
      avatarPreview !== initialAvatarPreview
    );
  }, [form, initialForm, avatarPreview, initialAvatarPreview]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await getProfile();
        if (!isMounted) return;
        const profile = response?.data;
        const mapped = mapProfileToForm(profile);
        setForm(mapped);
        setInitialForm(mapped);
        setAvatarPreview(profile?.profile?.avatar || null);
        setInitialAvatarPreview(profile?.profile?.avatar || null);
      } catch (error) {
        if (!isMounted) return;
        toastError(error?.message || "Unable to load your profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCropSource(URL.createObjectURL(file));
  };

  const closeCropModal = () => {
    setCropSource(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropSave = ({ url }) => {
    setAvatarPreview(url);
    closeCropModal();
  };

  const resetFormToInitial = () => {
    setForm(initialForm);
    setErrors({});
    setAvatarPreview(initialAvatarPreview);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setIsDiscardDialogOpen(true);
      return;
    }
    router.push(ROUTES.DASHBOARD);
  };

  const handleDiscardChanges = () => {
    resetFormToInitial();
    setIsDiscardDialogOpen(false);
    router.push(ROUTES.DASHBOARD);
  };

  const handleContinueEditing = () => {
    setIsDiscardDialogOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateProfile({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        gender: form.gender || null,
        profile: {
          phone_number: form.phone.trim(),
          date_of_birth: form.dob || null,
        },
      });
      const profile = response?.data;
      const mapped = profile ? mapProfileToForm(profile) : form;
      setForm(mapped);
      setInitialForm(mapped);
      setInitialAvatarPreview(avatarPreview);
      updateUserName(mapped.fullName);
      toastSuccess("Profile updated successfully.");
    } catch (error) {
      toastError(error?.message || "Unable to update your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loader label="Loading Profile..." />;
  }

  return (
    <div className="py-10 px-4 sm:px-6 md:px-10 max-w-3xl mx-auto min-h-[85vh] font-sans">
      <div className="mb-8">
        <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-bold block mb-1">
          Account Settings
        </span>
        <h1 className="text-3xl font-serif font-black tracking-tight text-stone-900">
          Profile
        </h1>
        <p className="text-sm text-stone-500 font-light mt-0.5">
          Manage your personal details and how they appear across the platform.
        </p>
      </div>

      <div className="bg-white border border-stone-200/95 rounded-2xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="flex flex-col items-center sm:items-start gap-3 mb-8 pb-8 border-b border-stone-100">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shadow-inner">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Profile avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-stone-400" />
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                title="Change profile photo"
                aria-label="Change profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="text-[11px] font-mono font-semibold text-stone-500 hover:text-amber-800 uppercase tracking-wider transition"
            >
              Change Photo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <AuthField
              id="input-profile-full-name"
              label="Full Name"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={handleFieldChange("fullName")}
              error={errors.fullName}
            />

            <AuthField
              id="input-profile-email"
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={handleFieldChange("email")}
              error={errors.email}
            />

            <AuthField
              id="input-profile-phone"
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleFieldChange("phone")}
            />

            <div>
              <label
                htmlFor="input-profile-gender"
                className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider mb-1.5"
              >
                Gender
              </label>
              <select
                id="input-profile-gender"
                value={form.gender}
                onChange={handleFieldChange("gender")}
                className="w-full p-3 rounded-lg border border-stone-200 text-xs font-mono bg-stone-50 text-stone-800 focus:outline-none focus:border-amber-600 transition cursor-pointer"
              >
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <AuthField
              id="input-profile-dob"
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={handleFieldChange("dob")}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-stone-100">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <AvatarCropModal
        isOpen={Boolean(cropSource)}
        imageSrc={cropSource}
        onCancel={closeCropModal}
        onSave={handleCropSave}
      />

      <DiscardChangesDialog
        isOpen={isDiscardDialogOpen}
        onDiscard={handleDiscardChanges}
        onContinue={handleContinueEditing}
      />
    </div>
  );
}
