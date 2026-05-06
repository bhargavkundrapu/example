// apps/api/src/modules/content/content.repo.js
const { query } = require("../../db/query");

async function createCourse({ tenantId, title, slug, description, level, status, createdBy }) {
  const { rows } = await query(
    `INSERT INTO courses (tenant_id, title, slug, description, level, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [tenantId, title, slug, description ?? null, level ?? null, status ?? "draft", createdBy ?? null]
  );
  return rows[0];
}

async function listCoursesAdmin({ tenantId }) {
  const { rows } = await query(
    `SELECT * FROM courses
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [tenantId]
  );
  if (rows.length === 0) return rows;
  const courseIds = rows.map(r => r.id);
  const { rows: counts } = await query(
    `SELECT course_id, COUNT(*)::int AS module_count
     FROM course_modules
     WHERE tenant_id = $1 AND course_id = ANY($2::uuid[])
     GROUP BY course_id`,
    [tenantId, courseIds]
  );
  const countByCourse = Object.fromEntries((counts || []).map(c => [c.course_id, c.module_count]));
  rows.forEach(c => { c.module_count = countByCourse[c.id] ?? 0; });
  return rows;
}

async function listCoursesPublic({ tenantId }) {
  const { rows } = await query(
    `SELECT id, title, slug, description, level, price_in_paise
     FROM courses
     WHERE tenant_id = $1 AND status = 'published'
     ORDER BY sort_order ASC, created_at ASC`,
    [tenantId]
  );
  return rows;
}

/** Get published courses by slugs (matches slug or slug with underscores replaced by hyphens). */
async function listCoursesPublicBySlugs({ tenantId, slugs }) {
  if (!slugs || slugs.length === 0) return [];
  const { rows } = await query(
    `SELECT id, title, slug, description, level, price_in_paise
     FROM courses
     WHERE tenant_id = $1 AND status = 'published'
     AND (slug = ANY($2::text[]) OR REPLACE(slug, '_', '-') = ANY($2::text[]))
     ORDER BY sort_order ASC, created_at ASC`,
    [tenantId, slugs]
  );
  return rows;
}

async function updateCourseStatus({ tenantId, courseId, status }) {
  const { rows } = await query(
    `UPDATE courses SET status = $1, updated_at = now()
     WHERE tenant_id = $2 AND id = $3
     RETURNING *`,
    [status, tenantId, courseId]
  );
  return rows[0] ?? null;
}

async function createModule({ tenantId, courseId, title, slug, position, status, createdBy }) {
  const { rows } = await query(
    `INSERT INTO course_modules (tenant_id, course_id, title, slug, position, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [tenantId, courseId, title, slug, position ?? 0, status ?? "draft", createdBy ?? null]
  );
  return rows[0];
}

async function createLesson({ tenantId, moduleId, title, slug, summary, position, goal, video_url, prompts, success_image_url, success_image_urls, learn_setup_steps, pdf_url = null, video_captions = null, status, createdBy }) {
  const pdfUrlValue = pdf_url ?? null;
  const urlsValue = Array.isArray(success_image_urls) && success_image_urls.length > 0
    ? JSON.stringify(success_image_urls)
    : null;
  const stepsValue = Array.isArray(learn_setup_steps) && learn_setup_steps.length > 0
    ? JSON.stringify(learn_setup_steps)
    : null;
  const { rows } = await query(
    `INSERT INTO lessons (tenant_id, module_id, title, slug, summary, position, goal, video_url, prompts, success_image_url, success_image_urls, learn_setup_steps, pdf_url, video_captions, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      tenantId, 
      moduleId, 
      title, 
      slug, 
      summary ?? null, 
      position ?? 0, 
      goal ?? null,
      video_url ?? null,
      prompts ? JSON.stringify(prompts) : null,
      success_image_url ?? null,
      urlsValue,
      stepsValue,
      pdfUrlValue,
      video_captions ?? null,
      status ?? "draft", 
      createdBy ?? null
    ]
  );
  return rows[0];
}

async function updateModuleStatus({ tenantId, moduleId, status }) {
  const { rows } = await query(
    `UPDATE course_modules SET status = $1, updated_at = now()
     WHERE tenant_id = $2 AND id = $3
     RETURNING *`,
    [status, tenantId, moduleId]
  );
  return rows[0] ?? null;
}

async function updateLessonStatus({ tenantId, lessonId, status }) {
  const { rows } = await query(
    `UPDATE lessons SET status = $1, updated_at = now()
     WHERE tenant_id = $2 AND id = $3
     RETURNING *`,
    [status, tenantId, lessonId]
  );
  return rows[0] ?? null;
}
async function listLessonResourcesAdmin({ tenantId, lessonId }) {
  const { rows } = await query(
    `SELECT *
     FROM resources
     WHERE tenant_id=$1 AND lesson_id=$2
     ORDER BY sort_order ASC, created_at ASC`,
    [tenantId, lessonId]
  );
  return rows;
}

