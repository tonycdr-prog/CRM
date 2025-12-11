import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FileText, Calendar, Lock, User } from "lucide-react";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import type { DbDocumentRegister } from "@shared/schema";

export default function DocumentRegisterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DbDocumentRegister | null>(null);
  const [formData, setFormData] = useState({
    documentNumber: "",
    title: "",
    category: "",
    documentType: "",
    description: "",
    version: "1.0",
    issueDate: "",
    expiryDate: "",
    reviewDate: "",
    status: "current",
    fileReference: "",
    issuedBy: "",
    approvedBy: "",
    notes: "",
    isConfidential: false,
  });

  const { data: documents = [], isLoading } = useQuery<DbDocumentRegister[]>({
    queryKey: ["/api/document-register", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/document-register", { ...data, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-register", user?.id] });
      toast({ title: "Document registered successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to register document", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/document-register/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-register", user?.id] });
      toast({ title: "Document updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update document", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/document-register/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-register", user?.id] });
      toast({ title: "Document deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete document", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      documentNumber: "", title: "", category: "", documentType: "", description: "",
      version: "1.0", issueDate: "", expiryDate: "", reviewDate: "", status: "current",
      fileReference: "", issuedBy: "", approvedBy: "", notes: "", isConfidential: false,
    });
    setEditingDoc(null);
  };

  const handleEdit = (doc: DbDocumentRegister) => {
    setEditingDoc(doc);
    setFormData({
      documentNumber: doc.documentNumber || "",
      title: doc.title || "",
      category: doc.category || "",
      documentType: doc.documentType || "",
      description: doc.description || "",
      version: doc.version || "1.0",
      issueDate: doc.issueDate || "",
      expiryDate: doc.expiryDate || "",
      reviewDate: doc.reviewDate || "",
      status: doc.status || "current",
      fileReference: doc.fileReference || "",
      issuedBy: doc.issuedBy || "",
      approvedBy: doc.approvedBy || "",
      notes: doc.notes || "",
      isConfidential: doc.isConfidential || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.documentNumber || !formData.title) {
      toast({ title: "Please enter document number and title", variant: "destructive" });
      return;
    }
    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryBadge = (category: string | null) => {
    const colors: Record<string, string> = {
      certificate: "bg-green-500/10 text-green-500",
      report: "bg-blue-500/10 text-blue-500",
      drawing: "bg-purple-500/10 text-purple-500",
      manual: "bg-orange-500/10 text-orange-500",
      policy: "bg-cyan-500/10 text-cyan-500",
      insurance: "bg-yellow-500/10 text-yellow-500",
      contract: "bg-pink-500/10 text-pink-500",
    };
    return colors[category || ""] || "bg-muted text-muted-foreground";
  };

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500/10 text-gray-500",
      current: "bg-green-500/10 text-green-500",
      superseded: "bg-orange-500/10 text-orange-500",
      archived: "bg-blue-500/10 text-blue-500",
    };
    return colors[status || "current"] || "bg-muted text-muted-foreground";
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const expiry = parseISO(expiryDate);
    const daysUntil = differenceInDays(expiry, new Date());

    if (isPast(expiry)) {
      return <Badge className="bg-red-500/10 text-red-500">Expired</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge className="bg-orange-500/10 text-orange-500">Expires in {daysUntil} days</Badge>;
    } else if (daysUntil <= 90) {
      return <Badge className="bg-yellow-500/10 text-yellow-500">Expires in {daysUntil} days</Badge>;
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Document Register</h1>
            <p className="text-muted-foreground">Track and manage controlled documents</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-document"><Plus className="w-4 h-4 mr-2" />Add Document</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingDoc ? "Edit Document" : "Add Document"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">Document Number *</Label>
                  <Input id="documentNumber" value={formData.documentNumber} onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })} placeholder="DOC-001" data-testid="input-document-number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input id="version" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} data-testid="input-version" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} data-testid="input-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="drawing">Drawing</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select value={formData.documentType} onValueChange={(value) => setFormData({ ...formData, documentType: value })}>
                    <SelectTrigger data-testid="select-document-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="word">Word</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="cad">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} data-testid="input-description" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input id="issueDate" type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} data-testid="input-issue-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} data-testid="input-expiry-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewDate">Review Date</Label>
                  <Input id="reviewDate" type="date" value={formData.reviewDate} onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })} data-testid="input-review-date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issuedBy">Issued By</Label>
                  <Input id="issuedBy" value={formData.issuedBy} onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })} data-testid="input-issued-by" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvedBy">Approved By</Label>
                  <Input id="approvedBy" value={formData.approvedBy} onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })} data-testid="input-approved-by" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="superseded">Superseded</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileReference">File Reference</Label>
                  <Input id="fileReference" value={formData.fileReference} onChange={(e) => setFormData({ ...formData, fileReference: e.target.value })} placeholder="Path or reference" data-testid="input-file-reference" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} data-testid="input-notes" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isConfidential" checked={formData.isConfidential} onCheckedChange={(checked) => setFormData({ ...formData, isConfidential: checked })} data-testid="switch-confidential" />
                <Label htmlFor="isConfidential">Confidential Document</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                {editingDoc ? "Update" : "Register"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents registered</h3>
            <p className="text-muted-foreground mb-4">Add documents to track certificates, policies, and other controlled documents</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg truncate" data-testid={`text-title-${doc.id}`}>{doc.title}</CardTitle>
                      {doc.isConfidential && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{doc.documentNumber} v{doc.version}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)} data-testid={`button-edit-${doc.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(doc.id)} data-testid={`button-delete-${doc.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusBadge(doc.status)} data-testid={`badge-status-${doc.id}`}>
                    {doc.status}
                  </Badge>
                  {doc.category && (
                    <Badge className={getCategoryBadge(doc.category)}>
                      {doc.category}
                    </Badge>
                  )}
                  {getExpiryBadge(doc.expiryDate)}
                </div>

                <div className="space-y-1 text-sm">
                  {doc.description && (
                    <p className="text-muted-foreground line-clamp-2">{doc.description}</p>
                  )}
                  {doc.issueDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Issued: {format(parseISO(doc.issueDate), "dd MMM yyyy")}</span>
                    </div>
                  )}
                  {doc.issuedBy && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{doc.issuedBy}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
