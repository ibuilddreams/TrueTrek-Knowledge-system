export { default as apiClient, backendClient, apiRequest, addRequestInterceptor, addResponseInterceptor, addErrorInterceptor } from "./apiClient";
export { requestAdvisorAdvice } from "./advisorService";
export {
  login,
  loginAsStudent,
  loginAsFaculty,
  loginWithCredentials,
  logout,
  fetchCurrentUser,
  getStoredBackendUser,
  clearBackendSession,
} from "./authService";
