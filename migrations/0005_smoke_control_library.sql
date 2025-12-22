ALTER TABLE "system_types" ADD COLUMN IF NOT EXISTS "standard" text;

CREATE TABLE IF NOT EXISTS "entity_library" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" varchar NOT NULL REFERENCES "public"."organizations"("id"),
    "code" text NOT NULL,
    "name" text NOT NULL,
    "standard" text,
    "description" text,
    "definition" jsonb NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "entity_library_org_code_idx" ON "entity_library" ("organization_id", "code");

CREATE TABLE IF NOT EXISTS "system_type_required_entities" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" varchar NOT NULL REFERENCES "public"."organizations"("id"),
    "system_type_id" varchar NOT NULL REFERENCES "public"."system_types"("id"),
    "entity_library_id" varchar NOT NULL REFERENCES "public"."entity_library"("id"),
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "system_type_required_entities_unique" ON "system_type_required_entities" ("system_type_id", "entity_library_id");
CREATE INDEX IF NOT EXISTS "system_type_required_entities_system_idx" ON "system_type_required_entities" ("system_type_id");
CREATE INDEX IF NOT EXISTS "system_type_required_entities_entity_idx" ON "system_type_required_entities" ("entity_library_id");
CREATE INDEX IF NOT EXISTS "system_type_required_entities_org_idx" ON "system_type_required_entities" ("organization_id");

INSERT INTO "organizations" (id, name, slug, created_at, updated_at)
VALUES ('smoke-control-lib', 'Smoke Control Library', 'smoke-control-library', now(), now())
ON CONFLICT (id) DO NOTHING;

WITH st AS (
  INSERT INTO "system_types" (organization_id, code, name, standard, created_at, updated_at)
  VALUES
    ('smoke-control-lib', 'PSS', 'Pressurization Smoke Control System', 'EN 12101-3 & EN 12101-8', now(), now()),
    ('smoke-control-lib', 'NSS', 'Natural Smoke Shaft System', 'EN 12101-2 & EN 12101-8', now(), now()),
    ('smoke-control-lib', 'PD', 'Pressure Differential System', 'EN 12101-6', now(), now()),
    ('smoke-control-lib', 'CAR_PARK', 'Car Park Smoke Control', 'BS 7346-7', now(), now()),
    ('smoke-control-lib', 'NSHEV', 'Natural SHEV', 'EN 12101-2', now(), now()),
    ('smoke-control-lib', 'PSHEV', 'Powered SHEV', 'EN 12101-3', now(), now())
  ON CONFLICT DO NOTHING
  RETURNING *
)
SELECT 1;

