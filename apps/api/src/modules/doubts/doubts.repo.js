// apps/api/src/modules/doubts/doubts.repo.js
const { query } = require("../../db/query");

async function createDoubt({ tenantId, userId, courseId, lessonId, doubtType, subject, initialBody }) {
  const { rows } = await query(
    `INSERT INTO student_doubts (tenant_id, user_id, course_id, lesson_id, doubt_type, subject, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'open')
     RETURNING id, doubt_type, subject, status, created_at, updated_at`,
    [tenantId, userId, courseId, lessonId || null, doubtType, subject || null]
  );
  const doubt = rows[0];
  const msg = await addMessage({
    tenantId,
    doubtId: doubt.id,
    authorId: userId,
    authorRole: "student",
    body: initialBody,
  });
  return { doubt, messages: [msg] };
}

async function addMessage({ tenantId, doubtId, authorId, authorRole, body }) {
  const { rows } = await query(
    `INSERT INTO student_doubt_messages (tenant_id, doubt_id, author_id, author_role, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, author_id, author_role, body, created_at`,
    [tenantId, doubtId, authorId, authorRole, body]
  );
  await query(
    `UPDATE student_doubts SET updated_at = now(), status = CASE
       WHEN $3 = 'staff' AND status != 'closed' THEN 'answered'
       ELSE status
     END
     WHERE id = $1 AND tenant_id = $2`,
    [doubtId, tenantId, authorRole]
  );
  return rows[0];
}

async function getDoubtById({ tenantId, doubtId }) {
  const { rows } = await query(
    `SELECT d.*,
            c.title AS course_title,
            c.slug AS course_slug,
            l.title AS lesson_title,
            l.slug AS lesson_slug,
            u.full_name AS student_name,
            u.email AS student_email
     FROM student_doubts d
     JOIN courses c ON c.id = d.course_id
     LEFT JOIN lessons l ON l.id = d.lesson_id
     JOIN users u ON u.id = d.user_id
     WHERE d.tenant_id = $1 AND d.id = $2
     LIMIT 1`,
    [tenantId, doubtId]
  );
  return rows[0] ?? null;
}

async function listMessagesForDoubt({ tenantId, doubtId }) {
  const { rows } = await query(
    `SELECT m.id, m.author_id, m.author_role, m.body, m.created_at,
            u.full_name AS author_name
     FROM student_doubt_messages m
     LEFT JOIN users u ON u.id = m.author_id
     WHERE m.tenant_id = $1 AND m.doubt_id = $2
     ORDER BY m.created_at ASC`,
    [tenantId, doubtId]
  );
  return rows;
}

async function listDoubtsForStudentScope({
  tenantId,
  userId,
  courseId,
  lessonId = null,
  doubtType = null,
}) {
  let where = "d.tenant_id = $1 AND d.user_id = $2 AND d.course_id = $3";
  const params = [tenantId, userId, courseId];
  if (lessonId) {
    params.push(lessonId);
    where += ` AND d.lesson_id = $${params.length}`;
  } else if (doubtType === "course") {
    where += " AND d.lesson_id IS NULL";
  }
  if (doubtType) {
    params.push(doubtType);
    where += ` AND d.doubt_type = $${params.length}`;
  }

  const { rows } = await query(
    `SELECT
       d.id,
       d.doubt_type,
       d.subject,
       d.status,
       d.created_at,
       d.updated_at,
       (SELECT COUNT(*)::int FROM student_doubt_messages m WHERE m.doubt_id = d.id) AS message_count,
       (SELECT m.body FROM student_doubt_messages m WHERE m.doubt_id = d.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
       (SELECT m.author_role FROM student_doubt_messages m WHERE m.doubt_id = d.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_role
     FROM student_doubts d
     WHERE ${where}
     ORDER BY d.updated_at DESC
     LIMIT 50`,
    params
  );
  return rows;
}

async function listDoubtsForAdmin({
  tenantId,
  courseId = null,
  lessonId = null,
  status = null,
  doubtType = null,
  limit = 50,
  offset = 0,
}) {
  let where = "d.tenant_id = $1";
  const params = [tenantId];
  if (courseId) {
    params.push(courseId);
    where += ` AND d.course_id = $${params.length}`;
  }
  if (lessonId) {
    params.push(lessonId);
    where += ` AND d.lesson_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    where += ` AND d.status = $${params.length}`;
  }
  if (doubtType) {
    params.push(doubtType);
    where += ` AND d.doubt_type = $${params.length}`;
  }
  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT
       d.id,
       d.doubt_type,
       d.subject,
       d.status,
       d.created_at,
       d.updated_at,
       c.title AS course_title,
       c.slug AS course_slug,
       l.title AS lesson_title,
       l.slug AS lesson_slug,
       u.full_name AS student_name,
       u.email AS student_email,
       (SELECT COUNT(*)::int FROM student_doubt_messages m WHERE m.doubt_id = d.id) AS message_count,
       (SELECT m.body FROM student_doubt_messages m WHERE m.doubt_id = d.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
     FROM student_doubts d
     JOIN courses c ON c.id = d.course_id
     LEFT JOIN lessons l ON l.id = d.lesson_id
     JOIN users u ON u.id = d.user_id
     WHERE ${where}
     ORDER BY d.updated_at DESC, d.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  return rows;
}

async function countDoubtsForAdmin({ tenantId, courseId = null, status = null, doubtType = null }) {
  let where = "tenant_id = $1";
  const params = [tenantId];
  if (courseId) {
    params.push(courseId);
    where += ` AND course_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  if (doubtType) {
    params.push(doubtType);
    where += ` AND doubt_type = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM student_doubts WHERE ${where}`,
    params
  );
  return rows[0]?.total ?? 0;
}

async function updateDoubtStatus({ tenantId, doubtId, status }) {
  const { rows } = await query(
    `UPDATE student_doubts SET status = $3, updated_at = now()
     WHERE tenant_id = $1 AND id = $2
     RETURNING id, status, updated_at`,
    [tenantId, doubtId, status]
  );
  return rows[0] ?? null;
}

module.exports = {
  createDoubt,
  addMessage,
  getDoubtById,
  listMessagesForDoubt,
  listDoubtsForStudentScope,
  listDoubtsForAdmin,
  countDoubtsForAdmin,
  updateDoubtStatus,
};
