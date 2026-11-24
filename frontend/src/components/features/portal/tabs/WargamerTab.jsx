"use client";

import { useCallback, useState } from "react";
import { useRolePlayScenarios } from "@/hooks/student/useRolePlayScenarios";
import { PortalPageHead } from "../shell/PortalUI";
import WargamerModule from "../wargamer/WargamerModule";
import WargamerStatStrip from "../wargamer/WargamerStatStrip";
import SessionHistoryList from "../wargamer/SessionHistoryList";

/**
 * The student's entry point to LS-302 — the AI role-play boundary simulator.
 *
 * Not to be confused with the War Room tab (a course group chat), War Room
 * Live (monthly audio sessions with college athletes), or the Daily Drill
 * (a situational-judgement MCQ). This one is a conversation the student has
 * to hold their own in, and it is the only portal surface that scores how
 * they said something rather than what they picked.
 *
 * The design lays this out as the three score tiles over two columns —
 * Situations beside Past runs — with no tabs: a student picking what to
 * practise next wants their last results in the same glance. A live
 * conversation, the method primer and the report card each take the whole
 * page instead, which is what `isImmersive` switches.
 */
export default function WargamerTab() {
  const [openingSessionId, setOpeningSessionId] = useState(null);
  const [isImmersive, setIsImmersive] = useState(false);

  // The catalog is already cached by the module below, so reading it here for
  // the tiles costs no extra request.
  const { data: catalog } = useRolePlayScenarios();

  const handleOpenSession = (sessionId) => setOpeningSessionId(sessionId);

  // Stable, or `WargamerModule`'s effect would re-fire on every render.
  const handleImmersiveChange = useCallback((next) => setIsImmersive(next), []);

  const module = (
    <WargamerModule
      initialSessionId={openingSessionId}
      onSessionOpened={() => setOpeningSessionId(null)}
      onImmersiveChange={handleImmersiveChange}
    />
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Tactical wargamer"
        subtitle={'LS-302 · The "No" Muscle. Practise turning down family, friends and your community without burning bridges.'}
      />

      {!isImmersive && <WargamerStatStrip stats={catalog?.stats} />}

      {/* The module stays in the same position in the tree in both states —
          first child of this grid — and only the wrapper's columns and the
          sibling beside it change. Rendering it at two *different* positions
          (`isImmersive ? module : <div>{module}</div>`) made React unmount and
          remount it every time the flag flipped, which reset its step back to
          the situations list the instant a conversation opened, so starting a
          run did nothing at all. */}
      <div
        className={
          isImmersive
            ? "grid grid-cols-[minmax(0,1fr)] gap-6"
            : "grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        }
      >
        <div className="min-w-0">{module}</div>
        {!isImmersive && <SessionHistoryList onOpenSession={handleOpenSession} />}
      </div>
    </div>
  );
}
