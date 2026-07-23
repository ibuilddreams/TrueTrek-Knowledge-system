import { createListSlice } from "../createListSlice";

const coursesSlice = createListSlice("courses");

export const {
  fetchListStart: coursesFetchStart,
  fetchListSucceeded: coursesFetchSucceeded,
  fetchListFailed: coursesFetchFailed,
} = coursesSlice.actions;

export const selectCourses = (state) => state.courses;

export default coursesSlice.reducer;
