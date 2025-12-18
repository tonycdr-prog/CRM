import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useViewMode } from "@/hooks/useViewMode";
import { usePermissions } from "@/hooks/use-permissions";
import { ROUTES, isCompanionPath } from "@/lib/routes";
import { 
  LayoutDashboard, 
  Wind, 
  Users, 
  FileText, 
  Briefcase, 
  Receipt, 
  DollarSign,
  Clock,
  Truck,
  UserCheck,
  Bell,
  BarChart3,
  LogOut,
  Calendar,
  TrendingUp,
  Wrench,
  Award,
  Target,
  MapPin,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Copy,
  RefreshCw,
  Building2,
  ShoppingCart,
  GraduationCap,
  Boxes,
  AlertOctagon,
  Car,
  StickyNote,
  PhoneCall,
  MapPinned,
  UsersRound,
  Tags,
  MessageSquareText,
  Cog,
  ClipboardList,
  Package,
  ChevronDown,
  ChevronRight,
  Gauge,
  Wallet,
  HardHat,
  FolderKanban,
  ScrollText,
  Settings,
  Link2,
  Download,
  HardDrive,
  Smartphone,
  Shield,
  Activity
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  isCompanion?: boolean;
}

interface MenuSection {
  title: string;
  icon: any;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const menuSections: MenuSection[] = [
  {
    title: "Testing & Field Work",
    icon: Wind,
    defaultOpen: true,
    items: [
      { title: "Dashboard", url: ROUTES.DASHBOARD, icon: LayoutDashboard },
      { title: "Schedule", url: ROUTES.SCHEDULE, icon: Calendar },
      { title: "Field Companion", url: ROUTES.FIELD_COMPANION, icon: Smartphone, isCompanion: true },
      { title: "Field Testing", url: ROUTES.FIELD_TESTING, icon: Wind, isCompanion: true },
      { title: "Visit Types", url: ROUTES.VISIT_TYPES, icon: ClipboardList },
      { title: "Quality Checklists", url: ROUTES.QUALITY_CHECKLISTS, icon: FileCheck },
      { title: "Check Sheets", url: "/check-sheet-readings", icon: ClipboardList },
    ],
  },
  {
    title: "Clients & Sites",
    icon: Users,
    items: [
      { title: "Clients", url: ROUTES.CLIENTS, icon: Users },
      { title: "Sites", url: ROUTES.SITES, icon: Building2 },
      { title: "Contracts", url: ROUTES.CONTRACTS, icon: FileText },
      { title: "Site Access", url: ROUTES.SITE_ACCESS, icon: MapPin },
      { title: "Site Access Notes", url: ROUTES.SITE_ACCESS_NOTES, icon: MapPinned },
      { title: "Customer Feedback", url: ROUTES.CUSTOMER_FEEDBACK, icon: MessageSquareText },
      { title: "SLAs", url: ROUTES.SLAS, icon: ShieldCheck },
    ],
  },
  {
    title: "Jobs & Scheduling",
    icon: Briefcase,
    items: [
      { title: "Jobs", url: ROUTES.JOBS, icon: Briefcase },
      { title: "Callbacks", url: ROUTES.CALLBACKS, icon: PhoneCall },
      { title: "Job Templates", url: ROUTES.JOB_TEMPLATES, icon: Copy },
      { title: "Recurring Jobs", url: ROUTES.RECURRING_JOBS, icon: RefreshCw },
      { title: "Work Notes", url: ROUTES.WORK_NOTES, icon: StickyNote },
      { title: "Service History", url: "/service-history", icon: Clock },
    ],
  },
  {
    title: "Finance",
    icon: Wallet,
    items: [
      { title: "Quotes & Invoices", url: ROUTES.FINANCE, icon: Receipt },
      { title: "Expenses", url: ROUTES.EXPENSES, icon: DollarSign },
      { title: "Mileage Claims", url: ROUTES.MILEAGE_CLAIMS, icon: Car },
      { title: "Purchase Orders", url: ROUTES.PURCHASE_ORDERS, icon: ShoppingCart },
      { title: "Profitability", url: ROUTES.PROFITABILITY, icon: TrendingUp },
      { title: "Price Lists", url: ROUTES.PRICE_LISTS, icon: Tags },
    ],
  },
  {
    title: "Team & HR",
    icon: UsersRound,
    items: [
      { title: "Staff Directory", url: ROUTES.STAFF_DIRECTORY, icon: UsersRound },
      { title: "Timesheets", url: ROUTES.TIMESHEETS, icon: Clock },
      { title: "Holidays", url: ROUTES.HOLIDAYS, icon: Calendar },
      { title: "Time Off Requests", url: "/time-off-requests", icon: Calendar },
      { title: "Certifications", url: ROUTES.CERTIFICATIONS, icon: Award },
      { title: "Training Records", url: ROUTES.TRAINING_RECORDS, icon: GraduationCap },
      { title: "Subcontractors", url: ROUTES.SUBCONTRACTORS, icon: UserCheck },
    ],
  },
  {
    title: "Assets & Inventory",
    icon: Package,
    items: [
      { title: "Site Assets", url: "/site-assets", icon: Package },
      { title: "Equipment", url: ROUTES.EQUIPMENT, icon: Wrench },
      { title: "Vehicles", url: ROUTES.VEHICLES, icon: Truck },
      { title: "Inventory", url: ROUTES.INVENTORY, icon: Boxes },
      { title: "Parts Catalog", url: ROUTES.PARTS_CATALOG, icon: Cog },
      { title: "Warranties", url: "/warranties", icon: ShieldCheck },
      { title: "Suppliers", url: ROUTES.SUPPLIERS, icon: Building2 },
    ],
  },
  {
    title: "Sales & Pipeline",
    icon: Target,
    items: [
      { title: "Leads", url: ROUTES.LEADS, icon: Target },
      { title: "Tenders", url: ROUTES.TENDERS, icon: FileCheck },
      { title: "Competitors", url: "/competitors", icon: Target },
    ],
  },
  {
    title: "Compliance & Safety",
    icon: ShieldCheck,
    items: [
      { title: "Golden Thread", url: "/golden-thread", icon: Link2 },
      { title: "Incidents", url: ROUTES.INCIDENTS, icon: AlertTriangle },
      { title: "Risk Assessments", url: ROUTES.RISK_ASSESSMENTS, icon: ShieldCheck },
      { title: "Defect Register", url: ROUTES.DEFECTS, icon: AlertOctagon },
    ],
  },
  {
    title: "Documents & Reports",
    icon: ScrollText,
    items: [
      { title: "Document Register", url: ROUTES.DOCUMENT_REGISTER, icon: FileText },
      { title: "Document Templates", url: "/document-templates", icon: Copy },
      { title: "Reports", url: ROUTES.REPORTS, icon: BarChart3 },
      { title: "Service Analytics", url: "/service-analytics", icon: Gauge },
      { title: "Engineer Performance", url: "/engineer-performance", icon: Activity },
      { title: "Site Health", url: "/site-health", icon: Shield },
      { title: "Downloads", url: ROUTES.DOWNLOADS, icon: Download },
      { title: "Notifications", url: ROUTES.NOTIFICATIONS, icon: Bell },
    ],
  },
];

interface CollapsibleMenuSectionProps {
  section: MenuSection;
  location: string;
  onCompanionClick: (path: string) => void;
}

function CollapsibleMenuSection({ section, location, onCompanionClick }: CollapsibleMenuSectionProps) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen || false);
  const hasActiveItem = section.items.some(item => location === item.url || location.startsWith(item.url + "/"));
  
  return (
    <Collapsible open={isOpen || hasActiveItem} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton className="w-full justify-between" data-testid={`nav-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
          <div className="flex items-center gap-2">
            <section.icon className="h-4 w-4" />
            <span className="font-medium">{section.title}</span>
          </div>
          {isOpen || hasActiveItem ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="ml-4 mt-1 space-y-0.5">
          {section.items.map((item) => {
            const isActive = location === item.url || location.startsWith(item.url + "/") || (item.url === ROUTES.DASHBOARD && location === "/");
            
            if (item.isCompanion) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive}
                    className="h-8 cursor-pointer"
                    onClick={() => onCompanionClick(item.url)}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    <span className="text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className="h-8"
                >
                  <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <item.icon className="h-3.5 w-3.5" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

const SECTION_PERMISSIONS: Record<string, string[]> = {
  "Testing & Field Work": ["admin", "office_manager", "field_engineer"],
  "Clients & Sites": ["admin", "office_manager"],
  "Jobs & Scheduling": ["admin", "office_manager", "field_engineer"],
  "Finance": ["admin", "office_manager"],
  "Team & HR": ["admin", "office_manager"],
  "Assets & Inventory": ["admin", "office_manager"],
  "Sales & Pipeline": ["admin", "office_manager"],
  "Compliance & Safety": ["admin", "office_manager", "field_engineer"],
  "Documents & Reports": ["admin", "office_manager"],
};

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { isEngineerMode, enterCompanionMode, enterOfficeMode } = useViewMode();
  const { role, roleLabel, canAccessOffice } = usePermissions();

  const filteredMenuSections = useMemo(() => {
    return menuSections.filter(section => {
      const allowedRoles = SECTION_PERMISSIONS[section.title];
      if (!allowedRoles) return true;
      return allowedRoles.includes(role);
    });
  }, [role]);

  const handleCompanionClick = (path: string) => {
    enterCompanionMode(path);
  };

  const handleToggleChange = () => {
    if (!isEngineerMode) {
      enterCompanionMode(ROUTES.FIELD_COMPANION);
    } else {
      enterOfficeMode(ROUTES.DASHBOARD);
    }
  };

  const style = {
    "--sidebar-width": "16rem",
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
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredMenuSections.map((section) => (
                    <SidebarMenuItem key={section.title}>
                      <CollapsibleMenuSection 
                        section={section} 
                        location={location} 
                        onCompanionClick={handleCompanionClick}
                      />
                    </SidebarMenuItem>
                  ))}
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
