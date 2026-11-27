"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Edit3, Eye, Trash2, Upload, UserCheck, UserPlus, UserX } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAdminStudents } from "@/hooks/admin/useAdminStudents";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortConfig } from "@/hooks/useSortConfig";
import { sortRows } from "@/lib/sorting";
import {
  bulkImportStudents,
  deleteStudent,
  downloadStudentImportSample,
  permanentlyDeleteStudent,
  updateStudent,
} from "@/services/studentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CreateStudentModal from "@/components/features/admin/CreateStudentModal";
import EditStudentModal from "@/components/features/admin/EditStudentModal";
import BulkImportModal from "@/components/features/admin/BulkImportModal";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";
import AdminStudentDetailScreen from "@/components/features/admin/AdminStudentDetailScreen";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default function StudentsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items, status, error, loadStudents } = useAdminStudents();
  const { items: enrollments, loadEnrollments } = useAdminEnrollments();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortConfig, toggleSort] = useSortConfig();

  // The detail screen is a route, not a modal, so it can be linked to and the
  // browser's back button leaves it. A query param rather than a path segment
  // because the portal's route only forwards its first slug — the same shape
  // the teacher portal's own drill-downs use (`?courseId=`).
  const detailId = searchParams.get("studentId");
  const openDetail = (id) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("studentId", String(id));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const closeDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("studentId");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const [editingStudent, setEditingStudent] = useState(null);
  const [deactivatingStudent, setDeactivatingStudent] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activatingStudent, setActivatingStudent] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const deleteStudentMutation = useMutation({
    mutationFn: (id) => permanentlyDeleteStudent(id),
  });

  useEffect(() => {
    loadStudents();
    loadEnrollments();
  }, [loadStudents, loadEnrollments]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortConfig]);

  const enrollmentCountByStudentId = useMemo(() => {
    const counts = {};
    enrollments.forEach((enrollment) => {
      const studentId = enrollment.student?.id;
      if (studentId === undefined) return;
      counts[studentId] = (counts[studentId] || 0) + 1;
    });
    return counts;
  }, [enrollments]);

  const filteredStudents = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return items.filter((student) => {
      const haystack = `${student.full_name || ""} ${student.email || ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = !statusFilter || student.account_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, debouncedSearch, statusFilter]);

  const studentSortAccessors = {
    name: (student) => student.full_name || "",
    email: (student) => student.email || "",
    status: (student) => student.account_status || "",
    enrollments: (student) => enrollmentCountByStudentId[student.id] || 0,
    joined: (student) => (student.date_joined ? new Date(student.date_joined) : null),
  };
  const sortedStudents = sortRows(filteredStudents, sortConfig, studentSortAccessors);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / PAGE_SIZE));
  const paginatedStudents = sortedStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeactivateConfirm = async () => {
    if (!deactivatingStudent) return;
    setIsDeactivating(true);
    try {
      await deleteStudent(deactivatingStudent.id);
      toastSuccess("Student deactivated successfully.");
      setDeactivatingStudent(null);
      loadStudents({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to deactivate student."));
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivateConfirm = async () => {
    if (!activatingStudent) return;
    setIsActivating(true);
    try {
      await updateStudent(activatingStudent.id, { account_status: "ACTIVE" });
      toastSuccess("Student activated successfully.");
      setActivatingStudent(null);
      loadStudents({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to activate student."));
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      await deleteStudentMutation.mutateAsync(deletingStudent.id);
      toastSuccess("Student permanently deleted.");
      setDeletingStudent(null);
      loadStudents({ force: true });
      loadEnrollments({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete student."));
    }
  };

  const columns = [
    {
      key: "name",
      header: "Student name",
      sortable: true,
      render: (student) => <span className="font-semibold text-cn-p-ink">{student.full_name}</span>,
    },
    { key: "email", header: "Email", sortable: true, render: (student) => student.email },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (student) => <StatusBadge tone="cobalt" size="lg" status={student.account_status} />,
    },
    {
      key: "enrollments",
      header: "Total enrollments",
      sortable: true,
      render: (student) => enrollmentCountByStudentId[student.id] || 0,
    },
    {
      key: "joined",
      header: "Joined date",
      sortable: true,
      render: (student) => formatDate(student.date_joined),
    },
    {
      key: "actions",
      header: "Actions",
      render: (student) => (
        <ActionMenu
          actions={[
            { key: "view", label: "View profile", icon: Eye, onSelect: () => openDetail(student.id) },
            { key: "edit", label: "Edit student", icon: Edit3, onSelect: () => setEditingStudent(student) },
            student.account_status !== "DEACTIVATED" && {
              key: "deactivate",
              label: "Deactivate",
              icon: UserX,
              tone: "danger",
              onSelect: () => setDeactivatingStudent(student),
            },
            student.account_status !== "ACTIVE" && {
              key: "activate",
              label: "Activate",
              icon: UserCheck,
              onSelect: () => setActivatingStudent(student),
            },
            {
              key: "delete",
              label: "Delete permanently",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingStudent(student),
            },
          ]}
        />
      ),
    },
  ];

  if (detailId) {
    return <AdminStudentDetailScreen studentId={detailId} onBack={closeDetail} />;
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Students"
        subtitle="Every learner account on the platform."
      />

      <div className="flex flex-col gap-3 rounded-cn-p border border-cn-p-line bg-cn-p-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar tone="cobalt" size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search students by name or email..." />
          <div className="w-full sm:w-56 shrink-0">
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
            title="Bulk add students from a CSV or XLSX file"
            aria-label="Bulk add students from a CSV or XLSX file"
          >
            <Upload className="w-4 h-4" />
            Bulk add
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center gap-2"
            title="Create a new student account"
            aria-label="Create a new student account"
          >
            <UserPlus className="w-4 h-4" />
            Add student
          </button>
        </div>
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
        <DataTable tone="cobalt" size="lg"
          columns={columns}
          rows={paginatedStudents}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadStudents({ force: true })}
          emptyLabel="No students found."
          sortConfig={sortConfig}
          onSortChange={toggleSort}
        />
        <div className="px-4 pb-4">

          <Pagination tone="cobalt" size="lg"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${filteredStudents.length} student${filteredStudents.length === 1 ? "" : "s"}`}
          />

        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deactivatingStudent)}
        onClose={() => setDeactivatingStudent(null)}
        onConfirm={handleDeactivateConfirm}
        isConfirming={isDeactivating}
        title="Deactivate student"
        message={`Are you sure you want to deactivate "${deactivatingStudent?.full_name}"?`}
        confirmLabel="Deactivate"
      />

      <ConfirmDialog
        isOpen={Boolean(activatingStudent)}
        onClose={() => setActivatingStudent(null)}
        onConfirm={handleActivateConfirm}
        isConfirming={isActivating}
        title="Activate student"
        message={`Are you sure you want to activate "${activatingStudent?.full_name}"?`}
        confirmLabel="Activate"
      />

      <ConfirmDialog
        isOpen={Boolean(deletingStudent)}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteStudentMutation.isPending}
        title="Permanently delete student"
        message={`Are you sure you want to permanently delete "${deletingStudent?.full_name}"? This action cannot be undone and will remove all of their enrollments, progress, quiz attempts, and assignment submissions.`}
        confirmLabel="Delete permanently"
      />

      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => loadStudents({ force: true })}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        type="students"
        onImport={bulkImportStudents}
        onDownloadSample={downloadStudentImportSample}
        onImported={() => loadStudents({ force: true })}
      />

      <EditStudentModal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        onUpdated={() => loadStudents({ force: true })}
      />
    </div>
  );
}
