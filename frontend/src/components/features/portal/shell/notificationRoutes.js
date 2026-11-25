import { AUTH_ROLES } from "@/constants/auth";
import { portalHref } from "./portalNav";

/**
 * Where a notification's subject actually lives, per role.
 *
 * Keyed on `related_object_type`, which every producer sets (see
 * `notifications/services.py` and its callers). **Add a row here when adding
 * a notification producer**, or its notification opens nothing when tapped.
 *
 * It is keyed by role as well as by type because the same event reaches
 * different people at different screens — a War Room Live write-up is a
 * student's "War room live" tab and an admin's catalog of sessions — and
 * because a type one role never receives simply has no row for it.
 */
const DESTINATIONS = {
  [AUTH_ROLES.STUDENT]: {
    class_session: { slug: "live-classes" },
    live_session: { slug: "warroom-live" },
  },
  [AUTH_ROLES.FACULTY]: {
    class_session: { slug: "classes" },
    // The applicant's own decision. `TeacherApplicationBanner` rides above
    // every portal screen and is what explains it, so the dashboard is where
    // it reads best — there is no application screen left to open once a
    // teacher has submitted.
    teacher_onboarding: { slug: "dashboard" },
  },
  [AUTH_ROLES.ADMIN]: {
    student_concern: { slug: "student-concerns", param: "concern" },
    teacher_onboarding: { slug: "teacher-applications", param: "application" },
    live_session: { slug: "live-sessions" },
  },
};

/** Types that go to the same place whoever receives them. */
const SHARED_DESTINATIONS = {
  // The feedback form, a public-site route with no ROUTES constant.
  invitation_feedback: "/feedback",
};

/** The href a notification should open, or null if it points at nothing. */
export function notificationHref(role, notification) {
  const type = notification?.related_object_type;
  if (!type) return null;

  const shared = SHARED_DESTINATIONS[type];
  if (shared) return shared;

  const destination = DESTINATIONS[role]?.[type];
  if (!destination) return null;

  const href = portalHref(role, destination.slug);
  if (!destination.param || !notification.related_object_id) return href;
  return `${href}?${destination.param}=${notification.related_object_id}`;
}
