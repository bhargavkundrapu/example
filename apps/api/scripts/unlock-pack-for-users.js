require('dotenv').config();
const { query, withTransaction } = require('../src/db/query');

async function unlockPackForUsers() {
  console.log('=== Starting Bulk Unlock of Pack Courses ===\n');

  // Step 1: Find the All Pack for expograph tenant
  const packRes = await query(`
    SELECT p.id as pack_id, p.tenant_id, p.title
    FROM course_packs p
    JOIN tenants t ON t.id = p.tenant_id
    WHERE p.slug = 'all-pack'
    LIMIT 1
  `);

  if (!packRes.rows[0]) {
    console.error('Error: "all-pack" course pack not found in database.');
    process.exit(1);
  }

  const { pack_id, tenant_id, title } = packRes.rows[0];
  console.log(`Found Target Pack: "${title}" (ID: ${pack_id}) for Tenant ID: ${tenant_id}`);

  // Step 2: Find all users currently missing enrollment for this pack
  const usersRes = await query(`
    SELECT u.id, u.email, u.full_name
    FROM users u
    LEFT JOIN enrollments e ON e.user_id = u.id AND e.item_type = 'pack' AND e.item_id = $1 AND e.active = true
    WHERE e.id IS NULL
  `, [pack_id]);

  const usersToEnroll = usersRes.rows;
  console.log(`Found ${usersToEnroll.length} users missing "${title}" enrollment.\n`);

  if (usersToEnroll.length === 0) {
    console.log('All users already have active pack enrollments!');
    process.exit(0);
  }

  // Step 3: Perform bulk enrollment & approval update in transaction
  await withTransaction(async (client) => {
    let enrolledCount = 0;
    for (const u of usersToEnroll) {
      // Upsert enrollment record
      await client.query(`
        INSERT INTO enrollments (user_id, tenant_id, item_type, item_id, active)
        VALUES ($1, $2, 'pack', $3, true)
        ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET active = true
      `, [u.id, tenant_id, pack_id]);

      // Also update any approvals for this user to type 'pack' and item_id pack_id
      await client.query(`
        UPDATE approvals
        SET item_type = 'pack', item_id = $2, updated_at = now()
        WHERE user_id = $1 AND status = 'approved'
      `, [u.id, pack_id]);

      enrolledCount++;
    }

    console.log(`Successfully enrolled ${enrolledCount} users into "${title}".`);
  });

  console.log('\n=== Pack Unlock Completed Successfully! ===');
  process.exit(0);
}

unlockPackForUsers().catch((err) => {
  console.error('Fatal Error during pack unlock:', err);
  process.exit(1);
});
