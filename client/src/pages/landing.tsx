
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Layers,
  Maximize2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type WidgetMeta = {
  key: string;
  title: string;
  subtitle: string;
  className?: string;
};

type ModuleDemoTerms = {
  label: string;
  jobLabel: string;
  assets: string[];
  forms: string[];
  instruments: string[];
  defects: string[];
  complianceNote: string;
};

const WIDGETS: WidgetMeta[] = [
  {
    key: "timeline",
    title: "Golden Thread Timeline",
    subtitle: "Linked evidence trail",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    key: "schedule",
    title: "Schedule Snapshot",
    subtitle: "Next 7 days",
  },
  {
    key: "compliance",
    title: "Compliance Snapshot",
    subtitle: "Risks + gaps",
  },
  {
    key: "assets",
    title: "Assets by Site",
    subtitle: "Top locations",
  },
  {
    key: "pipeline",
    title: "Defects to Remedials",
    subtitle: "Pipeline health",
    className: "md:col-span-2",
  },
  {
    key: "forms",
    title: "Forms and Evidence",
    subtitle: "Test packs + meters",
  },
  {
    key: "finance",
    title: "Finance Mini",
    subtitle: "Overdue + uninvoiced",
  },
  {
    key: "modules",
    title: "Module Selector",
    subtitle: "Turn on what matters",
  },
  {
    key: "activity",
    title: "Activity Feed",
    subtitle: "Live ops updates",
  },
];

const MODULE_DEMO_OPTIONS: ModuleDemoTerms[] = [
  {
    label: "Smoke Control",
    jobLabel: "Smoke Control Callout",
    assets: ["AOV bank - Atrium", "SHEV fan set", "Pressure staircase"],
    forms: ["nSHEV inspection pack", "PDS pressure test", "Power supply checks"],
    instruments: ["Differential meter 8824", "Anemometer A10", "Battery tester BT-7"],
    defects: ["Opening time exceeds 60s", "Fan current drift", "Control response delay"],
    complianceNote: "Audit export ready for EN 12101 review.",
  },
  {
    label: "Fire Alarms",
    jobLabel: "Fire Alarm Service",
    assets: ["Panel zones 1-8", "Sounders + beacons", "MCP loop A"],
    forms: ["Weekly test logs", "Cause and effect check", "Battery capacity test"],
    instruments: ["Loop tester LT-4", "Sound meter DB-20", "Battery analyzer B-5"],
    defects: ["Zone 5 device fault", "Sounder output below target", "Battery nearing expiry"],
    complianceNote: "Cause and effect record ready for review.",
  },
  {
    label: "HVAC / Air Quality",
    jobLabel: "Air Quality Audit",
    assets: ["AHU-2 filters", "Duct extract fans", "CO2 sensors"],
    forms: ["Airflow verification", "Filter condition log", "Thermal comfort survey"],
    instruments: ["Airflow meter AF-9", "CO2 meter C200", "Temp probe TP-3"],
    defects: ["Filter pressure drop high", "CO2 sensor drift", "AHU fan belt wear"],
    complianceNote: "Indoor air quality summary compiled.",
  },
  {
    label: "Water Quality",
    jobLabel: "Water Quality Sampling",
    assets: ["Hot water riser 3", "Cooling tower loop", "TMV cluster"],
    forms: ["Temperature log", "Legionella sample record", "Flushing evidence pack"],
    instruments: ["Digital thermometer DT-6", "Flow meter FM-2", "Sample kit LK-1"],
    defects: ["Temp below threshold", "Sample overdue", "Valve leakage noted"],
    complianceNote: "Water safety file updated and ready.",
  },
  {
    label: "Passive Fire",
    jobLabel: "Passive Fire Inspection",
    assets: ["Fire doors - level 4", "Compartment seals", "Fire stopping locations"],
    forms: ["Door inspection checklist", "Seal integrity survey", "Photo evidence pack"],
    instruments: ["Gap gauge GG-2", "Moisture meter MM-1", "Thermal camera TC-8"],
    defects: ["Door closer misaligned", "Seal damage found", "Penetration unsealed"],
    complianceNote: "Inspection bundle ready for approval.",
  },
];

