require('dotenv').config();
const { query } = require('../src/db/query');
const studentRepo = require('../src/modules/student/student.repo');

async function main() {
  const tenants = await query("SELECT id FROM tenants WHERE slug = 'expograph' LIMIT 1");
  const tenantId = tenants.rows[0].id;
  const users = await query("SELECT id FROM users LIMIT 10");
  const userIds = users.rows.map(u => u.id);

  console.log('=== SIMULATING 100 CONCURRENT STUDENT REQUESTS ===');
  const CONCURRENCY = 100;
  const tasks = [];

  const startTime = Date.now();
  for (let i = 0; i < CONCURRENCY; i++) {
    const userId = userIds[i % userIds.length];
    tasks.push(
      studentRepo.listEnrolledCourses({ tenantId, userId })
    );
  }

  const results = await Promise.allSettled(tasks);
  const duration = Date.now() - startTime;

  let successCount = 0;
  let failCount = 0;
  let emptyCourseCount = 0;

  for (const r of results) {
    if (r.status === 'fulfilled') {
      successCount++;
      if (!r.value || r.value.length === 0) {
        emptyCourseCount++;
      }
    } else {
      failCount++;
      console.error('Failed request error:', r.reason);
    }
  }

  console.log(`\n=== STRESS TEST RESULTS FOR 100 CONCURRENT USERS ===`);
  console.log(`Total Requests: ${CONCURRENCY}`);
  console.log(`Total Time: ${duration} ms`);
  console.log(`Avg Latency per batch: ${(duration / CONCURRENCY).toFixed(2)} ms`);
  console.log(`Successful Responses: ${successCount}`);
  console.log(`Failed Responses: ${failCount}`);
  console.log(`Empty Course Responses: ${emptyCourseCount}`);

  if (failCount === 0 && emptyCourseCount === 0) {
    console.log('\nSUCCESS! ZERO ERRORS AND ZERO EMPTY COURSE RESPONSES UNDER 100 CONCURRENT USERS!');
  } else {
    console.error('\nFAILURE DETECTED!');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
