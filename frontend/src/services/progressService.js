import { backendClient } from "./apiClient";

export async function getCourseLessonProgress(
  courseId,
  { search, module, ordering, page, pageSize = 10 } = {},
) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (page) params.set("page", page);
  if (search) params.set("search", search);
  if (module) params.set("module", module);
  if (ordering) params.set("ordering", ordering);
  return backendClient.get(`/progress/courses/${courseId}/lessons/?${params.toString()}`);
}

export async function getStudentLessonProgress(courseId, studentId) {
  return backendClient.get(`/progress/courses/${courseId}/lessons/${studentId}/`);
}
