-- Route / page visit analytics (SPA + public pages)
BEGIN;

CREATE TABLE IF NOT EXISTS route_page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pathname text NOT NULL,
  path text NOT NULL,
  visitor_id text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_role text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_page_visits_tenant_created_idx
  ON route_page_visits (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS route_page_visits_tenant_pathname_idx
  ON route_page_visits (tenant_id, pathname, created_at DESC);

CREATE INDEX IF NOT EXISTS route_page_visits_tenant_user_idx
  ON route_page_visits (tenant_id, user_id)
  WHERE user_id IS NOT NULL;

COMMIT;
