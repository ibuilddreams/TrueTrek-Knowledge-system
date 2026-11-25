"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getAdminStudentPoints } from "@/services/pointsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StudentPointsDetailModal from "@/components/features/admin/StudentPointsDetailModal";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const PAGE_SIZE = 10;

export default function StudentPointsTab() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-student-points", page, debouncedSearch],
    queryFn: async () => {
      const response = await getAdminStudentPoints({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined });
      return response?.data || { count: 0, results: [] };
    },
  });

  const students = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const columns = [
    {
      key: "name",
      header: "Student",
      render: (student) => (
        <div>
          <span className="font-semibold text-cn-p-ink">{student.name}</span>
          <p className="text-[11px] text-cn-p-ink-2 font-light">{student.email}</p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      render: (student) => <span className="font-bold text-cn-p-ink">{student.balance.toLocaleString()}</span>,
    },
    {
      key: "total_earned",
      header: "Total earned",
      render: (student) => <span className="text-cn-p-ok">{student.total_earned.toLocaleString()}</span>,
    },
    {
      key: "total_spent",
      header: "Total spent",
      render: (student) => <span className="text-cn-p-bad">{student.total_spent.toLocaleString()}</span>,
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Student points"
        subtitle="Balances across the platform. Adjust a balance with a reason the student can see."
      />

      <SearchBar tone="cobalt" size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search students by name or email..." />

      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
        <DataTable tone="cobalt"
          size="lg"
          columns={columns}
          rows={students}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load student points.") : null}
          onRetry={refetch}
          onRowClick={(student) => setSelectedStudent(student)}
          emptyLabel="No students found."
        />
        <div className="px-4 pb-4">

          <Pagination tone="cobalt"
            size="lg"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${data?.count || 0} student${(data?.count || 0) === 1 ? "" : "s"}`}
          />

        </div>
      </div>

      <StudentPointsDetailModal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
      />
    </div>
  );
}
