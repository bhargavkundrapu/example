/**
 * Rebuild Prompt-to-Profit lesson content (CBM sections) using the existing course skeleton.
 *
 * - Keeps module names and module order unchanged.
 * - Preserves existing lesson order in each module.
 * - Fills each lesson with structured CBM sections (00..16), summary, goal, and prompts.
 * - Uses lesson titles from the source prompt by module position when available.
 *
 * Usage:
 *   cd apps/api
 *   node scripts/rebuild-prompt-to-profit-content.js
 *
 * Optional env:
 *   DEFAULT_TENANT_SLUG=expograph
 */

const path = require("path");

const apiRoot = path.join(__dirname, "..");
process.chdir(apiRoot);
require("dotenv").config({ path: path.join(apiRoot, ".env") });
require(path.join(apiRoot, "src/config/env.js"));

const { query } = require(path.join(apiRoot, "src/db/query.js"));
const contentRepo = require(path.join(apiRoot, "src/modules/content/content.repo.js"));
const { pool } = require(path.join(apiRoot, "src/db/pool.js"));

const MODULE_BLUEPRINT = [
  { title: "Master ChatGPT", lessons: [
    "How to Master ChatGPT",
    "Crack How ChatGPT Works",
    "13 Types of Prompts",
    "Fill in the Blank vs Open Ended",
    "Build Your Prompt Playbook System",
  ]},
  { title: "Prompt Skills for Business", lessons: [
    "GCCF for Business Prompts",
    "Output Control Tables",
    "Output Control JSON",
    "Brand Tone and Voice Control",
    "3R Refinement Workflow",
  ]},
  { title: "General Business Toolkit", lessons: [
    "Research Competitors",
    "Create a Business Plan",
    "Write Client Proposals",
    "Company Vision Statement",
    "Generate Business Ideas",
    "Prepare to Pitch Investors",
    "Hiring and Leadership",
    "Write a Meeting Summary",
  ]},
  { title: "Offer + Niche + Funnel Strategy", lessons: [
    "Pick a Niche",
    "Generate Product Ideas",
    "Generate Online Funnel Ideas",
    "Funnel Map Lead Magnet to Upsell",
    "Messaging Pain to Benefit to Proof",
  ]},
  { title: "Funnel Copy Pages", lessons: [
    "Write a Landing Page Opt-In Webinar",
    "Write a Sales Page",
    "Write an Order Bump Copy",
    "Write an Upsell Page",
    "Write a Thank You Page",
  ]},
  { title: "Email Marketing System", lessons: [
    "Generate Email Subject Lines",
    "Craft a Sales Email",
    "Write an Onboarding Email",
    "Write a Customer Welcome Email",
    "Write a Cart Abandonment Email",
    "Generate a Newsletter",
    "Write a Cold Email",
  ]},
  { title: "Website & E-commerce", lessons: [
    "Generate Product Descriptions",
    "Write an Advertorial",
    "Optimize Site for SEO",
    "Create Customer Testimonials",
    "Translate Website Copy",
    "Design CTAs",
  ]},
  { title: "SEO Content Engine", lessons: [
    "Generate Keyword List",
    "Write Compelling Blog Posts",
    "Do On-Page SEO Optimization",
    "Create a Content Calendar",
    "Update Old Content for Growth",
  ]},
  { title: "Affiliate Marketing", lessons: [
    "Write Affiliate Product Reviews",
    "Create Comparison Tables",
    "Generate Product Recommendations",
    "Write Affiliate Product Descriptions",
    "Write Affiliate Product Emails",
  ]},
  { title: "Facebook Marketing", lessons: [
    "Create Facebook Ad Copy",
    "Write Headlines for Facebook Ads",
    "Generate Ideas for Creatives",
    "Write Facebook Ad Video Scripts",
    "Create Attention Grabbing Images",
    "A/B Testing Copy for Conversion",
    "Research Pain Points and Desires",
    "Brainstorm New Angles for Creatives",
  ]},
  { title: "YouTube Marketing", lessons: [
    "Write YouTube Video Script",
    "Write YouTube Video Title",
    "Write SEO YouTube Description",
    "Write YouTube Ad Script",
    "Thumbnail Ideas",
  ]},
  { title: "LinkedIn Growth + Automation", lessons: [
    "Optimize LinkedIn Profile",
    "LinkedIn Content Strategy",
    "Generate LinkedIn Post Ideas",
    "Leverage LinkedIn Groups",
    "Create LinkedIn Ads",
    "Generate LinkedIn Hashtags",
    "LinkedIn Automation",
  ]},
  { title: "Twitter Growth", lessons: [
    "Optimize Twitter Profile",
    "Write Tweets and Threads",
    "Leverage Twitter Trends",
    "Create Twitter Ads",
    "Make Tweets Go Viral",
    "Optimize Twitter Growth",
  ]},
  { title: "Social Media Creative Studio", lessons: [
    "Webinar Workshop Topic Brainstorm",
    "Attention Grabbing Social Headlines",
    "Custom Graphics for Social Ads",
    "Mood Boards for Instagram Pinterest",
    "Instagram Hashtag Research",
  ]},
  { title: "Copywriting Assistant", lessons: [
    "Improve Existing Copy",
    "Find Unique Brand Voice",
    "Advanced Copywriting Prompts",
    "Proofread Your Copy",
    "Rewrite in 3 Styles System",
  ]},
  { title: "Customer Service + Retention", lessons: [
    "Create FAQs",
    "Manage Client Communication",
    "Respond to Comments and Haters",
    "Increase Customer Retention",
    "Survey Your Customers",
  ]},
  { title: "SMS Marketing", lessons: [
    "SMS Promotions and Sales",
    "SMS Opt-In Lead Generation",
    "SMS Reminders and Followups",
    "SMS Tone Timing and Compliance Basics",
  ]},
  { title: "Podcast Marketing", lessons: [
    "Podcast Interview Questions",
    "Write a Podcast Script",
    "Podcast Guest Outreach",
    "Repurpose Podcast into Short Content",
  ]},
  { title: "Instagram Complete Starter Pack", lessons: [
    "Start Instagram Journey",
    "Research Instagram Audience",
    "Generate Instagram Content Ideas",
    "Write Instagram Ad Scripts",
    "Instagram Algorithm Basics (Verify)",
    "Reels Hooks and Structure",
    "Captions and CTA Templates",
    "Hashtags and Comments Strategy",
  ]},
];