const MODULE_SECTIONS = [
  {
    title: "Core",
    description: "Foundational CRM and audit spine.",
    items: [
      {
        name: "CRM Core",
        description: "Jobs, sites, assets, people, and history as first-class truths.",
        examples: ["Job packs", "Asset registers", "Activity timelines"],
      },
      {
        name: "Timeline and Audit",
        description: "Golden Thread evidence trail with linked context.",
        examples: ["Evidence trails", "Compliance snapshots", "Export logs"],
      },
    ],
  },
  {
    title: "Operations",
    description: "Execution layers that adapt to each module.",
    items: [
      {
        name: "Scheduling",
        description: "Drag-drop planning with conflict warnings.",
        examples: ["Capacity view", "Shift duplication", "Travel heuristics"],
      },
      {
        name: "Forms and Entities",
        description: "Structured templates with repeat-per-asset packs.",
        examples: ["Inspection packs", "Auto-calcs", "Rules engine"],
      },
      {
        name: "Reporting",
        description: "Structured outputs with linked evidence.",
        examples: ["Executive summary", "Defects register", "PDF exports"],
      },
      {
        name: "Defects and Remedials",
        description: "Track issues through quotes and remediation.",
        examples: ["Defect chain", "Quote tracking", "Remedial jobs"],
      },
      {
        name: "Finance",
        description: "Quotes, invoices, and outstanding balances.",
        examples: ["Uninvoiced value", "Overdue alerts", "Pipeline status"],
      },
    ],
  },
  {
    title: "Industry Modules",
    description: "Turn on specialist domains without changing the core.",
    items: [
      {
        name: "Smoke Control",
        description: "Smoke ventilation testing and compliance packs.",
        examples: ["nSHEV opening time", "PDS pressure test", "EN 12101 refs"],
      },
      {
        name: "Passive Fire",
        description: "Inspections for doors, seals, and compartmentation.",
        examples: ["Door inspections", "Seal integrity", "Photo evidence"],
      },
      {
        name: "Fire Alarms",
        description: "Cause and effect checks with zone tracking.",
        examples: ["Zone tests", "Sounder coverage", "Panel logs"],
      },
      {
        name: "HVAC / Air Quality",
        description: "Service records with air quality evidence.",
        examples: ["CO2 readings", "Airflow checks", "Filter condition"],
      },
      {
        name: "Water Quality",
        description: "Sampling and compliance workflows.",
        examples: ["Legionella samples", "Temperature logs", "TMV checks"],
      },
      {
        name: "BMS",
        description: "Integrations, alarms, and trend monitoring.",
        examples: ["Alarm histories", "Trend snapshots", "Control notes"],
      },
    ],
  },
];

