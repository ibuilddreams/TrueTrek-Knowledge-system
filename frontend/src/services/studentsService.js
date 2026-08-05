import { backendClient } from "./apiClient";
import { downloadBlob } from "@/lib/bulkImport";

export async function getStudents({ pageSize = 100 } = {}) {
  return backendClient.get(`/student/admin/?page_size=${pageSize}`);
}

export async function getStudentById(id) {
  return backendClient.get(`/student/${id}/admin/`);
}

export async function createStudent(payload) {
  return backendClient.post("/student/admin/", payload);
}

export async function updateStudent(id, payload) {
  return backendClient.patch(`/student/${id}/admin/`, payload);
}

export async function deleteStudent(id) {
  return backendClient.delete(`/student/${id}/admin/`);
}

export async function permanentlyDeleteStudent(id) {
  return backendClient.delete(`/student/${id}/admin/permanent/`);
}

export async function bulkImportStudents(file) {
  const formData = new FormData();
  formData.append("file", file);
  return backendClient.post("/student/admin/bulk-import/", formData);
}

export async function downloadStudentImportSample(format = "csv") {
  const { blob, filename } = await backendClient.get(
    `/student/admin/bulk-import/sample/?file_format=${format}`,
    {
      responseType: "blob",
      headers: { Accept: "*/*" },
    }
  );
  downloadBlob(blob, filename || `student_import_sample.${format}`);
}
