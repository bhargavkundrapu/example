const repo = require("./clientLabRealWorld.repo");
const { HttpError } = require("../../utils/httpError");
const auditRepo = require("../audit/audit.repo");

function audit(req, action, entityType, entityId, payload = {}) {
  const tenantId = req.tenant?.id;
  const actorUserId = req.auth?.userId;
  const ip = req.ip;
  const userAgent = req.get?.("user-agent");
  return auditRepo.insertAuditLog({
    tenantId,
    actorUserId,
    action: `client_lab.${action}`,
    entityType,
    entityId,
    payload,
    ip,
    userAgent,
  });
}

// --- SuperAdmin
async function createProject(req, data) {
  const tenantId = req.tenant.id;
  const createdBy = req.auth.userId;
  const project = await repo.createProject({
    tenantId,
    title: data.title,
    slug: data.slug,
    scope: data.scope,
    status: data.status ?? "active",
    startDate: data.startDate,
    endDate: data.endDate,
    createdBy,
  });
  await audit(req, "project.create", "client_lab_project", project.id, { title: project.title });
  return project;
}

async function updateProject(req, projectId, data) {
  const tenantId = req.tenant.id;
  const existing = await repo.getProjectById({ tenantId, projectId });
  if (!existing) throw new HttpError(404, "Project not found");
  const hasArchivedAt = Object.prototype.hasOwnProperty.call(data || {}, "archivedAt");
  const updated = await repo.updateProject({
    tenantId,
    projectId,
    title: data.title,
    scope: data.scope,
    status: data.status,
    startDate: data.startDate,
    endDate: data.endDate,
    hasArchivedAt,
    archivedAt: data.archivedAt,
    updatedBy: req.auth.userId,
  });
  await audit(req, "project.update", "client_lab_project", projectId, { title: updated.title, ...data });
  return updated;
}

async function deleteProject(req, projectId) {
  const tenantId = req.tenant.id;
  const existing = await repo.getProjectById({ tenantId, projectId });
  if (!existing) throw new HttpError(404, "Project not found");
  const deleted = await repo.deleteProject({ tenantId, projectId });
  await audit(req, "project.delete", "client_lab_project", projectId, { title: existing.title });
  return deleted;
}

async function listProjects(req, includeArchived) {
  return repo.listProjects({ tenantId: req.tenant.id, includeArchived: !!includeArchived });
}

async function getProjectWithTasks(req, projectId) {
  const tenantId = req.tenant.id;
  const project = await repo.getProjectById({ tenantId, projectId });
  if (!project) throw new HttpError(404, "Project not found");
  const tasks = await repo.listTasksByProject({ tenantId, projectId });
  const assignments = await Promise.all(
    tasks.map(async (t) => {
      const a = await repo.getAssignmentByTask({ tenantId, taskId: t.id });
      return { taskId: t.id, assignment: a };
    })
  );
  const assignmentByTaskId = Object.fromEntries(assignments.map(({ taskId, assignment }) => [taskId, assignment]));
  const tasksWithAssignment = tasks.map((t) => ({ ...t, assignment: assignmentByTaskId[t.id] ?? null }));
  const projectAssignments = await repo.listProjectAssignmentsByProject({ tenantId, projectId });
  return { ...project, tasks: tasksWithAssignment, project_assignments: projectAssignments };
}

async function createTask(req, projectId, data) {
  const tenantId = req.tenant.id;
  const project = await repo.getProjectById({ tenantId, projectId });
  if (!project) throw new HttpError(404, "Project not found");
  const task = await repo.createTask({
    tenantId,
    projectId,
    title: data.title,
    description: data.description,
    status: data.status ?? "todo",
    priority: data.priority ?? 2,
    dueAt: data.dueAt,
    createdBy: req.auth.userId,
  });
  await audit(req, "task.create", "client_lab_task", task.id, { title: task.title, projectId });
  return task;
}

async function updateTask(req, taskId, data) {
  const tenantId = req.tenant.id;
  const existing = await repo.getTaskById({ tenantId, taskId });
  if (!existing) throw new HttpError(404, "Task not found");
  const updated = await repo.updateTask({
    tenantId,
    taskId,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    dueAt: data.dueAt,
    updatedBy: req.auth.userId,
  });
  await audit(req, "task.update", "client_lab_task", taskId, { title: updated.title, ...data });
  return updated;
}

async function assignTask(req, taskId, studentId) {
  const tenantId = req.tenant.id;
  const task = await repo.getTaskById({ tenantId, taskId });
  if (!task) throw new HttpError(404, "Task not found");
  await repo.assignTask({
    tenantId,
    taskId,
    studentId,
    assignedBy: req.auth.userId,
  });
  await audit(req, "task.assign", "client_lab_task", taskId, { studentId });
  return repo.getTaskById({ tenantId, taskId });
}

async function unassignTask(req, taskId) {
  const tenantId = req.tenant.id;
  const task = await repo.getTaskById({ tenantId, taskId });
  if (!task) throw new HttpError(404, "Task not found");
  await repo.unassignTask({ tenantId, taskId });
  await audit(req, "task.unassign", "client_lab_task", taskId, {});
  return { ok: true };
}

async function listSubmissions(req, filters) {
  return repo.listSubmissions({
    tenantId: req.tenant.id,
    projectId: filters.projectId,
    taskId: filters.taskId,
    studentId: filters.studentId,
    status: filters.status,
  });
}

