"use client";

import { useEffect, useState } from "react";
import { BookPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { getCourseById, getCourses, updateCourse } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

/**
 * Adds a teacher to a course's instructor list.
 *
 * Instructors are a property of the course, not of the teacher, so "assign a
 * course" is a course update — the same one `CreateCourseModal` performs from
 * the Courses tab, reduced to the single field this screen is about.
 *
 * The course's existing instructors are read back and re-sent with the new one
 * appended, each keeping its own `is_lead`. Sending only the teacher being
 * added would replace the list and silently unassign whoever was already on
 * the course.
 */
export default function AssignCourseToTeacherModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  onAssigned,
}) {
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setSelectedCourseId("");

    let isMounted = true;
    setIsLoadingCourses(true);
    (async () => {
      try {
        const response = await getCourses({});
        const list = response?.data?.results || response?.data || [];
        if (isMounted) setCourses(Array.isArray(list) ? list : []);
      } catch (error) {
        if (isMounted) {
          toastError(getApiErrorMessage(error, "Unable to load courses."));
        }
      } finally {
        if (isMounted) setIsLoadingCourses(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Courses this teacher already owns are left out — assigning one twice is
  // not an action, and seeing them listed implies it is.
  const options = courses
    .filter(
      (course) =>
        !(course.instructors || []).some(
          (instructor) => String(instructor.id) === String(teacherId),
        ),
    )
    .map((course) => ({
      value: String(course.id),
      label: course.code ? `${course.code}: ${course.title}` : course.title,
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCourseId) {
      toastError("Pick a course to assign.");
      return;
    }

    setIsSubmitting(true);
    try {
      const detail = (await getCourseById(selectedCourseId))?.data;
      const existing = (detail?.instructors || []).map((instructor) => ({
        instructor: instructor.id,
        is_lead: Boolean(instructor.is_lead),
      }));
      // A course with no instructor yet gets this teacher as its lead.
      const instructors = [
        ...existing,
        { instructor: Number(teacherId), is_lead: existing.length === 0 },
      ];

      const formData = new FormData();
      formData.append("instructors", JSON.stringify(instructors));
      await updateCourse(selectedCourseId, formData);

      toastSuccess(`${teacherName || "Teacher"} assigned to the course.`);
      onAssigned?.();
      onClose();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to assign that course."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      variant="cobalt"
      isOpen={isOpen}
      onClose={onClose}
      icon={BookPlus}
      title="Assign course"
      subtitle={
        teacherName
          ? `${teacherName} is added as an instructor on the course you pick.`
          : undefined
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <SearchableSelect
          tone="cobalt"
          size="lg"
          label="Course"
          placeholder="Select a course"
          searchPlaceholder="Search courses..."
          options={options}
          value={selectedCourseId}
          onChange={setSelectedCourseId}
          loading={isLoadingCourses}
          disabled={isSubmitting}
          emptyLabel="No courses left to assign."
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-[18px] text-sm font-semibold text-cn-p-ink transition-colors hover:border-cn-p-ink disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedCourseId}
            className="inline-flex h-11 items-center justify-center rounded-cn-p-sm bg-cn-p-accent px-[18px] text-sm font-semibold text-white transition-colors hover:bg-cn-p-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Assigning..." : "Assign course"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
