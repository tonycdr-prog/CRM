export type StandardVersion = 
  | "bs_5588_4_1978"
  | "bs_5588_4_1998" 
  | "bs_en_12101_6_2005"
  | "bs_en_12101_6_2022";

export type SystemClass = "class_a" | "class_b" | "class_c" | "class_d" | "class_e" | "class_f";

export interface ClassRequirements {
  name: string;
  title: string;
  description: string;
  pressureRange: string;
  minPressure: number | null;
  maxPressure: number | null;
  nominalPressure: string;
  openDoorMin: string;
  openDoorMinValue: number | null;
  doorForce: string;
  doorForceValue: number | null;
  doorForceCloser: string;
  doorForceCloserValue: number | null;
  scenarios: Array<{ name: string; pressure: string; required: boolean }>;
  notes?: string;
}

export interface StandardDefinition {
  id: StandardVersion;
  name: string;
  shortName: string;
  year: number;
  description: string;
  supersededBy?: StandardVersion;
  classes: Partial<Record<SystemClass, ClassRequirements>>;
}

export const STANDARD_VERSIONS: Record<StandardVersion, StandardDefinition> = {
  bs_5588_4_1978: {
    id: "bs_5588_4_1978",
    name: "BS 5588-4:1978",
    shortName: "BS 5588-4 (1978)",
    year: 1978,
    description: "Fire precautions in the design of buildings - Smoke control in protected escape routes using pressurization",
    supersededBy: "bs_5588_4_1998",
    classes: {
      class_a: {
        name: "Class A",
        title: "Firefighting Stair",
        description: "Pressurized stairway for firefighting access (1978 standard)",
        pressureRange: "50 Pa (±10%)",
        minPressure: 45,
        maxPressure: 55,
        nominalPressure: "50 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "110 N",
        doorForceValue: 110,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "All Doors Closed", pressure: "45-55 Pa", required: true },
          { name: "One Door Open", pressure: "≥10 Pa", required: true },
        ],
        notes: "Original 1978 standard - superseded but may apply to older installations"
      },
      class_b: {
        name: "Class B",
        title: "Escape Stair",
        description: "Pressurized stairway for means of escape (1978 standard)",
        pressureRange: "50 Pa (±10%)",
        minPressure: 45,
        maxPressure: 55,
        nominalPressure: "50 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "110 N",
        doorForceValue: 110,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "All Doors Closed", pressure: "45-55 Pa", required: true },
          { name: "One Door Open", pressure: "≥10 Pa", required: true },
        ],
        notes: "1978 did not differentiate pressure levels between classes"
      },
    },
  },

  bs_5588_4_1998: {
    id: "bs_5588_4_1998",
    name: "BS 5588-4:1998",
    shortName: "BS 5588-4 (1998)",
    year: 1998,
    description: "Fire precautions in the design, construction and use of buildings - Code of practice for smoke control using pressure differentials",
    supersededBy: "bs_en_12101_6_2005",
    classes: {
      class_a: {
        name: "Class A",
        title: "Firefighting Shaft",
        description: "Protected shaft for firefighting operations (1998 standard)",
        pressureRange: "50 Pa (±10 Pa)",
        minPressure: 40,
        maxPressure: 60,
        nominalPressure: "50 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "All Doors Closed", pressure: "40-60 Pa", required: true },
          { name: "Single Door Open", pressure: "≥10 Pa", required: true },
          { name: "Door Force Test", pressure: "≤100 N", required: true },
        ],
        notes: "Introduced refined pressure tolerances"
      },
      class_b: {
        name: "Class B",
        title: "Protected Escape Route",
        description: "Stairway providing protected escape route (1998 standard)",
        pressureRange: "50 Pa (±10 Pa)",
        minPressure: 40,
        maxPressure: 60,
        nominalPressure: "50 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "All Doors Closed", pressure: "40-60 Pa", required: true },
          { name: "Single Door Open", pressure: "≥10 Pa", required: true },
          { name: "Door Force Test", pressure: "≤100 N", required: true },
        ],
      },
      class_e: {
        name: "Class E",
        title: "Lobby Protection",
        description: "Pressurized lobby between stair and accommodation (1998 standard)",
        pressureRange: "50 Pa (±10 Pa)",
        minPressure: 40,
        maxPressure: 60,
        nominalPressure: "50 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "All Doors Closed", pressure: "40-60 Pa", required: true },
          { name: "Lobby Door Open", pressure: "≥10 Pa", required: true },
        ],
      },
    },
  },

  bs_en_12101_6_2005: {
    id: "bs_en_12101_6_2005",
    name: "BS EN 12101-6:2005",
    shortName: "BS EN 12101-6 (2005)",
    year: 2005,
    description: "Smoke and heat control systems - Specification for pressure differential systems",
    supersededBy: "bs_en_12101_6_2022",
    classes: {
      class_a: {
        name: "Class A",
        title: "Firefighting Shaft",
        description: "Maximum smoke protection for firefighting operations",
        pressureRange: "50 Pa (+10/-5 Pa)",
        minPressure: 45,
        maxPressure: 60,
        nominalPressure: "50 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "67 N",
        doorForceCloserValue: 67,
        scenarios: [
          { name: "All Doors Closed", pressure: "45-60 Pa", required: true },
          { name: "Single Door Open", pressure: "≥10 Pa", required: true },
          { name: "Door Force Test", pressure: "≤100 N", required: true },
        ],
        notes: "European harmonized standard"
      },
      class_b: {
        name: "Class B",
        title: "Protected Escape Route",
        description: "Safe evacuation conditions with lower pressure differential",
        pressureRange: "10-25 Pa",
        minPressure: 10,
        maxPressure: 25,
        nominalPressure: "12.5 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "67 N",
        doorForceCloserValue: 67,
        scenarios: [
          { name: "All Doors Closed", pressure: "10-25 Pa", required: true },
          { name: "Single Door Open", pressure: "≥10 Pa", required: true },
          { name: "Door Force Test", pressure: "≤100 N", required: true },
        ],
        notes: "Introduced lower pressure option for escape routes"
      },
      class_c: {
        name: "Class C",
        title: "Smoke Clearance",
        description: "Clears smoke from protected areas after fire event",
        pressureRange: "As designed",
        minPressure: null,
        maxPressure: null,
        nominalPressure: "Per design",
        openDoorMin: "N/A",
        openDoorMinValue: null,
        doorForce: "N/A",
        doorForceValue: null,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "Smoke Extraction Rate", pressure: "Per design", required: true },
          { name: "Air Changes", pressure: "Per design", required: true },
        ],
      },
      class_d: {
        name: "Class D",
        title: "External Air Curtain",
        description: "Air barrier at openings to prevent smoke spread",
        pressureRange: "As designed",
        minPressure: null,
        maxPressure: null,
        nominalPressure: "Per design",
        openDoorMin: "N/A",
        openDoorMinValue: null,
        doorForce: "N/A",
        doorForceValue: null,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "Air Velocity", pressure: "Per design", required: true },
          { name: "Coverage Area", pressure: "Per design", required: true },
        ],
      },
      class_e: {
        name: "Class E",
        title: "Smoke Control Lobby",
        description: "Maintains lobby pressure to prevent smoke ingress",
        pressureRange: "10-50 Pa",
        minPressure: 10,
        maxPressure: 50,
        nominalPressure: "Per design",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "67 N",
        doorForceCloserValue: 67,
        scenarios: [
          { name: "All Doors Closed", pressure: "10-50 Pa", required: true },
          { name: "Lobby Integrity", pressure: "Per design", required: true },
        ],
      },
      class_f: {
        name: "Class F",
        title: "Protected Lift Shaft",
        description: "Pressurizes lift shaft to prevent smoke spread",
        pressureRange: "25-50 Pa",
        minPressure: 25,
        maxPressure: 50,
        nominalPressure: "Per design",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "N/A",
        doorForceValue: null,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "All Doors Closed", pressure: "25-50 Pa", required: true },
          { name: "Lift at Ground", pressure: "Per design", required: true },
        ],
      },
    },
  },

  bs_en_12101_6_2022: {
    id: "bs_en_12101_6_2022",
    name: "BS EN 12101-6:2022",
    shortName: "BS EN 12101-6 (Current)",
    year: 2022,
    description: "Smoke and heat control systems - Specification for pressure differential systems (Current Edition)",
    classes: {
      class_a: {
        name: "Class A",
        title: "Firefighting Shaft",
        description: "Maximum smoke protection for firefighting operations",
        pressureRange: "45-60 Pa",
        minPressure: 45,
        maxPressure: 60,
        nominalPressure: "50 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "67 N",
        doorForceCloserValue: 67,
        scenarios: [
          { name: "All Doors Closed", pressure: "45-60 Pa", required: true },
          { name: "Single Door Open", pressure: "≥10 Pa", required: true },
          { name: "Door Force Test", pressure: "≤100 N", required: true },
        ],
        notes: "Current edition - default for new installations"
      },
      class_b: {
        name: "Class B",
        title: "Protected Escape Route",
        description: "Safe evacuation conditions with lower pressure differential",
        pressureRange: "10-25 Pa",
        minPressure: 10,
        maxPressure: 25,
        nominalPressure: "12.5 Pa",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "67 N",
        doorForceCloserValue: 67,
        scenarios: [
          { name: "All Doors Closed", pressure: "10-25 Pa", required: true },
          { name: "Single Door Open", pressure: "≥10 Pa", required: true },
          { name: "Door Force Test", pressure: "≤100 N", required: true },
        ],
      },
      class_c: {
        name: "Class C",
        title: "Smoke Clearance",
        description: "Clears smoke from protected areas after fire event",
        pressureRange: "As designed",
        minPressure: null,
        maxPressure: null,
        nominalPressure: "Per design",
        openDoorMin: "N/A",
        openDoorMinValue: null,
        doorForce: "N/A",
        doorForceValue: null,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "Smoke Extraction Rate", pressure: "Per design", required: true },
          { name: "Air Changes", pressure: "Per design", required: true },
        ],
      },
      class_d: {
        name: "Class D",
        title: "External Air Curtain",
        description: "Air barrier at openings to prevent smoke spread",
        pressureRange: "As designed",
        minPressure: null,
        maxPressure: null,
        nominalPressure: "Per design",
        openDoorMin: "N/A",
        openDoorMinValue: null,
        doorForce: "N/A",
        doorForceValue: null,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "Air Velocity", pressure: "Per design", required: true },
          { name: "Coverage Area", pressure: "Per design", required: true },
        ],
      },
      class_e: {
        name: "Class E",
        title: "Smoke Control Lobby",
        description: "Maintains lobby pressure to prevent smoke ingress",
        pressureRange: "10-50 Pa",
        minPressure: 10,
        maxPressure: 50,
        nominalPressure: "Per design",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "100 N",
        doorForceValue: 100,
        doorForceCloser: "67 N",
        doorForceCloserValue: 67,
        scenarios: [
          { name: "All Doors Closed", pressure: "10-50 Pa", required: true },
          { name: "Lobby Integrity", pressure: "Per design", required: true },
        ],
      },
      class_f: {
        name: "Class F",
        title: "Protected Lift Shaft",
        description: "Pressurizes lift shaft to prevent smoke spread",
        pressureRange: "25-50 Pa",
        minPressure: 25,
        maxPressure: 50,
        nominalPressure: "Per design",
        openDoorMin: "10 Pa",
        openDoorMinValue: 10,
        doorForce: "N/A",
        doorForceValue: null,
        doorForceCloser: "N/A",
        doorForceCloserValue: null,
        scenarios: [
          { name: "All Doors Closed", pressure: "25-50 Pa", required: true },
          { name: "Lift at Ground", pressure: "Per design", required: true },
        ],
      },
    },
  },
};

export const STANDARD_OPTIONS = Object.values(STANDARD_VERSIONS).map(s => ({
  value: s.id,
  label: s.shortName,
  year: s.year,
  description: s.description,
  supersededBy: s.supersededBy,
}));

export function getClassRequirements(
  standardVersion: StandardVersion, 
  systemClass: SystemClass
): ClassRequirements | null {
  const standard = STANDARD_VERSIONS[standardVersion];
  if (!standard) return null;
  return standard.classes[systemClass] || null;
}

export function getAvailableClasses(standardVersion: StandardVersion): SystemClass[] {
  const standard = STANDARD_VERSIONS[standardVersion];
  if (!standard) return [];
  return Object.keys(standard.classes) as SystemClass[];
}

export function isClassAvailableForStandard(
  standardVersion: StandardVersion, 
  systemClass: SystemClass
): boolean {
  const standard = STANDARD_VERSIONS[standardVersion];
  if (!standard) return false;
  return systemClass in standard.classes;
}
