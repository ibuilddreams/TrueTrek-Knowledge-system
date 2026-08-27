"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getInitials } from "@/lib/initials";
import { getEligibleRecipients, startConversation } from "@/services/messagingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";

export default function NewMessageModal({ isOpen, onClose, onConversationStarted }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const recipientsQuery = useQuery({
    // The debounced search term is part of the key so each distinct search
    // gets its own cache entry/fetch — the server does the filtering (and
    // caps results), so there's nothing left to filter client-side.
    queryKey: ["messagingRecipients", debouncedSearch],
    queryFn: async () => {
      const response = await getEligibleRecipients({ search: debouncedSearch || undefined });
      return response?.data || [];
    },
    enabled: isOpen,
    // Keep showing the previous results while a new search resolves, instead
    // of blanking the list to an empty/loading state on every keystroke.
    placeholderData: keepPreviousData,
  });

  const startMutation = useMutation({
    mutationFn: (recipientId) => startConversation(recipientId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onConversationStarted(response?.data);
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to start conversation."));
    },
  });

  const recipients = recipientsQuery.data || [];

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={MessageSquarePlus}
      title="New Message"
      subtitle="Start a conversation"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people..."
            className="w-full pl-9 pr-8 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-500"
          />
          {recipientsQuery.isFetching && !recipientsQuery.isLoading && (
            <div
              className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="max-h-72 overflow-y-auto -mx-2">
          {recipientsQuery.isLoading ? (
            <Loader fullScreen={false} label="Loading people..." />
          ) : recipients.length === 0 ? (
            <EmptyState
              icon={MessageSquarePlus}
              label={debouncedSearch ? "No matching people." : "No one to message yet."}
              compact
            />
          ) : (
            <ul className="space-y-1">
              {recipients.map((recipient) => (
                <li key={recipient.id}>
                  <button
                    type="button"
                    disabled={startMutation.isPending}
                    onClick={() => startMutation.mutate(recipient.id)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-stone-50 transition text-left cursor-pointer disabled:opacity-60"
                  >
                    <span className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono overflow-hidden">
                      {recipient.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={recipient.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(recipient.name)
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-stone-800 truncate">
                        {recipient.name}
                      </span>
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">
                        {recipient.role}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
