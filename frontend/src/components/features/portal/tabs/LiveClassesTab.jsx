"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Radio, Video } from "lucide-react";
import { useMyPastClasses, useMyUpcomingClasses } from "@/hooks/student/useStudentClassSessions";
import Loader from "@/components/ui/Loader";
import PortalCard from "../shell/PortalCard";
import { PortalEmpty, PortalPageHead, PortalTabs } from "../shell/PortalUI";
import ClassSessionCard from "@/components/features/classroom/ClassSessionCard";
import ClassroomStage from "@/components/features/classroom/ClassroomStage";

// The design's `SP.live`: a band across the top for anything running right
// now, then a card of Upcoming / Past behind tabs.
//
// The band is the whole point of the screen — a class that is live is the one
// thing a student needs to act on immediately, and it should not be something
// they have to find in a list. It is the design's `.hero` in a row layout: the
// page's one cobalt field.
//
// The list refreshes on a timer (see useClassSessions) because whether a class
// can be joined is a server-side judgement about the clock — a tab left open
// would otherwise never notice the room opening.
export default function LiveClassesTab() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("upcoming");
  const [activeClass, setActiveClass] = useState(null);

  const upcoming = useMyUpcomingClasses();
  const past = useMyPastClasses({ enabled: tab === "past" });

  const upcomingList = upcoming.data || [];
  const pastList = past.data || [];
  const isLoading = tab === "upcoming" ? upcoming.isLoading : past.isLoading;

  // A live class is still an "upcoming" row as far as the server is concerned,
  // so it appears in the band *and* in the list below. That repetition is
  // deliberate: the band is the call to action, the list is the schedule.
  const liveNow = upcomingList.filter((session) => session.live_state === "LIVE");
  const sessions = tab === "upcoming" ? upcomingList : pastList;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Live classes"
        subtitle="Video classes your instructors run for your courses. The room opens at the scheduled start time, and you'll be asked for your camera and microphone."
      />

      {liveNow.length > 0 ? (
        <div className="grid gap-4">
          {liveNow.map((session) => (
            <div
              key={`live-${session.id}`}
              className="flex flex-wrap items-center gap-5 rounded-[20px] bg-cn-p-accent p-6 text-white"
            >
              <span className="inline-flex h-6 flex-none items-center gap-1.5 rounded-full bg-white px-2.5 text-xs font-semibold text-cn-p-bad">
                <Radio className="h-3 w-3 animate-pulse" />
                Live now
              </span>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-xl font-bold">{session.title}</b>
                <span className="block truncate text-sm text-[#d7dffc]">
                  {session.course_code} · {session.teacher_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveClass(session)}
                className="inline-flex h-11 flex-none items-center justify-center gap-2 rounded-cn-p-sm bg-white px-[18px] text-sm font-semibold text-cn-p-accent transition-transform duration-150 hover:-translate-y-px"
              >
                <Video className="h-[18px] w-[18px]" />
                Join class
              </button>
            </div>
          ))}
        </div>
      ) : (
        <PortalCard>
          <PortalEmpty
            icon={Video}
            title="Nothing live right now"
            text="Classes appear here the moment your instructor starts them."
          />
        </PortalCard>
      )}

      <PortalCard>
        <div className="px-4">
          <PortalTabs
            ariaLabel="Filter classes"
            options={[
              { value: "upcoming", label: "Upcoming", count: upcomingList.length },
              // Counted only once the Past query has run — it is lazy, and a
              // "0" standing in for "not asked yet" would be a lie.
              { value: "past", label: "Past", count: past.data ? pastList.length : undefined },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center" aria-busy="true">
            <Loader fullScreen={false} tone="portal" label="Loading your classes..." />
          </div>
        ) : sessions.length === 0 ? (
          <PortalEmpty
            icon={Video}
            title={
              tab === "upcoming"
                ? "No classes scheduled yet"
                : "You haven't been to a class yet"
            }
            text={
              tab === "upcoming"
                ? "When an instructor schedules one for a course you're enrolled in, it appears here."
                : "Classes you've attended are listed here once they finish."
            }
          />
        ) : (
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            {sessions.map((session) => (
              <ClassSessionCard
                key={session.id}
                session={session}
                variant="cobalt"
                onJoin={setActiveClass}
              />
            ))}
          </div>
        )}
      </PortalCard>

      {activeClass && (
        <ClassroomStage
          session={activeClass}
          onClose={() => {
            setActiveClass(null);
            queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
          }}
        />
      )}
    </div>
  );
}
