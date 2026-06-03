import { absoluteUrl, getSiteOrigin } from "./siteOrigin";

const GA_ID = "G-YZ9ECKVXSH";

function ensureMetaName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function ensureMetaProperty(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function ensureLinkRel(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const SCHEMA_ID = "expograph-jsonld-schema";

/**
 * @param {{ title: string, description: string, robots: string, canonicalPath: string, jsonLd: object | null }} seo
 */
export function applyDocumentSeo(seo) {
  document.title = seo.title;
  ensureMetaName("description", seo.description);
  ensureMetaName("robots", seo.robots);

  const canonical = absoluteUrl(seo.canonicalPath);
  ensureLinkRel("canonical", canonical);

  ensureMetaProperty("og:type", "website");
  ensureMetaProperty("og:title", seo.title);
  ensureMetaProperty("og:description", seo.description);
  ensureMetaProperty("og:url", canonical);
  ensureMetaProperty("og:site_name", "ExpoGraph Academy");
  ensureMetaProperty("og:image", absoluteUrl("/pwa-icon-512.png"));

  ensureMetaName("twitter:card", "summary_large_image");
  ensureMetaName("twitter:title", seo.title);
  ensureMetaName("twitter:description", seo.description);
  ensureMetaName("twitter:image", absoluteUrl("/pwa-icon-512.png"));

  let script = document.getElementById(SCHEMA_ID);
  if (seo.jsonLd) {
    const text = JSON.stringify(seo.jsonLd);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = SCHEMA_ID;
      document.head.appendChild(script);
    }
    script.textContent = text;
  } else if (script) {
    script.remove();
  }
}

/**
 * After API returns course or pack on `/courses/:slug`, refresh title/description/schema.
 * Does not change UI.
 */
export function applyCourseDetailSeo({ slug, title, description, isCourse }) {
  const canonicalPath = `/courses/${slug}`;
  const pageTitle = `${title} | ExpoGraph Academy`;
  const raw = String(description || "").replace(/\s+/g, " ").trim();
  const fallback = `Learn ${title} at ExpoGraph Academy - hands-on lessons, projects, and certificates.`;
  const metaDesc = (raw || fallback).slice(0, 160);

  const baseProvider = {
    "@type": "Organization",
    name: "ExpoGraph Academy",
    url: getSiteOrigin(),
  };

  const mainSchema = isCourse
    ? {
        "@type": "Course",
        name: title,
        description: metaDesc,
        url: absoluteUrl(canonicalPath),
        provider: baseProvider,
      }
    : {
        "@type": "Product",
        name: title,
        description: metaDesc,
        url: absoluteUrl(canonicalPath),
        brand: { "@type": "Brand", name: "ExpoGraph Academy" },
        category: "Educational",
      };

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": absoluteUrl("/")
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Courses",
        "item": absoluteUrl("/courses")
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": absoluteUrl(canonicalPath)
      }
    ]
  };

  applyDocumentSeo({
    title: pageTitle,
    description: metaDesc,
    robots: "index, follow",
    canonicalPath,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [mainSchema, breadcrumbSchema]
    },
  });
}

/** SPA navigation - GA4 page view (gtag must be loaded from index.html). */
export function sendGtagPageView(pathnameWithSearch) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("config", GA_ID, {
      page_path: pathnameWithSearch,
      page_title: document.title,
    });
  } catch {
    /* ignore */
  }
}
