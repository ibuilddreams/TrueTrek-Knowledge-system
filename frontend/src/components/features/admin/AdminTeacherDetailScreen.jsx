"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Plus, Star } from "lucide-react";
import {
  getAdminTeacherAssignedCourses,
  getInstructorProfile,
  getTeacherById,
} from "@/services/teachersService";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { formatDate } from "@/lib/adminFormatters";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/ui/StatusBadge";
import CreateCourseModal from "@/components/features/admin/CreateCourseModal";
import AssignCourseToTeacherModal from "@/components/features/admin/AssignCourseToTeacherModal";
import PortalCard, { PortalStat } from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalCrumbs,
  PortalEmpty,
  PortalPageHead,
  PortalTable,
  PortalTd,
  PortalTh,
  PortalTr,
} from "@/components/features/portal/shell/PortalUI";

/**
 * Admin → Teachers → one teacher.
 *
 * The design's page: breadcrumb, name and email, account status and the one
 * action, three headline numbers, then every course they teach.
 *
 * Three sources, because no single endpoint carries all of it: the account
 * (`teacher/<id>/admin/`), the courses they are an instructor on
 * (`teacher/<id>/assignedcourses`), and the rating, which lives on the public
 * instructor profile rather than the account.
 */
export default function AdminTeacherDetailScreen({ teacherId, onBack }) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [reassigningCourse, setReassigningCourse] = useState(null);

  const teacherQuery = useQuery({
    queryKey: ["admin-teacher", teacherId],
    queryFn: async () => (await getTeacherById(teacherId))?.data || null,
    enabled: Boolean(teacherId),
  });

  const coursesQuery = useQuery({
    queryKey: ["admin-teacher-courses", teacherId],
    queryFn: async () => (await getAdminTeacherAssignedCourses(teacherId))?.data || null,
    enabled: Boolean(teacherId),
  });

  // The rating is the only thing this page needs from the public profile, and
  // a teacher with no feedback yet has none — hence the dash rather than a 0.
  const profileQuery = useQuery({
    queryKey: ["admin-teacher-profile", teacherId],
    queryFn: async () => (await getInstructorProfile(teacherId))?.data || null,
    enabled: Boolean(teacherId),
    retry: false,
  });

  // Student counts per course come from the enrolment list the Enrollments tab
  // already loads; the assigned-courses endpoint does not carry them.
  const { items: enrollments, loadEnrollments } = useAdminEnrollments();
  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const studentsByCourseId = useMemo(() => {
    const counts = {};
    (enrollments || []).forEach((enrollment) => {
      const id = enrollment.course?.id;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [enrollments]);

  const teacher = teacherQuery.data;
  const courses = coursesQuery.data?.courses || [];
  const rating = profileQuery.data?.stats?.rating;

  if (teacherQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
        <Loader tone="cobalt" fullScreen={false} label="Loading teacher..." />
      </div>
    );
  }

  if (!teacher) {
    return (
      <PortalCard className="mx-auto max-w-lg">
        <PortalEmpty
          icon={BookOpen}
          title="We couldn't load that teacher"
          text="They may have been removed. Go back to the list and try again."
        >
          <PortalButton size="sm" onClick={onBack} className="mt-2">
            Back to teachers
          </PortalButton>
        </PortalEmpty>
      </PortalCard>
    );
  }

  const name = teacher.full_name || teacher.username || "Teacher";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        crumbs={
          <PortalCrumbs items={[{ label: "Teachers", onClick: onBack }, { label: name }]} />
        }
        title={name}
        subtitle={teacher.email}
      >
        <StatusBadge tone="cobalt" size="lg" status={teacher.account_status} />
        <PortalButton onClick={() => setIsAssignOpen(true)}>
          <Plus className="h-4 w-4" />
          Assign course
        </PortalButton>
      </PortalPageHead>

      <div className="grid gap-3 sm:grid-cols-3">
        <PortalStat
          label="Courses"
          value={coursesQuery.data?.total_courses ?? courses.length}
          hint="Assigned to this teacher"
          icon={BookOpen}
        />
        <PortalStat
          label="Rating"
          value={rating ? Number(rating).toFixed(1) : "—"}
          hint="Student feedback"
          icon={Star}
          tone="warn"
        />
        <PortalStat
          label="Joined"
          value={teacher.date_joined ? formatDate(teacher.date_joined) : "—"}
          icon={Clock}
        />
      </div>

      <PortalCard className="overflow-hidden">
        {coursesQuery.isLoading ? (
          <div className="p-10">
            <Loader tone="cobalt" fullScreen={false} label="Loading courses..." />
          </div>
        ) : courses.length === 0 ? (
          <PortalEmpty
            icon={BookOpen}
            title="No courses assigned"
            text="Use Assign course to put this teacher on one."
          />
        ) : (
          <PortalTable>
            <thead>
              <tr>
                <PortalTh>Course</PortalTh>
                <PortalTh>Category</PortalTh>
                <PortalTh>Status</PortalTh>
                <PortalTh align="right">Students</PortalTh>
                <PortalTh align="right">
                  <span className="sr-only">Actions</span>
                </PortalTh>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <PortalTr key={course.id}>
                  <PortalTd>
                    {course.code && (
                      <b className="font-semibold text-cn-p-ink">{course.code}</b>
                    )}{" "}
                    <span className="text-cn-p-ink-2">{course.title}</span>
                  </PortalTd>
                  <PortalTd className="text-sm text-cn-p-ink-2">
                    {course.category?.name || "Uncategorized"}
                  </PortalTd>
                  <PortalTd>
                    <StatusBadge tone="cobalt" status={course.status} />
                  </PortalTd>
                  <PortalTd align="right" numeric>
                    {studentsByCourseId[course.id] ?? 0}
                  </PortalTd>
                  <PortalTd align="right">
                    {/* Reassigning is editing the course's instructors, which
                        is what this modal already does from the Courses tab. */}
                    <button
                      type="button"
                      onClick={() => setReassigningCourse(course)}
                      className="text-sm font-semibold text-cn-p-accent transition hover:underline"
                    >
                      Reassign
                    </button>
                  </PortalTd>
                </PortalTr>
              ))}
            </tbody>
          </PortalTable>
        )}
      </PortalCard>

      <AssignCourseToTeacherModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        teacherId={teacherId}
        teacherName={name}
        onAssigned={() => coursesQuery.refetch()}
      />

      <CreateCourseModal
        isOpen={Boolean(reassigningCourse)}
        onClose={() => setReassigningCourse(null)}
        course={reassigningCourse}
        onSaved={() => {
          setReassigningCourse(null);
          coursesQuery.refetch();
        }}
      />
    </div>
  );
}
