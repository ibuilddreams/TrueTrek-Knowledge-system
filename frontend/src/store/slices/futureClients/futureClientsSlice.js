import { createListSlice } from "../createListSlice";

const futureClientsSlice = createListSlice("futureClients");

export const {
  fetchListStart: futureClientsFetchStart,
  fetchListSucceeded: futureClientsFetchSucceeded,
  fetchListFailed: futureClientsFetchFailed,
} = futureClientsSlice.actions;

export const selectFutureClients = (state) => state.futureClients;

export default futureClientsSlice.reducer;
