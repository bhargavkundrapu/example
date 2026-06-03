// apps/api/src/modules/users/users.repo.js
const { query } = require("../../db/query");

/** Escape % and _ so ILIKE search is literal (user-supplied patterns cannot widen matches). */
function escapeIlikeMetacharacters(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

async function findUserByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;
  const { rows } = await query(
    `SELECT id, email, phone, full_name, password_hash, is_active
     FROM users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [normalized]
  );
  return rows[0] ?? null;
}

async function findUserById(id) {
  if (!id) return null;
  const { rows } = await query(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function createUser({ email, fullName, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO users (email, full_name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, is_active`,
    [email, fullName ?? null, passwordHash]
  );
  return rows[0];
}

async function findRoleIdForTenant({ tenantId, roleName }, client) {
  const db = client || { query: (...args) => query(...args) };
  const { rows } = await db.query(
    `SELECT id FROM roles WHERE tenant_id = $1 AND name = $2 LIMIT 1`,
    [tenantId, roleName]
  );
  return rows[0]?.id ?? null;
}

async function upsertMembership({ tenantId, userId, roleId }, client) {
  const db = client || { query: (...args) => query(...args) };
  const { rows } = await db.query(
    `INSERT INTO memberships (tenant_id, user_id, role_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, user_id)
     DO UPDATE SET role_id = EXCLUDED.role_id, updated_at = now()
     RETURNING id, tenant_id, user_id, role_id`,
    [tenantId, userId, roleId]
  );
  return rows[0];
}

async function getMembershipWithRole({ tenantId, userId }) {
  const { rows } = await query(
    `SELECT m.id AS membership_id, m.tenant_id, m.user_id, r.id AS role_id, r.name AS role_name
     FROM memberships m
     JOIN roles r ON r.id = m.role_id
     WHERE m.tenant_id = $1 AND m.user_id = $2
     LIMIT 1`,
    [tenantId, userId]
  );
  return rows[0] ?? null;
}

// Tenant Admin: List all users in tenant
async function listTenantUsers({ tenantId }) {
  const { rows } = await query(
    `SELECT 
       u.id,
       u.email,
       u.full_name,
       u.phone,
       u.is_active,
       u.created_at,
       m.id AS membership_id,
       r.id AS role_id,
       r.name AS role_name
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     ORDER BY u.created_at DESC`,
    [tenantId]
  );
  return rows;
}

// Tenant Admin: Get user details
async function getTenantUser({ tenantId, userId }) {
  const { rows } = await query(
    `SELECT 
       u.id,
       u.email,
       u.full_name,
       u.phone,
       u.is_active,
       u.created_at,
       m.id AS membership_id,
       r.id AS role_id,
       r.name AS role_name
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     WHERE u.id = $2
     LIMIT 1`,
    [tenantId, userId]
  );
  return rows[0] ?? null;
}

// Tenant Admin: Update user role
async function updateUserRole({ tenantId, userId, roleId }) {
  const { rows } = await query(
    `UPDATE memberships
     SET role_id = $3, updated_at = now()
     WHERE tenant_id = $1 AND user_id = $2
     RETURNING id, tenant_id, user_id, role_id`,
    [tenantId, userId, roleId]
  );
  return rows[0] ?? null;
}

// Tenant Admin: Update user status
async function updateUserStatus({ userId, isActive }) {
  const { rows } = await query(
    `UPDATE users
     SET is_active = $2, updated_at = now()
     WHERE id = $1
     RETURNING id, email, full_name, is_active`,
    [userId, isActive]
  );
  return rows[0] ?? null;
}

// Tenant Admin: Get all available roles for tenant
async function listTenantRoles({ tenantId }) {
  const { rows } = await query(
    `SELECT id, name, description
     FROM roles
     WHERE tenant_id = $1
     ORDER BY name`,
    [tenantId]
  );
  return rows;
}

