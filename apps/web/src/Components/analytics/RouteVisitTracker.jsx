import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../../services/api";
import {
  clearRouteVisitSentForSession,
  getRouteVisitTrackingIds,
  markRouteVisitSentThisSession,
  normalizePathname,
  shouldSkipRouteVisit,
  wasRouteVisitSentThisSession,
} from "../../lib/routeVisitAnalytics";

/**
 * Records unique route visits: one count per visitor/user per route (lifetime).
 * Session guard prevents refresh from re-sending; server upserts last-seen on return.
 */
export default function RouteVisitTracker() {
  const location = useLocation();
  const lastPathRef = useRef("");
  const prevPathnameRef = useRef("");

  useEffect(() => {
    const pathname = normalizePathname(location.pathname || "/");
    const search = location.search || "";
    const path = (location.pathname || "/") + search;

    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      clearRouteVisitSentForSession(prevPathnameRef.current);
    }
    prevPathnameRef.current = pathname;

    if (shouldSkipRouteVisit(pathname)) return;
    if (lastPathRef.current === path) return;
    if (wasRouteVisitSentThisSession(pathname)) return;

    const timer = setTimeout(() => {
      lastPathRef.current = path;
      const { visitorId, deviceId } = getRouteVisitTrackingIds();

      apiFetch("/api/v1/public/route-visits", {
        method: "POST",
        body: {
          pathname,
          path,
          visitorId: visitorId || undefined,
          deviceId: deviceId || undefined,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        },
      })
        .then(() => {
          markRouteVisitSentThisSession(pathname);
        })
        .catch(() => {
          lastPathRef.current = "";
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
