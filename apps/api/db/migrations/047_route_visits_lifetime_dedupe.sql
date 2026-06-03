-- One counted row per actor per route (lifetime); revisits bump last_visit_at only
BEGIN;

ALTER TABLE route_page_visits
  ADD COLUMN IF NOT EXISTS last_visit_at timestamptz;

UPDATE route_page_visits
SET last_visit_at = created_at
WHERE last_visit_at IS NULL;

-- Keep the newest row per actor + route
DELETE FROM route_page_visits a
USING route_page_visits b
WHERE a.tenant_id = b.tenant_id
  AND a.pathname = b.pathname
  AND a.actor_key = b.actor_key
  AND COALESCE(a.last_visit_at, a.created_at) < COALESCE(b.last_visit_at, b.created_at);

DROP INDEX IF EXISTS route_page_visits_unique_actor_route_day;

CREATE UNIQUE INDEX IF NOT EXISTS route_page_visits_unique_actor_route
  ON route_page_visits (tenant_id, pathname, actor_key);

CREATE INDEX IF NOT EXISTS route_page_visits_last_visit_idx
  ON route_page_visits (tenant_id, last_visit_at DESC);

COMMIT;
