const path = require("path");
const apiRoot = path.join(__dirname, "..");
process.chdir(apiRoot);
require("dotenv").config({ path: path.join(apiRoot, ".env") });
require(path.join(apiRoot, "src/config/env.js"));

const { query } = require(path.join(apiRoot, "src/db/query.js"));
const { pool } = require(path.join(apiRoot, "src/db/pool.js"));

const PROMPT_ENGINEERING_BLUEPRINT = [
  {
    title: "Foundations",
    slug: "foundations",
    lessons: [
      { title: "Prompt Anatomy & GCCF", slug: "prompt-anatomy-gccf", summary: "Structure any prompt using Goal-Context-Constraints-Format" },
      { title: "Ambiguity Killers", slug: "ambiguity-killers", summary: "Remove vagueness-get precise outputs every time" },
      { title: "Clarifying Questions System", slug: "clarifying-questions-system", summary: "Make AI ask YOU questions before answering" },
      { title: "Few-Shot Examples", slug: "few-shot-examples", summary: "Teach AI the pattern by showing 2-3 examples" },
      { title: "Persona Basics", slug: "persona-basics", summary: "Make AI act as an expert, mentor, interviewer, or friend" }
    ]
  },
  {
    title: "Output Control",
    slug: "output-control",
    lessons: [
      { title: "Format Control-Tables", slug: "format-control-tables", summary: "Get clean, structured tables from any data" },
      { title: "Format Control-JSON", slug: "format-control-json", summary: "Get machine-readable JSON output for projects" },
      { title: "Length Control", slug: "length-control", summary: "Control output length-1 line, 1 paragraph, or 1 page" },
      { title: "Strict Mode-No Extra Text", slug: "strict-mode-no-extra-text", summary: "Make AI output ONLY what you asked-nothing more" },
      { title: "Multi-Version Output", slug: "multi-version-output", summary: "Get 3 different versions of the same content in one prompt" }
    ]
  },
  {
    title: "Debugging & Refinement",
    slug: "debugging-refinement",
    lessons: [
      { title: "Common Failure Types", slug: "common-failure-types", summary: "Identify the 5 most common prompt failures instantly" },
      { title: "3R Loop Workflow", slug: "3r-loop-workflow", summary: "Master the Request -> Review -> Refine cycle" },
      { title: "Self-Critique Prompts", slug: "self-critique-prompts", summary: "Make AI evaluate and fix its own output" },
      { title: "Evaluation Metrics & A/B Testing", slug: "evaluation-metrics-ab-testing", summary: "Score prompts on Fluency, Relevance, Coherence & conduct A/B tests" },
      { title: "Reusable Prompt Templates", slug: "reusable-prompt-templates", summary: "Build templates you use again and again" }
    ]
  },
  {
    title: "Truthfulness & Reliability",
    slug: "truthfulness-reliability",
    lessons: [
      { title: "Don't Guess Mode", slug: "dont-guess-mode", summary: "Force AI to say I don't know instead of guessing" },
      { title: "Verification Prompts", slug: "verification-prompts", summary: "Make AI cite sources and check its own facts" },
      { title: "Answer From Given Text Only", slug: "answer-from-given-text-only", summary: "Restrict AI to only use information you provide" },
      { title: "Prompt Injection & Security Defense", slug: "prompt-injection-security-defense", summary: "Protect system prompts with boundary delimiters & prevent jailbreaks" },
      { title: "Anti-Hallucination Checklist", slug: "anti-hallucination-checklist", summary: "A 5-step checklist to catch false information" }
    ]
  },
  {
    title: "Image Prompting",
    slug: "image-prompting",
    lessons: [
      { title: "Image Prompt Formula", slug: "image-prompt-formula", summary: "Master the Subject + Style + Details + Mood formula" },
      { title: "Composition Control", slug: "composition-control", summary: "Control layout, camera angle, and framing" },
      { title: "Style & Lighting Control", slug: "style-lighting-control", summary: "Set art style, color palette, and lighting" },
      { title: "Character Consistency", slug: "character-consistency", summary: "Keep the same character across multiple images" },
      { title: "Iterate & Fix Bad Images", slug: "iterate-fix-bad-images", summary: "Debug and improve image prompts step by step" }
    ]
  },
  {
    title: "Video Scripts",
    slug: "video-scripts",
    lessons: [
      { title: "Hook + Script Template", slug: "hook-script-template", summary: "Write attention-grabbing video scripts" },
      { title: "Script to Storyboard", slug: "script-to-storyboard", summary: "Convert a script into a visual shot-by-shot plan" },
      { title: "Shot List & B-Roll", slug: "shot-list-b-roll", summary: "Plan every shot + supporting footage" },
      { title: "Captions & On-Screen Text", slug: "captions-on-screen-text", summary: "Generate captions and text overlays for engagement" },
      { title: "30/45/60-Sec Templates", slug: "30-45-60-sec-templates", summary: "Ready-made templates for short-form video" }
    ]
  },
  {
    title: "Coding With AI",
    slug: "coding-with-ai",
    lessons: [
      { title: "Spec Prompts", slug: "spec-prompts", summary: "Turn a vague idea into a clear coding specification" },
      { title: "Debug Prompts", slug: "debug-prompts", summary: "Find and fix bugs using AI systematically" },
      { title: "Refactor Prompts", slug: "refactor-prompts", summary: "Clean up messy code with structured prompts" },
      { title: "LLM APIs, Automation & Prompt Chaining", slug: "llm-apis-prompt-chaining", summary: "Chain multi-step prompts for APIs and automated application pipelines" },
      { title: "System Design Prompts", slug: "system-design-prompts", summary: "Use AI to plan architecture and system design" }
    ]
  },
  {
    title: "Extraction, Notes & Research",
    slug: "extraction-notes-research",
    lessons: [
      { title: "Extract to Table", slug: "extract-to-table", summary: "Pull structured data from messy paragraphs" },
      { title: "Extract to JSON", slug: "extract-to-json", summary: "Convert any text into clean JSON format" },
      { title: "Summarize at 3 Levels", slug: "summarize-at-3-levels", summary: "Get 1-line, 1-paragraph, and detailed summaries" },
      { title: "Notes to Flashcards & Quiz", slug: "notes-to-flashcards-quiz", summary: "Turn study notes into revision-ready flashcards" },
      { title: "Compare 2 Documents", slug: "compare-2-documents", summary: "Find differences and similarities between texts" }
    ]
  },
  {
    title: "Reasoning, Math, QA & Interviews",
    slug: "reasoning-math-qa-interviews",
    lessons: [
      { title: "Step-wise Reasoning", slug: "step-wise-reasoning", summary: "Force AI to show its work and think logically" },
      { title: "Final Only vs Show Steps", slug: "final-only-vs-show-steps", summary: "Control when AI shows reasoning vs just the answer" },
      { title: "Practice Question Generator", slug: "practice-question-generator", summary: "Generate unlimited practice questions on any topic" },
      { title: "Interview Simulator", slug: "interview-simulator", summary: "Simulate real interview rounds with AI" },
      { title: "Answer Evaluator & Rubric", slug: "answer-evaluator-rubric", summary: "Make AI grade your answers like a real interviewer" }
    ]
  },
  {
    title: "Placement Toolkit",
    slug: "placement-toolkit",
    lessons: [
      { title: "ATS Resume Rewrite", slug: "ats-resume-rewrite", summary: "Rewrite your resume to pass ATS filters" },
      { title: "LinkedIn Profile Upgrade", slug: "linkedin-profile-upgrade", summary: "Optimize headline, about, and experience sections" },
      { title: "HR Interview Master", slug: "hr-interview-master", summary: "Prepare STAR-format answers for HR questions" },
      { title: "Technical Interview Practice", slug: "technical-interview-practice", summary: "Generate coding + theory questions by role" },
      { title: "Portfolio Project Storytelling", slug: "portfolio-project-storytelling", summary: "Write project descriptions that impress recruiters" }
    ]
  }
];

