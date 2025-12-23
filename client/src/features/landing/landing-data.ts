export type WidgetSnapshot = {
  key: string;
  title: string;
  category: string;
  summary: string;
  detail: string;
  items: string[];
  footer: string;
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

export type FoundationItem = {
  title: string;
  description: string;
  example: string;
};

export type ConceptCard = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  surfaceTitle: string;
  surfaceRows: { label: string; value: string }[];
};

export const widgetSnapshots: WidgetSnapshot[] = [
  {
    key: "jobs",
    title: "Jobs",
    category: "Operations",
    summary: "Live queue with SLA timers",
    detail: "9 active, 3 awaiting triage",
    items: [
      "Central Plaza | Fire alarm quarterly test | due 14:00",
      "North Hospital | PDS test | meter check required",
      "Riverfront | Remedial quote | client review",
    ],
    footer: "Owners, clocks, and approvals stay visible.",
  },
  {
    key: "sites",
    title: "Sites",
    category: "Locations",
    summary: "Site stack",
    detail: "3 priority campuses",
    items: [
      "Central Plaza | 4 assets with open findings",
      "Riverfront | 2 audits scheduled",
      "North Hospital | evidence review pending",
    ],
    footer: "Every asset rolls up to a single site record.",
  },
  {
    key: "assets",
    title: "Assets",
    category: "Golden Thread",
    summary: "Critical assets mapped",
    detail: "AOV banks, fire doors, CO2 sensors",
    items: [
      "AOV Bank 12 | calibration due in 18 days",
      "Stairwell Door 3F | retest required",
      "CO2 Sensor S-19 | last service 41 days",
    ],
    footer: "Asset history is never overwritten.",
  },
  {
    key: "schedule",
    title: "Schedule",
    category: "Planning",
    summary: "Week view",
    detail: "Conflicts surfaced early",
    items: [
      "Mon 09:00 | Central Plaza | 2 engineers",
      "Tue 13:30 | Riverfront | forms pack",
      "Thu 08:00 | North Hospital | meter allocation",
    ],
    footer: "Plans stay linked to evidence requirements.",
  },
  {
    key: "forms",
    title: "Forms",
    category: "Evidence",
    summary: "Repeat-per-asset packs",
    detail: "nSHEV, PDS, air quality",
    items: [
      "Stairwell A | 12 checks remaining",
      "Smoke shaft 2 | meter linked",
      "CO2 audit | evidence pack ready",
    ],
    footer: "Rules stay readable and reviewable.",
  },
  {
    key: "defects",
    title: "Defects",
    category: "Quality",
    summary: "Findings with lineage",
    detail: "4 open, 1 quoted, 1 remedial",
    items: [
      "Door closer drift | linked to report 21-118",
      "Damper response delay | meter log attached",
      "AOV actuator noise | evidence review",
    ],
    footer: "Every defect links to its source evidence.",
  },
  {
    key: "reports",
    title: "Reports",
    category: "Audit",
    summary: "Export queue",
    detail: "3 ready, 1 awaiting sign-off",
    items: [
      "Central Plaza | signed by engineer",
      "North Hospital | pending reviewer",
      "Riverfront | revision 2 ready",
    ],
    footer: "Revisions preserve the original record.",
  },
];

