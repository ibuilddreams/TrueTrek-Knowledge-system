"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import TabNav from "@/components/ui/TabNav";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";
import TabTransition from "@/components/ui/TabTransition";
import { SUB_TABS } from "@/components/features/progress/progressConstants";
import LessonProgressPanel from "@/components/features/progress/LessonProgressPanel";
import AssignmentProgressPanel from "@/components/features/progress/AssignmentProgressPanel";
import QuizProgressPanel from "@/components/features/progress/QuizProgressPanel";

export default function AdminCourseProgressScreen({ courseId, course, onBack }) {
  const [activeSubTab, setActiveSubTab] = useState("lessons");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-cn-p-ink-2 hover:text-cn-p-accent transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to courses
      </button>

      <PortalPageHead
        title={course?.title || "Course"}
        subtitle="Completion per lesson, assignment and quiz for every enrolled student."
      />

      <TabNav tone="cobalt" tabs={SUB_TABS} activeTab={activeSubTab} onChange={setActiveSubTab} ariaLabel="Progress sections" size="lg" />

      <TabTransition activeKey={activeSubTab}>
        {activeSubTab === "lessons" && <LessonProgressPanel tone="cobalt" courseId={courseId} />}
        {activeSubTab === "assignments" && <AssignmentProgressPanel tone="cobalt" courseId={courseId} />}
        {activeSubTab === "quizzes" && <QuizProgressPanel tone="cobalt" courseId={courseId} />}
      </TabTransition>
    </div>
  );
}
