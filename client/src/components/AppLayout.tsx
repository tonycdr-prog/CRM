import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
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
import { ROUTES } from "@/lib/routes";
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
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";

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
  const { isEngineerMode, enterCompanionMode, enterOfficeMode } = useViewMode();
  const { role, roleLabel } = usePermissions();

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
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
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
