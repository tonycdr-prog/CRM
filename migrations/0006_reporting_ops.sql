CREATE TABLE IF NOT EXISTS reports (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar NOT NULL REFERENCES organizations(id),
  job_id varchar NOT NULL REFERENCES jobs(id),
  submission_id varchar NOT NULL REFERENCES form_submissions_core(id),
  report_type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_job_idx ON reports (job_id);
CREATE INDEX IF NOT EXISTS reports_submission_idx ON reports (submission_id);

CREATE TABLE IF NOT EXISTS report_signatures (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id varchar NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  signed_by varchar NOT NULL REFERENCES users(id),
  role text NOT NULL,
  payload_hash text NOT NULL,
  signed_at timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS report_signatures_report_idx ON report_signatures (report_id);

ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS asset_id varchar REFERENCES job_site_assets(id),
  ADD COLUMN IF NOT EXISTS entity_instance_id varchar REFERENCES entity_instances_core(id),
  ADD COLUMN IF NOT EXISTS created_by varchar REFERENCES users(id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS defects_job_idx ON defects (job_id);
CREATE INDEX IF NOT EXISTS defects_asset_idx ON defects (asset_id);

CREATE TABLE IF NOT EXISTS remedials (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id varchar NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open',
  notes text,
  created_by varchar REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS remedials_defect_idx ON remedials (defect_id);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS metadata jsonb;