// SuperAdmin: List all students with filters (only active students)
async function listStudents({
  tenantId,
  search,
  roleName = "Student",
  enrollmentCourseId,
  enrollmentPackId,
}) {
  let sql = `
    SELECT 
       u.id,
       u.email,
       u.full_name,
       u.phone,
       u.college,
       u.is_active,
       u.created_at,
       m.id AS membership_id,
       r.id AS role_id,
       r.name AS role_name
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     WHERE r.name = $2 AND u.is_active = true
  `;
  const params = [tenantId, roleName];
  let nextParam = 3;

  if (search) {
    const like = `%${escapeIlikeMetacharacters(search)}%`;
    sql += ` AND (u.full_name ILIKE $${nextParam} ESCAPE '\\' OR u.email ILIKE $${nextParam} ESCAPE '\\' OR u.phone ILIKE $${nextParam} ESCAPE '\\')`;
    params.push(like);
    nextParam += 1;
  }

  if (enrollmentCourseId) {
    sql += ` AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.user_id = u.id AND e.tenant_id = $1 AND e.active = true
      AND (
        (e.item_type = 'course' AND e.item_id = $${nextParam}::uuid)
        OR (
          e.item_type = 'pack' AND EXISTS (
            SELECT 1 FROM course_pack_courses cpc
            WHERE cpc.pack_id = e.item_id AND cpc.course_id = $${nextParam}::uuid
          )
        )
      )
    )`;
    params.push(enrollmentCourseId);
    nextParam += 1;
  } else if (enrollmentPackId) {
    sql += ` AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.user_id = u.id AND e.tenant_id = $1 AND e.active = true
      AND e.item_type = 'pack' AND e.item_id = $${nextParam}::uuid
    )`;
    params.push(enrollmentPackId);
    nextParam += 1;
  }

  sql += ` ORDER BY u.created_at DESC`;

  const { rows } = await query(sql, params);
  return rows;
}

async function listStudentsLeaderboard({ tenantId, search, limit = 200 }) {
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 200));
  const searchLike = search ? `%${escapeIlikeMetacharacters(search)}%` : null;
  const { rows } = await query(
    `WITH active_students AS (
       SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.college,
         u.created_at
       FROM users u
       JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
       JOIN roles r ON r.id = m.role_id
       WHERE r.name = 'Student'
         AND u.is_active = true
         AND (
           $2::text IS NULL
           OR u.full_name ILIKE $2 ESCAPE '\\'
           OR u.email ILIKE $2 ESCAPE '\\'
           OR u.phone ILIKE $2 ESCAPE '\\'
           OR u.college ILIKE $2 ESCAPE '\\'
         )
     ),
     student_enrolled_courses AS (
       SELECT DISTINCT
         e.user_id,
         e.item_id AS course_id
       FROM enrollments e
       JOIN active_students s ON s.id = e.user_id
       WHERE e.tenant_id = $1
         AND e.active = true
         AND e.item_type = 'course'

       UNION

       SELECT DISTINCT
         e.user_id,
         cpc.course_id
       FROM enrollments e
       JOIN active_students s ON s.id = e.user_id
       JOIN course_pack_courses cpc ON cpc.pack_id = e.item_id
       WHERE e.tenant_id = $1
         AND e.active = true
         AND e.item_type = 'pack'
     ),
     course_lesson_totals AS (
       SELECT
         c.id AS course_id,
         c.title AS course_title,
         c.slug AS course_slug,
         COUNT(DISTINCT l.id)::int AS total_lessons
       FROM courses c
       LEFT JOIN course_modules cm ON cm.course_id = c.id AND cm.status = 'published'
       LEFT JOIN lessons l ON l.module_id = cm.id AND l.status = 'published'
       WHERE c.tenant_id = $1
       GROUP BY c.id, c.title, c.slug
     ),
     student_course_progress AS (
       SELECT
         sec.user_id,
         sec.course_id,
         clt.course_title,
         clt.course_slug,
         COALESCE(clt.total_lessons, 0)::int AS total_lessons,
         COUNT(DISTINCT l.id) FILTER (WHERE lp.completed_at IS NOT NULL)::int AS completed_lessons
       FROM student_enrolled_courses sec
       LEFT JOIN course_lesson_totals clt ON clt.course_id = sec.course_id
       LEFT JOIN course_modules cm ON cm.course_id = sec.course_id AND cm.status = 'published'
       LEFT JOIN lessons l ON l.module_id = cm.id AND l.status = 'published'
       LEFT JOIN lesson_progress lp
         ON lp.tenant_id = $1
        AND lp.user_id = sec.user_id
        AND lp.lesson_id = l.id
       GROUP BY sec.user_id, sec.course_id, clt.course_title, clt.course_slug, clt.total_lessons
     ),
     student_summary AS (
       SELECT
         scp.user_id,
         COALESCE(SUM(scp.completed_lessons), 0)::int AS completed_lessons,
         COALESCE(SUM(scp.total_lessons), 0)::int AS total_lessons,
         COUNT(*)::int AS enrolled_courses_count,
         COALESCE(
           json_agg(
             json_build_object(
               'course_id', scp.course_id,
               'title', scp.course_title,
               'slug', scp.course_slug,
               'completed_lessons', scp.completed_lessons,
               'total_lessons', scp.total_lessons,
               'progress_percent',
               CASE
                 WHEN scp.total_lessons > 0
                   THEN LEAST(100, ROUND((scp.completed_lessons::numeric / scp.total_lessons::numeric) * 100))
                 ELSE 0
               END
             )
             ORDER BY scp.course_title ASC
           ),
           '[]'::json
         ) AS course_progress
       FROM student_course_progress scp
       GROUP BY scp.user_id
     )
     SELECT
       s.id,
       s.full_name,
       s.email,
       s.phone,
       s.college,
       s.created_at,
       COALESCE(ss.completed_lessons, 0)::int AS completed_lessons,
       COALESCE(ss.total_lessons, 0)::int AS total_lessons,
       CASE
         WHEN COALESCE(ss.total_lessons, 0) > 0
           THEN LEAST(100, ROUND((COALESCE(ss.completed_lessons, 0)::numeric / ss.total_lessons::numeric) * 100))
         ELSE 0
       END::int AS progress_percent,
       COALESCE(ss.enrolled_courses_count, 0)::int AS enrolled_courses_count,
       COALESCE(ss.course_progress, '[]'::json) AS course_progress
     FROM active_students s
     LEFT JOIN student_summary ss ON ss.user_id = s.id
     ORDER BY
       CASE
         WHEN COALESCE(ss.total_lessons, 0) > 0
           THEN ROUND((COALESCE(ss.completed_lessons, 0)::numeric / ss.total_lessons::numeric) * 100)
         ELSE 0
       END DESC,
       COALESCE(ss.completed_lessons, 0) DESC,
       s.full_name ASC
     LIMIT $3`,
    [tenantId, searchLike, safeLimit]
  );

  return rows.map((row, idx) => ({
    ...row,
    rank: idx + 1,
  }));
}

