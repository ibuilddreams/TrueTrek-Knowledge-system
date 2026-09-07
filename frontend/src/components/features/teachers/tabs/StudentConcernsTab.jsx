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
import EmptyState from "@/components/ui/EmptyState";
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
          <span className="font-semibold text-stone-800">{concern.student?.name}</span>
          <p className="text-[11px] text-stone-400 font-light">{concern.student?.email}</p>
        </div>
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
      header: "Admin Notified",
      render: (concern) =>
        concern.requires_admin_attention ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-rose-700">
            <ShieldAlert className="w-3.5 h-3.5" />
            Yes
          </span>
        ) : (
          <span className="text-[11px] font-mono uppercase text-stone-400">No</span>
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
      <div>
        <h2 className="text-lg font-serif font-bold text-stone-900">Flagged Student Concerns</h2>
        <p className="text-sm text-stone-500 font-light mt-0.5">
          Concerns you've flagged from a student's dossier, and how the admin team resolved them.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        {!isLoading && !isError && concerns.length === 0 ? (
          <EmptyState
            size="lg"
            icon={ShieldAlert}
            label="You haven't flagged any student concerns yet."
            description="Open a student's dossier from Enrollment & Scores to flag a concern."
          />
        ) : (
          <>
            <DataTable
              size="lg"
              columns={columns}
              rows={concerns}
              isLoading={isLoading}
              error={isError ? getApiErrorMessage(error, "Unable to load your concerns.") : null}
              onRetry={refetch}
              onRowClick={setSelectedConcern}
              emptyLabel="You haven't flagged any student concerns yet."
            />
            <Pagination
              size="lg"
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`${data?.count || 0} concern${(data?.count || 0) === 1 ? "" : "s"}`}
            />
          </>
        )}
      </div>

      <StudentConcernDetailModal
        isOpen={Boolean(selectedConcern)}
        onClose={() => setSelectedConcern(null)}
        concern={selectedConcern}
      />
    </div>
  );
}
