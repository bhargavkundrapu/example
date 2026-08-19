const progressRepo = require("../progress/progress.repo");
const eligibilityRepo = require("./clientLabEligibility.repo");
const contentRepo = require("../content/content.repo");
const studentRepo = require("../student/student.repo");

// Real Client Lab unlock rule:
// - Student must have access via All Pack OR all three main courses
// - Completion is checked only for the three main courses (AI Automations is bonus, excluded)
const REQUIRED_COURSE_SLUGS = ["vibe-coding", "prompt-engineering", "prompt-to-profit"];

function normalizeKey(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .trim();
}

function isVibeCodingCourse(course) {
  const slug = normalizeKey(course?.slug);
  const title = normalizeKey(course?.title);
  return (slug.includes("vibe") && (slug.includes("cod") || slug.includes("coad"))) || title.includes("vibe-coding");
}

function isPromptEngineeringCourse(course) {
  const slug = normalizeKey(course?.slug);
  const title = normalizeKey(course?.title);
  return slug.includes("prompt-engineering") || title.includes("prompt-engineering");
}

function isPromptToProfitCourse(course) {
  const slug = normalizeKey(course?.slug);
  const title = normalizeKey(course?.title);
  return slug.includes("prompt-to-profit") || title.includes("prompt-to-profit");
}

/**
 * Get checklist for Real Client Lab unlock: required trilogy with purchased + completed %.
 * Eligible when: all three main courses purchased/accessed AND each at 100% completion.
 */
async function getClientLabChecklist({ tenantId, userId }) {
  if (!tenantId) return { courses: [], hasAccess: false, allPurchased: false, allCompleted: false, eligible: false };

  const hasAccess = await studentRepo.hasAllPackOrAllThreeCourses({ tenantId, userId });
  if (!hasAccess) {
    return { courses: [], hasAccess: false, allPurchased: false, allCompleted: false, eligible: false };
  }

  // Evaluate only the three main courses for completion gating, but match robustly
  // so legacy slugs / typos (e.g., "vibe-coading") still appear in checklist.
  const allCourses = await contentRepo.listCoursesPublic({ tenantId });
  let courses = (allCourses || []).filter(
    (c) => isVibeCodingCourse(c) || isPromptEngineeringCourse(c) || isPromptToProfitCourse(c)
  );

  // Fallback to canonical slug lookup if matching by title/slug variants found none.
  if (!courses.length) {
    courses = await contentRepo.listCoursesPublicBySlugs({ tenantId, slugs: REQUIRED_COURSE_SLUGS });
  }

  if (!courses || courses.length === 0) {
    return { courses: [], hasAccess: true, allPurchased: true, allCompleted: true, eligible: true };
  }

  const checklist = await Promise.all(
    courses.map(async (c) => {
      const [purchased, progress] = await Promise.all([
        studentRepo.hasCourseAccess({ tenantId, userId, courseId: c.id }),
        progressRepo.courseProgressBySlug({ tenantId, userId, courseSlug: c.slug }),
      ]);
      const completedPercent = progress?.percent ?? 0;
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        purchased: !!purchased,
        completedPercent,
      };
    })
  );

  const allPurchased = checklist.every((c) => c.purchased);
  const allCompleted = checklist.every((c) => c.completedPercent === 100);
  const eligible = allPurchased && allCompleted;

  return { courses: checklist, hasAccess: true, allPurchased, allCompleted, eligible };
}

/**
 * Recompute and persist eligible_client_lab, eligible_since for a student.
 * Eligible when: all required courses purchased AND each course completed 100%.
 */
async function recomputeEligibility({ tenantId, userId }) {
  const checklist = await getClientLabChecklist({ tenantId, userId });
  const eligible = !!checklist?.eligible;
  const current = await eligibilityRepo.getEligibility({ userId });
  
  // Only execute DB write UPDATE if eligibility state actually changed
  if (!!current.eligible_client_lab !== eligible) {
    const eligibleSince = eligible ? (current.eligible_since || new Date().toISOString()) : null;
    await eligibilityRepo.setEligibility({
      userId,
      eligible,
      eligibleSince,
    });
  }
  return { eligible, checklist };
}

module.exports = { recomputeEligibility, getClientLabChecklist };