async function listLessonPracticeAdmin({ tenantId, lessonId }) {
  const { rows } = await query(
    `SELECT *
     FROM practice_tasks
     WHERE tenant_id=$1 AND lesson_id=$2
     ORDER BY sort_order ASC, created_at ASC`,
    [tenantId, lessonId]
  );
  return rows;
}

async function addResource({ tenantId, lessonId, type, title, url, body, sortOrder, createdBy }) {
  const { rows } = await query(
    `INSERT INTO resources (tenant_id, lesson_id, type, title, url, body, sort_order, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [tenantId, lessonId, type, title, url ?? null, body ?? null, sortOrder ?? 0, createdBy ?? null]
  );
  return rows[0];
}

async function addPractice({ tenantId, lessonId, title, prompt, language, starterCode, expectedOutput, sortOrder, createdBy }) {
  const { rows } = await query(
    `INSERT INTO practice_tasks (tenant_id, lesson_id, title, prompt, language, starter_code, expected_output, sort_order, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [tenantId, lessonId, title, prompt, language ?? null, starterCode ?? null, expectedOutput ?? null, sortOrder ?? 0, createdBy ?? null]
  );
  return rows[0];
}

async function getCourseTreeAdmin({ tenantId, courseId }) {
  const course = (await query(`SELECT * FROM courses WHERE tenant_id=$1 AND id=$2`, [tenantId, courseId])).rows[0] ?? null;
  if (!course) return null;

  const modules = (await query(
    `SELECT * FROM course_modules WHERE tenant_id=$1 AND course_id=$2 ORDER BY position ASC, created_at ASC`,
    [tenantId, courseId]
  )).rows;

  const moduleIds = modules.map(m => m.id);
  let lessons = [];
  if (moduleIds.length) {
    lessons = (await query(
      `SELECT id, module_id, title, slug, summary, position, goal, video_url, video_captions, prompts, success_image_url, success_image_urls, learn_setup_steps, pdf_url, video_provider, video_id, duration_seconds, status, created_at, updated_at FROM lessons WHERE tenant_id=$1 AND module_id = ANY($2::uuid[]) ORDER BY position ASC, created_at ASC`,
      [tenantId, moduleIds]
    )).rows;

    // Parse prompts and success_image_urls for each lesson
    lessons = lessons.map(lesson => {
      if (lesson.prompts && typeof lesson.prompts === 'string') {
        try {
          lesson.prompts = JSON.parse(lesson.prompts);
        } catch (e) {
          lesson.prompts = null;
        }
      }
      if (lesson.success_image_urls && typeof lesson.success_image_urls === 'string') {
        try {
          lesson.success_image_urls = JSON.parse(lesson.success_image_urls);
        } catch (e) {
          lesson.success_image_urls = null;
        }
      }
      if (lesson.learn_setup_steps && typeof lesson.learn_setup_steps === 'string') {
        try {
          lesson.learn_setup_steps = JSON.parse(lesson.learn_setup_steps);
        } catch (e) {
          lesson.learn_setup_steps = null;
        }
      }
      return lesson;
    });

    // Attach lessons to each module for frontend
    const lessonsByModule = new Map();
    for (const l of lessons) {
      const key = String(l.module_id);
      if (!lessonsByModule.has(key)) lessonsByModule.set(key, []);
      lessonsByModule.get(key).push(l);
    }
    for (const m of modules) {
      m.lessons = lessonsByModule.get(String(m.id)) || [];
    }
  }

  return { course, modules, lessons };
}

/** Same variants as student.repo bonus course lookup - URL may use plural while DB uses singular (or legacy slugs). */
const BONUS_AI_AUTOMATION_SLUG_VARIANTS = [
  "ai-automations",
  "ai_automations",
  "ai-automation",
  "ai_automation",
  "ai-agents",
  "ai_agents",
];

function normalizeCourseSlugKey(slug) {
  return String(slug || "")
    .toLowerCase()
    .replace(/_/g, "-")
    .trim();
}

function isAiAutomationsSlugRequest(slug) {
  const n = normalizeCourseSlugKey(slug);
  if (!n) return false;
  if (BONUS_AI_AUTOMATION_SLUG_VARIANTS.includes(n)) return true;
  if (n.includes("ai-automation")) return true;
  if (n.includes("ai-automat")) return true;
  if (n === "ai-agents") return true;
  return false;
}

/** Placeholder lesson slugs in URLs/CMS that are not real DB slugs - resolve to first lesson in module/course. */
function isPlaceholderLessonSlug(slug) {
  const n = normalizeCourseSlugKey(slug);
  return n === "start" || n === "first" || n === "_first" || n === "begin" || n === "intro";
}

/**
 * Resolve a published course row by URL slug, including AI Automations aliases (plural/singular, legacy names).
 * Used by student course tree, lesson fetch, and progress so /courses/ai-automations matches DB slug ai-automation.
 */
async function findPublishedCourseRowBySlug({ tenantId, courseSlug }) {
  const requested = String(courseSlug || "").trim();
  const normReq = normalizeCourseSlugKey(requested);

  const { rows: direct } = await query(
    `SELECT id, title, slug, description, level, price_in_paise
     FROM courses
     WHERE tenant_id=$1 AND status='published'
     AND (
       slug = $2
       OR REPLACE(slug, '_', '-') = $2
       OR LOWER(REPLACE(slug, '_', '-')) = LOWER($3)
     )
     LIMIT 1`,
    [tenantId, requested, normReq]
  );
  if (direct[0]) return direct[0];

  if (!isAiAutomationsSlugRequest(requested)) return null;

  for (const variant of BONUS_AI_AUTOMATION_SLUG_VARIANTS) {
    const { rows } = await query(
      `SELECT id, title, slug, description, level, price_in_paise
       FROM courses
       WHERE tenant_id=$1 AND status='published'
       AND (
         LOWER(REPLACE(slug, '_', '-')) = LOWER($2)
         OR slug = $2
       )
       LIMIT 1`,
      [tenantId, variant]
    );
    if (rows[0]) return rows[0];
  }

  const { rows: fallback } = await query(
    `SELECT id, title, slug, description, level, price_in_paise
     FROM courses
     WHERE tenant_id=$1 AND status='published'
     AND (
       LOWER(title) LIKE '%ai automation%'
       OR LOWER(slug) LIKE '%ai%automation%'
     )
     ORDER BY created_at ASC
     LIMIT 1`,
    [tenantId]
  );
  return fallback[0] ?? null;
}

async function getPublishedCourseTreeBySlug({ tenantId, courseSlug }) {
  const course = await findPublishedCourseRowBySlug({ tenantId, courseSlug });
  if (!course) return null;

  const modules = (await query(
    `SELECT id, title, slug, position
     FROM course_modules
     WHERE tenant_id=$1 AND course_id=$2 AND status='published'
     ORDER BY position ASC, created_at ASC`,
    [tenantId, course.id]
  )).rows;

  const moduleIds = modules.map(m => m.id);
  let lessons = [];
  if (moduleIds.length) {
    lessons = (await query(
      `SELECT id, module_id, title, slug, summary, position, goal, video_url, video_captions, prompts, success_image_url, success_image_urls, learn_setup_steps, pdf_url
       FROM lessons
       WHERE tenant_id=$1 AND module_id = ANY($2::uuid[]) AND status='published'
       ORDER BY position ASC, created_at ASC`,
      [tenantId, moduleIds]
    )).rows;
  }

  // Parse prompts and success_image_urls for each lesson
  lessons = lessons.map(lesson => {
    if (lesson.prompts && typeof lesson.prompts === 'string') {
      try {
        lesson.prompts = JSON.parse(lesson.prompts);
      } catch (e) {
        lesson.prompts = null;
      }
    }
    if (lesson.success_image_urls && typeof lesson.success_image_urls === 'string') {
      try {
        lesson.success_image_urls = JSON.parse(lesson.success_image_urls);
      } catch (e) {
        lesson.success_image_urls = null;
      }
    }
    if (lesson.learn_setup_steps && typeof lesson.learn_setup_steps === 'string') {
      try {
        lesson.learn_setup_steps = JSON.parse(lesson.learn_setup_steps);
      } catch (e) {
        lesson.learn_setup_steps = null;
      }
    }
    return lesson;
  });

  const lessonsByModule = new Map();
  for (const l of lessons) {
    if (!lessonsByModule.has(l.module_id)) lessonsByModule.set(l.module_id, []);
    lessonsByModule.get(l.module_id).push(l);
  }

  const modulesWithLessons = modules.map((m) => ({
    ...m,
    lessons: lessonsByModule.get(m.id) || [],
  }));

  return { course: { ...course, modules: modulesWithLessons } };
}

const PUBLISHED_LESSON_ROW_SELECT = `
     SELECT
        c.id AS course_id, c.title AS course_title, c.slug AS course_slug,
        m.id AS module_id, m.title AS module_title, m.slug AS module_slug,
        l.id AS lesson_id, l.title AS lesson_title, l.slug AS lesson_slug, l.summary,
        l.video_provider, l.video_id, l.duration_seconds,
        l.goal, l.video_url, l.video_captions, l.prompts, l.success_image_url, l.success_image_urls, l.learn_setup_steps, l.pdf_url
     FROM courses c
     JOIN course_modules m ON m.course_id = c.id AND m.tenant_id = c.tenant_id
     JOIN lessons l ON l.module_id = m.id AND l.tenant_id = m.tenant_id`;

async function buildPublishedLessonPayload({ tenantId, row }) {
  if (!row) return null;
  if (row.prompts && typeof row.prompts === "string") {
    try {
      row.prompts = JSON.parse(row.prompts);
    } catch (e) {
      row.prompts = null;
    }
  }
  const resources = (await query(
    `SELECT id, type, title, url, body, sort_order
     FROM resources
     WHERE tenant_id=$1 AND lesson_id=$2
     ORDER BY sort_order ASC, created_at ASC`,
    [tenantId, row.lesson_id]
  )).rows;

  const practice = (await query(
    `SELECT id, title, prompt, language, starter_code, expected_output, sort_order
     FROM practice_tasks
     WHERE tenant_id=$1 AND lesson_id=$2
     ORDER BY sort_order ASC, created_at ASC`,
    [tenantId, row.lesson_id]
  )).rows;

  return { lesson: row, resources, practice };
}

/** Match slugs with hyphen or underscore (e.g. user-schema-design or user_schema_design). */
async function getPublishedLessonBySlugs({ tenantId, courseSlug, moduleSlug, lessonSlug }) {
  const course = await findPublishedCourseRowBySlug({ tenantId, courseSlug });
  if (!course) return null;

  const { rows } = await query(
    `${PUBLISHED_LESSON_ROW_SELECT}
     WHERE c.tenant_id = $1 AND c.status='published'
       AND c.id = $2
       AND (m.slug = $3 OR REPLACE(m.slug, '_', '-') = $3) AND m.status='published'
       AND (l.slug = $4 OR REPLACE(l.slug, '_', '-') = $4) AND l.status='published'
     LIMIT 1`,
    [tenantId, course.id, moduleSlug, lessonSlug]
  );

  let row = rows[0] ?? null;

  // CMS/legacy URLs sometimes use "start" instead of the real first lesson slug
  if (!row && isPlaceholderLessonSlug(lessonSlug)) {
    const { rows: r2 } = await query(
      `${PUBLISHED_LESSON_ROW_SELECT}
       WHERE c.tenant_id = $1 AND c.status='published'
         AND c.id = $2
         AND (m.slug = $3 OR REPLACE(m.slug, '_', '-') = $3) AND m.status='published'
         AND l.status='published'
       ORDER BY l.position ASC NULLS LAST, l.created_at ASC
       LIMIT 1`,
      [tenantId, course.id, moduleSlug]
    );
    row = r2[0] ?? null;
  }

  // Still placeholder: first published lesson in the whole course (wrong/missing module slug in URL)
  if (!row && isPlaceholderLessonSlug(lessonSlug)) {
    const { rows: r3 } = await query(
      `${PUBLISHED_LESSON_ROW_SELECT}
       WHERE c.tenant_id = $1 AND c.status='published'
         AND c.id = $2
         AND m.status='published' AND l.status='published'
       ORDER BY m.position ASC NULLS LAST, m.created_at ASC, l.position ASC NULLS LAST, l.created_at ASC
       LIMIT 1`,
      [tenantId, course.id]
    );
    row = r3[0] ?? null;
  }

  return buildPublishedLessonPayload({ tenantId, row });
}
async function updateCourse({ tenantId, courseId, patch, updatedBy }) {
  const fields = [];
  const values = [];
  let i = 1;

  if (patch.title !== undefined) {
    fields.push(`title=$${i++}`);
    values.push(patch.title);
  }
  if (patch.description !== undefined) {
    fields.push(`description=$${i++}`);
    values.push(patch.description);
  }
  if (patch.level !== undefined) {
    fields.push(`level=$${i++}`);
    values.push(patch.level);
  }
  if (patch.price_in_paise !== undefined) {
    fields.push(`price_in_paise=$${i++}`);
    values.push(patch.price_in_paise);
  }
  if (patch.sort_order !== undefined) {
    fields.push(`sort_order=$${i++}`);
    values.push(patch.sort_order);
  }

  if (!fields.length) return null;

  values.push(updatedBy);
  values.push(tenantId);
  values.push(courseId);

  const sql = `
    UPDATE courses
    SET ${fields.join(", ")},
        updated_by=$${i++},
        updated_at=now()
    WHERE tenant_id=$${i++}
      AND id=$${i++}
    RETURNING *
  `;

  const { rows } = await query(sql, values);
  return rows[0] || null;
}
async function updateModule({ tenantId, moduleId, patch, updatedBy }) {
  const fields = [];
  const values = [];
  let i = 1;

  if (patch.title !== undefined) { fields.push(`title=$${i++}`); values.push(patch.title); }
  if (patch.position !== undefined) { fields.push(`position=$${i++}`); values.push(patch.position); }

  if (!fields.length) return null;

  values.push(updatedBy);
  values.push(tenantId);
  values.push(moduleId);

  const sql = `
    UPDATE course_modules
    SET ${fields.join(", ")}, updated_by=$${i++}, updated_at=now()
    WHERE tenant_id=$${i++} AND id=$${i++}
    RETURNING *
  `;
  const { rows } = await query(sql, values);
  return rows[0] || null;
}
async function updateLesson({ tenantId, lessonId, patch, updatedBy }) {
  const fields = [];
  const values = [];
  let i = 1;

  if (patch.title !== undefined) { fields.push(`title=$${i++}`); values.push(patch.title); }
  if (patch.summary !== undefined) { fields.push(`summary=$${i++}`); values.push(patch.summary); }
  if (patch.position !== undefined) { fields.push(`position=$${i++}`); values.push(patch.position); }
  if (patch.video_provider !== undefined) { fields.push(`video_provider=$${i++}`); values.push(patch.video_provider); }
  if (patch.video_id !== undefined) { fields.push(`video_id=$${i++}`); values.push(patch.video_id); }
  if (patch.goal !== undefined) { fields.push(`goal=$${i++}`); values.push(patch.goal || null); }
  if (patch.video_url !== undefined) { fields.push(`video_url=$${i++}`); values.push(patch.video_url || null); }
  if (patch.prompts !== undefined) { fields.push(`prompts=$${i++}`); values.push(patch.prompts ? JSON.stringify(patch.prompts) : null); }
  if (patch.success_image_url !== undefined) { fields.push(`success_image_url=$${i++}`); values.push(patch.success_image_url || null); }
  if (patch.success_image_urls !== undefined) {
    const urls = Array.isArray(patch.success_image_urls) ? patch.success_image_urls.filter(Boolean) : [];
    fields.push(`success_image_urls=$${i++}`);
    values.push(JSON.stringify(urls));
  }
  if (patch.learn_setup_steps !== undefined) {
    const steps = Array.isArray(patch.learn_setup_steps) ? patch.learn_setup_steps.filter(Boolean) : [];
    fields.push(`learn_setup_steps=$${i++}`);
    values.push(JSON.stringify(steps));
  }
  if (patch.pdf_url !== undefined) { fields.push(`pdf_url=$${i++}`); values.push(patch.pdf_url || null); }
  if (patch.video_captions !== undefined) { fields.push(`video_captions=$${i++}`); values.push(patch.video_captions || null); }

  if (!fields.length) return null;

  values.push(updatedBy, tenantId, lessonId);

  const sql = `
    UPDATE lessons
    SET ${fields.join(", ")}, updated_by=$${i++}, updated_at=now()
    WHERE tenant_id=$${i++} AND id=$${i++}
    RETURNING *
  `;
  const { rows } = await query(sql, values);
  return rows[0] || null;
}
async function updateResource({ tenantId, resourceId, patch, updatedBy }) {
  const fields = [];
  const values = [];
  let i = 1;

  if (patch.title !== undefined) {
    fields.push(`title=$${i++}`);
    values.push(patch.title);
  }
  if (patch.url !== undefined) {
    fields.push(`url=$${i++}`);
    values.push(patch.url);
  }
  if (patch.body !== undefined) {
    fields.push(`body=$${i++}`);
    values.push(patch.body);
  }
  // NOTE: your column name in DB might be sort_order or sort_order, check it.
  // You used sortOrder in API, so DB column likely "sort_order".
  if (patch.sortOrder !== undefined) {
    fields.push(`sort_order=$${i++}`);
    values.push(patch.sortOrder);
  }

  if (!fields.length) return null;

  values.push(updatedBy);  // updated_by
  values.push(tenantId);   // tenant_id
  values.push(resourceId); // id

  const sql = `
    UPDATE resources
    SET ${fields.join(", ")},
        updated_by=$${i++},
        updated_at=now()
    WHERE tenant_id=$${i++}
      AND id=$${i++}
    RETURNING *
  `;

  const { rows } = await query(sql, values);
  return rows[0] || null;
}

async function updatePractice({ tenantId, practiceId, patch, updatedBy }) {
  const fields = [];
  const values = [];
  let i = 1;

  if (patch.title !== undefined) { fields.push(`title=$${i++}`); values.push(patch.title); }
  if (patch.prompt !== undefined) { fields.push(`prompt=$${i++}`); values.push(patch.prompt); }
  if (patch.language !== undefined) { fields.push(`language=$${i++}`); values.push(patch.language); }
  if (patch.starterCode !== undefined) { fields.push(`starter_code=$${i++}`); values.push(patch.starterCode); }
  if (patch.expectedOutput !== undefined) { fields.push(`expected_output=$${i++}`); values.push(patch.expectedOutput); }

  // DB column usually sort_order
  if (patch.sortOrder !== undefined) { fields.push(`sort_order=$${i++}`); values.push(patch.sortOrder); }

  if (!fields.length) return null;

  values.push(updatedBy);
  values.push(tenantId);
  values.push(practiceId);

  const sql = `
    UPDATE practice_tasks
    SET ${fields.join(", ")},
        updated_by=$${i++},
        updated_at=now()
    WHERE tenant_id=$${i++}
      AND id=$${i++}
    RETURNING *
  `;

  const { rows } = await query(sql, values);
  return rows[0] || null;
}

async function deleteResource({ tenantId, resourceId }) {
  const { rows } = await query(
    `DELETE FROM resources
     WHERE tenant_id=$1 AND id=$2
     RETURNING *`,
    [tenantId, resourceId]
  );
  return rows[0] || null;
}

async function deletePractice({ tenantId, practiceId }) {
  const { rows } = await query(
    `DELETE FROM practice_tasks
     WHERE tenant_id=$1 AND id=$2
     RETURNING *`,
    [tenantId, practiceId]
  );
  return rows[0] || null;
}

// MCQ Functions
async function listLessonMcqsAdmin({ tenantId, lessonId }) {
  const { rows } = await query(
    `SELECT *
     FROM lesson_mcqs
     WHERE tenant_id=$1 AND lesson_id=$2
     ORDER BY sort_order ASC, created_at ASC`,
    [tenantId, lessonId]
  );
  return rows;
}

async function addMcq({ tenantId, lessonId, question, options, explanation, sortOrder, createdBy }) {
  const { rows } = await query(
    `INSERT INTO lesson_mcqs (tenant_id, lesson_id, question, options, explanation, sort_order, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [tenantId, lessonId, question, JSON.stringify(options), explanation ?? null, sortOrder ?? 0, createdBy ?? null]
  );
  return rows[0];
}

async function updateMcq({ tenantId, mcqId, patch, updatedBy }) {
  const fields = [];
  const values = [];
  let i = 1;

  if (patch.question !== undefined) { fields.push(`question=$${i++}`); values.push(patch.question); }
  if (patch.options !== undefined) { fields.push(`options=$${i++}`); values.push(JSON.stringify(patch.options)); }
  if (patch.explanation !== undefined) { fields.push(`explanation=$${i++}`); values.push(patch.explanation); }
  if (patch.sortOrder !== undefined) { fields.push(`sort_order=$${i++}`); values.push(patch.sortOrder); }

  if (!fields.length) return null;

  values.push(updatedBy);
  values.push(tenantId);
  values.push(mcqId);

  const sql = `
    UPDATE lesson_mcqs
    SET ${fields.join(", ")},
        updated_at=now()
    WHERE tenant_id=$${i++}
      AND id=$${i++}
    RETURNING *
  `;

  const { rows } = await query(sql, values);
  return rows[0] || null;
}

async function deleteMcq({ tenantId, mcqId }) {
  const { rows } = await query(
    `DELETE FROM lesson_mcqs
     WHERE tenant_id=$1 AND id=$2
     RETURNING *`,
    [tenantId, mcqId]
  );
  return rows[0] || null;
}

// Slides Functions
async function listLessonSlidesAdmin({ tenantId, lessonId }) {
  // Wrap everything in try-catch to handle any possible error
  try {
    // First, try query with sort_order (if column exists)
    try {
      const { rows } = await query(
        `SELECT *
         FROM lesson_slides
         WHERE tenant_id=$1 AND lesson_id=$2
         ORDER BY sort_order ASC, slide_number ASC, created_at ASC`,
        [tenantId, lessonId]
      );
      return rows || [];
    } catch (primaryErr) {
      // Check if it's a column error (42703 = column does not exist)
      const isColumnError = primaryErr.code === '42703' || 
                           (primaryErr.message && (
                             primaryErr.message.includes('sort_order') || 
                             primaryErr.message.includes('column') ||
                             primaryErr.message.toLowerCase().includes('does not exist')
                           ));
      
      // If it's a column error, try without sort_order
      if (isColumnError) {
        try {
          const { rows } = await query(
            `SELECT *
             FROM lesson_slides
             WHERE tenant_id=$1 AND lesson_id=$2
             ORDER BY slide_number ASC, created_at ASC`,
            [tenantId, lessonId]
          );
          return rows || [];
        } catch (fallbackErr) {
          // If fallback also fails (table doesn't exist, etc.), return empty
          console.error("[listLessonSlidesAdmin] Fallback query failed:", fallbackErr.code, fallbackErr.message);
          return [];
        }
      }
      
      // If it's not a column error, check if table exists
      const isTableError = primaryErr.code === '42P01' || 
                          (primaryErr.message && primaryErr.message.includes('relation') && primaryErr.message.includes('does not exist'));
      
      if (isTableError) {
        console.error("[listLessonSlidesAdmin] Table lesson_slides does not exist. Please run migration 012_lesson_mcq_slides.sql");
        return [];
      }
      
      // For any other error, log and return empty array
      console.error("[listLessonSlidesAdmin] Unexpected error:", primaryErr.code, primaryErr.message);
      return [];
    }
  } catch (outerErr) {
    // Catch any unexpected errors (synchronous errors, etc.)
    console.error("[listLessonSlidesAdmin] Outer catch - unexpected error:", outerErr);
    return [];
  }
}

async function addSlide({ tenantId, lessonId, title, content, slideNumber, imageUrl, sortOrder, createdBy }) {
  // Check if table exists first
  try {
    const tableCheck = await query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'lesson_slides'`
    );
    
    if (tableCheck.rows.length === 0) {
      throw new Error("lesson_slides table does not exist. Please run migration 012_lesson_mcq_slides.sql");
    }
  } catch (err) {
    throw err;
  }

  // Check if sort_order column exists
  try {
    const checkColumn = await query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = 'public'
       AND table_name = 'lesson_slides' 
       AND column_name = 'sort_order'`
    );
    
    const hasSortOrder = checkColumn.rows.length > 0;
    
    if (hasSortOrder) {
      const { rows } = await query(
        `INSERT INTO lesson_slides (tenant_id, lesson_id, title, content, slide_number, image_url, sort_order, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [tenantId, lessonId, title, content ?? null, slideNumber ?? 0, imageUrl ?? null, sortOrder ?? 0, createdBy ?? null]
      );
      return rows[0];
    } else {
      // Insert without sort_order column
      const { rows } = await query(
        `INSERT INTO lesson_slides (tenant_id, lesson_id, title, content, slide_number, image_url, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [tenantId, lessonId, title, content ?? null, slideNumber ?? 0, imageUrl ?? null, createdBy ?? null]
      );
      return rows[0];
    }
  } catch (err) {
    throw err;
  }
}

async function updateSlide({ tenantId, slideId, patch, updatedBy }) {
  // Check if table exists first
  try {
    const tableCheck = await query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'lesson_slides'`
    );
    
    if (tableCheck.rows.length === 0) {
      return null;
    }
  } catch (err) {
    return null;
  }

  // Check if sort_order column exists
  let hasSortOrder = false;
  try {
    const checkColumn = await query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = 'public'
       AND table_name = 'lesson_slides' 
       AND column_name = 'sort_order'`
    );
    hasSortOrder = checkColumn.rows.length > 0;
  } catch (err) {
    // If check fails, assume column doesn't exist
    hasSortOrder = false;
  }

  const fields = [];
  const values = [];
  let i = 1;

  if (patch.title !== undefined) { fields.push(`title=$${i++}`); values.push(patch.title); }
  if (patch.content !== undefined) { fields.push(`content=$${i++}`); values.push(patch.content); }
  if (patch.slideNumber !== undefined) { fields.push(`slide_number=$${i++}`); values.push(patch.slideNumber); }
  if (patch.imageUrl !== undefined) { fields.push(`image_url=$${i++}`); values.push(patch.imageUrl); }
  if (patch.sortOrder !== undefined && hasSortOrder) { fields.push(`sort_order=$${i++}`); values.push(patch.sortOrder); }

  if (!fields.length) return null;

  values.push(updatedBy);
  values.push(tenantId);
  values.push(slideId);

  try {
    const sql = `
      UPDATE lesson_slides
      SET ${fields.join(", ")},
          updated_at=now()
      WHERE tenant_id=$${i++}
        AND id=$${i++}
      RETURNING *
    `;

    const { rows } = await query(sql, values);
    return rows[0] || null;
  } catch (err) {
    console.error("Error updating slide:", err.message);
    return null;
  }
}

async function deleteSlide({ tenantId, slideId }) {
  try {
    // Check if table exists first
    const tableCheck = await query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'lesson_slides'`
    );
    
    if (tableCheck.rows.length === 0) {
      return null;
    }

    const { rows } = await query(
      `DELETE FROM lesson_slides
       WHERE tenant_id=$1 AND id=$2
       RETURNING *`,
      [tenantId, slideId]
    );
    return rows[0] || null;
  } catch (err) {
    console.error("Error deleting slide:", err.message);
    return null;
  }
}

