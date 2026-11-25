"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { getMyStudentConcerns } from "@/services/studentConcernsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalEmpty,
  PortalPageHead,
} from "@/components/features/portal/shell/PortalUI";
import StudentConcernDetailModal from "../StudentConcernDetailModal";

const PAGE_SIZE = 10;

export default function StudentConcernsTab() {
  const [page, setPage] = useState(1);
  const [selectedConcern, setSelectedConcern] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student-concerns", "mine", page],
    queryFn: async () => {
      const response = await getMyStudentConcerns({ page, pageSize: PAGE_SIZE });
      return response?.data || { count: 0, results: [] };
    },
  });

  const concerns = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (concern) => (
        <div>
          <span className="font-semibold text-cn-p-ink">{concern.student?.name}</span>
          <p className="text-[11px] text-cn-p-ink-2 font-light">{concern.student?.email}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (concern) => (
        <span className="text-cn-p-ink-2 text-xs">{concern.category_display}</span>
      ),
    },
    {
      key: "requires_admin_attention",
      header: "Admin notified",
      render: (concern) =>
        concern.requires_admin_attention ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-cn-p-bad">
            <ShieldAlert className="w-3.5 h-3.5" />
            Yes
          </span>
        ) : (
          <span className="text-[11px] text-cn-p-ink-2">No</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (concern) => <StatusBadge tone="cobalt" size="lg" status={concern.status} />,
    },
    {
      key: "created_at",
      header: "Flagged",
      render: (concern) => (
        <span className="text-cn-p-ink-2 whitespace-nowrap">{formatDateTime(concern.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Student concerns"
        subtitle="Concerns you have flagged and where the admin team has got to."
      />

      <PortalCard className="overflow-hidden">
        {!isLoading && !isError && concerns.length === 0 ? (
          <PortalEmpty
            icon={ShieldAlert}
            title="You haven't flagged any student concerns yet."
            text="Open a student from Students & scores and choose Flag concern."
          />
        ) : (
          <>
            <DataTable tone="cobalt"
              size="lg"
              columns={columns}
              rows={concerns}
              isLoading={isLoading}
              error={isError ? getApiErrorMessage(error, "Unable to load your concerns.") : null}
              onRetry={refetch}
              onRowClick={setSelectedConcern}
              emptyLabel="You haven't flagged any student concerns yet."
            />
            <div className="px-4 pb-4">
              <Pagination
                tone="cobalt"
                size="lg"
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalLabel={`${data?.count || 0} concern${(data?.count || 0) === 1 ? "" : "s"}`}
              />
            </div>
          </>
        )}
      </PortalCard>

      <StudentConcernDetailModal
        isOpen={Boolean(selectedConcern)}
        onClose={() => setSelectedConcern(null)}
        concern={selectedConcern}
      />
    </div>
  );
}
