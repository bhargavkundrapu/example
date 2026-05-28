// apps/api/src/modules/doubts/doubts.controller.student.js
const { asyncHandler } = require("../../utils/asyncHandler");
const { HttpError } = require("../../utils/httpError");
const { query } = require("../../db/query");
const contentRepo = require("../content/content.repo");
const studentRepo = require("../student/student.repo");
const doubtsRepo = require("./doubts.repo");
const z = require("zod");

const CreateDoubtSchema = z.object({
  subject: z.string().max(200).optional(),
  body: z.string().min(3).max(4000),
});

const ReplySchema = z.object({
  body: z.string().min(1).max(4000),
});

async function resolveCourseId({ tenantId, courseSlug }) {
  const row = await contentRepo.findPublishedCourseRowBySlug({ tenantId, courseSlug });
  return row?.id ?? null;
}

async function resolveLessonContext({ tenantId, courseSlug, moduleSlug, lessonSlug }) {
  const lessonData = await contentRepo.getPublishedLessonBySlugs({
    tenantId,
    courseSlug,
    moduleSlug,
    lessonSlug,
  });
  if (!lessonData?.lesson) return null;

  let courseId = lessonData.lesson.course_id;
  if (!courseId) {
    const { rows } = await query(
      `SELECT c.id AS course_id FROM course_modules m
       JOIN courses c ON c.id = m.course_id
       WHERE c.tenant_id = $1 AND (c.slug = $2 OR REPLACE(c.slug, '_', '-') = $2)
         AND (m.slug = $3 OR REPLACE(m.slug, '_', '-') = $3) AND m.status = 'published'
       LIMIT 1`,
      [tenantId, courseSlug, moduleSlug]
    );
    courseId = rows[0]?.course_id;
  }

  const lessonId = lessonData.lesson.lesson_id ?? lessonData.lesson.id;
  return { courseId, lessonId };
}

async function assertCourseAccess({ tenantId, userId, courseId }) {
  const hasAccess = await studentRepo.hasCourseAccess({ tenantId, userId, courseId });
  if (!hasAccess) throw new HttpError(403, "You don't have access to this course.");
}

const createCourseDoubt = asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.auth;
  const { courseSlug } = req.params;
  const body = CreateDoubtSchema.parse(req.body || {});

  const courseId = await resolveCourseId({ tenantId, courseSlug });
  if (!courseId) throw new HttpError(404, "Course not found");
  await assertCourseAccess({ tenantId, userId, courseId });

  const result = await doubtsRepo.createDoubt({
    tenantId,
    userId,
    courseId,
    lessonId: null,
    doubtType: "course",
    subject: body.subject,
    initialBody: body.body.trim(),
  });

  res.status(201).json({ ok: true, data: result });
});

const listCourseDoubts = asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.auth;
  const { courseSlug } = req.params;

  const courseId = await resolveCourseId({ tenantId, courseSlug });
  if (!courseId) throw new HttpError(404, "Course not found");
  await assertCourseAccess({ tenantId, userId, courseId });

  const rows = await doubtsRepo.listDoubtsForStudentScope({
    tenantId,
    userId,
    courseId,
    lessonId: null,
    doubtType: "course",
  });

  res.json({ ok: true, data: rows });
});

const createLessonDoubt = asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.auth;
  const { courseSlug, moduleSlug, lessonSlug } = req.params;
  const body = CreateDoubtSchema.parse(req.body || {});

  const ctx = await resolveLessonContext({ tenantId, courseSlug, moduleSlug, lessonSlug });
  if (!ctx?.courseId || !ctx.lessonId) throw new HttpError(404, "Lesson not found");
  await assertCourseAccess({ tenantId, userId, courseId: ctx.courseId });

  const result = await doubtsRepo.createDoubt({
    tenantId,
    userId,
    courseId: ctx.courseId,
    lessonId: ctx.lessonId,
    doubtType: "lesson",
    subject: body.subject,
    initialBody: body.body.trim(),
  });

  res.status(201).json({ ok: true, data: result });
});

const listLessonDoubts = asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.auth;
  const { courseSlug, moduleSlug, lessonSlug } = req.params;

  const ctx = await resolveLessonContext({ tenantId, courseSlug, moduleSlug, lessonSlug });
  if (!ctx?.courseId || !ctx.lessonId) throw new HttpError(404, "Lesson not found");
  await assertCourseAccess({ tenantId, userId, courseId: ctx.courseId });

  const rows = await doubtsRepo.listDoubtsForStudentScope({
    tenantId,
    userId,
    courseId: ctx.courseId,
    lessonId: ctx.lessonId,
    doubtType: "lesson",
  });

  res.json({ ok: true, data: rows });
});

const getDoubtThread = asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.auth;
  const { doubtId } = req.params;

  const doubt = await doubtsRepo.getDoubtById({ tenantId, doubtId });
  if (!doubt) throw new HttpError(404, "Doubt not found");
  if (String(doubt.user_id) !== String(userId)) throw new HttpError(403, "Not your doubt thread");

  const messages = await doubtsRepo.listMessagesForDoubt({ tenantId, doubtId });
  res.json({ ok: true, data: { doubt, messages } });
});

const replyToDoubt = asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.auth;
  const { doubtId } = req.params;
  const body = ReplySchema.parse(req.body || {});

  const doubt = await doubtsRepo.getDoubtById({ tenantId, doubtId });
  if (!doubt) throw new HttpError(404, "Doubt not found");
  if (String(doubt.user_id) !== String(userId)) throw new HttpError(403, "Not your doubt thread");
  if (doubt.status === "closed") throw new HttpError(400, "This doubt is closed.");

  const message = await doubtsRepo.addMessage({
    tenantId,
    doubtId,
    authorId: userId,
    authorRole: "student",
    body: body.body.trim(),
  });

  if (doubt.status === "answered") {
    await doubtsRepo.updateDoubtStatus({ tenantId, doubtId, status: "open" });
  }

  res.status(201).json({ ok: true, data: message });
});

module.exports = {
  createCourseDoubt,
  listCourseDoubts,
  createLessonDoubt,
  listLessonDoubts,
  getDoubtThread,
  replyToDoubt,
};
