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
import { Plus, Pencil, Trash2, StickyNote, Calendar, User, Phone, Mail, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DbWorkNote, DbClient, DbJob } from "@shared/schema";

export default function WorkNotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DbWorkNote | null>(null);
  const [formData, setFormData] = useState({
    noteDate: format(new Date(), "yyyy-MM-dd"),
    noteType: "general",
    subject: "",
    content: "",
    authorName: "",
    contactPerson: "",
    clientId: "",
    jobId: "",
    isInternal: false,
    priority: "normal",
    followUpRequired: false,
    followUpDate: "",
    followUpCompleted: false,
  });

  const { data: notes = [], isLoading } = useQuery<DbWorkNote[]>({
    queryKey: ["/api/work-notes"],
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
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/work-notes", { ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-notes"] });
      toast({ title: "Work note created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create work note", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/work-notes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-notes"] });
      toast({ title: "Work note updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update work note", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/work-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-notes"] });
      toast({ title: "Work note deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete work note", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      noteDate: format(new Date(), "yyyy-MM-dd"), noteType: "general", subject: "", content: "",
      authorName: "", contactPerson: "", clientId: "", jobId: "", isInternal: false,
      priority: "normal", followUpRequired: false, followUpDate: "", followUpCompleted: false,
    });
    setEditingNote(null);
  };

  const handleEdit = (note: DbWorkNote) => {
    setEditingNote(note);
    setFormData({
      noteDate: note.noteDate || format(new Date(), "yyyy-MM-dd"),
      noteType: note.noteType || "general",
      subject: note.subject || "",
      content: note.content || "",
      authorName: note.authorName || "",
      contactPerson: note.contactPerson || "",
      clientId: note.clientId || "",
      jobId: note.jobId || "",
      isInternal: note.isInternal || false,
      priority: note.priority || "normal",
      followUpRequired: note.followUpRequired || false,
      followUpDate: note.followUpDate || "",
      followUpCompleted: note.followUpCompleted || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.content) {
      toast({ title: "Please enter note content", variant: "destructive" });
      return;
    }
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getNoteTypeBadge = (type: string | null) => {
    const colors: Record<string, string> = {
      general: "bg-gray-500/10 text-gray-500",
      site_visit: "bg-blue-500/10 text-blue-500",
      phone_call: "bg-green-500/10 text-green-500",
      email: "bg-purple-500/10 text-purple-500",
      meeting: "bg-orange-500/10 text-orange-500",
      issue: "bg-red-500/10 text-red-500",
    };
    return colors[type || "general"] || "bg-muted text-muted-foreground";
  };

  const getNoteTypeIcon = (type: string | null) => {
    switch (type) {
      case "phone_call": return <Phone className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "meeting": return <User className="w-4 h-4" />;
      case "issue": return <AlertCircle className="w-4 h-4" />;
      default: return <StickyNote className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    const colors: Record<string, string> = {
      low: "bg-gray-500/10 text-gray-500",
      normal: "bg-blue-500/10 text-blue-500",
      high: "bg-orange-500/10 text-orange-500",
      urgent: "bg-red-500/10 text-red-500",
    };
    return colors[priority || "normal"] || "bg-muted text-muted-foreground";
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "";
    const client = clients.find((c) => c.id === clientId);
    return client?.companyName || "";
  };

  const getJobRef = (jobId: string | null) => {
    if (!jobId) return "";
    const job = jobs.find((j) => j.id === jobId);
    return job?.jobNumber || "";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <StickyNote className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Work Notes</h1>
            <p className="text-muted-foreground">Job-related communication and activity log</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-note"><Plus className="w-4 h-4 mr-2" />Add Note</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingNote ? "Edit Note" : "Add Work Note"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="noteDate">Date</Label>
                  <Input id="noteDate" type="date" value={formData.noteDate} onChange={(e) => setFormData({ ...formData, noteDate: e.target.value })} data-testid="input-note-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noteType">Type</Label>
                  <Select value={formData.noteType} onValueChange={(value) => setFormData({ ...formData, noteType: value })}>
                    <SelectTrigger data-testid="select-note-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="site_visit">Site Visit</SelectItem>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="issue">Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Brief subject line" data-testid="input-subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Note Content *</Label>
                <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} placeholder="Enter details..." data-testid="input-content" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorName">Author</Label>
                  <Input id="authorName" value={formData.authorName} onChange={(e) => setFormData({ ...formData, authorName: e.target.value })} data-testid="input-author" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} data-testid="input-contact" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                    <SelectTrigger data-testid="select-client"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobId">Related Job</Label>
                  <Select value={formData.jobId} onValueChange={(value) => setFormData({ ...formData, jobId: value })}>
                    <SelectTrigger data-testid="select-job"><SelectValue placeholder="Select job" /></SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.jobNumber} - {job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch id="isInternal" checked={formData.isInternal} onCheckedChange={(checked) => setFormData({ ...formData, isInternal: checked })} data-testid="switch-internal" />
                    <Label htmlFor="isInternal">Internal Only</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Switch id="followUpRequired" checked={formData.followUpRequired} onCheckedChange={(checked) => setFormData({ ...formData, followUpRequired: checked })} data-testid="switch-follow-up" />
                  <Label htmlFor="followUpRequired">Follow-up Required</Label>
                </div>
                {formData.followUpRequired && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="followUpDate">Follow-up Date</Label>
                      <Input id="followUpDate" type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} data-testid="input-follow-up-date" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch id="followUpCompleted" checked={formData.followUpCompleted} onCheckedChange={(checked) => setFormData({ ...formData, followUpCompleted: checked })} data-testid="switch-follow-up-completed" />
                      <Label htmlFor="followUpCompleted">Completed</Label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                {editingNote ? "Update" : "Add Note"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading work notes...</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <StickyNote className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No work notes</h3>
            <p className="text-muted-foreground mb-4">Add notes to track communications and activities</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Card key={note.id} data-testid={`card-note-${note.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {getNoteTypeIcon(note.noteType)}
                    </div>
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-subject-${note.id}`}>
                        {note.subject || (note.noteType || "General").replace("_", " ")}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getNoteTypeBadge(note.noteType)}>
                          {(note.noteType || "general").replace("_", " ")}
                        </Badge>
                        {note.priority !== "normal" && (
                          <Badge className={getPriorityBadge(note.priority)}>
                            {note.priority}
                          </Badge>
                        )}
                        {note.isInternal && (
                          <Badge className="bg-purple-500/10 text-purple-500">Internal</Badge>
                        )}
                        {note.followUpRequired && !note.followUpCompleted && (
                          <Badge className="bg-orange-500/10 text-orange-500">Follow-up Due</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(note)} data-testid={`button-edit-${note.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(note.id)} data-testid={`button-delete-${note.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 whitespace-pre-wrap" data-testid={`text-content-${note.id}`}>{note.content}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{note.noteDate && format(parseISO(note.noteDate), "dd MMM yyyy")}</span>
                  </div>
                  {note.authorName && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{note.authorName}</span>
                    </div>
                  )}
                  {note.clientId && <span>Client: {getClientName(note.clientId)}</span>}
                  {note.jobId && <span>Job: {getJobRef(note.jobId)}</span>}
                  {note.followUpDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Follow-up: {format(parseISO(note.followUpDate), "dd MMM")}</span>
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
