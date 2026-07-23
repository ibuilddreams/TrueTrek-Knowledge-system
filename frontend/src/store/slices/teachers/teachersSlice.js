import { createListSlice } from "../createListSlice";

const teachersSlice = createListSlice("teachers");

export const {
  fetchListStart: teachersFetchStart,
  fetchListSucceeded: teachersFetchSucceeded,
  fetchListFailed: teachersFetchFailed,
} = teachersSlice.actions;

export const selectTeachers = (state) => state.teachers;

export default teachersSlice.reducer;
