require('dotenv').config();
const { query } = require('../src/db/query');

async function main() {
  const packRes = await query("SELECT id, title FROM course_packs WHERE slug = 'all-pack' LIMIT 1");
  const pack = packRes.rows[0];
  console.log('All Pack:', pack);

  const affectedUsers = await query(`
    SELECT u.id, u.email, u.full_name
    FROM users u
    LEFT JOIN enrollments e ON e.user_id = u.id AND e.item_type = 'pack' AND e.item_id = $1
    WHERE e.id IS NULL
  `, [pack.id]);

  console.log(`Found ${affectedUsers.rows.length} total users in system missing 'All Pack' enrollment.`);

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
