import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stats: null,
  withStudents: null,
  status: "idle",
  error: null,
};

const teacherCoursesSlice = createSlice({
  name: "teacherCourses",
  initialState,
  reducers: {
    teacherCoursesFetchStart(state) {
      state.status = "loading";
      state.error = null;
    },
    teacherCoursesFetchSucceeded(state, action) {
      state.stats = action.payload.stats;
      state.withStudents = action.payload.withStudents;
      state.status = "succeeded";
      state.error = null;
    },
    teacherCoursesFetchFailed(state, action) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const {
  teacherCoursesFetchStart,
  teacherCoursesFetchSucceeded,
  teacherCoursesFetchFailed,
} = teacherCoursesSlice.actions;

export const selectTeacherCourses = (state) => state.teacherCourses;

export default teacherCoursesSlice.reducer;
