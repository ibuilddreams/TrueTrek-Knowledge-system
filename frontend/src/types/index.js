/**
 * Shared domain shape documentation (JSDoc) for the LMS.
 * JavaScript-only project — these typedefs aid editor intellisense.
 */

/**
 * @typedef {'home'|'curriculum'|'partnerships'|'store'|'future-clients'|'portal'|'login'|'dashboard'|'teachers'} RouteKey
 */

/**
 * @typedef {Object} NavLink
 * @property {string} id
 * @property {RouteKey} key
 * @property {string} href
 * @property {string} label
 * @property {string} mobileLabel
 * @property {string} title
 */

/**
 * @typedef {Object} CurriculumTier
 * @property {string} id
 * @property {string} number
 * @property {string} title
 * @property {string} subtitle
 * @property {string} desc
 * @property {string} audience
 * @property {string[]} focusAreas
 * @property {string[]} outcomes
 * @property {string} estimatedDuration
 * @property {string} tag
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {'student'|'faculty'|'guest'} role
 */

/**
 * @typedef {Object} AdvisorAdviceRequest
 * @property {string} scenario
 * @property {string} systemPrompt
 * @property {string} [advisorName]
 */

export {};
