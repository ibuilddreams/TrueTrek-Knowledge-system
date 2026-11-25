"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, History, Radio, Video } from "lucide-react";
import { useTeacherClassSessions } from "@/hooks/useTeacherClassSessions";
import { deleteClassSession } from "@/services/classSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Loader from "@/components/ui/Loader";
import TabNav from "@/components/ui/TabNav";
import ClassSessionCard from "@/components/features/classroom/ClassSessionCard";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPageHead,
} from "@/components/features/portal/shell/PortalUI";
import { willCancelRatherThanDelete } from "@/components/features/classroom/classSessionUtils";
import ClassroomStage from "@/components/features/classroom/ClassroomStage";
import ClassSessionFormModal from "../ClassSessionFormModal";
import ClassSessionAttendanceModal from "../ClassSessionAttendanceModal";

const SECTIONS = [
  { id: "upcoming", label: "Scheduled", icon: Radio },
  { id: "past", label: "Past classes", icon: History },
];

/**
  * The teacher's live-class timetable.
   *
   * The classroom itself is the shared `ClassroomStage`, rendered over the
   * portal rather than navigated to, so leaving a class puts the teacher back
   * exactly where they were.
   */
export default function LiveClassesTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("upcoming");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [attendanceSession, setAttendanceSession] = useState(null);
  const [cancellingSession, setCancellingSession] = useState(null);
  const [activeClass, setActiveClass] = useState(null);

  const { data: sessions = [], isLoading } = useTeacherClassSessions({
    scope: activeSection,
  });

  const cancelMutation = useMutation({
    mutationFn: (session) => deleteClassSession(session.id),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["class-sessions"] });

  const handleSchedule = () => {
    setEditingSession(null);
    setIsFormOpen(true);
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      const response = await cancelMutation.mutateAsync(cancellingSession);
      // The backend decides between cancelling and deleting — it keeps a
      // class anyone has joined — and says which it did, so the message is
      // its own rather than one guessed here.
      toastSuccess(response?.message || "Class cancelled.");
      setCancellingSession(null);
      refresh();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to cancel this class."));
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Live classes"
        subtitle="Video classes for your courses. Everyone enrolled is notified when you schedule one, and the room opens at the scheduled start time."
      >
        <PortalButton onClick={handleSchedule}>
          <CalendarPlus className="h-4 w-4" />
          Schedule a class
        </PortalButton>
      </PortalPageHead>

      <PortalCard className="overflow-hidden">
        <div className="px-4">
          <TabNav
            tone="cobalt"
            tabs={SECTIONS}
            activeTab={activeSection}
            onChange={setActiveSection}
            ariaLabel="Live class sections"
          />
        </div>

        {isLoading ? (
          <div className="p-10">
            <Loader tone="cobalt" fullScreen={false} label="Loading your classes..." />
          </div>
        ) : sessions.length === 0 ? (
          <PortalEmpty
            icon={Video}
            title={
              activeSection === "upcoming"
                ? "No classes scheduled yet"
                : "No classes have finished yet"
            }
            text={
              activeSection === "upcoming"
                ? "Schedule one and every enrolled student is notified."
                : "Past classes and their attendance appear here."
            }
          />
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {sessions.map((session) => (
              <ClassSessionCard
                key={session.id}
                variant="cobalt"
                session={session}
                onJoin={setActiveClass}
                onEdit={handleEdit}
                onCancel={setCancellingSession}
                onViewAttendance={setAttendanceSession}
              />
            ))}
          </div>
        )}
      </PortalCard>

      <ClassSessionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingSession={editingSession}
      />

      <ClassSessionAttendanceModal
        isOpen={Boolean(attendanceSession)}
        onClose={() => setAttendanceSession(null)}
        session={attendanceSession}
      />

      <ConfirmDialog variant="cobalt"
        isOpen={Boolean(cancellingSession)}
        onClose={() => setCancellingSession(null)}
        onConfirm={handleConfirmCancel}
        isConfirming={cancelMutation.isPending}
        title={
          willCancelRatherThanDelete(cancellingSession)
            ? "Cancel this class?"
            : "Delete this class?"
        }
        message={
          willCancelRatherThanDelete(cancellingSession)
            ? "Students who were expecting it keep seeing it, marked cancelled. Everyone enrolled is notified."
            : "It will be removed from the timetable and everyone enrolled is notified it's off."
        }
        confirmLabel={
          willCancelRatherThanDelete(cancellingSession) ? "Cancel class" : "Delete class"
        }
        size="lg"
      />

      {activeClass && (
        <ClassroomStage
          session={activeClass}
          onClose={() => {
            setActiveClass(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
