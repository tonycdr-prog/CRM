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
import { Switch } from "@/components/ui/switch";
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
import { Plus, AlertTriangle, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DbIncident } from "@shared/schema";

export default function Incidents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: "",
    location: "",
    type: "near_miss",
    severity: "low",
    description: "",
    immediateActions: "",
    rootCause: "",
    correctiveActions: "",
    riddorReportable: false,
  });

  const { data: incidents = [], isLoading } = useQuery<DbIncident[]>({
    queryKey: ["/api/incidents"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/incidents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Incident reported successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      toast({ title: "Incident deleted" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/incidents/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      toast({ title: "Status updated" });
    },
  });

  const resetForm = () => {
    setFormData({
      incidentDate: new Date().toISOString().split("T")[0],
      incidentTime: "",
      location: "",
      type: "near_miss",
      severity: "low",
      description: "",
      immediateActions: "",
      rootCause: "",
      correctiveActions: "",
      riddorReportable: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, userId: user?.id });
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      accident: "bg-red-500/10 text-red-500",
      near_miss: "bg-yellow-500/10 text-yellow-500",
      unsafe_condition: "bg-orange-500/10 text-orange-500",
      damage: "bg-purple-500/10 text-purple-500",
    };
    return <Badge className={styles[type] || "bg-gray-500/10 text-gray-500"}>{type.replace("_", " ").toUpperCase()}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      low: "bg-green-500/10 text-green-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      high: "bg-orange-500/10 text-orange-500",
      critical: "bg-red-500/10 text-red-500",
    };
    return <Badge className={styles[severity] || "bg-gray-500/10 text-gray-500"}>{severity.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { class: string; icon: any }> = {
      open: { class: "bg-red-500/10 text-red-500", icon: AlertCircle },
      investigating: { class: "bg-yellow-500/10 text-yellow-500", icon: AlertTriangle },
      closed: { class: "bg-green-500/10 text-green-500", icon: CheckCircle },
    };
    const style = styles[status] || styles.open;
    const Icon = style.icon;
    return (
      <Badge className={style.class}>
        <Icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const openCount = incidents.filter((i) => i.status === "open").length;
  const investigatingCount = incidents.filter((i) => i.status === "investigating").length;
  const riddorCount = incidents.filter((i) => i.riddorReportable).length;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Incident Reports</h1>
          <p className="text-muted-foreground">Track accidents, near misses, and safety concerns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-incident">
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    required
                    data-testid="input-incident-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                    data-testid="input-incident-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="near_miss">Near Miss</SelectItem>
                      <SelectItem value="unsafe_condition">Unsafe Condition</SelectItem>
                      <SelectItem value="damage">Property Damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Site / floor / area"
                    required
                    data-testid="input-location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What happened?"
                  rows={3}
                  required
                  data-testid="input-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Immediate Actions Taken</Label>
                <Textarea
                  value={formData.immediateActions}
                  onChange={(e) => setFormData({ ...formData, immediateActions: e.target.value })}
                  placeholder="What was done immediately?"
                  rows={2}
                  data-testid="input-immediate-actions"
                />
              </div>
              <div className="space-y-2">
                <Label>Root Cause (if known)</Label>
                <Textarea
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  placeholder="Why did this happen?"
                  rows={2}
                  data-testid="input-root-cause"
                />
              </div>
              <div className="space-y-2">
                <Label>Corrective Actions</Label>
                <Textarea
                  value={formData.correctiveActions}
                  onChange={(e) => setFormData({ ...formData, correctiveActions: e.target.value })}
                  placeholder="What will be done to prevent recurrence?"
                  rows={2}
                  data-testid="input-corrective-actions"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-500/5 rounded-md border border-red-500/20">
                <Switch
                  checked={formData.riddorReportable}
                  onCheckedChange={(checked) => setFormData({ ...formData, riddorReportable: checked })}
                  data-testid="switch-riddor"
                />
                <Label className="text-red-500">RIDDOR Reportable</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-incident">
                  Report Incident
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-incidents">{incidents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500" data-testid="text-open-incidents">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Investigating</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500" data-testid="text-investigating">{investigatingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">RIDDOR Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-riddor-count">{riddorCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No incidents reported yet.
                  </TableCell>
                </TableRow>
              ) : (
                incidents.map((incident) => (
                  <TableRow key={incident.id} data-testid={`row-incident-${incident.id}`}>
                    <TableCell>
                      {format(parseISO(incident.incidentDate), "dd/MM/yyyy")}
                      {incident.incidentTime && <span className="text-muted-foreground ml-1">{incident.incidentTime}</span>}
                    </TableCell>
                    <TableCell>{getTypeBadge(incident.type)}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{incident.location}</TableCell>
                    <TableCell>{getSeverityBadge(incident.severity || "low")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{incident.description}</TableCell>
                    <TableCell>
                      <Select
                        value={incident.status || "open"}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: incident.id, status: v })}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(incident.id)}
                        data-testid={`button-delete-incident-${incident.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
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
