import { type EntityTemplateDefinition } from "@shared/schema";

export const SMOKE_LIBRARY_ORG_ID = "smoke-control-lib";

export type SmokeSystemTypeCatalogEntry = {
  code: string;
  name: string;
  standard: string;
  description?: string;
};

export type SmokeEntityLibraryEntry = {
  code: string;
  name: string;
  standard: string;
  description?: string;
  definition: EntityTemplateDefinition;
};

export const SMOKE_SYSTEM_TYPES: SmokeSystemTypeCatalogEntry[] = [
  { code: "PSS", name: "Pressurization Smoke Control System", standard: "EN 12101-3 & EN 12101-8" },
  { code: "NSS", name: "Natural Smoke Shaft System", standard: "EN 12101-2 & EN 12101-8" },
  { code: "PD", name: "Pressure Differential System", standard: "EN 12101-6" },
  { code: "CAR_PARK", name: "Car Park Smoke Control", standard: "BS 7346-7" },
  { code: "NSHEV", name: "Natural SHEV", standard: "EN 12101-2" },
  { code: "PSHEV", name: "Powered SHEV", standard: "EN 12101-3" },
];

export const SMOKE_ENTITY_LIBRARY: SmokeEntityLibraryEntry[] = [
  {
    code: "fan_run_verification",
    name: "Smoke Exhaust/Pressurization Fan",
    standard: "EN 12101-3",
    description: "Verify primary fan operation, airflow, and run-on controls.",
    definition: {
      title: "Smoke Exhaust/Pressurization Fan",
      description: "Verify primary fan operation, airflow, and run-on controls.",
      sortOrder: 0,
      repeatPerAsset: false,
      fields: [
        { id: "fan_starts", label: "Fan runs on command", type: "boolean", required: true },
        { id: "airflow", label: "Airflow within design", type: "number", required: true },
        { id: "rotation", label: "Rotation correct", type: "boolean", required: true },
        { id: "overrun", label: "Run-on timer/overrun confirmed", type: "boolean", required: false },
      ],
    },
  },
  {
    code: "damper_interface",
    name: "Smoke Damper / Smoke Control Damper",
    standard: "EN 12101-8",
    description: "Check damper travel, feedback, and fail-safe operation.",
    definition: {
      title: "Smoke Control Damper",
      description: "Check damper travel, feedback, and fail-safe operation.",
      sortOrder: 1,
      repeatPerAsset: false,
      fields: [
        { id: "opens", label: "Opens to smoke position", type: "boolean", required: true },
        { id: "closes", label: "Closes on stop/reset", type: "boolean", required: true },
        { id: "feedback", label: "Position feedback received", type: "boolean", required: true },
        { id: "failsafe", label: "Failsafe/power-loss action confirmed", type: "boolean", required: false },
      ],
    },
  },
  {
    code: "control_panel",
    name: "Control Panel & Indications",
    standard: "EN 12101-8",
    description: "Confirm panel power, indications, overrides, and alarms.",
    definition: {
      title: "Control Panel",
      description: "Confirm panel power, indications, overrides, and alarms.",
      sortOrder: 2,
      repeatPerAsset: false,
      fields: [
        { id: "panel_power", label: "Panel power healthy", type: "boolean", required: true },
        { id: "fault_lights", label: "No active faults", type: "boolean", required: true },
        { id: "manual_override", label: "Manual override functions", type: "boolean", required: true },
        { id: "alarm_signal", label: "Alarm signal received", type: "boolean", required: true },
      ],
    },
  },
  {
    code: "pressure_readings",
    name: "Pressure Differential Performance",
    standard: "EN 12101-6",
    description: "Record stair and lobby pressures with door forces.",
    definition: {
      title: "Pressure Differential Performance",
      description: "Record stair and lobby pressures with door forces.",
      sortOrder: 3,
      repeatPerAsset: false,
      fields: [
        { id: "stair_pressure", label: "Stair pressure (Pa)", type: "number", required: true },
        { id: "lobby_pressure", label: "Lobby/vestibule pressure (Pa)", type: "number", required: false },
        { id: "door_force", label: "Door open force (N)", type: "number", required: true },
        { id: "leakage_paths", label: "Leakage paths noted", type: "text", required: false },
      ],
    },
  },
  {
    code: "natural_vent",
    name: "Natural Vent / AOV",
    standard: "EN 12101-2",
    description: "Verify vent travel, free area, and failsafe closure.",
    definition: {
      title: "Natural Vent / AOV",
      description: "Verify vent travel, free area, and failsafe closure.",
      sortOrder: 4,
      repeatPerAsset: false,
      fields: [
        { id: "opens", label: "Vent opens on command", type: "boolean", required: true },
        { id: "closes", label: "Vent closes on reset", type: "boolean", required: true },
        { id: "free_area", label: "Aerodynamic free area (m²)", type: "number", required: true },
        { id: "failsafe", label: "Failsafe position confirmed", type: "boolean", required: false },
      ],
    },
  },
  {
    code: "jet_fan",
    name: "Car Park Jet Fan / Extract",
    standard: "BS 7346-7",
    description: "Validate jet fan start, direction, and CO response.",
    definition: {
      title: "Car Park Jet Fan / Extract",
      description: "Validate jet fan start, direction, and CO response.",
      sortOrder: 5,
      repeatPerAsset: false,
      fields: [
        { id: "fan_start", label: "Fan starts on demand", type: "boolean", required: true },
        { id: "direction", label: "Direction set (Forward/Reverse)", type: "choice", options: ["Forward", "Reverse"], required: true },
        { id: "co_detection", label: "CO detection linked", type: "boolean", required: true },
        { id: "local_isolation", label: "Local isolation available", type: "boolean", required: false },
      ],
    },
  },
  {
    code: "detector_interface",
    name: "Alarm / Detector Interface",
    standard: "EN 12101-8",
    description: "Check alarm input, isolation, and BMS signals.",
    definition: {
      title: "Alarm / Detector Interface",
      description: "Check alarm input, isolation, and BMS signals.",
      sortOrder: 6,
      repeatPerAsset: false,
      fields: [
        { id: "alarm_received", label: "Alarm input received", type: "boolean", required: true },
        { id: "zone_isolated", label: "Zone isolation control", type: "boolean", required: false },
        { id: "bms_signal", label: "Signal to BMS/monitoring", type: "boolean", required: false },
      ],
    },
  },
];

export const SMOKE_REQUIRED_SETS: Record<string, string[]> = {
  PSS: ["fan_run_verification", "damper_interface", "control_panel", "detector_interface"],
  NSS: ["natural_vent", "control_panel", "detector_interface"],
  PD: ["pressure_readings", "fan_run_verification", "damper_interface", "control_panel"],
  CAR_PARK: ["jet_fan", "detector_interface", "control_panel"],
  NSHEV: ["natural_vent", "detector_interface"],
  PSHEV: ["fan_run_verification", "damper_interface", "control_panel"],
};
