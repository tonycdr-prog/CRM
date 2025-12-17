import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { Plus, FileCheck, Clock, TrendingUp, Trash2, Edit } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import type { DbTender } from "@shared/schema";

const STATUSES = ["received", "preparing", "submitted", "won", "lost", "withdrawn"] as const;

export default function Tenders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<DbTender | null>(null);
  const [formData, setFormData] = useState({
    tenderNumber: "",
    title: "",
    description: "",
    issuer: "",
    receivedDate: new Date().toISOString().split("T")[0],
    submissionDeadline: "",
    contractValue: "",
    contractDuration: "",
    bidAmount: "",
    winProbability: "50",
    status: "received",
  });

  const { data: tenders = [], isLoading } = useQuery<DbTender[]>({
    queryKey: ["/api/tenders"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/tenders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Tender added successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/tenders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      setIsDialogOpen(false);
      setEditingTender(null);
      resetForm();
      toast({ title: "Tender updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tenders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({ title: "Tender deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      tenderNumber: "",
      title: "",
      description: "",
      issuer: "",
      receivedDate: new Date().toISOString().split("T")[0],
      submissionDeadline: "",
      contractValue: "",
      contractDuration: "",
      bidAmount: "",
      winProbability: "50",
      status: "received",
    });
  };

  const openEditDialog = (tender: DbTender) => {
    setEditingTender(tender);
    setFormData({
      tenderNumber: tender.tenderNumber,
      title: tender.title,
      description: tender.description || "",
      issuer: tender.issuer || "",
      receivedDate: tender.receivedDate || "",
      submissionDeadline: tender.submissionDeadline || "",
      contractValue: tender.contractValue?.toString() || "",
      contractDuration: tender.contractDuration || "",
      bidAmount: tender.bidAmount?.toString() || "",
      winProbability: tender.winProbability?.toString() || "50",
      status: tender.status || "received",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      userId: user?.id,
      contractValue: formData.contractValue ? parseFloat(formData.contractValue) : null,
      bidAmount: formData.bidAmount ? parseFloat(formData.bidAmount) : null,
      winProbability: parseInt(formData.winProbability),
    };
    if (editingTender) {
      updateMutation.mutate({ id: editingTender.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      received: "bg-blue-500/10 text-blue-500",
      preparing: "bg-yellow-500/10 text-yellow-500",
      submitted: "bg-purple-500/10 text-purple-500",
      won: "bg-green-500/10 text-green-500",
      lost: "bg-red-500/10 text-red-500",
      withdrawn: "bg-gray-500/10 text-gray-500",
    };
    return <Badge className={styles[status] || "bg-gray-500/10 text-gray-500"}>{status.toUpperCase()}</Badge>;
  };

  const getDeadlineBadge = (deadline: string | null) => {
    if (!deadline) return null;
    const daysUntil = differenceInDays(parseISO(deadline), new Date());
    if (daysUntil < 0) return <Badge variant="destructive">Overdue</Badge>;
    if (daysUntil <= 7) return <Badge className="bg-red-500/10 text-red-500">{daysUntil}d left</Badge>;
    if (daysUntil <= 14) return <Badge className="bg-yellow-500/10 text-yellow-500">{daysUntil}d left</Badge>;
    return null;
  };

  const activeTenders = tenders.filter((t) => !["won", "lost", "withdrawn"].includes(t.status || ""));
  const totalPipelineValue = activeTenders.reduce((sum, t) => sum + (t.contractValue || 0), 0);
  const wonValue = tenders.filter((t) => t.status === "won").reduce((sum, t) => sum + (t.contractValue || 0), 0);
  const winRate = tenders.length > 0 
    ? Math.round((tenders.filter(t => t.status === "won").length / tenders.filter(t => ["won", "lost"].includes(t.status || "")).length) * 100) || 0
    : 0;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Tenders & Bids</h1>
          <p className="text-muted-foreground">Track tender submissions and outcomes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTender(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-tender">
              <Plus className="h-4 w-4 mr-2" />
              Add Tender
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTender ? "Edit Tender" : "Add New Tender"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tender Number *</Label>
                  <Input
                    value={formData.tenderNumber}
                    onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
                    placeholder="TEN-001"
                    required
                    data-testid="input-tender-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Annual Smoke Control Maintenance"
                  required
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Issuing Organisation</Label>
                <Input
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  placeholder="Housing Association"
                  data-testid="input-issuer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Received Date</Label>
                  <Input
                    type="date"
                    value={formData.receivedDate}
                    onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                    data-testid="input-received-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Submission Deadline</Label>
                  <Input
                    type="date"
                    value={formData.submissionDeadline}
                    onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                    data-testid="input-deadline"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Value (£)</Label>
                  <Input
                    type="number"
                    value={formData.contractValue}
                    onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                    data-testid="input-contract-value"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Our Bid Amount (£)</Label>
                  <Input
                    type="number"
                    value={formData.bidAmount}
                    onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                    data-testid="input-bid-amount"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Duration</Label>
                  <Input
                    value={formData.contractDuration}
                    onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
                    placeholder="3 years"
                    data-testid="input-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Win Probability (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.winProbability}
                    onChange={(e) => setFormData({ ...formData, winProbability: e.target.value })}
                    data-testid="input-probability"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  data-testid="input-description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-tender">
                  {editingTender ? "Update Tender" : "Save Tender"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Active Tenders</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-tenders">{activeTenders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pipeline-value">£{totalPipelineValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Won Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-won-value">£{wonValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-win-rate">{winRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tender Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Issuer</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No tenders yet. Click "Add Tender" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                tenders.map((tender) => (
                  <TableRow key={tender.id} data-testid={`row-tender-${tender.id}`}>
                    <TableCell className="font-mono font-medium">{tender.tenderNumber}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{tender.title}</TableCell>
                    <TableCell>{tender.issuer || "-"}</TableCell>
                    <TableCell>£{(tender.contractValue || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tender.submissionDeadline ? format(parseISO(tender.submissionDeadline), "dd/MM/yyyy") : "-"}
                        {getDeadlineBadge(tender.submissionDeadline)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tender.status || "received")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(tender)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(tender.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
