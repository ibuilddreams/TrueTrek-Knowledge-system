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
  forgotPassword,
  resetPassword,
} from "./authService";
export { getProfile, updateProfile } from "./profileService";
export {
  startCourseGeneration,
  getCourseGeneration,
  cancelCourseGeneration,
  retryCourseGeneration,
  listCourseGenerations,
  getAiCourseGenerationUsage,
} from "./aiCoursesService";
