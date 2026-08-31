"use client";

import { useEffect, useState } from "react";
import {
  BookPlus,
  Edit3,
  Eye,
  Layers,
  RefreshCw,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useAdminCourses } from "@/hooks/admin/useAdminCourses";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortConfig } from "@/hooks/useSortConfig";
import { sortRows } from "@/lib/sorting";
import { deleteCourse } from "@/services/coursesService";
import { getCategories } from "@/services/categoriesService";
import { getTags } from "@/services/tagsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import { formatAmount, formatDate } from "@/lib/adminFormatters";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CourseDetailModal from "@/components/features/admin/CourseDetailModal";
import EnrollStudentModal from "@/components/features/admin/EnrollStudentModal";
import CreateCourseModal from "@/components/features/admin/CreateCourseModal";
import AiCourseModal from "@/components/features/admin/AiCourseModal";
import UpdateCourseStatusModal from "@/components/features/admin/UpdateCourseStatusModal";
import ManageModulesModal from "@/components/features/admin/ManageModulesModal";

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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [page, setPage] = useState(1);
  const [sortConfig, toggleSort] = useSortConfig();

  const [viewCourseId, setViewCourseId] = useState(null);
  const [enrollCourseId, setEnrollCourseId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [statusUpdatingCourse, setStatusUpdatingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [managingModulesCourse, setManagingModulesCourse] = useState(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          getCategories(),
          getTags(),
        ]);
        if (!isMounted) return;
        setCategories(categoriesResponse?.data?.results || []);
        setTags(tagsResponse?.data || []);
      } catch (error) {
        if (isMounted)
          toastError(
            getApiErrorMessage(error, "Unable to load filter options."),
          );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshCourses = () =>
    loadCourses({
      force: true,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      tags: tagFilter || undefined,
    });

  useEffect(() => {
    refreshCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, categoryFilter, tagFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, tagFilter, sortConfig]);

  const categoryFilterOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];

  const tagFilterOptions = [
    { value: "", label: "All Tags" },
    ...tags.map((tag) => ({ value: String(tag.id), label: tag.name })),
  ];

  const courseSortAccessors = {
    code: (course) => course.code || "",
    title: (course) => course.title || "",
    category: (course) => course.category?.name || "",
    status: (course) => course.status || "",
    amount: (course) => Number(course.amount) || 0,
    instructors: (course) =>
      course.instructors?.length ? course.instructors.map((i) => i.name).join(", ") : "",
    created_at: (course) => (course.created_at ? new Date(course.created_at) : null),
  };
  const sortedCourses = sortRows(items, sortConfig, courseSortAccessors);

  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / PAGE_SIZE));
  const paginatedCourses = sortedCourses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return;
    setIsDeleting(true);
    try {
      await deleteCourse(deletingCourse.id);
      toastSuccess("Course deleted successfully.");
      setDeletingCourse(null);
      refreshCourses();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete course."));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (course) => (
        <span className="font-mono text-stone-600">{course.code || "—"}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (course) => (
        <span className="font-semibold text-stone-800">{course.title}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (course) => course.category?.name || "—",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (course) => <StatusBadge size="lg" status={course.status} />,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (course) => (
        <span className="font-mono text-stone-600">
          {formatAmount(course.amount)}
        </span>
      ),
    },
    {
      key: "instructors",
      header: "Instructors",
      sortable: true,
      render: (course) =>
        course.instructors?.length
          ? course.instructors.map((i) => i.name).join(", ")
          : "—",
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (course) => formatDate(course.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (course) => (
        <ActionMenu
          actions={[
            {
              key: "view",
              label: "View Details",
              icon: Eye,
              onSelect: () => setViewCourseId(course.id),
            },
            {
              key: "edit",
              label: "Edit",
              icon: Edit3,
              onSelect: () => setEditingCourse(course),
            },
            {
              key: "update-status",
              label: "Update Status",
              icon: RefreshCw,
              onSelect: () => setStatusUpdatingCourse(course),
            },
            {
              key: "enroll",
              label: "Enroll Student",
              icon: UserPlus,
              onSelect: () => setEnrollCourseId(course.id),
            },
            {
              key: "modules",
              label: "Manage Modules",
              icon: Layers,
              onSelect: () => setManagingModulesCourse(course),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingCourse(course),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar size="lg"
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search courses by title..."
          />
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect size="lg"
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect size="lg"
              placeholder="All Categories"
              options={categoryFilterOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect size="lg"
              placeholder="All Tags"
              options={tagFilterOptions}
              value={tagFilter}
              onChange={setTagFilter}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-sm font-semibold font-mono rounded-xl tracking-wider border border-stone-200 shadow-sm transition-all flex items-center gap-2"
            title="Generate a complete draft course with AI"
            aria-label="Generate a complete draft course with AI"
          >
            <Sparkles className="w-4 h-4" />
            CREATE WITH AI
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-sm font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            title="Create a new course"
            aria-label="Create a new course"
          >
            <BookPlus className="w-4 h-4" />
            ADD COURSE
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable size="lg"
          columns={columns}
          rows={paginatedCourses}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={refreshCourses}
          emptyLabel="No courses found."
          onRowClick={(course) => setManagingModulesCourse(course)}
          sortConfig={sortConfig}
          onSortChange={toggleSort}
        />
        <Pagination size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${items.length} course${items.length === 1 ? "" : "s"}`}
        />
      </div>

      <CourseDetailModal
        isOpen={Boolean(viewCourseId)}
        onClose={() => setViewCourseId(null)}
        courseId={viewCourseId}
      />

      <EnrollStudentModal
        isOpen={Boolean(enrollCourseId)}
        onClose={() => setEnrollCourseId(null)}
        defaultCourseId={enrollCourseId}
        onEnrolled={() => loadEnrollments({ force: true })}
      />

      <ConfirmDialog size="lg"
        isOpen={Boolean(deletingCourse)}
        onClose={() => setDeletingCourse(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        title="Delete Course"
        message={`Are you sure you want to delete "${deletingCourse?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <CreateCourseModal
        isOpen={isCreateModalOpen || Boolean(editingCourse)}
        course={editingCourse}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCourse(null);
        }}
        onSaved={refreshCourses}
      />

      <AiCourseModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSaved={refreshCourses}
        onReviewCourse={(course) => setManagingModulesCourse(course)}
      />

      <UpdateCourseStatusModal
        isOpen={Boolean(statusUpdatingCourse)}
        course={statusUpdatingCourse}
        onClose={() => setStatusUpdatingCourse(null)}
        onUpdated={refreshCourses}
      />

      <ManageModulesModal
        isOpen={Boolean(managingModulesCourse)}
        onClose={() => setManagingModulesCourse(null)}
        course={managingModulesCourse}
      />
    </div>
  );
}
