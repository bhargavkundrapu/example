import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../../services/api";
import { getOrCreateVisitorId, shouldSkipRouteVisit } from "../../lib/routeVisitAnalytics";

/**
 * Records SPA route changes for Super Admin route analytics (from first deploy with this feature).
 */
export default function RouteVisitTracker() {
  const location = useLocation();
  const lastSentRef = useRef("");

  useEffect(() => {
    const pathname = location.pathname || "/";
    const search = location.search || "";
    const path = pathname + search;

    if (shouldSkipRouteVisit(pathname)) return;
    if (lastSentRef.current === path) return;

    const timer = setTimeout(() => {
      lastSentRef.current = path;
      const visitorId = getOrCreateVisitorId();
      apiFetch("/api/v1/public/route-visits", {
        method: "POST",
        body: {
          pathname,
          path,
          visitorId: visitorId || undefined,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        },
      }).catch(() => {
        lastSentRef.current = "";
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
