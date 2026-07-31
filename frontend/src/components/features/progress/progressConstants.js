import { ClipboardCheck, HelpCircle, PlayCircle } from "lucide-react";

export const PAGE_SIZE = 8;
export const BULK_FETCH_SIZE = 200;

export const SUB_TABS = [
  { id: "lessons", label: "Lessons", icon: PlayCircle },
  { id: "assignments", label: "Assignments", icon: ClipboardCheck },
  { id: "quizzes", label: "Quizzes", icon: HelpCircle },
];

export const ASSIGNMENT_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "LATE", label: "Late" },
  { value: "GRADED", label: "Graded" },
];

export const QUIZ_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NOT_ATTEMPTED", label: "Not Attempted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
];
