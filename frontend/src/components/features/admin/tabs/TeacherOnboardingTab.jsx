"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Check, Film, X } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  getAdminTeacherApplicationSummary,
  getAdminTeacherApplications,
} from "@/services/teacherOnboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABELS,
} from "@/constants/teacherOnboarding";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import TeacherOnboardingDetailModal from "@/components/features/admin/TeacherOnboardingDetailModal";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  ...Object.values(APPLICATION_STATUS).map((status) => ({
    value: status,
    label: APPLICATION_STATUS_LABELS[status],
  })),
];

// The three numbers an admin actually acts on, in the order they act on them.
const SUMMARY_CARDS = [
  { key: "AWAITING_REVIEW", label: "Awaiting review", accent: "text-gold" },
  { key: APPLICATION_STATUS.APPROVED, label: "Approved", accent: "text-pine" },
  { key: APPLICATION_STATUS.DRAFT, label: "Still drafting", accent: "text-muted" },
];

/**
 * Admin → Teacher Applications: the review queue for teachers who signed
 * themselves up.
 *
 * Shaped like `TeacherRequestsTab` (search + filter + table + detail modal)
 * because it is the same job: a list of things people sent in, each of which
 * an admin opens and decides on.
 */
export default function TeacherOnboardingTab() {
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  // A notification about a submitted application deep-links straight to it.
  const requestedId = searchParams.get("application");
  useEffect(() => {
    if (requestedId) setSelectedId(Number(requestedId));
  }, [requestedId]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-onboarding", "admin", page, statusFilter, debouncedSearch],
    queryFn: async () => {
      const response = await getAdminTeacherApplications({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      });
      return response?.data || { count: 0, results: [] };
    },
  });

  const summaryQuery = useQuery({
    queryKey: ["teacher-onboarding", "admin", "summary"],
    queryFn: async () => (await getAdminTeacherApplicationSummary())?.data || {},
  });

  const applications = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const columns = [
    {
      key: "teacher",
      header: "Teacher",
      render: (row) => (
        <div className="min-w-0">
          <span className="font-semibold text-ink">{row.teacher_name || "—"}</span>
          <p className="text-[11px] text-muted font-light truncate">{row.teacher_email}</p>
        </div>
      ),
    },
    {
      key: "headline",
      header: "Headline",
      render: (row) => (
        <span className="text-muted font-light line-clamp-2">{row.headline || "—"}</span>
      ),
    },
    {
      key: "experience",
      header: "Experience",
      render: (row) =>
        row.years_of_experience === null || row.years_of_experience === undefined ? (
          <span className="text-muted">—</span>
        ) : (
          <span className="text-muted whitespace-nowrap">
            {row.years_of_experience} yr{row.years_of_experience === 1 ? "" : "s"}
          </span>
        ),
    },
    {
      key: "evidence",
      header: "Evidence",
      render: (row) => (
        <div className="flex items-center gap-3 text-muted">
          <span className="inline-flex items-center gap-1 text-xs font-mono whitespace-nowrap">
            {row.credentials_count} doc{row.credentials_count === 1 ? "" : "s"}
          </span>
          <span
            className="inline-flex items-center gap-1 text-xs font-mono"
            title={row.has_intro_video ? "Intro video provided" : "No intro video"}
          >
            <Film className="w-3.5 h-3.5" />
            {row.has_intro_video ? (
              <Check className="w-3.5 h-3.5 text-pine" />
            ) : (
              <X className="w-3.5 h-3.5 text-clay" />
            )}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge size="lg" status={row.status} />,
    },
    {
      key: "submitted_at",
      header: "Submitted",
      render: (row) => (
        <span className="text-muted whitespace-nowrap">
          {row.submitted_at ? formatDateTime(row.submitted_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUMMARY_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-paper border border-line rounded-card shadow-soft px-5 py-4"
          >
            <p className="text-[10px] font-sans uppercase tracking-widest text-muted font-medium">
              {card.label}
            </p>
            <p className={`text-2xl font-serif font-light mt-1 ${card.accent}`}>
              {summaryQuery.data?.[card.key] ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
        <SearchBar
          size="lg"
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search by teacher or headline..."
        />
        <div className="w-full sm:w-56 shrink-0">
          <SearchableSelect
            size="lg"
            placeholder="All Statuses"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={applications}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load teacher applications.") : null}
          onRetry={refetch}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyLabel="No teacher applications found."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${data?.count || 0} application${(data?.count || 0) === 1 ? "" : "s"}`}
        />
      </div>

      <TeacherOnboardingDetailModal
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        applicationId={selectedId}
      />
    </div>
  );
}
