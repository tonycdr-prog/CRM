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
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

export function AppLayout({ children, isOrgAdmin }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isEngineerMode, enterCompanionMode, enterOfficeMode } = useViewMode();
  const { role, roleLabel } = usePermissions();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [devStatus, setDevStatus] = useState<{ devAuthBypass: boolean; databaseAvailable: boolean } | null>(null);
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

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

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
      devStatus.databaseAvailable === false &&
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
                <h2 className="font-semibold text-sm">Life Safety Ops</h2>
                <p className="text-xs text-muted-foreground">Compliance Platform</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupLabel>Journey</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {journeyMenuItems.map((item) => {
                    const isActive = location === item.url || 
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
                    {[{
                      title: "Dashboard",
                      url: ROUTES.DASHBOARD,
                    },
                    {
                      title: "Forms Builder",
                      url: "/forms-builder",
                    },
                    {
                      title: "Forms Runner",
                      url: "/forms-runner",
                    },
                    {
                      title: "Forms Hub",
                      url: ROUTES.HUB_FORMS,
                    },
                    {
                      title: "Reports",
                      url: "/reports",
                    },
                    {
                      title: "Defects",
                      url: "/defects",
                    },
                    {
                      title: "Smoke Control Library",
                      url: "/smoke-control-library",
                    }].map((item) => (
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
                <div>NODE_ENV: {import.meta.env.MODE || "development"}</div>
                <div>DEV_AUTH_BYPASS: {String(!!devAuthBypassFlag)}</div>
                <div>
                  DEV_REVIEW_MODE: {devReviewModeEnv ? String(devReviewModeEnv) : String(showReviewSection)}
                </div>
                {devStatus?.devAuthBypass && devStatus.databaseAvailable === false && (
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
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
