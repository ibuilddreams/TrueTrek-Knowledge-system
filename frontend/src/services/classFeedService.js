import { backendClient } from "./apiClient";

export async function getCourseFeed(courseId, { page, pageSize } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", page);
  if (pageSize) params.set("page_size", pageSize);
  const query = params.toString();
  return backendClient.get(`/class-feed/courses/${courseId}/posts/${query ? `?${query}` : ""}`);
}

export async function createFeedPost(courseId, { title, caption, attachment } = {}) {
  if (attachment) {
    const formData = new FormData();
    if (title) formData.append("title", title);
    if (caption) formData.append("caption", caption);
    formData.append("attachment", attachment);
    return backendClient.post(`/class-feed/courses/${courseId}/posts/`, formData);
  }
  return backendClient.post(`/class-feed/courses/${courseId}/posts/`, { title, caption });
}

export async function deleteFeedPost(courseId, postId) {
  return backendClient.delete(`/class-feed/courses/${courseId}/posts/${postId}/`);
}
