"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Calendar, Edit3, HelpCircle, PauseCircle, PlayCircle } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { activateAdminDrillSchedule, deactivateAdminDrillSchedule, getAdminDrillSchedules } from "@/services/dailyDrillService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import DailyDrillScheduleFormModal from "@/components/features/admin/DailyDrillScheduleFormModal";
import DailyDrillQuizModal from "@/components/features/admin/DailyDrillQuizModal";
import DailyDrillPerformanceModal from "@/components/features/admin/DailyDrillPerformanceModal";

const PAGE_SIZE = 10;

export default function DailyDrillsTab() {
  const {
    data: schedules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-daily-drills"],
    queryFn: async () => {
      const response = await getAdminDrillSchedules({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [managingQuizSchedule, setManagingQuizSchedule] = useState(null);
  const [performanceSchedule, setPerformanceSchedule] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredSchedules = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return schedules;
    return schedules.filter((schedule) => (schedule.title || "").toLowerCase().includes(query));
  }, [schedules, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / PAGE_SIZE));
  const paginatedSchedules = filteredSchedules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleStatus = async (schedule) => {
    setTogglingId(schedule.id);
    try {
      if (schedule.status === "PUBLISHED") {
        await deactivateAdminDrillSchedule(schedule.id);
        toastSuccess("Daily Drill deactivated successfully.");
      } else {
        await activateAdminDrillSchedule(schedule.id);
        toastSuccess("Daily Drill activated successfully.");
      }
      refetch();
    } catch (toggleError) {
      toastError(getApiErrorMessage(toggleError, "Unable to update Daily Drill status."));
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Daily Drill",
      render: (schedule) => (
        <div>
          <span className="font-semibold text-stone-800">{schedule.title}</span>
          <p className="text-[11px] text-stone-400 font-light">
            {schedule.quiz_question_count} question{schedule.quiz_question_count === 1 ? "" : "s"}
          </p>
        </div>
      ),
    },
    {
      key: "scheduled_date",
      header: "Scheduled",
      render: (schedule) => <span className="font-mono text-stone-600">{formatDate(schedule.scheduled_date)}</span>,
    },
    {
      key: "reward_points",
      header: "Points",
      render: (schedule) => <span className="font-mono font-bold text-stone-800">{schedule.reward_points}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (schedule) => <StatusBadge size="lg" status={schedule.status} />,
    },
    {
      key: "created_at",
      header: "Created",
      render: (schedule) => formatDate(schedule.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (schedule) => (
        <ActionMenu
          actions={[
            { key: "edit", label: "Edit Drill", icon: Edit3, onSelect: () => setEditingSchedule(schedule) },
            { key: "quiz", label: "Manage Quiz", icon: HelpCircle, onSelect: () => setManagingQuizSchedule(schedule) },
            { key: "performance", label: "View Performance", icon: BarChart3, onSelect: () => setPerformanceSchedule(schedule) },
            {
              key: "toggle",
              label: schedule.status === "PUBLISHED" ? "Deactivate" : "Activate",
              icon: schedule.status === "PUBLISHED" ? PauseCircle : PlayCircle,
              tone: schedule.status === "PUBLISHED" ? "danger" : "default",
              disabled: togglingId === schedule.id,
              onSelect: () => handleToggleStatus(schedule),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchBar size="lg" value={searchInput} onChange={setSearchInput} placeholder="Search Daily Drills by title..." />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-sm font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
          title="Schedule a new Daily Drill"
          aria-label="Schedule a new Daily Drill"
        >
          <Calendar className="w-4 h-4" />
          SCHEDULE DRILL
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={paginatedSchedules}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load Daily Drills.") : null}
          onRetry={refetch}
          emptyLabel="No Daily Drills scheduled yet."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredSchedules.length} drill${filteredSchedules.length === 1 ? "" : "s"}`}
        />
      </div>

      <DailyDrillScheduleFormModal
        isOpen={isFormOpen || Boolean(editingSchedule)}
        schedule={editingSchedule}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSchedule(null);
        }}
      />

      <DailyDrillQuizModal
        isOpen={Boolean(managingQuizSchedule)}
        schedule={managingQuizSchedule}
        onClose={() => setManagingQuizSchedule(null)}
      />

      <DailyDrillPerformanceModal
        isOpen={Boolean(performanceSchedule)}
        schedule={performanceSchedule}
        onClose={() => setPerformanceSchedule(null)}
      />
    </div>
  );
}
