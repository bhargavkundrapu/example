require('dotenv').config();
const { query } = require('../src/db/query');
const studentRepo = require('../src/modules/student/student.repo');

async function main() {
  const tenants = await query("SELECT id FROM tenants WHERE slug = 'expograph' LIMIT 1");
  const tenantId = tenants.rows[0].id;
  const users = await query("SELECT id, email FROM users LIMIT 1");
  const userId = users.rows[0].id;

  console.time('listEnrolledCourses execution time');
  const courses = await studentRepo.listEnrolledCourses({ tenantId, userId });
  console.timeEnd('listEnrolledCourses execution time');

  console.log(`Fetched ${courses.length} courses:`);
  for (const c of courses) {
    console.log(` - ${c.title} (slug: ${c.slug}) | Enrolled: ${c.enrolled} | Lessons: ${c.total_lessons}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