function lessonProgressPercent(completed, total) {
  const c = Number(completed) || 0;
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.round((c / t) * 100));
}

async function fetchCourseProgressMap({ tenantId, userId, courseIds }) {
  if (!courseIds?.length) return new Map();
  const { rows } = await query(
    `SELECT c.id AS course_id,
            c.title,
            c.slug,
            COUNT(DISTINCT l.id) FILTER (WHERE lp.completed_at IS NOT NULL)::int AS completed_lessons,
            COUNT(DISTINCT l.id)::int AS total_lessons
     FROM courses c
     LEFT JOIN course_modules cm ON cm.course_id = c.id AND cm.status = 'published'
     LEFT JOIN lessons l ON l.module_id = cm.id AND l.status = 'published'
     LEFT JOIN lesson_progress lp
       ON lp.lesson_id = l.id AND lp.user_id = $2 AND lp.tenant_id = $1
     WHERE c.tenant_id = $1 AND c.id = ANY($3::uuid[])
     GROUP BY c.id, c.title, c.slug`,
    [tenantId, userId, courseIds]
  );
  const map = new Map();
  for (const row of rows) {
    const completed = row.completed_lessons || 0;
    const total = row.total_lessons || 0;
    map.set(String(row.course_id), {
      course_id: row.course_id,
      title: row.title,
      slug: row.slug,
      completed_lessons: completed,
      total_lessons: total,
      progress_percent: lessonProgressPercent(completed, total),
    });
  }
  return map;
}

function collectEnrolledCourseIds(enrollments) {
  const ids = new Set();
  for (const e of enrollments) {
    if (e.item_type === "course" && e.item_id) ids.add(String(e.item_id));
    if (e.item_type === "pack" && Array.isArray(e.included_courses)) {
      for (const c of e.included_courses) {
        if (c.course_id) ids.add(String(c.course_id));
      }
    }
  }
  return [...ids];
}

