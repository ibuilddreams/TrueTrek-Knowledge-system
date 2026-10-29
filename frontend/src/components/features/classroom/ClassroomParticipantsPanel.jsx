"use client";

import { Circle, GraduationCap, UserRound } from "lucide-react";
import { getInitials } from "./classSessionUtils";

/**
 * Who is in the room, and who was expected.
 *
 * The roster comes from the join response — every instructor of the course
 * plus every actively enrolled student — so a teacher can see at a glance
 * who hasn't turned up, which a grid of connected tiles alone never shows.
 */
export default function ClassroomParticipantsPanel({
  roster = [],
  presentUids = [],
  localUid,
  activeSpeakerUid,
}) {
  const present = new Set(presentUids);

  const sorted = [...roster].sort((a, b) => {
    const inRoom = Number(present.has(b.uid)) - Number(present.has(a.uid));
    if (inRoom !== 0) return inRoom;
    if (a.role !== b.role) return a.role === "HOST" ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-paper/10 shrink-0">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold">
          In the room
        </p>
        <p className="text-sm text-paper/70 font-light mt-0.5">
          {present.size} of {roster.length} joined
        </p>
      </div>

      <ul className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-paper/5">
        {sorted.map((person) => {
          const isPresent = present.has(person.uid);
          return (
            <li
              key={person.uid}
              className={`flex items-center gap-3 px-4 py-2.5 ${isPresent ? "" : "opacity-50"}`}
            >
              <span className="relative shrink-0">
                <span className="w-9 h-9 rounded-xl bg-paper/10 border border-paper/15 text-paper flex items-center justify-center font-mono text-xs">
                  {getInitials(person.name)}
                </span>
                {person.uid === activeSpeakerUid && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-gold text-gold" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm text-paper truncate">
                  {person.name}
                  {person.uid === localUid && " (You)"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-paper/50 font-light">
                  {person.role === "HOST" ? (
                    <GraduationCap className="w-3 h-3" />
                  ) : (
                    <UserRound className="w-3 h-3" />
                  )}
                  {person.role === "HOST" ? "Instructor" : "Student"}
                </span>
              </span>

              <span
                className={`text-[10px] font-mono uppercase tracking-widest shrink-0 ${
                  isPresent ? "text-gold" : "text-paper/40"
                }`}
              >
                {isPresent ? "Here" : "Away"}
              </span>
            </li>
          );
        })}

        {roster.length === 0 && (
          <li className="px-4 py-6 text-sm text-paper/50 font-light">
            Nobody is enrolled on this course yet.
          </li>
        )}
      </ul>
    </div>
  );
}
