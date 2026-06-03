const { query } = require("../../db/query");

async function insertVisit({
  tenantId,
  pathname,
  path,
  visitorId,
  userId,
  userRole,
  referrer,
  userAgent,
}) {
  const { rows } = await query(
    `INSERT INTO route_page_visits
       (tenant_id, pathname, path, visitor_id, user_id, user_role, referrer, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, created_at`,
    [
      tenantId,
      pathname,
      path,
      visitorId || null,
      userId || null,
      userRole || null,
      referrer || null,
      userAgent || null,
    ]
  );
  return rows[0];
}

/** @param {string} [createdAtColumn] - qualified column e.g. `v.created_at` when joining users */
function buildSinceClause(since, params, createdAtColumn = "created_at") {
  if (!since) return { sql: "", params };
  const next = params.length + 1;
  return {
    sql: ` AND ${createdAtColumn} >= $${next}::timestamptz`,
    params: [...params, since],
  };
}

async function listRouteSummary({ tenantId, since, search, sort = "visits", limit = 200 }) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
  const params = [tenantId];
  const { sql: sinceSql, params: paramsWithSince } = buildSinceClause(since, params);
  params.length = 0;
  params.push(...paramsWithSince);

  let searchSql = "";
  if (search) {
    const like = `%${String(search).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    params.push(like);
    searchSql = ` AND (pathname ILIKE $${params.length} ESCAPE '\\' OR path ILIKE $${params.length} ESCAPE '\\')`;
  }

  const orderBy =
    sort === "recent"
      ? "MAX(created_at) DESC"
      : sort === "path"
        ? "pathname ASC"
        : "visit_count DESC, MAX(created_at) DESC";

  const { rows } = await query(
    `SELECT
       pathname,
       COUNT(*)::int AS visit_count,
       COUNT(DISTINCT COALESCE(visitor_id, user_id::text, id::text))::int AS unique_visitors,
       COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS logged_in_visits,
       MAX(created_at) AS last_visit_at,
       MIN(created_at) AS first_visit_at
     FROM route_page_visits
     WHERE tenant_id = $1${sinceSql}${searchSql}
     GROUP BY pathname
     ORDER BY ${orderBy}
     LIMIT $${params.length + 1}`,
    [...params, safeLimit]
  );
  return rows;
}

async function listRecentVisits({ tenantId, since, pathname, limit = 80 }) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 80));
  const params = [tenantId];
  const { sql: sinceSql, params: paramsWithSince } = buildSinceClause(since, params, "v.created_at");
  params.length = 0;
  params.push(...paramsWithSince);

  let pathnameSql = "";
  if (pathname) {
    params.push(pathname);
    pathnameSql = ` AND v.pathname = $${params.length}`;
  }

  const { rows } = await query(
    `SELECT
       v.id,
       v.pathname,
       v.path,
       v.visitor_id,
       v.user_id,
       v.user_role,
       v.referrer,
       v.created_at,
       u.full_name AS user_name,
       u.email AS user_email
     FROM route_page_visits v
     LEFT JOIN users u ON u.id = v.user_id
     WHERE v.tenant_id = $1${sinceSql}${pathnameSql}
     ORDER BY v.created_at DESC
     LIMIT $${params.length + 1}`,
    [...params, safeLimit]
  );
  return rows;
}

async function getOverviewStats({ tenantId, since }) {
  const params = [tenantId];
  const { sql: sinceSql, params: paramsWithSince } = buildSinceClause(since, params);

  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS total_visits,
       COUNT(DISTINCT pathname)::int AS unique_routes,
       COUNT(DISTINCT COALESCE(visitor_id, user_id::text, id::text))::int AS unique_visitors,
       COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS logged_in_users
     FROM route_page_visits
     WHERE tenant_id = $1${sinceSql}`,
    paramsWithSince
  );
  return rows[0] || {
    total_visits: 0,
    unique_routes: 0,
    unique_visitors: 0,
    logged_in_users: 0,
  };
}

module.exports = {
  insertVisit,
  listRouteSummary,
  listRecentVisits,
  getOverviewStats,
};
