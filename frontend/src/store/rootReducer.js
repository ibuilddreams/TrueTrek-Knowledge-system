import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/auth/authSlice";
import uiReducer from "./slices/ui/uiSlice";
import portalReducer from "./slices/portal/portalSlice";
import intakeReducer from "./slices/intake/intakeSlice";

/**
 * Root reducer — add feature reducers here as modules grow.
 */
const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  portal: portalReducer,
  intake: intakeReducer,
});

export default rootReducer;
