/**
 * The two TanStack Query keys this feature shares.
 *
 * They live in their own module rather than beside the components that first
 * used them so that the portal's status banner can read the gate's query
 * without importing a screen it never renders — and so a cache invalidation
 * written in one place can't drift from the query it is meant to refresh.
 */

/** The small payload the portal gates on: `/teacher-onboarding/status/`. */
export const TEACHER_ONBOARDING_STATUS_QUERY_KEY = ["teacher-onboarding", "status"];

/** The teacher's full application: `/teacher-onboarding/me/`. */
export const TEACHER_APPLICATION_QUERY_KEY = ["teacher-onboarding", "me"];
