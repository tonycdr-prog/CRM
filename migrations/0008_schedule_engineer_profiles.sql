-- Schedule engineer profiles (capacity + working window defaults)
CREATE TABLE IF NOT EXISTS schedule_engineer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  engineer_user_id TEXT NOT NULL,
  daily_capacity_minutes INTEGER NOT NULL DEFAULT 480,
  workday_start TEXT NOT NULL DEFAULT '08:00',
  workday_end TEXT NOT NULL DEFAULT '17:00',
  travel_buffer_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_engineer_profiles_org_engineer
  ON schedule_engineer_profiles (organization_id, engineer_user_id);
