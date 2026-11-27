"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ListChecks, Target, Trophy } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getQuizCourseProgress, getQuizStudentAttempts, getQuizzes } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { QUIZ_STATUS_OPTIONS, PAGE_SIZE, BULK_FETCH_SIZE } from "./progressConstants";
import { formatSeconds, paginate } from "./progressUtils";
import QuizAttemptDetailModal from "./QuizAttemptDetailModal";
import { makeSkin } from "@/lib/portalSkin";

// Rendered by both the admin and the teacher portal, so the palette comes
// from the caller: "porcelain" (the default, unchanged) or the signed-in
// portal's cobalt.
// Defaults to cobalt: every call site (Admin and Teacher → Course progress)
// already passes it, and the porcelain path below is the old admin skin that
// nothing renders any more. Left reachable via `tone="porcelain"` rather than
// deleted, but a caller that forgets the prop should get the live design, not
// a cream dialog over a white screen.
export default function QuizProgressPanel({ courseId, tone = "cobalt" }) {
  const skin = makeSkin(tone);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [quizFilter, setQuizFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [attemptHistory, setAttemptHistory] = useState(null);
  const [viewingAttemptId, setViewingAttemptId] = useState(null);

  const { data: quizzes = [] } = useQuery({
    queryKey: ["quizzes", { courseId }],
    queryFn: async () => {
      const response = await getQuizzes({ courseId });
      return response?.data?.results || [];
    },
    enabled: Boolean(courseId),
  });

  const progressQuery = useQuery({
    queryKey: ["quiz-course-progress", courseId],
    queryFn: async () => {
      const response = await getQuizCourseProgress(courseId, { pageSize: BULK_FETCH_SIZE });
      return response?.data;
    },
    enabled: Boolean(courseId),
  });

  const attemptsQuery = useQuery({
    queryKey: ["quiz-student-attempts", attemptHistory?.quizId, attemptHistory?.studentId],
    queryFn: async () => {
      const response = await getQuizStudentAttempts(attemptHistory.quizId, attemptHistory.studentId);
      return response?.data || [];
    },
    enabled: Boolean(attemptHistory),
  });

  const stats = progressQuery.data?.stats;
  const allRows = useMemo(
    () =>
      (progressQuery.data?.results || []).map((row) => ({
        ...row,
        rowId: `${row.quiz.id}-${row.student.id}`,
      })),
    [progressQuery.data],
  );

  const filteredRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return allRows.filter((row) => {
      if (quizFilter && String(row.quiz.id) !== quizFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (
        query &&
        !row.student.name?.toLowerCase().includes(query) &&
        !row.student.email?.toLowerCase().includes(query)
      )
        return false;
      return true;
    });
  }, [allRows, debouncedSearch, quizFilter, statusFilter]);

  const { totalPages, safePage, pageItems } = paginate(filteredRows, page, PAGE_SIZE);

  const quizFilterOptions = useMemo(
    () => [
      { value: "", label: "All quizzes" },
      ...quizzes.map((quiz) => ({ value: String(quiz.id), label: quiz.title })),
    ],
    [quizzes],
  );

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (row) => (
        <div className="min-w-0">
          <p className={skin("text-sm font-semibold text-stone-800 truncate")}>{row.student.name}</p>
          <p className={skin("text-[11px] font-mono text-stone-400 truncate")}>{row.student.email}</p>
        </div>
      ),
    },
    { key: "quiz", header: "Quiz", render: (row) => row.quiz.title },
    { key: "status", header: "Status", render: (row) => <StatusBadge tone={tone} status={row.status} size="lg" /> },
    {
      key: "score",
      header: "Score",
      render: (row) => (row.percentage !== null ? `${row.percentage}%` : "—"),
    },
    {
      key: "attempts_count",
      header: "Attempts",
      render: (row) => <span>{row.attempts_count}</span>,
    },
    {
      key: "time_taken_seconds",
      header: "Time taken",
      render: (row) => formatSeconds(row.time_taken_seconds),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-3 justify-end">
          {row.attempts_count > 0 ? (
            <button
              type="button"
              onClick={() =>
                setAttemptHistory({
                  quizId: row.quiz.id,
                  studentId: row.student.id,
                  label: `${row.student.name} · ${row.quiz.title}`,
                })
              }
              className={skin(`text-xs font-semibold transition cursor-pointer ${tone === "cobalt" ? "text-cn-p-accent hover:underline" : "font-mono text-amber-700 hover:text-amber-900"}`)}
            >
              History
            </button>
          ) : (
            <span className={skin("text-xs font-mono text-stone-300")}>—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard tone={tone} label="Average score" value={`${stats?.average_score ?? 0}%`} icon={Target} size="lg" />
        <StatCard tone={tone}
          label="Pass rate"
          value={`${stats?.pass_rate ?? 0}%`}
          icon={Trophy}
          accent="emerald"
          size="lg"
        />
        <StatCard tone={tone}
          label="Total attempts"
          value={stats?.total_attempts ?? "—"}
          icon={ListChecks}
          accent="stone"
          size="lg"
        />
        <StatCard tone={tone}
          label="Completed quizzes"
          value={stats?.completed_quizzes ?? "—"}
          icon={CheckCircle2}
          accent="rose"
          size="lg"
        />
        <StatCard tone={tone}
          label="Abandoned/expired"
          value={stats?.abandoned_attempts ?? "—"}
          icon={AlertTriangle}
          accent="amber"
          size="lg"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar tone={tone}
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search students by name or email..."
          size="lg"
        />
        <div className="w-full sm:w-56 shrink-0">
          <SearchableSelect tone={tone}
            options={quizFilterOptions}
            value={quizFilter}
            onChange={(value) => {
              setQuizFilter(value);
              setPage(1);
            }}
            placeholder="All Quizzes"
            size="lg"
          />
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <SearchableSelect tone={tone}
            options={QUIZ_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            placeholder="All Statuses"
            size="lg"
          />
        </div>
      </div>

      <div className={skin("bg-white border border-stone-200 rounded-2xl shadow-sm p-6")}>
        <DataTable tone={tone}
          columns={columns}
          rows={pageItems}
          keyField="rowId"
          isLoading={progressQuery.isLoading}
          error={
            progressQuery.isError
              ? getApiErrorMessage(progressQuery.error, "Unable to load quiz progress.")
              : null
          }
          onRetry={() => progressQuery.refetch()}
          emptyLabel="No quizzes or attempts found."
          size="lg"
        />
        <Pagination tone={tone}
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredRows.length} record${filteredRows.length === 1 ? "" : "s"}`}
          size="lg"
        />
      </div>

      <Modal
        isOpen={Boolean(attemptHistory)}
        onClose={() => setAttemptHistory(null)}
        icon={ListChecks}
        title="Attempt history"
        subtitle={attemptHistory?.label}
      >
        {attemptsQuery.isLoading && <p className={skin("text-sm text-stone-400")}>Loading...</p>}
        <ul className="space-y-2">
          {(attemptsQuery.data || []).map((attempt) => (
            <li
              key={attempt.attempt_id}
              className={skin("flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-stone-100 bg-stone-50/60")}
            >
              <div>
                <p className={skin("text-sm font-semibold text-stone-800")}>Attempt {attempt.attempt_number}</p>
                <p className={skin("text-[11px] font-mono text-stone-400 mt-0.5")}>
                  {formatDateTime(attempt.started_at)} · {formatSeconds(attempt.time_taken_seconds)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p
                    className={skin(`text-sm font-mono font-bold ${
                      attempt.is_passed ? "text-emerald-700" : "text-rose-600"
                    }`)}
                  >
                    {attempt.percentage !== null ? `${attempt.percentage}%` : "—"}
                  </p>
                  <p className={skin("text-[11px] font-mono uppercase text-stone-400")}>{attempt.status}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingAttemptId(attempt.attempt_id)}
                  className={skin("text-xs font-mono font-semibold text-amber-700 hover:text-amber-900 transition cursor-pointer shrink-0")}
                >
                  View
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Modal>

      <QuizAttemptDetailModal tone={tone}
        attemptId={viewingAttemptId}
        onClose={() => setViewingAttemptId(null)}
        courseId={courseId}
      />
    </div>
  );
}