async function syncPromptEngineering() {
  try {
    console.log("Starting Prompt Engineering DB sync...");
    const { rows: courses } = await query(
      "SELECT id, tenant_id, title, slug FROM courses WHERE slug = 'prompt-engineering' OR slug = 'prompt_engineering' OR LOWER(title) LIKE '%prompt engineering%' LIMIT 1"
    );

    if (!courses.length) {
      console.log("Prompt Engineering course not found in database. Exiting.");
      process.exit(0);
    }

    const course = courses[0];
    console.log(`Found Course: ${course.title} (ID: ${course.id}, Tenant: ${course.tenant_id})`);

    // Fetch existing modules
    const { rows: existingModules } = await query(
      "SELECT id, title, slug, position FROM course_modules WHERE tenant_id = $1 AND course_id = $2 ORDER BY position ASC",
      [course.tenant_id, course.id]
    );

    console.log(`Existing modules count: ${existingModules.length}`);

    for (let mIdx = 0; mIdx < PROMPT_ENGINEERING_BLUEPRINT.length; mIdx++) {
      const modBp = PROMPT_ENGINEERING_BLUEPRINT[mIdx];
      let modId = null;

      // Match module by slug first, then by position
      const matchedMod = existingModules.find(m => m.slug === modBp.slug) || existingModules[mIdx];

      if (matchedMod) {
        modId = matchedMod.id;
        await query(
          "UPDATE course_modules SET title = $1, slug = $2, position = $3, status = 'published', updated_at = now() WHERE id = $4",
          [modBp.title, modBp.slug, mIdx + 1, modId]
        );
        console.log(`Updated Module ${mIdx + 1}: ${modBp.title}`);
      } else {
        const { rows: newMod } = await query(
          `INSERT INTO course_modules (tenant_id, course_id, title, slug, position, status)
           VALUES ($1, $2, $3, $4, $5, 'published')
           ON CONFLICT (tenant_id, course_id, slug) DO UPDATE
           SET title = EXCLUDED.title, position = EXCLUDED.position, status = 'published', updated_at = now()
           RETURNING id`,
          [course.tenant_id, course.id, modBp.title, modBp.slug, mIdx + 1]
        );
        modId = newMod[0].id;
        console.log(`Created Module ${mIdx + 1}: ${modBp.title}`);
      }

      // Fetch existing lessons for this module
      const { rows: existingLessons } = await query(
        "SELECT id, title, slug, position FROM lessons WHERE tenant_id = $1 AND module_id = $2 ORDER BY position ASC",
        [course.tenant_id, modId]
      );

      for (let lIdx = 0; lIdx < modBp.lessons.length; lIdx++) {
        const lesBp = modBp.lessons[lIdx];
        
        // Find by slug first, then by position
        const matchedLes = existingLessons.find(l => l.slug === lesBp.slug) || existingLessons[lIdx];

        if (matchedLes) {
          await query(
            "UPDATE lessons SET title = $1, slug = $2, summary = $3, position = $4, status = 'published', updated_at = now() WHERE id = $5",
            [lesBp.title, lesBp.slug, lesBp.summary, lIdx + 1, matchedLes.id]
          );
          console.log(`  Updated Lesson ${lIdx + 1}: ${lesBp.title}`);
        } else {
          await query(
            `INSERT INTO lessons (tenant_id, module_id, title, slug, summary, position, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'published')
             ON CONFLICT (tenant_id, module_id, slug) DO UPDATE
             SET title = EXCLUDED.title, summary = EXCLUDED.summary, position = EXCLUDED.position, status = 'published', updated_at = now()`,
            [course.tenant_id, modId, lesBp.title, lesBp.slug, lesBp.summary, lIdx + 1]
          );
          console.log(`  Created/Upserted Lesson ${lIdx + 1}: ${lesBp.title}`);
        }
      }
    }

    console.log("\n✓ Successfully synchronized all Prompt Engineering modules and lessons in database!");
  } catch (err) {
    console.error("Error syncing Prompt Engineering DB:", err);
  } finally {
    if (pool) pool.end();
  }
}

syncPromptEngineering();
