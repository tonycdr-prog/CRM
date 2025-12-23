export type ModuleDefinition = {
  id: string;
  name: string;
  description: string;
  envFlag: string;
  enabledByDefault: boolean;
};

export const moduleRegistry: ModuleDefinition[] = [
  {
    id: "smoke-control",
    name: "Smoke Control",
    description: "Operations for smoke control testing, defects, and reports.",
    envFlag: "ENABLE_MODULE_SMOKE_CONTROL",
    enabledByDefault: true,
  },
  {
    id: "passive-fire-protection",
    name: "Passive Fire Protection",
    description: "Inspections and maintenance for passive fire measures.",
    envFlag: "ENABLE_MODULE_PASSIVE_FIRE_PROTECTION",
    enabledByDefault: false,
  },
  {
    id: "fire-alarms",
    name: "Fire Alarms",
    description: "Alarm testing, servicing schedules, and compliance tracking.",
    envFlag: "ENABLE_MODULE_FIRE_ALARMS",
    enabledByDefault: false,
  },
  {
    id: "hvac",
    name: "HVAC",
    description: "HVAC maintenance workflows and asset histories.",
    envFlag: "ENABLE_MODULE_HVAC",
    enabledByDefault: false,
  },
  {
    id: "water-quality",
    name: "Water Quality",
    description: "Water quality sampling, compliance, and remediation.",
    envFlag: "ENABLE_MODULE_WATER_QUALITY",
    enabledByDefault: false,
  },
  {
    id: "air-conditioning",
    name: "Air Conditioning / Air Quality",
    description: "Air conditioning servicing and indoor air quality checks.",
    envFlag: "ENABLE_MODULE_AIR_CONDITIONING",
    enabledByDefault: false,
  },
  {
    id: "bms",
    name: "BMS",
    description: "Building management system integrations and monitoring.",
    envFlag: "ENABLE_MODULE_BMS",
    enabledByDefault: false,
  },
  {
    id: "sfg20-library",
    name: "SFG20 Library",
    description: "Planned maintenance schedules and catalog references.",
    envFlag: "ENABLE_MODULE_SFG20_LIBRARY",
    enabledByDefault: false,
  },
];

export function getModuleById(id: string): ModuleDefinition | undefined {
  return moduleRegistry.find((module) => module.id === id);
}