function compact(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function makePromptCard({ moduleTitle, lessonTitle }) {
  return [
    "Goal: [What result do you want?]",
    `Context: I am working on "${lessonTitle}" in "${moduleTitle}".`,
    "Constraints: Keep it simple, practical, and realistic. Verify if data is uncertain.",
    "Format: Use short sections + bullets + one final action plan.",
    "Task: Create draft 1, then self-review, then improve.",
    "Examples: Add one mini example with realistic numbers.",
    "Desired depth: Beginner-friendly, but usable for real business work.",
  ].join("\n");
}

function buildSections({ moduleIndex, lessonIndex, moduleTitle, lessonTitle }) {
  const code = `M${moduleIndex + 1}-L${lessonIndex + 1}`;
  const useCases = [
    "freelancer offer",
    "small business campaign",
    "creator content plan",
    "student portfolio project",
  ];
  const useCase = useCases[(moduleIndex + lessonIndex) % useCases.length];
  const promptCard = makePromptCard({ moduleTitle, lessonTitle });

  const badPrompt = `Write something good for my business about ${lessonTitle}.`;
  const goodPrompt = [
    `You are a practical business assistant.`,
    `Goal: Help me with "${lessonTitle}" for a ${useCase}.`,
    `Context: Module "${moduleTitle}". Target audience = beginners.`,
    `Constraints: Keep language simple. No hype. If uncertain, write "Verify".`,
    `Format:`,
    `1) Quick strategy`,
    `2) Copy-ready draft`,
    `3) 3 improvement suggestions`,
    `Task: Give a version I can use today.`,
  ].join("\n");

  const proPrompt = [
    `Act as Senior Marketing Strategist + Copy Coach.`,
    `Use GCCF + 3R Loop.`,
    `Goal: Produce high-conversion draft for "${lessonTitle}".`,
    `Context: ${useCase}; channel = digital; budget = limited.`,
    `Constraints: Keep claims realistic, include verification notes where needed.`,
    `Format: table with columns: Step | Draft | Why it works | Risk check.`,
    `Then refine twice and show final version.`,
  ].join("\n");

  return [
    {
      type: "CBM-00_LESSON_ID",
      data: { code, title: lessonTitle, time: "18-25 min", difficulty: "Beginner" },
    },
    {
      type: "CBM-01_OUTCOME_GOAL",
      data: {
        headline: `You will create a practical "${lessonTitle}" output you can use today.`,
        real_world: "You can copy, edit, and publish this in real work.",
      },
    },
    {
      type: "CBM-02_WHERE_YOU_USE_IT",
      data: {
        scenario: `Use this in a real ${useCase} flow to save time and improve quality.`,
        tags: ["Business", "Marketing", "Execution"],
      },
    },
    {
      type: "CBM-03_INPUTS_YOU_NEED",
      data: {
        items: [
          "Audience type",
          "Offer or objective",
          "Brand tone (friendly, expert, bold)",
          "Key constraints (budget/time/channel)",
          "Success metric (clicks, replies, sales, leads)",
        ],
      },
    },
    { type: "CBM-04_BAD_PROMPT", data: { prompt: badPrompt } },
    {
      type: "CBM-05_BAD_OUTPUT_EXAMPLE",
      data: {
        output: "Sure! Your business is amazing. We provide best quality and great service for everyone. Contact us now!",
      },
    },
    {
      type: "CBM-06_WHY_IT_FAILED",
      data: {
        reasons: [
          "No clear goal or audience.",
          "No format guidance, so output is generic.",
          "No constraints, so quality is inconsistent.",
        ],
      },
    },
    { type: "CBM-07_GOOD_PROMPT", data: { prompt: goodPrompt, framework_used: "GCCF + 3R" } },
    {
      type: "CBM-08_GOOD_OUTPUT_EXAMPLE",
      data: {
        output: [
          "Quick strategy:",
          "- Focus on one audience pain point.",
          "- Use one clear promise and one CTA.",
          "",
          "Draft:",
          `"Struggling with slow content creation? Use this ${lessonTitle.toLowerCase()} workflow to publish faster and stay consistent."`,
          "",
          "Improve:",
          "1) Add social proof",
          "2) Add urgency line",
          "3) Shorten CTA",
        ].join("\n"),
      },
    },
    {
      type: "CBM-09_UPGRADE_PROMPT_PRO",
      data: {
        prompt: proPrompt,
        what_changed: "Added role clarity, constraints, table format, and a refine loop.",
      },
    },
    {
      type: "CBM-10_3_VARIATIONS",
      data: {
        variants: [
          { title: "Variation A - Fast Draft", prompt: `Create a quick first draft for "${lessonTitle}" in 120 words.` },
          { title: "Variation B - Data Aware", prompt: `Create "${lessonTitle}" draft and include a short 'Verify' note for risky claims.` },
          { title: "Variation C - Multi Channel", prompt: `Create versions for email, social, and landing page using the same core message.` },
        ],
      },
    },
    {
      type: "CBM-11_PROMPT_CARD_FINAL",
      data: {
        template: promptCard,
        notes: "Reuse this card for similar tasks. Change only variables.",
      },
    },
    {
      type: "CBM-12_GUIDED_PRACTICE",
      data: {
        steps: [
          "Fill your goal in one line.",
          "Add audience + constraints.",
          "Run draft 1 and review gaps.",
          "Refine once for clarity and once for conversion.",
        ],
        task: `Build one final ${lessonTitle} output for your project.`,
      },
    },
    {
      type: "CBM-13_CHALLENGE_TASK",
      data: {
        description: `Create a production-ready ${lessonTitle} output without looking at previous examples.`,
        hint: "Use GCCF fields first, then run Request -> Review -> Refine.",
      },
    },
    {
      type: "CBM-14_CHECKLIST",
      data: {
        items: [
          "Goal is clear in one sentence.",
          "Audience and constraints are included.",
          "Output is structured and easy to use.",
          "One risk note is marked with Verify.",
          "Final copy has one clear CTA.",
        ],
      },
    },
    {
      type: "CBM-15_WHAT_YOU_LEARNED",
      data: {
        points: [
          `How to structure "${lessonTitle}" prompts with GCCF.`,
          "How to improve weak AI output using 3R.",
          "How to produce reusable templates for real business use.",
        ],
      },
    },
    {
      type: "CBM-16_ONE_LINE_TAKEAWAY",
      data: {
        line: `Clear context + constraints turn average prompts into business-ready outputs.`,
      },
    },
  ];
}

function makeSummary(moduleTitle, lessonTitle) {
  return [
    `This lesson helps you apply "${lessonTitle}" in a real business workflow.`,
    "",
    "> ✅ Quick Win: Create one usable draft in under 20 minutes.",
    "",
    "> ⚠️ Common Mistake: Asking ChatGPT for output without clear constraints.",
    "",
    `You will follow GCCF and a simple Request -> Review -> Refine loop inside "${moduleTitle}".`,
  ].join("\n");
}

function makeGoal(lessonTitle) {
  return compact(`Create a practical ${lessonTitle} output that is clear, usable, and ready to publish with small edits.`);
}

function normalizeTitle(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function main() {
  const tenantSlug = String(process.env.DEFAULT_TENANT_SLUG || "expograph").trim();
  const { rows: tenantRows } = await query(`SELECT id FROM tenants WHERE slug = $1 LIMIT 1`, [tenantSlug]);
  if (!tenantRows[0]) throw new Error(`Tenant not found for slug "${tenantSlug}"`);
  const tenantId = tenantRows[0].id;

  const course = await contentRepo.findPublishedCourseRowBySlug({
    tenantId,
    courseSlug: "prompt-to-profit",
  });
  if (!course?.id) {
    throw new Error(`Published course "prompt-to-profit" not found in tenant "${tenantSlug}"`);
  }

  const tree = await contentRepo.getPublishedCourseTreeBySlug({ tenantId, courseSlug: course.slug });
  const modules = tree?.course?.modules || [];
  if (modules.length === 0) throw new Error("No modules found in Prompt-to-Profit course.");

  let updated = 0;
  let renamed = 0;

  for (let mi = 0; mi < modules.length; mi++) {
    const module = modules[mi];
    const lessons = Array.isArray(module.lessons) ? module.lessons : [];
    const blueprint = MODULE_BLUEPRINT[mi];
    if (!blueprint) continue;

    const dbTitleNorm = normalizeTitle(module.title);
    const bpTitleNorm = normalizeTitle(blueprint.title);
    if (dbTitleNorm !== bpTitleNorm) {
      console.log(`[warn] Module title mismatch at position ${mi + 1}: db="${module.title}" blueprint="${blueprint.title}"`);
    }

    for (let li = 0; li < lessons.length; li++) {
      const lesson = lessons[li];
      const mappedTitle = blueprint.lessons[li] || `${blueprint.title} - Part ${li + 1}`;
      const sections = buildSections({
        moduleIndex: mi,
        lessonIndex: li,
        moduleTitle: module.title,
        lessonTitle: mappedTitle,
      });

      const patch = {
        title: mappedTitle,
        summary: makeSummary(module.title, mappedTitle),
        goal: makeGoal(mappedTitle),
        learn_setup_steps: sections,
        prompts: {
          prompts: makePromptCard({ moduleTitle: module.title, lessonTitle: mappedTitle }),
        },
      };

      await contentRepo.updateLesson({
        tenantId,
        lessonId: lesson.id,
        patch,
        updatedBy: null,
      });
      updated += 1;
      if (lesson.title !== mappedTitle) renamed += 1;
    }
  }

  console.log("Prompt-to-Profit content rebuild complete.");
  console.log(`Course: ${course.title} (${course.slug})`);
  console.log(`Modules: ${modules.length}`);
  console.log(`Lessons updated: ${updated}`);
  console.log(`Lessons renamed to blueprint titles: ${renamed}`);
  console.log("Module names/order were not changed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end().catch(() => {}));
