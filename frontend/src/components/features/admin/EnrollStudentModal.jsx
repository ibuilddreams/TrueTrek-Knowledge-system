"use client";

import { useEffect, useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { getStudents } from "@/services/studentsService";
import { getCourses } from "@/services/coursesService";
import { createEnrollment } from "@/services/enrollmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

// `defaultStudentId` / `defaultCourseId` pre-select and lock the field the
// caller already knows: opened from a student's page the student is fixed and
// the admin picks a course, opened from a course the reverse. Opened from the
// Enrollments tab neither is set and both are free.
export default function EnrollStudentModal({
  isOpen,
  onClose,
  onEnrolled,
  defaultStudentId,
  defaultCourseId,
}) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId || "");
  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourseId || "");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedStudentId(defaultStudentId ? String(defaultStudentId) : "");
    setSelectedCourseId(defaultCourseId || "");
    setSelectedTeacherId("");

    let isMounted = true;
    setIsLoadingOptions(true);

    (async () => {
      try {
        const [studentsResponse, coursesResponse] = await Promise.all([
          getStudents(),
          getCourses(),
        ]);
        if (!isMounted) return;
        setStudents(studentsResponse?.data?.users || []);
        setCourses(coursesResponse?.data?.results || []);
      } catch (error) {
        if (isMounted) {
          toastError(getApiErrorMessage(error, "Unable to load students and courses."));
        }
      } finally {
        if (isMounted) setIsLoadingOptions(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, defaultStudentId, defaultCourseId]);

  const studentOptions = students.map((student) => ({
    value: student.id,
    label: student.full_name ? `${student.full_name} (${student.email})` : student.email,
  }));

  const courseOptions = courses.map((course) => ({
    value: course.id,
    label: course.status ? `${course.title} · ${course.status}` : course.title,
  }));

  const selectedCourse = courses.find(
    (course) => String(course.id) === String(selectedCourseId)
  );
  const courseInstructors = selectedCourse?.instructors || [];
  const teacherOptions = courseInstructors.map((instructor) => ({
    value: instructor.id,
    label: instructor.name || instructor.email,
  }));

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedTeacherId("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedStudentId || !selectedCourseId || !selectedTeacherId) {
      toastError("Please select a student, a course, and a teacher.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createEnrollment({
        student: selectedStudentId,
        course: selectedCourseId,
        teacher: selectedTeacherId,
      });
      toastSuccess(response?.message || "Student enrolled successfully.");
      onEnrolled?.();
      onClose();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to enroll student."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={UserPlus}
      title="Enroll student"
      subtitle="Assign a student to a course."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <SearchableSelect tone="cobalt" size="lg"
          label="Student"
          placeholder="Select a student"
          searchPlaceholder="Search students..."
          options={studentOptions}
          value={selectedStudentId}
          onChange={setSelectedStudentId}
          loading={isLoadingOptions}
          disabled={isSubmitting || Boolean(defaultStudentId)}
          emptyLabel="No students found."
        />

        <SearchableSelect tone="cobalt" size="lg"
          label="Course"
          placeholder="Select a course"
          searchPlaceholder="Search courses..."
          options={courseOptions}
          value={selectedCourseId}
          onChange={handleCourseChange}
          loading={isLoadingOptions}
          disabled={isSubmitting || Boolean(defaultCourseId)}
          emptyLabel="No courses found."
        />

        <SearchableSelect tone="cobalt" size="lg"
          label="Teacher"
          placeholder={selectedCourseId ? "Select a teacher" : "Select a course first"}
          searchPlaceholder="Search teachers..."
          options={teacherOptions}
          value={selectedTeacherId}
          onChange={setSelectedTeacherId}
          loading={isLoadingOptions}
          disabled={isSubmitting || !selectedCourseId}
          emptyLabel="No teachers assigned to this course."
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-cn-p-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingOptions}
            className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Enroll student
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
