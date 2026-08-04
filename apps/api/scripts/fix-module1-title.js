const path = require("path");
const apiRoot = path.join(__dirname, "..");
process.chdir(apiRoot);
require("dotenv").config({ path: path.join(apiRoot, ".env") });
require(path.join(apiRoot, "src/config/env.js"));
const { query } = require(path.join(apiRoot, "src/db/query.js"));
const { pool } = require(path.join(apiRoot, "src/db/pool.js"));

async function fixModule1() {
  try {
    const { rows: courses } = await query(
      "SELECT id, tenant_id, title, slug FROM courses WHERE slug = 'prompt-engineering' OR slug = 'prompt_engineering' OR LOWER(title) LIKE '%prompt engineering%'"
    );

    if (!courses.length) {
      console.log("No prompt engineering course found");
      return;
    }

    const course = courses[0];

    // Get all modules by position
    const { rows: mods } = await query(
      "SELECT id, title, slug, position FROM course_modules WHERE course_id = $1 ORDER BY position ASC",
      [course.id]
    );

    console.log("Current Modules:", mods);

    // Module 1 is position 1
    const mod1 = mods.find(m => m.position === 1);
    const mod2 = mods.find(m => m.position === 2);

    if (mod1) {
      // Update Module 1 to Foundations
      await query(
        "UPDATE course_modules SET title = 'Foundations', slug = 'foundations', updated_at = now() WHERE id = $1",
        [mod1.id]
      );
      console.log(`✓ Fixed Module 1 (ID: ${mod1.id}) title to 'Foundations' and slug to 'foundations'`);
    }

    if (mod2) {
      // Update Module 2 to Output Control
      await query(
        "UPDATE course_modules SET title = 'Output Control', slug = 'output-control', updated_at = now() WHERE id = $1",
        [mod2.id]
      );
      console.log(`✓ Fixed Module 2 (ID: ${mod2.id}) title to 'Output Control' and slug to 'output-control'`);
    }

    // Verify after fix
    const { rows: updatedMods } = await query(
      "SELECT id, title, slug, position FROM course_modules WHERE course_id = $1 ORDER BY position ASC",
      [course.id]
    );
    console.log("\nUpdated Modules in DB:", updatedMods);

  } catch (err) {
    console.error("Error fixing module titles:", err);
  } finally {
    if (pool) pool.end();
  }
}

fixModule1();
