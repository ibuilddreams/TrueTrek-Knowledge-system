import { createListSlice } from "../createListSlice";

const studentsSlice = createListSlice("students");

export const {
  fetchListStart: studentsFetchStart,
  fetchListSucceeded: studentsFetchSucceeded,
  fetchListFailed: studentsFetchFailed,
} = studentsSlice.actions;

export const selectStudents = (state) => state.students;

export default studentsSlice.reducer;