async function deleteCourse({ tenantId, courseId }) {
  const { rows } = await query(
    `DELETE FROM courses
     WHERE tenant_id=$1 AND id=$2
     RETURNING *`,
    [tenantId, courseId]
  );
  return rows[0] || null;
}

async function getCourseDeleteImpact({ tenantId, courseId }) {
  const { rows: courseRows } = await query(
    `SELECT id, title, slug
     FROM courses
     WHERE tenant_id = $1 AND id = $2
     LIMIT 1`,
    [tenantId, courseId]
  );
  const course = courseRows[0] || null;
  if (!course) return null;

  const { rows: moduleRows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM course_modules
     WHERE tenant_id = $1 AND course_id = $2`,
    [tenantId, courseId]
  );

  const { rows: lessonRows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM lessons l
     JOIN course_modules m ON m.id = l.module_id AND m.tenant_id = l.tenant_id
     WHERE m.tenant_id = $1 AND m.course_id = $2`,
    [tenantId, courseId]
  );

  const { rows: directEnrollRows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM enrollments
     WHERE tenant_id = $1
       AND item_type = 'course'
       AND item_id = $2
       AND active = true`,
    [tenantId, courseId]
  );

  const { rows: packEnrollRows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM enrollments e
     WHERE e.tenant_id = $1
       AND e.item_type = 'pack'
       AND e.active = true
       AND EXISTS (
         SELECT 1
         FROM course_pack_courses cpc
         WHERE cpc.pack_id = e.item_id
           AND cpc.course_id = $2
       )`,
    [tenantId, courseId]
  );

  return {
    course_id: course.id,
    title: course.title,
    slug: course.slug,
    modules_count: moduleRows[0]?.count || 0,
    lessons_count: lessonRows[0]?.count || 0,
    direct_active_enrollments: directEnrollRows[0]?.count || 0,
    pack_active_enrollments: packEnrollRows[0]?.count || 0,
    total_active_enrollments: (directEnrollRows[0]?.count || 0) + (packEnrollRows[0]?.count || 0),
  };
}

