"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import MultiSelect from "@/components/ui/MultiSelect";
import { getCategories } from "@/services/categoriesService";
import { getTeachers } from "@/services/teachersService";
import { getAdminTiers } from "@/services/tiersService";
import {
  startCourseGeneration,
  getCourseGeneration,
  cancelCourseGeneration,
  retryCourseGeneration,
} from "@/services/aiCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { sanitizeAmountInput, formatAmountOnBlur } from "@/lib/amountInput";
import { toastError, toastSuccess } from "@/lib/toast";

const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const STEPS = [
  { key: 1, label: "Basics" },
  { key: 2, label: "Context" },
  { key: 3, label: "Structure" },
];

// The fields each step owns — used to jump the wizard back to whichever step a
// server-side validation error actually belongs to, since a single flat error
// object can name a field from any of the three steps.
const STEP_FIELDS = {
  1: ["title", "description", "category", "difficulty", "instructors", "amount"],
  2: ["target_audience", "objectives", "tier"],
  3: [
    "modules_count",
    "lessons_per_module",
    "include_quizzes",
    "questions_per_quiz",
    "include_assignments",
    "weeks_between_modules",
    "additional_instructions",
  ],
};

const INITIAL_FORM = {
  title: "",
  description: "",
  category: "",
  difficulty: "BEGINNER",
  amount: "0",
  target_audience: "",
  objectives: "",
  tier: "",
  modules_count: "6",
  lessons_per_module: "4",
  include_quizzes: true,
  questions_per_quiz: "5",
  include_assignments: true,
  weeks_between_modules: "2",
  additional_instructions: "",
};

