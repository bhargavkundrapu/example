/**
 * Alternate-language MP4 sources for specific Vibe Coding lessons (no DB change).
 * Module: Setup & Accounts
 * - Lesson: Setup Fullstack environment
 * - Lesson: Deploying setup
 */

const VIBE_SETUP_FULLSTACK_VIDEOS = {
  english:
    "https://res.cloudinary.com/da2wrgabu/video/upload/v1776000002/3%E6%9C%8827%E6%97%A5_1_ry2yda.mp4",
  telugu:
    "https://res.cloudinary.com/da2wrgabu/video/upload/v1776007472/3%E6%9C%8827%E6%97%A5_xbldx9.mp4",
};

const VIBE_DEPLOYING_SETUP_VIDEOS = {
  english:
    "https://res.cloudinary.com/da2wrgabu/video/upload/v1777919863/5%E6%9C%883%E6%97%A5_nxm3ql.mp4",
  telugu:
    "https://res.cloudinary.com/da2wrgabu/video/upload/v1778005946/5%E6%9C%883%E6%97%A5_5_fovvlb.mp4",
};

const VIBE_BASE_API_ARCHITECTURE_VIDEOS = {
  english:
    "https://res.cloudinary.com/da2wrgabu/video/upload/v1781026480/5%E6%9C%886%E6%97%A5_umycju.mp4",
  telugu:
    "https://res.cloudinary.com/da2wrgabu/video/upload/v1781027549/5%E6%9C%886%E6%97%A5_1_qnxw3u.mp4",
};

export const VIBE_SETUP_FULLSTACK_VIDEO_LANG_KEY = "expograph_vc_setup_fullstack_video_lang";

function normalizeSlug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/_/g, "-")
    .trim();
}

/**
 * @returns {{ english: string, telugu: string } | null}
 */
export function getVibeSetupFullstackAlternateVideos({
  courseSlug,
  moduleSlug,
  lessonSlug,
  moduleTitle,
  lessonTitle,
}) {
  const c = normalizeSlug(courseSlug);
  const isVibeCourse = c.includes("vibe") && (c.includes("cod") || c.includes("coad"));
  if (!isVibeCourse) return null;

  const lSlug = normalizeSlug(lessonSlug);
  const lTit = normalizeSlug(lessonTitle);

  // Check project foundations / base-api-architecture lesson first
  const baseApiArchitectureLesson =
    lSlug.includes("base-api-architecture") ||
    (lSlug.includes("base-api") && lSlug.includes("architecture")) ||
    (lTit.includes("base-api") && lTit.includes("architecture"));
  if (baseApiArchitectureLesson) return VIBE_BASE_API_ARCHITECTURE_VIDEOS;

  const mSlug = normalizeSlug(moduleSlug);
  const mTit = normalizeSlug(moduleTitle);
  const setupModule =
    (mSlug.includes("setup") && (mSlug.includes("account") || mSlug.includes("accounts"))) ||
    (mTit.includes("setup") && mTit.includes("account"));
  if (!setupModule) return null;

  const fullstackLesson =
    (lSlug.includes("fullstack") && (lSlug.includes("environment") || lSlug.includes("env"))) ||
    (lTit.includes("fullstack") && (lTit.includes("environment") || lTit.includes("env")));
  if (fullstackLesson) return VIBE_SETUP_FULLSTACK_VIDEOS;

  const deployingSetupLesson =
    ((lSlug.includes("deploy") || lSlug.includes("deployment")) && lSlug.includes("setup")) ||
    ((lTit.includes("deploy") || lTit.includes("deployment")) && lTit.includes("setup"));
  if (deployingSetupLesson) return VIBE_DEPLOYING_SETUP_VIDEOS;

  return null;
}
