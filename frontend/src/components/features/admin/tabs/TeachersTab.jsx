"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Upload, UserCheck, UserPlus, UserX } from "lucide-react";
import { useAdminTeachers } from "@/hooks/admin/useAdminTeachers";
import { useAdminCourses } from "@/hooks/admin/useAdminCourses";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  bulkImportTeachers,
  deleteTeacher,
  downloadTeacherImportSample,
  updateTeacher,
} from "@/services/teachersService";
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
import TeacherProfileModal from "@/components/features/admin/TeacherProfileModal";
import CreateTeacherModal from "@/components/features/admin/CreateTeacherModal";
import EditTeacherModal from "@/components/features/admin/EditTeacherModal";
import BulkImportModal from "@/components/features/admin/BulkImportModal";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default function TeachersTab() {
  const { items, status, error, loadTeachers } = useAdminTeachers();
  const { items: courses, loadCourses } = useAdminCourses();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [viewTeacherId, setViewTeacherId] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deactivatingTeacher, setDeactivatingTeacher] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activatingTeacher, setActivatingTeacher] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  useEffect(() => {
    loadTeachers();
    loadCourses();
  }, [loadTeachers, loadCourses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const courseCountByTeacherId = useMemo(() => {
    const counts = {};
    courses.forEach((course) => {
      (course.instructors || []).forEach((instructor) => {
        const teacherId = instructor.id;
        if (teacherId === undefined) return;
        counts[teacherId] = (counts[teacherId] || 0) + 1;
      });
    });
    return counts;
  }, [courses]);

  const filteredTeachers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return items.filter((teacher) => {
      const haystack = `${teacher.full_name || ""} ${teacher.email || ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = !statusFilter || teacher.account_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const paginatedTeachers = filteredTeachers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeactivateConfirm = async () => {
    if (!deactivatingTeacher) return;
    setIsDeactivating(true);
    try {
      await deleteTeacher(deactivatingTeacher.id);
      toastSuccess("Teacher deactivated successfully.");
      setDeactivatingTeacher(null);
      loadTeachers({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to deactivate teacher."));
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivateConfirm = async () => {
    if (!activatingTeacher) return;
    setIsActivating(true);
    try {
      await updateTeacher(activatingTeacher.id, { account_status: "ACTIVE" });
      toastSuccess("Teacher activated successfully.");
      setActivatingTeacher(null);
      loadTeachers({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to activate teacher."));
    } finally {
      setIsActivating(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Teacher Name",
      render: (teacher) => <span className="font-semibold text-stone-800">{teacher.full_name}</span>,
    },
    { key: "email", header: "Email", render: (teacher) => teacher.email },
    { key: "status", header: "Status", render: (teacher) => <StatusBadge status={teacher.account_status} /> },
    {
      key: "courses",
      header: "Assigned Courses",
      render: (teacher) => courseCountByTeacherId[teacher.id] || 0,
    },
    {
      key: "joined",
      header: "Joined Date",
      render: (teacher) => formatDate(teacher.date_joined),
    },
    {
      key: "actions",
      header: "Actions",
      render: (teacher) => (
        <ActionMenu
          actions={[
            { key: "view", label: "View Profile", icon: Eye, onSelect: () => setViewTeacherId(teacher.id) },
            { key: "edit", label: "Edit Teacher", icon: Edit3, onSelect: () => setEditingTeacher(teacher) },
            teacher.account_status !== "DEACTIVATED" && {
              key: "deactivate",
              label: "Deactivate",
              icon: UserX,
              tone: "danger",
              onSelect: () => setDeactivatingTeacher(teacher),
            },
            teacher.account_status !== "ACTIVE" && {
              key: "activate",
              label: "Activate",
              icon: UserCheck,
              onSelect: () => setActivatingTeacher(teacher),
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
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search teachers by name or email..." />
          <div className="w-full sm:w-56 shrink-0">
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
            title="Bulk import teachers from CSV or XLSX"
            aria-label="Bulk import teachers from CSV or XLSX"
          >
            <Upload className="w-4 h-4" />
            BULK IMPORT
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            title="Create a new teacher account"
            aria-label="Create a new teacher account"
          >
            <UserPlus className="w-4 h-4" />
            ADD TEACHER
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          columns={columns}
          rows={paginatedTeachers}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadTeachers({ force: true })}
          emptyLabel="No teachers found."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredTeachers.length} teacher${filteredTeachers.length === 1 ? "" : "s"}`}
        />
      </div>

      <TeacherProfileModal
        isOpen={Boolean(viewTeacherId)}
        onClose={() => setViewTeacherId(null)}
        teacherId={viewTeacherId}
        courseCount={courseCountByTeacherId[viewTeacherId] || 0}
      />

      <ConfirmDialog
        isOpen={Boolean(deactivatingTeacher)}
        onClose={() => setDeactivatingTeacher(null)}
        onConfirm={handleDeactivateConfirm}
        isConfirming={isDeactivating}
        title="Deactivate Teacher"
        message={`Are you sure you want to deactivate "${deactivatingTeacher?.full_name}"?`}
        confirmLabel="Deactivate"
      />

      <ConfirmDialog
        isOpen={Boolean(activatingTeacher)}
        onClose={() => setActivatingTeacher(null)}
        onConfirm={handleActivateConfirm}
        isConfirming={isActivating}
        title="Activate Teacher"
        message={`Are you sure you want to activate "${activatingTeacher?.full_name}"?`}
        confirmLabel="Activate"
      />

      <CreateTeacherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => loadTeachers({ force: true })}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        type="teachers"
        onImport={bulkImportTeachers}
        onDownloadSample={downloadTeacherImportSample}
        onImported={() => loadTeachers({ force: true })}
      />

      <EditTeacherModal
        isOpen={Boolean(editingTeacher)}
        onClose={() => setEditingTeacher(null)}
        teacher={editingTeacher}
        onUpdated={() => loadTeachers({ force: true })}
      />
    </div>
  );
}
