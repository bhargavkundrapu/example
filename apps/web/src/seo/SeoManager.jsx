import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resolveSeo } from "./resolveSeo";
import { applyDocumentSeo, sendGtagPageView } from "./applyDocumentSeo";
import RouteVisitTracker from "../Components/analytics/RouteVisitTracker";

/**
 * Client-side SEO: title, meta, canonical, OG/Twitter, JSON-LD, GA4 SPA page views.
 * No visual output.
 */
export function SeoManager() {
  const location = useLocation();
  const pathname = location.pathname;
  const search = location.search;

  useEffect(() => {
    const seo = resolveSeo(pathname);
    applyDocumentSeo(seo);
    sendGtagPageView(pathname + search);
  }, [pathname, search]);

  return <RouteVisitTracker />;
}
