"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Trash2, Upload, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
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
  }, [debouncedSearch, statusFilter]);

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

  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / PAGE_SIZE));
  const paginatedEnrollments = filteredEnrollments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (enrollment) => (
        <div>
          <p className="font-semibold text-stone-800">{enrollment.student?.name}</p>
          <p className="text-[11px] text-stone-400 font-mono">{enrollment.student?.email}</p>
        </div>
      ),
    },
    { key: "course", header: "Course", render: (enrollment) => enrollment.course?.title || "—" },
    { key: "teacher", header: "Teacher", render: (enrollment) => enrollment.teacher?.name || "Unassigned" },
    { key: "status", header: "Status", render: (enrollment) => <StatusBadge status={enrollment.status} /> },
    { key: "enrolled_at", header: "Enrolled", render: (enrollment) => formatDateTime(enrollment.enrolled_at) },
    {
      key: "actions",
      header: "Actions",
      render: (enrollment) => (
        <ActionMenu
          actions={[
            { key: "view", label: "View Details", icon: Eye, onSelect: () => setViewEnrollment(enrollment) },
            { key: "edit", label: "Edit Status", icon: Edit3, onSelect: () => setEditEnrollment(enrollment) },
            {
              key: "remove",
              label: "Remove Enrollment",
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by student or course..." />
          <div className="w-full sm:w-56">
            <SearchableSelect
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
            className="px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold font-mono rounded-xl tracking-wider border border-stone-200 shadow-sm transition-all flex items-center gap-2"
            title="Bulk enroll students from CSV or XLSX"
            aria-label="Bulk enroll students from CSV or XLSX"
          >
            <Upload className="w-4 h-4" />
            BULK ENROLLMENT
          </button>
          <button
            type="button"
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            title="Enroll a student into a course"
            aria-label="Enroll a student into a course"
          >
            <UserPlus className="w-4 h-4" />
            ENROLL STUDENT
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          columns={columns}
          rows={paginatedEnrollments}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadEnrollments({ force: true })}
          emptyLabel="No enrollments found."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredEnrollments.length} enrollment${filteredEnrollments.length === 1 ? "" : "s"}`}
        />
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

      <ConfirmDialog
        isOpen={Boolean(removingEnrollment)}
        onClose={() => setRemovingEnrollment(null)}
        onConfirm={handleRemoveConfirm}
        isConfirming={removeEnrollmentMutation.isPending}
        title="Remove Enrollment"
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
