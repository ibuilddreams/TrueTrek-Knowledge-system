import { createSlice } from "@reduxjs/toolkit";

const initialListState = {
  items: [],
  count: 0,
  status: "idle",
  error: null,
  lastQueryKey: null,
};

export function createListSlice(name) {
  return createSlice({
    name,
    initialState: initialListState,
    reducers: {
      fetchListStart(state) {
        state.status = "loading";
        state.error = null;
      },
      fetchListSucceeded(state, action) {
        const { items, count, queryKey } = action.payload;
        state.items = items;
        state.count = count;
        state.status = "succeeded";
        state.error = null;
        state.lastQueryKey = queryKey;
      },
      fetchListFailed(state, action) {
        state.status = "failed";
        state.error = action.payload;
      },
    },
  });
}
