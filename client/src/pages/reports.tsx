import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  FileText,
  Download,
  Calendar,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Briefcase,
  Building2,
  Car
} from "lucide-react";
import { format, parseISO, subDays, isAfter, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface Invoice {
  id: string;
  clientId: string | null;
  invoiceNumber: string;
  title: string;
  total: number | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
  paidAt?: string | null;
}

interface Job {
  id: string;
  clientId: string | null;
  jobNumber: string;
  title: string;
  status: string;
  jobType: string;
  scheduledDate: string | null;
  completedAt?: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  companyName: string;
  status: string;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
}

interface Timesheet {
  id: string;
  technicianId: string | null;
  totalHours: number | null;
  date: string;
  status: string;
}

interface Vehicle {
  id: string;
  registration: string;
  motExpiry: string | null;
  insuranceExpiry: string | null;
  nextServiceDate: string | null;
}

interface Subcontractor {
  id: string;
  companyName: string;
  insuranceExpiry: string | null;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Reports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user?.id,
  });

  const { data: timesheets = [] } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets"],
    enabled: !!user?.id,
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    enabled: !!user?.id,
  });

  const { data: subcontractors = [] } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
    enabled: !!user?.id,
  });

  const today = new Date();
  const periodDays = period === "month" ? 30 : period === "quarter" ? 90 : 365;
  const periodStart = subDays(today, periodDays);

  const agedDebtors = invoices
    .filter(i => i.status === "sent" || i.status === "overdue")
    .map(i => {
      const dueDate = i.dueDate ? parseISO(i.dueDate) : null;
      const daysOverdue = dueDate ? differenceInDays(today, dueDate) : 0;
      const ageGroup = daysOverdue <= 0 ? "current" : daysOverdue <= 30 ? "30_days" : daysOverdue <= 60 ? "60_days" : daysOverdue <= 90 ? "90_days" : "90_plus";
      const client = clients.find(c => c.id === i.clientId);
      return { ...i, daysOverdue, ageGroup, clientName: client?.companyName || "Unknown" };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const agedDebtorsSummary = {
    current: agedDebtors.filter(d => d.ageGroup === "current").reduce((sum, d) => sum + (d.total || 0), 0),
    days_30: agedDebtors.filter(d => d.ageGroup === "30_days").reduce((sum, d) => sum + (d.total || 0), 0),
    days_60: agedDebtors.filter(d => d.ageGroup === "60_days").reduce((sum, d) => sum + (d.total || 0), 0),
    days_90: agedDebtors.filter(d => d.ageGroup === "90_days").reduce((sum, d) => sum + (d.total || 0), 0),
    days_90_plus: agedDebtors.filter(d => d.ageGroup === "90_plus").reduce((sum, d) => sum + (d.total || 0), 0),
  };

  const totalOutstanding = agedDebtors.reduce((sum, d) => sum + (d.total || 0), 0);

  const periodInvoices = invoices.filter(i => {
    const createdDate = parseISO(i.createdAt);
    return isAfter(createdDate, periodStart);
  });
  const periodExpenses = expenses.filter(e => {
    const expDate = parseISO(e.date);
    return isAfter(expDate, periodStart);
  });

  const periodRevenue = periodInvoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0);
  const periodExpenseTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const vatOnRevenue = periodRevenue * 0.2;
  const vatOnExpenses = periodExpenseTotal * 0.2;
  const vatLiability = vatOnRevenue - vatOnExpenses;

  const completedJobs = jobs.filter(j => j.status === "completed");
  const periodJobs = jobs.filter(j => {
    const createdDate = parseISO(j.createdAt);
    return isAfter(createdDate, periodStart);
  });
  const completionRate = periodJobs.length > 0 ? (periodJobs.filter(j => j.status === "completed").length / periodJobs.length * 100) : 0;

  const jobsByType = Object.entries(
    jobs.reduce((acc, j) => {
      acc[j.jobType] = (acc[j.jobType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const jobsByStatus = Object.entries(
    jobs.reduce((acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  const expiringItems: { type: string; name: string; expiryDate: Date; daysUntil: number }[] = [];
  
  vehicles.forEach(v => {
    if (v.motExpiry) {
      const expiry = parseISO(v.motExpiry);
      const daysUntil = differenceInDays(expiry, today);
      if (daysUntil <= 30 && daysUntil > -30) {
        expiringItems.push({ type: "MOT", name: v.registration, expiryDate: expiry, daysUntil });
      }
    }
    if (v.insuranceExpiry) {
      const expiry = parseISO(v.insuranceExpiry);
      const daysUntil = differenceInDays(expiry, today);
      if (daysUntil <= 30 && daysUntil > -30) {
        expiringItems.push({ type: "Vehicle Insurance", name: v.registration, expiryDate: expiry, daysUntil });
      }
    }
  });

  subcontractors.forEach(s => {
    if (s.insuranceExpiry) {
      const expiry = parseISO(s.insuranceExpiry);
      const daysUntil = differenceInDays(expiry, today);
      if (daysUntil <= 30 && daysUntil > -30) {
        expiringItems.push({ type: "Subcontractor Insurance", name: s.companyName, expiryDate: expiry, daysUntil });
      }
    }
  });

  expiringItems.sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Reports & Analytics</h1>
          <p className="text-muted-foreground">Financial and operational reports</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-40" data-testid="select-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last 90 Days</SelectItem>
            <SelectItem value="year">Last 365 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="financial">
        <TabsList>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-period-revenue">
                  £{periodRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Paid invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Period Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-period-expenses">
                  £{periodExpenseTotal.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">VAT Liability</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${vatLiability >= 0 ? "text-blue-600" : "text-green-600"}`} data-testid="text-vat-liability">
                  £{vatLiability.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Output - Input VAT</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Aged Debtors Report
              </CardTitle>
              <CardDescription>Outstanding invoices by age - Total: £{totalOutstanding.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="text-lg font-bold text-green-600">£{agedDebtorsSummary.current.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="text-lg font-bold text-yellow-600">£{agedDebtorsSummary.days_30.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">1-30 Days</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <div className="text-lg font-bold text-orange-600">£{agedDebtorsSummary.days_60.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">31-60 Days</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="text-lg font-bold text-red-600">£{agedDebtorsSummary.days_90.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">61-90 Days</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700">
                  <div className="text-lg font-bold text-red-700">£{agedDebtorsSummary.days_90_plus.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">90+ Days</div>
                </div>
              </div>

              {agedDebtors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p>No outstanding invoices - all paid!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agedDebtors.slice(0, 10).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="font-medium">{invoice.title}</div>
                          <div className="text-xs text-muted-foreground">{invoice.invoiceNumber}</div>
                        </TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell>{invoice.dueDate && format(parseISO(invoice.dueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {invoice.daysOverdue <= 0 ? (
                            <Badge variant="outline">Due in {Math.abs(invoice.daysOverdue)} days</Badge>
                          ) : (
                            <Badge variant="destructive">{invoice.daysOverdue} days</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          £{(invoice.total || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{periodJobs.length}</div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${completionRate >= 80 ? "text-green-600" : "text-orange-600"}`}>
                  {completionRate.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">{periodJobs.filter(j => j.status === "completed").length} completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.filter(c => c.status === "active").length}</div>
                <p className="text-xs text-muted-foreground">of {clients.length} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timesheets.filter(t => isAfter(parseISO(t.date), periodStart)).reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(0)}h
                </div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Jobs by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsByType.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No job data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={jobsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {jobsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jobs by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsByStatus.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No job data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={jobsByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Expiring Certifications & Documents
              </CardTitle>
              <CardDescription>Items expiring within 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {expiringItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p>No items expiring soon</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{format(item.expiryDate, "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {item.daysUntil < 0 ? (
                            <Badge variant="destructive">Expired {Math.abs(item.daysUntil)} days ago</Badge>
                          ) : item.daysUntil <= 7 ? (
                            <Badge variant="destructive">Expires in {item.daysUntil} days</Badge>
                          ) : (
                            <Badge variant="secondary">Expires in {item.daysUntil} days</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Fleet Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Vehicles</span>
                    <Badge>{vehicles.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>MOT Due (30 days)</span>
                    <Badge variant={vehicles.filter(v => v.motExpiry && differenceInDays(parseISO(v.motExpiry), today) <= 30 && differenceInDays(parseISO(v.motExpiry), today) > 0).length > 0 ? "destructive" : "secondary"}>
                      {vehicles.filter(v => v.motExpiry && differenceInDays(parseISO(v.motExpiry), today) <= 30 && differenceInDays(parseISO(v.motExpiry), today) > 0).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Insurance Due (30 days)</span>
                    <Badge variant={vehicles.filter(v => v.insuranceExpiry && differenceInDays(parseISO(v.insuranceExpiry), today) <= 30 && differenceInDays(parseISO(v.insuranceExpiry), today) > 0).length > 0 ? "destructive" : "secondary"}>
                      {vehicles.filter(v => v.insuranceExpiry && differenceInDays(parseISO(v.insuranceExpiry), today) <= 30 && differenceInDays(parseISO(v.insuranceExpiry), today) > 0).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Service Due (30 days)</span>
                    <Badge variant={vehicles.filter(v => v.nextServiceDate && differenceInDays(parseISO(v.nextServiceDate), today) <= 30 && differenceInDays(parseISO(v.nextServiceDate), today) > 0).length > 0 ? "secondary" : "outline"}>
                      {vehicles.filter(v => v.nextServiceDate && differenceInDays(parseISO(v.nextServiceDate), today) <= 30 && differenceInDays(parseISO(v.nextServiceDate), today) > 0).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Subcontractor Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Subcontractors</span>
                    <Badge>{subcontractors.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Insurance Expiring (30 days)</span>
                    <Badge variant={subcontractors.filter(s => s.insuranceExpiry && differenceInDays(parseISO(s.insuranceExpiry), today) <= 30 && differenceInDays(parseISO(s.insuranceExpiry), today) > 0).length > 0 ? "destructive" : "secondary"}>
                      {subcontractors.filter(s => s.insuranceExpiry && differenceInDays(parseISO(s.insuranceExpiry), today) <= 30 && differenceInDays(parseISO(s.insuranceExpiry), today) > 0).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Insurance Expired</span>
                    <Badge variant={subcontractors.filter(s => s.insuranceExpiry && differenceInDays(parseISO(s.insuranceExpiry), today) < 0).length > 0 ? "destructive" : "outline"}>
                      {subcontractors.filter(s => s.insuranceExpiry && differenceInDays(parseISO(s.insuranceExpiry), today) < 0).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
