"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LineChart, Search, TrendingUp, Users } from "lucide-react";
import { getTeacherCourseStudents } from "@/services/teacherCoursesService";
import { getDaysAgoDateString } from "@/lib/dates";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";

const PAGE_SIZE = 6;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "progress_desc", label: "Progress (High-Low)" },
  { value: "progress_asc", label: "Progress (Low-High)" },
];

const AVATAR_COLORS = [
  "bg-amber-600",
  "bg-sky-600",
  "bg-emerald-700",
  "bg-violet-600",
  "bg-rose-700",
  "bg-stone-600",
];

const DUMMY_NAME_POOL = [
  "Aisha Rahman",
  "Amelia Warton",
  "Ana Marquez",
  "Andre Costa",
  "Ben Carter",
  "Caleb Moore",
  "Diana Cole",
  "Ethan Brooks",
  "Fatima Noor",
  "Grace Kim",
  "Hassan Ali",
  "Isla Thompson",
];

// Deterministic 0..1 pseudo-random value — avoids Math.random()/Date.now() so
// server and client render the same dummy numbers (no hydration mismatch).
function seededFraction(seed) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function initialsFor(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Placeholder roster generator — used until the real per-course students
// endpoint is confirmed by the backend. Sized to the course's real student count.
function buildDummyStudents(courseId, totalStudents) {
  const count = totalStudents > 0 ? totalStudents : 6;
  const numericSeed = Number(courseId) || 1;

  return Array.from({ length: count }, (_, index) => {
    const seed = numericSeed * 97 + index * 13;
    const name = DUMMY_NAME_POOL[index % DUMMY_NAME_POOL.length];
    const emailHandle = name.toLowerCase().replace(/[^a-z]+/g, ".");
    const progress = Math.round(30 + seededFraction(seed) * 65);
    const quizAvg = Math.round(40 + seededFraction(seed + 1) * 55);
    const lessons = Math.round(5 + seededFraction(seed + 2) * 25);
    const assigns = Math.round(1 + seededFraction(seed + 3) * 8);
    const daysAgo = Math.round(seededFraction(seed + 4) * 60);
    const isActive = seededFraction(seed + 5) > 0.15;

    return {
      id: `dummy-${courseId}-${index}`,
      name,
      email: `${emailHandle}@truetrek.edu`,
      enrolledAt: getDaysAgoDateString(daysAgo),
      progress,
      lessons,
      assigns,
      quizAvg,
      status: isActive ? "ACTIVE" : "INACTIVE",
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    };
  });
}

function formatEnrolledDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CourseStudentsScreen({ courseId, course, onBack }) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");
  const [page, setPage] = useState(1);

  const { data: apiStudents } = useQuery({
    queryKey: ["teacherCourseStudents", courseId],
    queryFn: async () => {
      const response = await getTeacherCourseStudents(courseId);
      return response?.data?.students || response?.data || [];
    },
    enabled: Boolean(courseId),
    retry: false,
  });

  const dummyStudents = useMemo(
    () => buildDummyStudents(courseId, course?.total_students),
    [courseId, course?.total_students],
  );

  const students = apiStudents?.length > 0 ? apiStudents : dummyStudents;

  const filteredStudents = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const filtered = students.filter((student) => {
      if (
        query &&
        !student.name.toLowerCase().includes(query) &&
        !student.email.toLowerCase().includes(query)
      )
        return false;
      if (statusFilter && student.status !== statusFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "progress_desc":
          return b.progress - a.progress;
        case "progress_asc":
          return a.progress - b.progress;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [students, debouncedSearch, statusFilter, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const enrolledCount = students.length;
  const activeCount = students.filter((student) => student.status === "ACTIVE").length;
  const avgProgress = enrolledCount
    ? Math.round(students.reduce((sum, student) => sum + student.progress, 0) / enrolledCount)
    : 0;

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (student) => (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full ${student.avatarColor} text-white flex items-center justify-center font-bold text-[11px] shrink-0`}
          >
            {initialsFor(student.name)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-stone-800 truncate">{student.name}</p>
            <p className="text-[10px] font-mono text-stone-400 truncate">{student.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "enrolledAt",
      header: "Enrolled",
      render: (student) => formatEnrolledDate(student.enrolledAt),
    },
    {
      key: "progress",
      header: "Progress",
      render: (student) => (
        <div className="min-w-[7rem]">
          <span
            className={`text-xs font-mono font-bold ${
              student.progress >= 75 ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {student.progress}%
          </span>
          <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${
                student.progress >= 75 ? "bg-emerald-600" : "bg-amber-600"
              }`}
              style={{ width: `${student.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    { key: "lessons", header: "Lessons", render: (student) => student.lessons },
    { key: "assigns", header: "Assigns", render: (student) => student.assigns },
    {
      key: "quizAvg",
      header: "Quiz Avg",
      render: (student) => (
        <span
          className={`text-xs font-mono font-bold ${
            student.quizAvg >= 70 ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {student.quizAvg}%
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (student) => <StatusBadge status={student.status} />,
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer transition"
          title="View student progress"
          aria-label="View student progress"
        >
          <LineChart className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-stone-500 hover:text-amber-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Courses
      </button>

      <div className="relative bg-white border border-stone-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800 opacity-80" />
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-amber-600 font-mono text-[10px] uppercase tracking-widest font-bold block mb-1">
                Enrolled Students
              </span>
              <h2 className="text-2xl font-serif font-black text-stone-900 truncate">
                {course?.title || "Course"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-xl border border-stone-100 bg-stone-50/80">
              <p className="text-lg font-serif font-bold text-stone-900">{enrolledCount}</p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">Enrolled</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl border border-stone-100 bg-stone-50/80">
              <p className="text-lg font-serif font-bold text-emerald-700">{activeCount}</p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">Active</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl border border-stone-100 bg-stone-50/80">
              <p className="text-lg font-serif font-bold text-amber-700 flex items-center gap-1 justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
                {avgProgress}%
              </p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">Avg Progress</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <SearchBar
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1 shrink-0">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                statusFilter === filter.value
                  ? "bg-white text-amber-800 shadow-xs border border-amber-200"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-52 shrink-0">
          <SearchableSelect options={SORT_OPTIONS} value={sortOption} onChange={setSortOption} />
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        {paginatedStudents.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-stone-50 border border-stone-100 text-stone-400 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-stone-500">No students match your filters.</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={paginatedStudents} keyField="id" />
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`Showing ${Math.min((page - 1) * PAGE_SIZE + 1, filteredStudents.length)}-${Math.min(
            page * PAGE_SIZE,
            filteredStudents.length,
          )} of ${filteredStudents.length}`}
        />
      </div>
    </div>
  );
}
