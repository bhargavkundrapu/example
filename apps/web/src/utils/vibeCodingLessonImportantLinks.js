/**
 * Official download / setup links shown below the video for specific Vibe Coding lessons.
 */

export const VIBE_SETUP_FULLSTACK_IMPORTANT_LINKS = [
  {
    id: "antigravity-ide",
    title: "Antigravity IDE",
    description: "Official IDE download — use this link so you get the code editor, not other Antigravity products.",
    href: "https://antigravity.google/download#antigravity-ide",
    cta: "Download Antigravity IDE",
    accent: "from-violet-500 to-indigo-600",
  },
  {
    id: "nodejs",
    title: "Node.js",
    description: "Install Node.js on your computer (choose the LTS version on the download page).",
    href: "https://nodejs.org/en/download",
    cta: "Download Node.js",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "neon",
    title: "Neon (Postgres)",
    description: "Create your free cloud database — you will use this when setting up your fullstack project.",
    href: "https://neon.com/",
    cta: "Open Neon",
    accent: "from-cyan-500 to-blue-600",
  },
];

export const VIBE_DEPLOYING_SETUP_IMPORTANT_LINKS = [
  {
    id: "github",
    title: "GitHub",
    description: "Create your account and host your project code — you will push your app from here.",
    href: "https://github.com/",
    cta: "Open GitHub",
    accent: "from-slate-700 to-slate-900",
  },
  {
    id: "git-windows",
    title: "Git for Windows",
    description: "Install Git on your PC so you can commit and push code from Antigravity or the terminal.",
    href: "https://git-scm.com/install/windows",
    cta: "Download Git",
    accent: "from-orange-500 to-amber-600",
  },
  {
    id: "vercel",
    title: "Vercel",
    description: "Deploy your frontend or fullstack app — connect your GitHub repo and go live in minutes.",
    href: "https://vercel.com/",
    cta: "Open Vercel",
    accent: "from-slate-900 to-slate-700",
  },
  {
    id: "render",
    title: "Render",
    description: "Another option to deploy your backend or full app — sign up and connect your repository.",
    href: "https://render.com/",
    cta: "Open Render",
    accent: "from-teal-600 to-emerald-600",
  },
  {
    id: "neon-console",
    title: "Neon Console",
    description: "Open your Neon dashboard to manage your Postgres database and connection strings.",
    href: "https://console.neon.tech/",
    cta: "Open Neon Console",
    accent: "from-cyan-500 to-blue-600",
  },
];

function normalizeSlug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/_/g, "-")
    .trim();
}

/**
 * @returns {typeof VIBE_SETUP_FULLSTACK_IMPORTANT_LINKS | null}
 */
export function getVibeLessonImportantLinks({
  courseSlug,
  moduleSlug,
  lessonSlug,
  moduleTitle,
  lessonTitle,
}) {
  const c = normalizeSlug(courseSlug);
  const isVibeCourse = c.includes("vibe") && (c.includes("cod") || c.includes("coad"));
  if (!isVibeCourse) return null;

  const mSlug = normalizeSlug(moduleSlug);
  const mTit = normalizeSlug(moduleTitle);
  const setupModule =
    (mSlug.includes("setup") && (mSlug.includes("account") || mSlug.includes("accounts"))) ||
    (mTit.includes("setup") && mTit.includes("account"));
  if (!setupModule) return null;

  const lSlug = normalizeSlug(lessonSlug);
  const lTit = normalizeSlug(lessonTitle);
  const fullstackLesson =
    (lSlug.includes("fullstack") && (lSlug.includes("environment") || lSlug.includes("env"))) ||
    (lTit.includes("fullstack") && (lTit.includes("environment") || lTit.includes("env")));
  if (fullstackLesson) return VIBE_SETUP_FULLSTACK_IMPORTANT_LINKS;

  const deployingSetupLesson =
    ((lSlug.includes("deploy") || lSlug.includes("deployment")) && lSlug.includes("setup")) ||
    ((lTit.includes("deploy") || lTit.includes("deployment")) && lTit.includes("setup"));
  if (deployingSetupLesson) return VIBE_DEPLOYING_SETUP_IMPORTANT_LINKS;

  return null;
}
