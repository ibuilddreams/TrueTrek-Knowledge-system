"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getClassSessionAttendance,
  getTeacherClassSessions,
} from "@/services/classSessionsService";
import { CLASS_REFRESH_MS } from "@/hooks/student/useStudentClassSessions";

/**
 * The teacher's own timetable. `scope` is "upcoming" or "past" — the split
 * is made server-side on a class's *end* time, so a class that is running
 * right now stays in "upcoming" rather than dropping into the archive
 * halfway through (class_sessions/services.py).
 */
export function useTeacherClassSessions({
  scope = "upcoming",
  course,
  search,
  enabled = true,
  pageSize = 50,
} = {}) {
  return useQuery({
    queryKey: ["class-sessions", "teacher", scope, course || null, search || "", pageSize],
    queryFn: async () => {
      const response = await getTeacherClassSessions({ scope, course, search, pageSize });
      return response?.data?.results || [];
    },
    enabled,
    // Upcoming classes carry a countdown and a door that opens on the clock;
    // the archive doesn't change on its own.
    refetchInterval: scope === "upcoming" ? CLASS_REFRESH_MS : false,
  });
}

export function useClassSessionAttendance(sessionId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["class-sessions", "attendance", sessionId],
    queryFn: async () => {
      const response = await getClassSessionAttendance(sessionId);
      return response?.data?.results || [];
    },
    enabled: enabled && Boolean(sessionId),
  });
}
