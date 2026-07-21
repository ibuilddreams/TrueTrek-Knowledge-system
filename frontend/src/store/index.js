import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";

export function makeStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: true,
      }),
  });
}

export const store = makeStore();

export default store;
