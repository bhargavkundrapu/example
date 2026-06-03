const { query } = require("../../db/query");

function isProjectAssignmentsTableMissing(error) {
  return error?.code === "42P01" && String(error?.message || "").includes("client_lab_project_assignments");
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// --- Projects
async function createProject({ tenantId, title, slug, scope, status, startDate, endDate, createdBy }) {
  const s = slug || slugify(title);
  const { rows } = await query(
    `INSERT INTO client_lab_projects
      (tenant_id, title, slug, scope, status, start_date, end_date, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
     RETURNING *`,
    [tenantId, title, s, scope ?? null, status ?? "active", startDate ?? null, endDate ?? null, createdBy]
  );
  return rows[0];
}

async function updateProject({ tenantId, projectId, title, scope, status, startDate, endDate, hasArchivedAt, archivedAt, updatedBy }) {
  const { rows } = await query(
    `UPDATE client_lab_projects SET
       title = COALESCE($1, title),
       scope = COALESCE($2, scope),
       status = COALESCE($3, status),
       start_date = COALESCE($4, start_date),
       end_date = COALESCE($5, end_date),
       archived_at = CASE WHEN $6 THEN $7 ELSE archived_at END,
       updated_by = $8,
       updated_at = now()
     WHERE tenant_id = $9 AND id = $10
     RETURNING *`,
    [title ?? null, scope ?? null, status ?? null, startDate ?? null, endDate ?? null, !!hasArchivedAt, archivedAt ?? null, updatedBy, tenantId, projectId]
  );
  return rows[0] ?? null;
}

async function listProjects({ tenantId, includeArchived }) {
  const q = includeArchived
    ? `SELECT * FROM client_lab_projects WHERE tenant_id = $1 ORDER BY created_at DESC`
    : `SELECT * FROM client_lab_projects WHERE tenant_id = $1 AND (archived_at IS NULL) ORDER BY created_at DESC`;
  const { rows } = await query(q, [tenantId]);
  return rows;
}

async function listProjectsForEligibleStudent({ tenantId }) {
  const { rows } = await query(
    `SELECT *
     FROM client_lab_projects
     WHERE tenant_id = $1 AND archived_at IS NULL
     ORDER BY created_at DESC`,
    [tenantId]
  );
  return rows;
}

async function getProjectById({ tenantId, projectId }) {
  const { rows } = await query(
    `SELECT * FROM client_lab_projects WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, projectId]
  );
  return rows[0] ?? null;
}

async function deleteProject({ tenantId, projectId }) {
  const { rows } = await query(
    `DELETE FROM client_lab_projects
     WHERE tenant_id = $1 AND id = $2
     RETURNING id, title`,
    [tenantId, projectId]
  );
  return rows[0] ?? null;
}

// --- Tasks
async function createTask({ tenantId, projectId, title, description, status, priority, dueAt, createdBy }) {
  const { rows } = await query(
    `INSERT INTO client_lab_tasks
      (tenant_id, project_id, title, description, status, priority, due_at, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
     RETURNING *`,
    [tenantId, projectId, title ?? null, description ?? null, status ?? "todo", priority ?? 2, dueAt ?? null, createdBy]
  );
  return rows[0];
}

async function updateTask({ tenantId, taskId, title, description, status, priority, dueAt, updatedBy }) {
  const { rows } = await query(
    `UPDATE client_lab_tasks SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       status = COALESCE($3, status),
       priority = COALESCE($4, priority),
       due_at = COALESCE($5, due_at),
       updated_by = $6,
       updated_at = now()
     WHERE tenant_id = $7 AND id = $8
     RETURNING *`,
    [title ?? null, description ?? null, status ?? null, priority ?? null, dueAt ?? null, updatedBy, tenantId, taskId]
  );
  return rows[0] ?? null;
}

async function getTaskById({ tenantId, taskId }) {
  const { rows } = await query(
    `SELECT * FROM client_lab_tasks WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, taskId]
  );
  return rows[0] ?? null;
}

async function listTasksByProject({ tenantId, projectId }) {
  const { rows } = await query(
    `SELECT * FROM client_lab_tasks WHERE tenant_id = $1 AND project_id = $2 ORDER BY updated_at DESC`,
    [tenantId, projectId]
  );
  return rows;
}

// --- Assignments
async function assignTask({ tenantId, taskId, studentId, assignedBy }) {
  const { rows } = await query(
    `INSERT INTO client_lab_assignments (tenant_id, task_id, student_id, assigned_by)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (tenant_id, task_id) DO UPDATE SET student_id = $3, assigned_by = $4, assigned_at = now()
     RETURNING *`,
    [tenantId, taskId, studentId, assignedBy]
  );
  return rows[0];
}

async function unassignTask({ tenantId, taskId }) {
  const { rows } = await query(
    `DELETE FROM client_lab_assignments WHERE tenant_id = $1 AND task_id = $2 RETURNING id`,
    [tenantId, taskId]
  );
  return rows.length > 0;
}

async function getAssignmentByTask({ tenantId, taskId }) {
  const { rows } = await query(
    `SELECT * FROM client_lab_assignments WHERE tenant_id = $1 AND task_id = $2 LIMIT 1`,
    [tenantId, taskId]
  );
  return rows[0] ?? null;
}

async function listAssignmentsByStudent({ tenantId, studentId }) {
  const { rows } = await query(
    `SELECT a.*, t.title AS task_title, t.status AS task_status, t.project_id, p.title AS project_title
     FROM client_lab_assignments a
     JOIN client_lab_tasks t ON t.id = a.task_id AND t.tenant_id = a.tenant_id
     JOIN client_lab_projects p ON p.id = t.project_id AND p.tenant_id = a.tenant_id
     WHERE a.tenant_id = $1 AND a.student_id = $2
     ORDER BY a.assigned_at DESC`,
    [tenantId, studentId]
  );
  return rows;
}

// --- Submissions
async function createSubmission({ tenantId, taskId, studentId, prLink, notes }) {
  const { rows } = await query(
    `INSERT INTO client_lab_submissions (tenant_id, task_id, student_id, pr_link, notes, status)
     VALUES ($1,$2,$3,$4,$5,'pending')
     RETURNING *`,
    [tenantId, taskId, studentId, prLink ?? null, notes ?? null]
  );
  return rows[0];
}

async function getLatestSubmission({ tenantId, taskId, studentId }) {
  const { rows } = await query(
    `SELECT * FROM client_lab_submissions
     WHERE tenant_id = $1 AND task_id = $2 AND student_id = $3
     ORDER BY submitted_at DESC LIMIT 1`,
    [tenantId, taskId, studentId]
  );
  return rows[0] ?? null;
}

async function reviewSubmission({ tenantId, submissionId, outcome, feedback, reviewedBy }) {
  const status = outcome === "approve" ? "approved" : "changes_requested";
  const { rows } = await query(
    `UPDATE client_lab_submissions SET status = $1, feedback = $2, reviewed_at = now(), reviewed_by = $3, updated_at = now()
     WHERE tenant_id = $4 AND id = $5
     RETURNING *`,
    [status, feedback ?? null, reviewedBy, tenantId, submissionId]
  );
  return rows[0] ?? null;
}

async function getSubmissionById({ tenantId, submissionId }) {
  const { rows } = await query(
    `SELECT * FROM client_lab_submissions WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, submissionId]
  );
  return rows[0] ?? null;
}

async function listSubmissions({ tenantId, projectId, taskId, studentId, status }) {
  let q = `SELECT s.*, t.title AS task_title, t.project_id, p.title AS project_title, u.full_name AS student_name, u.email AS student_email
            FROM client_lab_submissions s
            JOIN client_lab_tasks t ON t.id = s.task_id AND t.tenant_id = s.tenant_id
            JOIN client_lab_projects p ON p.id = t.project_id AND p.tenant_id = s.tenant_id
            JOIN users u ON u.id = s.student_id
            WHERE s.tenant_id = $1`;
  const params = [tenantId];
  let idx = 2;
  if (projectId) { q += ` AND t.project_id = $` + idx; params.push(projectId); idx++; }
  if (taskId) { q += ` AND s.task_id = $` + idx; params.push(taskId); idx++; }
  if (studentId) { q += ` AND s.student_id = $` + idx; params.push(studentId); idx++; }
  if (status) { q += ` AND s.status = $` + idx; params.push(status); idx++; }
  q += ` ORDER BY s.submitted_at DESC`;
  const { rows } = await query(q, params);
  return rows;
}

// --- Eligible students (for SuperAdmin assign dropdown) – only those who can see Client Lab
async function listEligibleStudents({ tenantId }) {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     WHERE r.name = 'Student' AND u.eligible_client_lab = true
     ORDER BY u.full_name`,
    [tenantId]
  );
  return rows;
}

// --- All students for assign dropdown (so SuperAdmin can assign before student is eligible)
async function listAllStudentsForAssign({ tenantId }) {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, COALESCE(u.eligible_client_lab, false) AS eligible_client_lab
     FROM users u
     JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
     JOIN roles r ON r.id = m.role_id
     WHERE r.name = 'Student'
     ORDER BY u.eligible_client_lab DESC, u.full_name`,
    [tenantId]
  );
  return rows;
}

// --- Student: assigned projects (distinct) and assigned tasks
async function listAssignedProjectsForStudent({ tenantId, studentId }) {
  const { rows } = await query(
    `SELECT DISTINCT p.id, p.title, p.slug, p.status, p.created_at
     FROM client_lab_projects p
     JOIN client_lab_tasks t ON t.project_id = p.id AND t.tenant_id = p.tenant_id
     JOIN client_lab_assignments a ON a.task_id = t.id AND a.tenant_id = t.tenant_id AND a.student_id = $2
     WHERE p.tenant_id = $1 AND (p.archived_at IS NULL)
     ORDER BY p.created_at DESC`,
    [tenantId, studentId]
  );
  return rows;
}

async function upsertProjectAssignment({ tenantId, projectId, studentId, assignedBy }) {
  try {
    const { rows } = await query(
      `INSERT INTO client_lab_project_assignments (tenant_id, project_id, student_id, assigned_by)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (tenant_id, project_id, student_id) DO UPDATE
         SET assigned_by = EXCLUDED.assigned_by, assigned_at = now()
       RETURNING *`,
      [tenantId, projectId, studentId, assignedBy]
    );
    return rows[0] ?? null;
  } catch (error) {
    if (isProjectAssignmentsTableMissing(error)) return null;
    throw error;
  }
}

async function removeProjectAssignment({ tenantId, projectId, studentId }) {
  try {
    const { rows } = await query(
      `DELETE FROM client_lab_project_assignments
       WHERE tenant_id = $1 AND project_id = $2 AND student_id = $3
       RETURNING id`,
      [tenantId, projectId, studentId]
    );
    return rows.length > 0;
  } catch (error) {
    if (isProjectAssignmentsTableMissing(error)) return false;
    throw error;
  }
}

async function listProjectAssignmentsByProject({ tenantId, projectId }) {
  try {
    const { rows } = await query(
      `SELECT a.*, u.full_name AS student_name, u.email AS student_email
       FROM client_lab_project_assignments a
       JOIN users u ON u.id = a.student_id
       WHERE a.tenant_id = $1 AND a.project_id = $2
       ORDER BY a.assigned_at DESC`,
      [tenantId, projectId]
    );
    return rows;
  } catch (error) {
    if (isProjectAssignmentsTableMissing(error)) return [];
    throw error;
  }
}

async function listAssignedProjectsFromProjectAssignments({ tenantId, studentId }) {
  try {
    const { rows } = await query(
      `SELECT p.id, p.title, p.slug, p.status, p.created_at, a.assigned_at
       FROM client_lab_project_assignments a
       JOIN client_lab_projects p ON p.id = a.project_id AND p.tenant_id = a.tenant_id
       WHERE a.tenant_id = $1 AND a.student_id = $2 AND p.archived_at IS NULL
       ORDER BY a.assigned_at DESC`,
      [tenantId, studentId]
    );
    return rows;
  } catch (error) {
    if (isProjectAssignmentsTableMissing(error)) return [];
    throw error;
  }
}

async function listAssignedTasksForStudent({ tenantId, studentId }) {
  const { rows } = await query(
    `SELECT t.*, p.title AS project_title, a.assigned_at,
       (SELECT status FROM client_lab_submissions s WHERE s.task_id = t.id AND s.student_id = $2 ORDER BY s.submitted_at DESC LIMIT 1) AS submission_status,
       (SELECT feedback FROM client_lab_submissions s WHERE s.task_id = t.id AND s.student_id = $2 ORDER BY s.submitted_at DESC LIMIT 1) AS submission_feedback
     FROM client_lab_tasks t
     JOIN client_lab_projects p ON p.id = t.project_id AND p.tenant_id = t.tenant_id
     JOIN client_lab_assignments a ON a.task_id = t.id AND a.tenant_id = t.tenant_id AND a.student_id = $2
     WHERE t.tenant_id = $1 AND (p.archived_at IS NULL)
     ORDER BY a.assigned_at DESC`,
    [tenantId, studentId]
  );
  return rows;
}

async function listAssignedTasksForStudentByProject({ tenantId, projectId, studentId }) {
  const { rows } = await query(
    `SELECT t.*, a.assigned_at,
       (SELECT status FROM client_lab_submissions s WHERE s.task_id = t.id AND s.student_id = $3 ORDER BY s.submitted_at DESC LIMIT 1) AS submission_status,
       (SELECT feedback FROM client_lab_submissions s WHERE s.task_id = t.id AND s.student_id = $3 ORDER BY s.submitted_at DESC LIMIT 1) AS submission_feedback
     FROM client_lab_tasks t
     JOIN client_lab_assignments a ON a.task_id = t.id AND a.tenant_id = t.tenant_id AND a.student_id = $3
     WHERE t.tenant_id = $1 AND t.project_id = $2
     ORDER BY t.updated_at DESC`,
    [tenantId, projectId, studentId]
  );
  return rows;
}

async function listProjectTasksWithStudentMeta({ tenantId, projectId, studentId }) {
  const { rows } = await query(
    `SELECT t.*,
       a.student_id AS assigned_student_id,
       a.assigned_at,
       (SELECT status FROM client_lab_submissions s WHERE s.task_id = t.id AND s.student_id = $3 ORDER BY s.submitted_at DESC LIMIT 1) AS submission_status,
       (SELECT feedback FROM client_lab_submissions s WHERE s.task_id = t.id AND s.student_id = $3 ORDER BY s.submitted_at DESC LIMIT 1) AS submission_feedback
     FROM client_lab_tasks t
     LEFT JOIN client_lab_assignments a ON a.task_id = t.id AND a.tenant_id = t.tenant_id
     WHERE t.tenant_id = $1 AND t.project_id = $2
     ORDER BY t.updated_at DESC`,
    [tenantId, projectId, studentId]
  );
  return rows;
}

module.exports = {
  slugify,
  createProject,
  updateProject,
  listProjects,
  listProjectsForEligibleStudent,
  getProjectById,
  deleteProject,
  createTask,
  updateTask,
  getTaskById,
  listTasksByProject,
  assignTask,
  unassignTask,
  getAssignmentByTask,
  listAssignmentsByStudent,
  createSubmission,
  getLatestSubmission,
  reviewSubmission,
  getSubmissionById,
  listSubmissions,
  listEligibleStudents,
  listAllStudentsForAssign,
  listAssignedProjectsForStudent,
  upsertProjectAssignment,
  removeProjectAssignment,
  listProjectAssignmentsByProject,
  listAssignedProjectsFromProjectAssignments,
  listAssignedTasksForStudent,
  listAssignedTasksForStudentByProject,
  listProjectTasksWithStudentMeta,
};
