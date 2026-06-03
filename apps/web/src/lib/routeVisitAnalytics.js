const VISITOR_KEY = "expograph_visitor_id";

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

/** Paths we skip (noise / health checks). */
export function shouldSkipRouteVisit(pathname) {
  if (!pathname) return true;
  if (pathname.startsWith("/api")) return true;
  return false;
}