export const storySteps: StoryStep[] = [
  {
    id: "job",
    title: "Job captured",
    description: "Requests enter as structured jobs with owner, SLA, and scope set before work starts.",
    inlineNote: "Every change is timestamped and attributed.",
  },
  {
    id: "form",
    title: "Forms prepared",
    description: "Module-aware forms assemble per asset without hiding the rules or the checklist logic.",
    inlineNote: "Evidence prompts make the required proof explicit.",
  },
  {
    id: "instrument",
    title: "Instruments linked",
    description: "Meters and calibration dates are validated before data entry to protect provenance.",
    inlineNote: "Overrides are allowed but logged with rationale.",
  },
  {
    id: "report",
    title: "Report compiled",
    description: "Findings compile into reports with linked photos, readings, and sign-off trails.",
    inlineNote: "Edits create a new revision, not a silent overwrite.",
  },
  {
    id: "defect",
    title: "Defect traced",
    description: "Defects inherit context from the report with asset lineage and evidence snapshots.",
    inlineNote: "Statuses are human-approved, not auto-promoted.",
  },
  {
    id: "quote",
    title: "Quote issued",
    description: "Quotes pull from defects so scope and evidence stay aligned without retyping.",
    inlineNote: "Finance views show agreed, pending, and billable work clearly.",
  },
  {
    id: "remedial",
    title: "Remedial job scheduled",
    description: "Approved quotes become remedial jobs with linked forms and timelines.",
    inlineNote: "Schedule and evidence reuse the same Golden Thread ID.",
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
    description: "Calm board with live statuses and quick pop-outs for audits.",
    widgets: ["Compliance snapshot", "Golden Thread timeline", "Upcoming schedule", "Defects to remedials"],
    actions: ["Pop-out to side screen", "Expand without losing context"],
  },
  {
    name: "Engineer Day View",
    description: "Field-ready widget stack for on-site use: forms, meters, notes.",
    widgets: ["Job pack", "Forms queue", "Instrument checks", "Report preview"],
    actions: ["Send to another display", "Calm focus mode"],
  },
];

export const ethosHighlights = [
  "Foundational before clever: the CRM core stays stable while modules orbit it.",
  "Clarity over automation: every suggestion cites the evidence source.",
  "Evidence-first compliance: Golden Thread IDs link jobs, forms, and reports.",
  "Human judgment stays in the loop: insights are optional and explainable.",
];

export const foundationItems: FoundationItem[] = [
  {
    title: "Jobs",
    description: "Scope, owner, SLA, and status in one place.",
    example: "Job #1432 | North Hospital | quarterly test",
  },
  {
    title: "Sites",
    description: "Physical locations with all linked assets and history.",
    example: "Central Plaza | 14 assets | 3 open findings",
  },
  {
    title: "Assets",
    description: "Serialized equipment with calibration and evidence lineage.",
    example: "AOV Bank 12 | calibration due | report 21-118",
  },
  {
    title: "People",
    description: "Roles, approvals, and accountability mapped to work.",
    example: "Engineer, reviewer, client sign-off",
  },
  {
    title: "History",
    description: "Every edit is versioned, never overwritten.",
    example: "Revision 2 created from inspection update",
  },
];

export const conceptCards: ConceptCard[] = [
  {
    id: "truth-layer",
    title: "CRM truth layer",
    description: "Jobs, sites, assets, and people are the system of record before any automation.",
    tags: ["Jobs", "Sites", "Assets", "People"],
    surfaceTitle: "Truth layer view",
    surfaceRows: [
      { label: "Job #1432", value: "Quarterly test | due 14:00" },
      { label: "Site", value: "North Hospital | 4 assets" },
      { label: "Owner", value: "C. Patel | reviewer assigned" },
    ],
  },
  {
    id: "evidence-spine",
    title: "Evidence spine",
    description: "Every form, photo, reading, and report stays linked to its origin.",
    tags: ["Photos", "Readings", "Forms", "Reports"],
    surfaceTitle: "Evidence timeline",
    surfaceRows: [
      { label: "Meter reading", value: "AOV Bank 12 | 38 Pa" },
      { label: "Photo", value: "Damper response | 12:41" },
      { label: "Report", value: "Revision 2 | signed" },
    ],
  },
  {
    id: "golden-thread",
    title: "Golden Thread UI",
    description: "Operators see why a status exists and which evidence supports it.",
    tags: ["Lineage", "Traceability", "Review"],
    surfaceTitle: "Golden Thread card",
    surfaceRows: [
      { label: "Defect", value: "Door closer drift" },
      { label: "Evidence", value: "Report 21-118 | photo set" },
      { label: "Status", value: "Pending approval" },
    ],
  },
  {
    id: "module-gating",
    title: "Module gating",
    description: "Modules attach to the same foundation, with explicit boundaries.",
    tags: ["Modules", "Permissions", "Scope"],
    surfaceTitle: "Module gate",
    surfaceRows: [
      { label: "Smoke Control", value: "Enabled for North Hospital" },
      { label: "Finance", value: "Read-only for ops" },
      { label: "Scheduling", value: "Enabled with conflicts" },
    ],
  },
];
