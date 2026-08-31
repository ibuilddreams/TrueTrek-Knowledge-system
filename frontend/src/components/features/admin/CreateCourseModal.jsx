"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookPlus, Check, Edit3, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import MultiSelect from "@/components/ui/MultiSelect";
import { createCourse, getCourseById, getCourseStatusChoices, updateCourse } from "@/services/coursesService";
import { createCategory, getCategories } from "@/services/categoriesService";
import { createTag, getTags } from "@/services/tagsService";
import { getTeachers } from "@/services/teachersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { sanitizeAmountInput, formatAmountOnBlur } from "@/lib/amountInput";
import { toastError, toastSuccess } from "@/lib/toast";

const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const INITIAL_FORM = {
  title: "",
  code: "",
  description: "",
  category: "",
  status: "DRAFT",
  difficulty: "BEGINNER",
  duration_minutes: "0",
  amount: "0",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export default function CreateCourseModal({ isOpen, onClose, onSaved, course }) {
  const isEditMode = Boolean(course);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState(null);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState([]);
  const [leadInstructorIds, setLeadInstructorIds] = useState([]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories({ pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await getTags();
      return response?.data || [];
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

  const statusChoicesQuery = useQuery({
    queryKey: ["courseStatusChoices"],
    queryFn: async () => {
      const response = await getCourseStatusChoices();
      return response?.data || [];
    },
    enabled: isOpen,
  });

  const courseDetailQuery = useQuery({
    queryKey: ["course", course?.id],
    queryFn: async () => {
      const response = await getCourseById(course.id);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(course?.id),
  });

  const categories = categoriesQuery.data || [];
  const tags = tagsQuery.data || [];
  const teachers = teachersQuery.data || [];
  const statusOptions = statusChoicesQuery.data || [];
  const isLoadingOptions =
    categoriesQuery.isLoading || tagsQuery.isLoading || teachersQuery.isLoading || statusChoicesQuery.isLoading;
  const isLoadingCourse = courseDetailQuery.isLoading;

  const createCategoryMutation = useMutation({
    mutationFn: (payload) => createCategory(payload),
    onSuccess: (response) => {
      const category = response?.data;
      queryClient.setQueryData(["categories"], (old) => (category && old ? [...old, category] : old));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: (payload) => createTag(payload),
    onSuccess: (response) => {
      const tag = response?.data;
      queryClient.setQueryData(["tags"], (old) => (tag && old ? [...old, tag] : old));
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setThumbnailFile(null);
    setExistingThumbnailUrl(null);
    setSelectedTagIds([]);
    setSelectedInstructorIds([]);
    setLeadInstructorIds([]);
    setFieldErrors({});
  }, [isOpen]);

  useEffect(() => {
    const detail = courseDetailQuery.data;
    if (!isOpen || !course || !detail) return;

    setForm({
      title: detail.title || "",
      code: detail.code || "",
      description: detail.description || "",
      category: detail.category?.id || "",
      status: detail.status || "DRAFT",
      difficulty: detail.difficulty || "BEGINNER",
      duration_minutes: String(detail.duration_minutes ?? 0),
      amount: String(detail.amount ?? 0),
    });
    setExistingThumbnailUrl(detail.thumbnail || null);
    setSelectedTagIds((detail.tags || []).map((tag) => tag.id));
    setSelectedInstructorIds((detail.instructors || []).map((instructor) => instructor.id));
    setLeadInstructorIds(
      (detail.instructors || []).filter((instructor) => instructor.is_lead).map((instructor) => instructor.id)
    );
  }, [isOpen, course, courseDetailQuery.data]);

  useEffect(() => {
    if (!isOpen) return;
    const failedQuery = [categoriesQuery, tagsQuery, teachersQuery, statusChoicesQuery].find(
      (query) => query.isError
    );
    if (failedQuery) {
      toastError(getApiErrorMessage(failedQuery.error, "Unable to load course options."));
    }
  }, [isOpen, categoriesQuery.isError, tagsQuery.isError, teachersQuery.isError, statusChoicesQuery.isError]);

  useEffect(() => {
    if (!isOpen || !courseDetailQuery.isError) return;
    toastError(getApiErrorMessage(courseDetailQuery.error, "Unable to load course details."));
  }, [isOpen, courseDetailQuery.isError]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAmountChange = (event) => {
    setForm((prev) => ({ ...prev, amount: sanitizeAmountInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, amount: null }));
  };

  const handleAmountBlur = (event) => {
    setForm((prev) => ({ ...prev, amount: formatAmountOnBlur(event.target.value) }));
  };

  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const tagOptions = tags.map((tag) => ({ value: tag.id, label: tag.name }));
  const instructorOptions = teachers.map((teacher) => ({
    value: teacher.id,
    label: teacher.full_name || teacher.email,
  }));

  const toggleLeadInstructor = (instructorId) => {
    setLeadInstructorIds((prev) =>
      prev.includes(instructorId) ? prev.filter((id) => id !== instructorId) : [...prev, instructorId]
    );
  };

  const handleInstructorsChange = (nextIds) => {
    setSelectedInstructorIds(nextIds);
    setLeadInstructorIds((prev) => prev.filter((id) => nextIds.includes(id)));
  };

  const handleCreateCategory = async (name) => {
    try {
      const response = await createCategoryMutation.mutateAsync({ name });
      const category = response?.data;
      if (!category) throw new Error("Unable to create category.");
      setFieldErrors((prev) => ({ ...prev, category: null }));
      return { value: category.id, label: category.name };
    } catch (error) {
      const nameError = error?.data?.data?.name;
      throw new Error(
        Array.isArray(nameError) ? nameError[0] : getApiErrorMessage(error, "Unable to create category.")
      );
    }
  };

  const handleCreateTag = async (name) => {
    try {
      const response = await createTagMutation.mutateAsync({ name });
      const tag = response?.data;
      if (!tag) throw new Error("Unable to create tag.");
      return { value: tag.id, label: tag.name };
    } catch (error) {
      const nameError = error?.data?.data?.name;
      throw new Error(Array.isArray(nameError) ? nameError[0] : getApiErrorMessage(error, "Unable to create tag."));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const code = form.code.trim().toUpperCase();
    const durationMinutes = Number(form.duration_minutes);
    const amount = Number(form.amount);

    const errors = {};
    if (!title) errors.title = "Title is required.";
    if (title.length > 255) errors.title = "Title must be at most 255 characters.";
    if (!code) errors.code = "Course code is required.";
    if (code.length > 50) errors.code = "Course code must be at most 50 characters.";
    if (!form.category) errors.category = "Category is required.";
    if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
      errors.duration_minutes = "Duration must be a positive number.";
    }
    if (!Number.isFinite(amount) || amount < 0) {
      errors.amount = "Amount must be a positive number.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("code", code);
    if (form.description.trim()) formData.append("description", form.description.trim());
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
    formData.append("category", form.category);
    formData.append("status", form.status);
    formData.append("difficulty", form.difficulty);
    formData.append("duration_minutes", String(durationMinutes));
    formData.append("amount", String(amount));
    selectedTagIds.forEach((tagId) => formData.append("tags", tagId));
    if (selectedInstructorIds.length) {
      formData.append(
        "instructors",
        JSON.stringify(
          selectedInstructorIds.map((instructorId) => ({
            instructor: instructorId,
            is_lead: leadInstructorIds.includes(instructorId),
          }))
        )
      );
    }

    setIsSubmitting(true);
    try {
      const response = isEditMode ? await updateCourse(course.id, formData) : await createCourse(formData);
      toastSuccess(response?.message || `Course ${isEditMode ? "updated" : "created"} successfully.`);
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
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} course.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isLoadingCourse;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : BookPlus}
      title={isEditMode ? "Edit Course" : "Add Course"}
      subtitle={isEditMode ? "Update the course details." : "Create a new course."}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            disabled={isBusy}
            placeholder="Course title"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Course Code</label>
          <input
            type="text"
            value={form.code}
            onChange={updateField("code")}
            disabled={isBusy}
            placeholder="CS101"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.code && <p className={ERROR_CLASS}>{fieldErrors.code}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isBusy}
            placeholder="Course description"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Thumbnail</label>
          {existingThumbnailUrl && !thumbnailFile && (
            <div className="mb-2 flex items-center gap-2">
              <img
                src={existingThumbnailUrl}
                alt="Current thumbnail"
                className="w-14 h-14 object-cover rounded-lg border border-stone-200"
              />
              <span className="text-[11px] font-mono text-stone-400">Current thumbnail</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)}
            disabled={isBusy}
            className={`${FIELD_CLASS} file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-stone-200 file:text-stone-700 file:text-[11px] file:font-mono file:uppercase file:tracking-wider`}
          />
          {fieldErrors.thumbnail && <p className={ERROR_CLASS}>{fieldErrors.thumbnail}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <SearchableSelect size="lg"
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
              disabled={isBusy}
              emptyLabel="No categories found."
              onCreate={handleCreateCategory}
              createLabel="Add New Category"
            />
            {fieldErrors.category && <p className={ERROR_CLASS}>{fieldErrors.category}</p>}
          </div>

          <div>
            <MultiSelect size="lg"
              label="Tags"
              placeholder="Select tags"
              searchPlaceholder="Search tags..."
              options={tagOptions}
              values={selectedTagIds}
              onChange={setSelectedTagIds}
              loading={isLoadingOptions}
              disabled={isBusy}
              emptyLabel="No tags found."
              onCreate={handleCreateTag}
              createLabel="Add New Tag"
            />
            {fieldErrors.tags && <p className={ERROR_CLASS}>{fieldErrors.tags}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={form.status}
              onChange={updateField("status")}
              disabled={isBusy || isLoadingOptions}
              className={FIELD_CLASS}
            >
              {statusOptions.length === 0 && <option value={form.status}>Loading...</option>}
              {statusOptions.map((option) => (
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
          </div>

          <div>
            <label className={LABEL_CLASS}>Duration (minutes)</label>
            <input
              type="number"
              min="0"
              value={form.duration_minutes}
              onChange={updateField("duration_minutes")}
              disabled={isBusy}
              className={FIELD_CLASS}
            />
            {fieldErrors.duration_minutes && <p className={ERROR_CLASS}>{fieldErrors.duration_minutes}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Amount ($)</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              disabled={isBusy}
              placeholder="0.00"
              className={FIELD_CLASS}
            />
            {fieldErrors.amount && <p className={ERROR_CLASS}>{fieldErrors.amount}</p>}
          </div>
        </div>

        <div>
          <MultiSelect size="lg"
            label="Instructors"
            placeholder="Select instructors"
            searchPlaceholder="Search instructors..."
            options={instructorOptions}
            values={selectedInstructorIds}
            onChange={handleInstructorsChange}
            loading={isLoadingOptions}
            disabled={isBusy}
            emptyLabel="No teachers found."
          />
          {fieldErrors.instructors && <p className={ERROR_CLASS}>{fieldErrors.instructors}</p>}

          {selectedInstructorIds.length > 0 && (
            <ul className="mt-3 space-y-2">
              {selectedInstructorIds.map((instructorId) => {
                const instructor = teachers.find((teacher) => teacher.id === instructorId);
                if (!instructor) return null;
                return (
                  <li
                    key={instructorId}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-stone-100 bg-stone-50/60 text-sm"
                  >
                    <span className="font-semibold text-stone-800">
                      {instructor.full_name || instructor.email}
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={leadInstructorIds.includes(instructorId)}
                        onChange={() => toggleLeadInstructor(instructorId)}
                        disabled={isBusy}
                      />
                      Lead Instructor
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isBusy}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Update Course" : "Create Course"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
