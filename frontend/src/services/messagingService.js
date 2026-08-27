import { backendClient } from "./apiClient";

export async function getEligibleRecipients({ search } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const query = params.toString();
  return backendClient.get(`/messaging/recipients/${query ? `?${query}` : ""}`);
}

export async function getConversations({ page, pageSize } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", page);
  if (pageSize) params.set("page_size", pageSize);
  const query = params.toString();
  return backendClient.get(`/messaging/${query ? `?${query}` : ""}`);
}

export async function startConversation(recipientId) {
  return backendClient.post("/messaging/", { recipient_id: recipientId });
}

export async function getConversationMessages(conversationId, { page, pageSize } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", page);
  if (pageSize) params.set("page_size", pageSize);
  const query = params.toString();
  return backendClient.get(`/messaging/${conversationId}/messages/${query ? `?${query}` : ""}`);
}

export async function sendMessage(conversationId, { body, attachment } = {}) {
  if (attachment) {
    const formData = new FormData();
    if (body) formData.append("body", body);
    formData.append("attachment", attachment);
    return backendClient.post(`/messaging/${conversationId}/messages/`, formData);
  }
  return backendClient.post(`/messaging/${conversationId}/messages/`, { body });
}

export async function editMessage(conversationId, messageId, body) {
  return backendClient.patch(`/messaging/${conversationId}/messages/${messageId}/`, { body });
}

export async function deleteMessage(conversationId, messageId) {
  return backendClient.delete(`/messaging/${conversationId}/messages/${messageId}/`);
}

export async function reactToMessage(conversationId, messageId, emoji) {
  return backendClient.post(`/messaging/${conversationId}/messages/${messageId}/reactions/`, { emoji });
}

export async function markConversationRead(conversationId) {
  return backendClient.patch(`/messaging/${conversationId}/read/`);
}

export async function getUnreadMessagesCount() {
  return backendClient.get("/messaging/unread-count/");
}
