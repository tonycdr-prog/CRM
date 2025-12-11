import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Award, AlertCircle, Trash2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import type { DbCertification } from "@shared/schema";

export default function Certifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    technicianName: "",
    certificationType: "cscs",
    certificationName: "",
    issuingBody: "",
    certificateNumber: "",
    issueDate: "",
    expiryDate: "",
  });

  const { data: certifications = [], isLoading } = useQuery<DbCertification[]>({
    queryKey: ["/api/certifications", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/certifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", user?.id] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Certification added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add certification", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", user?.id] });
      toast({ title: "Certification deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      technicianName: "",
      certificationType: "cscs",
      certificationName: "",
      issuingBody: "",
      certificateNumber: "",
      issueDate: "",
      expiryDate: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      userId: user?.id,
    });
  };

  const getCertTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      cscs: "bg-green-500/10 text-green-500",
      ipaf: "bg-blue-500/10 text-blue-500",
      pasma: "bg-purple-500/10 text-purple-500",
      first_aid: "bg-red-500/10 text-red-500",
      asbestos: "bg-yellow-500/10 text-yellow-500",
      electrical: "bg-orange-500/10 text-orange-500",
    };
    return <Badge className={styles[type] || "bg-gray-500/10 text-gray-500"}>{type.toUpperCase().replace("_", " ")}</Badge>;
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return <Badge className="bg-gray-500/10 text-gray-500">No Expiry</Badge>;
    const daysUntil = differenceInDays(parseISO(expiryDate), new Date());
    if (daysUntil < 0) return <Badge variant="destructive">Expired</Badge>;
    if (daysUntil <= 30) return <Badge className="bg-red-500/10 text-red-500">Expiring Soon</Badge>;
    if (daysUntil <= 90) return <Badge className="bg-yellow-500/10 text-yellow-500">Expiring in 3 Months</Badge>;
    return <Badge className="bg-green-500/10 text-green-500">Valid</Badge>;
  };

  const expiredCount = certifications.filter(c => 
    c.expiryDate && differenceInDays(parseISO(c.expiryDate), new Date()) < 0
  ).length;

  const expiringCount = certifications.filter(c => 
    c.expiryDate && differenceInDays(parseISO(c.expiryDate), new Date()) <= 30 && differenceInDays(parseISO(c.expiryDate), new Date()) >= 0
  ).length;

  const technicians = Array.from(new Set(certifications.map(c => c.technicianName)));

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Certifications</h1>
          <p className="text-muted-foreground">Track technician qualifications and expiry dates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-certification">
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Certification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Technician Name *</Label>
                <Input
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                  placeholder="John Smith"
                  required
                  data-testid="input-technician-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Certification Type</Label>
                  <Select value={formData.certificationType} onValueChange={(v) => setFormData({ ...formData, certificationType: v })}>
                    <SelectTrigger data-testid="select-cert-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cscs">CSCS</SelectItem>
                      <SelectItem value="ipaf">IPAF</SelectItem>
                      <SelectItem value="pasma">PASMA</SelectItem>
                      <SelectItem value="first_aid">First Aid</SelectItem>
                      <SelectItem value="asbestos">Asbestos Awareness</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Certificate Name *</Label>
                  <Input
                    value={formData.certificationName}
                    onChange={(e) => setFormData({ ...formData, certificationName: e.target.value })}
                    placeholder="CSCS Green Card"
                    required
                    data-testid="input-cert-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issuing Body</Label>
                  <Input
                    value={formData.issuingBody}
                    onChange={(e) => setFormData({ ...formData, issuingBody: e.target.value })}
                    placeholder="CSCS Ltd"
                    data-testid="input-issuing-body"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Certificate Number</Label>
                  <Input
                    value={formData.certificateNumber}
                    onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                    data-testid="input-cert-number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    data-testid="input-issue-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    data-testid="input-expiry-date"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-certification">
                  {createMutation.isPending ? "Saving..." : "Save Certification"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-certifications">{certifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Technicians</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-technician-count">{technicians.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-expired-count">{expiredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500" data-testid="text-expiring-count">{expiringCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certification List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technician</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Certificate Name</TableHead>
                <TableHead>Issuing Body</TableHead>
                <TableHead>Certificate No.</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No certifications added yet. Click "Add Certification" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                certifications.map((cert) => (
                  <TableRow key={cert.id} data-testid={`row-certification-${cert.id}`}>
                    <TableCell className="font-medium">{cert.technicianName}</TableCell>
                    <TableCell>{getCertTypeBadge(cert.certificationType)}</TableCell>
                    <TableCell>{cert.certificationName}</TableCell>
                    <TableCell>{cert.issuingBody || "-"}</TableCell>
                    <TableCell className="font-mono">{cert.certificateNumber || "-"}</TableCell>
                    <TableCell>
                      {cert.expiryDate ? format(parseISO(cert.expiryDate), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>{getExpiryStatus(cert.expiryDate)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(cert.id)}
                        data-testid={`button-delete-cert-${cert.id}`}
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
