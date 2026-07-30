import { backendClient } from "./apiClient";
import { downloadBlob } from "@/lib/bulkImport";

export async function getEnrollments({ pageSize = 100 } = {}) {
  return backendClient.get(`/enrollments/admin/?page_size=${pageSize}`);
}

export async function createEnrollment({ student, course }) {
  return backendClient.post("/enrollments/admin/", { student, course });
}

export async function updateEnrollmentStatus(id, { status, note }) {
  return backendClient.patch(`/enrollments/${id}/admin/`, { status, note });
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
