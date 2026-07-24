import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  studentId: null,
  data: null,
  status: "idle",
  error: null,
};

const teacherStudentDetailSlice = createSlice({
  name: "teacherStudentDetail",
  initialState,
  reducers: {
    teacherStudentDetailFetchStart(state, action) {
      state.studentId = action.payload.studentId;
      state.status = "loading";
      state.error = null;
    },
    teacherStudentDetailFetchSucceeded(state, action) {
      state.data = action.payload.data;
      state.status = "succeeded";
      state.error = null;
    },
    teacherStudentDetailFetchFailed(state, action) {
      state.status = "failed";
      state.error = action.payload;
    },
    teacherStudentDetailCleared(state) {
      state.studentId = null;
      state.data = null;
      state.status = "idle";
      state.error = null;
    },
  },
});

export const {
  teacherStudentDetailFetchStart,
  teacherStudentDetailFetchSucceeded,
  teacherStudentDetailFetchFailed,
  teacherStudentDetailCleared,
} = teacherStudentDetailSlice.actions;

export const selectTeacherStudentDetail = (state) => state.teacherStudentDetail;

export default teacherStudentDetailSlice.reducer;
