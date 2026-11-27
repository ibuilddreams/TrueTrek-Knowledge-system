/**
 * Limits for quizzes.
 * These mirror the server-side rules in `quizzes/constants.py` (shared there by
 * the quiz API and `ai_courses`' generation form) — the backend is still the
 * authority; these only stop a form offering a number the API would reject.
 */
export const MIN_QUESTIONS_PER_QUIZ = 1;
export const DEFAULT_QUESTIONS_PER_QUIZ = 10;
export const MAX_QUESTIONS_PER_QUIZ = 70;
