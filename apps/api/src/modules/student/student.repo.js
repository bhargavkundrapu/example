// apps/api/src/modules/student/student.repo.js
const { query } = require("../../db/query");

const MAIN_COURSE_SLUGS = ["vibe-coding", "prompt-engineering", "prompt-to-profit"];
// Alternate slugs per logical main course (used for Client Lab "all 3 courses" eligibility)
const MAIN_COURSE_SLUG_OPTIONS = [
  ["vibe-coding", "vibe-coading", "vibe_coding"],
  ["prompt-engineering", "prompt_engineering"],
  ["prompt-to-profit", "prompt_to_profit", "chatgpt-business", "chatgpt_business"],
];

const BONUS_COURSE_SLUG_VARIANTS = ["ai-automations", "ai_automations", "ai-automation", "ai_automation"];

/** Bonus courses seeded / resolved by slug (always free once published). Keep in sync with web `studentCoursePaths`. */
const EXTRA_ALWAYS_FREE_BONUS_SLUG_VARIANTS = ["ai-tools-mastery-students", "ai_tools_mastery_students"];

async function resolvePublishedCourseIdBySlug({ tenantId, slug }) {
  if (!slug) return null;
  const { rows } = await query(
    `SELECT id FROM courses WHERE tenant_id = $1 AND status = 'published'
     AND (slug = $2 OR REPLACE(slug, '_', '-') = $2 OR LOWER(REPLACE(slug, '_', '-')) = LOWER($2)) LIMIT 1`,
    [tenantId, slug]
  ).catch(() => ({ rows: [] }));
  return rows[0]?.id || null;
}

/** Resolve AI Automations (bonus) course id. Bonus course is free for everyone - no lock/unlock. */
async function getBonusCourseId({ tenantId }) {
  for (const slug of BONUS_COURSE_SLUG_VARIANTS) {
    const id = await resolvePublishedCourseIdBySlug({ tenantId, slug });
    if (id) return id;
  }
  const { rows: fallback } = await query(
    `SELECT id FROM courses WHERE tenant_id = $1 AND status = 'published'
     AND (LOWER(title) LIKE '%ai automation%' OR LOWER(slug) LIKE '%ai%automation%') LIMIT 1`,
    [tenantId]
  ).catch(() => ({ rows: [] }));
  if (fallback[0]?.id) return fallback[0].id;
  return null;
}

/** All always-free bonus course ids for this tenant (AI Automations + extra catalog bonuses). */
async function getBonusCourseIds({ tenantId }) {
  const ids = [];
  const seen = new Set();
  const primary = await getBonusCourseId({ tenantId });
  if (primary) {
    const k = normId(primary);
    seen.add(k);
    ids.push(primary);
  }
  for (const slug of EXTRA_ALWAYS_FREE_BONUS_SLUG_VARIANTS) {
    const id = await resolvePublishedCourseIdBySlug({ tenantId, slug });
    if (id && !seen.has(normId(id))) {
      seen.add(normId(id));
      ids.push(id);
    }
  }
  return ids;
}

async function getBonusCourseIdSet({ tenantId }) {
  const list = await getBonusCourseIds({ tenantId });
  return new Set(list.map((id) => normId(id)));
}

// Dashboard & Home - Returns lessons and practice tasks from ENROLLED courses only
async function getSchedule({ tenantId, userId }) {
  try {
    const bonusIdSet = await getBonusCourseIdSet({ tenantId });

    const enrollResult = await query(
      `SELECT item_type, item_id FROM enrollments
       WHERE user_id = $1 AND tenant_id = $2 AND active = true`,
      [userId, tenantId]
    ).catch(() => ({ rows: [] }));

    const enrolledCourseIds = new Set();
    const enrolledPackIds = new Set();
    enrollResult.rows.forEach((r) => {
      if (r.item_type === "course" && !bonusIdSet.has(normId(r.item_id))) enrolledCourseIds.add(r.item_id);
      if (r.item_type === "pack") enrolledPackIds.add(r.item_id);
    });

    if (enrolledPackIds.size > 0) {
      const packRes = await query(
        `SELECT course_id FROM course_pack_courses WHERE pack_id = ANY($1::uuid[])`,
        [Array.from(enrolledPackIds)]
      ).catch(() => ({ rows: [] }));
      packRes.rows.forEach((r) => {
        if (!bonusIdSet.has(normId(r.course_id))) enrolledCourseIds.add(r.course_id);
      });
    }

    // Bonus courses: free for everyone
    const bonusCourseIds = await getBonusCourseIds({ tenantId });
    bonusCourseIds.forEach((id) => enrolledCourseIds.add(id));

    if (enrolledCourseIds.size === 0) return [];

    const courseIds = Array.from(enrolledCourseIds);

    // Lessons from enrolled courses only, with progress
    const lessonsResult = await query(
      `SELECT 
        l.id as lesson_id,
        l.title as lesson_title,
        l.slug as lesson_slug,
        l.duration_seconds,
        c.id as course_id,
        c.title as course_title,
        c.slug as course_slug,
        cm.id as module_id,
        cm.title as module_title,
        cm.slug as module_slug,
        cm.position as module_position,
        l.position as lesson_position,
        lp.completed_at,
        lp.watch_seconds,
        l.duration_seconds as total_duration
      FROM courses c
      JOIN course_modules cm ON cm.course_id = c.id AND cm.status = 'published'
      JOIN lessons l ON l.module_id = cm.id AND l.status = 'published'
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1 AND lp.tenant_id = c.tenant_id
      WHERE c.tenant_id = $2 AND c.status = 'published'
        AND c.id = ANY($3::uuid[])
      ORDER BY c.id, cm.position ASC, l.position ASC`,
      [userId, tenantId, courseIds]
    );

    // Practice tasks from enrolled courses only
    const practiceResult = await query(
      `SELECT 
        pt.id as task_id,
        pt.title as task_title,
        pt.lesson_id,
        l.slug as lesson_slug,
        c.slug as course_slug,
        cm.slug as module_slug,
        l.title as lesson_title,
        s.id as submission_id,
        s.status as submission_status,
        s.attempt_no
      FROM practice_tasks pt
      JOIN lessons l ON l.id = pt.lesson_id AND l.tenant_id = pt.tenant_id
      JOIN course_modules cm ON cm.id = l.module_id AND cm.tenant_id = l.tenant_id
      JOIN courses c ON c.id = cm.course_id AND c.tenant_id = cm.tenant_id
      LEFT JOIN submissions s ON s.task_id = pt.id AND s.user_id = $1
      WHERE pt.tenant_id = $2 
        AND c.status = 'published' 
        AND cm.status = 'published' 
        AND l.status = 'published'
        AND c.id = ANY($3::uuid[])
      ORDER BY c.id, cm.position ASC, l.position ASC, pt.sort_order ASC`,
      [userId, tenantId, courseIds]
    );

    const schedule = [];

    // Process lessons
    lessonsResult.rows.forEach((row) => {
      const completed = !!row.completed_at;
      const progress = completed ? 100 : (row.watch_seconds && row.total_duration 
        ? Math.min(Math.round((row.watch_seconds / row.total_duration) * 100), 99)
        : 0);
      
      const durationMins = row.duration_seconds ? Math.round(row.duration_seconds / 60) : 0;
      const hours = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      const duration = hours > 0 ? `${hours} Hr ${mins} Mins` : `${mins} Mins`;

      schedule.push({
        id: `lesson_${row.lesson_id}`,
        title: row.lesson_title,
        activityType: "LEARNING",
        progress: progress,
        completed: completed ? 1 : 0,
        total: 1,
        duration: duration,
        courseSlug: row.course_slug,
        moduleSlug: row.module_slug,
        lessonSlug: row.lesson_slug,
        type: "lesson",
        order: (row.module_position || 0) * 1000 + (row.lesson_position || 0),
      });
    });

    // Process practice tasks
    practiceResult.rows.forEach((row) => {
      const completed = row.submission_status === 'approved' || row.submission_status === 'completed';
      const progress = completed ? 100 : (row.submission_id ? 50 : 0);
      
      schedule.push({
        id: `practice_${row.task_id}`,
        title: row.task_title,
        activityType: "PRACTICE",
        progress: progress,
        completed: completed ? 1 : 0,
        total: 1,
        duration: "25 Mins", // Default duration for practice tasks
        courseSlug: row.course_slug,
        moduleSlug: row.module_slug,
        lessonSlug: row.lesson_slug,
        taskId: row.task_id,
        type: "practice",
        order: schedule.length + 1, // Append after lessons
      });
    });

    // Sort by order
    schedule.sort((a, b) => a.order - b.order);

    return schedule;
  } catch (error) {
    console.error("Error in getSchedule:", error);
    return [];
  }
}