async function deleteModule({ tenantId, moduleId }) {
  const { rows } = await query(
    `DELETE FROM course_modules
     WHERE tenant_id=$1 AND id=$2
     RETURNING *`,
    [tenantId, moduleId]
  );
  return rows[0] || null;
}

async function deleteLesson({ tenantId, lessonId }) {
  const { rows } = await query(
    `DELETE FROM lessons
     WHERE tenant_id=$1 AND id=$2
     RETURNING *`,
    [tenantId, lessonId]
  );
  return rows[0] || null;
}

async function listCoursePacksPublic({ tenantId }) {
  const { rows } = await query(
    `SELECT id, title, slug, description, price_in_paise
     FROM course_packs
     WHERE tenant_id = $1 AND status = 'published'
     ORDER BY created_at DESC`,
    [tenantId]
  );
  return rows;
}

async function getPackBySlug({ tenantId, slug }) {
  const { rows } = await query(
    `SELECT id, title, slug, description, price_in_paise
     FROM course_packs
     WHERE tenant_id = $1 AND slug = $2 AND status = 'published' LIMIT 1`,
    [tenantId, slug]
  );
  return rows[0] ?? null;
}

// Admin: course packs
async function listCoursePacksAdmin({ tenantId }) {
  const { rows } = await query(
    `SELECT id, title, slug, description, price_in_paise, status, created_at, updated_at
     FROM course_packs
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [tenantId]
  );
  return rows;
}

async function getCoursePackById({ tenantId, packId }) {
  const { rows } = await query(
    `SELECT id, title, slug, description, price_in_paise, status
     FROM course_packs
     WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, packId]
  );
  return rows[0] ?? null;
}

