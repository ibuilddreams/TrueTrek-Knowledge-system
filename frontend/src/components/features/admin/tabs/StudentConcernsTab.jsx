"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getAdminStudentConcern, getAdminStudentConcerns } from "@/services/studentConcernsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import StudentConcernDetailModal from "@/components/features/admin/StudentConcernDetailModal";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "SAFETY", label: "Safety" },
  { value: "OTHER", label: "Other" },
];

const ATTENTION_FILTER_OPTIONS = [
  { value: "", label: "All Concerns" },
  { value: "true", label: "Needs Admin Attention" },
];

export default function StudentConcernsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [attentionFilter, setAttentionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedConcern, setSelectedConcern] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "student-concerns",
      "admin",
      page,
      statusFilter,
      categoryFilter,
      attentionFilter,
      debouncedSearch,
    ],
    queryFn: async () => {
      const response = await getAdminStudentConcerns({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        requiresAdminAttention: attentionFilter || undefined,
        search: debouncedSearch || undefined,
      });
      return response?.data || { count: 0, results: [] };
    },
  });

  const concerns = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  // Deep-linked from the notification bell (?concern=<id>) — fetch and open
  // that concern directly regardless of which page/filter it'd otherwise be on.
  useEffect(() => {
    const concernId = searchParams.get("concern");
    if (!concernId) return;

    let isMounted = true;
    (async () => {
      try {
        const response = await getAdminStudentConcern(concernId);
        if (isMounted) setSelectedConcern(response?.data || null);
      } catch {
        // ignore — the concern may have been removed
      }
    })();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("concern");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (concern) => (
        <div>
          <span className="font-semibold text-stone-800">{concern.student?.name}</span>
          <p className="text-[11px] text-stone-400 font-light">{concern.student?.email}</p>
        </div>
      ),
    },
    {
      key: "teacher",
      header: "Flagged By",
      render: (concern) => (
        <span className="text-stone-600">{concern.teacher?.name}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (concern) => (
        <span className="text-stone-600 font-mono text-xs">{concern.category_display}</span>
      ),
    },
    {
      key: "requires_admin_attention",
      header: "Attention",
      render: (concern) =>
        concern.requires_admin_attention ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-rose-700">
            <ShieldAlert className="w-3.5 h-3.5" />
            Needed
          </span>
        ) : (
          <span className="text-[11px] font-mono uppercase text-stone-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (concern) => <StatusBadge size="lg" status={concern.status} />,
    },
    {
      key: "created_at",
      header: "Flagged",
      render: (concern) => (
        <span className="text-stone-500 whitespace-nowrap">{formatDateTime(concern.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar
            size="lg"
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
            placeholder="Search by student, teacher, or description..."
          />
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect
              size="lg"
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect
              size="lg"
              placeholder="All Categories"
              options={CATEGORY_FILTER_OPTIONS}
              value={categoryFilter}
              onChange={handleFilterChange(setCategoryFilter)}
            />
          </div>
          <div className="w-full sm:w-56 shrink-0">
            <SearchableSelect
              size="lg"
              placeholder="All Concerns"
              options={ATTENTION_FILTER_OPTIONS}
              value={attentionFilter}
              onChange={handleFilterChange(setAttentionFilter)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={concerns}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load student concerns.") : null}
          onRetry={refetch}
          onRowClick={setSelectedConcern}
          emptyLabel="No student concerns found."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${data?.count || 0} concern${(data?.count || 0) === 1 ? "" : "s"}`}
        />
      </div>

      <StudentConcernDetailModal
        isOpen={Boolean(selectedConcern)}
        onClose={() => setSelectedConcern(null)}
        concern={selectedConcern}
      />
    </div>
  );
}