async function getCurrentCourse({ tenantId, userId }) {
  try {
    const bonusIdSet = await getBonusCourseIdSet({ tenantId });

    const enrollResult = await query(
      `SELECT item_type, item_id FROM enrollments
       WHERE user_id = $1 AND tenant_id = $2 AND active = true`,
      [userId, tenantId]
    ).catch(() => ({ rows: [] }));

    const enrolledCourseIds = new Set();
    const enrolledPackIds = new Set();
    enrollResult.rows.forEach((r) => {
      if (r.item_type === "course" && !bonusIdSet.has(normId(r.item_id))) enrolledCourseIds.add(r.item_id);
      if (r.item_type === "pack") enrolledPackIds.add(r.item_id);
    });

    if (enrolledPackIds.size > 0) {
      const packRes = await query(
        `SELECT course_id FROM course_pack_courses WHERE pack_id = ANY($1::uuid[])`,
        [Array.from(enrolledPackIds)]
      ).catch(() => ({ rows: [] }));
      packRes.rows.forEach((r) => {
        if (!bonusIdSet.has(normId(r.course_id))) enrolledCourseIds.add(r.course_id);
      });
    }

    // Bonus courses: free for everyone
    const bonusCourseIds = await getBonusCourseIds({ tenantId });
    bonusCourseIds.forEach((id) => enrolledCourseIds.add(id));

    if (enrolledCourseIds.size === 0) return null;

    const courseIds = Array.from(enrolledCourseIds);

    // Get most recently accessed enrolled course
    let result = await query(
      `SELECT DISTINCT ON (c.id) 
         c.id, c.title, c.slug, cm.title as module_name, cm.slug as module_slug, 
         l.title as lesson_name, l.slug as lesson_slug,
         CASE WHEN lp.completed_at IS NOT NULL THEN 100 ELSE 0 END as progress,
         lp.updated_at
       FROM courses c
       JOIN course_modules cm ON cm.course_id = c.id AND cm.status = 'published'
       JOIN lessons l ON l.module_id = cm.id AND l.status = 'published'
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1 AND lp.tenant_id = c.tenant_id
       WHERE c.tenant_id = $2 AND c.status = 'published' AND c.id = ANY($3::uuid[])
       ORDER BY c.id, lp.updated_at DESC NULLS LAST, lp.created_at DESC NULLS LAST
       LIMIT 1`,
      [userId, tenantId, courseIds]
    );

    // If no course with progress, get first enrolled course
    if (result.rows.length === 0) {
      result = await query(
        `SELECT DISTINCT ON (c.id)
           c.id, c.title, c.slug, cm.title as module_name, cm.slug as module_slug, 
           l.title as lesson_name, l.slug as lesson_slug, 0 as progress
         FROM courses c
         JOIN course_modules cm ON cm.course_id = c.id AND cm.status = 'published'
         JOIN lessons l ON l.module_id = cm.id AND l.status = 'published'
         WHERE c.tenant_id = $1 AND c.status = 'published' AND c.id = ANY($2::uuid[])
         ORDER BY c.id, cm.position ASC, l.position ASC
         LIMIT 1`,
        [tenantId, courseIds]
      );
    }

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      courseName: row.title,
      courseSlug: row.slug,
      moduleName: row.module_name || null,
      moduleSlug: row.module_slug || null,
      lessonName: row.lesson_name || null,
      lessonSlug: row.lesson_slug || null,
      progress: parseInt(row.progress) || 0,
    };
  } catch (error) {
    console.error("Error in getCurrentCourse:", error);
    return null;
  }
}

