ALTER TABLE "entity_instances_core"
ADD COLUMN IF NOT EXISTS "asset_id" varchar REFERENCES "job_site_assets"("id"),
ADD COLUMN IF NOT EXISTS "location" text;

CREATE INDEX IF NOT EXISTS "entity_instances_core_asset_idx" ON "entity_instances_core" ("asset_id");
