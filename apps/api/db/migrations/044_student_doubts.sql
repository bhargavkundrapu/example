-- Student doubts (Q&A threads) on courses and lessons with staff replies
BEGIN;

CREATE TABLE IF NOT EXISTS student_doubts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id   UUID REFERENCES lessons(id) ON DELETE CASCADE,
  doubt_type  TEXT NOT NULL CHECK (doubt_type IN ('course', 'lesson')),
  subject     TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_doubt_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doubt_id    UUID NOT NULL REFERENCES student_doubts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('student', 'staff')),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_doubts_tenant ON student_doubts (tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_doubts_user ON student_doubts (tenant_id, user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_doubts_course ON student_doubts (tenant_id, course_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_doubts_lesson ON student_doubts (tenant_id, lesson_id, updated_at DESC)
  WHERE lesson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_doubt_messages_doubt ON student_doubt_messages (doubt_id, created_at ASC);

INSERT INTO schema_migrations (filename)
VALUES ('044_student_doubts.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