async function getProgress({ tenantId, userId }) {
  try {
    // Calculate overall progress
    const result = await query(
      `SELECT 
         COUNT(DISTINCT l.id) FILTER (WHERE lp.completed_at IS NOT NULL) as completed_lessons,
         COUNT(DISTINCT l.id) as total_lessons
       FROM lessons l
       JOIN course_modules cm ON cm.id = l.module_id
       JOIN courses c ON c.id = cm.course_id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
       WHERE c.tenant_id = $2 AND c.status = 'published'`,
      [userId, tenantId]
    );

    const row = result.rows[0] || {};
    const completed = parseInt(row.completed_lessons) || 0;
    const total = parseInt(row.total_lessons) || 1;

    // Calculate consistency days (distinct days with activity)
    const consistencyResult = await query(
      `SELECT COUNT(DISTINCT DATE(updated_at)) as consistency_days
       FROM lesson_progress
       WHERE user_id = $1 AND updated_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId]
    ).catch(() => ({ rows: [{ consistency_days: 0 }] }));

    // Calculate streak (simplified)
    const streakResult = await query(
      `SELECT COUNT(DISTINCT DATE(updated_at)) as streak
       FROM lesson_progress
       WHERE user_id = $1 AND updated_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId]
    ).catch(() => ({ rows: [{ streak: 0 }] }));

    const consistency = parseInt(consistencyResult.rows[0]?.consistency_days) || 0;

    return {
      completed: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed_lessons: completed,
      total_lessons: total,
      streak: parseInt(streakResult.rows[0]?.streak) || 0,
      consistency: Math.min(consistency, 100),
    };
  } catch (error) {
    console.error("Error in getProgress:", error);
    return {
      completed: 0,
      completed_lessons: 0,
      total_lessons: 0,
      streak: 0,
      consistency: 0,
    };
  }
}

// Streak stats based on consecutive active days (lesson_progress updated_at dates)
// Returns values suitable for profile cards + weekly streak calendar.
async function getStreak({ tenantId, userId }) {
  // Keep a relatively small window for performance, but large enough
  // to compute "best streak" without being too myopic.
  const lookbackDaysForBest = 365;
  const lookbackDaysForActive = 180;

  try {
    const result = await query(
      `SELECT DISTINCT DATE(updated_at) as d
       FROM lesson_progress
       WHERE user_id = $1
         AND tenant_id = $2
         AND updated_at >= CURRENT_DATE - INTERVAL '${lookbackDaysForBest} days'
       ORDER BY d ASC`,
      [userId, tenantId]
    );

    const activeDates = (result.rows || [])
      .map((r) => r?.d)
      .filter(Boolean)
      .map((d) => {
        // Normalize to YYYY-MM-DD (UTC) to avoid timezone off-by-one.
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
      })
      .filter(Boolean);

    const activeSet = new Set(activeDates);
    const sortedDayNumbers = activeDates
      .map((s) => Math.floor(new Date(`${s}T00:00:00Z`).getTime() / 86400000))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const todayN = Math.floor(today.getTime() / 86400000);

    // Best streak = longest consecutive run
    let bestStreak = 0;
    let run = 0;
    let prevN = null;
    for (const n of sortedDayNumbers) {
      if (prevN === null || n === prevN + 1) {
        run = prevN === null ? 1 : run + 1;
      } else {
        bestStreak = Math.max(bestStreak, run);
        run = 1;
      }
      prevN = n;
    }
    bestStreak = Math.max(bestStreak, run);

    // Current streak = consecutive active days ending today
    let currentStreak = 0;
    if (activeSet.has(todayStr)) {
      let n = todayN;
      while (activeSet.has(new Date(n * 86400000).toISOString().slice(0, 10))) {
        currentStreak++;
        n--;
      }
    }

    const lastActiveDayStr = sortedDayNumbers.length
      ? new Date(sortedDayNumbers[sortedDayNumbers.length - 1] * 86400000).toISOString().slice(0, 10)
      : null;

    // Weekly calendar for UI (last 7 days incl today)
    const weeklyStreakDays = [];
    for (let i = 6; i >= 0; i--) {
      const n = todayN - i;
      const str = new Date(n * 86400000).toISOString().slice(0, 10);
      const d = new Date(`${str}T00:00:00`);
      weeklyStreakDays.push({
        date: str,
        active: activeSet.has(str),
        label: d.toLocaleDateString("en", { weekday: "short" }).charAt(0),
      });
    }

    // Active days for the last 180 days (used by WeeklyStreak component)
    const activeDays = activeDates.filter((s) => {
      const n = Math.floor(new Date(`${s}T00:00:00Z`).getTime() / 86400000);
      return n >= todayN - (lookbackDaysForActive - 1);
    });

    return {
      currentStreak,
      bestStreak,
      lastActiveDate: lastActiveDayStr,
      weeklyStreakDays,
      activeDays,
    };
  } catch (error) {
    console.error("Error in getStreak:", error);
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      weeklyStreakDays: [],
      activeDays: [],
    };
  }
}

async function getEvents({ tenantId }) {
  // Get live (ongoing) + upcoming events/workshops
  const result = await query(
    `SELECT id, title, starts_at, ends_at, slug
     FROM workshops
     WHERE tenant_id = $1 AND status = 'published'
       AND (ends_at >= NOW() OR starts_at >= NOW())
     ORDER BY
       CASE WHEN starts_at <= NOW() AND ends_at >= NOW() THEN 0 ELSE 1 END,
       starts_at ASC
     LIMIT 10`,
    [tenantId]
  );

  const now = new Date();
  return result.rows.map((row) => {
    const start = new Date(row.starts_at);
    const end = row.ends_at ? new Date(row.ends_at) : null;
    const isLive = start <= now && (!end || end >= now);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug || row.id,
      date: start.toLocaleDateString(),
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      isLive,
    };
  });
}

function normId(id) {
  return id != null ? String(id).toLowerCase() : "";
}

