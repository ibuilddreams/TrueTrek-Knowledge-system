"use client";

import { Users, GraduationCap, BookOpen, ClipboardList, TrendingUp } from "lucide-react";
import StatCard from "@/components/ui/StatCard";

export default function AdminStatGrid({ statistics = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard label="Total Users" value={statistics.total_users ?? 0} icon={Users} />
      <StatCard label="Total Students" value={statistics.total_students ?? 0} icon={GraduationCap} />
      <StatCard label="Total Teachers" value={statistics.total_teachers ?? 0} icon={Users} />
      <StatCard label="Total Courses" value={statistics.total_courses ?? 0} icon={BookOpen} />
      <StatCard label="Total Enrollments" value={statistics.total_enrollments ?? 0} icon={ClipboardList} />
      <StatCard
        label="Avg. Course Completion"
        value={`${statistics.average_course_completion ?? 0}%`}
        icon={TrendingUp}
      />
    </div>
  );
}
