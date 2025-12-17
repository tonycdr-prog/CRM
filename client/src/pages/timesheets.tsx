import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search,
  Clock,
  Calendar,
  MoreHorizontal,
  Trash2,
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, addDays } from "date-fns";
import { nanoid } from "nanoid";

interface Timesheet {
  id: string;
  userId: string;
  jobId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  totalHours: string;
  hourlyRate: string | null;
  totalAmount: string | null;
  description: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  jobNumber: string;
}

export default function Timesheets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: timesheets = [], isLoading } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets"],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.id,
  });

  const createTimesheetMutation = useMutation({
    mutationFn: async (data: Partial<Timesheet>) => {
      return apiRequest("POST", "/api/timesheets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Time entry created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create time entry", variant: "destructive" });
    },
  });

  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/timesheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({ title: "Time entry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete time entry", variant: "destructive" });
    },
  });

  const handleCreateTimesheet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const breakDuration = parseInt(formData.get("breakDuration") as string) || 0;
    const hourlyRate = parseFloat(formData.get("hourlyRate") as string) || 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    let totalMinutes = (end.getTime() - start.getTime()) / 60000 - breakDuration;
    if (totalMinutes < 0) totalMinutes = 0;
    const totalHours = totalMinutes / 60;
    const totalAmount = totalHours * hourlyRate;
    
    createTimesheetMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      jobId: formData.get("jobId") as string || null,
      date: formData.get("date") as string || new Date().toISOString().split("T")[0],
      startTime,
      endTime,
      breakDuration,
      totalHours: totalHours.toFixed(2),
      hourlyRate: hourlyRate.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      description: formData.get("description") as string || null,
      status: "pending",
      notes: formData.get("notes") as string || null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJobInfo = (jobId: string | null) => {
    if (!jobId) return "-";
    const job = jobs.find(j => j.id === jobId);
    return job ? `${job.jobNumber}` : "-";
  };

  const getTimesheetStats = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    const thisWeekEntries = timesheets.filter(t => 
      isWithinInterval(parseISO(t.date), { start: weekStart, end: weekEnd })
    );
    
    const hoursThisWeek = thisWeekEntries.reduce((sum, t) => sum + parseFloat(t.totalHours), 0);
    const earningsThisWeek = thisWeekEntries.reduce((sum, t) => sum + parseFloat(t.totalAmount || "0"), 0);
    const pendingCount = timesheets.filter(t => t.status === "pending").length;
    const totalEntries = timesheets.length;
    
    return { hoursThisWeek, earningsThisWeek, pendingCount, totalEntries };
  };

  const stats = getTimesheetStats();

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
          <h1 className="text-2xl font-bold" data-testid="text-timesheets-title">Timesheets</h1>
          <p className="text-muted-foreground">Track working hours and time entries</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-time">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
              <DialogDescription>Record working hours</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTimesheet}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      defaultValue={new Date().toISOString().split("T")[0]} 
                      data-testid="input-timesheet-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobId">Job</Label>
                    <Select name="jobId">
                      <SelectTrigger data-testid="select-timesheet-job">
                        <SelectValue placeholder="Select job" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.jobNumber} - {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input id="startTime" name="startTime" type="time" required defaultValue="08:00" data-testid="input-start-time" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input id="endTime" name="endTime" type="time" required defaultValue="17:00" data-testid="input-end-time" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakDuration">Break (min)</Label>
                    <Input id="breakDuration" name="breakDuration" type="number" defaultValue="60" data-testid="input-break-duration" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (GBP)</Label>
                  <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" defaultValue="25" data-testid="input-hourly-rate" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" data-testid="input-timesheet-description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} data-testid="input-timesheet-notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTimesheetMutation.isPending} data-testid="button-save-time">
                  {createTimesheetMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursThisWeek.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats.earningsThisWeek.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </CardContent>
        </Card>
      </div>

      {timesheets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No time entries yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your working hours
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-time">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right hidden md:table-cell">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map((entry) => (
                <TableRow key={entry.id} data-testid={`row-timesheet-${entry.id}`}>
                  <TableCell>{format(parseISO(entry.date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="font-medium">{getJobInfo(entry.jobId)}</div>
                    {entry.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]">{entry.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.startTime} - {entry.endTime}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {parseFloat(entry.totalHours).toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {entry.totalAmount && `£${parseFloat(entry.totalAmount).toFixed(2)}`}
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteTimesheetMutation.mutate(entry.id)}
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
