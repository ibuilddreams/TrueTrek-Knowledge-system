import { createSlice } from "@reduxjs/toolkit";

/**
 * Future-clients intake form state kept in Redux (session memory only).
 * Do not persist PII to localStorage — sync to a backend API when available.
 */
const initialState = {
  isSubmitted: false,
  intakeData: null,
  performanceImages: [],
};

const intakeSlice = createSlice({
  name: "intake",
  initialState,
  reducers: {
    setIntakeSubmitted(state, action) {
      state.isSubmitted = action.payload;
    },
    setIntakeData(state, action) {
      state.intakeData = action.payload;
    },
    setPerformanceImages(state, action) {
      state.performanceImages = action.payload;
    },
    clearIntake(state) {
      state.isSubmitted = false;
      state.intakeData = null;
      state.performanceImages = [];
    },
  },
});

export const {
  setIntakeSubmitted,
  setIntakeData,
  setPerformanceImages,
  clearIntake,
} = intakeSlice.actions;

export const selectIntake = (state) => state.intake;

export default intakeSlice.reducer;
