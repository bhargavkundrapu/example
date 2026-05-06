-- Persist SuperAdmin student delete/restore timeline (DB-backed Undo Students tab)
CREATE TABLE IF NOT EXISTS student_undo_logs (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'removed' CHECK (status IN ('removed', 'restored')),
  deleted_at timestamptz,
  restored_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_student_undo_logs_tenant_status_updated
  ON student_undo_logs (tenant_id, status, updated_at DESC);
