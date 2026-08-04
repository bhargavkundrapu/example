const path = require("path");
const apiRoot = path.join(__dirname, "..");
process.chdir(apiRoot);
require("dotenv").config({ path: path.join(apiRoot, ".env") });
require(path.join(apiRoot, "src/config/env.js"));
const { query } = require(path.join(apiRoot, "src/db/query.js"));
const { pool } = require(path.join(apiRoot, "src/db/pool.js"));

async function inspectModules() {
  try {
    const { rows: courses } = await query(
      "SELECT id, tenant_id, title, slug FROM courses WHERE slug = 'prompt-engineering' OR slug = 'prompt_engineering' OR LOWER(title) LIKE '%prompt engineering%'"
    );
    console.log("Found courses:", courses);

    for (const c of courses) {
      console.log(`\n--- Course: ${c.title} (slug: ${c.slug}, id: ${c.id}) ---`);
      const { rows: mods } = await query(
        "SELECT id, title, slug, position FROM course_modules WHERE course_id = $1 ORDER BY position ASC",
        [c.id]
      );
      console.log("Modules:", mods);
    }
  } catch (err) {
    console.error("Error inspecting modules:", err);
  } finally {
    if (pool) pool.end();
  }
}

inspectModules();
