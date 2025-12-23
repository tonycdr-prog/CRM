import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useViewMode } from "@/hooks/useViewMode";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/routes";
import { getModulesList, MODULE_NAV } from "@/lib/modules";
import { MODULES, type ModuleId } from "@shared/modules";
import { buildLayoutWithSidebarWidget } from "@shared/sidebarWidgets";
import {
  LayoutDashboard,
  Wind,
  Briefcase,
  BarChart3,
  LogOut,
  Building2,
  ClipboardList,
  Settings,
  HardDrive,
  Smartphone,
  Plus,
  Eye,
  Calendar,
  Waves,
  Flame,
  Droplets,
  Thermometer,
  Activity,
  DollarSign,
  FileText,
  Users,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useModules } from "@/hooks/use-modules";
import {
  clearModuleOverride,
  loadModuleOverrides,
  onModuleOverridesChanged,
  setModuleOverride,
  type ModuleOverrideMap,
} from "@/lib/module-overrides";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AppLayoutProps {
  children: React.ReactNode;
  isOrgAdmin?: boolean;
}

interface JourneyMenuItem {
  title: string;
  description: string;
  url: string;
  icon: any;
}

interface CoreNavItem {
  title: string;
  description: string;
  url: string;
  icon: any;
  testId: string;
}

interface ModuleNavItem {
  id: string;
  label: string;
  description: string;
  moduleId?: ModuleId;
  links: { title: string; path: string; hint: string }[];
}

interface SystemNavItem {
  title: string;
  description: string;
  url: string;
  icon: any;
}

const journeyMenuItems: JourneyMenuItem[] = [
  {
    title: "Dashboard",
    description: "Your at-a-glance view",
    url: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    title: "Work",
    description: "Plan & manage jobs and visits",
    url: ROUTES.HUB_WORK,
    icon: Briefcase,
  },
  {
    title: "Forms",
    description: "Inspect, test, and record results",
    url: ROUTES.HUB_FORMS,
    icon: ClipboardList,
  },
  {
    title: "Customers",
    description: "Sites, access, and contracts",
    url: ROUTES.HUB_CUSTOMERS,
    icon: Building2,
  },
  {
    title: "Reports",
    description: "Performance and compliance outputs",
    url: ROUTES.HUB_REPORTS,
    icon: BarChart3,
  },
  {
    title: "Manage",
    description: "People, assets, system settings",
    url: ROUTES.HUB_MANAGE,
    icon: Settings,
  },
];

const coreNavItems: CoreNavItem[] = [
  {
    title: "Dashboard",
    description: "Operational overview",
    url: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    testId: "nav-dashboard",
  },
  {
    title: "Jobs",
    description: "Core work queue",
    url: ROUTES.JOBS,
    icon: Briefcase,
    testId: "nav-jobs",
  },
  {
    title: "Sites",
    description: "Places and systems",
    url: ROUTES.SITES,
    icon: Building2,
    testId: "nav-sites",
  },
  {
    title: "Assets",
    description: "Equipment and checks",
    url: ROUTES.SITE_ASSETS,
    icon: HardDrive,
    testId: "nav-assets",
  },
  {
    title: "People",
    description: "Teams and roles",
    url: ROUTES.STAFF_DIRECTORY,
    icon: Users,
    testId: "nav-people",
  },
];

