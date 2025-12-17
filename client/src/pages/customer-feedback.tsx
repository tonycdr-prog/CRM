import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Search,
  Calendar,
  User
} from "lucide-react";
import type { DbCustomerFeedback, DbClient, DbJob } from "@shared/schema";

export default function CustomerFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<DbCustomerFeedback | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [formData, setFormData] = useState({
    clientId: "",
    jobId: "",
    feedbackDate: new Date().toISOString().split('T')[0],
    rating: "5",
    category: "general",
    feedbackType: "positive",
    summary: "",
    details: "",
    actionTaken: "",
    followUpRequired: false,
    followUpDate: "",
    followUpNotes: "",
    staffMember: "",
    source: "direct",
    isPublic: false,
  });

  const { data: feedbackList = [], isLoading } = useQuery<DbCustomerFeedback[]>({
    queryKey: ["/api/customer-feedback"],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<DbClient[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<DbJob[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/customer-feedback", { 
      ...data, 
      rating: parseInt(data.rating),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-feedback"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Feedback recorded" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/customer-feedback/${id}`, {
      ...data,
      rating: parseInt(data.rating),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-feedback"] });
      setIsDialogOpen(false);
      setEditingFeedback(null);
      resetForm();
      toast({ title: "Feedback updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/customer-feedback/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-feedback"] });
      toast({ title: "Feedback deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      clientId: "",
      jobId: "",
      feedbackDate: new Date().toISOString().split('T')[0],
      rating: "5",
      category: "general",
      feedbackType: "positive",
      summary: "",
      details: "",
      actionTaken: "",
      followUpRequired: false,
      followUpDate: "",
      followUpNotes: "",
      staffMember: "",
      source: "direct",
      isPublic: false,
    });
  };

  const handleEdit = (feedback: DbCustomerFeedback) => {
    setEditingFeedback(feedback);
    setFormData({
      clientId: feedback.clientId || "",
      jobId: feedback.jobId || "",
      feedbackDate: feedback.feedbackDate,
      rating: String(feedback.rating),
      category: feedback.category || "general",
      feedbackType: feedback.feedbackType || "positive",
      summary: feedback.summary,
      details: feedback.details || "",
      actionTaken: feedback.actionTaken || "",
      followUpRequired: feedback.followUpRequired || false,
      followUpDate: feedback.followUpDate || "",
      followUpNotes: feedback.followUpNotes || "",
      staffMember: feedback.staffMember || "",
      source: feedback.source || "direct",
      isPublic: feedback.isPublic || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFeedback) {
      updateMutation.mutate({ id: editingFeedback.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "No client";
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || "Unknown";
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
      />
    ));
  };

  const getFeedbackTypeIcon = (type: string | null) => {
    switch (type) {
      case "positive": return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case "negative": return <ThumbsDown className="w-4 h-4 text-red-500" />;
      case "suggestion": return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default: return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredFeedback = feedbackList.filter(fb => {
    const matchesSearch = fb.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || fb.feedbackType === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: feedbackList.length,
    positive: feedbackList.filter(f => f.feedbackType === "positive").length,
    negative: feedbackList.filter(f => f.feedbackType === "negative").length,
    avgRating: feedbackList.length > 0 
      ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
      : "0",
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" data-testid="loading-state">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-customer-feedback">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Customer Feedback</h1>
          <p className="text-muted-foreground">Track client feedback, ratings, and improvement opportunities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingFeedback(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-feedback">
              <Plus className="w-4 h-4 mr-2" />
              Add Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingFeedback ? "Edit Feedback" : "Record Customer Feedback"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Related Job</Label>
                  <Select value={formData.jobId} onValueChange={(v) => setFormData({ ...formData, jobId: v })}>
                    <SelectTrigger data-testid="select-job">
                      <SelectValue placeholder="Select job (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={formData.feedbackDate} onChange={(e) => setFormData({ ...formData, feedbackDate: e.target.value })} required data-testid="input-date" />
                </div>
                <div>
                  <Label>Rating (1-5) *</Label>
                  <Select value={formData.rating} onValueChange={(v) => setFormData({ ...formData, rating: v })}>
                    <SelectTrigger data-testid="select-rating">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="timeliness">Timeliness</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="value">Value for Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Feedback Type</Label>
                  <Select value={formData.feedbackType} onValueChange={(v) => setFormData({ ...formData, feedbackType: v })}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="suggestion">Suggestion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                    <SelectTrigger data-testid="select-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="survey">Survey</SelectItem>
                      <SelectItem value="online">Online Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Staff Member</Label>
                  <Input value={formData.staffMember} onChange={(e) => setFormData({ ...formData, staffMember: e.target.value })} data-testid="input-staff" />
                </div>
              </div>

              <div>
                <Label>Summary *</Label>
                <Input value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} required data-testid="input-summary" />
              </div>

              <div>
                <Label>Details</Label>
                <Textarea value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} rows={3} data-testid="input-details" />
              </div>

              <div>
                <Label>Action Taken</Label>
                <Textarea value={formData.actionTaken} onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })} rows={2} data-testid="input-action" />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Switch checked={formData.followUpRequired} onCheckedChange={(v) => setFormData({ ...formData, followUpRequired: v })} data-testid="switch-followup" />
                  <Label>Follow-up Required</Label>
                </div>
                {formData.followUpRequired && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Follow-up Date</Label>
                      <Input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} data-testid="input-followup-date" />
                    </div>
                    <div className="col-span-2">
                      <Label>Follow-up Notes</Label>
                      <Textarea value={formData.followUpNotes} onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })} data-testid="input-followup-notes" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={formData.isPublic} onCheckedChange={(v) => setFormData({ ...formData, isPublic: v })} data-testid="switch-public" />
                <Label>Public testimonial</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingFeedback ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600" data-testid="stat-positive">{stats.positive}</div>
            <p className="text-sm text-muted-foreground">Positive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600" data-testid="stat-negative">{stats.negative}</div>
            <p className="text-sm text-muted-foreground">Negative</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1" data-testid="stat-rating">
              {stats.avgRating} <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search feedback..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40" data-testid="select-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="suggestion">Suggestions</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" data-testid="badge-count">{filteredFeedback.length} records</Badge>
      </div>

      {filteredFeedback.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-empty-state">No customer feedback found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFeedback.map((fb) => (
            <Card key={fb.id} data-testid={`card-feedback-${fb.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFeedbackTypeIcon(fb.feedbackType)}
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-summary-${fb.id}`}>{fb.summary}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">{getRatingStars(fb.rating)}</div>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{getClientName(fb.clientId)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(fb)} data-testid={`button-edit-${fb.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(fb.id)} data-testid={`button-delete-${fb.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fb.details && <p className="text-sm mb-3">{fb.details}</p>}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fb.feedbackDate}
                  </Badge>
                  <Badge variant="outline">{fb.category}</Badge>
                  <Badge variant="outline">{fb.source}</Badge>
                  {fb.staffMember && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {fb.staffMember}
                    </Badge>
                  )}
                  {fb.followUpRequired && <Badge variant="destructive">Follow-up Required</Badge>}
                  {fb.isPublic && <Badge variant="secondary">Public</Badge>}
                </div>
                {fb.actionTaken && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <strong>Action Taken:</strong> {fb.actionTaken}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