async function getEnrolledCourseIds({ tenantId, userId }) {
  const bonusCourseIds = await getBonusCourseIds({ tenantId });
  const bonusIdSet = new Set(bonusCourseIds.map((id) => normId(id)));

  const enrollResult = await query(
    `SELECT item_type, item_id FROM enrollments
     WHERE user_id = $1 AND tenant_id = $2 AND active = true`,
    [userId, tenantId]
  ).catch(() => ({ rows: [] }));

  const enrolledCourseIds = new Set();
  const enrolledPackIds = new Set();
  enrollResult.rows.forEach((r) => {
    if (r.item_type === "course") enrolledCourseIds.add(normId(r.item_id));
    if (r.item_type === "pack") enrolledPackIds.add(r.item_id);
  });

  if (enrolledPackIds.size > 0) {
    const packRes = await query(
      `SELECT course_id FROM course_pack_courses
       WHERE pack_id = ANY($1::uuid[])`,
      [Array.from(enrolledPackIds)]
    ).catch(() => ({ rows: [] }));
    packRes.rows.forEach((r) => enrolledCourseIds.add(normId(r.course_id)));
  }

  bonusCourseIds.forEach((id) => enrolledCourseIds.add(normId(id)));

  return enrolledCourseIds;
}

/** True if user has any active pack enrollment (for home carousel / pack marketing). */
async function hasPackEnrollment({ tenantId, userId }) {
  const { rows } = await query(
    `SELECT 1 FROM enrollments WHERE user_id = $1 AND tenant_id = $2 AND active = true AND item_type = 'pack' LIMIT 1`,
    [userId, tenantId]
  ).catch(() => ({ rows: [] }));
  return rows.length > 0;
}

// Courses: returns ALL published courses with enrolled flag (via direct enrollment or pack)
async function listEnrolledCourses({ tenantId, userId }) {
  try {
    const enrolledCourseIds = await getEnrolledCourseIds({ tenantId, userId });

    const result = await query(
      `SELECT c.id, c.title, c.slug, c.description, c.level, c.price_in_paise,
              COUNT(DISTINCT cm.id) as modules_count,
              COUNT(DISTINCT l.id) FILTER (WHERE lp.completed_at IS NOT NULL) as completed_lessons,
              COUNT(DISTINCT l.id) as total_lessons
       FROM courses c
       LEFT JOIN course_modules cm ON cm.course_id = c.id AND cm.status = 'published'
       LEFT JOIN lessons l ON l.module_id = cm.id AND l.status = 'published'
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
       WHERE c.tenant_id = $2 AND c.status = 'published'
       GROUP BY c.id, c.title, c.slug, c.description, c.level, c.price_in_paise, c.sort_order
       ORDER BY c.sort_order ASC, c.created_at ASC`,
      [userId, tenantId]
    );

    return result.rows.map((row) => {
      const totalLessons = parseInt(row.total_lessons) || 0;
      const completedLessons = parseInt(row.completed_lessons) || 0;
      const enrolled = enrolledCourseIds.has(normId(row.id));
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        level: row.level,
        price_in_paise: row.price_in_paise ?? 0,
        enrolled,
        modules_count: parseInt(row.modules_count) || 0,
        completed_lessons: enrolled ? completedLessons : 0,
        total_lessons: totalLessons,
        progress: enrolled && totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    });
  } catch (error) {
    console.error("Error in listEnrolledCourses:", error);
    return [];
  }
}

