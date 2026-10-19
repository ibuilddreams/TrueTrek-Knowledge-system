"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Headphones, Mic, PlayCircle, Radio } from "lucide-react";
import {
  cancelSessionRsvp,
  getSessionJoinLink,
  rsvpToSession,
} from "@/services/liveSessionsService";
import {
  usePastSessions,
  useSessionStats,
  useUpcomingSessions,
} from "@/hooks/student/useLiveSessions";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import StatCard from "@/components/ui/StatCard";
import TabNav from "@/components/ui/TabNav";
import SessionList from "../live/SessionList";
import SessionDetailModal from "../live/SessionDetailModal";

const SECTIONS = [
  { id: "upcoming", label: "Upcoming Sessions", icon: Radio },
  { id: "past", label: "Past & Recordings", icon: PlayCircle },
];

export default function WarRoomLiveTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("upcoming");
  const [detailSession, setDetailSession] = useState(null);

  const upcoming = useUpcomingSessions();
  const past = usePastSessions({ enabled: activeSection === "past" });
  const { data: stats } = useSessionStats();

  const refreshSessions = () => {
    queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
  };

  const rsvpMutation = useMutation({ mutationFn: (id) => rsvpToSession(id) });
  const cancelMutation = useMutation({ mutationFn: (id) => cancelSessionRsvp(id) });

  const handleRsvp = async (session) => {
    try {
      const response = await rsvpMutation.mutateAsync(session.id);
      toastSuccess(`You're on the list for "${session.title}".`);
      setDetailSession((current) =>
        current?.id === session.id ? response?.data || current : current,
      );
      refreshSessions();
    } catch (rsvpError) {
      toastError(getApiErrorMessage(rsvpError, "Unable to reserve your spot."));
    }
  };

  const handleCancelRsvp = async (session) => {
    try {
      const response = await cancelMutation.mutateAsync(session.id);
      toastSuccess("RSVP cancelled.");
      setDetailSession((current) =>
        current?.id === session.id ? response?.data || current : current,
      );
      refreshSessions();
    } catch (cancelError) {
      toastError(getApiErrorMessage(cancelError, "Unable to cancel your RSVP."));
    }
  };

  // The meeting link is withheld until the room opens, so it's fetched on
  // click rather than rendered into the card — see live_sessions/services.py.
  const handleJoin = async (session) => {
    try {
      const response = await getSessionJoinLink(session.id);
      const url = response?.data?.meeting_url;
      if (!url) {
        toastError("No join link is available for this session yet.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      refreshSessions();
    } catch (joinError) {
      toastError(getApiErrorMessage(joinError, "This session isn't open to join yet."));
    }
  };

  const isBusy = rsvpMutation.isPending || cancelMutation.isPending;

  const sharedHandlers = {
    onRsvp: handleRsvp,
    onCancelRsvp: handleCancelRsvp,
    onJoin: handleJoin,
    onOpenDetail: setDetailSession,
    isBusy,
  };

  return (
    <div className="space-y-6">
      <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-serif font-light text-ink">War Room Live</h2>
            <p className="text-xs text-muted font-light mt-1 leading-relaxed">
              Monthly drop-in audio sessions with current college athletes — what they did in
              high school, what grew their following, and what they wish they&apos;d never posted.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          size="lg"
          label="Upcoming Sessions"
          value={stats?.upcoming_count ?? 0}
          icon={Mic}
          accent="amber"
          hint="Scheduled and open for RSVP"
        />
        <StatCard
          size="lg"
          label="You're Attending"
          value={stats?.my_rsvp_count ?? 0}
          icon={CalendarCheck}
          accent="emerald"
          hint="Spots you've reserved"
        />
        <StatCard
          size="lg"
          label="Recordings"
          value={stats?.recordings_available ?? 0}
          icon={PlayCircle}
          accent="stone"
          hint="Catch up on sessions you missed"
        />
      </div>

      <TabNav
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        ariaLabel="War Room Live sections"
        size="lg"
      />

      {activeSection === "upcoming" && (
        <SessionList
          sessions={upcoming.data || []}
          isLoading={upcoming.isLoading}
          isError={upcoming.isError}
          error={upcoming.error}
          onRetry={upcoming.refetch}
          emptyLabel="No sessions scheduled yet."
          emptyDescription="New War Room Live sessions are announced monthly. Check back soon."
          {...sharedHandlers}
        />
      )}

      {activeSection === "past" && (
        <SessionList
          sessions={past.data || []}
          isLoading={past.isLoading}
          isError={past.isError}
          error={past.error}
          onRetry={past.refetch}
          emptyLabel="No past sessions yet."
          emptyDescription="Once a session wraps, its recording and recap land here."
          {...sharedHandlers}
        />
      )}

      <SessionDetailModal
        isOpen={Boolean(detailSession)}
        onClose={() => setDetailSession(null)}
        session={detailSession}
        onRsvp={handleRsvp}
        onCancelRsvp={handleCancelRsvp}
        onJoin={handleJoin}
        isBusy={isBusy}
      />
    </div>
  );
}
