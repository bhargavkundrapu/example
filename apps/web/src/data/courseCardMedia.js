/**
 * Stable Unsplash URLs (same query pattern as elsewhere in the web app).
 * Used for course/pack cards across Academy, /courses, explore/detail, and student LMS.
 */

export const COURSE_CARD_FALLBACK =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80&auto=format&fit=crop";

export const COURSE_CARD_COVER = {
  "all-pack":
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80&auto=format&fit=crop",
  "vibe-coding":
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80&auto=format&fit=crop",
  "prompt-engineering":
    "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80&auto=format&fit=crop",
  "prompt-to-profit":
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80&auto=format&fit=crop",
  "ai-automations":
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&auto=format&fit=crop",
  "ai-tools-mastery-students":
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80&auto=format&fit=crop",
};

const FEATURE_CARD_COVER = {
  "smart-prompts":
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&auto=format&fit=crop",
  "resume-builder":
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&q=80&auto=format&fit=crop",
  "real-client-lab":
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80&auto=format&fit=crop",
  "learning-portal":
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80&auto=format&fit=crop",
  "structured-lessons":
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&q=80&auto=format&fit=crop",
  "jobs-search-hub":
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&q=80&auto=format&fit=crop",
  "startup-launchpad":
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80&auto=format&fit=crop",
};

/**
 * Cover for API-backed courses / packs (slug + title heuristics).
 */
export function getCourseCardCover(slug, title) {
  const s = (slug || "")
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  const tit = (title || "").toLowerCase();
  const combined = `${s} ${tit}`;

  if (COURSE_CARD_COVER[s]) return COURSE_CARD_COVER[s];

  if (s === "all-pack" || s.includes("all-pack") || combined.includes("all pack")) {
    return COURSE_CARD_COVER["all-pack"];
  }
  if (s.includes("vibe") && (s.includes("cod") || s.includes("coad"))) {
    return COURSE_CARD_COVER["vibe-coding"];
  }
  if (s.includes("prompt-engineering") || tit.includes("prompt engineering")) {
    return COURSE_CARD_COVER["prompt-engineering"];
  }
  if (s.includes("prompt-to-profit") || tit.includes("prompt to profit")) {
    return COURSE_CARD_COVER["prompt-to-profit"];
  }
  if (s.includes("ai-automation") || tit.includes("ai automation")) {
    return COURSE_CARD_COVER["ai-automations"];
  }
  if (s.includes("ai-tools-mastery") || tit.includes("ai tools mastery")) {
    return COURSE_CARD_COVER["ai-tools-mastery-students"];
  }

  return COURSE_CARD_FALLBACK;
}

export function getFeatureCardCover(slug) {
  const key = String(slug || "")
    .toLowerCase()
    .trim();
  return FEATURE_CARD_COVER[key] || COURSE_CARD_FALLBACK;
}
