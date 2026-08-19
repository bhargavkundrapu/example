// apps/api/src/modules/progress/progress.repo.js
const { query } = require("../../db/query");
const contentRepo = require("../content/content.repo");

/**
 * Make sure lesson belongs to tenant + published (student only access)
 */
async function assertLessonPublished({ tenantId, lessonId }) {
  const { rows } = await query(
    `SELECT id
     FROM lessons
     WHERE tenant_id = $1 AND id = $2 AND status = 'published'
     LIMIT 1`,
    [tenantId, lessonId]
  );
  return rows[0] ? true : false;
}

/** Get course_id for a lesson (for access check). Returns null if lesson not found. */
async function getCourseIdByLessonId({ tenantId, lessonId }) {
  const { rows } = await query(
    `SELECT c.id AS course_id
     FROM courses c
     JOIN course_modules m ON m.course_id = c.id AND m.tenant_id = c.tenant_id
     JOIN lessons l ON l.module_id = m.id AND l.tenant_id = m.tenant_id
     WHERE l.tenant_id = $1 AND l.id = $2
     LIMIT 1`,
    [tenantId, lessonId]
  );
  return rows[0]?.course_id ?? null;
}

/**
 * Start lesson: create row if missing.
 * If exists, keep started_at (do NOT reset it).
 */
async function startLesson({ tenantId, userId, lessonId }) {
  const { rows } = await query(
    `INSERT INTO lesson_progress (tenant_id, user_id, lesson_id, started_at, updated_at)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (tenant_id, user_id, lesson_id)
     DO UPDATE SET
       started_at = COALESCE(lesson_progress.started_at, now()),
       updated_at = now()
     RETURNING *`,
    [tenantId, userId, lessonId]
  );
  return rows[0];
}

/**
 * Update progress:
 * - Adds watchSecondsDelta to watch_seconds (capped at 0+)
 * - Updates last_position_seconds to the provided value
 * - Never removes completed_at
 * - If row doesn't exist, it creates with started_at
 */
async function updateProgress({ tenantId, userId, lessonId, watchSecondsDelta, lastPositionSeconds }) {
  const { rows } = await query(
    `INSERT INTO lesson_progress (
        tenant_id, user_id, lesson_id,
        started_at,
        watch_seconds, last_position_seconds,
        updated_at
      )
     VALUES ($1, $2, $3, now(), $4, $5, now())
     ON CONFLICT (tenant_id, user_id, lesson_id)
     DO UPDATE SET
       watch_seconds = GREATEST(lesson_progress.watch_seconds + $4, 0),
       last_position_seconds = GREATEST($5, 0),
       updated_at = now()
     RETURNING *`,
    [tenantId, userId, lessonId, watchSecondsDelta, lastPositionSeconds]
  );
  return rows[0];
}

/**
 * Complete lesson:
 * - Sets completed_at once (if already set, keep it)
 * - Ensures started_at is set
 */
async function completeLesson({ tenantId, userId, lessonId }) {
  const { rows } = await query(
    `INSERT INTO lesson_progress (tenant_id, user_id, lesson_id, started_at, completed_at, updated_at)
     VALUES ($1, $2, $3, now(), now(), now())
     ON CONFLICT (tenant_id, user_id, lesson_id)
     DO UPDATE SET
       started_at = COALESCE(lesson_progress.started_at, now()),
       completed_at = COALESCE(lesson_progress.completed_at, now()),
       updated_at = now()
     RETURNING *`,
    [tenantId, userId, lessonId]
  );
  return rows[0];
}

