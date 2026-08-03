import { createSlice } from "@reduxjs/toolkit";

/**
 * Student portal application state (non-sensitive).
 * Progress is kept in Redux for the session — persist via API later, not localStorage.
 */
const initialState = {
  drillCompletedList: [],
  streakDays: 6,
  aggregateScore: 100,
  points: 450,
  consultationCount: 0,
};

const portalSlice = createSlice({
  name: "portal",
  initialState,
  reducers: {
    setDrillCompletedList(state, action) {
      state.drillCompletedList = action.payload;
    },
    setStreakDays(state, action) {
      state.streakDays = action.payload;
    },
    setAggregateScore(state, action) {
      state.aggregateScore = action.payload;
    },
    setPoints(state, action) {
      state.points = action.payload;
    },
    setConsultationCount(state, action) {
      state.consultationCount = action.payload;
    },
    resetPortalProgress(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setDrillCompletedList,
  setStreakDays,
  setAggregateScore,
  setPoints,
  setConsultationCount,
  resetPortalProgress,
} = portalSlice.actions;

export const selectPortal = (state) => state.portal;

export default portalSlice.reducer;
