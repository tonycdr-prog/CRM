-- Scheduling assignments (jobs → engineers, with time window)
CREATE TABLE IF NOT EXISTS schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  job_id UUID NOT NULL,
  engineer_user_id TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  required_engineers INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_assignments_org_time
  ON schedule_assignments (organization_id, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_schedule_assignments_engineer_time
  ON schedule_assignments (engineer_user_id, starts_at, ends_at);

-- Optional: if you have jobs table with org_id and id, add FK (adjust names):
-- ALTER TABLE schedule_assignments
--   ADD CONSTRAINT fk_schedule_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
