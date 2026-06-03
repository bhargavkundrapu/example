import { getOrCreateDeviceId } from "../services/device";

const VISITOR_KEY = "expograph_visitor_id";
const SESSION_SENT_PREFIX = "expograph_route_visit_sent:";

export function getOrCreateVisitorId() {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Canonical path so `/courses` and `/courses/` count as one route. */
export function normalizePathname(pathname) {
  if (!pathname) return "/";
  const base = pathname.split("?")[0] || "/";
  if (base === "/") return "/";
  return base.replace(/\/+$/, "") || "/";
}

/** Paths we skip (noise / admin analytics on admin UI). */
export function shouldSkipRouteVisit(pathname) {
  const p = normalizePathname(pathname);
  if (!p) return true;
  if (p.startsWith("/api")) return true;
  if (p.startsWith("/lms/superadmin")) return true;
  return false;
}

/**
 * Same tab session: do not re-report pathname on refresh (server also dedupes).
 */
export function wasRouteVisitSentThisSession(pathname) {
  if (typeof window === "undefined" || !pathname) return false;
  try {
    return sessionStorage.getItem(`${SESSION_SENT_PREFIX}${pathname}`) === "1";
  } catch {
    return false;
  }
}

export function markRouteVisitSentThisSession(pathname) {
  if (typeof window === "undefined" || !pathname) return;
  try {
    sessionStorage.setItem(`${SESSION_SENT_PREFIX}${pathname}`, "1");
  } catch {
    /* ignore */
  }
}

/** When user leaves a route, allow a future return visit to update last-seen (not a new unique count). */
export function clearRouteVisitSentForSession(pathname) {
  if (typeof window === "undefined" || !pathname) return;
  try {
    sessionStorage.removeItem(`${SESSION_SENT_PREFIX}${pathname}`);
  } catch {
    /* ignore */
  }
}

export function getRouteVisitTrackingIds() {
  return {
    visitorId: getOrCreateVisitorId(),
    deviceId: getOrCreateDeviceId(),
  };
}
