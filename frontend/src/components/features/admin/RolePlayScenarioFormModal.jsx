"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, Theater, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  createRolePlayScenario,
  updateRolePlayScenario,
} from "@/services/wargamerService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

// Mirrors wargamer.models.RolePlayScenario's choice sets.
const RELATIONSHIP_OPTIONS = [
  { value: "FAMILY", label: "Family" },
  { value: "FRIENDS", label: "Friends" },
  { value: "COMMUNITY", label: "Community" },
];

const PRESSURE_OPTIONS = [
  { value: "FINANCIAL", label: "Money" },
  { value: "ACCESS", label: "Access" },
  { value: "TIME", label: "Time & Energy" },
];

const PERSONA_OPTIONS = [
  { value: "GUILT_TRIP", label: "Guilt-tripping" },
  { value: "AGGRESSIVE", label: "Aggressive" },
  { value: "PASSIVE_AGGRESSIVE", label: "Passive-aggressive" },
  { value: "PERSISTENT", label: "Persistent negotiator" },
];

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const STATUS_OPTIONS = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

const INITIAL_FORM = {
  code: "",
  title: "",
  module_code: "LS-302",
  module_title: 'Tactical Wargamer: The "No" Muscle',
  relationship: "FAMILY",
  pressure_type: "FINANCIAL",
  key_skill: "",
  counterpart_role: "",
  setup: "",
  opening_message: "",
  exercise: "",
  ideal_acknowledge: "",
  ideal_boundary: "",
  ideal_pivot: "",
  persona: "GUILT_TRIP",
  difficulty: "MEDIUM",
  points_reward: "50",
  order: "0",
  status: "PUBLISHED",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

const HINT_CLASS = "text-[11px] font-light text-muted mt-1.5";

function sanitizeIntegerInput(rawValue) {
  return rawValue.replace(/[^0-9]/g, "");
}

export default function RolePlayScenarioFormModal({ isOpen, onClose, onSaved, scenario }) {
  const isEditMode = Boolean(scenario);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: (payload) => createRolePlayScenario(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-roleplay-scenarios"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRolePlayScenario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-roleplay-scenarios"] }),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setForm(
      scenario
        ? {
            code: scenario.code || "",
            title: scenario.title || "",
            module_code: scenario.module_code || "LS-302",
            module_title: scenario.module_title || "",
            relationship: scenario.relationship || "FAMILY",
            pressure_type: scenario.pressure_type || "FINANCIAL",
            key_skill: scenario.key_skill || "",
            counterpart_role: scenario.counterpart_role || "",
            setup: scenario.setup || "",
            opening_message: scenario.opening_message || "",
            exercise: scenario.exercise || "",
            ideal_acknowledge: scenario.ideal_acknowledge || "",
            ideal_boundary: scenario.ideal_boundary || "",
            ideal_pivot: scenario.ideal_pivot || "",
            persona: scenario.persona || "GUILT_TRIP",
            difficulty: scenario.difficulty || "MEDIUM",
            points_reward: String(scenario.points_reward ?? ""),
            order: String(scenario.order ?? "0"),
            status: scenario.status || "PUBLISHED",
          }
        : INITIAL_FORM,
    );
  }, [isOpen, scenario]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateIntegerField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: sanitizeIntegerInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
    );
    const points = Number(form.points_reward);

    const errors = {};
    if (!trimmed.code) errors.code = "A scenario code is required.";
    if (!trimmed.title) errors.title = "Title is required.";
    if (!trimmed.key_skill) errors.key_skill = "Name the skill this trains.";
    if (!trimmed.counterpart_role) {
      errors.counterpart_role = "Say who the AI is playing.";
    }
    if (!trimmed.setup) errors.setup = "The situation is required.";
    if (!trimmed.opening_message) {
      errors.opening_message = "The opening line is required — it starts the scene.";
    }
    if (!trimmed.exercise) errors.exercise = "Say what the athlete has to pull off.";
    if (!Number.isFinite(points) || points < 1) {
      errors.points_reward = "A scenario must be worth at least 1 point.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      ...trimmed,
      points_reward: points,
      order: Number(form.order) || 0,
    };

    try {
      const response = isEditMode
        ? await updateMutation.mutateAsync({ id: scenario.id, payload })
        : await createMutation.mutateAsync(payload);
      toastSuccess(
        response?.message || `Scenario ${isEditMode ? "updated" : "created"} successfully.`,
      );
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
      toastError(
        getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} scenario.`),
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : Theater}
      title={isEditMode ? "Edit Scenario" : "Add Scenario"}
      subtitle={
        isEditMode
          ? "Update this situation's copy, persona and reward."
          : "Write a new pressure situation for students to practise against."
      }
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>Code</label>
            <input
              type="text"
              value={form.code}
              onChange={updateField("code")}
              disabled={isSubmitting}
              placeholder="LS-302-S4"
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.code && <p className={ERROR_CLASS}>{fieldErrors.code}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={updateField("title")}
              disabled={isSubmitting}
              placeholder='e.g. The Financial "Investment"'
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Relationship</label>
            <select
              value={form.relationship}
              onChange={updateField("relationship")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Pressure Type</label>
            <select
              value={form.pressure_type}
              onChange={updateField("pressure_type")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {PRESSURE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Key Skill</label>
            <input
              type="text"
              value={form.key_skill}
              onChange={updateField("key_skill")}
              disabled={isSubmitting}
              placeholder="e.g. Financial boundaries"
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.key_skill && <p className={ERROR_CLASS}>{fieldErrors.key_skill}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Who the AI Plays</label>
            <input
              type="text"
              value={form.counterpart_role}
              onChange={updateField("counterpart_role")}
              disabled={isSubmitting}
              placeholder="e.g. Your older cousin"
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.counterpart_role && (
              <p className={ERROR_CLASS}>{fieldErrors.counterpart_role}</p>
            )}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>The Situation</label>
          <textarea
            value={form.setup}
            onChange={updateField("setup")}
            disabled={isSubmitting}
            placeholder="Written to the student in the second person — what is happening to them right now."
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.setup && <p className={ERROR_CLASS}>{fieldErrors.setup}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Opening Line</label>
          <textarea
            value={form.opening_message}
            onChange={updateField("opening_message")}
            disabled={isSubmitting}
            placeholder="The exact first thing the other person says."
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          <p className={HINT_CLASS}>
            Written, not generated — every student meets the same pitch, and the scene opens
            instantly with no AI call.
          </p>
          {fieldErrors.opening_message && (
            <p className={ERROR_CLASS}>{fieldErrors.opening_message}</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>What the Athlete Must Pull Off</label>
          <textarea
            value={form.exercise}
            onChange={updateField("exercise")}
            disabled={isSubmitting}
            placeholder="e.g. Decline the investment without insulting their business sense."
            rows={2}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.exercise && <p className={ERROR_CLASS}>{fieldErrors.exercise}</p>}
        </div>

        <div className="rounded-xl border border-line bg-porcelain p-4 space-y-4">
          <div>
            <p className="text-xs font-sans text-ink uppercase tracking-widest font-semibold">
              The A.B.P. model answer
            </p>
            <p className={HINT_CLASS}>
              Shown to the student only after their run is scored, and used by the grader as the
              reference it measures them against. Never sent to the character they argue with.
            </p>
          </div>

          <div>
            <label className={LABEL_CLASS}>Acknowledge</label>
            <textarea
              value={form.ideal_acknowledge}
              onChange={updateField("ideal_acknowledge")}
              disabled={isSubmitting}
              rows={2}
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Boundary</label>
            <textarea
              value={form.ideal_boundary}
              onChange={updateField("ideal_boundary")}
              disabled={isSubmitting}
              rows={2}
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Pivot</label>
            <textarea
              value={form.ideal_pivot}
              onChange={updateField("ideal_pivot")}
              disabled={isSubmitting}
              rows={2}
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>AI Persona</label>
            <select
              value={form.persona}
              onChange={updateField("persona")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {PERSONA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className={HINT_CLASS}>
              Guilt-tripping is the default: every situation in this module turns on emotional
              debt, and a persona that is persistent without being hostile keeps the exercise
              realistic.
            </p>
          </div>

          <div>
            <label className={LABEL_CLASS}>Difficulty</label>
            <select
              value={form.difficulty}
              onChange={updateField("difficulty")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>Points Reward</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.points_reward}
              onChange={updateIntegerField("points_reward")}
              disabled={isSubmitting}
              placeholder="50"
              className={FIELD_CLASS}
            />
            {fieldErrors.points_reward && (
              <p className={ERROR_CLASS}>{fieldErrors.points_reward}</p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Sort Order</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.order}
              onChange={updateIntegerField("order")}
              disabled={isSubmitting}
              placeholder="0"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={form.status}
              onChange={updateField("status")}
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
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-porcelain text-ink text-sm font-semibold font-mono rounded-full tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-line shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
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
                {isEditMode ? "Update Scenario" : "Create Scenario"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
