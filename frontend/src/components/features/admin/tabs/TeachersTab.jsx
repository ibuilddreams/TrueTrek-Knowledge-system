"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Edit3,
  Eye,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAdminTeachers } from "@/hooks/admin/useAdminTeachers";
import { useAdminCourses } from "@/hooks/admin/useAdminCourses";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortConfig } from "@/hooks/useSortConfig";
import { sortRows } from "@/lib/sorting";
import {
  bulkImportTeachers,
  deleteTeacher,
  downloadTeacherImportSample,
  permanentlyDeleteTeacher,
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
import CreateTeacherModal from "@/components/features/admin/CreateTeacherModal";
import EditTeacherModal from "@/components/features/admin/EditTeacherModal";
import BulkImportModal from "@/components/features/admin/BulkImportModal";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";
import AdminTeacherDetailScreen from "@/components/features/admin/AdminTeacherDetailScreen";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default function TeachersTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items, status, error, loadTeachers } = useAdminTeachers();
  const { items: courses, loadCourses } = useAdminCourses();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortConfig, toggleSort] = useSortConfig();

  // The detail screen is a route, not a modal, so it can be linked to and the
  // browser's back button leaves it. A query param rather than a path segment
  // because the portal's route only forwards its first slug — the same shape
  // the teacher portal's own drill-downs use (`?courseId=`).
  const detailId = searchParams.get("teacherId");
  const openDetail = (id) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("teacherId", String(id));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const closeDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("teacherId");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deactivatingTeacher, setDeactivatingTeacher] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activatingTeacher, setActivatingTeacher] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const deleteTeacherMutation = useMutation({
    mutationFn: (id) => permanentlyDeleteTeacher(id),
  });

  useEffect(() => {
    loadTeachers();
    loadCourses();
  }, [loadTeachers, loadCourses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortConfig]);

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
      const haystack =
        `${teacher.full_name || ""} ${teacher.email || ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus =
        !statusFilter || teacher.account_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, debouncedSearch, statusFilter]);

  const teacherSortAccessors = {
    name: (teacher) => teacher.full_name || "",
    email: (teacher) => teacher.email || "",
    status: (teacher) => teacher.account_status || "",
    courses: (teacher) => courseCountByTeacherId[teacher.id] || 0,
    joined: (teacher) => (teacher.date_joined ? new Date(teacher.date_joined) : null),
  };
  const sortedTeachers = sortRows(filteredTeachers, sortConfig, teacherSortAccessors);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedTeachers.length / PAGE_SIZE),
  );
  const paginatedTeachers = sortedTeachers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

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

  const handleDeleteConfirm = async () => {
    if (!deletingTeacher) return;
    try {
      await deleteTeacherMutation.mutateAsync(deletingTeacher.id);
      toastSuccess("Teacher permanently deleted.");
      setDeletingTeacher(null);
      loadTeachers({ force: true });
      loadCourses({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete teacher."));
    }
  };

  const columns = [
    {
      key: "name",
      header: "Teacher name",
      sortable: true,
      render: (teacher) => (
        <span className="font-semibold text-cn-p-ink inline-flex items-center gap-2">
          {teacher.full_name}
          {teacher.is_advisor && (
            <span className="px-2 py-0.5 rounded-full bg-cn-p-soft text-cn-p-accent text-[10px]">
              Advisor
            </span>
          )}
        </span>
      ),
    },
    { key: "email", header: "Email", sortable: true, render: (teacher) => teacher.email },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (teacher) => <StatusBadge tone="cobalt" size="lg" status={teacher.account_status} />,
    },
    {
      key: "courses",
      header: "Assigned courses",
      sortable: true,
      render: (teacher) => courseCountByTeacherId[teacher.id] || 0,
    },
    {
      key: "joined",
      header: "Joined date",
      sortable: true,
      render: (teacher) => formatDate(teacher.date_joined),
    },
    {
      key: "actions",
      header: "Actions",
      render: (teacher) => (
        <ActionMenu
          actions={[
            {
              key: "view",
              label: "View profile",
              icon: Eye,
              onSelect: () => openDetail(teacher.id),
            },
            {
              key: "edit",
              label: "Edit teacher",
              icon: Edit3,
              onSelect: () => setEditingTeacher(teacher),
            },
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
            {
              key: "delete",
              label: "Delete permanently",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingTeacher(teacher),
            },
          ]}
        />
      ),
    },
  ];

  if (detailId) {
    return <AdminTeacherDetailScreen teacherId={detailId} onBack={closeDetail} />;
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Teachers"
        subtitle="Faculty accounts and the courses they own."
      />

      <div className="flex flex-col gap-3 rounded-cn-p border border-cn-p-line bg-cn-p-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar tone="cobalt" size="lg"
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search teachers by name or email..."
          />
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
            title="Bulk add teachers from a CSV or XLSX file"
            aria-label="Bulk add teachers from a CSV or XLSX file"
          >
            <Upload className="w-4 h-4" />
            Bulk add
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center gap-2"
            title="Create a new teacher account"
            aria-label="Create a new teacher account"
          >
            <UserPlus className="w-4 h-4" />
            Add teacher
          </button>
        </div>
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
        <DataTable tone="cobalt" size="lg"
          columns={columns}
          rows={paginatedTeachers}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadTeachers({ force: true })}
          emptyLabel="No teachers found."
          sortConfig={sortConfig}
          onSortChange={toggleSort}
        />
        <div className="px-4 pb-4">

          <Pagination tone="cobalt" size="lg"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${filteredTeachers.length} teacher${filteredTeachers.length === 1 ? "" : "s"}`}
          />

        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deactivatingTeacher)}
        onClose={() => setDeactivatingTeacher(null)}
        onConfirm={handleDeactivateConfirm}
        isConfirming={isDeactivating}
        title="Deactivate teacher"
        message={`Are you sure you want to deactivate "${deactivatingTeacher?.full_name}"?`}
        confirmLabel="Deactivate"
      />

      <ConfirmDialog
        isOpen={Boolean(activatingTeacher)}
        onClose={() => setActivatingTeacher(null)}
        onConfirm={handleActivateConfirm}
        isConfirming={isActivating}
        title="Activate teacher"
        message={`Are you sure you want to activate "${activatingTeacher?.full_name}"?`}
        confirmLabel="Activate"
      />

      <ConfirmDialog
        isOpen={Boolean(deletingTeacher)}
        onClose={() => setDeletingTeacher(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteTeacherMutation.isPending}
        title="Permanently delete teacher"
        message={`Are you sure you want to permanently delete "${deletingTeacher?.full_name}"? This action cannot be undone and will remove them as an instructor from all assigned courses.`}
        confirmLabel="Delete permanently"
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
