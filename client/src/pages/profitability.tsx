import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Briefcase,
  Receipt,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format, parseISO, subMonths, isAfter, startOfMonth, endOfMonth } from "date-fns";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface Client {
  id: string;
  companyName: string;
  status: string;
}

interface Job {
  id: string;
  clientId: string | null;
  jobNumber: string;
  title: string;
  status: string;
  quotedAmount: number | null;
  actualCost: number | null;
  scheduledDate: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  clientId: string | null;
  jobId: string | null;
  total: number | null;
  status: string;
  createdAt: string;
  paidAt?: string | null;
}

interface Expense {
  id: string;
  jobId: string | null;
  amount: number;
  date: string;
  category: string;
}

interface Timesheet {
  id: string;
  jobId: string | null;
  totalHours: number | null;
  hourlyRate: number | null;
  date: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Profitability() {
  const { user } = useAuth();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs", user?.id],
    enabled: !!user?.id,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", user?.id],
    enabled: !!user?.id,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", user?.id],
    enabled: !!user?.id,
  });

  const { data: timesheets = [] } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets", user?.id],
    enabled: !!user?.id,
  });

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLabourCost = timesheets.reduce((sum, t) => sum + ((t.totalHours || 0) * (t.hourlyRate || 25)), 0);
  const totalCosts = totalExpenses + totalLabourCost;
  const grossProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

  const jobProfitability = jobs.map(job => {
    const jobInvoices = invoices.filter(i => i.jobId === job.id && i.status === "paid");
    const jobExpenses = expenses.filter(e => e.jobId === job.id);
    const jobTimesheets = timesheets.filter(t => t.jobId === job.id);
    
    const revenue = jobInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const expenseCost = jobExpenses.reduce((sum, e) => sum + e.amount, 0);
    const labourCost = jobTimesheets.reduce((sum, t) => sum + ((t.totalHours || 0) * (t.hourlyRate || 25)), 0);
    const totalCost = expenseCost + labourCost;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue * 100) : 0;
    const client = clients.find(c => c.id === job.clientId);

    return {
      ...job,
      clientName: client?.companyName || "Unknown",
      revenue,
      expenseCost,
      labourCost,
      totalCost,
      profit,
      margin,
    };
  }).filter(j => j.revenue > 0 || j.totalCost > 0);

  const clientProfitability = clients.map(client => {
    const clientJobs = jobs.filter(j => j.clientId === client.id);
    const clientJobIds = clientJobs.map(j => j.id);
    const clientInvoices = invoices.filter(i => i.clientId === client.id && i.status === "paid");
    const clientExpenses = expenses.filter(e => e.jobId && clientJobIds.includes(e.jobId));
    const clientTimesheets = timesheets.filter(t => t.jobId && clientJobIds.includes(t.jobId));

    const revenue = clientInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const expenseCost = clientExpenses.reduce((sum, e) => sum + e.amount, 0);
    const labourCost = clientTimesheets.reduce((sum, t) => sum + ((t.totalHours || 0) * (t.hourlyRate || 25)), 0);
    const totalCost = expenseCost + labourCost;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue * 100) : 0;

    return {
      ...client,
      jobCount: clientJobs.length,
      revenue,
      expenseCost,
      labourCost,
      totalCost,
      profit,
      margin,
    };
  }).filter(c => c.revenue > 0 || c.totalCost > 0);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      month: format(date, "MMM yyyy"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  const monthlyData = last6Months.map(({ month, start, end }) => {
    const monthInvoices = invoices.filter(i => {
      if (!i.paidAt) return false;
      const paidDate = parseISO(i.paidAt);
      return isAfter(paidDate, start) && isAfter(end, paidDate);
    });
    const monthExpenses = expenses.filter(e => {
      const expDate = parseISO(e.date);
      return isAfter(expDate, start) && isAfter(end, expDate);
    });

    const revenue = monthInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const expenseCost = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - expenseCost;

    return { month, revenue, expenses: expenseCost, profit };
  });

  const expensesByCategory = Object.entries(
    expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const topClients = [...clientProfitability].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const lossJobs = jobProfitability.filter(j => j.profit < 0).sort((a, b) => a.profit - b.profit);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Profitability Dashboard</h1>
        <p className="text-muted-foreground">Track profit margins across jobs and clients</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-revenue">
              £{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-total-costs">
              £{totalCosts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Expenses + Labour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            {grossProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-gross-profit">
              £{grossProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 20 ? "text-green-600" : profitMargin >= 0 ? "text-yellow-600" : "text-red-600"}`} data-testid="text-profit-margin">
              {profitMargin.toFixed(1)}%
            </div>
            <Progress value={Math.max(0, Math.min(100, profitMargin))} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Costs Trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `£${value.toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Total: £{totalExpenses.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `£${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Job Profitability</TabsTrigger>
          <TabsTrigger value="clients">Client Profitability</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Profitability</CardTitle>
              <CardDescription>Profit margins for completed jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {jobProfitability.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No job data with financials yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Costs</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobProfitability.slice(0, 10).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Link href={`/jobs/${job.id}`}>
                            <span className="font-medium hover:underline cursor-pointer">{job.title}</span>
                          </Link>
                          <div className="text-xs text-muted-foreground">{job.jobNumber}</div>
                        </TableCell>
                        <TableCell>{job.clientName}</TableCell>
                        <TableCell className="text-right text-green-600">£{job.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-orange-600">£{job.totalCost.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-medium ${job.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          £{job.profit.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={job.margin >= 20 ? "default" : job.margin >= 0 ? "secondary" : "destructive"}>
                            {job.margin.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Profitability</CardTitle>
              <CardDescription>Profit contribution by client</CardDescription>
            </CardHeader>
            <CardContent>
              {clientProfitability.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No client data with financials yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-center">Jobs</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Costs</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientProfitability.sort((a, b) => b.profit - a.profit).slice(0, 10).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Link href={`/clients/${client.id}`}>
                            <span className="font-medium hover:underline cursor-pointer">{client.companyName}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">{client.jobCount}</TableCell>
                        <TableCell className="text-right text-green-600">£{client.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-orange-600">£{client.totalCost.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-medium ${client.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          £{client.profit.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={client.margin >= 20 ? "default" : client.margin >= 0 ? "secondary" : "destructive"}>
                            {client.margin.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Loss-Making Jobs
                </CardTitle>
                <CardDescription>Jobs with negative profit margins</CardDescription>
              </CardHeader>
              <CardContent>
                {lossJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50 text-green-500" />
                    <p>No loss-making jobs - great work!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lossJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div>
                          <Link href={`/jobs/${job.id}`}>
                            <span className="font-medium hover:underline cursor-pointer">{job.title}</span>
                          </Link>
                          <div className="text-sm text-muted-foreground">{job.clientName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">-£{Math.abs(job.profit).toLocaleString()}</div>
                          <div className="text-sm text-red-600">{job.margin.toFixed(0)}% margin</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Top Clients
                </CardTitle>
                <CardDescription>Highest revenue clients</CardDescription>
              </CardHeader>
              <CardContent>
                {topClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No client revenue data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topClients.map((client, index) => (
                      <div key={client.id} className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <Link href={`/clients/${client.id}`}>
                            <span className="font-medium hover:underline cursor-pointer">{client.companyName}</span>
                          </Link>
                          <div className="text-sm text-muted-foreground">{client.jobCount} jobs</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">£{client.revenue.toLocaleString()}</div>
                          <div className={`text-sm ${client.margin >= 20 ? "text-green-600" : "text-orange-600"}`}>
                            {client.margin.toFixed(0)}% margin
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
