import * as Sentry from "@sentry/react";
import { getOrCreateDeviceId } from "./device";
import { getToken, getTenant, clearSession } from "./session";

// In dev, use same-origin `/api` via Vite proxy (vite.config.js) unless VITE_API_URL is set.
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "" : "http://localhost:4000");

const API_DOWN_COOLDOWN_MS = 2_000;
let apiDownUntil = 0;

function markApiReachable() {
  apiDownUntil = 0;
}

function markApiUnreachable() {
  apiDownUntil = Date.now() + API_DOWN_COOLDOWN_MS;
}

function isApiInCooldown() {
  return Date.now() < apiDownUntil;
}

// Speed up dev + strict-mode by coalescing identical in-flight GET requests.
// This avoids duplicate network calls during React double-invocation and fast route switching.
const GET_IN_FLIGHT = new Map();
const GET_CACHE = new Map(); // key -> { ts, value }
const GET_CACHE_TTL_MS = 15_000;

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path) {
  // allow passing full URL sometimes
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function shouldReportApiError(err) {
  if (!err || !(err instanceof Error)) return false;
  // Reduce noise: 404 and known dev-only "missing table" errors are usually handled by UI fallback.
  if (err.isNotFound) return false;
  if (err.isMissingTableError) return false;
  if (err.status === 403) return false;

  // Network / connection errors are expected when API is starting or offline.
  if (err.isNetworkError || err.status === 0) return false;

  if (typeof err.status === "number") {
    if (err.status >= 500) return true;
    if (err.status === 401) return true;
  }
  // Default: capture anything else that reaches here.
  return true;
}

function captureApiError(err, { url, status, payload }) {
  try {
    if (!shouldReportApiError(err)) return;
    Sentry.captureException(err, {
      tags: {
        apiFetch: "true",
      },
      extra: {
        url,
        status,
        payload,
      },
    });
  } catch {
    // Never break the app because Sentry capture failed.
  }
}

function createNetworkError(originalMessage, url) {
  const apiErr = new ApiError(
    import.meta.env.DEV
      ? "Cannot reach API. Start it with: cd apps/api && npm run dev"
      : "Cannot connect to the server. Check your connection and try again.",
    0,
    { originalError: originalMessage, url }
  );
  apiErr.isNetworkError = true;
  return apiErr;
}

export async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    token: tokenOpt,
    headers = {},
    body,
    signal,
    /** Skip fetch while API is in cooldown after a recent connection failure (optional sync calls). */
    skipIfUnreachable = false,
    /** Bypass in-memory GET cache (use for manual refresh). */
    noCache = false,
  } = options;

  if (skipIfUnreachable && isApiInCooldown()) {
    throw createNetworkError("skipped_unreachable", buildUrl(path));
  }

  const token = tokenOpt ?? (typeof localStorage !== "undefined" ? getToken() : null);

  const deviceId = getOrCreateDeviceId();
  const url = buildUrl(path);

  let tenantSlug = headers["X-Tenant-Slug"] ?? headers["x-tenant-slug"];
  if (tenantSlug == null && typeof localStorage !== "undefined") {
    try {
      const t = getTenant();
      tenantSlug = (t && t.slug) ? t.slug : "expograph";
    } catch {
      tenantSlug = "expograph";
    }
  }
  if (tenantSlug == null) tenantSlug = "expograph";

  const canCacheGet =
    method === "GET" &&
    !noCache &&
    !signal &&
    body == null &&
    // Avoid caching if caller explicitly passes custom headers for this request
    // (these can include auth overrides or other user-dependent headers).
    typeof headers === "object";

  if (canCacheGet) {
    const normalizedHeaders = { ...headers };
    // Authorization is already represented by `token` in the key.
    delete normalizedHeaders.Authorization;
    delete normalizedHeaders.authorization;
    delete normalizedHeaders["x-device-id"];

    const cacheKey = JSON.stringify({
      url,
      tenantSlug,
      token: token ?? null,
      headers: normalizedHeaders,
    });

    const now = Date.now();
    const cached = GET_CACHE.get(cacheKey);
    if (cached && now - cached.ts < GET_CACHE_TTL_MS) {
      return cached.value;
    }

    const inFlight = GET_IN_FLIGHT.get(cacheKey);
    if (inFlight) {
      return await inFlight;
    }

    const reqPromise = (async () => {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
            "X-Tenant-Slug": tenantSlug,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal,
        });

        const text = await res.text();
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }

        if (!res.ok) {
          const msg =
            json?.error?.message ||
            json?.error ||
            json?.message ||
            `Request failed (${res.status})`;

          const error = new ApiError(msg, res.status, json);
          captureApiError(error, { url, status: res.status, payload: json });

          if (res.status === 401 && token) {
            clearSession();
            if (
              typeof window !== "undefined" &&
              window.location.pathname !== "/login" &&
              window.location.pathname !== "/adminlogin"
            ) {
              window.location.href = "/login";
            }
            throw error;
          }

          if (res.status === 403) {
            throw error;
          }

          if (res.status === 404) {
            error.isNotFound = true;
            throw error;
          }

          if (res.status === 500 && (msg.includes("does not exist") || msg.includes("relation"))) {
            error.isMissingTableError = true;
            throw error;
          }

          throw error;
        }

        markApiReachable();
        return json;
      } catch (error) {
        const isAbort =
          error?.name === "AbortError" ||
          (error?.message && /abort|signal\s+is\s+aborted/i.test(String(error.message)));
        if (isAbort) throw error;

        if (error instanceof TypeError && error.message.includes("fetch")) {
          markApiUnreachable();
          throw createNetworkError(error.message, url);
        }

        if (error instanceof ApiError) {
          throw error;
        }

        markApiUnreachable();
        throw createNetworkError(error.message || "Network error", url);
      }
    })();

    GET_IN_FLIGHT.set(cacheKey, reqPromise);
    reqPromise.finally(() => GET_IN_FLIGHT.delete(cacheKey));

    const value = await reqPromise;
    GET_CACHE.set(cacheKey, { ts: Date.now(), value });
    return value;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-device-id": deviceId,
        "X-Tenant-Slug": tenantSlug,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const msg =
        json?.error?.message ||
        json?.error ||
        json?.message ||
        `Request failed (${res.status})`;

      const error = new ApiError(msg, res.status, json);
      captureApiError(error, { url, status: res.status, payload: json });

      if (res.status === 401 && token) {
        clearSession();
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/adminlogin"
        ) {
          window.location.href = "/login";
        }
        throw error;
      }

      if (res.status === 403) {
        // Still throw the error so components can handle it, but don't log to console
        throw error;
      }

      // Suppress console errors for 404 Not Found when fallback data might be available
      if (res.status === 404) {
        // Mark as 404 so components can handle it silently with fallback data
        error.isNotFound = true;
        // Still throw the error so components can handle it
        throw error;
      }

      // Suppress console errors for 500 with missing table errors (expected during development)
      // Mark these errors so components can handle them silently
      if (res.status === 500 && (msg.includes("does not exist") || msg.includes("relation"))) {
        // Set a flag to indicate this is an expected error that should be handled silently
        error.isMissingTableError = true;
        // Still throw the error so components can handle it, but don't log to console
        throw error;
      }

      throw error;
    }

    markApiReachable();
    return json;
  } catch (error) {
    const isAbort = error?.name === "AbortError" || (error?.message && /abort|signal\s+is\s+aborted/i.test(String(error.message)));
    if (isAbort) throw error;
    if (error instanceof TypeError && error.message.includes("fetch")) {
      markApiUnreachable();
      throw createNetworkError(error.message, url);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    markApiUnreachable();
    throw createNetworkError(error.message || "Network error", url);
  }
}
