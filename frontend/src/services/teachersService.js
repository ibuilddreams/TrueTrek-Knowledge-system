import { backendClient } from "./apiClient";
import { downloadBlob } from "@/lib/bulkImport";

export async function getTeachers({ pageSize = 100 } = {}) {
  return backendClient.get(`/teacher/admin/?page_size=${pageSize}`);
}

export async function getTeacherById(id) {
  return backendClient.get(`/teacher/${id}/admin/`);
}

export async function createTeacher(payload) {
  return backendClient.post("/teacher/admin/", payload);
}

export async function updateTeacher(id, payload) {
  return backendClient.patch(`/teacher/${id}/admin/`, payload);
}

export async function deleteTeacher(id) {
  return backendClient.delete(`/teacher/${id}/admin/`);
}

export async function permanentlyDeleteTeacher(id) {
  return backendClient.delete(`/teacher/${id}/admin/permanent/`);
}

export async function bulkImportTeachers(file) {
  const formData = new FormData();
  formData.append("file", file);
  return backendClient.post("/teacher/admin/bulk-import/", formData);
}

export async function downloadTeacherImportSample(format = "csv") {
  const { blob, filename } = await backendClient.get(
    `/teacher/admin/bulk-import/sample/?file_format=${format}`,
    {
      responseType: "blob",
      headers: { Accept: "*/*" },
    }
  );
  downloadBlob(blob, filename || `teacher_import_sample.${format}`);
}
