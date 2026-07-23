import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  status: "idle",
  error: null,
};

const adminOverviewSlice = createSlice({
  name: "adminOverview",
  initialState,
  reducers: {
    overviewFetchStart(state) {
      state.status = "loading";
      state.error = null;
    },
    overviewFetchSucceeded(state, action) {
      state.data = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    overviewFetchFailed(state, action) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const { overviewFetchStart, overviewFetchSucceeded, overviewFetchFailed } = adminOverviewSlice.actions;

export const selectAdminOverview = (state) => state.adminOverview;

export default adminOverviewSlice.reducer;
