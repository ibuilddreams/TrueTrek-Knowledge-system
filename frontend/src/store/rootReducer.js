import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/auth/authSlice";
import uiReducer from "./slices/ui/uiSlice";
import portalReducer from "./slices/portal/portalSlice";
import intakeReducer from "./slices/intake/intakeSlice";
import coursesReducer from "./slices/courses/coursesSlice";
import studentsReducer from "./slices/students/studentsSlice";
import enrollmentsReducer from "./slices/enrollments/enrollmentsSlice";
import adminOverviewReducer from "./slices/adminOverview/adminOverviewSlice";

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
  enrollments: enrollmentsReducer,
  adminOverview: adminOverviewReducer,
});

export default rootReducer;
