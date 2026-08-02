"use client";

import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  TrendingUp,
  UserRound,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";

const CARDS = [
  {
    key: "total_users",
    label: "Total Users",
    icon: Users,
    accent: "amber",
    hint: "All platform accounts",
    format: (s) => s.total_users ?? 0,
  },
  {
    key: "total_students",
    label: "Total Students",
    icon: GraduationCap,
    accent: "emerald",
    hint: "Active learner roster",
    format: (s) => s.total_students ?? 0,
  },
  {
    key: "total_teachers",
    label: "Total Teachers",
    icon: UserRound,
    accent: "stone",
    hint: "Faculty & instructors",
    format: (s) => s.total_teachers ?? 0,
  },
  {
    key: "total_courses",
    label: "Total Courses",
    icon: BookOpen,
    accent: "amber",
    hint: "Published & draft catalog",
    format: (s) => s.total_courses ?? 0,
  },
  {
    key: "total_enrollments",
    label: "Total Enrollments",
    icon: ClipboardList,
    accent: "stone",
    hint: "Seat assignments across courses",
    format: (s) => s.total_enrollments ?? 0,
  },
  {
    key: "average_course_completion",
    label: "Avg. Completion",
    icon: TrendingUp,
    accent: "emerald",
    hint: "Mean progress across courses",
    format: (s) => `${(Math.round((s.average_course_completion ?? 0) * 100) / 100)}%`,
  },
];

export default function AdminStatGrid({ statistics = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
      {CARDS.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={card.format(statistics)}
          icon={card.icon}
          accent={card.accent}
          hint={card.hint}
        />
      ))}
    </div>
  );
}
