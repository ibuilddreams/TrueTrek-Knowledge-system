/**
 * Teacher onboarding — the vocabulary shared by the teacher's wizard and the
 * admin's review queue.
 *
 * Every value here mirrors `teacher_onboarding.models` on the backend. Labels
 * live beside the values rather than being derived from them because the
 * backend's own `*_display` strings only reach the UI on rows it has already
 * returned, and a dropdown has to render its options before anything is saved.
 */

export const APPLICATION_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const APPLICATION_STATUS_LABELS = {
  [APPLICATION_STATUS.DRAFT]: "Draft",
  [APPLICATION_STATUS.SUBMITTED]: "Submitted",
  [APPLICATION_STATUS.UNDER_REVIEW]: "Under Review",
  [APPLICATION_STATUS.CHANGES_REQUESTED]: "Changes Requested",
  [APPLICATION_STATUS.APPROVED]: "Approved",
  [APPLICATION_STATUS.REJECTED]: "Rejected",
};

/** Statuses the teacher may still edit in — matches `EDITABLE_STATUSES`. */
export const EDITABLE_STATUSES = [
  APPLICATION_STATUS.DRAFT,
  APPLICATION_STATUS.CHANGES_REQUESTED,
];

export const ONBOARDING_STEPS = [
  { key: "PROFILE", label: "Profile" },
  { key: "EXPERTISE", label: "Expertise" },
  { key: "CREDENTIALS", label: "Credentials" },
  { key: "VIDEO", label: "Intro Video" },
  { key: "REVIEW", label: "Review" },
];

export const QUALIFICATION_OPTIONS = [
  { value: "HIGH_SCHOOL", label: "High School Diploma" },
  { value: "ASSOCIATE", label: "Associate Degree" },
  { value: "BACHELORS", label: "Bachelor's Degree" },
  { value: "MASTERS", label: "Master's Degree" },
  { value: "DOCTORATE", label: "Doctorate" },
  { value: "PROFESSIONAL", label: "Professional Qualification" },
  { value: "OTHER", label: "Other" },
];

export const CREDENTIAL_TYPE_OPTIONS = [
  { value: "DEGREE", label: "Degree" },
  { value: "CERTIFICATION", label: "Certification" },
  { value: "LICENSE", label: "Teaching Licence" },
  { value: "AWARD", label: "Award" },
  { value: "OTHER", label: "Other" },
];

// Mirrors teacher_onboarding/validators.py. Duplicated on purpose so the file
// picker can refuse a 200MB video before it is uploaded over a phone
// connection — the server still re-checks, and these two have to move together.
export const ACCEPTED_DOCUMENT_TYPES = ".pdf,.png,.jpg,.jpeg,.webp";
export const ACCEPTED_VIDEO_TYPES = ".mp4,.webm,.mov,.m4v";
export const MAX_DOCUMENT_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 60;

// Mirrors teacher_onboarding/services.py.
export const MIN_BIO_LENGTH = 100;
export const MIN_TEACHING_STATEMENT_LENGTH = 80;
export const MAX_BIO_LENGTH = 4000;
export const MAX_TEACHING_STATEMENT_LENGTH = 2000;
export const MAX_EXPERTISE_ITEMS = 12;
export const MAX_CREDENTIALS = 10;
