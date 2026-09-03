"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle2, Eye, PackageCheck, XCircle } from "lucide-react";
import { getAdminRedemptions, processRedemption } from "@/services/rewardsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CancelRedemptionModal from "@/components/features/admin/CancelRedemptionModal";
import ScheduleRewardModal from "@/components/features/admin/ScheduleRewardModal";
import MarkReadyModal from "@/components/features/admin/MarkReadyModal";
import RedemptionDetailModal from "@/components/features/admin/RedemptionDetailModal";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "READY", label: "Ready" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

// Which fulfillment types go through a scheduling step vs. a "ready with
// code/instructions" step vs. straight to completion from APPROVED — see
// PROJECT.md §6.21's reward-fulfillment section for the full lifecycle table.
const SCHEDULABLE_TYPES = new Set(["SCHEDULED_SESSION", "EVENT_ACCESS"]);
const READY_TYPES = new Set(["DIGITAL_CODE", "DIGITAL_ACCESS", "PHYSICAL_DELIVERY"]);

export default function RedemptionsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewingRedemption, setViewingRedemption] = useState(null);
  const [approvingRedemption, setApprovingRedemption] = useState(null);
  const [schedulingRedemption, setSchedulingRedemption] = useState(null);
  const [markingReadyRedemption, setMarkingReadyRedemption] = useState(null);
  const [completingRedemption, setCompletingRedemption] = useState(null);
  const [cancellingRedemption, setCancellingRedemption] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-redemptions", page, statusFilter],
    queryFn: async () => {
      const response = await getAdminRedemptions({ page, pageSize: PAGE_SIZE, status: statusFilter || undefined });
      return response?.data || { count: 0, results: [] };
    },
  });

  const processMutation = useMutation({
    mutationFn: ({ id, payload }) => processRedemption(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["points"] });
    },
  });

  const redemptions = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const handleApproveConfirm = async () => {
    if (!approvingRedemption) return;
    try {
      await processMutation.mutateAsync({ id: approvingRedemption.id, payload: { status: "APPROVED" } });
      toastSuccess("Redemption approved. It's not fulfilled yet — schedule or complete it next.");
      setApprovingRedemption(null);
    } catch (approveError) {
      toastError(getApiErrorMessage(approveError, "Unable to approve redemption."));
    }
  };

  const handleMarkReadyConfirm = async (notes) => {
    if (!markingReadyRedemption) return;
    try {
      await processMutation.mutateAsync({
        id: markingReadyRedemption.id,
        payload: { status: "READY", fulfillment_notes: notes },
      });
      toastSuccess("Redemption marked as ready.");
      setMarkingReadyRedemption(null);
    } catch (readyError) {
      toastError(getApiErrorMessage(readyError, "Unable to mark redemption as ready."));
    }
  };

  const handleCompleteConfirm = async () => {
    if (!completingRedemption) return;
    try {
      await processMutation.mutateAsync({ id: completingRedemption.id, payload: { status: "COMPLETED" } });
      toastSuccess("Redemption marked as completed.");
      setCompletingRedemption(null);
    } catch (completeError) {
      toastError(getApiErrorMessage(completeError, "Unable to complete redemption."));
    }
  };

  const handleCancelConfirm = async (reason) => {
    if (!cancellingRedemption) return;
    try {
      await processMutation.mutateAsync({
        id: cancellingRedemption.id,
        payload: { status: "CANCELLED", cancellation_reason: reason },
      });
      toastSuccess("Redemption cancelled and points refunded.");
      setCancellingRedemption(null);
    } catch (cancelError) {
      toastError(getApiErrorMessage(cancelError, "Unable to cancel redemption."));
    }
  };

  const buildActions = (redemption) => {
    const fulfillmentType = redemption.reward?.fulfillment_type;
    const actions = [
      { key: "view", label: "View Details", icon: Eye, onSelect: () => setViewingRedemption(redemption) },
    ];

    if (redemption.status === "PENDING") {
      actions.push({
        key: "approve", label: "Approve", icon: CheckCircle2, onSelect: () => setApprovingRedemption(redemption),
      });
    }

    if (redemption.status === "APPROVED") {
      if (SCHEDULABLE_TYPES.has(fulfillmentType)) {
        actions.push({
          key: "schedule", label: "Schedule", icon: Calendar, onSelect: () => setSchedulingRedemption(redemption),
        });
      } else if (READY_TYPES.has(fulfillmentType)) {
        actions.push({
          key: "ready", label: "Mark Ready", icon: PackageCheck, onSelect: () => setMarkingReadyRedemption(redemption),
        });
      } else {
        actions.push({
          key: "complete", label: "Mark Completed", icon: CheckCircle2, onSelect: () => setCompletingRedemption(redemption),
        });
      }
    }

    if (redemption.status === "SCHEDULED") {
      actions.push({
        key: "reschedule", label: "Reschedule", icon: Calendar, onSelect: () => setSchedulingRedemption(redemption),
      });
      actions.push({
        key: "complete", label: "Mark Completed", icon: CheckCircle2, onSelect: () => setCompletingRedemption(redemption),
      });
    }

    if (redemption.status === "READY") {
      actions.push({
        key: "complete", label: "Mark Completed", icon: CheckCircle2, onSelect: () => setCompletingRedemption(redemption),
      });
    }

    if (["PENDING", "APPROVED", "SCHEDULED", "READY"].includes(redemption.status)) {
      actions.push({
        key: "cancel", label: "Cancel & Refund", icon: XCircle, tone: "danger", onSelect: () => setCancellingRedemption(redemption),
      });
    }

    return actions;
  };

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (redemption) => (
        <div>
          <span className="font-semibold text-stone-800">{redemption.student?.name}</span>
          <p className="text-[11px] text-stone-400 font-light">{redemption.student?.email}</p>
        </div>
      ),
    },
    {
      key: "reward",
      header: "Reward",
      render: (redemption) => redemption.reward?.name,
    },
    {
      key: "points_cost",
      header: "Points",
      render: (redemption) => (
        <span className="font-mono font-bold text-stone-800">{redemption.points_cost.toLocaleString()}</span>
      ),
    },
    {
      key: "created_at",
      header: "Redeemed",
      render: (redemption) => (
        <span className="text-stone-500 whitespace-nowrap">{formatDateTime(redemption.created_at)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (redemption) => <StatusBadge size="lg" status={redemption.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (redemption) => <ActionMenu actions={buildActions(redemption)} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-mono text-stone-700 focus:border-amber-600 focus:outline-none"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={redemptions}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load redemptions.") : null}
          onRetry={refetch}
          emptyLabel="No redemptions found."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${data?.count || 0} redemption${(data?.count || 0) === 1 ? "" : "s"}`}
        />
      </div>

      <RedemptionDetailModal
        isOpen={Boolean(viewingRedemption)}
        onClose={() => setViewingRedemption(null)}
        redemption={viewingRedemption}
      />

      <ConfirmDialog
        size="lg"
        tone="default"
        isOpen={Boolean(approvingRedemption)}
        onClose={() => setApprovingRedemption(null)}
        onConfirm={handleApproveConfirm}
        isConfirming={processMutation.isPending}
        title="Approve Redemption"
        message={`Approve "${approvingRedemption?.reward?.name}" for ${approvingRedemption?.student?.name}? This does not fulfill the reward yet.`}
        confirmLabel="Approve"
      />

      <ScheduleRewardModal
        isOpen={Boolean(schedulingRedemption)}
        onClose={() => setSchedulingRedemption(null)}
        redemption={schedulingRedemption}
      />

      <MarkReadyModal
        isOpen={Boolean(markingReadyRedemption)}
        onClose={() => setMarkingReadyRedemption(null)}
        onConfirm={handleMarkReadyConfirm}
        redemption={markingReadyRedemption}
        isSubmitting={processMutation.isPending}
      />

      <ConfirmDialog
        size="lg"
        tone="default"
        isOpen={Boolean(completingRedemption)}
        onClose={() => setCompletingRedemption(null)}
        onConfirm={handleCompleteConfirm}
        isConfirming={processMutation.isPending}
        title="Mark as Completed"
        message={`Mark "${completingRedemption?.reward?.name}" as fulfilled for ${completingRedemption?.student?.name}?`}
        confirmLabel="Mark Completed"
      />

      <CancelRedemptionModal
        isOpen={Boolean(cancellingRedemption)}
        onClose={() => setCancellingRedemption(null)}
        onConfirm={handleCancelConfirm}
        redemption={cancellingRedemption}
        isSubmitting={processMutation.isPending}
      />
    </div>
  );
}
