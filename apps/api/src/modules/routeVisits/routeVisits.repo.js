const { query } = require("../../db/query");

function normalizePathname(pathname) {
  if (!pathname) return "/";
  const base = String(pathname).split("?")[0] || "/";
  if (base === "/") return "/";
  return base.replace(/\/+$/, "") || "/";
}

function buildActorKey({ userId, visitorId, deviceId }) {
  if (userId) return `u:${userId}`;
  if (visitorId) return `v:${visitorId}`;
  if (deviceId) return `d:${deviceId}`;
  return null;
}

async function insertVisit({
  tenantId,
  pathname,
  path,
  visitorId,
  deviceId,
  userId,
  userRole,
  referrer,
  userAgent,
}) {
  const actorKey = buildActorKey({ userId, visitorId, deviceId });
  if (!actorKey) {
    return { inserted: false, deduplicated: true, reason: "no_actor_key" };
  }

  const normalizedPathname = normalizePathname(pathname);

  const { rows } = await query(
    `INSERT INTO route_page_visits
       (tenant_id, pathname, path, visitor_id, device_id, actor_key, visit_date, user_id, user_role, referrer, user_agent, last_visit_at)
     VALUES ($1, $2, $3, $4, $5, $6, (now() AT TIME ZONE 'UTC')::date, $7, $8, $9, $10, now())
     ON CONFLICT (tenant_id, pathname, actor_key)
     DO UPDATE SET
       path = EXCLUDED.path,
       last_visit_at = now(),
       visit_date = (now() AT TIME ZONE 'UTC')::date,
       user_id = COALESCE(EXCLUDED.user_id, route_page_visits.user_id),
       user_role = COALESCE(EXCLUDED.user_role, route_page_visits.user_role),
       visitor_id = COALESCE(EXCLUDED.visitor_id, route_page_visits.visitor_id),
       device_id = COALESCE(EXCLUDED.device_id, route_page_visits.device_id),
       referrer = COALESCE(EXCLUDED.referrer, route_page_visits.referrer),
       user_agent = COALESCE(EXCLUDED.user_agent, route_page_visits.user_agent)
     RETURNING id, created_at, last_visit_at, (xmax = 0) AS was_inserted`,
    [
      tenantId,
      normalizedPathname,
      path,
      visitorId || null,
      deviceId || null,
      actorKey,
      userId || null,
      userRole || null,
      referrer || null,
      userAgent || null,
    ]
  );

  const row = rows[0];
  if (!row) return { inserted: false, deduplicated: true };
  return {
    inserted: Boolean(row.was_inserted),
    deduplicated: !row.was_inserted,
    revisit: !row.was_inserted,
    id: row.id,
    created_at: row.created_at,
    last_visit_at: row.last_visit_at,
  };
}

function buildFilterClauses(filters, params, tableAlias = "") {
  const p = tableAlias ? `${tableAlias}.` : "";
  const at = tableAlias || "";
  const timeCol = at
    ? `COALESCE(${at}.last_visit_at, ${at}.created_at)`
    : "COALESCE(last_visit_at, created_at)";
  let sql = "";
  const nextParams = [...params];

  if (filters.since) {
    nextParams.push(filters.since);
    sql += ` AND ${timeCol} >= $${nextParams.length}::timestamptz`;
  }

  if (filters.search) {
    const like = `%${String(filters.search).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    nextParams.push(like);
    sql += ` AND (${p}pathname ILIKE $${nextParams.length} ESCAPE '\\' OR ${p}path ILIKE $${nextParams.length} ESCAPE '\\')`;
  }

  if (filters.routePrefix) {
    nextParams.push(`${filters.routePrefix}%`);
    sql += ` AND ${p}pathname ILIKE $${nextParams.length} ESCAPE '\\'`;
  }

  if (filters.audience === "logged_in") {
    sql += ` AND ${p}user_id IS NOT NULL`;
  } else if (filters.audience === "anonymous") {
    sql += ` AND ${p}user_id IS NULL`;
  }

  if (filters.role) {
    nextParams.push(filters.role);
    sql += ` AND ${p}user_role = $${nextParams.length}`;
  }

  if (filters.minVisitors != null && filters.minVisitors > 0) {
    // applied in HAVING for summary only
  }

  return { sql, params: nextParams };
}

async function listRouteSummary({
  tenantId,
  since,
  search,
  sort = "recent",
  limit = 200,
  audience,
  role,
  routePrefix,
  minVisitors,
}) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
  let params = [tenantId];
  const { sql: filterSql, params: filterParams } = buildFilterClauses(
    { since, search, audience, role, routePrefix },
    params
  );
  params = filterParams;

  let havingSql = "";
  if (minVisitors != null && minVisitors > 0) {
    params.push(minVisitors);
    havingSql = ` HAVING COUNT(*)::int >= $${params.length}`;
  }

  const orderBy =
    sort === "visits"
      ? "unique_visitors DESC, last_visit_at DESC"
      : sort === "path"
        ? "pathname ASC"
        : "last_visit_at DESC";

  const { rows } = await query(
    `SELECT
       pathname,
       COUNT(*)::int AS visit_count,
       COUNT(*)::int AS unique_visitors,
       COUNT(*) FILTER (WHERE user_id IS NOT NULL)::int AS logged_in_visits,
       MAX(COALESCE(last_visit_at, created_at)) AS last_visit_at,
       MIN(created_at) AS first_visit_at
     FROM route_page_visits
     WHERE tenant_id = $1${filterSql}
     GROUP BY pathname${havingSql}
     ORDER BY ${orderBy}
     LIMIT $${params.length + 1}`,
    [...params, safeLimit]
  );
  return rows;
}

async function listRecentVisits({
  tenantId,
  since,
  pathname,
  limit = 80,
  audience,
  role,
  routePrefix,
  search,
}) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 80));
  let params = [tenantId];
  const { sql: filterSql, params: filterParams } = buildFilterClauses(
    { since, search, audience, role, routePrefix },
    params,
    "v"
  );
  params = filterParams;

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
       v.device_id,
       v.actor_key,
       v.user_id,
       v.user_role,
       v.referrer,
       v.created_at,
       v.last_visit_at,
       v.visit_date,
       u.full_name AS user_name,
       u.email AS user_email
     FROM route_page_visits v
     LEFT JOIN users u ON u.id = v.user_id
     WHERE v.tenant_id = $1${filterSql}${pathnameSql}
     ORDER BY COALESCE(v.last_visit_at, v.created_at) DESC
     LIMIT $${params.length + 1}`,
    [...params, safeLimit]
  );
  return rows;
}