WITH el AS (
  INSERT INTO "entity_library" (organization_id, code, name, standard, description, definition)
  VALUES
    (
      'smoke-control-lib',
      'fan_run_verification',
      'Smoke Exhaust/Pressurization Fan',
      'EN 12101-3',
      'Verify primary fan operation, airflow, and run-on controls.',
      '{"title":"Smoke Exhaust/Pressurization Fan","description":"Verify primary fan operation, airflow, and run-on controls.","sortOrder":0,"repeatPerAsset":false,"fields":[{"id":"fan_starts","label":"Fan runs on command","type":"boolean","required":true},{"id":"airflow","label":"Airflow within design","type":"number","required":true},{"id":"rotation","label":"Rotation correct","type":"boolean","required":true},{"id":"overrun","label":"Run-on timer/overrun confirmed","type":"boolean","required":false}]}'
    ),
    (
      'smoke-control-lib',
      'damper_interface',
      'Smoke Damper / Smoke Control Damper',
      'EN 12101-8',
      'Check damper travel, feedback, and fail-safe operation.',
      '{"title":"Smoke Control Damper","description":"Check damper travel, feedback, and fail-safe operation.","sortOrder":1,"repeatPerAsset":false,"fields":[{"id":"opens","label":"Opens to smoke position","type":"boolean","required":true},{"id":"closes","label":"Closes on stop/reset","type":"boolean","required":true},{"id":"feedback","label":"Position feedback received","type":"boolean","required":true},{"id":"failsafe","label":"Failsafe/power-loss action confirmed","type":"boolean","required":false}]}'
    ),
    (
      'smoke-control-lib',
      'control_panel',
      'Control Panel & Indications',
      'EN 12101-8',
      'Confirm panel power, indications, overrides, and alarms.',
      '{"title":"Control Panel","description":"Confirm panel power, indications, overrides, and alarms.","sortOrder":2,"repeatPerAsset":false,"fields":[{"id":"panel_power","label":"Panel power healthy","type":"boolean","required":true},{"id":"fault_lights","label":"No active faults","type":"boolean","required":true},{"id":"manual_override","label":"Manual override functions","type":"boolean","required":true},{"id":"alarm_signal","label":"Alarm signal received","type":"boolean","required":true}]}'
    ),
    (
      'smoke-control-lib',
      'pressure_readings',
      'Pressure Differential Performance',
      'EN 12101-6',
      'Record stair and lobby pressures with door forces.',
      '{"title":"Pressure Differential Performance","description":"Record stair and lobby pressures with door forces.","sortOrder":3,"repeatPerAsset":false,"fields":[{"id":"stair_pressure","label":"Stair pressure (Pa)","type":"number","required":true},{"id":"lobby_pressure","label":"Lobby/vestibule pressure (Pa)","type":"number","required":false},{"id":"door_force","label":"Door open force (N)","type":"number","required":true},{"id":"leakage_paths","label":"Leakage paths noted","type":"text","required":false}]}'
    ),
    (
      'smoke-control-lib',
      'natural_vent',
      'Natural Vent / AOV',
      'EN 12101-2',
      'Verify vent travel, free area, and failsafe closure.',
      '{"title":"Natural Vent / AOV","description":"Verify vent travel, free area, and failsafe closure.","sortOrder":4,"repeatPerAsset":false,"fields":[{"id":"opens","label":"Vent opens on command","type":"boolean","required":true},{"id":"closes","label":"Vent closes on reset","type":"boolean","required":true},{"id":"free_area","label":"Aerodynamic free area (m²)","type":"number","required":true},{"id":"failsafe","label":"Failsafe position confirmed","type":"boolean","required":false}]}'
    ),
    (
      'smoke-control-lib',
      'jet_fan',
      'Car Park Jet Fan / Extract',
      'BS 7346-7',
      'Validate jet fan start, direction, and CO response.',
      '{"title":"Car Park Jet Fan / Extract","description":"Validate jet fan start, direction, and CO response.","sortOrder":5,"repeatPerAsset":false,"fields":[{"id":"fan_start","label":"Fan starts on demand","type":"boolean","required":true},{"id":"direction","label":"Direction set (Forward/Reverse)","type":"choice","options":["Forward","Reverse"],"required":true},{"id":"co_detection","label":"CO detection linked","type":"boolean","required":true},{"id":"local_isolation","label":"Local isolation available","type":"boolean","required":false}]}'
    ),
    (
      'smoke-control-lib',
      'detector_interface',
      'Alarm / Detector Interface',
      'EN 12101-8',
      'Check alarm input, isolation, and BMS signals.',
      '{"title":"Alarm / Detector Interface","description":"Check alarm input, isolation, and BMS signals.","sortOrder":6,"repeatPerAsset":false,"fields":[{"id":"alarm_received","label":"Alarm input received","type":"boolean","required":true},{"id":"zone_isolated","label":"Zone isolation control","type":"boolean","required":false},{"id":"bms_signal","label":"Signal to BMS/monitoring","type":"boolean","required":false}]}'
    )
  ON CONFLICT DO NOTHING
  RETURNING *
)
SELECT 1;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 0
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'fan_run_verification'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PSS'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 1
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'damper_interface'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PSS'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 2
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'control_panel'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PSS'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 3
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'detector_interface'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PSS'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 0
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'natural_vent'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'NSS'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 1
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'control_panel'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'NSS'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 2
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'detector_interface'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'NSS'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 0
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'pressure_readings'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PD'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 1
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'fan_run_verification'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PD'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 2
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'damper_interface'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PD'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 3
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'control_panel'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PD'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 0
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'jet_fan'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'CAR_PARK'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 1
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'detector_interface'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'CAR_PARK'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 2
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'control_panel'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'CAR_PARK'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 0
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'natural_vent'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'NSHEV'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 1
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'detector_interface'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'NSHEV'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 0
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'fan_run_verification'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PSHEV'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 1
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'damper_interface'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PSHEV'
ON CONFLICT DO NOTHING;

INSERT INTO "system_type_required_entities" (organization_id, system_type_id, entity_library_id, sort_order)
SELECT 'smoke-control-lib', st.id, el.id, 2
FROM system_types st
JOIN entity_library el ON el.organization_id = 'smoke-control-lib' AND el.code = 'control_panel'
WHERE st.organization_id = 'smoke-control-lib' AND st.code = 'PSHEV'
ON CONFLICT DO NOTHING;
