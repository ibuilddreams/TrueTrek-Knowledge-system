"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { getProfile, updateProfile } from "@/services/profileService";
import { toastError, toastSuccess } from "@/lib/toast";
import { getInitials } from "@/lib/initials";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/ui/Loader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalPageHead,
  PortalPill,
} from "@/components/features/portal/shell/PortalUI";
import {
  ERROR_CLASS,
  FIELD_CLASS,
  HINT_CLASS,
  LABEL_CLASS,
} from "@/components/features/teachers/onboarding/fieldStyles";
import AvatarCropModal from "./AvatarCropModal";

/**
 * The design's `profilePage(role)` — the account card on the left, the forms
 * on the right (`.g12`), rendered inside the portal shell for all three roles.
 *
 * Two of the design's cards are deliberately not built. Its "Gender" select
 * has no field behind it (`users.UserProfile` carries avatar, bio, date of
 * birth, phone, address, city, country and website, and nothing else), and its
 * "Notifications" card has no preferences endpoint at all — three checkboxes
 * that save nowhere are worse than no checkboxes. Its "Password" card is kept,
 * because the mechanism this app really has for a signed-in user is the
 * emailed reset link, so the card says so and sends them to it rather than
 * offering a current/new pair nothing would accept.
 */
const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
};

function mapProfileToForm(profile) {
  return {
    fullName: profile?.full_name || "",
    email: profile?.email || "",
    phone: profile?.profile?.phone_number || "",
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
  const { updateUserName } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [initialAvatarPreview, setInitialAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [roleLabel, setRoleLabel] = useState("");
  const [username, setUsername] = useState("");
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
        setRoleLabel(profile?.role || "");
        setUsername(profile?.username || "");
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

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCropSource(URL.createObjectURL(file));
  };

  const closeCropModal = () => {
    setCropSource(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropSave = ({ blob, url }) => {
    setAvatarPreview(url);
    setAvatarFile(blob);
    closeCropModal();
  };

  // The portal's rail is always on screen now, so there is nothing to
  // navigate "back" to — discarding puts the form back as it was loaded and
  // leaves the reader where they are.
  const handleDiscardChanges = () => {
    setForm(initialForm);
    setErrors({});
    setAvatarPreview(initialAvatarPreview);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      const formData = new FormData();
      formData.append("full_name", form.fullName.trim());
      formData.append("email", form.email.trim());
      formData.append("phone_number", form.phone.trim());
      formData.append("date_of_birth", form.dob || "");
      if (avatarFile) formData.append("avatar", avatarFile, "avatar.jpg");

      const response = await updateProfile(formData);
      const profile = response?.data;
      const mapped = profile ? mapProfileToForm(profile) : form;
      const nextAvatarPreview = profile?.profile?.avatar ?? avatarPreview;
      setForm(mapped);
      setInitialForm(mapped);
      setAvatarPreview(nextAvatarPreview);
      setInitialAvatarPreview(nextAvatarPreview);
      setAvatarFile(null);
      setRoleLabel(profile?.role || roleLabel);
      updateUserName(mapped.fullName);
      toastSuccess("Profile updated successfully.");
    } catch (error) {
      toastError(error?.message || "Unable to update your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PortalCard className="grid min-h-[320px] place-items-center">
        <Loader fullScreen={false} tone="cobalt" label="Loading your profile..." />
      </PortalCard>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Profile & settings"
        subtitle="Your account details and how Cool Nerdz contacts you."
      />

      {/* The design's `.g12` — a 1fr account card beside a 2fr column of
          forms, collapsing to one column on a narrow screen. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <PortalCard className="flex flex-col items-center gap-3 p-6 text-center">
          <span className="grid h-[88px] w-[88px] flex-none place-items-center overflow-hidden rounded-full bg-cn-p-soft text-[28px] font-bold text-cn-p-soft-ink">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(form.fullName)
            )}
          </span>

          <b className="w-full truncate text-lg text-cn-p-ink">
            {form.fullName || "Your name"}
          </b>
          <span className="w-full truncate text-sm text-cn-p-ink-2">
            {form.email}
          </span>
          {roleLabel && <PortalPill tone="blue">{roleLabel}</PortalPill>}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <PortalButton
            variant="sec"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload aria-hidden="true" className="h-4 w-4" />
            Change photo
          </PortalButton>
        </PortalCard>

        <div className="flex flex-col gap-5">
          <PortalCard className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-cn-p-ink">Basic information</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="input-profile-username" className={LABEL_CLASS}>
                    Username
                  </label>
                  <input
                    id="input-profile-username"
                    type="text"
                    value={username}
                    readOnly
                    tabIndex={-1}
                    className={`${FIELD_CLASS} cursor-not-allowed bg-cn-p-page text-cn-p-ink-2`}
                  />
                  <p className={HINT_CLASS}>Username cannot be changed.</p>
                </div>

                <div>
                  <label htmlFor="input-profile-full-name" className={LABEL_CLASS}>
                    Full name <span className="text-cn-p-warn">*</span>
                  </label>
                  <input
                    id="input-profile-full-name"
                    type="text"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={handleFieldChange("fullName")}
                    className={FIELD_CLASS}
                  />
                  {errors.fullName && <p className={ERROR_CLASS}>{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="input-profile-email" className={LABEL_CLASS}>
                    Email address <span className="text-cn-p-warn">*</span>
                  </label>
                  <input
                    id="input-profile-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleFieldChange("email")}
                    className={FIELD_CLASS}
                  />
                  {errors.email && <p className={ERROR_CLASS}>{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="input-profile-phone" className={LABEL_CLASS}>
                    Phone number
                  </label>
                  <input
                    id="input-profile-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 555 000 0000"
                    value={form.phone}
                    onChange={handleFieldChange("phone")}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="input-profile-dob" className={LABEL_CLASS}>
                    Date of birth
                  </label>
                  <input
                    id="input-profile-dob"
                    type="date"
                    value={form.dob}
                    onChange={handleFieldChange("dob")}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                {hasUnsavedChanges && (
                  <PortalButton
                    variant="sec"
                    onClick={() => setIsDiscardDialogOpen(true)}
                    disabled={isSubmitting}
                  >
                    Discard changes
                  </PortalButton>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-cn-p-sm bg-cn-p-accent px-[18px] text-sm font-semibold whitespace-nowrap text-white transition-colors duration-150 hover:bg-cn-p-accent-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting && (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </PortalCard>

          <PortalCard className="flex flex-col gap-3 p-6">
            <h3 className="text-lg font-bold text-cn-p-ink">Password</h3>
            <p className="max-w-[70ch] text-sm text-cn-p-ink-2">
              Your password is changed through a link emailed to{" "}
              <span className="font-semibold text-cn-p-ink">
                {form.email || "your address"}
              </span>
              , so nobody using your computer can change it without opening your
              inbox.
            </p>
            <div className="flex justify-end">
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-[18px] text-sm font-semibold whitespace-nowrap text-cn-p-ink no-underline transition-colors duration-150 hover:border-cn-p-ink"
              >
                <KeyRound aria-hidden="true" className="h-4 w-4" />
                Email me a reset link
              </Link>
            </div>
          </PortalCard>
        </div>
      </div>

      <AvatarCropModal
        isOpen={Boolean(cropSource)}
        imageSrc={cropSource}
        onCancel={closeCropModal}
        onSave={handleCropSave}
      />

      <ConfirmDialog
        isOpen={isDiscardDialogOpen}
        onClose={() => setIsDiscardDialogOpen(false)}
        onConfirm={handleDiscardChanges}
        title="Discard unsaved changes?"
        message="The details you have edited will go back to what they were when this page loaded."
        confirmLabel="Discard changes"
      />
    </div>
  );
}