const MOCK_WIDGET_DATA = {
  timeline: [
    { label: "Job created", meta: "Central Plaza - 09:12" },
    { label: "Form pack generated", meta: "AOV + PDS" },
    { label: "Meter linked", meta: "Cal valid until 2025-06-01" },
    { label: "Defect raised", meta: "Opening time 68s" },
    { label: "Quote issued", meta: "Awaiting approval" },
  ],
  schedule: [
    { day: "Mon", slots: 3 },
    { day: "Tue", slots: 5 },
    { day: "Wed", slots: 4 },
    { day: "Thu", slots: 2 },
    { day: "Fri", slots: 6 },
    { day: "Sat", slots: 1 },
    { day: "Sun", slots: 0 },
  ],
  compliance: [
    { label: "Assets overdue", value: 12, tone: "text-amber-600" },
    { label: "Open defects", value: 8, tone: "text-rose-600" },
    { label: "Calibrations due", value: 5, tone: "text-amber-600" },
    { label: "Audit packs ready", value: 14, tone: "text-emerald-600" },
  ],
  assets: [
    { site: "Central Plaza", count: 42 },
    { site: "North Hospital", count: 33 },
    { site: "Riverfront Tower", count: 27 },
    { site: "City Station", count: 21 },
  ],
  pipeline: {
    defects: 12,
    quotes: 6,
    remedials: 4,
    reports: 18,
  },
  forms: {
    packs: 7,
    assets: 24,
    meter: "DP-8824",
    calibration: "Valid to 2025-06-01",
  },
  finance: {
    uninvoiced: "24.8k",
    overdue: "8.1k",
    dueThisWeek: 6,
  },
  activity: [
    { label: "Engineer check-in", meta: "Site 11 - 6 mins ago" },
    { label: "Report signed", meta: "Central Plaza" },
    { label: "New defect flagged", meta: "Pressure loss warning" },
  ],
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WidgetShell({
  title,
  subtitle,
  updatedAt,
  onRefresh,
  onExpand,
  onPopout,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  updatedAt: Date;
  onRefresh: () => void;
  onExpand: () => void;
  onPopout: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`border-border/60 shadow-sm ${className ?? ""}`}>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <button
              type="button"
              className="rounded-md border border-border/70 p-1 transition hover:text-foreground"
              onClick={onRefresh}
              aria-label={`Refresh ${title}`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded-md border border-border/70 p-1 transition hover:text-foreground"
              onClick={onExpand}
              aria-label={`Expand ${title}`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded-md border border-border/70 p-1 transition hover:text-foreground"
              onClick={onPopout}
              aria-label={`Pop out ${title}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Updated {formatTime(updatedAt)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
export default function Landing() {
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [refreshTimes, setRefreshTimes] = useState<Record<string, Date>>(() =>
    Object.fromEntries(WIDGETS.map((widget) => [widget.key, new Date()])),
  );
  const [selectedModule, setSelectedModule] = useState(MODULE_DEMO_OPTIONS[0].label);
  const [activeStoryStep, setActiveStoryStep] = useState(0);
  const [popoutKey, setPopoutKey] = useState<string | null>(null);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setPopoutKey(params.get("widget"));
  }, []);

  const selectedModuleTerms = useMemo(
    () => MODULE_DEMO_OPTIONS.find((option) => option.label === selectedModule) ?? MODULE_DEMO_OPTIONS[0],
    [selectedModule],
  );

  const storySteps = useMemo(() => {
    return [
      {
        title: "Job request arrives",
        description: "Inbound request captured and staged as a draft job.",
        panel: (
          <div className="space-y-4">
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Inbound email</span>
                  <span>09:12</span>
                </div>
                <div className="mt-3 text-sm font-medium">
                  {selectedModuleTerms.jobLabel}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Request logged, draft job created, awaiting triage.
                </p>
              </CardContent>
            </Card>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              New job created - SLA clock started.
            </div>
          </div>
        ),
      },
      {
        title: "Assets pulled into job pack",
        description: "Assets linked automatically based on site + system type.",
        panel: (
          <div className="space-y-3">
            {selectedModuleTerms.assets.map((asset) => (
              <div key={asset} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span>{asset}</span>
                <Badge variant="outline">linked</Badge>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: "Forms auto-prepared",
        description: "Repeat-per-asset packs ready with rules preloaded.",
        panel: (
          <div className="space-y-3">
            {selectedModuleTerms.forms.map((form) => (
              <div key={form} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                <span>{form}</span>
                <span className="text-xs text-muted-foreground">draft</span>
              </div>
            ))}
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Rules loaded - compliance checks ready.
            </div>
          </div>
        ),
      },
      {
        title: "Instruments linked",
        description: "Meters, calibration dates, and engineer assignments locked in.",
        panel: (
          <div className="space-y-3">
            {selectedModuleTerms.instruments.map((meter) => (
              <div key={meter} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span>{meter}</span>
                <span className="text-xs text-emerald-700">cal valid</span>
              </div>
            ))}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Calibration verified before submission.
            </div>
          </div>
        ),
      },
      {
        title: "Report and defect chain",
        description: "Findings flow into quotes and remedial jobs.",
        panel: (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-3 text-xs">
              <div className="font-semibold text-muted-foreground">Defects</div>
              <ul className="mt-2 space-y-1 text-sm">
                {selectedModuleTerms.defects.map((defect) => (
                  <li key={defect}>{defect}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border bg-card p-3 text-xs">
              <div className="font-semibold text-muted-foreground">Quotes</div>
              <div className="mt-3 text-sm">2 open proposals</div>
            </div>
            <div className="rounded-lg border bg-card p-3 text-xs">
              <div className="font-semibold text-muted-foreground">Remedials</div>
              <div className="mt-3 text-sm">1 job scheduled</div>
            </div>
          </div>
        ),
      },
      {
        title: "Compliance snapshot updated",
        description: "Evidence compiled and ready for audit review.",
        panel: (
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-2 text-lg font-semibold">Audit export ready</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedModuleTerms.complianceNote}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Evidence chain complete for this cycle.
            </div>
          </div>
        ),
      },
    ];
  }, [selectedModuleTerms]);

  useEffect(() => {
    if (!stepRefs.current.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.getAttribute("data-step"));
          if (!Number.isNaN(index)) {
            setActiveStoryStep(index);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0.1 },
    );

    stepRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [storySteps.length]);

  const widgetContent = (key: string, expanded = false) => {
    switch (key) {
      case "timeline":
        return (
          <div className="space-y-3">
            {MOCK_WIDGET_DATA.timeline.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.meta}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
            {expanded && (
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                Linked evidence maintained across jobs, defects, and reports.
              </div>
            )}
          </div>
        );
      case "schedule":
        return (
          <div className="flex items-end gap-3">
            {MOCK_WIDGET_DATA.schedule.map((slot) => (
              <div key={slot.day} className="text-center text-xs">
                <div className="h-16 w-6 rounded-full bg-muted/70 relative overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full rounded-full bg-primary/70"
                    style={{ height: `${slot.slots * 12}px` }}
                  />
                </div>
                <div className="mt-2 text-muted-foreground">{slot.day}</div>
              </div>
            ))}
          </div>
        );
      case "compliance":
        return (
          <div className="grid grid-cols-2 gap-3">
            {MOCK_WIDGET_DATA.compliance.map((item) => (
              <div key={item.label} className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className={`text-xl font-semibold ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>
        );
      case "assets":
        return (
          <div className="space-y-2">
            {MOCK_WIDGET_DATA.assets.map((item) => (
              <div key={item.site} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span>{item.site}</span>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
          </div>
        );
      case "pipeline":
        return (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Defects", value: MOCK_WIDGET_DATA.pipeline.defects },
              { label: "Quotes", value: MOCK_WIDGET_DATA.pipeline.quotes },
              { label: "Remedials", value: MOCK_WIDGET_DATA.pipeline.remedials },
              { label: "Reports", value: MOCK_WIDGET_DATA.pipeline.reports },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-card p-3 text-center">
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="text-xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        );
      case "forms":
        return (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span>Active packs</span>
              <span className="font-semibold">{MOCK_WIDGET_DATA.forms.packs}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span>Assets covered</span>
              <span className="font-semibold">{MOCK_WIDGET_DATA.forms.assets}</span>
            </div>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              Meter {MOCK_WIDGET_DATA.forms.meter} - {MOCK_WIDGET_DATA.forms.calibration}
            </div>
          </div>
        );
      case "finance":
        return (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border bg-card px-3 py-2">
              <div className="text-xs text-muted-foreground">Uninvoiced</div>
              <div className="text-xl font-semibold">£{MOCK_WIDGET_DATA.finance.uninvoiced}</div>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <div className="text-xs text-muted-foreground">Overdue</div>
              <div className="text-xl font-semibold text-rose-600">£{MOCK_WIDGET_DATA.finance.overdue}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {MOCK_WIDGET_DATA.finance.dueThisWeek} invoices due this week.
            </div>
          </div>
        );
      case "modules":
        return <ModuleSelectorWidget />;
      case "activity":
        return (
          <div className="space-y-2">
            {MOCK_WIDGET_DATA.activity.map((item) => (
              <div key={item.label} className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.meta}</div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const activeWidgetMeta = WIDGETS.find((widget) => widget.key === expandedWidget);
  const activeWidgetContent = expandedWidget ? widgetContent(expandedWidget, true) : null;

  if (popoutKey) {
    const widgetMeta = WIDGETS.find((widget) => widget.key === popoutKey);
    if (!widgetMeta) {
      return null;
    }
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pop-out widget</p>
              <h1 className="font-serif text-2xl font-semibold">{widgetMeta.title}</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.close();
                }
              }}
            >
              Close
            </Button>
          </div>
          <Card className="border-border/60">
            <CardContent className="pt-6">{widgetContent(popoutKey, true)}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Deucalion
              </div>
              <div className="font-serif text-lg font-semibold">Widget-first CRM</div>
            </div>
          </div>
          <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            <a href="#hero" className="hover:text-foreground">Overview</a>
            <a href="#story" className="hover:text-foreground">Golden Thread</a>
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#cta" className="hover:text-foreground">Access</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <a href="/api/login">Sign in</a>
            </Button>
            <Button asChild>
              <a href="#cta">Request access</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section
          id="hero"
          className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top,_rgba(20,94,117,0.18),_transparent_55%)]"
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_1.4fr] lg:py-24">
            <div className="space-y-6">
              <Badge variant="outline" className="text-xs uppercase tracking-[0.3em]">
                Calm systems for critical work
              </Badge>
              <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
                A live dashboard for compliance, not a pile of reports.
              </h1>
              <p className="text-lg text-muted-foreground">
                Deucalion keeps the CRM core stable while modules handle scheduling,
                forms, reporting, and compliance. Evidence stays connected, work stays calm.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <a href="#cta">
                    Request early access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#story">Watch the Golden Thread</a>
                </Button>
              </div>
              <div className="grid gap-4 pt-6 sm:grid-cols-2">
                {[
                  { label: "Evidence-first compliance", icon: FileCheck2 },
                  { label: "Modules you can toggle", icon: Layers },
                  { label: "CRM core always stable", icon: ClipboardCheck },
                  { label: "Human judgment stays in control", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {WIDGETS.map((widget) => (
                <WidgetShell
                  key={widget.key}
                  title={widget.title}
                  subtitle={widget.subtitle}
                  updatedAt={refreshTimes[widget.key] ?? new Date()}
                  className={widget.className}
                  onRefresh={() =>
                    setRefreshTimes((prev) => ({ ...prev, [widget.key]: new Date() }))
                  }
                  onExpand={() => setExpandedWidget(widget.key)}
                  onPopout={() => {
                    if (typeof window === "undefined") return;
                    const path = window.location.pathname || "/landing";
                    const nextUrl = `${path}?widget=${widget.key}`;
                    window.open(nextUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  {widgetContent(widget.key)}
                </WidgetShell>
              ))}
            </div>
          </div>
        </section>

        <section id="story" ref={storyRef} className="border-b border-border/60 bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <Badge variant="outline" className="text-xs uppercase tracking-[0.3em]">
                  Story mode
                </Badge>
                <h2 className="font-serif text-3xl font-semibold md:text-4xl">
                  Watch the Golden Thread build itself
                </h2>
                <p className="text-muted-foreground">
                  Scroll to see how evidence connects from request to audit-ready output.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border bg-background px-3 py-2 text-xs">
                  Module demo
                </div>
                <select
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={selectedModule}
                  onChange={(event) => setSelectedModule(event.target.value)}
                >
                  {MODULE_DEMO_OPTIONS.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => storyRef.current?.scrollIntoView({ behavior: "smooth" })}
                >
                  Replay
                </Button>
              </div>
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-border/70 bg-background shadow-lg">
                <div className="flex items-center justify-between border-b px-4 py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <div>Deucalion preview</div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" />
                    Live
                  </div>
                </div>
                <div className="p-6">
                  {storySteps[activeStoryStep]?.panel}
                </div>
              </div>

              <div className="space-y-6">
                {storySteps.map((step, index) => (
                  <div
                    key={step.title}
                    ref={(el) => {
                      stepRefs.current[index] = el;
                    }}
                    data-step={index}
                    className={`rounded-2xl border p-5 transition ${
                      activeStoryStep === index
                        ? "border-primary/60 bg-background shadow-md"
                        : "border-border/60 bg-background/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/40 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-base font-semibold">{step.title}</div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="modules" className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="space-y-4 text-center">
              <Badge variant="outline" className="text-xs uppercase tracking-[0.3em]">
                Modules
              </Badge>
              <h2 className="font-serif text-3xl font-semibold md:text-4xl">
                CRM core with industry modules
              </h2>
              <p className="text-muted-foreground">
                Switch modules on without changing how the core operates.
              </p>
            </div>

            <div className="mt-12 space-y-12">
              {MODULE_SECTIONS.map((section) => (
                <div key={section.title}>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((item) => (
                      <Card key={item.name} className="border-border/60">
                        <CardHeader className="space-y-2">
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {item.examples.map((example) => (
                              <Badge key={example} variant="secondary">
                                {example}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Task structures can align with SFG20-style schedules.
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <Card className="border-border/70 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.18),_transparent_60%)]">
              <CardContent className="grid gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div>
                  <h2 className="font-serif text-3xl font-semibold">
                    Ready for calm, connected compliance?
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Join the early access group and help shape the modules that matter to your team.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button size="lg" asChild>
                      <a href="/api/login">
                        Request early access
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a href="#hero">View demo</a>
                    </Button>
                  </div>
                </div>
                <div className="space-y-4 rounded-2xl border border-border/70 bg-background/90 p-5 text-sm">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Book a walkthrough tailored to your module stack.
                  </div>
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="h-5 w-5 text-primary" />
                    See how evidence stays linked across reports and remedials.
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Keep judgment in the loop with transparent insights.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Deucalion</div>
            <div className="font-serif text-lg font-semibold">Evidence-first operations</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Modular operations platform for compliance-driven teams.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#story" className="hover:text-foreground">Golden Thread</a>
            <a href="#cta" className="hover:text-foreground">Request access</a>
          </div>
        </div>
      </footer>

      <Dialog open={!!expandedWidget} onOpenChange={(open) => !open && setExpandedWidget(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{activeWidgetMeta?.title}</DialogTitle>
          </DialogHeader>
          {activeWidgetContent}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModuleSelectorWidget() {
  const [activeModules, setActiveModules] = useState<string[]>([
    "Smoke Control",
    "Fire Alarms",
  ]);

  const modules = [
    "Smoke Control",
    "Passive Fire",
    "Fire Alarms",
    "HVAC / Air Quality",
    "Water Quality",
    "BMS",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {modules.map((module) => {
        const isActive = activeModules.includes(module);
        return (
          <button
            key={module}
            type="button"
            onClick={() =>
              setActiveModules((prev) =>
                prev.includes(module)
                  ? prev.filter((item) => item !== module)
                  : [...prev, module],
              )
            }
            className={`rounded-full border px-3 py-1 text-xs transition ${
              isActive ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-muted-foreground"
            }`}
          >
            {module}
          </button>
        );
      })}
    </div>
  );
}