async function getSummary({ tenantId, userId }) {
  const { rows } = await query(
    `SELECT
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed_lessons,
        COUNT(*) FILTER (WHERE completed_at IS NULL AND started_at IS NOT NULL) AS in_progress_lessons,
        COALESCE(SUM(watch_seconds), 0) AS total_watch_seconds
     FROM lesson_progress
     WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, userId]
  );
  return rows[0] || { completed_lessons: 0, in_progress_lessons: 0, total_watch_seconds: 0 };
}
async function courseProgressBySlug({ tenantId, userId, courseSlug }) {
  const course = await contentRepo.findPublishedCourseRowBySlug({ tenantId, courseSlug });
  if (!course?.id) {
    return { total: 0, completed: 0, percent: 0, completedLessonIds: [] };
  }

  // total published lessons in this course
  const totalRow = (await query(
    `
    SELECT COUNT(*)::int AS total
    FROM lessons l
    JOIN course_modules m
      ON m.id = l.module_id AND m.tenant_id = l.tenant_id
    JOIN courses c
      ON c.id = m.course_id AND c.tenant_id = m.tenant_id
    WHERE c.tenant_id = $1
      AND c.id = $2
      AND c.status = 'published'
      AND m.status = 'published'
      AND l.status = 'published'
    `,
    [tenantId, course.id]
  )).rows[0];

  const total = totalRow?.total ?? 0;

  // completed lesson ids for this user (published lessons only)
  const { rows } = await query(
    `
    SELECT lp.lesson_id
    FROM lesson_progress lp
    JOIN lessons l
      ON l.id = lp.lesson_id AND l.tenant_id = lp.tenant_id AND l.status='published'
    JOIN course_modules m
      ON m.id = l.module_id AND m.tenant_id = l.tenant_id AND m.status='published'
    JOIN courses c
      ON c.id = m.course_id AND c.tenant_id = m.tenant_id AND c.status='published'
    WHERE lp.tenant_id = $1
      AND lp.user_id = $2
      AND c.id = $3
      AND lp.completed_at IS NOT NULL
    `,
    [tenantId, userId, course.id]
  );

  const completedLessonIds = rows.map(r => r.lesson_id);
  const completed = completedLessonIds.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percent, completedLessonIds };
}

/**
 * Course progress by course id (for certification eligibility).
 * Same logic as courseProgressBySlug but keyed by course_id.
 */
async function courseProgressByCourseId({ tenantId, userId, courseId }) {
  const totalRow = (await query(
    `SELECT COUNT(*)::int AS total
     FROM lessons l
     JOIN course_modules m ON m.id = l.module_id AND m.tenant_id = l.tenant_id
     JOIN courses c ON c.id = m.course_id AND c.tenant_id = m.tenant_id
     WHERE c.tenant_id = $1 AND c.id = $2
       AND c.status = 'published' AND m.status = 'published' AND l.status = 'published'`,
    [tenantId, courseId]
  )).rows[0];
  const total = totalRow?.total ?? 0;
  if (total === 0) return { total: 0, completed: 0, percent: 0, completedLessonIds: [] };

  const { rows } = await query(
    `SELECT lp.lesson_id
     FROM lesson_progress lp
     JOIN lessons l ON l.id = lp.lesson_id AND l.tenant_id = lp.tenant_id AND l.status = 'published'
     JOIN course_modules m ON m.id = l.module_id AND m.tenant_id = l.tenant_id AND m.status = 'published'
     JOIN courses c ON c.id = m.course_id AND c.tenant_id = m.tenant_id AND c.status = 'published'
     WHERE lp.tenant_id = $1 AND lp.user_id = $2 AND c.id = $3 AND lp.completed_at IS NOT NULL`,
    [tenantId, userId, courseId]
  );
  const completedLessonIds = rows.map((r) => r.lesson_id);
  const completed = completedLessonIds.length;
  const percent = Math.round((completed / total) * 100);
  return { total, completed, percent, completedLessonIds };
}

/**
 * Overall progress: completed published lessons / total published lessons (all courses).
 * Used for Client Lab eligibility (>= 75%).
 */
async function getOverallProgressPercent({ tenantId, userId }) {
  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*)::int
        FROM lessons l
        JOIN course_modules m ON m.id = l.module_id AND m.tenant_id = l.tenant_id
        JOIN courses c ON c.id = m.course_id AND c.tenant_id = m.tenant_id
        WHERE c.tenant_id = $1 AND c.status = 'published' AND m.status = 'published' AND l.status = 'published'
       ) AS total,
       (SELECT COUNT(*)::int
        FROM lesson_progress lp
        JOIN lessons l ON l.id = lp.lesson_id AND l.tenant_id = lp.tenant_id AND l.status = 'published'
        JOIN course_modules m ON m.id = l.module_id AND m.tenant_id = l.tenant_id AND m.status = 'published'
        JOIN courses c ON c.id = m.course_id AND c.tenant_id = m.tenant_id AND c.status = 'published'
        WHERE lp.tenant_id = $1 AND lp.user_id = $2 AND lp.completed_at IS NOT NULL
       ) AS completed`,
    [tenantId, userId]
  );
  const total = rows[0]?.total ?? 0;
  const completed = rows[0]?.completed ?? 0;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Whether user has completed every published course (100% per course).
 * "All courses" = all published courses in tenant.
 */
async function completedAllRequiredCourses({ tenantId, userId }) {
  const { rows: courses } = await query(
    `SELECT c.id, c.slug FROM courses c
     WHERE c.tenant_id = $1 AND c.status = 'published'
     ORDER BY c.id`,
    [tenantId]
  );
  if (courses.length === 0) return true;

  const progressResults = await Promise.all(
    courses.map((c) => courseProgressBySlug({ tenantId, userId, courseSlug: c.slug }))
  );

  for (const progress of progressResults) {
    if (progress.percent < 100) return false;
  }
  return true;
}

/**
 * Leaderboard: all students in tenant with completed lesson count.
 * XP shown on frontend = completed_lessons * 50 (no XP in DB).
 * Streak is not stored; frontend uses 0 for others and current user's from gamification.
 */
async function getLeaderboard({ tenantId }) {
  const { rows } = await query(
    `SELECT
       u.id,
       u.full_name,
       COUNT(lp.lesson_id) FILTER (WHERE lp.completed_at IS NOT NULL)::int AS completed_lessons
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id AND r.name = 'Student'
     LEFT JOIN lesson_progress lp ON lp.user_id = u.id AND lp.tenant_id = $1
     WHERE u.is_active = true
     GROUP BY u.id, u.full_name
     ORDER BY completed_lessons DESC, u.full_name ASC`,
    [tenantId]
  );
  return rows;
}

module.exports = {
  assertLessonPublished,
  startLesson,
  updateProgress,
  completeLesson,
  getSummary,
  courseProgressBySlug,
  courseProgressByCourseId,
  getOverallProgressPercent,
  completedAllRequiredCourses,
  getLeaderboard,
  getCourseIdByLessonId,
};
