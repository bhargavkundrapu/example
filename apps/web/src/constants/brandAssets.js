/**
 * ExpoGraph LMS header / layout logos served from same-origin `/public/brand/` so Safari/Edge
 * Tracking Prevention does not warn about cross-site storage partitioned for Third-party CDN URLs.
 */

const BASE = typeof import.meta !== "undefined" && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : "/";

function publicUrl(pathSegment) {
  const base = BASE.endsWith("/") ? BASE : `${BASE}/`;
  const seg = pathSegment.startsWith("/") ? pathSegment.slice(1) : pathSegment;
  return `${base}${seg}`;
}

export const BRAND_LOGO_FULL_PRIMARY = publicUrl("brand/expo-graph-logo-full.png");
export const BRAND_LOGO_ICON_PRIMARY = publicUrl("brand/expo-graph-logo-icon.png");

/** Last-resort only (e.g. missing static asset on CDN deploy). */
export const BRAND_LOGO_FULL_CLOUDINARY_FALLBACK =
  "https://res.cloudinary.com/da2wrgabu/image/upload/v1777379728/1_ajimf0.png";
export const BRAND_LOGO_ICON_CLOUDINARY_FALLBACK =
  "https://res.cloudinary.com/da2wrgabu/image/upload/v1777379714/e_x_1_xoh57o.png";
