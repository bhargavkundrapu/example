/**
 * Student LMS course path helpers.
 * Main trilogy + AI Automations use /lms/student/courses/:courseSlug.
 * Bonus catalog (e.g. AI Tools Mastery for Students) uses /lms/student/bonus-courses/...
 */

const AI_AUTOMATIONS_SLUG_NORM = "ai-automations";
const BONUS_STUDENT_PREFIX = "/lms/student/bonus-courses";

/** True if slug is AI Automations (for always-enrolled / always-accessible logic). */
export function isAiAutomationsSlug(slug) {
  if (!slug) return false;
  const s = String(slug).toLowerCase().replace(/_/g, "-");
  return s === AI_AUTOMATIONS_SLUG_NORM || s.includes("ai-automation") || s === "ai-agents" || s === "ai_agents";
}

/** AI Tools Mastery for Students — bonus-only catalog entry; always free when published. */
export function isAiToolsMasteryStudentsSlug(slug) {
  if (!slug) return false;
  const s = String(slug).toLowerCase().replace(/_/g, "-");
  return s === "ai-tools-mastery-students" || s.startsWith("ai-tools-mastery-students");
}

/** Courses shown on the Bonus Courses tab (free extras). */
export function isStudentBonusCatalogSlug(slug) {
  return isAiAutomationsSlug(slug) || isAiToolsMasteryStudentsSlug(slug);
}

function normalizeCourseSegmentForPath(courseSlug) {
  const c = (courseSlug || "").toLowerCase().replace(/_/g, "-");
  if (c === "ai-agents" || c === "ai_agents") return AI_AUTOMATIONS_SLUG_NORM;
  return (courseSlug || "").toLowerCase().replace(/_/g, "-");
}

/** No course uses bonus path anymore; kept for any legacy checks. */
export function isBonusCourseSlug(slug) {
  return false;
}

/** Base path for a course (no trailing slash). Use for landing and lesson URLs. */
export function getStudentCourseBasePath(courseSlug) {
  return "/lms/student/courses";
}

/** Full URL to course landing. */
export function getStudentCourseLandingPath(courseSlug) {
  const base = getStudentCourseBasePath(courseSlug);
  const slug = normalizeCourseSegmentForPath(courseSlug);
  return `${base}/${slug}`;
}

/** Full URL to a lesson. */
export function getStudentLessonPath(courseSlug, moduleSlug, lessonSlug) {
  const base = getStudentCourseBasePath(courseSlug);
  const course = normalizeCourseSegmentForPath(courseSlug);
  return `${base}/${course}/modules/${moduleSlug}/lessons/${lessonSlug}`;
}

/** Bonus tab: course landing URL. */
export function getStudentBonusCourseLandingPath(courseSlug) {
  const course = normalizeCourseSegmentForPath(courseSlug);
  return `${BONUS_STUDENT_PREFIX}/${course}`;
}

/** Bonus tab: lesson URL. */
export function getStudentBonusLessonPath(courseSlug, moduleSlug, lessonSlug) {
  const course = normalizeCourseSegmentForPath(courseSlug);
  return `${BONUS_STUDENT_PREFIX}/${course}/modules/${moduleSlug}/lessons/${lessonSlug}`;
}

/**
 * Lesson link that preserves bonus vs main URL namespace (avoid jumping users between tabs).
 */
export function getStudentLessonPathForRoute(courseSlug, moduleSlug, lessonSlug, { pathname }) {
  const path = pathname || "";
  if (!path.includes("bonus-courses")) {
    return getStudentLessonPath(courseSlug, moduleSlug, lessonSlug);
  }
  const n = normalizeCourseSegmentForPath(courseSlug);
  const isAiAuto = n === AI_AUTOMATIONS_SLUG_NORM || n.includes("ai-automation") || n === "ai-agents";
  if (isAiAuto) {
    return getStudentLessonPath(courseSlug, moduleSlug, lessonSlug);
  }
  return getStudentBonusLessonPath(courseSlug, moduleSlug, lessonSlug);
}