// Get course slug by id (for access rules)
async function getCourseSlugById({ tenantId, courseId }) {
  const { rows } = await query(
    `SELECT slug FROM courses WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
    [courseId, tenantId]
  ).catch(() => ({ rows: [] }));
  return rows[0]?.slug ? rows[0].slug.replace(/_/g, "-") : null;
}

function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

// Check enrollment for a course (direct or via any pack). No special-case for AI Automations.
async function hasEnrollmentForCourse({ tenantId, userId, courseId }) {
  const { rows } = await query(
    `SELECT 1 FROM enrollments e
     WHERE e.user_id = $1 AND e.tenant_id = $2 AND e.active = true
       AND (
         (e.item_type = 'course' AND e.item_id = $3::uuid)
         OR
         (e.item_type = 'pack' AND EXISTS (
           SELECT 1 FROM course_pack_courses cpc
           WHERE cpc.pack_id = e.item_id AND cpc.course_id = $3::uuid
         ))
       )
     LIMIT 1`,
    [userId, tenantId, courseId]
  ).catch(() => ({ rows: [] }));

  return rows.length > 0;
}

/** True if user has All Pack (pack containing all three main courses) or has all three main courses. Used for Real Client Lab access. */
async function hasAllPackOrAllThreeCourses({ tenantId, userId }) {
  const mainGroups = await getMainCourseIdGroups({ tenantId });
  if (mainGroups.length < 3) return false;

  const enrolledCourseIds = await getEnrolledCourseIds({ tenantId, userId });
  return mainGroups.slice(0, 3).every((group) => {
    return group.some((cid) => enrolledCourseIds.has(normId(cid)));
  });
}

/** Resolve course ids by slugs (normalize hyphen/underscore). */
async function getCourseIdsBySlugs({ tenantId, slugs }) {
  if (!slugs || slugs.length === 0) return [];
  const { rows } = await query(
    `SELECT id, REPLACE(slug, '_', '-') as norm_slug FROM courses
     WHERE tenant_id = $1 AND (slug = ANY($2::text[]) OR REPLACE(slug, '_', '-') = ANY($2::text[]))`,
    [tenantId, slugs]
  ).catch(() => ({ rows: [] }));
  const idBySlug = new Map();
  rows.forEach((r) => {
    const s = (r.norm_slug || "").replace(/_/g, "-");
    if (s) idBySlug.set(s, r.id);
  });
  return slugs.map((s) => idBySlug.get((s || "").replace(/_/g, "-"))).filter(Boolean);
}

/** Resolve the 3 main course id GROUPS (vibe, prompt-eng, prompt-profit). Each group is an array of course ids matching that slug set. */
async function getMainCourseIdGroups({ tenantId }) {
  const bonusIdSet = await getBonusCourseIdSet({ tenantId });

  const allSlugs = MAIN_COURSE_SLUG_OPTIONS.flat().filter(Boolean);
  const normSlugs = allSlugs.length > 0 ? allSlugs.map((s) => (s || "").toLowerCase().replace(/_/g, "-")) : [];
  let rows = [];
  if (normSlugs.length > 0) {
    const res = await query(
      `SELECT id, slug, REPLACE(slug, '_', '-') as norm_slug FROM courses
       WHERE tenant_id = $1 AND status = 'published'
       AND (LOWER(REPLACE(slug, '_', '-')) = ANY($2::text[]) OR slug = ANY($3::text[]))`,
      [tenantId, normSlugs, allSlugs]
    ).catch(() => ({ rows: [] }));
    rows = res.rows;
  }

  const idsByNormSlug = new Map();
  rows.forEach((r) => {
    const s = (r.norm_slug || r.slug || "").toLowerCase().replace(/_/g, "-");
    if (s) {
      if (!idsByNormSlug.has(s)) idsByNormSlug.set(s, []);
      const arr = idsByNormSlug.get(s);
      if (!arr.some((id) => sameId(id, r.id))) arr.push(r.id);
    }
  });
  const groups = [];
  for (const opts of MAIN_COURSE_SLUG_OPTIONS) {
    const groupIds = [];
    const seenInGroup = new Set();
    for (const slug of opts) {
      const n = (slug || "").toLowerCase().replace(/_/g, "-");
      const ids = idsByNormSlug.get(n) || [];
      for (const id of ids) {
        const key = normId(id);
        if (!seenInGroup.has(key)) {
          seenInGroup.add(key);
          groupIds.push(id);
        }
      }
    }
    groups.push(groupIds);
  }

  // Fallback: if slug matching left us with fewer than 3 non-empty groups, treat all published
  // non-bonus courses as "main" (up to 3) so "bought all 3" still unlocks bonus when tenant uses custom slugs.
  const filled = groups.filter((g) => g.length > 0).length;
  if (filled < 3) {
    const { rows: allRows } = await query(
      `SELECT id FROM courses WHERE tenant_id = $1 AND status = 'published' ORDER BY sort_order ASC NULLS LAST, created_at ASC`,
      [tenantId]
    ).catch(() => ({ rows: [] }));
    const alreadyInGroups = new Set(groups.flat().map((id) => normId(id)));
    const remaining = allRows.filter((r) => !bonusIdSet.has(normId(r.id)) && !alreadyInGroups.has(normId(r.id)));
    if (remaining.length >= 3) {
      return remaining.slice(0, 3).map((r) => [r.id]);
    }
    if (remaining.length > 0) {
      let idx = 0;
      const merged = groups.slice(0, 3).map((g) => {
        if (g.length > 0) return g;
        if (idx < remaining.length) return [remaining[idx++].id];
        return [];
      });
      if (merged.filter((m) => m.length > 0).length >= 3) return merged;
    }
  }

  return groups;
}

/** Resolve the 3 main course ids (one per logical course). Kept for callers that expect a flat list. */
async function getMainCourseIds({ tenantId }) {
  const groups = await getMainCourseIdGroups({ tenantId });
  return groups.map((g) => g[0]).filter(Boolean);
}

function slugLooksAlwaysFreeBonus(slug) {
  if (!slug) return false;
  const s = String(slug).toLowerCase().replace(/_/g, "-");
  if (s.includes("ai-automation")) return true;
  if (EXTRA_ALWAYS_FREE_BONUS_SLUG_VARIANTS.some((v) => s === String(v).toLowerCase().replace(/_/g, "-"))) return true;
  return false;
}

async function hasCourseAccess({ tenantId, userId, courseId }) {
  const bonusCourseIds = await getBonusCourseIds({ tenantId });
  if (bonusCourseIds.some((id) => sameId(courseId, id))) return true;
  const slug = await getCourseSlugById({ tenantId, courseId });
  if (slug && slugLooksAlwaysFreeBonus(slug)) return true;
  return hasEnrollmentForCourse({ tenantId, userId, courseId });
}

async function getContinueTargetByCourseSlug({ tenantId, userId, courseSlug }) {
  const courseRow = await query(
    `SELECT id, slug
     FROM courses
     WHERE tenant_id = $1
       AND status = 'published'
       AND (slug = $2 OR REPLACE(slug, '_', '-') = $2)
     LIMIT 1`,
    [tenantId, courseSlug]
  ).catch(() => ({ rows: [] }));

  const course = courseRow.rows[0];
  if (!course?.id) return null;

  const { rows } = await query(
    `SELECT
       c.slug AS course_slug,
       m.slug AS module_slug,
       l.slug AS lesson_slug,
       lp.completed_at
     FROM courses c
     JOIN course_modules m
       ON m.course_id = c.id
      AND m.tenant_id = c.tenant_id
      AND m.status = 'published'
     JOIN lessons l
       ON l.module_id = m.id
      AND l.tenant_id = m.tenant_id
      AND l.status = 'published'
     LEFT JOIN lesson_progress lp
       ON lp.lesson_id = l.id
      AND lp.tenant_id = c.tenant_id
      AND lp.user_id = $2
     WHERE c.tenant_id = $1
       AND c.id = $3
       AND c.status = 'published'
     ORDER BY
       CASE WHEN lp.completed_at IS NULL THEN 0 ELSE 1 END,
       m.position ASC NULLS LAST,
       m.created_at ASC,
       l.position ASC NULLS LAST,
       l.created_at ASC
     LIMIT 1`,
    [tenantId, userId, course.id]
  ).catch(() => ({ rows: [] }));

  const row = rows[0];
  if (!row?.module_slug || !row?.lesson_slug) return null;

  return {
    courseSlug: row.course_slug || course.slug,
    moduleSlug: row.module_slug,
    lessonSlug: row.lesson_slug,
  };
}

async function enhanceCourseWithProgress({ tenantId, userId, course }) {
  try {
    // Enhance modules and lessons with progress data
    const lessonIds = [];
    course.modules?.forEach((module) => {
      module.lessons?.forEach((lesson) => {
        if (lesson.id) lessonIds.push(lesson.id);
      });
    });

    if (lessonIds.length === 0) return course;

    const progressResult = await query(
      `SELECT lesson_id, completed_at, watch_seconds, last_position_seconds
       FROM lesson_progress
       WHERE user_id = $1 AND lesson_id = ANY($2::uuid[])`,
      [userId, lessonIds]
    ).catch(() => ({ rows: [] }));

    const progressMap = new Map();
    progressResult.rows.forEach((row) => {
      progressMap.set(row.lesson_id, {
        completed: !!row.completed_at,
        progress: row.completed_at ? 100 : 0, // Calculate progress based on completion
      });
    });

    // Enhance course structure
    const enhancedModules = course.modules.map((module) => ({
      ...module,
      lessons: (module.lessons || []).map((lesson) => {
        const progress = progressMap.get(lesson.id) || { completed: false, progress: 0 };
        return {
          ...lesson,
          completed: progress.completed,
          locked: false, // Determine based on prerequisites
        };
      }),
    }));

    return {
      ...course,
      modules: enhancedModules,
    };
  } catch (error) {
    console.error("Error in enhanceCourseWithProgress:", error);
    return course; // Return original course on error
  }
}

async function enhanceLessonWithData({ tenantId, userId, lesson, moduleLessons }) {
  // lesson is the result from contentRepo.getPublishedLessonBySlugs
  // which returns { lesson: {...}, resources: [...], practice: [...] }
  const lessonRow = lesson.lesson || lesson;
  const lessonId = lessonRow.lesson_id || lessonRow.id;

  // Get progress for lesson
  const progressResult = await query(
    `SELECT completed_at, watch_seconds, last_position_seconds
     FROM lesson_progress
     WHERE user_id = $1 AND lesson_id = $2`,
    [userId, lessonId]
  ).catch(() => ({ rows: [] }));

  const progress = progressResult.rows[0] || {};
  const completed = !!progress.completed_at;

  // Get resources (cheatsheets, slides, etc.) - already included from contentRepo
  const resources = lesson.resources || [];

  // Get MCQs (using lesson_mcqs table)
  const mcqsResult = await query(
    `SELECT id, question, options
     FROM lesson_mcqs
     WHERE tenant_id = $1 AND lesson_id = $2
     ORDER BY sort_order ASC
     LIMIT 10`,
    [tenantId, lessonId]
  ).catch(() => ({ rows: [] }));

  // Get practice tasks - already included from contentRepo
  const practiceTasks = lesson.practice || [];

  // Enhance module lessons with progress
  const lessonIds = moduleLessons.map((l) => l.id);
  const progressMap = new Map();
  if (lessonIds.length > 0) {
    const allProgress = await query(
      `SELECT lesson_id, completed_at
       FROM lesson_progress
       WHERE user_id = $1 AND lesson_id = ANY($2::uuid[])`,
      [userId, lessonIds]
    ).catch(() => ({ rows: [] }));

    allProgress.rows.forEach((row) => {
      progressMap.set(row.lesson_id, { completed: !!row.completed_at });
    });
  }

  const moduleLessonsEnhanced = moduleLessons.map((l) => {
    const lProgress = progressMap.get(l.id) || { completed: false };
    return {
      ...l,
      completed: lProgress.completed,
      locked: false,
    };
  });

  const normalizeLearnSetupSteps = (row) => {
    let steps = row.learn_setup_steps;
    if (typeof steps === "string") {
      try {
        steps = JSON.parse(steps);
      } catch {
        steps = null;
      }
    }

    // Canonical shape: array of sections.
    if (Array.isArray(steps) && steps.length > 0) return steps;

    // Legacy/object shape support: { sections: [...] } / { steps: [...] } / single section object.
    if (steps && typeof steps === "object") {
      if (Array.isArray(steps.sections) && steps.sections.length > 0) return steps.sections;
      if (Array.isArray(steps.steps) && steps.steps.length > 0) return steps.steps;
      if (Array.isArray(steps.items) && steps.items.length > 0) return steps.items;
      if (steps.type && typeof steps.type === "string") return [steps];
    }

    // Fallback to summary text when present.
    const summary = String(row.summary || "").trim();
    if (summary) return [summary];

    return [];
  };

  return {
    lesson: {
      id: lessonRow.lesson_id || lessonRow.id,
      title: lessonRow.lesson_title || lessonRow.title,
      slug: lessonRow.lesson_slug || lessonRow.slug,
      summary: lessonRow.summary,
      goal: lessonRow.goal,
      video_provider: lessonRow.video_provider,
      video_id: lessonRow.video_id,
      video_url: lessonRow.video_url,
      video_captions: lessonRow.video_captions || null,
      prompts: lessonRow.prompts,
      success_image_url: lessonRow.success_image_url,
      success_image_urls: (() => {
        let urls = lessonRow.success_image_urls;
        if (typeof urls === 'string') {
          try { urls = JSON.parse(urls); } catch { urls = null; }
        }
        if (Array.isArray(urls)) return urls;
        const single = lessonRow.success_image_url;
        return single ? [single] : [];
      })(),
      learn_setup_steps: normalizeLearnSetupSteps(lessonRow),
      pdf_url: lessonRow.pdf_url,
      duration_seconds: lessonRow.duration_seconds,
      completed,
    },
    moduleLessons: moduleLessonsEnhanced,
    resources: resources.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      url: row.url,
      body: row.body,
    })),
    mcqs: mcqsResult.rows.map((row) => {
      const optionsArray = Array.isArray(row.options) ? row.options : (row.options ? JSON.parse(row.options) : []);
      // Extract correct answer from options array (find option with isCorrect: true)
      const correctOption = optionsArray.find(opt => opt.isCorrect === true);
      return {
        id: row.id,
        question: row.question,
        options: optionsArray.map(opt => opt.text || opt),
        correct_answer: correctOption?.text || correctOption || optionsArray[0]?.text || "",
      };
    }),
    practiceTasks: practiceTasks.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.prompt,
      desired_output: row.expected_output,
      required_things: [],
    })),
    completed,
  };
}

// Discussions
async function listDiscussions({ tenantId }) {
  const result = await query(
    `SELECT d.id, d.discussion_name, d.problem, d.author_id, u.full_name as author_name,
            d.created_at, d.upvotes,
            (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies_count
     FROM discussions d
     LEFT JOIN users u ON u.id = d.author_id
     WHERE d.tenant_id = $1
     ORDER BY d.created_at DESC`,
    [tenantId]
  );

  return result.rows;
}

async function createDiscussion({ tenantId, userId, data }) {
  const result = await query(
    `INSERT INTO discussions (tenant_id, author_id, discussion_name, problem)
     VALUES ($1, $2, $3, $4)
     RETURNING id, discussion_name, problem, author_id, created_at, upvotes`,
    [tenantId, userId, data.discussion_name, data.problem]
  );

  return result.rows[0];
}

async function getDiscussion({ tenantId, discussionId }) {
  const result = await query(
    `SELECT d.id, d.discussion_name, d.problem, d.author_id, u.full_name as author_name,
            d.created_at, d.upvotes
     FROM discussions d
     LEFT JOIN users u ON u.id = d.author_id
     WHERE d.tenant_id = $1 AND d.id = $2`,
    [tenantId, discussionId]
  );

  if (result.rows.length === 0) return null;

  const discussion = result.rows[0];

  // Get replies
  const repliesResult = await query(
    `SELECT dr.id, dr.message, dr.author_id, u.full_name as author_name, dr.created_at
     FROM discussion_replies dr
     LEFT JOIN users u ON u.id = dr.author_id
     WHERE dr.discussion_id = $1
     ORDER BY dr.created_at ASC`,
    [discussionId]
  );

  return {
    ...discussion,
    replies: repliesResult.rows,
    replies_count: repliesResult.rows.length,
  };
}

async function createReply({ tenantId, userId, discussionId, message }) {
  const result = await query(
    `INSERT INTO discussion_replies (tenant_id, discussion_id, author_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, message, author_id, created_at`,
    [tenantId, discussionId, userId, message]
  );

  return result.rows[0];
}

async function upvoteDiscussion({ tenantId, userId, discussionId }) {
  // Check if already upvoted
  const existing = await query(
    `SELECT id FROM discussion_upvotes
     WHERE discussion_id = $1 AND user_id = $2`,
    [discussionId, userId]
  );

  if (existing.rows.length === 0) {
    await query(
      `INSERT INTO discussion_upvotes (tenant_id, discussion_id, user_id)
       VALUES ($1, $2, $3)`,
      [tenantId, discussionId, userId]
    );

    await query(
      `UPDATE discussions SET upvotes = upvotes + 1 WHERE id = $1`,
      [discussionId]
    );
  }
}

// Bookmarks
async function listBookmarks({ tenantId, userId }) {
  const result = await query(
    `SELECT 
      b.id, 
      b.type, 
      b.item_id, 
      b.created_at,
      CASE 
        WHEN b.type = 'lesson' THEN l.title
        WHEN b.type = 'mcq' THEN lmq.question
        WHEN b.type = 'practice' THEN pt.title
        WHEN b.type = 'discussion' THEN d.discussion_name
        ELSE NULL
      END as title,
      CASE 
        WHEN b.type = 'lesson' THEN l.summary
        WHEN b.type = 'mcq' THEN lmq.question
        WHEN b.type = 'practice' THEN pt.prompt
        WHEN b.type = 'discussion' THEN d.problem
        ELSE NULL
      END as description,
      CASE 
        WHEN b.type = 'lesson' THEN c.slug
        ELSE NULL
      END as course_slug,
      CASE 
        WHEN b.type = 'lesson' THEN cm.slug
        ELSE NULL
      END as module_slug,
      CASE 
        WHEN b.type = 'lesson' THEN l.slug
        ELSE NULL
      END as lesson_slug,
      CASE 
        WHEN b.type = 'lesson' THEN c.title
        ELSE NULL
      END as course_title
     FROM bookmarks b
     LEFT JOIN lessons l ON b.type = 'lesson' AND b.item_id = l.id AND b.tenant_id = l.tenant_id
     LEFT JOIN course_modules cm ON l.module_id = cm.id AND b.tenant_id = cm.tenant_id
     LEFT JOIN courses c ON cm.course_id = c.id AND b.tenant_id = c.tenant_id
     LEFT JOIN lesson_mcqs lmq ON b.type = 'mcq' AND b.item_id = lmq.id AND b.tenant_id = lmq.tenant_id
     LEFT JOIN practice_tasks pt ON b.type = 'practice' AND b.item_id = pt.id AND b.tenant_id = pt.tenant_id
     LEFT JOIN discussions d ON b.type = 'discussion' AND b.item_id = d.id AND b.tenant_id = d.tenant_id
     WHERE b.tenant_id = $1 AND b.user_id = $2
     ORDER BY b.created_at DESC`,
    [tenantId, userId]
  );

  return result.rows;
}

async function createBookmark({ tenantId, userId, data }) {
  // Check if already bookmarked
  const existing = await query(
    `SELECT id FROM bookmarks
     WHERE tenant_id = $1 AND user_id = $2 AND type = $3 AND item_id = $4`,
    [tenantId, userId, data.type, data.item_id]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await query(
    `INSERT INTO bookmarks (tenant_id, user_id, type, item_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, type, item_id, created_at`,
    [tenantId, userId, data.type, data.item_id]
  );

  return result.rows[0];
}

async function deleteBookmark({ tenantId, userId, bookmarkId }) {
  await query(
    `DELETE FROM bookmarks
     WHERE id = $1 AND tenant_id = $2 AND user_id = $3`,
    [bookmarkId, tenantId, userId]
  );
}

async function searchContent({ tenantId, userId, q }) {
  if (!q || typeof q !== "string" || q.trim().length < 2) return [];
  const term = `%${q.trim().toLowerCase()}%`;

  const coursesResult = await query(
    `SELECT c.id, c.title, c.slug, c.description
     FROM courses c
     WHERE c.tenant_id = $1 AND c.status = 'published'
       AND (LOWER(c.title) LIKE $2 OR LOWER(COALESCE(c.description, '')) LIKE $2)
     ORDER BY c.title ASC
     LIMIT 5`,
    [tenantId, term]
  ).catch(() => ({ rows: [] }));

  const modulesResult = await query(
    `SELECT cm.id, cm.title, cm.slug, c.id as course_id, c.slug as course_slug, c.title as course_title
     FROM course_modules cm
     JOIN courses c ON c.id = cm.course_id
     WHERE c.tenant_id = $1 AND c.status = 'published' AND cm.status = 'published'
       AND LOWER(cm.title) LIKE $2
     ORDER BY cm.title ASC
     LIMIT 8`,
    [tenantId, term]
  ).catch(() => ({ rows: [] }));

  const lessonsResult = await query(
    `SELECT l.id, l.title, l.slug, cm.slug as module_slug, cm.title as module_title,
            c.id as course_id, c.slug as course_slug, c.title as course_title
     FROM lessons l
     JOIN course_modules cm ON cm.id = l.module_id
     JOIN courses c ON c.id = cm.course_id
     WHERE c.tenant_id = $1 AND c.status = 'published' AND cm.status = 'published' AND l.status = 'published'
       AND (LOWER(l.title) LIKE $2 OR LOWER(COALESCE(l.summary, '')) LIKE $2 OR LOWER(COALESCE(l.goal, '')) LIKE $2)
     ORDER BY l.title ASC
     LIMIT 10`,
    [tenantId, term]
  ).catch(() => ({ rows: [] }));

  const enrolledCourseIds = await getEnrolledCourseIds({ tenantId, userId });

  const results = [];
  coursesResult.rows.filter((r) => enrolledCourseIds.has(normId(r.id))).forEach((r) => {
    results.push({
      type: "course",
      id: r.id,
      title: r.title,
      slug: r.slug,
      subtitle: r.description ? r.description.slice(0, 60) + (r.description.length > 60 ? "…" : "") : null,
      path: `/lms/student/courses`,
      courseSlug: r.slug,
      moduleSlug: null,
      lessonSlug: null,
    });
  });
  modulesResult.rows.filter((r) => enrolledCourseIds.has(normId(r.course_id))).forEach((r) => {
    results.push({
      type: "module",
      id: r.id,
      title: r.title,
      slug: r.slug,
      subtitle: r.course_title,
      path: `/lms/student/courses`,
      courseSlug: r.course_slug,
      moduleSlug: r.slug,
      lessonSlug: null,
    });
  });
  lessonsResult.rows.filter((r) => enrolledCourseIds.has(normId(r.course_id))).forEach((r) => {
    results.push({
      type: "lesson",
      id: r.id,
      title: r.title,
      slug: r.slug,
      subtitle: `${r.course_title} › ${r.module_title}`,
      path: `/lms/student/courses`,
      courseSlug: r.course_slug,
      moduleSlug: r.module_slug,
      lessonSlug: r.slug,
    });
  });

  return results;
}

async function getModuleLessons({ tenantId, moduleId }) {
  const result = await query(
    `SELECT id, title, slug, summary, position
     FROM lessons
     WHERE tenant_id = $1 AND module_id = $2 AND status = 'published'
     ORDER BY position ASC, created_at ASC`,
    [tenantId, moduleId]
  );
  return result.rows;
}

async function getLearningState({ tenantId, userId }) {
  const [notesRes, bookmarksRes] = await Promise.all([
    query(
      `SELECT lesson_path, note_text, updated_at
       FROM student_lesson_notes
       WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId]
    ).catch(() => ({ rows: [] })),
    query(
      `SELECT lesson_path, title, updated_at
       FROM student_lesson_bookmarks
       WHERE tenant_id = $1 AND user_id = $2
       ORDER BY updated_at DESC`,
      [tenantId, userId]
    ).catch(() => ({ rows: [] })),
  ]);

  const notes = {};
  for (const row of notesRes.rows || []) {
    notes[row.lesson_path] = {
      text: row.note_text || "",
      updated: row.updated_at,
    };
  }

  const bookmarks = (bookmarksRes.rows || []).map((row) => ({
    path: row.lesson_path,
    title: row.title || row.lesson_path,
    date: row.updated_at,
  }));

  return { notes, bookmarks };
}

