"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarDays,
  Headphones,
  Mic,
  PlayCircle,
  Radio,
} from "lucide-react";
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
import PortalCard, { PortalStat } from "../shell/PortalCard";
import { PortalPageHead, PortalTabs } from "../shell/PortalUI";
import SessionCalendar from "../live/SessionCalendar";
import SessionList from "../live/SessionList";
import SessionDetailModal from "../live/SessionDetailModal";
import LiveRoomStage from "@/components/features/liveroom/LiveRoomStage";
import SessionNotesModal from "@/components/features/liveroom/SessionNotesModal";

const SECTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "calendar", label: "Calendar" },
  { value: "past", label: "Past & recordings" },
];

export default function WarRoomLiveTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("upcoming");
  const [detailSession, setDetailSession] = useState(null);
  // The session whose room is open. The room itself is a full-screen portal
  // over the tab (`LiveRoomStage`), so a tab change cannot drop the call.
  const [roomSession, setRoomSession] = useState(null);
  const [notesSession, setNotesSession] = useState(null);

  const upcoming = useUpcomingSessions();
  // The calendar plots finished sessions beside the scheduled ones, so it
  // needs the past list too — fetched as soon as either section is open and
  // then served from the same cache when the student switches between them.
  const past = usePastSessions({
    enabled: activeSection === "past" || activeSection === "calendar",
  });
  const { data: stats } = useSessionStats();

  // Memoised because SessionCalendar's "open on the next session" effect takes
  // this array as a dependency, and a fresh array every render would re-run it.
  const calendarSessions = useMemo(
    () => [...(upcoming.data || []), ...(past.data || [])],
    [upcoming.data, past.data],
  );

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

  // Two kinds of session, two ways in. One hosted here opens the room over
  // this tab; one on somebody else's platform hands out a link, and that link
  // is withheld until the room opens — so it is fetched on click rather than
  // rendered into the card (see live_sessions/services.py::get_join_url).
  const handleJoin = async (session) => {
    if (session.is_hosted_here) {
      setDetailSession(null);
      setRoomSession(session);
      return;
    }

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

  const handleOpenNotes = (session) => {
    setDetailSession(null);
    setNotesSession(session);
  };

  const isBusy = rsvpMutation.isPending || cancelMutation.isPending;

  const sharedHandlers = {
    onRsvp: handleRsvp,
    onCancelRsvp: handleCancelRsvp,
    onJoin: handleJoin,
    onOpenNotes: handleOpenNotes,
    onOpenDetail: setDetailSession,
    isBusy,
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="War room live"
        subtitle="Monthly drop-in audio sessions with current college athletes — what they did in high school, what grew their following, and what they wish they'd never posted."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <PortalStat
          icon={Mic}
          label="Upcoming sessions"
          value={stats?.upcoming_count ?? 0}
          hint="Scheduled and open for RSVP"
        />
        <PortalStat
          icon={CalendarCheck}
          tone="ok"
          label="You're attending"
          value={stats?.my_rsvp_count ?? 0}
          hint="Spots you've reserved"
        />
        <PortalStat
          icon={PlayCircle}
          label="Recordings"
          value={stats?.recordings_available ?? 0}
          hint="Catch up on sessions you missed"
        />
      </div>

      {/* The design holds the three views inside one `.card.p0`, so the tab
          strip owns the top edge of the panel it switches rather than
          floating above a separate box. */}
      <PortalCard>
        <div className="px-4">
          <PortalTabs
            ariaLabel="War room live sections"
            options={SECTIONS}
            value={activeSection}
            onChange={setActiveSection}
          />
        </div>

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

      {activeSection === "calendar" && (
        <SessionCalendar
          sessions={calendarSessions}
          isLoading={upcoming.isLoading || past.isLoading}
          isError={upcoming.isError || past.isError}
          error={upcoming.error || past.error}
          onRetry={() => {
            upcoming.refetch();
            past.refetch();
          }}
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

      </PortalCard>

      <SessionDetailModal
        isOpen={Boolean(detailSession)}
        onClose={() => setDetailSession(null)}
        session={detailSession}
        onRsvp={handleRsvp}
        onCancelRsvp={handleCancelRsvp}
        onJoin={handleJoin}
        onOpenNotes={handleOpenNotes}
        isBusy={isBusy}
      />

      <SessionNotesModal
        isOpen={Boolean(notesSession)}
        onClose={() => setNotesSession(null)}
        session={notesSession}
      />

      {/* Keyed on the session so switching rooms never hands one call's
          connection to another. Closing it refreshes the lists, because
          walking into a room is what marks somebody as having turned up. */}
      {roomSession && (
        <LiveRoomStage
          key={roomSession.id}
          session={roomSession}
          onClose={() => {
            setRoomSession(null);
            refreshSessions();
          }}
        />
      )}
    </div>
  );
}
