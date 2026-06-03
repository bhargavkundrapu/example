-- One counted visit per actor per route per UTC day (no refresh inflation)
BEGIN;

ALTER TABLE route_page_visits
  ADD COLUMN IF NOT EXISTS device_id text;

ALTER TABLE route_page_visits
  ADD COLUMN IF NOT EXISTS actor_key text;

ALTER TABLE route_page_visits
  ADD COLUMN IF NOT EXISTS visit_date date;

UPDATE route_page_visits
SET visit_date = (created_at AT TIME ZONE 'UTC')::date
WHERE visit_date IS NULL;

UPDATE route_page_visits
SET actor_key = CASE
  WHEN user_id IS NOT NULL THEN 'u:' || user_id::text
  WHEN visitor_id IS NOT NULL AND visitor_id <> '' THEN 'v:' || visitor_id
  ELSE 'x:' || id::text
END
WHERE actor_key IS NULL;

ALTER TABLE route_page_visits
  ALTER COLUMN visit_date SET DEFAULT ((now() AT TIME ZONE 'UTC')::date);

-- Remove duplicate rows (same actor + route + day), keep earliest
DELETE FROM route_page_visits a
USING route_page_visits b
WHERE a.tenant_id = b.tenant_id
  AND a.pathname = b.pathname
  AND a.actor_key = b.actor_key
  AND a.visit_date = b.visit_date
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS route_page_visits_unique_actor_route_day
  ON route_page_visits (tenant_id, pathname, actor_key, visit_date);

CREATE INDEX IF NOT EXISTS route_page_visits_actor_key_idx
  ON route_page_visits (tenant_id, actor_key, visit_date DESC);

COMMIT;
