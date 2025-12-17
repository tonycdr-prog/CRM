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
  Search,
  Receipt,
  Car,
  Wrench,
  Coffee,
  Fuel,
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
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { nanoid } from "nanoid";

interface Expense {
  id: string;
  userId: string;
  jobId: string | null;
  category: string;
  description: string;
  amount: string;
  vatAmount: string | null;
  date: string;
  receiptUrl: string | null;
  mileage: number | null;
  mileageRate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  jobNumber: string;
}

export default function Expenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.id,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: Partial<Expense>) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Expense created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create expense", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (categoryFilter === "all") return matchesSearch;
    return matchesSearch && expense.category === categoryFilter;
  });

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get("category") as string;
    
    let amount = parseFloat(formData.get("amount") as string) || 0;
    let mileage: number | null = null;
    let mileageRate: string | null = null;
    
    if (category === "mileage") {
      mileage = parseFloat(formData.get("mileage") as string) || 0;
      mileageRate = formData.get("mileageRate") as string || "0.45";
      amount = mileage * parseFloat(mileageRate);
    }
    
    createExpenseMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      jobId: formData.get("jobId") as string || null,
      category,
      description: formData.get("description") as string,
      amount: amount.toFixed(2),
      vatAmount: formData.get("vatAmount") as string || null,
      date: formData.get("date") as string || new Date().toISOString().split("T")[0],
      mileage,
      mileageRate,
      status: "pending",
      notes: formData.get("notes") as string || null,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "mileage":
        return <Car className="h-4 w-4" />;
      case "fuel":
        return <Fuel className="h-4 w-4" />;
      case "materials":
        return <Wrench className="h-4 w-4" />;
      case "subsistence":
        return <Coffee className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      mileage: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      fuel: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      materials: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      subsistence: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      equipment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    };
    return (
      <Badge className={colors[category] || ""}>
        <span className="flex items-center gap-1">
          {getCategoryIcon(category)}
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "reimbursed":
        return <Badge variant="secondary">Reimbursed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExpenseStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const thisMonthExpenses = expenses.filter(e => 
      isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })
    );
    
    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const mileageThisMonth = thisMonthExpenses
      .filter(e => e.category === "mileage")
      .reduce((sum, e) => sum + (e.mileage || 0), 0);
    const pendingCount = expenses.filter(e => e.status === "pending").length;
    const totalPending = expenses
      .filter(e => e.status === "pending")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    return { totalThisMonth, mileageThisMonth, pendingCount, totalPending };
  };

  const stats = getExpenseStats();

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
          <h1 className="text-2xl font-bold" data-testid="text-expenses-title">Expenses</h1>
          <p className="text-muted-foreground">Track site costs, mileage, and materials</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>Record a new expense</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateExpense}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" defaultValue="mileage">
                      <SelectTrigger data-testid="select-expense-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mileage">Mileage</SelectItem>
                        <SelectItem value="fuel">Fuel</SelectItem>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="subsistence">Subsistence</SelectItem>
                        <SelectItem value="parking">Parking</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      defaultValue={new Date().toISOString().split("T")[0]} 
                      data-testid="input-expense-date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input id="description" name="description" required data-testid="input-expense-description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage (miles)</Label>
                    <Input id="mileage" name="mileage" type="number" step="0.1" data-testid="input-mileage" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileageRate">Rate (£/mile)</Label>
                    <Input id="mileageRate" name="mileageRate" type="number" step="0.01" defaultValue="0.45" data-testid="input-mileage-rate" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (GBP)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" data-testid="input-expense-amount" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatAmount">VAT Amount</Label>
                    <Input id="vatAmount" name="vatAmount" type="number" step="0.01" data-testid="input-vat-amount" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobId">Related Job</Label>
                  <Select name="jobId">
                    <SelectTrigger data-testid="select-expense-job">
                      <SelectValue placeholder="Select job (optional)" />
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
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} data-testid="input-expense-notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createExpenseMutation.isPending} data-testid="button-save-expense">
                  {createExpenseMutation.isPending ? "Saving..." : "Save Expense"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats.totalThisMonth.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Mileage</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mileageThisMonth} mi</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">To Reimburse</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats.totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-expenses"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40" data-testid="select-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="mileage">Mileage</SelectItem>
            <SelectItem value="fuel">Fuel</SelectItem>
            <SelectItem value="materials">Materials</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="subsistence">Subsistence</SelectItem>
            <SelectItem value="parking">Parking</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No expenses found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Try adjusting your search" : "Add your first expense to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-expense">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Mileage</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                  <TableCell>{format(parseISO(expense.date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="font-medium">{expense.description}</div>
                    {expense.notes && (
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">{expense.notes}</div>
                    )}
                  </TableCell>
                  <TableCell>{getCategoryBadge(expense.category)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {expense.mileage ? `${expense.mileage} mi` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    £{parseFloat(expense.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
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
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
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
