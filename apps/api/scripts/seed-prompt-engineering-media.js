require('dotenv').config();
const { query } = require('../src/db/query');

async function main() {
  const res = await query(`
    UPDATE lessons
    SET success_image_urls = '[]'::jsonb, success_image_url = NULL, updated_at = now()
    WHERE module_id IN (
      SELECT m.id FROM course_modules m
      JOIN courses c ON c.id = m.course_id
      WHERE (c.slug = 'prompt-engineering' OR c.slug = 'prompt_engineering' OR LOWER(c.title) LIKE '%prompt engineering%')
    )
  `);
  console.log(`Cleared success_image_urls for ${res.rowCount} Prompt Engineering lessons.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