async function listPeople({
  tenantId,
  since,
  search,
  audience,
  role,
  routePrefix,
  pathname,
  peopleSearch,
  kind = "all",
  limit = 300,
}) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 300));
  let params = [tenantId];
  const { sql: filterSql, params: filterParams } = buildFilterClauses(
    { since, search, audience, role, routePrefix },
    params,
    "v"
  );
  params = filterParams;

  let kindSql = "";
  if (kind === "logged_in") {
    kindSql = " AND v.user_id IS NOT NULL";
  }

  let pathnameSql = "";
  if (pathname) {
    params.push(normalizePathname(pathname));
    pathnameSql = ` AND v.pathname = $${params.length}`;
  }

  let peopleSearchSql = "";
  if (peopleSearch && String(peopleSearch).trim()) {
    const like = `%${String(peopleSearch).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    params.push(like);
    peopleSearchSql = ` AND (
      u.full_name ILIKE $${params.length} ESCAPE '\\'
      OR u.email ILIKE $${params.length} ESCAPE '\\'
      OR u.phone ILIKE $${params.length} ESCAPE '\\'
      OR v.actor_key ILIKE $${params.length} ESCAPE '\\'
    )`;
  }

  const { rows } = await query(
    `WITH filtered AS (
       SELECT
         v.actor_key,
         v.user_id,
         v.visitor_id,
         v.device_id,
         v.user_role,
         v.pathname,
         v.created_at,
         COALESCE(v.last_visit_at, v.created_at) AS seen_at,
         u.full_name,
         u.email,
         u.phone
       FROM route_page_visits v
       LEFT JOIN users u ON u.id = v.user_id
       WHERE v.tenant_id = $1${filterSql}${kindSql}${pathnameSql}${peopleSearchSql}
     ),
     per_route AS (
       SELECT
         actor_key,
         user_id,
         visitor_id,
         device_id,
         MAX(user_role) AS user_role,
         MAX(full_name) AS user_name,
         MAX(email) AS user_email,
         MAX(phone) AS user_phone,
         pathname,
         MIN(created_at) AS first_on_route,
         MAX(seen_at) AS last_on_route
       FROM filtered
       GROUP BY actor_key, user_id, visitor_id, device_id, pathname
     ),
     per_person AS (
       SELECT
         actor_key,
         user_id,
         visitor_id,
         device_id,
         MAX(user_role) AS user_role,
         MAX(user_name) AS user_name,
         MAX(user_email) AS user_email,
         MAX(user_phone) AS user_phone,
         COUNT(*)::int AS routes_visited,
         MIN(first_on_route) AS first_seen_at,
         MAX(last_on_route) AS last_seen_at,
         jsonb_agg(
           jsonb_build_object('pathname', pathname, 'last_seen', last_on_route)
           ORDER BY last_on_route DESC
         ) AS routes
       FROM per_route
       GROUP BY actor_key, user_id, visitor_id, device_id
     )
     SELECT *
     FROM per_person
     ORDER BY last_seen_at DESC
     LIMIT $${params.length + 1}`,
    [...params, safeLimit]
  );
  return rows;
}

async function getOverviewStats({ tenantId, since, audience, role, routePrefix, search }) {
  let params = [tenantId];
  const { sql: filterSql, params: filterParams } = buildFilterClauses(
    { since, audience, role, routePrefix, search },
    params
  );
  params = filterParams;

  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS total_visits,
       COUNT(DISTINCT pathname)::int AS unique_routes,
       COUNT(DISTINCT actor_key)::int AS unique_visitors,
       COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS logged_in_users
     FROM route_page_visits
     WHERE tenant_id = $1${filterSql}`,
    params
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
  listPeople,
  getOverviewStats,
  buildActorKey,
};
