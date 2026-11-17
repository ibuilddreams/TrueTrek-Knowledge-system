// The catalog's own totals, in one place so the home page and the store can
// never quote different numbers.
//
// The course count is the seeded catalog's size (`COURSE_DEFS` in
// `seeddata.py`). It is a constant rather than a query because the public
// course list is paginated and a hero must not wait on a round trip just to
// say how big the catalog is — surfaces that already know the real count from
// their own query should prefer that and use this only as the opening value.
export const CATALOG_COURSE_COUNT = 335;
export const CURRICULUM_TIER_COUNT = 9;
