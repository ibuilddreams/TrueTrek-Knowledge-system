"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, History, Radio, Video } from "lucide-react";
import {
  useMyPastClasses,
  useMyUpcomingClasses,
} from "@/hooks/student/useStudentClassSessions";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import TabNav from "@/components/ui/TabNav";
import ClassSessionCard from "@/components/features/classroom/ClassSessionCard";
import ClassroomStage from "@/components/features/classroom/ClassroomStage";

const SECTIONS = [
  { id: "upcoming", label: "Upcoming Classes", icon: Radio },
  { id: "past", label: "Past Classes", icon: History },
];

/**
 * Live classes for the courses this student is enrolled in.
 *
 * The list refreshes on a timer (see useStudentClassSessions) because
 * whether a class can be joined is a server-side judgement about the clock —
 * a tab left open would otherwise never notice the room opening.
 */
export default function LiveClassesTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("upcoming");
  const [activeClass, setActiveClass] = useState(null);

  const upcoming = useMyUpcomingClasses();
  const past = useMyPastClasses({ enabled: activeSection === "past" });

  const sessions = (activeSection === "upcoming" ? upcoming.data : past.data) || [];
  const isLoading = activeSection === "upcoming" ? upcoming.isLoading : past.isLoading;

  const upcomingList = upcoming.data || [];
  const liveNow = upcomingList.filter((session) => session.live_state === "LIVE").length;

  return (
    <div className="space-y-6">
      <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold" />
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
            <Video className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-serif font-bold text-ink leading-tight">
              Live Classes
            </h2>
            <p className="text-sm text-muted font-light mt-1 leading-relaxed">
              Video classes your instructors run for the courses you&apos;re enrolled
              in. The room opens 15 minutes before the start — you&apos;ll need to
              allow your camera and microphone.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Live right now"
          value={liveNow}
          icon={Radio}
          accent={liveNow > 0 ? "rose" : "stone"}
          footer={liveNow > 0 ? "Jump in below" : "Nothing running yet"}
        />
        <StatCard
          label="Coming up"
          value={upcomingList.length}
          icon={CalendarCheck}
          accent="amber"
          footer="Across all your courses"
        />
      </div>

      <TabNav
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        ariaLabel="Live class sections"
      />

      {isLoading ? (
        <Loader label="Loading your classes..." />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Video}
          size="lg"
          label={
            activeSection === "upcoming"
              ? "No classes scheduled yet."
              : "You haven't been to a class yet."
          }
          description={
            activeSection === "upcoming"
              ? "When an instructor schedules one for a course you're enrolled in, it appears here."
              : "Classes you've attended will be listed here once they finish."
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {sessions.map((session) => (
            <ClassSessionCard
              key={session.id}
              session={session}
              onJoin={setActiveClass}
            />
          ))}
        </div>
      )}

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
