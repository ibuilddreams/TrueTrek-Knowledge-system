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
          <span className="font-semibold text-stone-800">{student.name}</span>
          <p className="text-[11px] text-stone-400 font-light">{student.email}</p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      render: (student) => <span className="font-mono font-bold text-stone-800">{student.balance.toLocaleString()}</span>,
    },
    {
      key: "total_earned",
      header: "Total Earned",
      render: (student) => <span className="font-mono text-emerald-700">{student.total_earned.toLocaleString()}</span>,
    },
    {
      key: "total_spent",
      header: "Total Spent",
      render: (student) => <span className="font-mono text-rose-600">{student.total_spent.toLocaleString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <SearchBar size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search students by name or email..." />

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={students}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load student points.") : null}
          onRetry={refetch}
          onRowClick={(student) => setSelectedStudent(student)}
          emptyLabel="No students found."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${data?.count || 0} student${(data?.count || 0) === 1 ? "" : "s"}`}
        />
      </div>

      <StudentPointsDetailModal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
      />
    </div>
  );
}
