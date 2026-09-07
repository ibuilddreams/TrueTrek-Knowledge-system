import { createSlice } from "@reduxjs/toolkit";

/**
 * Student portal application state (non-sensitive).
 * Progress is kept in Redux for the session — persist via API later, not localStorage.
 *
 * streakDays/aggregateScore/points default to 0, not a placeholder demo
 * number — StudentPortal.jsx fetches the real values from the backend as
 * soon as the portal loads (regardless of which tab is active) and
 * overwrites these immediately, so 0 is only ever visible for the brief
 * moment before that first fetch resolves.
 */
const initialState = {
  drillCompletedList: [],
  streakDays: 0,
  streakDetail: null,
  aggregateScore: 0,
  points: 0,
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
    setStreakDetail(state, action) {
      state.streakDetail = action.payload;
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
  setStreakDetail,
  setAggregateScore,
  setPoints,
  setConsultationCount,
  resetPortalProgress,
} = portalSlice.actions;

export const selectPortal = (state) => state.portal;

export default portalSlice.reducer;