// Modules are expressed as composable capabilities with a consistent sub-menu shape
// so the sidebar reads as a workspace assembly, not a list of siloed apps.
const moduleNavStructure: ModuleNavItem[] = [
  {
    id: "smoke-control",
    label: "Smoke Control",
    description: "Evidence-led ventilation and assurance",
    moduleId: MODULES.LIFE_SAFETY,
    links: [
      { title: "Overview", path: ROUTES.DASHBOARD, hint: "Module home" },
      { title: "Assets", path: ROUTES.SITE_ASSETS, hint: "Fans, dampers, AOVs" },
      { title: "Forms / Tests", path: ROUTES.FORMS_RUNNER, hint: "Commissioning + PPM" },
      { title: "Reports", path: ROUTES.REPORTS, hint: "Compliance outputs" },
      { title: "Defects", path: ROUTES.DEFECTS, hint: "Issues and remedials" },
      { title: "History", path: "/service-history", hint: "Golden Thread" },
    ],
  },
  {
    id: "passive-fire",
    label: "Passive Fire",
    description: "Compartments, doors, dampers",
    links: [
      { title: "Overview", path: ROUTES.GOLDEN_THREAD, hint: "Fire strategy anchors" },
      { title: "Assets", path: ROUTES.SITE_ASSETS, hint: "Doorsets and dampers" },
      { title: "Forms / Tests", path: ROUTES.FORMS_RUNNER, hint: "Survey runs" },
      { title: "Reports", path: ROUTES.REPORTS, hint: "Output packs" },
      { title: "Defects", path: ROUTES.DEFECTS, hint: "Track gaps" },
      { title: "History", path: "/service-history", hint: "Change log" },
    ],
  },
  {
    id: "fire-alarms",
    label: "Fire Alarms",
    description: "Detection, notification, traces",
    links: [
      { title: "Overview", path: ROUTES.REPORTS, hint: "Open signals" },
      { title: "Assets", path: ROUTES.SITE_ASSETS, hint: "Panels and loops" },
      { title: "Forms / Tests", path: ROUTES.FORMS_RUNNER, hint: "Weekly / monthly" },
      { title: "Reports", path: ROUTES.REPORTS, hint: "Audit exports" },
      { title: "Defects", path: ROUTES.DEFECTS, hint: "Faults" },
      { title: "History", path: "/service-history", hint: "Signals log" },
    ],
  },
  {
    id: "hvac",
    label: "HVAC",
    description: "Air handling and balance",
    links: [
      { title: "Overview", path: ROUTES.SCHEDULE, hint: "Planned works" },
      { title: "Assets", path: ROUTES.EQUIPMENT, hint: "Plant register" },
      { title: "Forms / Tests", path: ROUTES.FORMS_RUNNER, hint: "PPM runs" },
      { title: "Reports", path: ROUTES.REPORTS, hint: "Performance" },
      { title: "Defects", path: ROUTES.DEFECTS, hint: "Outstanding" },
      { title: "History", path: "/site-health", hint: "Trends" },
    ],
  },
  {
    id: "water-quality",
    label: "Water Quality",
    description: "Sampling, flushing, certificates",
    links: [
      { title: "Overview", path: ROUTES.SCHEDULE, hint: "Programmes" },
      { title: "Assets", path: ROUTES.SITE_ASSETS, hint: "Systems" },
      { title: "Forms / Tests", path: ROUTES.FORMS_RUNNER, hint: "Sampling" },
      { title: "Reports", path: ROUTES.REPORTS, hint: "Results" },
      { title: "Defects", path: ROUTES.DEFECTS, hint: "Actions" },
      { title: "History", path: "/site-health", hint: "Water log" },
    ],
  },
  {
    id: "air-quality",
    label: "Air Quality",
    description: "Sensors, filter changes, comfort",
    links: [
      { title: "Overview", path: ROUTES.SCHEDULE, hint: "Routines" },
      { title: "Assets", path: ROUTES.EQUIPMENT, hint: "Sensors" },
      { title: "Forms / Tests", path: ROUTES.FORMS_RUNNER, hint: "Checks" },
      { title: "Reports", path: ROUTES.REPORTS, hint: "IAQ" },
      { title: "Defects", path: ROUTES.DEFECTS, hint: "Exceptions" },
      { title: "History", path: "/site-health", hint: "Timeline" },
    ],
  },
  {
    id: "bms",
    label: "BMS",
    description: "Control states and overrides",
    links: [
      { title: "Overview", path: ROUTES.DASHBOARD, hint: "Live cards" },
      { title: "Assets", path: ROUTES.EQUIPMENT, hint: "Controllers" },
      { title: "Forms / Tests", path: ROUTES.FORMS_RUNNER, hint: "Sequences" },
      { title: "Reports", path: ROUTES.REPORTS, hint: "Snapshots" },
      { title: "Defects", path: ROUTES.DEFECTS, hint: "Overrides" },
      { title: "History", path: "/site-health", hint: "Trends" },
    ],
  },
  {
    id: "scheduling",
    label: "Scheduling",
    description: "Calendar + constraints",
    moduleId: MODULES.SCHEDULING,
    links: [
      { title: "Calendar", path: ROUTES.SCHEDULE, hint: "Planner" },
      { title: "Gantt", path: ROUTES.SCHEDULE, hint: "Phasing" },
      { title: "Conflicts", path: ROUTES.SCHEDULE, hint: "Resolve clashes" },
      { title: "Unassigned", path: ROUTES.SCHEDULE, hint: "Bucket" },
      { title: "Engineer view", path: ROUTES.FIELD_COMPANION_HOME, hint: "Readiness" },
    ],
  },
  {
    id: "forms-entities",
    label: "Forms & Entities",
    description: "Templates and evidence",
    moduleId: MODULES.FORMS_ENGINE,
    links: [
      { title: "Overview", path: ROUTES.HUB_FORMS, hint: "Hub" },
      { title: "Builder", path: ROUTES.FORMS_BUILDER, hint: "Design" },
      { title: "Runner", path: ROUTES.FORMS_RUNNER, hint: "Capture" },
      { title: "Entities", path: ROUTES.ADMIN_ENTITIES, hint: "Structures" },
      { title: "History", path: ROUTES.GOLDEN_THREAD, hint: "Golden Thread" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Quotes, remedials, invoicing",
    moduleId: MODULES.FINANCE,
    links: [
      { title: "Quotes", path: ROUTES.FINANCE, hint: "Drafts" },
      { title: "Remedials", path: ROUTES.FINANCE, hint: "Costed actions" },
      { title: "Invoicing", path: ROUTES.FINANCE, hint: "Billing" },
      { title: "Pipeline", path: ROUTES.FINANCE, hint: "Forecast" },
      { title: "KPIs", path: ROUTES.PROFITABILITY, hint: "Performance" },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    description: "Outputs and dashboards",
    moduleId: MODULES.REPORTING,
    links: [
      { title: "Overview", path: ROUTES.REPORTS, hint: "Library" },
      { title: "Assets", path: ROUTES.SITE_ASSETS, hint: "Context" },
      { title: "Forms / Tests", path: ROUTES.FORMS_RUNNER, hint: "Sources" },
      { title: "Reports", path: ROUTES.REPORTS, hint: "Render" },
      { title: "Defects", path: ROUTES.DEFECTS, hint: "Traceability" },
    ],
  },
];

const systemNavItems: SystemNavItem[] = [
  {
    title: "Admin",
    description: "Structure and templates",
    url: ROUTES.ADMIN_ENTITIES,
    icon: ShieldCheck,
  },
  {
    title: "Settings",
    description: "Workspace preferences",
    url: ROUTES.SETTINGS,
    icon: Settings,
  },
  {
    title: "Audit / Activity",
    description: "Footprints and state",
    url: ROUTES.ADMIN_USAGE,
    icon: Activity,
  },
  {
    title: "Help",
    description: "Guidance and methods",
    url: ROUTES.DOWNLOADS,
    icon: Sparkles,
  },
];

export function AppLayout({ children, isOrgAdmin }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isEngineerMode, enterCompanionMode, enterOfficeMode } = useViewMode();
  const { role, roleLabel } = usePermissions();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [devStatus, setDevStatus] = useState<
    | {
        isDev: boolean;
        devAuthBypass: boolean;
        devReviewMode: boolean;
        hasDbConnection: boolean;
        limitedMode: boolean;
      }
    | null
  >(null);
  const [moduleBannerDismissed, setModuleBannerDismissed] = useState(false);
  const [moduleOverrides, setModuleOverrides] = useState<ModuleOverrideMap>(loadModuleOverrides());
  const [seedingDemo, setSeedingDemo] = useState(false);
  const { modules: enabledModules } = useModules();
  const hasNotifiedNoDb = useRef(false);
  const devReviewModeEnv =
    (import.meta.env as any).DEV_REVIEW_MODE ??
    (import.meta.env as any).VITE_DEV_REVIEW_MODE ??
    "";
  const devReviewFlag = devReviewModeEnv === "true";
  const devAuthBypassFlag =
    (import.meta.env as any).DEV_AUTH_BYPASS ??
    (import.meta.env as any).VITE_DEV_AUTH_BYPASS ??
    "";
  const showReviewSection = import.meta.env.DEV || import.meta.env.MODE === "development" || devReviewFlag;

  const handleToggleChange = () => {
    if (!isEngineerMode) {
      enterCompanionMode(ROUTES.FIELD_COMPANION_HOME);
    } else {
      enterOfficeMode(ROUTES.DASHBOARD);
    }
  };

  const handleSeedDemo = async () => {
    if (seedingDemo) return;
    setSeedingDemo(true);
    try {
      const response = await fetch("/api/dev/seed-demo", {
        method: "POST",
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        toast({
          title: "Not authorised",
          description: "Auth/CSRF missing — refresh page.",
          variant: "destructive",
        });
        return;
      }

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast({
          title: "Demo seed failed",
          description: payload?.message || response.statusText,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Demo data loaded",
        description: payload?.message || "Sample jobs, templates, and reports are ready.",
      });
    } catch (err: any) {
      toast({
        title: "Demo seed failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSeedingDemo(false);
    }
  };

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  const allModules = getModulesList();
  const bannerModule = enabledModules[0];
  const enabledModuleSet = new Set(enabledModules.map((module) => module.id));
  const moduleOpenStorageKey = "nav-module-open-state";
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCsrfToken(data?.csrfToken ?? null))
      .catch(() => setCsrfToken(null));
  }, [user?.id]);

  useEffect(() => {
    fetch("/api/dev/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDevStatus(data))
      .catch(() => setDevStatus(null));
  }, []);

  useEffect(() => {
    const off = onModuleOverridesChanged(() => setModuleOverrides(loadModuleOverrides()));
    return off;
  }, []);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const dismissed = localStorage.getItem("module-banner-dismissed");
    setModuleBannerDismissed(dismissed === "true");
    const storedOpen = localStorage.getItem(moduleOpenStorageKey);
    if (storedOpen) {
      setOpenModules(JSON.parse(storedOpen));
    }
  }, []);

  const toggleModuleOpen = (moduleId: string, next?: boolean) => {
    setOpenModules((prev) => {
      const nextState = { ...prev, [moduleId]: next ?? !prev[moduleId] };
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(moduleOpenStorageKey, JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const moduleIcon = (moduleId: string) => {
    switch (moduleId) {
      case "smoke-control":
        return Wind;
      case "passive-fire":
        return Flame;
      case "fire-alarms":
        return AlertTriangle;
      case "hvac":
        return Thermometer;
      case "water-quality":
        return Droplets;
      case "air-quality":
        return Activity;
      case "bms":
        return FileText;
      case "scheduling":
        return Calendar;
      case "forms-entities":
        return ClipboardList;
      case "finance":
        return DollarSign;
      case "reporting":
        return BarChart3;
      default:
        return Waves;
    }
  };

  useEffect(() => {
    if (
      devStatus?.devAuthBypass &&
      devStatus.limitedMode &&
      !hasNotifiedNoDb.current
    ) {
      hasNotifiedNoDb.current = true;
      toast({
        title: "DEV_AUTH_BYPASS enabled — database unavailable — limited mode",
        description: "Preview UI is running without backend data; some actions are stubbed.",
      });
    }
  }, [devStatus, toast]);

  const addToDashboard = useMutation({
    mutationFn: async ({ route }: { route: string }) => {
      const layoutResponse = await fetch("/api/dashboard/layout", { credentials: "include" });
      if (!layoutResponse.ok) throw new Error("Failed to load dashboard layout");
      const layoutBody = await layoutResponse.json();
      const existingLayout = layoutBody.layout as
        | { id: string; name: string; items: any[]; isDefault: boolean }
        | null;

      const payload = buildLayoutWithSidebarWidget(route, {
        name: existingLayout?.name,
        items: existingLayout?.items,
      });

      if (!payload) throw new Error("No widget mapping found for this route");

      const method = existingLayout?.id ? "PUT" : "POST";
      const url = existingLayout?.id
        ? `/api/dashboard/layouts/${existingLayout.id}`
        : "/api/dashboard/layouts";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add widget to dashboard");
      return res.json();
    },
    onMutate: ({ route }) => setPendingRoute(route),
    onError: (error) =>
      toast({
        title: "Could not add to dashboard",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      }),
    onSuccess: () => {
      toast({ title: "Added to dashboard", description: "Widget saved to your layout." });
      queryClient.invalidateQueries({ queryKey: ["dashboard-layout"] });
    },
    onSettled: () => setPendingRoute(null),
  });

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Wind className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Deucalion Workspace</h2>
                <p className="text-xs text-muted-foreground">Calm, evidence-led CRM core</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupLabel>Core</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {coreNavItems.map((item) => {
                    const isActive =
                      location === item.url ||
                      location.startsWith(item.url + "/") ||
                      (item.url === ROUTES.DASHBOARD && location === "/");

                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="h-auto py-2"
                        >
                          <Link href={item.url} data-testid={item.testId}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <div className="flex flex-col">
                              <span className="leading-tight">{item.title}</span>
                              <span className="text-xs text-muted-foreground leading-snug">
                                {item.description}
                              </span>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuAction>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Add ${item.title} to dashboard`}
                            data-testid={`add-${item.title.toLowerCase().replace(/\s+/g, '-')}-to-dashboard`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              addToDashboard.mutate({ route: item.url });
                            }}
                            disabled={pendingRoute === item.url && addToDashboard.isPending}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup data-testid="modules-nav-section">
              <SidebarGroupLabel>Modules</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {moduleNavStructure.map((module) => {
                    const enabled = module.moduleId ? enabledModuleSet.has(module.moduleId) : true;
                    const isOpen = openModules[module.id] ?? enabled;

                    const ModuleIcon = moduleIcon(module.id);

                    return (
                      <SidebarMenuItem
                        key={module.id}
                        className="rounded-lg border bg-card/60"
                        data-testid={`nav-module-${module.id}`}
                      >
                        <Collapsible open={isOpen} onOpenChange={(next) => toggleModuleOpen(module.id, next)}>
                          <div className="flex items-center justify-between px-3 py-2">
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex flex-1 items-center justify-start gap-3 text-left"
                              >
                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                                  <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium leading-tight">{module.label}</span>
                                  <span className="text-xs text-muted-foreground leading-snug">
                                    {module.description}
                                  </span>
                                </div>
                              </button>
                            </CollapsibleTrigger>
                            <Badge variant={enabled ? "outline" : "secondary"} className="text-[10px]">
                              {enabled ? "On" : "Off"}
                            </Badge>
                          </div>

                          <CollapsibleContent>
                            <div className="flex flex-col gap-1 px-3 pb-3">
                              {module.links.map((link) => {
                                const isActive =
                                  location === link.path ||
                                  location.startsWith(link.path + "/");
                                return (
                                  <div
                                    key={`${module.id}-${link.path}`}
                                    className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60"
                                  >
                                    <SidebarMenuButton
                                      asChild
                                      isActive={isActive}
                                      className="flex-1 h-auto py-1"
                                    >
                                      <Link href={link.path}>
                                        <div className="flex flex-col text-left">
                                          <span className="text-sm font-medium leading-tight">{link.title}</span>
                                          <span className="text-xs text-muted-foreground leading-snug">{link.hint}</span>
                                        </div>
                                      </Link>
                                    </SidebarMenuButton>
                                    <SidebarMenuAction>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Add ${link.title} to dashboard`}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          addToDashboard.mutate({ route: link.path });
                                        }}
                                        disabled={pendingRoute === link.path && addToDashboard.isPending}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </SidebarMenuAction>
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {systemNavItems.map((item) => {
                    const isActive = location === item.url || location.startsWith(item.url + "/");
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={isActive} className="h-auto py-2">
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <div className="flex flex-col">
                              <span className="leading-tight">{item.title}</span>
                              <span className="text-xs text-muted-foreground leading-snug">{item.description}</span>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Journey</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {journeyMenuItems.map((item) => {
                    const isActive =
                      location === item.url ||
                      location.startsWith(item.url + "/") ||
                      (item.url === ROUTES.DASHBOARD && location === "/");

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="h-auto py-2"
                        >
                          <Link
                            href={item.url}
                            data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <div className="flex flex-col">
                              <span className="leading-tight">{item.title}</span>
                              <span className="text-xs text-muted-foreground leading-snug">
                                {item.description}
                              </span>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuAction>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Add ${item.title} to dashboard`}
                            data-testid={`add-${item.title.toLowerCase().replace(/\s+/g, '-')}-to-dashboard`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              addToDashboard.mutate({ route: item.url });
                            }}
                            disabled={pendingRoute === item.url && addToDashboard.isPending}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {showReviewSection && (
              <SidebarGroup>
                <SidebarGroupLabel>Review (Dev Only)</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {[
                      {
                        title: "Dashboard",
                        url: ROUTES.DASHBOARD,
                      },
                      {
                        title: "Forms Builder",
                        url: ROUTES.FORMS_BUILDER,
                      },
                      {
                        title: "Forms Runner",
                        url: ROUTES.FORMS_RUNNER,
                      },
                      {
                        title: "Forms Hub",
                        url: ROUTES.HUB_FORMS,
                      },
                      {
                        title: "Reports",
                        url: ROUTES.REPORTS,
                      },
                      {
                        title: "Defects",
                        url: ROUTES.DEFECTS,
                      },
                      {
                        title: "Smoke Control Library",
                        url: ROUTES.SMOKE_CONTROL_LIBRARY,
                      },
                      {
                        title: "Schedule",
                        url: ROUTES.SCHEDULE,
                      },
                      {
                        title: "Finance",
                        url: ROUTES.FINANCE,
                      },
                    ].map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild className="h-auto py-2">
                          <Link href={item.url}>
                            <Eye className="h-4 w-4 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="leading-tight">{item.title}</span>
                              <span className="text-xs text-muted-foreground leading-snug">Direct preview</span>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {showReviewSection && (
              <div className="m-4 rounded-md border bg-muted/40 p-3 text-xs space-y-1" data-testid="dev-flags-banner">
                <div className="font-semibold text-sm">Dev Flags</div>
                <div>NODE_ENV: {devStatus?.isDev ? "development" : import.meta.env.MODE || "development"}</div>
                <div>DEV_AUTH_BYPASS: {String(devStatus?.devAuthBypass ?? !!devAuthBypassFlag)}</div>
                <div>DEV_REVIEW_MODE: {String(devStatus?.devReviewMode ?? showReviewSection)}</div>
                <div>DB available: {devStatus?.hasDbConnection === false ? "false" : "true"}</div>
                <div>Limited mode: {String(devStatus?.limitedMode ?? false)}</div>
                {devStatus?.limitedMode && (
                  <div className="text-amber-600 font-semibold">
                    DEV_AUTH_BYPASS enabled — database unavailable — limited mode
                  </div>
                )}
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            {user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user.firstName?.[0] || user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" data-testid="text-user-name">
                      {user.firstName || user.email?.split("@")[0] || "User"}
                    </p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0" data-testid="badge-user-role">
                      {roleLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                    {user.email}
                  </p>
                </div>
                <Link href={ROUTES.SETTINGS}>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not signed in</p>
            )}
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <GlobalSearch />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                <span className="hidden sm:inline">Office</span>
              </div>
              <Switch
                checked={isEngineerMode}
                onCheckedChange={handleToggleChange}
                data-testid="switch-view-mode"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Engineer</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {showReviewSection && (
              <div
                className="flex flex-wrap items-center gap-3 border-b bg-amber-50 px-4 py-2 text-xs sm:text-sm text-amber-900"
                data-testid="dev-review-banner"
              >
                <span className="font-semibold">Review mode</span>
                <span>DEV_AUTH_BYPASS: {String(devStatus?.devAuthBypass ?? !!devAuthBypassFlag)}</span>
                <span>DEV_REVIEW_MODE: {String(devStatus?.devReviewMode ?? showReviewSection)}</span>
                <span>
                  DB mode:
                  {" "}
                  {devStatus?.limitedMode ? "No-DB Limited" : devStatus?.hasDbConnection === false ? "Unavailable" : "Connected"}
                </span>
                {devStatus?.limitedMode && (
                  <span className="font-semibold">Some actions are stubbed while the database is unavailable.</span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSeedDemo}
                  disabled={seedingDemo}
                  data-testid="button-seed-demo"
                >
                  {seedingDemo ? "Seeding…" : "Load demo data"}
                </Button>
              </div>
            )}
            {showReviewSection && !moduleBannerDismissed && (
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary/5 px-4 py-3 text-xs sm:text-sm"
                data-testid="module-review-banner"
              >
                <div className="space-y-1 max-w-4xl">
                  <div className="font-semibold text-sm">
                    Module: {bannerModule?.label ?? MODULE_NAV[MODULES.LIFE_SAFETY]?.label ?? "Life Safety Ops"}
                  </div>
                  <p className="text-muted-foreground leading-snug">
                    {bannerModule?.tagline ?? MODULE_NAV[MODULES.LIFE_SAFETY]?.tagline}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setModuleBannerDismissed(true);
                    if (typeof localStorage !== "undefined") {
                      localStorage.setItem("module-banner-dismissed", "true");
                    }
                  }}
                >
                  Dismiss
                </Button>
              </div>
            )}
            {showReviewSection ? (
              <div className="border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between gap-2 text-sm font-medium mb-2">
                  <span>Module switches (dev-only)</span>
                  <span className="text-xs text-muted-foreground">Toggle modules to preview ModuleGate behavior</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {allModules.map((module) => {
                    const derivedEnabled = moduleOverrides[module.id as keyof ModuleOverrideMap];
                    const enabledFallback = enabledModules.some((m) => m.id === module.id);
                    const isEnabled = derivedEnabled ?? enabledFallback;
                    return (
                      <div key={module.id} className="flex items-center justify-between rounded border bg-background px-3 py-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{module.label}</span>
                            <Badge variant={isEnabled ? "default" : "secondary"}>{isEnabled ? "On" : "Off"}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{module.tagline}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => {
                              setModuleOverride(module.id as any, checked);
                              setModuleOverrides(loadModuleOverrides());
                              toast({
                                title: `${module.label} ${checked ? "enabled" : "disabled"}`,
                                description: "ModuleGate will reflect this override in dev preview.",
                              });
                            }}
                            aria-label={`Toggle ${module.label}`}
                          />
                          {moduleOverrides[module.id as keyof ModuleOverrideMap] !== undefined ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Reset ${module.label} toggle`}
                              onClick={() => {
                                clearModuleOverride(module.id as any);
                                setModuleOverrides(loadModuleOverrides());
                              }}
                            >
                              <span className="text-xs">Reset</span>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
