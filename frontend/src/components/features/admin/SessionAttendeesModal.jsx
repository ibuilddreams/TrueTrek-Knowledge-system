"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { getSessionAttendees } from "@/services/liveSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";

export default function SessionAttendeesModal({ isOpen, onClose, session }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["live-session-attendees", session?.id],
    queryFn: async () => {
      const response = await getSessionAttendees(session.id, { pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen && Boolean(session?.id),
  });

  const columns = [
    {
      key: "student_name",
      header: "Student",
      render: (rsvp) => (
        <div>
          <span className="font-semibold text-ink">{rsvp.student_name || "—"}</span>
          <p className="text-[11px] text-muted font-light">{rsvp.student_email}</p>
        </div>
      ),
    },
    {
      key: "attended",
      header: "Joined",
      render: (rsvp) => (
        <StatusBadge size="lg" status={rsvp.attended ? "COMPLETED" : "PENDING"} />
      ),
    },
    {
      key: "joined_at",
      header: "Joined At",
      render: (rsvp) => (
        <span className="text-muted whitespace-nowrap">
          {rsvp.joined_at ? formatDateTime(rsvp.joined_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Users}
      title="Session Attendees"
      subtitle={session?.title}
      maxWidth="max-w-2xl"
    >
      <p className="text-[11px] text-muted font-light mb-4">
        &ldquo;Joined&rdquo; means the student opened the join link — it records arrival, not how
        long they stayed.
      </p>

      <DataTable
        size="lg"
        columns={columns}
        rows={data || []}
        isLoading={isLoading}
        error={isError ? getApiErrorMessage(error, "Unable to load attendees.") : null}
        onRetry={refetch}
        emptyLabel="No RSVPs yet."
      />
    </Modal>
  );
}
