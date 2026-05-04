/**
 * Restores the **Prompt to Profit** LMS course (`slug: prompt-to-profit`) for the ExpoGraph tenant
 * after it was removed from Super Admin (DB delete).
 *
 * Recreates (aligned with `apps/web/src/data/courseExploreData.js`):
 * - Published course with academy description
 * - 19 published modules (same titles as marketing curriculum)
 * - 108 published lessons: 6 lessons in each of the first 13 modules, 5 in the last 6 (108 total)
 * - `price_in_paise` copied from **Prompt Engineering** when present, else ₹99 (9900 paise)
 * - `sort_order` 30 (same ordering convention as the web app)
 * - Re-attaches the course to **All Pack** when `all-pack` exists for the tenant
 *
 * **Limitations:** Videos, captions, smart prompts, MCQs, slides, resources, and exact original
 * lesson titles cannot be recovered without a Postgres/Neon backup. Re-link those in Super Admin.
 *
 * Usage: `cd apps/api && node scripts/restore-prompt-to-profit-course.js`
 *
 * Env: `DATABASE_URL`, optional `DEFAULT_TENANT_SLUG` (default `expograph`).
 */

const path = require("path");

const apiRoot = path.join(__dirname, "..");
process.chdir(apiRoot);
require("dotenv").config({ path: path.join(apiRoot, ".env") });
require(path.join(apiRoot, "src/config/env.js"));

const { query } = require(path.join(apiRoot, "src/db/query.js"));
const contentRepo = require(path.join(apiRoot, "src/modules/content/content.repo.js"));
const { pool } = require(path.join(apiRoot, "src/db/pool.js"));

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** 19 modules — must match `COURSE_EXPLORE_DATA["prompt-to-profit"].curriculum` in the web app. */
const MODULE_TITLES = [
  "Master ChatGPT",
  "Prompt Skills for Business",
  "General Business Toolkit",
  "Offer + Niche + Funnel Strategy",
  "Funnel Copy Pages",
  "Email Marketing System",
  "Website & E-commerce",
  "SEO Content Engine",
  "Affiliate Marketing",
  "Facebook Marketing",
  "YouTube Marketing",
  "LinkedIn Growth + Automation",
  "Twitter Growth",
  "Social Media Creative Studio",
  "Copywriting Assistant",
  "Customer Service + Retention",
  "SMS Marketing",
  "Podcast Marketing",
  "Instagram Complete Starter Pack",
];

const COURSE_DESCRIPTION =
  "Turn ChatGPT into your writing and marketing partner. Learn to create emails, ads, funnels, and content that sound human and get results. Real-world prompts and strategies you can use the same day.";

async function main() {
  const tenantSlug = String(process.env.DEFAULT_TENANT_SLUG || "expograph").trim();
  const { rows: tenants } = await query(`SELECT id FROM tenants WHERE slug = $1 LIMIT 1`, [tenantSlug]);
  if (!tenants[0]) {
    throw new Error(`Tenant not found for slug "${tenantSlug}". Set DEFAULT_TENANT_SLUG if needed.`);
  }
  const tenantId = tenants[0].id;

  const { rows: existing } = await query(
    `SELECT id, title FROM courses WHERE tenant_id = $1 AND (slug = $2 OR REPLACE(slug, '_', '-') = $2) LIMIT 1`,
    [tenantId, "prompt-to-profit"]
  );
  if (existing[0]) {
    console.log(`Already exists: "${existing[0].title}" (${existing[0].id}). Nothing to do.`);
    return;
  }

  const { rows: priceRow } = await query(
    `SELECT price_in_paise FROM courses
     WHERE tenant_id = $1 AND status = 'published'
       AND (
         LOWER(REPLACE(slug, '_', '-')) = 'prompt-engineering'
         OR LOWER(REPLACE(slug, '_', '-')) LIKE '%prompt-engineering%'
       )
     ORDER BY created_at ASC
     LIMIT 1`,
    [tenantId]
  );
  let price = priceRow[0]?.price_in_paise;
  if (price == null || Number(price) < 100) price = 9900;

  let courseId = null;
  try {
    const course = await contentRepo.createCourse({
      tenantId,
      title: "Prompt to Profit",
      slug: "prompt-to-profit",
      description: COURSE_DESCRIPTION,
      level: "beginner",
      status: "published",
      createdBy: null,
    });
    courseId = course.id;

    await contentRepo.updateCourse({
      tenantId,
      courseId,
      patch: { price_in_paise: Number(price), sort_order: 30 },
      updatedBy: null,
    });

    for (let mi = 0; mi < MODULE_TITLES.length; mi++) {
      const title = MODULE_TITLES[mi];
      const modSlug = `${slugify(title)}-${mi}`.slice(0, 60);
      const mod = await contentRepo.createModule({
        tenantId,
        courseId,
        title,
        slug: modSlug,
        position: mi,
        status: "published",
        createdBy: null,
      });
      const nLessons = mi < 13 ? 6 : 5;
      for (let li = 0; li < nLessons; li++) {
        const lessonTitle = `${title} — Part ${li + 1}`;
        await contentRepo.createLesson({
          tenantId,
          moduleId: mod.id,
          title: lessonTitle,
          slug: `part-${li + 1}`,
          summary: null,
          position: li,
          goal: null,
          video_url: null,
          prompts: null,
          success_image_url: null,
          success_image_urls: null,
          learn_setup_steps: null,
          pdf_url: null,
          video_captions: null,
          status: "published",
          createdBy: null,
        });
      }
    }

    const { rows: pack } = await query(
      `SELECT p.id FROM course_packs p
       JOIN tenants t ON t.id = p.tenant_id
       WHERE t.slug = $1 AND p.slug = 'all-pack' LIMIT 1`,
      [tenantSlug]
    );
    if (pack[0]) {
      await query(
        `INSERT INTO course_pack_courses (pack_id, course_id) VALUES ($1, $2)
         ON CONFLICT (pack_id, course_id) DO NOTHING`,
        [pack[0].id, courseId]
      );
    }

    console.log("Done. Restored Prompt to Profit.");
    console.log("  course_id:", courseId);
    console.log("  modules:", MODULE_TITLES.length, "| lessons: 108");
    console.log("Re-attach videos/prompts in Super Admin if you do not have a DB backup.");
  } catch (err) {
    if (courseId) {
      await contentRepo.deleteCourse({ tenantId, courseId }).catch(() => {});
    }
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end().catch(() => {}));
