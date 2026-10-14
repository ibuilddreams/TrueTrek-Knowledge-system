/**
 * Limits for custom ("build your own") pathways.
 * These mirror the server-side rules in `pathways/services.py` and
 * `pathways/serializers.py` — the backend is still the authority; these only
 * let the builder disable the save button before a request is made.
 */
export const MIN_CUSTOM_PATHWAY_COURSES = 2;
export const MAX_CUSTOM_PATHWAY_COURSES = 20;
export const CUSTOM_PATHWAY_NAME_MAX_LENGTH = 255;
export const CUSTOM_PATHWAY_SUMMARY_MAX_LENGTH = 500;
