"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, History, Radio, Video } from "lucide-react";
import { useTeacherClassSessions } from "@/hooks/useTeacherClassSessions";
import { deleteClassSession } from "@/services/classSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import TabNav from "@/components/ui/TabNav";
import ClassSessionCard from "@/components/features/classroom/ClassSessionCard";
import { willCancelRatherThanDelete } from "@/components/features/classroom/classSessionUtils";
import ClassroomStage from "@/components/features/classroom/ClassroomStage";
import ClassSessionFormModal from "../ClassSessionFormModal";
import ClassSessionAttendanceModal from "../ClassSessionAttendanceModal";

const SECTIONS = [
  { id: "upcoming", label: "Scheduled", icon: Radio },
  { id: "past", label: "Past Classes", icon: History },
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
    <div className="space-y-6">
      <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <span className="w-12 h-12 rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-serif font-bold text-ink leading-tight">
                Live Classes
              </h2>
              <p className="text-sm text-muted font-light mt-1 leading-relaxed">
                Schedule a video class for one of your courses. Everyone enrolled is
                notified, and the room opens 15 minutes before the start — an hour
                early for you.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSchedule}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 bg-pine hover:bg-moss text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
          >
            <CalendarPlus className="w-4 h-4" />
            Schedule a class
          </button>
        </div>
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
              : "No classes have finished yet."
          }
          description={
            activeSection === "upcoming"
              ? "Schedule one and every enrolled student is notified."
              : "Past classes and their attendance will appear here."
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {sessions.map((session) => (
            <ClassSessionCard
              key={session.id}
              session={session}
              onJoin={setActiveClass}
              onEdit={handleEdit}
              onCancel={setCancellingSession}
              onViewAttendance={setAttendanceSession}
            />
          ))}
        </div>
      )}

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

      <ConfirmDialog
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
