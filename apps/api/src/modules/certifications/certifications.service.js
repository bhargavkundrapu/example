// apps/api/src/modules/certifications/certifications.service.js
const { query } = require("../../db/query");
const progressRepo = require("../progress/progress.repo");
const certificationsRepo = require("./certifications.repo");
const studentRepo = require("../student/student.repo");
const certificatesRepo = require("../certificates/certificates.repo");

function randomCode() {
  return "EXPO-" + Math.random().toString(16).slice(2, 6).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
}

/**
 * Get enrolled course ids for user (same logic as student.repo getEnrolledCourseIds).
 */
async function getEnrolledCourseIds({ tenantId, userId }) {
  const enrolledCourseIds = await studentRepo.getEnrolledCourseIds({ tenantId, userId });
  return Array.from(enrolledCourseIds);
}

/**
 * Eligible list: enrolled courses with server-computed progress and request status.
 */
async function getEligible({ tenantId, userId }) {
  const courseIds = await getEnrolledCourseIds({ tenantId, userId });
  if (courseIds.length === 0) return [];

  const { rows: courseRows } = await query(
    `SELECT id, title FROM courses WHERE tenant_id = $1 AND id = ANY($2::uuid[]) AND status = 'published'`,
    [tenantId, courseIds]
  );

  const requestsByCourse = {};
  const requests = await certificationsRepo.findRequestsByUserAndCourses({ tenantId, userId, courseIds });
  requests.forEach((r) => {
    requestsByCourse[r.course_id] = { id: r.id, status: r.status, requested_at: r.requested_at };
  });

  const progressPromises = courseRows.map((row) =>
    progressRepo
      .courseProgressByCourseId({
        tenantId,
        userId,
        courseId: row.id,
      })
      .then(({ percent }) => ({ row, percent }))
  );

  const progressResults = await Promise.all(progressPromises);

  const result = progressResults.map(({ row, percent }) => {
    const req = requestsByCourse[row.id];
    return {
      course_id: row.id,
      title: row.title,
      progress_percent: percent,
      status: percent >= 100 ? "complete" : "in_progress",
      request_status: req ? req.status : null,
      request_id: req?.id ?? null,
      requested_at: req?.requested_at ?? null,
    };
  });

  return result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
}

/**
 * Request certificate: must be enrolled, progress >= 100. Idempotent.
 */
async function requestCertificate({ tenantId, userId, courseId }) {
  const enrolled = await studentRepo.hasEnrollmentForCourse({ tenantId, userId, courseId });
  if (!enrolled) return { allowed: false, reason: "not_enrolled" };

  const { percent } = await progressRepo.courseProgressByCourseId({ tenantId, userId, courseId });
  if (percent < 100) return { allowed: false, reason: "progress_under_100", progress_percent: percent };

  const existing = await certificationsRepo.findByUserAndCourse({ tenantId, userId, courseId });
  if (existing) {
    const approvedExisting =
      existing.status === "approved" || existing.status === "issued"
        ? existing
        : await certificationsRepo.approveByUserAndCourse({ tenantId, userId, courseId, decidedBy: null });
    let cert = await certificatesRepo.findByUserAndCourse({ tenantId, userId, courseId });
    if (!cert) {
      for (let i = 0; i < 5; i++) {
        try {
          cert = await certificatesRepo.issueCertificate({
            tenantId,
            userId,
            courseId,
            title: "Course Certificate",
            verifyCode: randomCode(),
            meta: { source: "auto_approved_on_request" },
            createdBy: null,
          });
          break;
        } catch (e) {
          if (e.code === "23505") continue;
          throw e;
        }
      }
    }
    return { allowed: true, existing: true, request: approvedExisting || existing, certificate: cert || null };
  }

  const created = await certificationsRepo.createRequest({
    tenantId,
    userId,
    courseId,
    progressSnapshot: 100,
  });
  if (created) {
    const approved = await certificationsRepo.approveByUserAndCourse({ tenantId, userId, courseId, decidedBy: null });
    let cert = null;
    for (let i = 0; i < 5; i++) {
      try {
        cert = await certificatesRepo.issueCertificate({
          tenantId,
          userId,
          courseId,
          title: "Course Certificate",
          verifyCode: randomCode(),
          meta: { source: "auto_approved_on_request" },
          createdBy: null,
        });
        break;
      } catch (e) {
        if (e.code === "23505") continue;
        throw e;
      }
    }
    return { allowed: true, existing: false, request: approved || created, certificate: cert || null };
  }
  const again = await certificationsRepo.findByUserAndCourse({ tenantId, userId, courseId });
  return { allowed: true, existing: true, request: again, certificate: null };
}

module.exports = {
  getEligible,
  requestCertificate,
};