function attachEnrollmentProgress(enrollment, progressMap) {
  if (enrollment.item_type === "course") {
    const cp = progressMap.get(String(enrollment.item_id));
    return {
      ...enrollment,
      completed_lessons: cp?.completed_lessons ?? 0,
      total_lessons: cp?.total_lessons ?? 0,
      progress_percent: cp?.progress_percent ?? 0,
    };
  }
  if (enrollment.item_type === "pack") {
    const courses = Array.isArray(enrollment.included_courses) ? enrollment.included_courses : [];
    const courseProgress = courses.map((c) => {
      const cp = progressMap.get(String(c.course_id));
      return {
        course_id: c.course_id,
        title: c.title,
        slug: c.slug,
        completed_lessons: cp?.completed_lessons ?? 0,
        total_lessons: cp?.total_lessons ?? 0,
        progress_percent: cp?.progress_percent ?? 0,
      };
    });
    let completed = 0;
    let total = 0;
    for (const cp of courseProgress) {
      completed += cp.completed_lessons;
      total += cp.total_lessons;
    }
    return {
      ...enrollment,
      completed_lessons: completed,
      total_lessons: total,
      progress_percent: lessonProgressPercent(completed, total),
      course_progress: courseProgress,
    };
  }
  return {
    ...enrollment,
    completed_lessons: 0,
    total_lessons: 0,
    progress_percent: 0,
  };
}

