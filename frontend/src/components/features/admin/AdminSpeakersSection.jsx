"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Trash2, UserRound } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { deleteSpeaker, getSpeakers } from "@/services/liveSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SessionSpeakerFormModal from "./SessionSpeakerFormModal";

export default function AdminSpeakersSection() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [removingSpeaker, setRemovingSpeaker] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["live-session-speakers", debouncedSearch],
    queryFn: async () => {
      const response = await getSpeakers({
        pageSize: 100,
        search: debouncedSearch.trim() || undefined,
      });
      return response?.data?.results || [];
    },
  });

  const speakers = data || [];

  const handleRemove = async () => {
    if (!removingSpeaker) return;
    setIsRemoving(true);
    try {
      const response = await deleteSpeaker(removingSpeaker.id);
      toastSuccess(response?.message || "Speaker removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["live-session-speakers"] });
      setRemovingSpeaker(null);
    } catch (removeError) {
      toastError(getApiErrorMessage(removeError, "Unable to remove this speaker."));
    } finally {
      setIsRemoving(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Speaker",
      render: (speaker) => (
        <div>
          <span className="font-semibold text-ink">{speaker.name}</span>
          {speaker.headline && (
            <p className="text-[11px] text-muted font-light line-clamp-1 max-w-xs">
              {speaker.headline}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "sport",
      header: "Sport",
      render: (speaker) => <span className="text-muted">{speaker.sport || "—"}</span>,
    },
    {
      key: "school",
      header: "School",
      render: (speaker) => <span className="text-muted">{speaker.school || "—"}</span>,
    },
    {
      key: "graduation_year",
      header: "Grad Year",
      render: (speaker) => <span className="text-muted">{speaker.graduation_year || "—"}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      render: (speaker) => (
        <StatusBadge size="lg" status={speaker.is_active ? "ACTIVE" : "ARCHIVED"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (speaker) => (
        <ActionMenu
          actions={[
            {
              key: "edit",
              label: "Edit Speaker",
              icon: Edit3,
              onSelect: () => setEditingSpeaker(speaker),
            },
            {
              key: "remove",
              label: "Deactivate / Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setRemovingSpeaker(speaker),
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
          placeholder="Search speakers by name..."
        />

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-pine hover:bg-moss text-paper text-sm font-semibold font-mono rounded-xl tracking-wider shadow-soft hover:shadow-elevated transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          title="Add a new speaker"
          aria-label="Add a new speaker"
        >
          <UserRound className="w-4 h-4" />
          ADD SPEAKER
        </button>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={speakers}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load speakers.") : null}
          onRetry={refetch}
          emptyLabel="No speakers added yet."
        />
      </div>

      <SessionSpeakerFormModal
        isOpen={isFormOpen || Boolean(editingSpeaker)}
        speaker={editingSpeaker}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSpeaker(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(removingSpeaker)}
        onClose={() => setRemovingSpeaker(null)}
        onConfirm={handleRemove}
        isConfirming={isRemoving}
        tone="danger"
        title="Remove this speaker?"
        message={
          removingSpeaker
            ? `${removingSpeaker.name} will be deactivated if they already appear on a session, so past line-ups stay intact. If they appear on none, they will be deleted outright.`
            : ""
        }
        confirmLabel="Remove Speaker"
      />
    </div>
  );
}
