// apps/api/src/modules/content/content.controller.js
const { getCache, setCache } = require("../../utils/cache");
const { delByPrefix } = require("../../utils/cache");

const { z } = require("zod");
const { asyncHandler } = require("../../utils/asyncHandler");
const svc = require("./content.service");
const { HttpError } = require("../../utils/httpError");

const CreateCourseSchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  level: z.string().optional(),
});
const UpdateCourseSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  level: z.string().optional(),
  price_in_paise: z.number().int().min(0).optional(),
  sort_order: z.number().int().min(0).optional(),
});

const CreateModuleSchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  position: z.number().int().optional(),
});
const UpdateModuleSchema = z.object({
  title: z.string().min(2).optional(),
  position: z.number().int().optional(),
});

const CreateLessonSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().optional(),
  summary: z.string().optional(),
  position: z.number().int().optional(),
  goal: z.string().optional(),
  video_url: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : undefined)),
  prompts: z.object({
    prompts: z.string().optional(),
    commands: z.string().optional(),
    error_resolve: z.string().optional(),
  }).optional(),
  success_image_url: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : undefined)),
  success_image_urls: z.array(z.string().url()).optional(),
  learn_setup_steps: z.array(z.any()).optional(),
  pdf_url: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : undefined)),
  video_captions: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : undefined)),
});
const UpdateLessonSchema = z.object({
  title: z.string().min(2).optional(),
  summary: z.string().optional().nullable(),
  position: z.number().int().optional(),
  goal: z.string().optional().nullable(),
  video_url: z.string().optional().transform((v) => (v && (v = String(v).trim())) ? v : null),
  prompts: z.object({
    prompts: z.string().optional(),
    commands: z.string().optional(),
    error_resolve: z.string().optional(),
  }).optional().nullable(),
  success_image_url: z.string().optional().transform((v) => (v && (v = String(v).trim())) ? v : null),
  success_image_urls: z.array(z.string().url()).optional().nullable(),
  learn_setup_steps: z.array(z.any()).optional().nullable(),
  pdf_url: z.string().optional().transform((v) => (v && (v = String(v).trim())) ? v : null),
  video_captions: z.string().optional().transform((v) => (v && (v = String(v).trim())) ? v : null),
  video_provider: z.string().nullable().optional(),
  video_id: z.string().nullable().optional(),
});




const StatusSchema = z.object({
  status: z.enum(["draft", "published", "unpublished"]),
});

const AddResourceSchema = z.object({
  type: z.enum(["cheatsheet", "link", "text"]),
  title: z.string().min(1),
  url: z.string().url().optional(),
  body: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
const UpdateResourceSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  body: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const AddPracticeSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  language: z.string().optional(),
  starterCode: z.string().optional(),
  expectedOutput: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
const UpdatePracticeSchema = z.object({
  title: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  language: z.string().optional(),
  starterCode: z.string().optional(),
  expectedOutput: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const AddMcqSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
  })).min(2),
  explanation: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateMcqSchema = z.object({
  question: z.string().min(1).optional(),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
  })).min(2).optional(),
  explanation: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const AddSlideSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  slideNumber: z.number().int().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateSlideSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  slideNumber: z.number().int().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
});

// ---------- Admin ----------
const createCourse = asyncHandler(async (req, res) => {
  const parsed = CreateCourseSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const created = await svc.createCourseSmart({
    tenantId: req.tenant.id,
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    level: parsed.data.level,
    createdBy: req.auth.userId,
  });
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.status(201).json({ ok: true, data: created });
});

