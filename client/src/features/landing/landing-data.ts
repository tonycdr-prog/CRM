export type WidgetSnapshot = {
  key: string;
  title: string;
  category: string;
  summary: string;
  detail: string;
};

export type StoryStep = {
  id: string;
  title: string;
  description: string;
  inlineNote: string;
};

export type ModuleCard = {
  name: string;
  description: string;
  evidence: string;
  outcome: string;
};

export type WorkspaceDemo = {
  name: string;
  description: string;
  widgets: string[];
  actions: string[];
};

export const widgetSnapshots: WidgetSnapshot[] = [
  {
    key: "jobs",
    title: "Jobs",
    category: "Operations",
    summary: "Live queue with SLA timers",
    detail: "9 active | 3 awaiting triage",
  },
  {
    key: "sites",
    title: "Sites",
    category: "Locations",
    summary: "Site stack",
    detail: "Central Plaza, Riverfront, North Hospital",
  },
  {
    key: "assets",
    title: "Assets",
    category: "Golden Thread",
    summary: "Critical assets mapped",
    detail: "AOV banks | Fire doors | CO2 sensors",
  },
  {
    key: "schedule",
    title: "Schedule",
    category: "Planning",
    summary: "Week view",
    detail: "Balanced load, conflicts surfaced",
  },
  {
    key: "forms",
    title: "Forms",
    category: "Evidence",
    summary: "Repeat-per-asset packs",
    detail: "nSHEV, PDS, Air quality",
  },
  {
    key: "defects",
    title: "Defects",
    category: "Quality",
    summary: "Findings with lineage",
    detail: "4 open | 1 in quote | 1 remedial",
  },
  {
    key: "reports",
    title: "Reports",
    category: "Audit",
    summary: "Export queue",
    detail: "3 ready | 1 awaiting sign-off",
  },
];

export const storySteps: StoryStep[] = [
  {
    id: "job",
    title: "Job captured",
    description: "Request enters the Golden Thread as a calm, structured job shell with SLA clocks visible.",
    inlineNote: "Roles stay clear — owner, reviewer, and due date are fixed upfront.",
  },
  {
    id: "form",
    title: "Forms prepared",
    description: "Module-aware forms and repeat-per-asset packs assemble automatically without hiding the rules.",
    inlineNote: "Evidence prompts show what must be gathered before leaving site.",
  },
  {
    id: "instrument",
    title: "Instruments linked",
    description: "Meters and calibration dates are checked before data entry, keeping provenance intact.",
    inlineNote: "Operator judgment remains—overrides are logged with rationale.",
  },
  {
    id: "report",
    title: "Report compiled",
    description: "Findings render into a concise report with linked photos, readings, and sign-off trail.",
    inlineNote: "Exports stay audit-stable; edits create a new revision instead of mutating history.",
  },
  {
    id: "defect",
    title: "Defect traced",
    description: "Issues flow from the report into defects with exact asset context and evidence snapshots.",
    inlineNote: "Confidence badges are advisory only—humans approve the status change.",
  },
  {
    id: "quote",
    title: "Quote issued",
    description: "Quotes draw directly from defects, so scope and evidence stay aligned without retyping.",
    inlineNote: "Finance views stay readable: what’s agreed, what’s pending, what’s billable now.",
  },
  {
    id: "remedial",
    title: "Remedial job scheduled",
    description: "Approved quotes become remedial jobs with reused forms and linked timelines.",
    inlineNote: "Schedule, forms, and assets reuse the same Golden Thread ID for audit continuity.",
  },
];

export const moduleCards: ModuleCard[] = [
  {
    name: "Smoke Control",
    description: "nSHEV and PDS workflows with pressure, opening time, and control validation.",
    evidence: "Metered pressure logs, AOV timings, controller event history",
    outcome: "EN 12101-ready report with remediation chain",
  },
  {
    name: "Passive Fire Protection",
    description: "Door sets, compartmentation, and seal inspections with photo evidence packs.",
    evidence: "Door gap gauges, seal condition photos, closer force checks",
    outcome: "Actionable defect register with approved remedial scopes",
  },
  {
    name: "Fire Alarms",
    description: "Cause-and-effect validation with zone coverage and sound pressure sampling.",
    evidence: "Loop tester results, SPL readings, battery capacity logs",
    outcome: "Signed cause-and-effect matrix with traceable tests",
  },
  {
    name: "HVAC",
    description: "Air handling and comfort audits with airflow and CO2 lineage preserved.",
    evidence: "Airflow differentials, CO2 sensor drift, filter pressure drop",
    outcome: "Indoor air quality summary with calibration chain",
  },
  {
    name: "Water Quality",
    description: "Sampling schedules, flushing evidence, and temperature checks for safety files.",
    evidence: "Sample IDs, temperature logs, chain-of-custody notes",
    outcome: "Water safety file updates with unresolved risks highlighted",
  },
  {
    name: "BMS",
    description: "Trend snapshots and alarm flows pulled into the same audit spine.",
    evidence: "Alarm histories, setpoint deltas, operator notes",
    outcome: "BMS variance digest with linked remedial jobs",
  },
  {
    name: "Finance",
    description: "Operational finance views aligned to defects, quotes, and remedials.",
    evidence: "Quote lineage, invoice status, approvals trail",
    outcome: "Cashflow clarity without breaking the Golden Thread",
  },
  {
    name: "Scheduling",
    description: "Conflict-aware planning for engineers, forms, and calibrated instruments.",
    evidence: "Capacity view, travel heuristics, conflict notes",
    outcome: "Shift plans that stay in sync with evidence requirements",
  },
  {
    name: "Forms & Entities",
    description: "Structured templates tuned to assets and compliance rules.",
    evidence: "Per-asset packs, auto-calcs, validation notes",
    outcome: "Submission certainty before reports are built",
  },
];

export const workspaceDemos: WorkspaceDemo[] = [
  {
    name: "Compliance Control Room",
    description: "MacOS-style calm board with live statuses and quick pop-outs for audits.",
    widgets: ["Compliance snapshot", "Golden Thread timeline", "Upcoming schedule", "Defects to remedials"],
    actions: ["Pop-out to side screen", "Expand without losing context"],
  },
  {
    name: "Engineer Day View",
    description: "Tactile widget stack for on-site use — forms, meters, and notes in one view.",
    widgets: ["Job pack", "Forms queue", "Instrument checks", "Report preview"],
    actions: ["Send to another display", "Calm focus mode"],
  },
];

export const ethosHighlights = [
  "Foundational before clever — CRM core stays stable while modules orbit it.",
  "Clarity over automation — every suggestion cites the evidence source.",
  "Evidence-first compliance — Golden Thread IDs link jobs, forms, and reports.",
  "Human judgment stays in the loop — insights are optional and explainable.",
];
