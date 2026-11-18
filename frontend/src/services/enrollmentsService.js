import { backendClient } from "./apiClient";
import { downloadBlob } from "@/lib/bulkImport";

// Prototype checkout: the modal simulates the payment, then this enrolls the
// student. Replaces the cart's checkout — a purchase now names its courses
// instead of draining a stored basket.
export async function purchaseCourses(courseIds) {
  const ids = Array.isArray(courseIds) ? courseIds : [courseIds];
  return backendClient.post("/enrollments/purchase/", { course_ids: ids });
}

export async function getEnrollments({ pageSize = 100 } = {}) {
  return backendClient.get(`/enrollments/admin/?page_size=${pageSize}`);
}

export async function createEnrollment({ student, course, teacher }) {
  return backendClient.post("/enrollments/admin/", { student, course, teacher });
}

export async function updateEnrollmentStatus(id, { status, note }) {
  return backendClient.patch(`/enrollments/${id}/admin/`, { status, note });
}

export async function removeEnrollment(id) {
  return backendClient.delete(`/enrollments/${id}/admin/`);
}

export async function bulkImportEnrollments(file) {
  const formData = new FormData();
  formData.append("file", file);
  return backendClient.post("/enrollments/admin/bulk-import/", formData);
}

export async function downloadEnrollmentImportSample(format = "csv") {
  const { blob, filename } = await backendClient.get(
    `/enrollments/admin/bulk-import/sample/?file_format=${format}`,
    {
      responseType: "blob",
      headers: { Accept: "*/*" },
    }
  );
  downloadBlob(blob, filename || `enrollment_import_sample.${format}`);
}
