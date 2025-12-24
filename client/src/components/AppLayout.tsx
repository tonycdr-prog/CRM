import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useViewMode } from "@/hooks/useViewMode";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/routes";
import { MODULE_NAV } from "@/lib/modules";
import { MODULES } from "@shared/modules";
import { buildLayoutWithSidebarWidget } from "@shared/sidebarWidgets";
import {
  LayoutDashboard,
  HardDrive,
  Smartphone,
  Briefcase,
  Building2,
  Users,
  ShieldCheck,
  Settings,
  Activity,
  Sparkles,
  Plus,
  LogOut,
  RotateCw,
  Maximize2,
  Trash2,
  ArrowUpRight,
  Monitor,
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useModules } from "@/hooks/use-modules";

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

interface SystemNavItem {
  title: string;
  description: string;
  url: string;
  icon: any;
}

interface DockItem {
  id: string;
  label: string;
  description: string;
  detail: string;
  context: string;
  glow: string;
  route?: string;
  color: string;
}

interface DevStatus {
  isDev: boolean;
  devAuthBypass: boolean;
  devReviewMode: boolean;
  hasDbConnection: boolean;
  limitedMode: boolean;
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
    icon: Settings,
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
    icon: Activity,
  },
  {
    title: "Manage",
    description: "People, assets, system settings",
    url: ROUTES.HUB_MANAGE,
    icon: Sparkles,
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

const DOCK_POSITIONS = ["bottom", "left", "right"] as const;
type DockPosition = (typeof DOCK_POSITIONS)[number];
const DOCK_POSITION_LABELS: Record<DockPosition, string> = {
  bottom: "Bottom dock",
  left: "Left dock",
  right: "Right dock",
};
const DOCK_POSITION_STORAGE = "deucalion-dock-position";

const createDockItems = (): DockItem[] => [
  {
    id: "crm-truth",
    label: "CRM truth layer",
    description: "Jobs · sites · assets · people",
    detail: "Every entity maps back to the truth ledger.",
    context: "Jobs queue / Sites registry",
    glow: "rgba(14,165,233,0.55)",
    route: ROUTES.JOBS,
    color: "from-sky-500 to-blue-500",
  },
  {
    id: "evidence-spine",
    label: "Evidence spine",
    description: "Traceable proof + attachments",
    detail: "Timeline, approvals, and linked files.",
    context: "Forms + approvals",
    glow: "rgba(16,185,129,0.55)",
    route: ROUTES.HUB_FORMS,
    color: "from-emerald-500 to-emerald-700",
  },
  {
    id: "golden-thread",
    label: "Golden thread UI",
    description: "Timelines, events, audit",
    detail: "Follow decisions from job creation to handoff.",
    context: "Golden thread timeline",
    glow: "rgba(251,191,36,0.45)",
    route: ROUTES.GOLDEN_THREAD,
    color: "from-amber-400 to-amber-600",
  },
  {
    id: "module-gating",
    label: "Module gating",
    description: "Composable capabilities",
    detail: "Layer modules while keeping the foundation visible.",
    context: "Dashboard + module gates",
    glow: "rgba(192,132,252,0.55)",
    route: ROUTES.DASHBOARD,
    color: "from-purple-500 to-fuchsia-500",
  },
];
export function AppLayout({ children, isOrgAdmin }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isEngineerMode, enterCompanionMode, enterOfficeMode } = useViewMode();
  const { role, roleLabel } = usePermissions();
  const { modules: enabledModules } = useModules();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [devStatus, setDevStatus] = useState<DevStatus | null>(null);
  const [moduleBannerDismissed, setModuleBannerDismissed] = useState(false);
  const [dockPosition, setDockPosition] = useState<DockPosition>("bottom");
  const [dockItems, setDockItems] = useState<DockItem[]>(createDockItems());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
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
  const showReviewSection =
    import.meta.env.DEV ||
    import.meta.env.MODE === "development" ||
    devReviewFlag;
  const [masterDevMode, setMasterDevMode] = useState(showReviewSection);

  const bannerModule = enabledModules[0];
  const moduleLabel =
    bannerModule?.label ??
    MODULE_NAV[MODULES.LIFE_SAFETY]?.label ??
    "Life Safety Ops";
  const moduleTagline =
    bannerModule?.tagline ??
    MODULE_NAV[MODULES.LIFE_SAFETY]?.tagline ??
    "Structured, evidence-led operations.";

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
    if (
      devStatus?.devAuthBypass &&
      devStatus.limitedMode &&
      !hasNotifiedNoDb.current
    ) {
      hasNotifiedNoDb.current = true;
      toast({
        title: "DEV_AUTH_BYPASS enabled — limited mode",
        description:
          "Preview UI is running without backend data; some actions are stubbed.",
      });
    }
  }, [devStatus, toast]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const dismissed = localStorage.getItem("module-banner-dismissed");
    setModuleBannerDismissed(dismissed === "true");
  }, []);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const stored = localStorage.getItem(DOCK_POSITION_STORAGE);
    if (stored === "bottom" || stored === "left" || stored === "right") {
      setDockPosition(stored as DockPosition);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, []);
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

  const addToDashboard = useMutation({
    mutationFn: async ({ route }: { route: string }) => {
      const layoutResponse = await fetch("/api/dashboard/layout", {
        credentials: "include",
      });
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
      toast({
        title: "Added to dashboard",
        description: "Widget saved to your layout.",
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-layout"] });
    },
    onSettled: () => setPendingRoute(null),
  });

  const setDockPositionWithStorage = (next: DockPosition) => {
    setDockPosition(next);
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(DOCK_POSITION_STORAGE, next);
  };

  const cycleDockPosition = () => {
    const currentIndex = DOCK_POSITIONS.indexOf(dockPosition);
    const next = DOCK_POSITIONS[(currentIndex + 1) % DOCK_POSITIONS.length];
    setDockPositionWithStorage(next);
  };

  const resetDock = () => {
    setDockItems(createDockItems());
    toast({
      title: "Dock restored",
      description: "Widgets returned to the default palette.",
    });
  };

  const handleSendToTab = (item: DockItem) => {
    if (!item.route) {
      toast({
        title: "Route unavailable",
        description: "This widget cannot be pushed to a tab yet.",
        variant: "destructive",
      });
      return;
    }
    addToDashboard.mutate({ route: item.route });
  };

  const handleDeleteWidget = (item: DockItem) => {
    setDockItems((prev) => prev.filter((widget) => widget.id !== item.id));
    toast({
      title: `${item.label} removed`,
      description: "Use the dock controls to restore it.",
    });
  };

  const handleFullScreen = async (source?: string) => {
    if (typeof document === "undefined") {
      toast({
        title: "Cannot switch screen mode",
        description: "Full-screen mode is unavailable in this environment.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
        toast({
          title: "Full-screen mode entered",
          description: source
            ? `${source} view is now emphasised.`
            : "Workspace expanded.",
        });
      } else {
        await document.exitFullscreen();
        setIsFullScreen(false);
        toast({
          title: "Full-screen mode exited",
          description: "Back to the standard workspace.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Full-screen error",
        description: err?.message ?? "Unable to change screen state.",
        variant: "destructive",
      });
    }
  };

  const dismissModuleBanner = () => {
    setModuleBannerDismissed(true);
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("module-banner-dismissed", "true");
  };

  const mainSpacingClass = cn("transition-all duration-300", {
    "pb-40": dockPosition === "bottom",
    "pl-[18rem]": dockPosition === "left",
    "pr-[18rem]": dockPosition === "right",
  });

  const dockWrapperClass = cn(
    "fixed z-40 pointer-events-none transition-all duration-300",
    {
      "left-1/2 bottom-6 -translate-x-1/2 w-[min(96%,1180px)]": dockPosition === "bottom",
      "left-6 top-6 bottom-6 w-[18rem]": dockPosition === "left",
      "right-6 top-6 bottom-6 w-[18rem]": dockPosition === "right",
    }
  );

  const dockContainerClass = cn(
    "pointer-events-auto flex flex-col gap-4 rounded-3xl border border-border bg-background/90 p-4 shadow-2xl backdrop-blur-lg",
    {
      "h-full": dockPosition !== "bottom",
      "max-h-[80vh]": dockPosition === "left" || dockPosition === "right",
    }
  );

  const dockListClass = cn("flex gap-3", {
    "flex-row overflow-x-auto px-1": dockPosition === "bottom",
    "flex-1 flex-col overflow-y-auto": dockPosition !== "bottom",
  });
  return (
    <div className="relative flex h-screen w-full bg-background text-foreground">
      <main className={cn("flex h-full w-full flex-1 flex-col overflow-hidden", mainSpacingClass)}>
        <header className="border-b border-border bg-background/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                Deucalion
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-foreground">
                Calm operational workspace
              </h1>
            </div>
            <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full items-center justify-center">
                <GlobalSearch />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1">
                  <HardDrive className="h-4 w-4" />
                  <span>Office</span>
                  <Switch
                    checked={isEngineerMode}
                    onCheckedChange={handleToggleChange}
                    aria-label="Toggle office or engineer view"
                    className="h-6 w-10"
                  />
                  <Smartphone className="h-4 w-4" />
                  <span>Engineer</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2 py-1">
                  <span>Dev preview</span>
                  <Switch
                    checked={masterDevMode}
                    onCheckedChange={(value) => setMasterDevMode(value)}
                    aria-label="Toggle dev review features"
                    className="h-6 w-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFullScreen()}
                  className="hidden items-center gap-2 md:flex"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>{isFullScreen ? "Exit screen" : "Full screen"}</span>
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {user.firstName?.[0] || user.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-xs">
                      <p className="font-semibold text-foreground">
                        {user.firstName || user.email?.split("@")[0] || "User"}
                      </p>
                      <p className="text-muted-foreground">{user.email}</p>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {roleLabel}
                      </Badge>
                    </div>
                    <Link href={ROUTES.SETTINGS}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => logout()}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Not signed in</p>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-full flex-1 overflow-y-auto">
          <div className="flex flex-1 flex-col space-y-6 py-6">
            {masterDevMode && (
              <div className="mx-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-xs text-amber-900">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.3em]">Review mode</p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span>DEV_AUTH_BYPASS: {String(devStatus?.devAuthBypass ?? !!devAuthBypassFlag)}</span>
                    <span>DEV_REVIEW_MODE: {String(devStatus?.devReviewMode ?? masterDevMode)}</span>
                    <span>
                      DB mode: {devStatus?.limitedMode
                        ? "No-DB Limited"
                        : devStatus?.hasDbConnection === false
                          ? "DB unavailable"
                          : "Connected"}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={handleSeedDemo} disabled={seedingDemo}>
                  {seedingDemo ? "Seeding…" : "Load demo data"}
                </Button>
              </div>
            )}

            {masterDevMode && !moduleBannerDismissed && (
              <div className="mx-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-muted/60 bg-muted/40 px-5 py-4">
                <div className="space-y-2 text-sm">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                    Module
                  </p>
                  <p className="text-lg font-semibold text-foreground">{moduleLabel}</p>
                  <p className="text-xs text-muted-foreground">{moduleTagline}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={dismissModuleBanner}>
                  Dismiss
                </Button>
              </div>
            )}

            <section className="space-y-4 px-6">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  Core flows
                </p>
                <h2 className="text-xl font-semibold">Navigate the truth layer</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {coreNavItems.map((item) => {
                  const isActive =
                    location === item.url ||
                    location.startsWith(item.url + "/") ||
                    (item.url === ROUTES.DASHBOARD && location === "/");
                  return (
                    <article
                      key={item.url}
                      aria-current={isActive ? "page" : undefined}
                      className="group flex flex-col gap-3 rounded-2xl border border-border bg-background/40 p-4 transition hover:border-primary"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Link
                          href={item.url}
                          className="text-xs font-semibold text-primary underline-offset-4 transition hover:underline"
                          data-testid={item.testId}
                        >
                          Open
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleSendToTab({
                              id: item.url,
                              label: item.title,
                              description: item.description,
                              detail: item.description,
                              context: "Quick entry",
                              glow: "rgba(148,163,184,0.45)",
                              route: item.url,
                              color: "from-slate-300 to-slate-500",
                            });
                          }}
                          aria-label={`Send ${item.title} to dashboard`}
                          disabled={pendingRoute === item.url && addToDashboard.isPending}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="px-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Journeys
                      </p>
                      <p className="text-base font-semibold">Guided paths</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {journeyMenuItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.url}
                        className="flex min-w-[180px] items-center gap-3 rounded-2xl border border-border bg-background/60 px-3 py-2 text-sm transition hover:border-primary"
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        System
                      </p>
                      <p className="text-base font-semibold">Supporting surfaces</p>
                    </div>
                    {isOrgAdmin && (
                      <Badge variant="outline" className="text-[10px]">
                        Org admin
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {systemNavItems.map((item) => (
                      <Link
                        key={item.url}
                        href={item.url}
                        className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm transition hover:border-primary"
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <div className="px-6 py-4">{children}</div>
          </div>
        </div>
      </main>
      <div className={dockWrapperClass}>
        <div className={dockContainerClass} role="region" aria-label="Composable systems dock">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Dock</p>
              <p className="text-sm font-semibold text-foreground">Composable palette</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                onClick={cycleDockPosition}
                aria-label="Reposition dock"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <span className="hidden sm:inline">{DOCK_POSITION_LABELS[dockPosition]}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFullScreen("Dock view")}
                aria-label="Toggle dock full screen"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className={dockListClass}>
            {dockItems.length ? (
              dockItems.map((item) => (
                <article
                  key={item.id}
                  className="group flex min-w-[220px] flex-1 flex-col gap-3 rounded-2xl border border-border bg-muted/60 p-3 transition-colors duration-300 hover:border-primary group-hover:bg-background/80"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full bg-gradient-to-br shadow-inner transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_22px_var(--dock-shadow)]",
                        item.color
                      )}
                      style={{ "--dock-shadow": item.glow } as CSSProperties}
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.context}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Widget</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteWidget(item)}
                        aria-label={`Delete ${item.label}`}
                        title="Remove widget from dock"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendToTab(item)}
                        aria-label={`Send ${item.label} to tab`}
                        title="Send widget to dashboard tab"
                        disabled={pendingRoute === item.route && addToDashboard.isPending}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFullScreen(item.label)}
                        aria-label={`Focus ${item.label}`}
                        title="Zoom widget into full screen"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-background/50 p-4 text-xs text-muted-foreground">
                No widgets remaining. Reset the dock to restore the palette.
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={resetDock}>
              Reset deck
            </Button>
            <span className="text-[10px]">Dock actions stay anchored to your workspace.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
