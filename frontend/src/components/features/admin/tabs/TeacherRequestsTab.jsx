"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileWarning } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getAdminTeacherRequests } from "@/services/teacherRequestsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import TeacherRequestDetailModal from "@/components/features/admin/TeacherRequestDetailModal";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "CHANGE_REQUEST", label: "Request a change" },
  { value: "ERROR_REPORT", label: "Report an error" },
];

export default function TeacherRequestsTab() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-requests", "admin", page, statusFilter, typeFilter, debouncedSearch],
    queryFn: async () => {
      const response = await getAdminTeacherRequests({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        requestType: typeFilter || undefined,
        search: debouncedSearch || undefined,
      });
      return response?.data || { count: 0, results: [] };
    },
  });

  const requests = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const columns = [
    {
      key: "teacher",
      header: "Teacher",
      render: (request) => (
        <div>
          <span className="font-semibold text-cn-p-ink">{request.teacher?.name}</span>
          <p className="text-[11px] text-cn-p-ink-2 font-light">{request.teacher?.email}</p>
        </div>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (request) => request.title,
    },
    {
      key: "request_type",
      header: "Type",
      render: (request) => (
        <span className="text-cn-p-ink-2 text-xs">{request.request_type_display}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (request) => <StatusBadge tone="cobalt" size="lg" status={request.status} />,
    },
    {
      key: "created_at",
      header: "Submitted",
      render: (request) => (
        <span className="text-cn-p-ink-2 whitespace-nowrap">{formatDateTime(request.created_at)}</span>
      ),
    },
    {
      key: "updated_at",
      header: "Last updated",
      render: (request) => (
        <span className="text-cn-p-ink-2 whitespace-nowrap">{formatDateTime(request.updated_at)}</span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Teacher requests"
        subtitle="Content changes and error reports from faculty."
      />

      <div className="flex flex-col gap-3 rounded-cn-p border border-cn-p-line bg-cn-p-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar tone="cobalt"
            size="lg"
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
            placeholder="Search by title or teacher..."
          />
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect tone="cobalt"
              size="lg"
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
            />
          </div>
          <div className="w-full sm:w-56 shrink-0">
            <SearchableSelect tone="cobalt"
              size="lg"
              placeholder="All Types"
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={handleFilterChange(setTypeFilter)}
            />
          </div>
        </div>
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
        <DataTable tone="cobalt"
          size="lg"
          columns={columns}
          rows={requests}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load teacher requests.") : null}
          onRetry={refetch}
          onRowClick={setSelectedRequest}
          emptyLabel="No teacher requests found."
        />
        <div className="px-4 pb-4">

          <Pagination tone="cobalt"
            size="lg"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${data?.count || 0} request${(data?.count || 0) === 1 ? "" : "s"}`}
          />

        </div>
      </div>

      <TeacherRequestDetailModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </div>
  );
}
