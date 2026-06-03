const { asyncHandler } = require("../../utils/asyncHandler");
const { HttpError } = require("../../utils/httpError");
const z = require("zod");
const repo = require("./routeVisits.repo");

const RecordVisitSchema = z.object({
  pathname: z.string().min(1).max(500),
  path: z.string().min(1).max(2000),
  visitorId: z.string().max(64).optional(),
  referrer: z.string().max(2000).optional(),
});

const AdminQuerySchema = z.object({
  since: z.string().optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["visits", "recent", "path"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  pathname: z.string().max(500).optional(),
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

const recordVisit = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const parsed = RecordVisitSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const userId = req.auth?.userId || null;
  const userRole = req.auth?.role || null;
  const ua = req.headers["user-agent"];

  const row = await repo.insertVisit({
    tenantId,
    pathname: parsed.data.pathname,
    path: parsed.data.path,
    visitorId: parsed.data.visitorId,
    userId,
    userRole,
    referrer: parsed.data.referrer,
    userAgent: typeof ua === "string" ? ua.slice(0, 500) : null,
  });

  res.status(201).json({ ok: true, data: row });
});

const getOverview = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const parsed = AdminQuerySchema.safeParse({
    since: firstQueryString(req.query.since),
  });
  if (!parsed.success) throw new HttpError(400, "Invalid query", parsed.error.flatten());

  const stats = await repo.getOverviewStats({
    tenantId,
    since: parseSince(parsed.data.since),
  });
  res.json({ ok: true, data: stats });
});

const listSummary = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const parsed = AdminQuerySchema.safeParse({
    since: firstQueryString(req.query.since),
    search: firstQueryString(req.query.search),
    sort: firstQueryString(req.query.sort),
    limit: firstQueryString(req.query.limit),
  });
  if (!parsed.success) throw new HttpError(400, "Invalid query", parsed.error.flatten());

  const rows = await repo.listRouteSummary({
    tenantId,
    since: parseSince(parsed.data.since),
    search: parsed.data.search?.trim() || "",
    sort: parsed.data.sort || "visits",
    limit: parsed.data.limit ?? 200,
  });
  res.json({ ok: true, data: rows });
});

const listRecent = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new HttpError(400, "Tenant required");

  const parsed = AdminQuerySchema.safeParse({
    since: firstQueryString(req.query.since),
    pathname: firstQueryString(req.query.pathname),
    limit: firstQueryString(req.query.limit),
  });
  if (!parsed.success) throw new HttpError(400, "Invalid query", parsed.error.flatten());

  const rows = await repo.listRecentVisits({
    tenantId,
    since: parseSince(parsed.data.since),
    pathname: parsed.data.pathname,
    limit: parsed.data.limit ?? 80,
  });
  res.json({ ok: true, data: rows });
});

module.exports = {
  recordVisit,
  getOverview,
  listSummary,
  listRecent,
};
