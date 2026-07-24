import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  status: "idle",
  error: null,
};

const teacherDashboardSlice = createSlice({
  name: "teacherDashboard",
  initialState,
  reducers: {
    teacherDashboardFetchStart(state) {
      state.status = "loading";
      state.error = null;
    },
    teacherDashboardFetchSucceeded(state, action) {
      state.data = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    teacherDashboardFetchFailed(state, action) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const {
  teacherDashboardFetchStart,
  teacherDashboardFetchSucceeded,
  teacherDashboardFetchFailed,
} = teacherDashboardSlice.actions;

export const selectTeacherDashboard = (state) => state.teacherDashboard;

export default teacherDashboardSlice.reducer;
