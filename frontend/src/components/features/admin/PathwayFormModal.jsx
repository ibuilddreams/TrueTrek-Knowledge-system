"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, Route, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import LearningOutcomesField, {
  cleanLearningOutcomes,
  MAX_LEARNING_OUTCOMES,
} from "@/components/features/courses/LearningOutcomesField";
import MultiSelect from "@/components/ui/MultiSelect";
import {
  createPathway,
  getPathwayAudiences,
  getPathwayById,
  updatePathway,
} from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const INITIAL_FORM = {
  name: "",
  summary: "",
  description: "",
  purpose: "",
  base_price: "0",
  status: "DRAFT",
  difficulty: "BEGINNER",
  duration_weeks: "0",
  audience_slugs: [],
};

// The three bullet lists shown on the public pathway page, kept outside `form`
// because each is an array the LearningOutcomesField editor mutates in place.
const INITIAL_BULLETS = {
  learning_outcomes: [],
  who_is_for: [],
  prerequisites: [],
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function sanitizeAmountInput(rawValue) {
  const digitsAndDot = rawValue.replace(/[^0-9.]/g, "");
  const [integerPart, ...decimalParts] = digitsAndDot.split(".");
  if (decimalParts.length === 0) return integerPart;
  return `${integerPart}.${decimalParts.join("").slice(0, 2)}`;
}

// A labelled group of fields, so the form reads as three short steps rather
// than one long column of inputs.
function FormSection({ title, description, children }) {
  return (
    <section className="space-y-4">
      <div className="border-b border-line pb-2.5">
        <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-ink">
          {title}
        </h4>
        {description && <p className="mt-1 text-[11px] font-mono text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// Frames one bullet-list editor with its own heading, a used/limit counter and
// an explicit empty state — without it an unfilled list is just a lone
// "Add point" link, which reads as broken rather than optional.
function BulletCard({ title, description, count, error, children }) {
  return (
    <div
      className={`rounded-2xl border bg-porcelain/40 p-4 transition-colors ${
        error ? "border-red-300" : "border-line"
      }`}
    >
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-sans font-semibold uppercase tracking-widest text-ink">
            {title}
          </p>
          <p className="mt-1 text-[11px] font-mono text-muted">{description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-mono tabular-nums text-muted">
          {count}/{MAX_LEARNING_OUTCOMES}
        </span>
      </div>

      {count === 0 && (
        <p className="mb-2.5 rounded-lg border border-dashed border-line px-3 py-2.5 text-[11px] font-mono text-muted">
          Nothing added yet — this section stays hidden on the public page.
        </p>
      )}

      {children}
    </div>
  );
}

export default function PathwayFormModal({ isOpen, onClose, onSaved, pathway }) {
  const isEditMode = Boolean(pathway);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [bullets, setBullets] = useState(INITIAL_BULLETS);
  const [fieldErrors, setFieldErrors] = useState({});
  // The audience cards a pathway can be filed under. Fixed server-side, so it
  // is cached for the session rather than refetched per modal open.
  const audienceQuery = useQuery({
    queryKey: ["pathway-audiences"],
    queryFn: async () => (await getPathwayAudiences()).data || [],
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
  });

  const audienceOptions = (audienceQuery.data || []).map((audience) => ({
    value: audience.slug,
    label: audience.name,
  }));

  // Changing which audiences a pathway serves changes what every audience page
  // lists, so those caches go stale with it.
  const invalidateAudiencePages = () => {
    queryClient.invalidateQueries({ queryKey: ["audience-pathways"] });
    queryClient.invalidateQueries({ queryKey: ["audience-courses"] });
    queryClient.invalidateQueries({ queryKey: ["public-pathways"] });
  };

  const pathwayDetailQuery = useQuery({
    queryKey: ["pathway", pathway?.id],
    queryFn: async () => {
      const response = await getPathwayById(pathway.id);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(pathway?.id),
  });

  const createPathwayMutation = useMutation({
    mutationFn: (payload) => createPathway(payload),
    onSuccess: () => {
      invalidateAudiencePages();
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
    },
  });

  const updatePathwayMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePathway(id, payload),
    onSuccess: () => {
      invalidateAudiencePages();
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
      queryClient.invalidateQueries({ queryKey: ["pathway", pathway?.id] });
    },
  });

  const isSubmitting = createPathwayMutation.isPending || updatePathwayMutation.isPending;
  const isLoadingPathway = isEditMode && pathwayDetailQuery.isLoading;
  const isBusy = isSubmitting || isLoadingPathway || (isEditMode && pathwayDetailQuery.isError);

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setBullets(INITIAL_BULLETS);
    setFieldErrors({});
  }, [isOpen]);

  useEffect(() => {
    const detail = pathwayDetailQuery.data;
    if (!isOpen || !isEditMode || !detail) return;

    setForm({
      name: detail.name || "",
      summary: detail.summary || "",
      description: detail.description || "",
      purpose: detail.purpose || "",
      base_price: String(detail.base_price ?? 0),
      status: detail.status || "DRAFT",
      difficulty: detail.difficulty || "BEGINNER",
      duration_weeks: String(detail.duration_weeks ?? 0),
      audience_slugs: (detail.audiences || []).map((audience) => audience.slug),
    });
    setBullets({
      learning_outcomes: detail.learning_outcomes || [],
      who_is_for: detail.who_is_for || [],
      prerequisites: detail.prerequisites || [],
    });
  }, [isOpen, isEditMode, pathwayDetailQuery.data]);

  useEffect(() => {
    if (!isOpen || !pathwayDetailQuery.isError) return;
    toastError(getApiErrorMessage(pathwayDetailQuery.error, "Unable to load pathway details."));
  }, [isOpen, pathwayDetailQuery.isError, pathwayDetailQuery.error]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateBullets = (field) => (next) => {
    setBullets((prev) => ({ ...prev, [field]: next }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleDurationChange = (event) => {
    setForm((prev) => ({
      ...prev,
      duration_weeks: event.target.value.replace(/[^0-9]/g, ""),
    }));
    setFieldErrors((prev) => ({ ...prev, duration_weeks: null }));
  };

  const handleAmountChange = (event) => {
    setForm((prev) => ({ ...prev, base_price: sanitizeAmountInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, base_price: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isBusy) return;

    const name = form.name.trim();
    const summary = form.summary.trim();
    const basePrice = Number(form.base_price);

    const durationWeeks = Number(form.duration_weeks || 0);

    const errors = {};
    if (!name) errors.name = "Name is required.";
    if (!summary) errors.summary = "Summary is required.";
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      errors.base_price = "Base price must be a positive number.";
    }
    if (!Number.isInteger(durationWeeks) || durationWeeks < 0) {
      errors.duration_weeks = "Duration must be a whole number of weeks.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name,
      summary,
      description: form.description.trim(),
      purpose: form.purpose.trim(),
      base_price: basePrice,
      status: form.status,
      difficulty: form.difficulty,
      duration_weeks: durationWeeks,
      learning_outcomes: cleanLearningOutcomes(bullets.learning_outcomes),
      who_is_for: cleanLearningOutcomes(bullets.who_is_for),
      prerequisites: cleanLearningOutcomes(bullets.prerequisites),
    };

    // Only sent once the picker has actually loaded. If the audience list
    // failed to load, the field was never editable, and omitting it leaves the
    // pathway's existing audiences untouched instead of clearing them.
    if (audienceQuery.isSuccess) {
      payload.audience_slugs = form.audience_slugs;
    }

    try {
      const response = isEditMode
        ? await updatePathwayMutation.mutateAsync({ id: pathway.id, payload })
        : await createPathwayMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Pathway ${isEditMode ? "updated" : "created"} successfully.`);
      onSaved?.();
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
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} pathway.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : Route}
      title={isEditMode ? "Edit Pathway" : "Add Pathway"}
      subtitle={
        isEditMode
          ? "Update this pathway and what its public page shows."
          : "Name it, price it, then fill in the public page."
      }
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <FormSection
          title="Pathway basics"
          description="Name and blurb used across the catalogue, cards and page header."
        >
          <div>
            <label className={LABEL_CLASS}>
              Name <span className="text-clay">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={updateField("name")}
              disabled={isBusy}
              placeholder="e.g. Elite Athlete Business Pathway"
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.name && <p className={ERROR_CLASS}>{fieldErrors.name}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>
              Summary <span className="text-clay">*</span>
            </label>
            <input
              type="text"
              value={form.summary}
              onChange={updateField("summary")}
              disabled={isBusy}
              placeholder="One line shown on pathway cards and under the title"
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.summary && <p className={ERROR_CLASS}>{fieldErrors.summary}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Description</label>
            <textarea
              value={form.description}
              onChange={updateField("description")}
              disabled={isBusy}
              placeholder="The longer explanation shown under “Why this pathway exists”"
              rows={3}
              className={`${FIELD_CLASS} resize-none`}
            />
            {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
          </div>
        </FormSection>

        <FormSection
          title="Audience cards"
          description="Which audience pages list this pathway. A pathway can serve several audiences at once; leave it empty to keep it off every audience page."
        >
          <MultiSelect
            size="lg"
            label="Audiences"
            placeholder="Select audiences"
            searchPlaceholder="Search audiences..."
            options={audienceOptions}
            values={form.audience_slugs}
            onChange={(slugs) => {
              setForm((prev) => ({ ...prev, audience_slugs: slugs }));
              setFieldErrors((prev) => ({ ...prev, audience_slugs: null }));
            }}
            loading={audienceQuery.isPending}
            disabled={isBusy || !audienceQuery.isSuccess}
            emptyLabel="No audiences found."
          />
          {fieldErrors.audience_slugs && (
            <p className={ERROR_CLASS}>{fieldErrors.audience_slugs}</p>
          )}
          {audienceQuery.isError && (
            <p role="alert" className={ERROR_CLASS}>
              Unable to load audiences — this pathway&apos;s existing audiences
              will be left unchanged.{" "}
              <button
                type="button"
                onClick={() => audienceQuery.refetch()}
                className="underline underline-offset-2"
              >
                Try again
              </button>
            </p>
          )}
          {isEditMode && pathwayDetailQuery.isError && (
            <p role="alert" className={ERROR_CLASS}>
              Unable to load this pathway.{" "}
              <button
                type="button"
                onClick={() => pathwayDetailQuery.refetch()}
                className="underline underline-offset-2"
              >
                Retry
              </button>
            </p>
          )}
        </FormSection>

        <FormSection
          title="Pricing & availability"
          description="Only PUBLISHED pathways appear on the public site."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Base price ($)</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.base_price}
                onChange={handleAmountChange}
                disabled={isBusy}
                placeholder="0.00"
                className={FIELD_CLASS}
              />
              {fieldErrors.base_price && <p className={ERROR_CLASS}>{fieldErrors.base_price}</p>}
            </div>

            <div>
              <label className={LABEL_CLASS}>Status</label>
              <select
                value={form.status}
                onChange={updateField("status")}
                disabled={isBusy}
                className={FIELD_CLASS}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.status && <p className={ERROR_CLASS}>{fieldErrors.status}</p>}
            </div>

            <div>
              <label className={LABEL_CLASS}>Difficulty</label>
              <select
                value={form.difficulty}
                onChange={updateField("difficulty")}
                disabled={isBusy}
                className={FIELD_CLASS}
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.difficulty && <p className={ERROR_CLASS}>{fieldErrors.difficulty}</p>}
            </div>

            <div>
              <label className={LABEL_CLASS}>Duration (weeks)</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.duration_weeks}
                onChange={handleDurationChange}
                disabled={isBusy}
                placeholder="0"
                className={FIELD_CLASS}
              />
              <p className="mt-1 text-[11px] font-mono text-muted">
                Leave at 0 to show “Self-paced” instead.
              </p>
              {fieldErrors.duration_weeks && (
                <p className={ERROR_CLASS}>{fieldErrors.duration_weeks}</p>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Public page content"
          description="Everything below is optional — each section is hidden on the pathway page until it has content."
        >
          <div>
            <label className={LABEL_CLASS}>Purpose</label>
            <textarea
              value={form.purpose}
              onChange={updateField("purpose")}
              disabled={isBusy}
              placeholder="Why this pathway exists and who it was built for"
              rows={3}
              className={`${FIELD_CLASS} resize-none`}
            />
            {fieldErrors.purpose && <p className={ERROR_CLASS}>{fieldErrors.purpose}</p>}
          </div>

          <BulletCard
            title="What you'll learn"
            description="Key takeaways, shown first on the pathway page."
            count={bullets.learning_outcomes.length}
            error={fieldErrors.learning_outcomes}
          >
            <LearningOutcomesField
              values={bullets.learning_outcomes}
              onChange={updateBullets("learning_outcomes")}
              disabled={isBusy}
              error={fieldErrors.learning_outcomes}
              label={null}
              hint={null}
              placeholderExample="Read and redline an NIL term sheet"
            />
          </BulletCard>

          <BulletCard
            title="Who this pathway is for"
            description="The profiles this pathway was designed around."
            count={bullets.who_is_for.length}
            error={fieldErrors.who_is_for}
          >
            <LearningOutcomesField
              values={bullets.who_is_for}
              onChange={updateBullets("who_is_for")}
              disabled={isBusy}
              error={fieldErrors.who_is_for}
              label={null}
              hint={null}
              placeholderExample="Student-athletes entering their junior year"
            />
          </BulletCard>

          <BulletCard
            title="Before you start"
            description="What a student should already have in place."
            count={bullets.prerequisites.length}
            error={fieldErrors.prerequisites}
          >
            <LearningOutcomesField
              values={bullets.prerequisites}
              onChange={updateBullets("prerequisites")}
              disabled={isBusy}
              error={fieldErrors.prerequisites}
              label={null}
              hint={null}
              placeholderExample="Completed the Tier 1 orientation pathway"
            />
          </BulletCard>
        </FormSection>

        {/* Stays in reach while the form scrolls. */}
        <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-sm sm:-mx-7 sm:-mb-7 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="px-4 py-3 bg-transparent hover:bg-porcelain text-ink text-sm font-semibold font-mono rounded-full tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-line shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isBusy}
            className="px-6 py-3 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper text-sm font-semibold font-mono rounded-full tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Update Pathway" : "Create Pathway"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