const TERMINAL_STATUSES = ["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"];

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[10px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

function formatElapsed(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {STEPS.map((item, index) => (
        <div key={item.key} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${
              step === item.key
                ? "bg-amber-700 text-white"
                : step > item.key
                  ? "bg-amber-600/20 text-amber-800"
                  : "bg-stone-100 text-stone-400"
            }`}
          >
            {item.key}
          </div>
          <span
            className={`text-[10px] font-mono uppercase tracking-wider ${
              step === item.key ? "text-stone-800 font-semibold" : "text-stone-400"
            }`}
          >
            {item.label}
          </span>
          {index < STEPS.length - 1 && <div className="w-6 h-px bg-stone-200" />}
        </div>
      ))}
    </div>
  );
}

export default function AiCourseModal({ isOpen, onClose, onSaved, onReviewCourse }) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState("form"); // "form" | "generating" | "result"
  const [jobId, setJobId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [displayProgress, setDisplayProgress] = useState(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const savedRef = useRef(false);
  const generationStartRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // Skip the reset while a generation is still in flight, so "Hide" (which
    // closes the modal without cancelling the job) can be undone by reopening
    // it — otherwise the poll state and job_id would be wiped and the admin
    // could never see the result of a generation they didn't explicitly cancel.
    if (phase === "generating") return;
    setStep(1);
    setPhase("form");
    setJobId(null);
    setForm(INITIAL_FORM);
    setSelectedInstructorIds([]);
    setFieldErrors({});
    savedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories({ pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });

  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const response = await getTeachers();
      return response?.data?.users || [];
    },
    enabled: isOpen,
  });

  const tiersQuery = useQuery({
    queryKey: ["tiers", "aiCourseModal"],
    queryFn: async () => {
      const response = await getAdminTiers({ pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });

  const categories = categoriesQuery.data || [];
  const teachers = teachersQuery.data || [];
  const tiers = tiersQuery.data || [];
  const isLoadingOptions = categoriesQuery.isLoading || teachersQuery.isLoading;

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const instructorOptions = teachers.map((teacher) => ({
    value: teacher.id,
    label: teacher.full_name || teacher.email,
  }));
  const tierOptions = tiers.map((tier) => ({ value: tier.id, label: `${tier.name} (Tier ${tier.level})` }));

  const startMutation = useMutation({ mutationFn: startCourseGeneration });
  const cancelMutation = useMutation({ mutationFn: cancelCourseGeneration });
  const retryMutation = useMutation({ mutationFn: retryCourseGeneration });

  // Namespaced query key ("aiCourseGeneration") so this never collides with the
  // unnamespaced ["courses"]/["tiers"] keys used elsewhere. staleTime: 0 overrides
  // the app-wide 60s default so the progress bar actually moves every poll.
  const generationQuery = useQuery({
    queryKey: ["aiCourseGeneration", jobId],
    queryFn: async () => {
      const response = await getCourseGeneration(jobId);
      return response?.data || null;
    },
    enabled: Boolean(jobId) && (phase === "generating" || phase === "result"),
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === "PENDING" || status === "RUNNING") return 2000;
      return false;
    },
  });

  const job = generationQuery.data;

  useEffect(() => {
    if (phase !== "generating" || !job) return;
    if (!TERMINAL_STATUSES.includes(job.status)) return;

    setPhase("result");
    if ((job.status === "SUCCEEDED" || job.status === "PARTIAL") && !savedRef.current) {
      savedRef.current = true;
      onSaved?.();
      queryClient.invalidateQueries({ queryKey: ["aiCourseGeneration"] });
    }
  }, [phase, job, onSaved, queryClient]);

  // The Gemini call itself (the "Calling AI provider" step) can legitimately sit
  // at a fixed server-reported percentage for up to ~2 minutes — there's no real
  // sub-progress signal within one HTTP call to report. Left alone that reads as
  // "frozen," not "working," so this ticks a cosmetic value upward within that one
  // step only, always yielding immediately to a real, higher value from the server
  // and capped well below the next real milestone (70%) so it never overstates
  // actual progress.
  useEffect(() => {
    if (phase !== "generating") return;
    const interval = setInterval(() => {
      if (generationStartRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - generationStartRef.current) / 1000));
      }
      setDisplayProgress((prev) => {
        const serverValue = job?.progress_percent ?? 5;
        if (serverValue > prev) return serverValue;
        if (job?.step?.startsWith("Calling AI provider") && prev < 65) {
          return Math.min(65, prev + 1);
        }
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [phase, job]);

  const handleClose = () => {
    if (startMutation.isPending) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAmountChange = (event) => {
    setForm((prev) => ({ ...prev, amount: sanitizeAmountInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, amount: null }));
  };

  const handleAmountBlur = (event) => {
    setForm((prev) => ({ ...prev, amount: formatAmountOnBlur(event.target.value) }));
  };

  const validateStep = (targetStep) => {
    const errors = {};
    if (targetStep === 1) {
      if (!form.title.trim()) errors.title = "Title is required.";
      if (form.title.length > 255) errors.title = "Title must be at most 255 characters.";
      if (!form.category) errors.category = "Category is required.";
      if (selectedInstructorIds.length === 0) {
        errors.instructors = "At least one instructor is required.";
      }
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount < 0) errors.amount = "Amount must be a positive number.";
    }
    if (targetStep === 3) {
      const modulesCount = Number(form.modules_count);
      if (!Number.isFinite(modulesCount) || modulesCount < 1 || modulesCount > 12) {
        errors.modules_count = "Modules must be between 1 and 12.";
      }
      const lessonsPerModule = Number(form.lessons_per_module);
      if (!Number.isFinite(lessonsPerModule) || lessonsPerModule < 1 || lessonsPerModule > 10) {
        errors.lessons_per_module = "Lessons per module must be between 1 and 10.";
      }
      if (form.include_quizzes) {
        const questionsPerQuiz = Number(form.questions_per_quiz);
        if (!Number.isFinite(questionsPerQuiz) || questionsPerQuiz < 1) {
          errors.questions_per_quiz = "Questions per quiz must be at least 1.";
        }
      }
      const weeks = Number(form.weeks_between_modules);
      if (!Number.isFinite(weeks) || weeks < 1) {
        errors.weeks_between_modules = "Weeks between modules must be at least 1.";
      }
    }
    return errors;
  };

  const goToStep = (targetStep) => {
    if (targetStep > step) {
      const errors = validateStep(step);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }
    setFieldErrors({});
    setStep(targetStep);
  };

  const jumpToErrorStep = (errors) => {
    const erroredFields = Object.keys(errors);
    const targetStep = Object.entries(STEP_FIELDS).find(([, fields]) =>
      fields.some((field) => erroredFields.includes(field))
    )?.[0];
    if (targetStep) setStep(Number(targetStep));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim(),
    category: Number(form.category),
    difficulty: form.difficulty,
    instructors: selectedInstructorIds,
    amount: form.amount || "0",
    target_audience: form.target_audience.trim(),
    objectives: form.objectives
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    tier: form.tier ? Number(form.tier) : null,
    modules_count: Number(form.modules_count),
    lessons_per_module: Number(form.lessons_per_module),
    include_quizzes: form.include_quizzes,
    questions_per_quiz: Number(form.questions_per_quiz),
    include_assignments: form.include_assignments,
    weeks_between_modules: Number(form.weeks_between_modules),
    additional_instructions: form.additional_instructions.trim(),
  });

  const handleGenerate = async () => {
    const step1Errors = validateStep(1);
    const step3Errors = validateStep(3);
    const errors = { ...step1Errors, ...step3Errors };
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      jumpToErrorStep(errors);
      return;
    }

    try {
      const response = await startMutation.mutateAsync(buildPayload());
      generationStartRef.current = Date.now();
      setDisplayProgress(5);
      setElapsedSeconds(0);
      setJobId(response?.data?.job_id);
      setPhase("generating");
    } catch (error) {
      const apiFieldErrors = error?.data?.data;
      if (apiFieldErrors && typeof apiFieldErrors === "object") {
        const mapped = {};
        Object.entries(apiFieldErrors).forEach(([key, value]) => {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(mapped);
        jumpToErrorStep(mapped);
      }
      toastError(getApiErrorMessage(error, "Unable to start course generation."));
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;
    try {
      await cancelMutation.mutateAsync(jobId);
      toastSuccess("Generation cancelled.");
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to cancel generation."));
    }
  };

  const handleRetry = async () => {
    if (!jobId) return;
    try {
      const response = await retryMutation.mutateAsync(jobId);
      generationStartRef.current = Date.now();
      setDisplayProgress(5);
      setElapsedSeconds(0);
      setJobId(response?.data?.job_id);
      savedRef.current = false;
      setPhase("generating");
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to restart generation."));
    }
  };

  const handleReviewAndEdit = () => {
    if (job?.course) onReviewCourse?.(job.course);
    onClose();
  };

  const isSubmitting = startMutation.isPending;
  const modalTitle = phase === "form" ? "Create Course with AI" : "AI Course Generation";
  const modalSubtitle =
    phase === "form"
      ? "Generate a full draft curriculum from a title, description, and structure."
      : job
        ? `Status: ${job.status}`
        : "Starting...";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Sparkles}
      title={modalTitle}
      subtitle={modalSubtitle}
      maxWidth="max-w-2xl"
    >
      {phase === "form" && (
        <div>
          <StepDots step={step} />

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={updateField("title")}
                  placeholder="e.g. College Recruiting Mastery"
                  className={FIELD_CLASS}
                  autoComplete="off"
                />
                {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
              </div>

              <div>
                <label className={LABEL_CLASS}>Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={updateField("description")}
                  placeholder="A short description — the AI's own summary fills this in if left blank."
                  rows={2}
                  className={`${FIELD_CLASS} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SearchableSelect
                    label="Category"
                    placeholder="Select a category"
                    searchPlaceholder="Search categories..."
                    options={categoryOptions}
                    value={form.category}
                    onChange={(value) => {
                      setForm((prev) => ({ ...prev, category: value }));
                      setFieldErrors((prev) => ({ ...prev, category: null }));
                    }}
                    loading={isLoadingOptions}
                    emptyLabel="No categories found."
                  />
                  {fieldErrors.category && <p className={ERROR_CLASS}>{fieldErrors.category}</p>}
                </div>

                <div>
                  <SearchableSelect
                    label="Difficulty"
                    options={DIFFICULTY_OPTIONS}
                    value={form.difficulty}
                    onChange={(value) => setForm((prev) => ({ ...prev, difficulty: value }))}
                  />
                </div>
              </div>

              <div>
                <MultiSelect
                  label="Instructors"
                  placeholder="Select instructors"
                  searchPlaceholder="Search instructors..."
                  options={instructorOptions}
                  values={selectedInstructorIds}
                  onChange={(ids) => {
                    setSelectedInstructorIds(ids);
                    setFieldErrors((prev) => ({ ...prev, instructors: null }));
                  }}
                  loading={isLoadingOptions}
                  emptyLabel="No teachers found."
                />
                <p className="mt-1.5 text-[10px] font-mono text-stone-400">
                  Required — a course with no instructor can never be enrolled.
                </p>
                {fieldErrors.instructors && <p className={ERROR_CLASS}>{fieldErrors.instructors}</p>}
              </div>

              <div className="w-40">
                <label className={LABEL_CLASS}>Amount ($)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  placeholder="0.00"
                  className={FIELD_CLASS}
                />
                {fieldErrors.amount && <p className={ERROR_CLASS}>{fieldErrors.amount}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Target Audience (optional)</label>
                <input
                  type="text"
                  value={form.target_audience}
                  onChange={updateField("target_audience")}
                  placeholder="e.g. High school student-athletes preparing for recruitment"
                  className={FIELD_CLASS}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Learning Objectives (optional, one per line)</label>
                <textarea
                  value={form.objectives}
                  onChange={updateField("objectives")}
                  placeholder={"Understand NCAA eligibility rules\nBuild a recruiting highlight reel"}
                  rows={4}
                  className={`${FIELD_CLASS} resize-none`}
                />
                <p className="mt-1.5 text-[10px] font-mono text-stone-400">
                  Leave blank and the AI will propose objectives itself.
                </p>
              </div>

              <div>
                <SearchableSelect
                  label="Tier Context (optional)"
                  placeholder="No tier context"
                  searchPlaceholder="Search tiers..."
                  options={tierOptions}
                  value={form.tier}
                  onChange={(value) => setForm((prev) => ({ ...prev, tier: value }))}
                  loading={tiersQuery.isLoading}
                  emptyLabel="No tiers found."
                />
                <p className="mt-1.5 text-[10px] font-mono text-stone-400">
                  Read-only context for tone/audience — the AI never attaches this course to a tier.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Modules (1-12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={form.modules_count}
                    onChange={updateField("modules_count")}
                    className={FIELD_CLASS}
                  />
                  {fieldErrors.modules_count && <p className={ERROR_CLASS}>{fieldErrors.modules_count}</p>}
                </div>
                <div>
                  <label className={LABEL_CLASS}>Lessons per Module (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.lessons_per_module}
                    onChange={updateField("lessons_per_module")}
                    className={FIELD_CLASS}
                  />
                  {fieldErrors.lessons_per_module && (
                    <p className={ERROR_CLASS}>{fieldErrors.lessons_per_module}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/60">
                <input
                  type="checkbox"
                  id="include_quizzes"
                  checked={form.include_quizzes}
                  onChange={updateField("include_quizzes")}
                />
                <label htmlFor="include_quizzes" className="text-xs font-mono text-stone-700 flex-1">
                  Include a quiz per module
                </label>
                {form.include_quizzes && (
                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      value={form.questions_per_quiz}
                      onChange={updateField("questions_per_quiz")}
                      placeholder="Questions"
                      className={FIELD_CLASS}
                    />
                  </div>
                )}
              </div>
              {fieldErrors.questions_per_quiz && <p className={ERROR_CLASS}>{fieldErrors.questions_per_quiz}</p>}

              <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/60">
                <input
                  type="checkbox"
                  id="include_assignments"
                  checked={form.include_assignments}
                  onChange={updateField("include_assignments")}
                />
                <label htmlFor="include_assignments" className="text-xs font-mono text-stone-700 flex-1">
                  Include an assignment per module
                </label>
              </div>

              <div className="w-48">
                <label className={LABEL_CLASS}>Weeks Between Modules</label>
                <input
                  type="number"
                  min="1"
                  value={form.weeks_between_modules}
                  onChange={updateField("weeks_between_modules")}
                  className={FIELD_CLASS}
                />
                <p className="mt-1.5 text-[10px] font-mono text-stone-400">
                  Used to space out assignment due dates.
                </p>
                {fieldErrors.weeks_between_modules && (
                  <p className={ERROR_CLASS}>{fieldErrors.weeks_between_modules}</p>
                )}
              </div>

              <div>
                <label className={LABEL_CLASS}>Additional Instructions (optional)</label>
                <textarea
                  value={form.additional_instructions}
                  onChange={updateField("additional_instructions")}
                  placeholder="e.g. Emphasize real-world examples from college athletics."
                  rows={3}
                  className={`${FIELD_CLASS} resize-none`}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-stone-100">
            <button
              type="button"
              onClick={step === 1 ? handleClose : () => goToStep(step - 1)}
              disabled={isSubmitting}
              className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {step === 1 ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </>
              ) : (
                <>
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </>
              )}
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 disabled:opacity-60 disabled:cursor-not-allowed text-stone-100 text-xs font-semibold font-mono rounded-lg tracking-wider uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Course
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "generating" && (
        <div className="py-4">
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full border-4 border-stone-100 border-t-amber-600 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-stone-800">{job?.step || "Starting..."}</p>
              <p className="text-[11px] font-mono text-stone-400 mt-1">
                This can take up to a couple of minutes — feel free to wait, generation continues even if you close this window.
              </p>
            </div>
            <div className="w-full">
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-800 transition-all duration-500"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-stone-400">{displayProgress}%</span>
                <span className="text-[10px] font-mono text-stone-400">{formatElapsed(elapsedSeconds)} elapsed</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all border border-stone-200 shadow-sm cursor-pointer"
            >
              Hide
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all border border-red-200 shadow-sm disabled:opacity-60 cursor-pointer flex items-center gap-2"
            >
              <X className="w-3.5 h-3.5" />
              Cancel Generation
            </button>
          </div>
        </div>
      )}

      {phase === "result" && job && (
        <div className="py-2">
          <div className="flex items-start gap-3 mb-4">
            {(job.status === "SUCCEEDED" || job.status === "PARTIAL") && (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {job.status === "FAILED" && <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />}
            {job.status === "CANCELLED" && <AlertTriangle className="w-6 h-6 text-stone-400 shrink-0 mt-0.5" />}

            <div className="min-w-0">
              {job.status !== "FAILED" && job.status !== "CANCELLED" && job.course && (
                <>
                  <p className="text-sm font-bold text-stone-900">{job.course.title}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
                    Status: {job.course.status}
                  </p>
                </>
              )}
              {job.status === "FAILED" && (
                <>
                  <p className="text-sm font-bold text-stone-900">Generation failed</p>
                  <p className="text-xs text-stone-600 mt-1">{job.error_message}</p>
                </>
              )}
              {job.status === "CANCELLED" && <p className="text-sm font-bold text-stone-900">Generation cancelled</p>}
            </div>
          </div>

          {job.warnings?.length > 0 && (
            <div className="mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50">
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-semibold mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {job.warnings.length} item{job.warnings.length === 1 ? "" : "s"} need attention
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {job.warnings.map((warning, index) => (
                  <li key={index} className="text-[11px] font-mono text-amber-900">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all border border-stone-200 shadow-sm cursor-pointer"
            >
              Close
            </button>
            {job.status === "FAILED" && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={retryMutation.isPending}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>
            )}
            {(job.status === "SUCCEEDED" || job.status === "PARTIAL") && (
              <button
                type="button"
                onClick={handleReviewAndEdit}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-lg tracking-wider uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Review &amp; Edit
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
