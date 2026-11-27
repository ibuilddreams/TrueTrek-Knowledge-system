"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  Coins,
  Plus,
  TrendingUp,
} from "lucide-react";
import { getStudentById, deleteStudent, updateStudent } from "@/services/studentsService";
import { getAdminStudentPointsDetail } from "@/services/pointsService";
import { removeEnrollment } from "@/services/enrollmentsService";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EnrollStudentModal from "@/components/features/admin/EnrollStudentModal";
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
 * Admin → Students → one student.
 *
 * The design's own page: a breadcrumb back to the list, the student's name and
 * email, their account status and the two actions an admin takes on them, four
 * headline numbers, then every course they are enrolled in.
 *
 * It reads the detail endpoint rather than the row the list already had,
 * because the average progress and last login on the cards are only computed
 * for a single student — see `StudentDetailSerializer`.
 */
export default function AdminStudentDetailScreen({ studentId, onBack }) {
  const queryClient = useQueryClient();
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);

  const studentQuery = useQuery({
    queryKey: ["admin-student", studentId],
    queryFn: async () => (await getStudentById(studentId))?.data || null,
    enabled: Boolean(studentId),
  });

  const pointsQuery = useQuery({
    queryKey: ["admin-student-points", studentId],
    queryFn: async () => (await getAdminStudentPointsDetail(studentId))?.data || null,
    enabled: Boolean(studentId),
  });

  // The enrolment list is the one the Enrollments tab already loads, so
  // arriving here from it costs no extra request.
  const { items: enrollments, status: enrollmentsStatus, loadEnrollments } =
    useAdminEnrollments();
  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const rows = useMemo(
    () =>
      (enrollments || []).filter(
        (enrollment) => String(enrollment.student?.id) === String(studentId),
      ),
    [enrollments, studentId],
  );

  const student = studentQuery.data;
  const isLoading = studentQuery.isLoading;

  const refreshEnrollments = () => {
    loadEnrollments({ force: true });
    queryClient.invalidateQueries({ queryKey: ["admin-student", studentId] });
  };

  const handleRemove = async () => {
    if (!pendingRemoval) return;
    setIsRemoving(true);
    try {
      await removeEnrollment(pendingRemoval.id);
      toastSuccess("Enrolment removed.");
      setPendingRemoval(null);
      refreshEnrollments();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to remove that enrolment."));
    } finally {
      setIsRemoving(false);
    }
  };

  // Suspending is the same deactivate/activate pair the Students table uses,
  // so a student suspended here looks suspended there.
  const isSuspended = student?.account_status !== "ACTIVE";
  const handleToggleSuspend = async () => {
    setIsSuspending(true);
    try {
      if (isSuspended) {
        await updateStudent(studentId, { account_status: "ACTIVE" });
        toastSuccess("Student reactivated.");
      } else {
        await deleteStudent(studentId);
        toastSuccess("Student suspended.");
      }
      studentQuery.refetch();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to update this account."));
    } finally {
      setIsSuspending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
        <Loader tone="cobalt" fullScreen={false} label="Loading student..." />
      </div>
    );
  }

  if (!student) {
    return (
      <PortalCard className="mx-auto max-w-lg">
        <PortalEmpty
          icon={BookOpen}
          title="We couldn't load that student"
          text="They may have been removed. Go back to the list and try again."
        >
          <PortalButton size="sm" onClick={onBack} className="mt-2">
            Back to students
          </PortalButton>
        </PortalEmpty>
      </PortalCard>
    );
  }

  const name = student.full_name || student.username || "Student";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        crumbs={
          <PortalCrumbs items={[{ label: "Students", onClick: onBack }, { label: name }]} />
        }
        title={name}
        subtitle={student.email}
      >
        <StatusBadge tone="cobalt" size="lg" status={student.account_status} />
        <PortalButton variant="sec" onClick={handleToggleSuspend} disabled={isSuspending}>
          {isSuspended ? "Reactivate" : "Suspend"}
        </PortalButton>
        <PortalButton onClick={() => setIsEnrollOpen(true)}>
          <Plus className="h-4 w-4" />
          Enroll in course
        </PortalButton>
      </PortalPageHead>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStat
          label="Courses"
          value={student.enrollment_count ?? rows.length}
          hint="Enrolled"
          icon={BookOpen}
        />
        <PortalStat
          label="Avg progress"
          value={`${Math.round(student.average_progress ?? 0)}%`}
          hint="Across courses"
          icon={TrendingUp}
        />
        <PortalStat
          label="Points"
          value={pointsQuery.data?.balance ?? 0}
          hint={`${pointsQuery.data?.total_earned ?? 0} earned all time`}
          icon={Coins}
          tone="warn"
        />
        <PortalStat
          label="Last active"
          value={student.last_login ? formatDate(student.last_login) : "Never"}
          hint={student.date_joined ? `Joined ${formatDate(student.date_joined)}` : undefined}
          icon={Clock}
        />
      </div>

      <PortalCard className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-cn-p-line px-5 py-4">
          <h2 className="text-base font-bold tracking-[-0.01em] text-cn-p-ink">
            Enrollments
          </h2>
          <span className="text-sm text-cn-p-ink-2">
            {rows.length} course{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        {enrollmentsStatus === "loading" || enrollmentsStatus === "idle" ? (
          <div className="p-10">
            <Loader tone="cobalt" fullScreen={false} label="Loading enrolments..." />
          </div>
        ) : rows.length === 0 ? (
          <PortalEmpty
            icon={BookOpen}
            title="Not enrolled in anything yet"
            text="Use Enroll in course to give this student access to one."
          />
        ) : (
          <PortalTable>
            <thead>
              <tr>
                <PortalTh>Course</PortalTh>
                <PortalTh>Teacher</PortalTh>
                <PortalTh>Enrolled</PortalTh>
                <PortalTh>Status</PortalTh>
                <PortalTh align="right">
                  <span className="sr-only">Actions</span>
                </PortalTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((enrollment) => (
                <PortalTr key={enrollment.id}>
                  <PortalTd>
                    {enrollment.course?.code && (
                      <b className="font-semibold text-cn-p-ink">
                        {enrollment.course.code}
                      </b>
                    )}{" "}
                    <span className="text-cn-p-ink-2">{enrollment.course?.title}</span>
                  </PortalTd>
                  <PortalTd className="text-sm text-cn-p-ink-2">
                    {enrollment.teacher?.name || "Unassigned"}
                  </PortalTd>
                  <PortalTd className="text-sm whitespace-nowrap text-cn-p-ink-2">
                    {formatDate(enrollment.enrolled_at)}
                  </PortalTd>
                  <PortalTd>
                    <StatusBadge tone="cobalt" status={enrollment.status} />
                  </PortalTd>
                  <PortalTd align="right">
                    <button
                      type="button"
                      onClick={() => setPendingRemoval(enrollment)}
                      className="text-sm font-semibold text-cn-p-accent transition hover:underline"
                    >
                      Remove
                    </button>
                  </PortalTd>
                </PortalTr>
              ))}
            </tbody>
          </PortalTable>
        )}
      </PortalCard>

      <EnrollStudentModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        defaultStudentId={studentId}
        onEnrolled={refreshEnrollments}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        onConfirm={handleRemove}
        isConfirming={isRemoving}
        title="Remove this enrolment?"
        message={`${name} will lose access to "${pendingRemoval?.course?.title}". Their progress in it is removed with the enrolment.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
