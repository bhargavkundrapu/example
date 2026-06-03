const { asyncHandler } = require("../../utils/asyncHandler");
const { HttpError } = require("../../utils/httpError");
const z = require("zod");
const repo = require("./routeVisits.repo");

const RecordVisitSchema = z.object({
  pathname: z.string().min(1).max(500),
  path: z.string().min(1).max(2000),
  visitorId: z.string().max(64).optional(),
  deviceId: z.string().max(64).optional(),
  referrer: z.string().max(2000).optional(),
});

const AdminQuerySchema = z.object({
  since: z.string().optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["visits", "recent", "path"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  pathname: z.string().max(500).optional(),
  audience: z.enum(["all", "logged_in", "anonymous"]).optional(),
  role: z.string().trim().max(50).optional(),
  routePrefix: z.string().trim().max(200).optional(),
  minVisitors: z.coerce.number().int().min(0).max(100000).optional(),
  kind: z.enum(["all", "logged_in"]).optional(),
  peopleSearch: z.string().trim().max(200).optional(),
});

function firstQueryString(val) {
  if (val == null) return undefined;
  if (Array.isArray(val)) {
    const first = val[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof val === "string" ? val : undefined;
}

function parseSince(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  const now = new Date();
  if (s === "24h" || s === "1d") return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (s === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (s === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (s === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseAdminFilters(query) {
  const parsed = AdminQuerySchema.safeParse({
    since: firstQueryString(query.since),
    search: firstQueryString(query.search),
    sort: firstQueryString(query.sort),
    limit: firstQueryString(query.limit),
    pathname: firstQueryString(query.pathname),
    audience: firstQueryString(query.audience) || "all",
    role: firstQueryString(query.role),
    routePrefix: firstQueryString(query.routePrefix),
    minVisitors: firstQueryString(query.minVisitors),
    peopleSearch: firstQueryString(query.peopleSearch),
  });
  if (!parsed.success) throw new HttpError(400, "Invalid query", parsed.error.flatten());
  const d = parsed.data;
  return {
    since: parseSince(d.since),
    search: d.search?.trim() || "",
    sort: d.sort || "recent",
    limit: d.limit,
    pathname: d.pathname?.trim() || "",
    audience: d.audience === "logged_in" || d.audience === "anonymous" ? d.audience : "all",
    role: d.role || "",
    routePrefix: d.routePrefix || "",
    minVisitors: d.minVisitors != null ? Number(d.minVisitors) : null,
    peopleSearch: d.peopleSearch?.trim() || "",
  };
}

const recordVisit = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const parsed = RecordVisitSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const userId = req.auth?.userId || null;
  const userRole = req.auth?.role || null;
  const ua = req.headers["user-agent"];
  const deviceId =
    parsed.data.deviceId ||
    (typeof req.headers["x-device-id"] === "string" ? req.headers["x-device-id"] : null);

  const result = await repo.insertVisit({
    tenantId,
    pathname: parsed.data.pathname,
    path: parsed.data.path,
    visitorId: parsed.data.visitorId,
    deviceId,
    userId,
    userRole,
    referrer: parsed.data.referrer,
    userAgent: typeof ua === "string" ? ua.slice(0, 500) : null,
  });

  res.status(result.inserted ? 201 : 200).json({ ok: true, data: result });
});

const getOverview = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const filters = parseAdminFilters(req.query);
  const stats = await repo.getOverviewStats({ tenantId, ...filters });
  res.json({
    ok: true,
    data: {
      ...stats,
      period_start: filters.since ? filters.since.toISOString() : null,
    },
  });
});

const listSummary = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const filters = parseAdminFilters(req.query);
  const rows = await repo.listRouteSummary({
    tenantId,
    ...filters,
    limit: filters.limit ?? 200,
  });
  res.json({ ok: true, data: rows });
});

const listRecent = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const filters = parseAdminFilters(req.query);
  const rows = await repo.listRecentVisits({
    tenantId,
    ...filters,
    limit: filters.limit ?? 80,
  });
  res.json({ ok: true, data: rows });
});

const listPeople = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const parsed = AdminQuerySchema.safeParse({
    since: firstQueryString(req.query.since),
    search: firstQueryString(req.query.search),
    limit: firstQueryString(req.query.limit),
    audience: firstQueryString(req.query.audience) || "all",
    role: firstQueryString(req.query.role),
    routePrefix: firstQueryString(req.query.routePrefix),
    pathname: firstQueryString(req.query.pathname),
    kind: firstQueryString(req.query.kind),
    peopleSearch: firstQueryString(req.query.peopleSearch),
  });
  if (!parsed.success) throw new HttpError(400, "Invalid query", parsed.error.flatten());

  const filters = parseAdminFilters(req.query);
  const kind = parsed.data.kind === "logged_in" ? "logged_in" : "all";
  const rows = await repo.listPeople({
    tenantId,
    ...filters,
    kind,
    limit: filters.limit ?? 300,
  });
  res.json({ ok: true, data: rows });
});

module.exports = {
  recordVisit,
  getOverview,
  listSummary,
  listRecent,
  listPeople,
};
