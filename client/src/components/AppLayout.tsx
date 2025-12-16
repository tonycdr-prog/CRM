import { Link, useLocation } from "wouter";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
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
  Download
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface MenuSection {
  title: string;
  icon: any;
  items: { title: string; url: string; icon: any }[];
  defaultOpen?: boolean;
}

const menuSections: MenuSection[] = [
  {
    title: "Testing & Field Work",
    icon: Wind,
    defaultOpen: true,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Schedule", url: "/schedule", icon: Calendar },
      { title: "Field Testing", url: "/test", icon: Wind },
      { title: "Visit Types", url: "/visit-types", icon: ClipboardList },
      { title: "Quality Checklists", url: "/quality-checklists", icon: FileCheck },
      { title: "Check Sheets", url: "/check-sheet-readings", icon: ClipboardList },
    ],
  },
  {
    title: "Clients & Projects",
    icon: Users,
    items: [
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Contracts", url: "/contracts", icon: FileText },
      { title: "Site Access", url: "/site-access", icon: MapPin },
      { title: "Site Access Notes", url: "/site-access-notes", icon: MapPinned },
      { title: "Customer Feedback", url: "/customer-feedback", icon: MessageSquareText },
      { title: "SLAs", url: "/slas", icon: ShieldCheck },
    ],
  },
  {
    title: "Jobs & Scheduling",
    icon: Briefcase,
    items: [
      { title: "Jobs", url: "/jobs", icon: Briefcase },
      { title: "Callbacks", url: "/callbacks", icon: PhoneCall },
      { title: "Job Templates", url: "/job-templates", icon: Copy },
      { title: "Recurring Jobs", url: "/recurring-jobs", icon: RefreshCw },
      { title: "Work Notes", url: "/work-notes", icon: StickyNote },
      { title: "Service History", url: "/service-history", icon: Clock },
    ],
  },
  {
    title: "Finance",
    icon: Wallet,
    items: [
      { title: "Quotes & Invoices", url: "/finance", icon: Receipt },
      { title: "Expenses", url: "/expenses", icon: DollarSign },
      { title: "Mileage Claims", url: "/mileage-claims", icon: Car },
      { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
      { title: "Profitability", url: "/profitability", icon: TrendingUp },
      { title: "Price Lists", url: "/price-lists", icon: Tags },
    ],
  },
  {
    title: "Team & HR",
    icon: UsersRound,
    items: [
      { title: "Staff Directory", url: "/staff-directory", icon: UsersRound },
      { title: "Timesheets", url: "/timesheets", icon: Clock },
      { title: "Holidays", url: "/holidays", icon: Calendar },
      { title: "Time Off Requests", url: "/time-off-requests", icon: Calendar },
      { title: "Certifications", url: "/certifications", icon: Award },
      { title: "Training Records", url: "/training-records", icon: GraduationCap },
      { title: "Subcontractors", url: "/subcontractors", icon: UserCheck },
    ],
  },
  {
    title: "Assets & Inventory",
    icon: Package,
    items: [
      { title: "Site Assets", url: "/site-assets", icon: Package },
      { title: "Equipment", url: "/equipment", icon: Wrench },
      { title: "Vehicles", url: "/vehicles", icon: Truck },
      { title: "Inventory", url: "/inventory", icon: Boxes },
      { title: "Parts Catalog", url: "/parts-catalog", icon: Cog },
      { title: "Warranties", url: "/warranties", icon: ShieldCheck },
      { title: "Suppliers", url: "/suppliers", icon: Building2 },
    ],
  },
  {
    title: "Sales & Pipeline",
    icon: Target,
    items: [
      { title: "Leads", url: "/leads", icon: Target },
      { title: "Tenders", url: "/tenders", icon: FileCheck },
      { title: "Competitors", url: "/competitors", icon: Target },
    ],
  },
  {
    title: "Compliance & Safety",
    icon: ShieldCheck,
    items: [
      { title: "Golden Thread", url: "/golden-thread", icon: Link2 },
      { title: "Incidents", url: "/incidents", icon: AlertTriangle },
      { title: "Risk Assessments", url: "/risk-assessments", icon: ShieldCheck },
      { title: "Defect Register", url: "/defects", icon: AlertOctagon },
    ],
  },
  {
    title: "Documents & Reports",
    icon: ScrollText,
    items: [
      { title: "Document Register", url: "/document-register", icon: FileText },
      { title: "Document Templates", url: "/document-templates", icon: Copy },
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Service Analytics", url: "/service-analytics", icon: Gauge },
      { title: "Downloads", url: "/downloads", icon: Download },
      { title: "Notifications", url: "/notifications", icon: Bell },
    ],
  },
];

function CollapsibleMenuSection({ section, location }: { section: MenuSection; location: string }) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen || false);
  const hasActiveItem = section.items.some(item => location === item.url);
  
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
          {section.items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={location === item.url || (item.url === "/dashboard" && location === "/")}
                className="h-8"
              >
                <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="text-sm">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

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
                <h2 className="font-semibold text-sm">Airflow Pro</h2>
                <p className="text-xs text-muted-foreground">Business Suite</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {menuSections.map((section) => (
                    <SidebarMenuItem key={section.title}>
                      <CollapsibleMenuSection section={section} location={location} />
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
                  <p className="text-sm font-medium truncate" data-testid="text-user-name">
                    {user.firstName || user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                    {user.email}
                  </p>
                </div>
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
            <div className="w-8" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
