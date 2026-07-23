"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, UserCheck, UserPlus, UserX } from "lucide-react";
import { useAdminStudents } from "@/hooks/admin/useAdminStudents";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteStudent, updateStudent } from "@/services/studentsService";
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
import StudentProfileModal from "@/components/features/admin/StudentProfileModal";
import CreateStudentModal from "@/components/features/admin/CreateStudentModal";
import EditStudentModal from "@/components/features/admin/EditStudentModal";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default function StudentsTab() {
  const { items, status, error, loadStudents } = useAdminStudents();
  const { items: enrollments, loadEnrollments } = useAdminEnrollments();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [viewStudentId, setViewStudentId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deactivatingStudent, setDeactivatingStudent] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activatingStudent, setActivatingStudent] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadStudents();
    loadEnrollments();
  }, [loadStudents, loadEnrollments]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

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

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const columns = [
    {
      key: "name",
      header: "Student Name",
      render: (student) => <span className="font-semibold text-stone-800">{student.full_name}</span>,
    },
    { key: "email", header: "Email", render: (student) => student.email },
    { key: "status", header: "Status", render: (student) => <StatusBadge status={student.account_status} /> },
    {
      key: "enrollments",
      header: "Total Enrollments",
      render: (student) => enrollmentCountByStudentId[student.id] || 0,
    },
    {
      key: "joined",
      header: "Joined Date",
      render: (student) => formatDate(student.date_joined),
    },
    {
      key: "actions",
      header: "Actions",
      render: (student) => (
        <ActionMenu
          actions={[
            { key: "view", label: "View Profile", icon: Eye, onSelect: () => setViewStudentId(student.id) },
            { key: "edit", label: "Edit Student", icon: Edit3, onSelect: () => setEditingStudent(student) },
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
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search students by name or email..." />
          <div className="w-full sm:w-56 shrink-0">
            <SearchableSelect
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:scale-[1.01] transition-all flex items-center gap-2 shrink-0"
          title="Create a new student account"
          aria-label="Create a new student account"
        >
          <UserPlus className="w-4 h-4" />
          ADD STUDENT
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          columns={columns}
          rows={paginatedStudents}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadStudents({ force: true })}
          emptyLabel="No students found."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredStudents.length} student${filteredStudents.length === 1 ? "" : "s"}`}
        />
      </div>

      <StudentProfileModal
        isOpen={Boolean(viewStudentId)}
        onClose={() => setViewStudentId(null)}
        studentId={viewStudentId}
        enrollmentCount={enrollmentCountByStudentId[viewStudentId] || 0}
      />

      <ConfirmDialog
        isOpen={Boolean(deactivatingStudent)}
        onClose={() => setDeactivatingStudent(null)}
        onConfirm={handleDeactivateConfirm}
        isConfirming={isDeactivating}
        title="Deactivate Student"
        message={`Are you sure you want to deactivate "${deactivatingStudent?.full_name}"?`}
        confirmLabel="Deactivate"
      />

      <ConfirmDialog
        isOpen={Boolean(activatingStudent)}
        onClose={() => setActivatingStudent(null)}
        onConfirm={handleActivateConfirm}
        isConfirming={isActivating}
        title="Activate Student"
        message={`Are you sure you want to activate "${activatingStudent?.full_name}"?`}
        confirmLabel="Activate"
      />

      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => loadStudents({ force: true })}
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