async function upsertLessonNote({ tenantId, userId, lessonPath, noteText }) {
  await query(
    `INSERT INTO student_lesson_notes (tenant_id, user_id, lesson_path, note_text, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (tenant_id, user_id, lesson_path)
     DO UPDATE SET note_text = EXCLUDED.note_text, updated_at = now()`,
    [tenantId, userId, lessonPath, noteText]
  );
}

async function deleteLessonNote({ tenantId, userId, lessonPath }) {
  await query(
    `DELETE FROM student_lesson_notes
     WHERE tenant_id = $1 AND user_id = $2 AND lesson_path = $3`,
    [tenantId, userId, lessonPath]
  );
}

async function upsertLessonBookmark({ tenantId, userId, lessonPath, title }) {
  await query(
    `INSERT INTO student_lesson_bookmarks (tenant_id, user_id, lesson_path, title, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (tenant_id, user_id, lesson_path)
     DO UPDATE SET title = EXCLUDED.title, updated_at = now()`,
    [tenantId, userId, lessonPath, title || null]
  );
}

async function deleteLessonBookmark({ tenantId, userId, lessonPath }) {
  await query(
    `DELETE FROM student_lesson_bookmarks
     WHERE tenant_id = $1 AND user_id = $2 AND lesson_path = $3`,
    [tenantId, userId, lessonPath]
  );
}

module.exports = {
  getSchedule,
  getCurrentCourse,
  getProgress,
  getStreak,
  getEvents,
  listEnrolledCourses,
  getEnrolledCourseIds,
  hasPackEnrollment,
  hasEnrollmentForCourse,
  hasCourseAccess,
  hasAllPackOrAllThreeCourses,
  enhanceCourseWithProgress,
  enhanceLessonWithData,
  getContinueTargetByCourseSlug,
  searchContent,
  listDiscussions,
  createDiscussion,
  getDiscussion,
  createReply,
  upvoteDiscussion,
  listBookmarks,
  createBookmark,
  deleteBookmark,
  getLearningState,
  upsertLessonNote,
  deleteLessonNote,
  upsertLessonBookmark,
  deleteLessonBookmark,
  getModuleLessons,
};
