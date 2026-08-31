"use client";

import { useState } from "react";
import { ArrowLeft, LineChart } from "lucide-react";
import TabNav from "@/components/ui/TabNav";
import TabTransition from "@/components/ui/TabTransition";
import { SUB_TABS } from "@/components/features/progress/progressConstants";
import LessonProgressPanel from "@/components/features/progress/LessonProgressPanel";
import AssignmentProgressPanel from "@/components/features/progress/AssignmentProgressPanel";
import QuizProgressPanel from "@/components/features/progress/QuizProgressPanel";

export default function TeacherCourseProgressScreen({ courseId, course, onBack }) {
  const [activeSubTab, setActiveSubTab] = useState("lessons");

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-mono font-semibold text-stone-500 hover:text-amber-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Courses
      </button>

      <div className="relative bg-white border border-stone-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800 opacity-80" />
        <div className="p-6 sm:p-7 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <LineChart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-amber-600 font-mono text-[11px] uppercase tracking-widest font-bold block mb-1">
              Student Progress
            </span>
            <h2 className="text-2xl font-serif font-black text-stone-900 truncate">
              {course?.title || "Course"}
            </h2>
          </div>
        </div>
      </div>

      <TabNav
        tabs={SUB_TABS}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
        ariaLabel="Progress sections"
        size="lg"
      />

      <TabTransition activeKey={activeSubTab}>
        {activeSubTab === "lessons" && <LessonProgressPanel courseId={courseId} />}
        {activeSubTab === "assignments" && <AssignmentProgressPanel courseId={courseId} />}
        {activeSubTab === "quizzes" && <QuizProgressPanel courseId={courseId} />}
      </TabTransition>
    </div>
  );
}
