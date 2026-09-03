"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileWarning } from "lucide-react";
import { getMyTeacherRequests } from "@/services/teacherRequestsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import RequestFormModal from "../RequestFormModal";
import RequestDetailModal from "../RequestDetailModal";

const PAGE_SIZE = 10;

export default function RequestsTab() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-requests", "mine", page],
    queryFn: async () => {
      const response = await getMyTeacherRequests({ page, pageSize: PAGE_SIZE });
      return response?.data || { count: 0, results: [] };
    },
  });

  const requests = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (request) => <span className="font-semibold text-stone-800">{request.title}</span>,
    },
    {
      key: "request_type",
      header: "Type",
      render: (request) => (
        <span className="text-stone-600 font-mono text-xs">{request.request_type_display}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (request) => <StatusBadge size="lg" status={request.status} />,
    },
    {
      key: "created_at",
      header: "Submitted",
      render: (request) => (
        <span className="text-stone-500 whitespace-nowrap">{formatDateTime(request.created_at)}</span>
      ),
    },
    {
      key: "updated_at",
      header: "Last Updated",
      render: (request) => (
        <span className="text-stone-500 whitespace-nowrap">{formatDateTime(request.updated_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg font-serif font-bold text-stone-900">Requests & Issue Reports</h2>
          <p className="text-sm text-stone-500 font-light mt-0.5">
            Ask for a change or flag an error — track it here until the admin team resolves it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider uppercase shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          title="Request a Change / Report an Error"
          aria-label="Request a Change / Report an Error"
        >
          <FileWarning className="w-3.5 h-3.5" />
          New Request
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        {!isLoading && !isError && requests.length === 0 ? (
          <EmptyState
            size="lg"
            icon={FileWarning}
            label="You haven't submitted any requests yet."
            description="Use the button above to request a change or report an error."
            action={
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition"
              >
                New Request
              </button>
            }
          />
        ) : (
          <>
            <DataTable
              size="lg"
              columns={columns}
              rows={requests}
              isLoading={isLoading}
              error={isError ? getApiErrorMessage(error, "Unable to load your requests.") : null}
              onRetry={refetch}
              onRowClick={setSelectedRequest}
              emptyLabel="You haven't submitted any requests yet."
            />
            <Pagination
              size="lg"
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`${data?.count || 0} request${(data?.count || 0) === 1 ? "" : "s"}`}
            />
          </>
        )}
      </div>

      <RequestFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <RequestDetailModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </div>
  );
}
