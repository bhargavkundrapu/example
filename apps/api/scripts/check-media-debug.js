require('dotenv').config();
const { query } = require('../src/db/query');
const contentRepo = require('../src/modules/content/content.repo');

async function main() {
  const tenants = await query("SELECT id FROM tenants WHERE slug = 'expograph' LIMIT 1");
  const tenantId = tenants.rows[0].id;

  console.log('=== TESTING API RETURN FOR IMAGE PROMPT FORMULA ===');
  const res1 = await contentRepo.getPublishedLessonBySlugs({
    tenantId,
    courseSlug: 'prompt-engineering',
    moduleSlug: 'image-prompting',
    lessonSlug: 'image-prompt-formula'
  });
  console.log('Lesson Title:', res1?.lesson?.title);
  console.log('Lesson Slug:', res1?.lesson?.slug);
  console.log('Module Slug:', res1?.lesson?.module_slug);
  console.log('learn_setup_steps length:', res1?.lesson?.learn_setup_steps?.length);

  console.log('\n=== TESTING API RETURN FOR HOOK + SCRIPT TEMPLATE ===');
  const res2 = await contentRepo.getPublishedLessonBySlugs({
    tenantId,
    courseSlug: 'prompt-engineering',
    moduleSlug: 'video-scripts',
    lessonSlug: 'hook-script-template'
  });
  console.log('Lesson Title:', res2?.lesson?.title);
  console.log('Lesson Slug:', res2?.lesson?.slug);
  console.log('Module Slug:', res2?.lesson?.module_slug);
  console.log('learn_setup_steps length:', res2?.lesson?.learn_setup_steps?.length);

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
