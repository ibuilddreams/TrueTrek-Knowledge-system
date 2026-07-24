import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/auth/authSlice";
import uiReducer from "./slices/ui/uiSlice";
import portalReducer from "./slices/portal/portalSlice";
import intakeReducer from "./slices/intake/intakeSlice";
import coursesReducer from "./slices/courses/coursesSlice";
import studentsReducer from "./slices/students/studentsSlice";
import teachersReducer from "./slices/teachers/teachersSlice";
import enrollmentsReducer from "./slices/enrollments/enrollmentsSlice";
import adminOverviewReducer from "./slices/adminOverview/adminOverviewSlice";
import teacherDashboardReducer from "./slices/teacherDashboard/teacherDashboardSlice";

/**
 * Root reducer — add feature reducers here as modules grow.
 */
const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  portal: portalReducer,
  intake: intakeReducer,
  courses: coursesReducer,
  students: studentsReducer,
  teachers: teachersReducer,
  enrollments: enrollmentsReducer,
  adminOverview: adminOverviewReducer,
  teacherDashboard: teacherDashboardReducer,
});

export default rootReducer;
