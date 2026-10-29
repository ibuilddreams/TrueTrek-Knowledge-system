export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Agora RTC App ID for the live classroom. A public identifier by design —
// joining a channel also needs a token signed with the App Certificate, which
// only the backend holds (class_sessions/agora.py). Left empty, the classroom
// says it isn't configured rather than failing inside the Agora SDK.
export const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
