import { createListSlice } from "../createListSlice";

const enrollmentsSlice = createListSlice("enrollments");

export const {
  fetchListStart: enrollmentsFetchStart,
  fetchListSucceeded: enrollmentsFetchSucceeded,
  fetchListFailed: enrollmentsFetchFailed,
} = enrollmentsSlice.actions;

export const selectEnrollments = (state) => state.enrollments;

export default enrollmentsSlice.reducer;
