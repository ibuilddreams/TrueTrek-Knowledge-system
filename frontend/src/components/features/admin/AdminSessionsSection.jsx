"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Mic, NotebookPen, Radio, Trash2, Users } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteSession, getAdminSessions } from "@/services/liveSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LiveSessionFormModal from "./LiveSessionFormModal";
import SessionAttendeesModal from "./SessionAttendeesModal";
import LiveRoomStage from "@/components/features/liveroom/LiveRoomStage";
import SessionNotesModal from "@/components/features/liveroom/SessionNotesModal";

const PAGE_SIZE = 10;

export default function AdminSessionsSection() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [attendeesSession, setAttendeesSession] = useState(null);
  // The session whose room is open. The room itself is a full-screen portal
  // over the tab (`LiveRoomStage`), so a tab change cannot drop the call.
  const [roomSession, setRoomSession] = useState(null);
  const [notesSession, setNotesSession] = useState(null);
  const [removingSession, setRemovingSession] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-live-sessions", page, debouncedSearch],
    queryFn: async () => {
      const response = await getAdminSessions({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
      });
      return response?.data || { count: 0, results: [] };
    },
  });

  const sessions = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // The API cancels rather than deletes a session students have RSVP'd to,
  // and says which it did — so the response message is surfaced verbatim.
  const handleRemove = async () => {
    if (!removingSession) return;
    setIsRemoving(true);
    try {
      const response = await deleteSession(removingSession.id);
      toastSuccess(response?.message || "Session removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-live-sessions"] });
      setRemovingSession(null);
    } catch (removeError) {
      toastError(getApiErrorMessage(removeError, "Unable to remove this session."));
    } finally {
      setIsRemoving(false);
    }
  };

  // Deliberately the server's word rather than the clock's: the same
  // `can_join` every student's card reads (live_sessions/services.py), which
  // already folds in the session's state, its platform and whether this
  // server can mint a token at all.
  const canOpenRoom = (session) =>
    Boolean(session.is_hosted_here && session.can_join);

  const columns = [
    {
      key: "title",
      header: "Session",
      render: (session) => (
        <div>
          <span className="font-semibold text-ink">{session.title}</span>
          {session.topic && (
            <p className="text-[11px] text-muted font-light line-clamp-1 max-w-xs">
              {session.topic}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "scheduled_at",
      header: "Scheduled",
      render: (session) => (
        <span className="text-muted whitespace-nowrap">
          {formatDateTime(session.scheduled_at)}
        </span>
      ),
    },
    {
      key: "speakers",
      header: "Speakers",
      render: (session) => (
        <span className="text-muted">
          {(session.speakers || []).map((speaker) => speaker.name).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "rsvp_count",
      header: "RSVPs",
      render: (session) => (
        <span className="font-mono font-bold text-ink">{session.rsvp_count ?? 0}</span>
      ),
    },
    {
      key: "live_state",
      header: "State",
      render: (session) => <StatusBadge size="lg" status={session.live_state} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (session) => (
        <ActionMenu
          actions={[
            // Only offered while there is a room to walk into. Opening one
            // is also what starts the notes, so it is the first thing on the
            // list for a session that is running right now.
            ...(canOpenRoom(session)
              ? [
                  {
                    key: "room",
                    label: "Open Room",
                    icon: Radio,
                    onSelect: () => setRoomSession(session),
                  },
                ]
              : []),
            ...(session.notes_available
              ? [
                  {
                    key: "notes",
                    label: "Session Notes",
                    icon: NotebookPen,
                    onSelect: () => setNotesSession(session),
                  },
                ]
              : []),
            {
              key: "edit",
              label: "Edit Session",
              icon: Edit3,
              onSelect: () => setEditingSession(session),
            },
            {
              key: "attendees",
              label: "View Attendees",
              icon: Users,
              onSelect: () => setAttendeesSession(session),
            },
            {
              key: "remove",
              label: "Cancel / Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setRemovingSession(session),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchBar
          size="lg"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search sessions by title..."
        />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-pine hover:bg-moss text-paper text-sm font-semibold font-mono rounded-xl tracking-wider shadow-soft hover:shadow-elevated transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          title="Schedule a new session"
          aria-label="Schedule a new session"
        >
          <Mic className="w-4 h-4" />
          SCHEDULE SESSION
        </button>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={sessions}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load sessions.") : null}
          onRetry={refetch}
          emptyLabel="No sessions scheduled."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${totalCount} session${totalCount === 1 ? "" : "s"}`}
        />
      </div>

      <LiveSessionFormModal
        isOpen={isFormOpen || Boolean(editingSession)}
        session={editingSession}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSession(null);
        }}
      />

      <SessionAttendeesModal
        isOpen={Boolean(attendeesSession)}
        session={attendeesSession}
        onClose={() => setAttendeesSession(null)}
      />

      <SessionNotesModal
        isOpen={Boolean(notesSession)}
        onClose={() => setNotesSession(null)}
        session={notesSession}
      />

      {/* Keyed on the session so switching rooms never hands one call's
          connection to another. Closing it refreshes the table, because the
          RSVP count and the notes a session now has both moved while it was
          open. */}
      {roomSession && (
        <LiveRoomStage
          key={roomSession.id}
          session={roomSession}
          onClose={() => {
            setRoomSession(null);
            queryClient.invalidateQueries({ queryKey: ["admin-live-sessions"] });
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(removingSession)}
        onClose={() => setRemovingSession(null)}
        onConfirm={handleRemove}
        isConfirming={isRemoving}
        tone="danger"
        title="Remove this session?"
        message={
          removingSession
            ? `"${removingSession.title}" will be cancelled if students have already RSVP'd, so they still see it with a reason. If nobody has RSVP'd, it will be deleted outright.`
            : ""
        }
        confirmLabel="Remove Session"
      />
    </div>
  );
}
