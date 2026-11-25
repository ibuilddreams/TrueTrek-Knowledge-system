"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, ExternalLink, Star, Trash2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { AUTH_ROLES } from "@/constants/auth";
import { portalHref } from "@/components/features/portal/shell/portalNav";
import {
  getMyInstructorFeedback,
  getMyInstructorProfile,
  updateMyInstructorProfile,
} from "@/services/instructorsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { pluralize } from "@/lib/courseOutline";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";
import InstructorFeedbackCard from "@/components/features/instructors/InstructorFeedbackCard";
import SkillsTagInput from "@/components/features/teachers/SkillsTagInput";
import AvatarCropModal from "@/components/features/profile/AvatarCropModal";

const EMPTY_FORM = {
  headline: "",
  bio: "",
  website: "",
  linkedin_url: "",
  x_url: "",
  youtube_url: "",
  intro_video_url: "",
  skills: [],
};

const URL_FIELDS = [
  { key: "website", label: "Website", placeholder: "https://yoursite.com" },
  { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/you" },
  { key: "x_url", label: "X", placeholder: "https://x.com/you" },
  { key: "youtube_url", label: "YouTube channel", placeholder: "https://youtube.com/@you" },
];

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";
const LABEL_CLASS = "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";
const ERROR_CLASS = "text-xs text-cn-p-bad mt-1";

const HEADLINE_MAX = 120;
const BIO_MAX = 4000;

function toForm(profile) {
  return {
    headline: profile.headline || "",
    bio: profile.bio || "",
    website: profile.website || "",
    linkedin_url: profile.linkedin_url || "",
    x_url: profile.x_url || "",
    youtube_url: profile.youtube_url || "",
    intro_video_url: profile.intro_video_url || "",
    skills: profile.skills || [],
  };
}

const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(value);

// Teacher portal tab: edit the public instructor profile that students see at
// /instructors/<id>, and read the feedback students have left.
export default function InstructorProfileTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const fileInputRef = useRef(null);

  const profileQuery = useQuery({
    queryKey: ["my-instructor-profile"],
    queryFn: async () => (await getMyInstructorProfile())?.data,
  });
  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    const next = toForm(profile);
    setForm(next);
    setSavedForm(next);
  }, [profile]);

  const feedbackQuery = useInfiniteQuery({
    queryKey: ["my-instructor-feedback"],
    queryFn: async ({ pageParam }) => (await getMyInstructorFeedback({ page: pageParam }))?.data,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage?.next ? pages.length + 1 : undefined),
  });
  const feedback = (feedbackQuery.data?.pages || []).flatMap((page) => page?.results || []);
  const summary = feedbackQuery.data?.pages?.[0]?.summary;

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm) || Boolean(avatarFile) || removeAvatar,
    [form, savedForm, avatarFile, removeAvatar],
  );

  const resetAvatarChanges = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Please choose an image file.");
      event.target.value = "";
      return;
    }
    setCropSource(URL.createObjectURL(file));
  };

  const closeCropModal = () => {
    setCropSource(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropSave = ({ blob, url }) => {
    setAvatarFile(blob);
    setAvatarPreview(url);
    setRemoveAvatar(false);
    closeCropModal();
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => updateMyInstructorProfile(payload),
    onSuccess: (response) => {
      toastSuccess(response?.message || "Profile updated.");
      queryClient.setQueryData(["my-instructor-profile"], response?.data);
      if (response?.data?.id) {
        queryClient.invalidateQueries({ queryKey: ["instructor", String(response.data.id)] });
      }
      // Course pages show the instructor's photo too.
      queryClient.invalidateQueries({ queryKey: ["public-course-detail"] });
      resetAvatarChanges();
      setFieldErrors({});
    },
    onError: (error) => {
      const apiErrors = error?.data?.data;
      if (apiErrors && typeof apiErrors === "object") {
        const mapped = {};
        Object.entries(apiErrors).forEach(([key, value]) => {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(mapped);
      }
      toastError(getApiErrorMessage(error, "Unable to save your profile."));
    },
  });

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setFieldErrors((previous) => ({ ...previous, [field]: null }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const errors = {};
    [...URL_FIELDS.map((field) => field.key), "intro_video_url"].forEach((key) => {
      const value = form[key].trim();
      if (value && !isHttpUrl(value)) errors[key] = "Enter a full link starting with http:// or https://";
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Multipart so the photo can travel with the text fields.
    const payload = new FormData();
    payload.append("headline", form.headline.trim());
    payload.append("bio", form.bio.trim());
    payload.append("website", form.website.trim());
    payload.append("linkedin_url", form.linkedin_url.trim());
    payload.append("x_url", form.x_url.trim());
    payload.append("youtube_url", form.youtube_url.trim());
    payload.append("intro_video_url", form.intro_video_url.trim());
    payload.append("skills", JSON.stringify(form.skills));
    if (avatarFile) payload.append("avatar", avatarFile, "avatar.jpg");
    else if (removeAvatar) payload.append("remove_avatar", "true");
    saveMutation.mutate(payload);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
        <Loader tone="cobalt" fullScreen={false} label="Loading your profile..." />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div role="alert" className="rounded-cn-p border border-cn-p-line bg-cn-p-card p-6 text-sm text-cn-p-ink-2">
        {getApiErrorMessage(profileQuery.error, "Unable to load your profile.")}{" "}
        <button type="button" onClick={() => profileQuery.refetch()} className="font-semibold text-cn-p-accent underline">
          Retry
        </button>
      </div>
    );
  }

  const isBusy = saveMutation.isPending;
  const displayedAvatar = removeAvatar ? null : avatarPreview || profile.avatar;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Public profile"
        subtitle="Everything here appears on your instructor page in the course catalog."
      />

      <section className="flex flex-col gap-5 rounded-cn-p border border-cn-p-line bg-cn-p-card p-6 sm:flex-row sm:items-center">
        <div className="shrink-0 flex flex-col items-center gap-2.5">
          {displayedAvatar ? (
            <img
              src={displayedAvatar}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-cn-p-soft"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              aria-hidden="true"
              className="w-24 h-24 rounded-full bg-cn-p-soft text-cn-p-soft-ink ring-4 ring-cn-p-soft flex items-center justify-center text-4xl font-bold"
            >
              {(profile.name || "?").trim().charAt(0).toUpperCase()}
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelected}
            disabled={isBusy}
            className="hidden"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cn-p-line bg-cn-p-page px-3 py-1.5 text-[11px] font-semibold text-cn-p-ink hover:bg-cn-p-card disabled:opacity-60 transition"
            >
              <Camera className="w-3 h-3" />
              {displayedAvatar ? "Change" : "Upload"}
            </button>
            {displayedAvatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isBusy}
                aria-label="Remove photo"
                title="Remove photo"
                className="rounded-lg border border-cn-p-line p-1.5 text-cn-p-ink-2 hover:text-cn-p-warn hover:bg-cn-p-page disabled:opacity-60 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h2 className="text-xl font-bold tracking-[-0.01em] text-cn-p-ink">
            {profile.name}
          </h2>
          <p className="text-xs text-cn-p-ink-2">
            This is how students see you. Your photo appears on your instructor page and on your
            course pages, and is the same photo as your{" "}
            <Link
              href={portalHref(AUTH_ROLES.FACULTY, "profile")}
              className="font-semibold text-cn-p-accent underline"
            >
              account profile
            </Link>
            . Save to apply changes.
          </p>
          <p className="text-xs text-cn-p-ink-2">
            {pluralize(profile.stats.students, "learner")} · {pluralize(profile.stats.courses, "published course")}
            {profile.stats.rating != null && ` · ${profile.stats.rating.toFixed(1)} rating`}
          </p>
        </div>
        {profile.is_public ? (
          <Link
            href={`${ROUTES.INSTRUCTORS}/${profile.id}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 border border-cn-p-accent text-cn-p-accent hover:bg-cn-p-accent-hover hover:text-white text-xs font-sans font-medium px-5 py-3 rounded-cn-p-sm transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View public page
          </Link>
        ) : (
          <p className="max-w-56 text-xs text-cn-p-ink-2">
            Your public page goes live once one of your courses is published.
          </p>
        )}
      </section>

      <form onSubmit={handleSubmit} className="rounded-cn-p border border-cn-p-line bg-cn-p-card p-6 md:p-8 space-y-5">
        <div>
          <label className={LABEL_CLASS} htmlFor="instructor-headline">Headline</label>
          <input
            id="instructor-headline"
            type="text"
            value={form.headline}
            onChange={updateField("headline")}
            disabled={isBusy}
            maxLength={HEADLINE_MAX}
            placeholder="e.g. Classical education specialist and curriculum designer"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.headline && <p className={ERROR_CLASS}>{fieldErrors.headline}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS} htmlFor="instructor-bio">About you</label>
          <textarea
            id="instructor-bio"
            value={form.bio}
            onChange={updateField("bio")}
            disabled={isBusy}
            maxLength={BIO_MAX}
            rows={7}
            placeholder="Your background, teaching approach and what students can expect."
            className={`${FIELD_CLASS} resize-y`}
          />
          <p className="mt-1 text-right text-[11px] text-cn-p-ink-2">
            {form.bio.length}/{BIO_MAX}
          </p>
          {fieldErrors.bio && <p className={ERROR_CLASS}>{fieldErrors.bio}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Skills I teach</label>
          <SkillsTagInput
            values={form.skills}
            onChange={(skills) => {
              setForm((previous) => ({ ...previous, skills }));
              setFieldErrors((previous) => ({ ...previous, skills: null }));
            }}
            disabled={isBusy}
            error={fieldErrors.skills}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {URL_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={LABEL_CLASS} htmlFor={`instructor-${key}`}>{label}</label>
              <input
                id={`instructor-${key}`}
                type="url"
                value={form[key]}
                onChange={updateField(key)}
                disabled={isBusy}
                placeholder={placeholder}
                className={FIELD_CLASS}
                autoComplete="off"
              />
              {fieldErrors[key] && <p className={ERROR_CLASS}>{fieldErrors[key]}</p>}
            </div>
          ))}
        </div>

        <div>
          <label className={LABEL_CLASS} htmlFor="instructor-intro-video">Introduction video (YouTube or Vimeo link)</label>
          <input
            id="instructor-intro-video"
            type="url"
            value={form.intro_video_url}
            onChange={updateField("intro_video_url")}
            disabled={isBusy}
            placeholder="https://www.youtube.com/watch?v=…"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.intro_video_url && <p className={ERROR_CLASS}>{fieldErrors.intro_video_url}</p>}
        </div>

        <div className="flex justify-end pt-2 border-t border-cn-p-line">
          <button
            type="submit"
            disabled={isBusy || !isDirty}
            className="mt-5 px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center gap-2"
          >
            {isBusy ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save profile
              </>
            )}
          </button>
        </div>
      </form>

      <section aria-labelledby="my-feedback-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="my-feedback-heading"
              className="text-xl font-bold tracking-[-0.01em] text-cn-p-ink"
            >
              Student feedback
            </h2>
            <p className="mt-1 text-sm text-cn-p-ink-2">
              What students enrolled in your courses have shared.
            </p>
          </div>
          {summary?.rating != null && (
            <p className="inline-flex items-center gap-2 text-sm text-cn-p-ink">
              <Star className="w-4 h-4 fill-cn-p-accent text-cn-p-soft-ink" aria-hidden="true" />
              <span className="font-semibold">{summary.rating.toFixed(1)}</span>
              <span className="text-cn-p-ink-2">· {pluralize(summary.reviews, "review")}</span>
            </p>
          )}
        </div>

        {feedbackQuery.isLoading ? (
          <p className="text-sm text-cn-p-ink-2" aria-busy="true">Loading feedback…</p>
        ) : feedbackQuery.isError ? (
          <p className="text-sm text-cn-p-ink-2">
            Couldn&apos;t load feedback.{" "}
            <button type="button" onClick={() => feedbackQuery.refetch()} className="font-semibold text-cn-p-accent underline">
              Retry
            </button>
          </p>
        ) : feedback.length === 0 ? (
          <p className="rounded-cn-p border border-dashed border-cn-p-line bg-cn-p-card px-6 py-5 text-sm text-cn-p-ink-2">
            No feedback yet. Students enrolled in your courses can leave it from your public page.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {feedback.map((item) => (
                <InstructorFeedbackCard key={item.id} feedback={item} tone="cobalt" />
              ))}
            </ul>
            {feedbackQuery.hasNextPage && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => feedbackQuery.fetchNextPage()}
                  disabled={feedbackQuery.isFetchingNextPage}
                  className="text-xs font-sans font-medium text-cn-p-accent hover:text-cn-p-accent-hover disabled:opacity-60 transition"
                >
                  {feedbackQuery.isFetchingNextPage ? "Loading..." : "Load more feedback"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <AvatarCropModal
        isOpen={Boolean(cropSource)}
        imageSrc={cropSource}
        onCancel={closeCropModal}
        onSave={handleCropSave}
      />
    </div>
  );
}