const listCoursesAdmin = asyncHandler(async (req, res) => {
  const rows = await svc.listCoursesAdmin({ tenantId: req.tenant.id });
  res.json({ ok: true, data: rows });
});
const updateCourse = asyncHandler(async (req, res) => {
  const parsed = UpdateCourseSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const { title, slug, description, level, price_in_paise, sort_order } = parsed.data;
  if (title === undefined && slug === undefined && description === undefined && level === undefined && price_in_paise === undefined && sort_order === undefined) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await svc.updateCourse({
    tenantId: req.tenant.id,
    courseId: req.params.courseId,
    patch: parsed.data,
    updatedBy: req.auth.userId,
  });

  if (!updated) throw new HttpError(404, "Course not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);
  res.json({ ok: true, data: updated });
});



const setCourseStatus = asyncHandler(async (req, res) => {
  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const updated = await svc.updateCourseStatus({
    tenantId: req.tenant.id,
    courseId: req.params.courseId,
    status: parsed.data.status,
  });

  if (!updated) throw new HttpError(404, "Course not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.json({ ok: true, data: updated });
});

const createModule = asyncHandler(async (req, res) => {
  const parsed = CreateModuleSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const created = await svc.createModuleSmart({
    tenantId: req.tenant.id,
    courseId: req.params.courseId,
    title: parsed.data.title,
    slug: parsed.data.slug,
    position: parsed.data.position ?? 0,
    createdBy: req.auth.userId,
  });
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.status(201).json({ ok: true, data: created });
});
const updateModule = asyncHandler(async (req, res) => {
  const parsed = UpdateModuleSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  if (parsed.data.title === undefined && parsed.data.position === undefined) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await svc.updateModule({
    tenantId: req.tenant.id,
    moduleId: req.params.moduleId,
    patch: parsed.data,
    updatedBy: req.auth.userId,
  });

  if (!updated) throw new HttpError(404, "Module not found");
  res.json({ ok: true, data: updated });
});


const setModuleStatus = asyncHandler(async (req, res) => {
  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const updated = await svc.updateModuleStatus({
    tenantId: req.tenant.id,
    moduleId: req.params.moduleId,
    status: parsed.data.status,
  });

  if (!updated) throw new HttpError(404, "Module not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.json({ ok: true, data: updated });
});

const createLesson = asyncHandler(async (req, res) => {
  if (!req.tenant?.id) throw new HttpError(400, "Tenant not resolved. Check x-tenant-slug or DEFAULT_TENANT_SLUG.");
  if (!req.params.moduleId) throw new HttpError(400, "Module ID is required.");
  if (!req.auth?.userId) throw new HttpError(401, "Authentication required.");

  const parsed = CreateLessonSchema.safeParse(req.body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstError = flat.fieldErrors?.title?.[0] || flat.formErrors?.[0] || "Invalid input";
    if (process.env.NODE_ENV !== "production") {
      console.error("CreateLesson validation failed:", flat);
    }
    throw new HttpError(400, firstError, flat);
  }

  const data = parsed.data;
  const created = await svc.createLessonSmart({
    tenantId: req.tenant.id,
    moduleId: req.params.moduleId,
    title: data.title.trim(),
    slug: data.slug?.trim() || undefined,
    summary: data.summary?.trim() || undefined,
    position: data.position ?? 0,
    goal: (data.goal && data.goal.trim()) || null,
    video_url: (data.video_url && String(data.video_url).trim()) || null,
    prompts: data.prompts ?? null,
    success_image_url: (data.success_image_url && String(data.success_image_url).trim()) || null,
    success_image_urls: Array.isArray(data.success_image_urls) ? data.success_image_urls.filter(Boolean) : null,
    learn_setup_steps: Array.isArray(data.learn_setup_steps) ? data.learn_setup_steps.filter((s) => s != null) : null,
    pdf_url: (data.pdf_url && String(data.pdf_url).trim()) || null,
    video_captions: (data.video_captions && String(data.video_captions).trim()) || null,
    createdBy: req.auth.userId,
  });

  if (!created || !created.id) throw new HttpError(500, "Lesson creation failed; no record returned.");

  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  if (process.env.NODE_ENV !== "production") {
    console.log("CreateLesson success:", created.id, created.title);
  }
  res.status(201).json({ ok: true, data: created });
});
const updateLesson = asyncHandler(async (req, res) => {
  const parsed = UpdateLessonSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const patch = { ...parsed.data };
  const hasAnyField = [
    "title", "summary", "position", "goal", "video_url", "prompts",
    "success_image_url", "success_image_urls", "learn_setup_steps", "pdf_url", "video_captions", "video_provider", "video_id"
  ].some((k) => patch[k] !== undefined);
  if (!hasAnyField) {
    throw new HttpError(400, "No fields to update");
  }
  if (patch.pdf_url !== undefined) {
    patch.pdf_url = (patch.pdf_url && String(patch.pdf_url).trim()) || null;
  }

  const tenantId = req.tenant?.id ?? req.auth?.tenantId;
  if (!tenantId) throw new HttpError(400, "Tenant not resolved");

  const updated = await svc.updateLesson({
    tenantId,
    lessonId: req.params.lessonId,
    patch,
    updatedBy: req.auth.userId,
  });

  if (!updated) throw new HttpError(404, "Lesson not found");
  delByPrefix(`pub:tenant:${tenantId}:`);
  res.json({ ok: true, data: updated });
});
const listLessonResourcesAdmin = asyncHandler(async (req, res) => {
  const rows = await svc.listLessonResourcesAdmin({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
  });
  res.json({ ok: true, data: rows });
});

const listLessonPracticeAdmin = asyncHandler(async (req, res) => {
  const rows = await svc.listLessonPracticeAdmin({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
  });
  res.json({ ok: true, data: rows });
});


const setLessonStatus = asyncHandler(async (req, res) => {
  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const updated = await svc.updateLessonStatus({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
    status: parsed.data.status,
  });

  if (!updated) throw new HttpError(404, "Lesson not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.json({ ok: true, data: updated });
});

const addResource = asyncHandler(async (req, res) => {
  const parsed = AddResourceSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  if (parsed.data.type !== "text" && !parsed.data.url) {
    throw new HttpError(400, "url required for link/cheatsheet");
  }

  const created = await svc.addResource({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
    type: parsed.data.type,
    title: parsed.data.title,
    url: parsed.data.url,
    body: parsed.data.body,
    sortOrder: parsed.data.sortOrder ?? 0,
    createdBy: req.auth.userId,
  });
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.status(201).json({ ok: true, data: created });
});
const updateResource = asyncHandler(async (req, res) => {
  const parsed = UpdateResourceSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const updated = await svc.updateResource({
    tenantId: req.tenant.id,
    resourceId: req.params.resourceId,
    patch: parsed.data,
    updatedBy: req.auth.userId,
  });

  if (!updated) throw new HttpError(404, "Resource not found");
  res.json({ ok: true, data: updated });
});

const addPractice = asyncHandler(async (req, res) => {
  const parsed = AddPracticeSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const created = await svc.addPractice({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
    title: parsed.data.title,
    prompt: parsed.data.prompt,
    language: parsed.data.language,
    starterCode: parsed.data.starterCode,
    expectedOutput: parsed.data.expectedOutput,
    sortOrder: parsed.data.sortOrder ?? 0,
    createdBy: req.auth.userId,
  });
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.status(201).json({ ok: true, data: created });
});
const updatePractice = asyncHandler(async (req, res) => {
  const parsed = UpdatePracticeSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const updated = await svc.updatePractice({
    tenantId: req.tenant.id,
    practiceId: req.params.practiceId,
    patch: parsed.data,
    updatedBy: req.auth.userId,
  });

  if (!updated) throw new HttpError(404, "Practice not found");
  res.json({ ok: true, data: updated });
});

const courseTreeAdmin = asyncHandler(async (req, res) => {
  const tree = await svc.getCourseTreeAdmin({ tenantId: req.tenant.id, courseId: req.params.courseId });
  if (!tree) throw new HttpError(404, "Course not found");
  res.json({ ok: true, data: tree });
});

// MCQ endpoints
const listLessonMcqsAdmin = asyncHandler(async (req, res) => {
  const rows = await svc.listLessonMcqsAdmin({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
  });
  // Parse JSON options
  const mcqs = rows.map(mcq => ({
    ...mcq,
    options: typeof mcq.options === 'string' ? JSON.parse(mcq.options) : mcq.options,
  }));
  res.json({ ok: true, data: mcqs });
});

const addMcq = asyncHandler(async (req, res) => {
  const parsed = AddMcqSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const created = await svc.addMcq({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
    question: parsed.data.question,
    options: parsed.data.options,
    explanation: parsed.data.explanation,
    sortOrder: parsed.data.sortOrder ?? 0,
    createdBy: req.auth.userId,
  });
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.status(201).json({ ok: true, data: { ...created, options: typeof created.options === 'string' ? JSON.parse(created.options) : created.options } });
});

const updateMcq = asyncHandler(async (req, res) => {
  const parsed = UpdateMcqSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const updated = await svc.updateMcq({
    tenantId: req.tenant.id,
    mcqId: req.params.mcqId,
    patch: parsed.data,
    updatedBy: req.auth.userId,
  });

  if (!updated) throw new HttpError(404, "MCQ not found");
  res.json({ ok: true, data: { ...updated, options: typeof updated.options === 'string' ? JSON.parse(updated.options) : updated.options } });
});

const deleteMcq = asyncHandler(async (req, res) => {
  const deleted = await svc.deleteMcq({
    tenantId: req.tenant.id,
    mcqId: req.params.mcqId,
  });

  if (!deleted) throw new HttpError(404, "MCQ not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);
  res.json({ ok: true, data: deleted });
});

// Slides endpoints
const listLessonSlidesAdmin = asyncHandler(async (req, res) => {
  try {
    const rows = await svc.listLessonSlidesAdmin({
      tenantId: req.tenant.id,
      lessonId: req.params.lessonId,
    });
    // Always return success with data (even if empty)
    return res.json({ ok: true, data: rows || [] });
  } catch (error) {
    // Log the full error for debugging
    console.error("Error in listLessonSlidesAdmin controller:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    // Always return success with empty array to prevent 500 errors
    return res.json({ ok: true, data: [] });
  }
});

const addSlide = asyncHandler(async (req, res) => {
  const parsed = AddSlideSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const created = await svc.addSlide({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
    title: parsed.data.title,
    content: parsed.data.content,
    slideNumber: parsed.data.slideNumber ?? 0,
    imageUrl: parsed.data.imageUrl,
    sortOrder: parsed.data.sortOrder ?? 0,
    createdBy: req.auth.userId,
  });
  delByPrefix(`pub:tenant:${req.tenant.id}:`);

  res.status(201).json({ ok: true, data: created });
});

const updateSlide = asyncHandler(async (req, res) => {
  const parsed = UpdateSlideSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const updated = await svc.updateSlide({
    tenantId: req.tenant.id,
    slideId: req.params.slideId,
    patch: parsed.data,
    updatedBy: req.auth.userId,
  });

  if (!updated) throw new HttpError(404, "Slide not found");
  res.json({ ok: true, data: updated });
});

const deleteSlide = asyncHandler(async (req, res) => {
  const deleted = await svc.deleteSlide({
    tenantId: req.tenant.id,
    slideId: req.params.slideId,
  });

  if (!deleted) throw new HttpError(404, "Slide not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);
  res.json({ ok: true, data: deleted });
});

const deleteResource = asyncHandler(async (req, res) => {
  const deleted = await svc.deleteResource({
    tenantId: req.tenant.id,
    resourceId: req.params.resourceId,
  });

  if (!deleted) throw new HttpError(404, "Resource not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);
  res.json({ ok: true, data: deleted });
});

const deletePractice = asyncHandler(async (req, res) => {
  const deleted = await svc.deletePractice({
    tenantId: req.tenant.id,
    practiceId: req.params.practiceId,
  });

  if (!deleted) throw new HttpError(404, "Practice not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);
  res.json({ ok: true, data: deleted });
});

const deleteCourse = asyncHandler(async (req, res) => {
  const deleted = await svc.deleteCourse({
    tenantId: req.tenant.id,
    courseId: req.params.courseId,
  });

  if (!deleted) throw new HttpError(404, "Course not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);
  res.json({ ok: true, data: deleted });
});

const getCourseDeleteImpact = asyncHandler(async (req, res) => {
  const impact = await svc.getCourseDeleteImpact({
    tenantId: req.tenant.id,
    courseId: req.params.courseId,
  });
  if (!impact) throw new HttpError(404, "Course not found");
  res.json({ ok: true, data: impact });
});

const deleteModule = asyncHandler(async (req, res) => {
  const deleted = await svc.deleteModule({
    tenantId: req.tenant.id,
    moduleId: req.params.moduleId,
  });

  if (!deleted) throw new HttpError(404, "Module not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);
  res.json({ ok: true, data: deleted });
});

const deleteLesson = asyncHandler(async (req, res) => {
  const deleted = await svc.deleteLesson({
    tenantId: req.tenant.id,
    lessonId: req.params.lessonId,
  });

  if (!deleted) throw new HttpError(404, "Lesson not found");
  delByPrefix(`pub:tenant:${req.tenant.id}:`);
  res.json({ ok: true, data: deleted });
});

// ---------- Public ----------
const listCoursesPublic = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
const cacheKey = `pub:tenant:${tenantId}:courses:list`;

const cached = getCache(cacheKey);
if (cached) {
  return res.json({ ok: true, data: cached, cache: "HIT" });
}

const rows = await svc.listCoursesPublic({ tenantId });
setCache(cacheKey, rows, 5);

return res.json({ ok: true, data: rows, cache: "MISS" });

});

const courseTreePublicBySlug = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const courseSlug = req.params.courseSlug;

  const cacheKey = `pub:tenant:${tenantId}:course:${courseSlug}:tree`;
  const cached = getCache(cacheKey);

  if (cached) {
    return res.json({ ok: true, data: cached, cache: "HIT" });
  }

  const tree = await svc.getPublishedCourseTreeBySlug({ tenantId, courseSlug });

  if (!tree) {
    return res.status(404).json({ ok: false, error: "Course not found" });
  }

  setCache(cacheKey, tree, 5);
  return res.json({ ok: true, data: tree, cache: "MISS" });
});

const lessonPublicBySlugs = asyncHandler(async (req, res) => {
  const data = await svc.getPublishedLessonBySlugs({
    tenantId: req.tenant.id,
    courseSlug: req.params.courseSlug,
    moduleSlug: req.params.moduleSlug,
    lessonSlug: req.params.lessonSlug,
  });
  if (!data) throw new HttpError(404, "Lesson not found");
  res.json({ ok: true, data });
});

const listPacksPublic = asyncHandler(async (req, res) => {
  const rows = await svc.listCoursePacksPublic({ tenantId: req.tenant.id });
  const withCourses = await Promise.all(
    rows.map(async (p) => {
      const courses = await svc.listCoursesInPack({ tenantId: req.tenant.id, packId: p.id });
      return { ...p, courses };
    })
  );
  res.json({ ok: true, data: withCourses });
});

const packPublicBySlug = asyncHandler(async (req, res) => {
  const pack = await svc.getPackBySlug({ tenantId: req.tenant.id, slug: req.params.packSlug });
  if (!pack) throw new HttpError(404, "Pack not found");
  const courses = await svc.listCoursesInPack({ tenantId: req.tenant.id, packId: pack.id });
  res.json({ ok: true, data: { ...pack, courses } });
});

// ---------- Admin: Course Packs ----------
const UpdatePackSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  price_in_paise: z.number().int().min(0).optional(),
  status: z.enum(["draft", "published"]).optional(),
});
const SetPackCoursesSchema = z.object({
  course_ids: z.array(z.string().uuid()),
});

const listCoursePacksAdmin = asyncHandler(async (req, res) => {
  const rows = await svc.listCoursePacksAdmin({ tenantId: req.tenant.id });
  res.json({ ok: true, data: rows });
});

const updateCoursePack = asyncHandler(async (req, res) => {
  const parsed = UpdatePackSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
  const updated = await svc.updateCoursePack({
    tenantId: req.tenant.id,
    packId: req.params.packId,
    patch: parsed.data,
  });
  if (!updated) throw new HttpError(404, "Pack not found");
  res.json({ ok: true, data: updated });
});

const getPackCoursesAdmin = asyncHandler(async (req, res) => {
  const pack = await svc.getCoursePackById({ tenantId: req.tenant.id, packId: req.params.packId });
  if (!pack) throw new HttpError(404, "Pack not found");
  const courseIds = await svc.getPackCourseIds({ tenantId: req.tenant.id, packId: req.params.packId });
  res.json({ ok: true, data: { pack, course_ids: courseIds } });
});

const setPackCourses = asyncHandler(async (req, res) => {
  const parsed = SetPackCoursesSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
  const pack = await svc.getCoursePackById({ tenantId: req.tenant.id, packId: req.params.packId });
  if (!pack) throw new HttpError(404, "Pack not found");
  await svc.setPackCourses({
    tenantId: req.tenant.id,
    packId: req.params.packId,
    courseIds: parsed.data.course_ids,
  });
  const courseIds = await svc.getPackCourseIds({ tenantId: req.tenant.id, packId: req.params.packId });
  res.json({ ok: true, data: { course_ids: courseIds } });
});

module.exports = {
  // admin
  createCourse,
  listCoursesAdmin,
   updateCourse,
  setCourseStatus,
  createModule,
  updateModule,
  setModuleStatus,
  createLesson,
  updateLesson,
  setLessonStatus,
  addResource,
  updateResource,
  addPractice,
  updatePractice,
  courseTreeAdmin,
  listLessonResourcesAdmin,
  listLessonPracticeAdmin,
  listLessonMcqsAdmin,
  addMcq,
  updateMcq,
  deleteMcq,
  listLessonSlidesAdmin,
  addSlide,
  updateSlide,
  deleteSlide,
  deleteResource,
  deletePractice,
  getCourseDeleteImpact,
  deleteCourse,
  deleteModule,
  deleteLesson,

  // public
  listCoursesPublic,
  courseTreePublicBySlug,
  lessonPublicBySlugs,
  listPacksPublic,
  packPublicBySlug,
  listCoursePacksAdmin,
  updateCoursePack,
  getPackCoursesAdmin,
  setPackCourses,
};