async function reviewSubmission(req, submissionId, outcome, feedback) {
  const tenantId = req.tenant.id;
  const sub = await repo.getSubmissionById({ tenantId, submissionId });
  if (!sub) throw new HttpError(404, "Submission not found");
  const updated = await repo.reviewSubmission({
    tenantId,
    submissionId,
    outcome: outcome === "approve" ? "approve" : "changes_requested",
    feedback,
    reviewedBy: req.auth.userId,
  });
  await audit(req, "submission.review", "client_lab_submission", submissionId, { outcome, feedback: feedback?.slice(0, 200) });
  return updated;
}

async function listEligibleStudents(req) {
  return repo.listEligibleStudents({ tenantId: req.tenant.id });
}

async function listAllStudentsForAssign(req) {
  return repo.listAllStudentsForAssign({ tenantId: req.tenant.id });
}

async function setProjectAssignments(req, projectId, studentIds) {
  const tenantId = req.tenant.id;
  const project = await repo.getProjectById({ tenantId, projectId });
  if (!project) throw new HttpError(404, "Project not found");

  const normalizedStudentIds = [...new Set((studentIds || []).filter(Boolean))];
  const current = await repo.listProjectAssignmentsByProject({ tenantId, projectId });
  const currentIds = new Set(current.map((r) => r.student_id));
  const nextIds = new Set(normalizedStudentIds);

  const toAdd = normalizedStudentIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  await Promise.all(
    toAdd.map((studentId) =>
      repo.upsertProjectAssignment({
        tenantId,
        projectId,
        studentId,
        assignedBy: req.auth.userId,
      })
    )
  );
  await Promise.all(
    toRemove.map((studentId) => repo.removeProjectAssignment({ tenantId, projectId, studentId }))
  );

  await audit(req, "project.assign_students", "client_lab_project", projectId, {
    added: toAdd.length,
    removed: toRemove.length,
  });

  return repo.listProjectAssignmentsByProject({ tenantId, projectId });
}

// --- Student: return assigned projects/tasks regardless of eligibility (so they see what's assigned)
async function listAssignedProjects(req) {
  const tenantId = req.tenant.id;
  const userId = req.auth.userId;
  return repo.listAssignedProjectsFromProjectAssignments({ tenantId, studentId: userId });
}

async function listAllProjectsForEligibleStudent(req) {
  const tenantId = req.tenant.id;
  const userId = req.auth.userId;
  const eligibility = await require("./clientLabEligibility.repo").getEligibility({ userId });
  if (!eligibility?.eligible_client_lab) return [];
  return repo.listProjectsForEligibleStudent({ tenantId });
}

async function listAssignedTasks(req) {
  const tenantId = req.tenant.id;
  const userId = req.auth.userId;
  return repo.listAssignedTasksForStudent({ tenantId, studentId: userId });
}

async function submitTask(req, taskId, prLink, notes) {
  const tenantId = req.tenant.id;
  const userId = req.auth.userId;
  const eligibility = await require("./clientLabEligibility.repo").getEligibility({ userId });
  if (!eligibility.eligible_client_lab) throw new HttpError(403, "You are not eligible for Real Client Lab");
  const assignment = await repo.getAssignmentByTask({ tenantId, taskId });
  if (!assignment || assignment.student_id !== userId) throw new HttpError(403, "You are not assigned to this task");
  const task = await repo.getTaskById({ tenantId, taskId });
  if (!task) throw new HttpError(404, "Task not found");
  const submission = await repo.createSubmission({
    tenantId,
    taskId,
    studentId: userId,
    prLink: prLink || null,
    notes: notes || null,
  });
  return submission;
}

async function getProjectWithTasksForStudent(req, projectId) {
  const tenantId = req.tenant.id;
  const userId = req.auth.userId;
  const project = await repo.getProjectById({ tenantId, projectId });
  if (!project) throw new HttpError(404, "Project not found");
  const eligibility = await require("./clientLabEligibility.repo").getEligibility({ userId });
  if (!eligibility?.eligible_client_lab) throw new HttpError(403, "You are not eligible for Real Client Lab");
  const tasks = await repo.listProjectTasksWithStudentMeta({ tenantId, projectId, studentId: userId });
  return { ...project, tasks };
}

async function getTaskByIdForStudent(req, taskId) {
  const tenantId = req.tenant.id;
  const userId = req.auth.userId;
  const assignment = await repo.getAssignmentByTask({ tenantId, taskId });
  if (!assignment || assignment.student_id !== userId) throw new HttpError(403, "You are not assigned to this task");
  const task = await repo.getTaskById({ tenantId, taskId });
  if (!task) throw new HttpError(404, "Task not found");
  const submission = await repo.getLatestSubmission({ tenantId, taskId, studentId: userId });
  return { ...task, latest_submission: submission };
}

module.exports = {
  createProject,
  updateProject,
  deleteProject,
  listProjects,
  getProjectWithTasks,
  createTask,
  updateTask,
  assignTask,
  unassignTask,
  listSubmissions,
  reviewSubmission,
  listEligibleStudents,
  listAllStudentsForAssign,
  setProjectAssignments,
  listAssignedProjects,
  listAllProjectsForEligibleStudent,
  listAssignedTasks,
  submitTask,
  getProjectWithTasksForStudent,
  getTaskByIdForStudent,
};
