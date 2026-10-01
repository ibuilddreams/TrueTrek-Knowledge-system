"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import MultiSelect from "@/components/ui/MultiSelect";
import { getCourses } from "@/services/coursesService";

const COPY = {
  STUDENT: {
    label: "Enroll in courses (optional)",
    placeholder: "Select courses to enroll in",
    hint: "The student will see these courses as soon as they sign in. Only published courses with an assigned teacher are listed.",
  },
  TEACHER: {
    label: "Assign to courses (optional)",
    placeholder: "Select courses to teach",
    hint: "The teacher will be added as an instructor on these courses and will see them as soon as they sign in.",
  },
};

export default function InviteCoursesField({ role, values, onChange, enabled, disabled }) {
  const copy = COPY[role] || COPY.STUDENT;
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["courses", "invitation-options"],
    queryFn: () => getCourses({ pageSize: 100 }),
    enabled,
  });

  const options = useMemo(() => {
    const courses = data?.data?.results || [];
    return courses
      .filter((course) =>
        role === "STUDENT"
          ? course.status === "PUBLISHED" && (course.instructors || []).length > 0
          : course.status !== "ARCHIVED"
      )
      .map((course) => ({
        value: course.id,
        label: course.code ? `${course.title} (${course.code})` : course.title,
      }));
  }, [data, role]);

  return (
    <div className="space-y-2 text-sm">
      <span className="block">{copy.label}</span>
      <MultiSelect
        size="lg"
        placeholder={copy.placeholder}
        searchPlaceholder="Search courses..."
        options={options}
        values={values}
        onChange={onChange}
        loading={isPending && enabled}
        disabled={disabled || isError}
        emptyLabel={role === "STUDENT" ? "No published courses with a teacher are available." : "No courses found."}
      />
      {isError ? (
        <p role="alert" className="text-xs text-rose-700">
          Unable to load courses.{" "}
          <button type="button" className="font-medium underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-muted">{copy.hint}</p>
      )}
    </div>
  );
}
