"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, X as XIcon } from "lucide-react";
import { useAdminFutureClients } from "@/hooks/admin/useAdminFutureClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { approveFutureClientApplication } from "@/services/futureClientsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FutureClientDetailModal from "@/components/features/admin/FutureClientDetailModal";
import RejectApplicationModal from "@/components/features/admin/RejectApplicationModal";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function FutureClientsTab() {
  const { items, status, error, loadFutureClients } = useAdminFutureClients();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [viewApplicationId, setViewApplicationId] = useState(null);
  const [approvingApplication, setApprovingApplication] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [rejectingApplication, setRejectingApplication] = useState(null);

  useEffect(() => {
    loadFutureClients();
  }, [loadFutureClients]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const filteredApplications = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return items.filter((application) => {
      const haystack = `${application.full_name || ""} ${application.email || ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = !statusFilter || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const paginatedApplications = filteredApplications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleApproveConfirm = async () => {
    if (!approvingApplication) return;
    setIsApproving(true);
    try {
      const response = await approveFutureClientApplication(approvingApplication.id);
      toastSuccess(response?.message || "Application approved.");
      setApprovingApplication(null);
      loadFutureClients({ force: true });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to approve application."));
    } finally {
      setIsApproving(false);
    }
  };

  const columns = [
    {
      key: "applicant",
      header: "Applicant",
      render: (application) => (
        <span className="font-semibold text-ink">{application.full_name}</span>
      ),
    },
    { key: "email", header: "Email", render: (application) => application.email },
    {
      key: "courses",
      header: "Courses",
      render: (application) =>
        application.courses?.length
          ? application.courses.map((course) => course.title).join(", ")
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (application) => <StatusBadge size="lg" status={application.status} />,
    },
    {
      key: "submitted",
      header: "Submitted Date",
      render: (application) => formatDate(application.submitted_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (application) => (
        <ActionMenu
          actions={[
            {
              key: "view",
              label: "View Details",
              icon: Eye,
              onSelect: () => setViewApplicationId(application.id),
            },
            application.status === "PENDING" && {
              key: "approve",
              label: "Approve",
              icon: Check,
              onSelect: () => setApprovingApplication(application),
            },
            application.status === "PENDING" && {
              key: "reject",
              label: "Reject",
              icon: XIcon,
              tone: "danger",
              onSelect: () => setRejectingApplication(application),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar size="lg"
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search applicants by name or email..."
          />
          <div className="w-full sm:w-56 shrink-0">
            <SearchableSelect size="lg"
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable size="lg"
          columns={columns}
          rows={paginatedApplications}
          isLoading={status === "loading" || status === "idle"}
          error={status === "failed" ? error : null}
          onRetry={() => loadFutureClients({ force: true })}
          emptyLabel="No applications found."
        />
        <Pagination size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredApplications.length} application${
            filteredApplications.length === 1 ? "" : "s"
          }`}
        />
      </div>

      <FutureClientDetailModal
        isOpen={Boolean(viewApplicationId)}
        onClose={() => setViewApplicationId(null)}
        applicationId={viewApplicationId}
      />

      <ConfirmDialog size="lg"
        isOpen={Boolean(approvingApplication)}
        onClose={() => setApprovingApplication(null)}
        onConfirm={handleApproveConfirm}
        isConfirming={isApproving}
        tone="default"
        title="Approve Application"
        message={`Approve "${approvingApplication?.full_name}"? A student account will be created and they'll be enrolled in their requested course(s).`}
        confirmLabel="Approve"
      />

      <RejectApplicationModal
        isOpen={Boolean(rejectingApplication)}
        onClose={() => setRejectingApplication(null)}
        application={rejectingApplication}
        onRejected={() => {
          setRejectingApplication(null);
          loadFutureClients({ force: true });
        }}
      />
    </div>
  );
}