// SuperAdmin: Get student with progress and stats
async function getStudentWithStats({ tenantId, userId }) {
  // Get basic user info
  const userRows = await query(
    `SELECT
       u.id,
       u.email,
       u.full_name,
       u.phone,
       u.college,
       u.is_active,
       u.created_at,
       m.id AS membership_id,
       r.id AS role_id,
       r.name AS role_name
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     WHERE u.id = $2 AND r.name = 'Student'
     LIMIT 1`,
    [tenantId, userId]
  );
  
  if (!userRows.rows[0]) return null;
  
  const user = userRows.rows[0];

  // Backfill phone/college from payment_orders if missing
  if (!user.phone || !user.college) {
    const poRows = await query(
      `SELECT customer_phone, customer_college FROM payment_orders
       WHERE LOWER(customer_email) = LOWER($1) AND status = 'paid'
       ORDER BY created_at DESC LIMIT 1`,
      [user.email]
    );
    const po = poRows.rows[0];
    if (po) {
      if (!user.phone && po.customer_phone) {
        user.phone = po.customer_phone;
        query(`UPDATE users SET phone = $1, updated_at = now() WHERE id = $2 AND phone IS NULL`, [po.customer_phone, user.id]).catch(() => {});
      }
      if (!user.college && po.customer_college) {
        user.college = po.customer_college;
        query(`UPDATE users SET college = $1, updated_at = now() WHERE id = $2 AND college IS NULL`, [po.customer_college, user.id]).catch(() => {});
      }
    }
  }

  // Get progress stats
  const progressRows = await query(
    `SELECT
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed_lessons,
        COUNT(*) FILTER (WHERE completed_at IS NULL AND started_at IS NOT NULL) AS in_progress_lessons,
        COALESCE(SUM(watch_seconds), 0) AS total_watch_seconds
     FROM lesson_progress
     WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, userId]
  );
  
  // Get project stats (client lab)
  const projectRows = await query(
    `SELECT COUNT(*)::int AS total_projects
     FROM project_members pm
     JOIN client_projects cp ON cp.id = pm.project_id
     WHERE pm.tenant_id = $1 AND pm.user_id = $2 AND pm.role = 'student'`,
    [tenantId, userId]
  );
  
  // Calculate streak (simplified - days with activity)
  const streakRows = await query(
    `SELECT COUNT(DISTINCT DATE(updated_at))::int AS streak_days
     FROM lesson_progress
     WHERE tenant_id = $1 AND user_id = $2
     AND updated_at >= NOW() - INTERVAL '30 days'`,
    [tenantId, userId]
  );

  let enrollments = [];
  let paid_purchases = [];
  let purchase_approvals = [];
  let enrolledProgressSummary = {
    completed_lessons: 0,
    total_lessons: 0,
    progress_percent: 0,
    enrolled_courses_count: 0,
  };

  try {
    const enrollmentRows = await query(
      `SELECT
         e.item_type,
         e.item_id,
         e.active,
         e.created_at,
         COALESCE(c.title, p.title) AS item_title,
         COALESCE(c.slug, p.slug) AS item_slug
       FROM enrollments e
       LEFT JOIN courses c
         ON e.item_type = 'course' AND c.id = e.item_id AND c.tenant_id = e.tenant_id
       LEFT JOIN course_packs p
         ON e.item_type = 'pack' AND p.id = e.item_id AND p.tenant_id = e.tenant_id
       WHERE e.user_id = $1 AND e.tenant_id = $2
       ORDER BY e.created_at DESC`,
      [userId, tenantId]
    );

    const packIds = enrollmentRows.rows.filter((r) => r.item_type === "pack").map((r) => r.item_id);
    const packCoursesByPack = new Map();
    if (packIds.length > 0) {
      const packCourseRows = await query(
        `SELECT cpc.pack_id, c.id AS course_id, c.title, c.slug
         FROM course_pack_courses cpc
         JOIN courses c ON c.id = cpc.course_id AND c.tenant_id = $2
         WHERE cpc.pack_id = ANY($1::uuid[])
         ORDER BY c.title ASC`,
        [packIds, tenantId]
      );
      for (const row of packCourseRows.rows) {
        const list = packCoursesByPack.get(row.pack_id) || [];
        list.push({ course_id: row.course_id, title: row.title, slug: row.slug });
        packCoursesByPack.set(row.pack_id, list);
      }
    }

    enrollments = enrollmentRows.rows.map((r) => ({
      item_type: r.item_type,
      item_id: r.item_id,
      item_title:
        r.item_title ||
        `${r.item_type === "pack" ? "Pack" : "Course"} (catalog entry missing — id ${String(r.item_id).slice(0, 8)}…)`,
      item_slug: r.item_slug,
      active: r.active,
      created_at: r.created_at,
      included_courses: r.item_type === "pack" ? packCoursesByPack.get(r.item_id) || [] : [],
    }));

    const enrolledCourseIds = collectEnrolledCourseIds(enrollments);
    const courseProgressMap = await fetchCourseProgressMap({
      tenantId,
      userId,
      courseIds: enrolledCourseIds,
    });
    enrollments = enrollments.map((row) => attachEnrollmentProgress(row, courseProgressMap));

    let enrolledCompleted = 0;
    let enrolledTotal = 0;
    for (const id of enrolledCourseIds) {
      const cp = courseProgressMap.get(id);
      if (cp) {
        enrolledCompleted += cp.completed_lessons;
        enrolledTotal += cp.total_lessons;
      }
    }
    enrolledProgressSummary = {
      completed_lessons: enrolledCompleted,
      total_lessons: enrolledTotal,
      progress_percent: lessonProgressPercent(enrolledCompleted, enrolledTotal),
      enrolled_courses_count: enrolledCourseIds.length,
    };

    const paidOrderRows = await query(
      `SELECT DISTINCT ON (po.id)
         po.id AS payment_order_id,
         po.item_type,
         po.item_id,
         po.amount,
         po.currency,
         po.created_at,
         po.customer_email AS checkout_email,
         COALESCE(c.title, p.title) AS item_title,
         COALESCE(c.slug, p.slug) AS item_slug
       FROM payment_orders po
       LEFT JOIN courses c
         ON po.item_type = 'course' AND c.id = po.item_id AND c.tenant_id = po.tenant_id
       LEFT JOIN course_packs p
         ON po.item_type = 'pack' AND p.id = po.item_id AND p.tenant_id = po.tenant_id
       WHERE po.tenant_id = $1
         AND po.status = 'paid'
         AND (
           LOWER(TRIM(po.customer_email)) = LOWER(TRIM(COALESCE($2::text, '')))
           OR EXISTS (
             SELECT 1 FROM approvals a
             WHERE a.payment_order_id = po.id AND a.user_id = $3::uuid
           )
         )
       ORDER BY po.id, po.created_at DESC`,
      [tenantId, user.email || "", userId]
    );

    paid_purchases = paidOrderRows.rows.map((r) => ({
      payment_order_id: r.payment_order_id,
      item_type: r.item_type,
      item_id: r.item_id,
      item_title:
        r.item_title ||
        `${r.item_type === "pack" ? "Pack" : "Course"} (catalog entry missing — id ${String(r.item_id).slice(0, 8)}…)`,
      item_slug: r.item_slug,
      amount: r.amount,
      currency: r.currency,
      paid_at: r.created_at,
      checkout_email: r.checkout_email,
    }));

    const approvalRows = await query(
      `SELECT
         a.id,
         a.status,
         a.item_type,
         a.item_id,
         a.customer_email AS checkout_email,
         a.created_at,
         a.approved_at,
         a.notes,
         po.status AS payment_order_status,
         po.amount,
         po.currency,
         COALESCE(c.title, p.title) AS item_title,
         COALESCE(c.slug, p.slug) AS item_slug
       FROM approvals a
       LEFT JOIN payment_orders po ON po.id = a.payment_order_id
       LEFT JOIN courses c
         ON a.item_type = 'course' AND c.id = a.item_id AND c.tenant_id = a.tenant_id
       LEFT JOIN course_packs p
         ON a.item_type = 'pack' AND p.id = a.item_id AND p.tenant_id = a.tenant_id
       WHERE a.tenant_id = $1
         AND (
           a.user_id = $2::uuid
           OR LOWER(TRIM(a.customer_email)) = LOWER(TRIM(COALESCE($3::text, '')))
         )
       ORDER BY a.created_at DESC
       LIMIT 40`,
      [tenantId, userId, user.email || ""]
    );

    purchase_approvals = approvalRows.rows.map((r) => ({
      id: r.id,
      status: r.status,
      item_type: r.item_type,
      item_id: r.item_id,
      item_title:
        r.item_title ||
        `${r.item_type === "pack" ? "Pack" : "Course"} (catalog entry missing — id ${String(r.item_id).slice(0, 8)}…)`,
      item_slug: r.item_slug,
      checkout_email: r.checkout_email,
      created_at: r.created_at,
      approved_at: r.approved_at,
      notes: r.notes,
      payment_order_status: r.payment_order_status,
      amount: r.amount,
      currency: r.currency,
    }));
  } catch (err) {
    console.error("[getStudentWithStats] enrollments/purchases/approvals query failed:", err?.message || err);
  }

  const baseProgress = progressRows.rows[0] || {
    completed_lessons: 0,
    in_progress_lessons: 0,
    total_watch_seconds: 0,
  };
  return {
    ...user,
    progress: {
      ...baseProgress,
      enrolled_completed_lessons: enrolledProgressSummary.completed_lessons,
      total_lessons: enrolledProgressSummary.total_lessons,
      progress_percent: enrolledProgressSummary.progress_percent,
      enrolled_courses_count: enrolledProgressSummary.enrolled_courses_count,
    },
    total_projects: projectRows.rows[0]?.total_projects || 0,
    streak_days: streakRows.rows[0]?.streak_days || 0,
    enrollments,
    paid_purchases,
    purchase_approvals,
  };
}

// SuperAdmin: Update student details
async function updateStudentDetails({ userId, fullName, email, phone, passwordHash }) {
  const updates = [];
  const params = [];
  let paramIndex = 1;
  
  if (fullName !== undefined) {
    updates.push(`full_name = $${paramIndex++}`);
    params.push(fullName);
  }
  if (email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    params.push(email);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    params.push(phone);
  }
  if (passwordHash !== undefined) {
    updates.push(`password_hash = $${paramIndex++}`);
    params.push(passwordHash);
  }
  
  if (updates.length === 0) {
    // Return current user if no updates
    const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    return rows[0];
  }
  
  updates.push(`updated_at = now()`);
  params.push(userId);
  
  const { rows } = await query(
    `UPDATE users
     SET ${updates.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, email, full_name, phone, is_active, created_at, student_id`,
    params
  );
  
  return rows[0] || null;
}

// SuperAdmin: Create student
async function createStudent({ tenantId, email, fullName, phone, passwordHash }) {
  // Create user
  const userRows = await query(
    `INSERT INTO users (email, full_name, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, phone, is_active, created_at`,
    [email, fullName, phone, passwordHash]
  );
  
  const user = userRows.rows[0];
  
  // Get Student role ID
  const roleRows = await query(
    `SELECT id FROM roles WHERE tenant_id = $1 AND name = 'Student' LIMIT 1`,
    [tenantId]
  );
  
  if (!roleRows.rows[0]) {
    throw new Error("Student role not found");
  }
  
  // Create membership
  await query(
    `INSERT INTO memberships (tenant_id, user_id, role_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, user_id) DO NOTHING`,
    [tenantId, user.id, roleRows.rows[0].id]
  );
  
  return user;
}

// SuperAdmin: Reactivate a previously soft-deleted student
async function reactivateStudent({ userId, fullName, phone, passwordHash }) {
  const { rows } = await query(
    `UPDATE users
     SET
       is_active = true,
       full_name = COALESCE($2, full_name),
       phone = COALESCE($3, phone),
       password_hash = COALESCE($4, password_hash),
       updated_at = now()
     WHERE id = $1
     RETURNING id, email, full_name, phone, is_active, created_at`,
    [userId, fullName ?? null, phone ?? null, passwordHash ?? null]
  );
  return rows[0] || null;
}

// SuperAdmin: Delete student (soft delete by setting inactive)
async function deleteStudent({ userId }) {
  const { rows } = await query(
    `UPDATE users
     SET is_active = false, updated_at = now()
     WHERE id = $1
     RETURNING id, email, full_name, is_active`,
    [userId]
  );
  return rows[0] || null;
}

async function upsertStudentUndoRemoved({ tenantId, userId, fullName, email, phone }) {
  const { rows } = await query(
    `INSERT INTO student_undo_logs
       (tenant_id, user_id, full_name, email, phone, status, deleted_at, restored_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'removed', now(), NULL, now())
     ON CONFLICT (tenant_id, user_id)
     DO UPDATE SET
       full_name = EXCLUDED.full_name,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       status = 'removed',
       deleted_at = now(),
       restored_at = NULL,
       updated_at = now()
     RETURNING tenant_id, user_id, full_name, email, phone, status, deleted_at, restored_at, updated_at`,
    [tenantId, userId, fullName ?? null, email ?? null, phone ?? null]
  );
  return rows[0] || null;
}

async function markStudentUndoRestored({ tenantId, userId, fullName, email, phone }) {
  const { rows } = await query(
    `INSERT INTO student_undo_logs
       (tenant_id, user_id, full_name, email, phone, status, deleted_at, restored_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'restored', NULL, now(), now())
     ON CONFLICT (tenant_id, user_id)
     DO UPDATE SET
       full_name = COALESCE(EXCLUDED.full_name, student_undo_logs.full_name),
       email = COALESCE(EXCLUDED.email, student_undo_logs.email),
       phone = COALESCE(EXCLUDED.phone, student_undo_logs.phone),
       status = 'restored',
       restored_at = now(),
       updated_at = now()
     RETURNING tenant_id, user_id, full_name, email, phone, status, deleted_at, restored_at, updated_at`,
    [tenantId, userId, fullName ?? null, email ?? null, phone ?? null]
  );
  return rows[0] || null;
}

async function listStudentUndoLogs({ tenantId }) {
  const { rows } = await query(
    `SELECT
       l.user_id,
       l.full_name,
       l.email,
       l.phone,
       l.status,
       l.deleted_at,
       l.restored_at,
       l.updated_at
     FROM student_undo_logs l
     WHERE l.tenant_id = $1
     ORDER BY l.updated_at DESC`,
    [tenantId]
  );
  return rows;
}

// SuperAdmin: List all mentors with filters
async function listMentors({ tenantId, search, roleName = "Mentor" }) {
  let sql = `
    SELECT 
       u.id,
       u.email,
       u.full_name,
       u.phone,
       u.is_active,
       u.created_at,
       m.id AS membership_id,
       r.id AS role_id,
       r.name AS role_name
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     WHERE r.name = $2
  `;
  const params = [tenantId, roleName];
  
  if (search) {
    sql += ` AND (u.full_name ILIKE $3 OR u.email ILIKE $3 OR u.phone ILIKE $3)`;
    params.push(`%${search}%`);
  }
  
  sql += ` ORDER BY u.created_at DESC`;
  
  const { rows } = await query(sql, params);
  return rows;
}

// SuperAdmin: Get mentor with students (students assigned to this mentor)
async function getMentorWithStudents({ tenantId, mentorId }) {
  // Get basic mentor info
  const mentorRows = await query(
    `SELECT 
       u.id,
       u.email,
       u.full_name,
       u.phone,
       u.is_active,
       u.created_at,
       m.id AS membership_id,
       r.id AS role_id,
       r.name AS role_name
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     WHERE u.id = $2 AND r.name = 'Mentor'
     LIMIT 1`,
    [tenantId, mentorId]
  );
  
  if (!mentorRows.rows[0]) return null;
  
  const mentor = mentorRows.rows[0];
  
  // Get students assigned to this mentor (from micro_assignments)
  const studentsRows = await query(
    `SELECT DISTINCT
       u.id,
       u.email,
       u.full_name,
       u.phone,
       u.is_active,
       u.created_at,
       COUNT(DISTINCT ma.id)::int AS assignment_count,
       MAX(ma.assigned_at) AS last_assigned_at
     FROM users u
     JOIN micro_assignments ma ON ma.user_id = u.id AND ma.tenant_id = $1
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     WHERE ma.mentor_id = $2 
       AND r.name = 'Student'
       AND ma.status NOT IN ('dropped', 'expired')
     GROUP BY u.id, u.email, u.full_name, u.phone, u.is_active, u.created_at
     ORDER BY last_assigned_at DESC`,
    [tenantId, mentorId]
  );
  
  mentor.students = studentsRows.rows || [];
  
  return mentor;
}

// SuperAdmin: Update mentor details
async function updateMentorDetails({ userId, fullName, email, phone }) {
  const updates = [];
  const params = [];
  let paramIndex = 1;
  
  if (fullName !== undefined) {
    updates.push(`full_name = $${paramIndex++}`);
    params.push(fullName);
  }
  if (email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    params.push(email);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    params.push(phone);
  }
  
  if (updates.length === 0) {
    // Return current user if no updates
    const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    return rows[0];
  }
  
  updates.push(`updated_at = now()`);
  params.push(userId);
  
  const { rows } = await query(
    `UPDATE users
     SET ${updates.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, email, full_name, phone, is_active, created_at`,
    params
  );
  
  return rows[0] || null;
}

// SuperAdmin: Create mentor
async function createMentor({ tenantId, email, fullName, phone, passwordHash }) {
  // Create user
  const userRows = await query(
    `INSERT INTO users (email, full_name, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, phone, is_active, created_at`,
    [email, fullName, phone, passwordHash]
  );
  
  const user = userRows.rows[0];
  
  // Get Mentor role ID
  const roleRows = await query(
    `SELECT id FROM roles WHERE tenant_id = $1 AND name = 'Mentor' LIMIT 1`,
    [tenantId]
  );
  
  if (!roleRows.rows[0]) {
    throw new Error("Mentor role not found");
  }
  
  // Create membership
  await query(
    `INSERT INTO memberships (tenant_id, user_id, role_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, user_id) DO NOTHING`,
    [tenantId, user.id, roleRows.rows[0].id]
  );
  
  return user;
}

// SuperAdmin: Delete mentor (soft delete by setting inactive)
async function deleteMentor({ userId }) {
  const { rows } = await query(
    `UPDATE users
     SET is_active = false, updated_at = now()
     WHERE id = $1
     RETURNING id, email, full_name, is_active`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  findRoleIdForTenant,
  upsertMembership,
  getMembershipWithRole,
  listTenantUsers,
  getTenantUser,
  updateUserRole,
  updateUserStatus,
  listTenantRoles,
  listStudents,
  listStudentsLeaderboard,
  getStudentWithStats,
  updateStudentDetails,
  createStudent,
  reactivateStudent,
  deleteStudent,
  upsertStudentUndoRemoved,
  markStudentUndoRestored,
  listStudentUndoLogs,
  listMentors,
  getMentorWithStudents,
  updateMentorDetails,
  createMentor,
  deleteMentor,
};
