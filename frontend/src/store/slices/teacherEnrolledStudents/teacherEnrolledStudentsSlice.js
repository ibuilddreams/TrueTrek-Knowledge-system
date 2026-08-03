import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  total: 0,
  status: "idle",
  error: null,
};

const teacherEnrolledStudentsSlice = createSlice({
  name: "teacherEnrolledStudents",
  initialState,
  reducers: {
    teacherEnrolledStudentsFetchStart(state) {
      state.status = "loading";
      state.error = null;
    },
    teacherEnrolledStudentsFetchSucceeded(state, action) {
      state.items = action.payload.students || [];
      state.total = action.payload.total_students || 0;
      state.status = "succeeded";
      state.error = null;
    },
    teacherEnrolledStudentsFetchFailed(state, action) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const {
  teacherEnrolledStudentsFetchStart,
  teacherEnrolledStudentsFetchSucceeded,
  teacherEnrolledStudentsFetchFailed,
} = teacherEnrolledStudentsSlice.actions;

export const selectTeacherEnrolledStudents = (state) => state.teacherEnrolledStudents;

export default teacherEnrolledStudentsSlice.reducer;
