import { backendClient } from "./apiClient";

export const getInvitations = (page = 1, search = "") => backendClient.get(`/invitations/?page=${page}&search=${encodeURIComponent(search)}`);
export const createInvitation = (data) => backendClient.post("/invitations/", data);
export const approveInvitation = (id) => backendClient.post(`/invitations/${id}/approve/`, {});
export const regenerateInvitationLink = (id, sendEmail = false) => backendClient.post(`/invitations/${id}/link/`, { send_email: sendEmail });
export const acceptInvitation = (data) => backendClient.post("/invitations/accept/", data, { skipAuth: true });
export const getFeedbackStatus = () => backendClient.get("/feedback/status/");
export const getFeedback = () => backendClient.get("/feedback/");
export const submitFeedback = (data) => backendClient.post("/feedback/", data);

export const retryInvitationEmail = (id) => backendClient.post(`/invitations/${id}/email/`, {});
export const retryFeedbackEmail = (id) => backendClient.post(`/invitations/${id}/feedback-email/`, {});