async function updateCoursePack({ tenantId, packId, patch }) {
  const allowed = ["title", "slug", "description", "price_in_paise", "status"];
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      setClauses.push(`${k} = $${i++}`);
      values.push(patch[k]);
    }
  }
  if (setClauses.length === 0) return null;
  setClauses.push("updated_at = now()");
  values.push(tenantId, packId);
  const { rows } = await query(
    `UPDATE course_packs SET ${setClauses.join(", ")}
     WHERE tenant_id = $${i++} AND id = $${i}
     RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

async function getPackCourseIds({ tenantId, packId }) {
  const { rows } = await query(
    `SELECT course_id FROM course_pack_courses cpc
     JOIN course_packs p ON p.id = cpc.pack_id
     WHERE p.tenant_id = $1 AND cpc.pack_id = $2`,
    [tenantId, packId]
  );
  return rows.map((r) => r.course_id);
}

async function setPackCourses({ tenantId, packId, courseIds }) {
  await query(
    `DELETE FROM course_pack_courses
     WHERE pack_id IN (SELECT id FROM course_packs WHERE tenant_id = $1 AND id = $2)`,
    [tenantId, packId]
  );
  if (!courseIds?.length) return [];
  await query(
    `INSERT INTO course_pack_courses (pack_id, course_id)
     SELECT $1, unnest($2::uuid[])
     ON CONFLICT (pack_id, course_id) DO NOTHING`,
    [packId, courseIds]
  );
  return courseIds;
}

async function listCoursesInPack({ tenantId, packId }) {
  const { rows } = await query(
    `SELECT c.id, c.title, c.slug
     FROM courses c
     JOIN course_pack_courses cpc ON cpc.course_id = c.id
     WHERE cpc.pack_id = $1 AND c.tenant_id = $2 AND c.status = 'published'
     ORDER BY c.title`,
    [packId, tenantId]
  );
  return rows;
}

module.exports = {
  createCourse,
  listCoursesAdmin,
  listCoursesPublic,
  listCoursesPublicBySlugs,
  updateCourseStatus,
  createModule,
  createLesson,
  
  updateModuleStatus,
  updateLessonStatus,
  addResource,
  addPractice,
  getCourseTreeAdmin,
  findPublishedCourseRowBySlug,
  getPublishedCourseTreeBySlug,
  getPublishedLessonBySlugs,
  updateCourse,
  updateModule,
  updateLesson,
  updateResource,
  updatePractice,
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
  deleteCourse,
  getCourseDeleteImpact,
  deleteModule,
  deleteLesson,
  listCoursePacksPublic,
  getPackBySlug,
  listCoursePacksAdmin,
  getCoursePackById,
  updateCoursePack,
  getPackCourseIds,
  setPackCourses,
  listCoursesInPack,
};
