"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { useAdminCourses } from "@/hooks/admin/useAdminCourses";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

export default function TeachersTab() {
  const { items: courses, status, error, loadCourses } = useAdminCourses();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const teachers = useMemo(() => {
    const teacherMap = new Map();
    courses.forEach((course) => {
      (course.instructors || []).forEach((instructor) => {
        const existing = teacherMap.get(instructor.id);
        if (existing) {
          existing.courseTitles.push(course.title);
        } else {
          teacherMap.set(instructor.id, {
            id: instructor.id,
            name: instructor.name,
            email: instructor.email,
            courseTitles: [course.title],
          });
        }
      });
    });
    return Array.from(teacherMap.values());
  }, [courses]);

  const filteredTeachers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return teachers;
    return teachers.filter((teacher) => `${teacher.name} ${teacher.email}`.toLowerCase().includes(query));
  }, [teachers, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const paginatedTeachers = filteredTeachers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key: "name",
      header: "Teacher Name",
      render: (teacher) => <span className="font-semibold text-stone-800">{teacher.name}</span>,
    },
    { key: "email", header: "Email", render: (teacher) => teacher.email },
    { key: "courses", header: "Assigned Courses", render: (teacher) => teacher.courseTitles.join(", ") },
    { key: "status", header: "Status", render: () => "—" },
    { key: "joined", header: "Joined Date", render: () => "—" },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200/60 text-amber-800 rounded-xl p-4 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="font-light leading-relaxed">
          The backend does not expose a dedicated teacher roster API. This list is derived from teachers already
          assigned as instructors on at least one course, so status, joined date, and profile management actions
          are not available here.
        </p>
      </div>

      <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search teachers by name or email..." />

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          columns={columns}
          rows={paginatedTeachers}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadCourses({ force: true })}
          emptyLabel="No teachers found."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredTeachers.length} teacher${filteredTeachers.length === 1 ? "" : "s"}`}
        />
      </div>
    </div>
  );
}
