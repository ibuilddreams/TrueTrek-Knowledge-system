import { backendClient } from "./apiClient";

export async function getMyWarRoomRooms({ page, pageSize } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", page);
  if (pageSize) params.set("page_size", pageSize);
  const query = params.toString();
  return backendClient.get(`/warroom/rooms/${query ? `?${query}` : ""}`);
}

export async function getRoomMessages(courseId, { page, pageSize } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", page);
  if (pageSize) params.set("page_size", pageSize);
  const query = params.toString();
  return backendClient.get(`/warroom/rooms/${courseId}/messages/${query ? `?${query}` : ""}`);
}

export async function sendRoomMessage(courseId, { body, attachment } = {}) {
  if (attachment) {
    const formData = new FormData();
    if (body) formData.append("body", body);
    formData.append("attachment", attachment);
    return backendClient.post(`/warroom/rooms/${courseId}/messages/`, formData);
  }
  return backendClient.post(`/warroom/rooms/${courseId}/messages/`, { body });
}

export async function deleteRoomMessage(courseId, messageId) {
  return backendClient.delete(`/warroom/rooms/${courseId}/messages/${messageId}/`);
}
