"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, UserPlus } from "lucide-react";
import { useAdminCourses } from "@/hooks/admin/useAdminCourses";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteCourse } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import { formatDate } from "@/lib/adminFormatters";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CourseDetailModal from "@/components/features/admin/CourseDetailModal";
import EnrollStudentModal from "@/components/features/admin/EnrollStudentModal";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
];

export default function CoursesTab() {
  const { items, status, error, loadCourses } = useAdminCourses();
  const { loadEnrollments } = useAdminEnrollments();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [viewCourseId, setViewCourseId] = useState(null);
  const [enrollCourseId, setEnrollCourseId] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const filteredCourses = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return items.filter((course) => {
      const matchesSearch = !query || course.title.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const paginatedCourses = filteredCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return;
    setIsDeleting(true);
    try {
      await deleteCourse(deletingCourse.id);
      toastSuccess("Course deleted successfully.");
      setDeletingCourse(null);
      loadCourses({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete course."));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (course) => <span className="font-semibold text-stone-800">{course.title}</span>,
    },
    { key: "category", header: "Category", render: (course) => course.category?.name || "—" },
    { key: "status", header: "Status", render: (course) => <StatusBadge status={course.status} /> },
    {
      key: "instructors",
      header: "Instructors",
      render: (course) => (course.instructors?.length ? course.instructors.map((i) => i.name).join(", ") : "—"),
    },
    { key: "created_at", header: "Created", render: (course) => formatDate(course.created_at) },
    {
      key: "actions",
      header: "Actions",
      render: (course) => (
        <ActionMenu
          actions={[
            { key: "view", label: "View Details", icon: Eye, onSelect: () => setViewCourseId(course.id) },
            { key: "enroll", label: "Enroll Student", icon: UserPlus, onSelect: () => setEnrollCourseId(course.id) },
            { key: "delete", label: "Delete", icon: Trash2, tone: "danger", onSelect: () => setDeletingCourse(course) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search courses by title..." />
        <div className="w-full sm:w-56">
          <SearchableSelect
            placeholder="All Statuses"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          columns={columns}
          rows={paginatedCourses}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadCourses({ force: true })}
          emptyLabel="No courses found."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredCourses.length} course${filteredCourses.length === 1 ? "" : "s"}`}
        />
      </div>

      <CourseDetailModal isOpen={Boolean(viewCourseId)} onClose={() => setViewCourseId(null)} courseId={viewCourseId} />

      <EnrollStudentModal
        isOpen={Boolean(enrollCourseId)}
        onClose={() => setEnrollCourseId(null)}
        defaultCourseId={enrollCourseId}
        onEnrolled={() => loadEnrollments({ force: true })}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingCourse)}
        onClose={() => setDeletingCourse(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        title="Delete Course"
        message={`Are you sure you want to delete "${deletingCourse?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
