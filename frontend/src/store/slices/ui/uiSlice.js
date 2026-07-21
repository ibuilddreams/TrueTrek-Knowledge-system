import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: "light",
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchQuery: "",
  selectedCategory: "All",
  filters: {
    tag: "All",
    status: "all",
  },
  selectedCourse: null,
  selectedModule: null,
  selectedLesson: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "vault" : "light";
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    setMobileMenuOpen(state, action) {
      state.mobileMenuOpen = action.payload;
    },
    toggleMobileMenu(state) {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = { tag: "All", status: "all" };
      state.searchQuery = "";
      state.selectedCategory = "All";
    },
    setSelectedCourse(state, action) {
      state.selectedCourse = action.payload;
    },
    setSelectedModule(state, action) {
      state.selectedModule = action.payload;
    },
    setSelectedLesson(state, action) {
      state.selectedLesson = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  toggleSidebar,
  setSidebarOpen,
  setMobileMenuOpen,
  toggleMobileMenu,
  setSearchQuery,
  setSelectedCategory,
  setFilters,
  resetFilters,
  setSelectedCourse,
  setSelectedModule,
  setSelectedLesson,
} = uiSlice.actions;

export const selectUi = (state) => state.ui;
export const selectTheme = (state) => state.ui.theme;

export default uiSlice.reducer;
