import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Calendar,
  Palmtree,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, differenceInBusinessDays, addDays, isWithinInterval, startOfYear, endOfYear } from "date-fns";
import { nanoid } from "nanoid";

interface Holiday {
  id: string;
  userId: string;
  employeeName: string | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  holidayType: string;
  status: string;
  reason: string | null;
  notes: string | null;
  approvedBy: string | null;
  createdAt: string;
}

export default function Holidays() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: holidays = [], isLoading } = useQuery<Holiday[]>({
    queryKey: ["/api/holidays"],
    enabled: !!user?.id,
  });

  const createHolidayMutation = useMutation({
    mutationFn: async (data: Partial<Holiday>) => {
      return apiRequest("POST", "/api/holidays", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Holiday request submitted" });
    },
    onError: () => {
      toast({ title: "Failed to submit request", variant: "destructive" });
    },
  });

  const updateHolidayMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Holiday> }) => {
      return apiRequest("PATCH", `/api/holidays/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({ title: "Holiday updated" });
    },
    onError: () => {
      toast({ title: "Failed to update holiday", variant: "destructive" });
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({ title: "Holiday deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete holiday", variant: "destructive" });
    },
  });

  const filteredHolidays = holidays.filter((holiday) => {
    if (statusFilter === "all") return true;
    return holiday.status === statusFilter;
  });

  const handleCreateHoliday = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const totalDays = differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1;
    
    createHolidayMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      employeeName: formData.get("employeeName") as string || user?.displayName || null,
      startDate,
      endDate,
      totalDays: Math.max(1, totalDays),
      holidayType: formData.get("holidayType") as string,
      status: "pending",
      reason: formData.get("reason") as string || null,
      notes: formData.get("notes") as string || null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "annual":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Annual Leave</Badge>;
      case "sick":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Sick Leave</Badge>;
      case "unpaid":
        return <Badge variant="outline">Unpaid</Badge>;
      case "compassionate":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">Compassionate</Badge>;
      case "other":
        return <Badge variant="secondary">Other</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getHolidayStats = () => {
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());
    
    const thisYearHolidays = holidays.filter(h => 
      isWithinInterval(parseISO(h.startDate), { start: yearStart, end: yearEnd })
    );
    
    const approved = thisYearHolidays.filter(h => h.status === "approved");
    const pending = thisYearHolidays.filter(h => h.status === "pending");
    const daysTaken = approved.reduce((sum, h) => sum + h.totalDays, 0);
    const daysRequested = pending.reduce((sum, h) => sum + h.totalDays, 0);
    
    const ANNUAL_ALLOWANCE = 28;
    const daysRemaining = Math.max(0, ANNUAL_ALLOWANCE - daysTaken);
    
    return { daysTaken, daysRequested, daysRemaining, pendingCount: pending.length };
  };

  const stats = getHolidayStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-holidays-title">Holidays</h1>
          <p className="text-muted-foreground">Manage leave requests and calendar</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-request-holiday">
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>Submit a new leave request</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateHoliday}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input 
                    id="employeeName" 
                    name="employeeName" 
                    defaultValue={user?.displayName || ""} 
                    data-testid="input-employee-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input id="startDate" name="startDate" type="date" required data-testid="input-start-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input id="endDate" name="endDate" type="date" required data-testid="input-end-date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holidayType">Leave Type</Label>
                  <Select name="holidayType" defaultValue="annual">
                    <SelectTrigger data-testid="select-holiday-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="compassionate">Compassionate Leave</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input id="reason" name="reason" data-testid="input-reason" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} data-testid="input-holiday-notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createHolidayMutation.isPending} data-testid="button-submit-request">
                  {createHolidayMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Days Taken</CardTitle>
            <Palmtree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daysTaken}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.daysRemaining}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            {stats.daysRequested > 0 && (
              <p className="text-xs text-muted-foreground">{stats.daysRequested} days</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Annual Allowance</CardTitle>
            <Palmtree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredHolidays.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palmtree className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No leave requests</h3>
            <p className="text-muted-foreground text-center mb-4">
              Submit your first leave request
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-first-request">
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.map((holiday) => (
                <TableRow key={holiday.id} data-testid={`row-holiday-${holiday.id}`}>
                  <TableCell>
                    <div className="font-medium">{holiday.employeeName || "Unknown"}</div>
                    {holiday.reason && (
                      <div className="text-sm text-muted-foreground">{holiday.reason}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(holiday.startDate), "MMM d")} - {format(parseISO(holiday.endDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{holiday.totalDays}</TableCell>
                  <TableCell>{getTypeBadge(holiday.holidayType)}</TableCell>
                  <TableCell>{getStatusBadge(holiday.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {holiday.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => updateHolidayMutation.mutate({ id: holiday.id, data: { status: "approved" } })}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateHolidayMutation.mutate({ id: holiday.id, data: { status: "rejected" } })}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
