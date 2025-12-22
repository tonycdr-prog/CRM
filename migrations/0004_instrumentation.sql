CREATE TABLE IF NOT EXISTS meters (
  id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar(255) REFERENCES organizations(id) NOT NULL,
  name text NOT NULL,
  serial_number text,
  model text,
  created_by_user_id varchar(255) REFERENCES users(id) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS meter_calibrations (
  id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id varchar(255) REFERENCES meters(id) NOT NULL,
  calibrated_at timestamp NOT NULL DEFAULT now(),
  expires_at timestamp NOT NULL,
  certificate_url text,
  created_by_user_id varchar(255) REFERENCES users(id) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS entity_instance_readings (
  id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_instance_id varchar(255) REFERENCES entity_instances_core(id) NOT NULL,
  meter_id varchar(255) REFERENCES meters(id) NOT NULL,
  calibration_id varchar(255) REFERENCES meter_calibrations(id) NOT NULL,
  recorded_by_user_id varchar(255) REFERENCES users(id) NOT NULL,
  reading jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS meter_calibrations_meter_idx ON meter_calibrations (meter_id, expires_at);
CREATE INDEX IF NOT EXISTS entity_instance_readings_instance_idx ON entity_instance_readings (entity_instance_id);
