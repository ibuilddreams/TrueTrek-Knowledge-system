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
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPageHead,
} from "@/components/features/portal/shell/PortalUI";
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
      render: (request) => <span className="font-semibold text-cn-p-ink">{request.title}</span>,
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
        title="Requests"
        subtitle="Ask the admin team to change course content, or report something broken."
        >
        <PortalButton onClick={() => setIsFormOpen(true)}>
          <FileWarning className="h-4 w-4" />
          New request
        </PortalButton>
      </PortalPageHead>

      <PortalCard className="overflow-hidden">
        {!isLoading && !isError && requests.length === 0 ? (
          <PortalEmpty
            icon={FileWarning}
            title="You haven't submitted any requests yet."
            text="Use the button above to request a change or report an error."
              >
                <PortalButton size="sm" onClick={() => setIsFormOpen(true)} className="mt-2">
              New request
            </PortalButton>
          </PortalEmpty>
        ) : (
          <>
            <DataTable tone="cobalt"
              size="lg"
              columns={columns}
              rows={requests}
              isLoading={isLoading}
              error={isError ? getApiErrorMessage(error, "Unable to load your requests.") : null}
              onRetry={refetch}
              onRowClick={setSelectedRequest}
              emptyLabel="You haven't submitted any requests yet."
            />
            <div className="px-4 pb-4">
              <Pagination
                tone="cobalt"
                size="lg"
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalLabel={`${data?.count || 0} request${(data?.count || 0) === 1 ? "" : "s"}`}
              />
            </div>
          </>
        )}
      </PortalCard>

      <RequestFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <RequestDetailModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </div>
  );
}
