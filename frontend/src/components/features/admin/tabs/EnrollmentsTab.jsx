"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Trash2, Upload, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortConfig } from "@/hooks/useSortConfig";
import { sortRows } from "@/lib/sorting";
import { formatDateTime } from "@/lib/adminFormatters";
import {
  bulkImportEnrollments,
  downloadEnrollmentImportSample,
  removeEnrollment,
} from "@/services/enrollmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EnrollmentDetailModal from "@/components/features/admin/EnrollmentDetailModal";
import EnrollmentStatusModal from "@/components/features/admin/EnrollmentStatusModal";
import EnrollStudentModal from "@/components/features/admin/EnrollStudentModal";
import BulkImportModal from "@/components/features/admin/BulkImportModal";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function EnrollmentsTab() {
  const { items, status, error, loadEnrollments } = useAdminEnrollments();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortConfig, toggleSort] = useSortConfig();

  const [viewEnrollment, setViewEnrollment] = useState(null);
  const [editEnrollment, setEditEnrollment] = useState(null);
  const [removingEnrollment, setRemovingEnrollment] = useState(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const removeEnrollmentMutation = useMutation({
    mutationFn: (id) => removeEnrollment(id),
  });

  const handleRemoveConfirm = async () => {
    if (!removingEnrollment) return;
    try {
      await removeEnrollmentMutation.mutateAsync(removingEnrollment.id);
      toastSuccess("Enrollment removed successfully.");
      setRemovingEnrollment(null);
      loadEnrollments({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to remove enrollment."));
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortConfig]);

  const filteredEnrollments = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return items.filter((enrollment) => {
      const haystack = `${enrollment.student?.name || ""} ${enrollment.student?.email || ""} ${
        enrollment.course?.title || ""
      } ${enrollment.teacher?.name || ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = !statusFilter || enrollment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, debouncedSearch, statusFilter]);

  const enrollmentSortAccessors = {
    student: (enrollment) => enrollment.student?.name || "",
    course: (enrollment) => enrollment.course?.title || "",
    teacher: (enrollment) => enrollment.teacher?.name || "",
    status: (enrollment) => enrollment.status || "",
    enrolled_at: (enrollment) => (enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : null),
  };
  const sortedEnrollments = sortRows(filteredEnrollments, sortConfig, enrollmentSortAccessors);

  const totalPages = Math.max(1, Math.ceil(sortedEnrollments.length / PAGE_SIZE));
  const paginatedEnrollments = sortedEnrollments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key: "student",
      header: "Student",
      sortable: true,
      render: (enrollment) => (
        <div>
          <p className="font-semibold text-cn-p-ink">{enrollment.student?.name}</p>
          <p className="text-xs text-cn-p-ink-2">{enrollment.student?.email}</p>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      sortable: true,
      render: (enrollment) => enrollment.course?.title || "—",
    },
    {
      key: "teacher",
      header: "Teacher",
      sortable: true,
      render: (enrollment) => enrollment.teacher?.name || "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (enrollment) => <StatusBadge tone="cobalt" size="lg" status={enrollment.status} />,
    },
    {
      key: "enrolled_at",
      header: "Enrolled",
      sortable: true,
      render: (enrollment) => formatDateTime(enrollment.enrolled_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (enrollment) => (
        <ActionMenu
          actions={[
            { key: "view", label: "View details", icon: Eye, onSelect: () => setViewEnrollment(enrollment) },
            { key: "edit", label: "Edit status", icon: Edit3, onSelect: () => setEditEnrollment(enrollment) },
            {
              key: "remove",
              label: "Remove enrollment",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setRemovingEnrollment(enrollment),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Enrollments"
        subtitle="Who has access to which course."
      />

      <div className="flex flex-col gap-3 rounded-cn-p border border-cn-p-line bg-cn-p-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <SearchBar tone="cobalt" size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search by student or course..." />
          <div className="w-full sm:w-56">
            <SearchableSelect tone="cobalt" size="lg"
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="px-4 py-2.5 bg-cn-p-card hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-xl border border-cn-p-line transition-all flex items-center gap-2"
            title="Bulk enroll students from CSV or XLSX"
            aria-label="Bulk enroll students from CSV or XLSX"
          >
            <Upload className="w-4 h-4" />
            Bulk enrollment
          </button>
          <button
            type="button"
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-4 py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center gap-2"
            title="Enroll a student into a course"
            aria-label="Enroll a student into a course"
          >
            <UserPlus className="w-4 h-4" />
            Enroll student
          </button>
        </div>
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
        <DataTable tone="cobalt" size="lg"
          columns={columns}
          rows={paginatedEnrollments}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadEnrollments({ force: true })}
          emptyLabel="No enrollments found."
          sortConfig={sortConfig}
          onSortChange={toggleSort}
        />
        <div className="px-4 pb-4">

          <Pagination tone="cobalt" size="lg"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${filteredEnrollments.length} enrollment${filteredEnrollments.length === 1 ? "" : "s"}`}
          />

        </div>
      </div>

      <EnrollmentDetailModal
        isOpen={Boolean(viewEnrollment)}
        onClose={() => setViewEnrollment(null)}
        enrollment={viewEnrollment}
      />

      <EnrollmentStatusModal
        isOpen={Boolean(editEnrollment)}
        onClose={() => setEditEnrollment(null)}
        enrollment={editEnrollment}
        onUpdated={() => loadEnrollments({ force: true })}
      />

      <ConfirmDialog variant="cobalt" size="lg"
        isOpen={Boolean(removingEnrollment)}
        onClose={() => setRemovingEnrollment(null)}
        onConfirm={handleRemoveConfirm}
        isConfirming={removeEnrollmentMutation.isPending}
        title="Remove enrollment"
        message={`Are you sure you want to remove "${removingEnrollment?.student?.name}" from "${removingEnrollment?.course?.title}"? This cannot be undone and will delete their progress, quiz attempts, and assignment submissions for this course.`}
        confirmLabel="Remove"
      />

      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrolled={() => loadEnrollments({ force: true })}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        type="enrollments"
        onImport={bulkImportEnrollments}
        onDownloadSample={downloadEnrollmentImportSample}
        onImported={() => loadEnrollments({ force: true })}
      />
    </div>
  );
}
