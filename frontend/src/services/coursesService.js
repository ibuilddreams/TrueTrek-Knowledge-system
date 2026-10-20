import { backendClient } from "./apiClient";

export async function getPublicCourses({
  page = 1,
  pageSize = 100,
  search,
  category,
  grade,
  difficulty,
  audience,
  tier,
  excludeEnrolled,
  sort,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (grade !== undefined && grade !== "") params.set("grade", grade);
  if (difficulty) params.set("difficulty", difficulty);
  if (tier) params.set("tier", tier);
  if (audience) params.set("audience", audience);
  if (excludeEnrolled) params.set("exclude_enrolled", "true");
  if (sort) params.set("sort", sort);
  return backendClient.get(`/courses/public/?${params.toString()}`);
}

export async function getPublicCourseFilters() {
  return backendClient.get("/courses/public/filters/");
}

// Cart upsell: courses related to the given cart (`courseIds`) and the most
// purchased ones. Cart/enrolled courses are excluded server-side.
export async function getPublicCourseRecommendations({ courseIds = [], limit } = {}) {
  const params = new URLSearchParams();
  if (courseIds.length) params.set("course_ids", courseIds.join(","));
  if (limit) params.set("limit", limit);
  const query = params.toString();
  return backendClient.get(`/courses/public/recommendations/${query ? `?${query}` : ""}`);
}

export async function getPublicCourseBySlug(slug) {
  return backendClient.get(`/courses/public/${encodeURIComponent(slug)}/`);
}

// `common/pagination.Pagination` caps any single request at max_page_size=100, so
// one request can never return the whole catalog (220 courses and counting). Every
// caller here wants the complete filtered set rather than a page of it — the admin
// Courses tab sorts and paginates in the browser, and the pathway/invite/enroll
// pickers are plain dropdowns — so a single capped request silently dropped
// everything past row 100 (the table showed 10 pages of 10 and stopped). Walk the
// pages instead and hand back one merged envelope in the usual shape.
const COURSES_MAX_PAGE_SIZE = 100;
const COURSES_MAX_PAGES = 50;

export async function getCourses({ pageSize = COURSES_MAX_PAGE_SIZE, search, status, category, tags } = {}) {
  const perPage = Math.min(Math.max(Number(pageSize) || COURSES_MAX_PAGE_SIZE, 1), COURSES_MAX_PAGE_SIZE);

  const requestPage = (page) => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("page_size", perPage);
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (tags) params.set("tags", tags);
    return backendClient.get(`/courses/?${params.toString()}`);
  };

  const response = await requestPage(1);
  const firstPage = response?.data || {};
  const count = firstPage.count || 0;
  let results = firstPage.results || [];

  const totalPages = Math.min(Math.ceil(count / perPage) || 1, COURSES_MAX_PAGES);
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => requestPage(index + 2)),
    );
    results = results.concat(...rest.map((page) => page?.data?.results || []));
  }

  // `next`/`previous` are meaningless once the pages are merged — drop them so no
  // caller mistakes this for a single page and tries to follow them.
  return { ...response, data: { ...firstPage, count, next: null, previous: null, results } };
}

export async function getCourseById(id) {
  return backendClient.get(`/courses/${id}/`);
}

export async function createCourse(payload) {
  return backendClient.post("/courses/", payload);
}

export async function updateCourse(id, payload) {
  return backendClient.patch(`/courses/${id}/`, payload);
}

export async function deleteCourse(id) {
  return backendClient.delete(`/courses/${id}/`);
}

export async function getCourseStatusChoices() {
  return backendClient.get("/courses/status-choices/");
}
