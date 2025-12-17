import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Users,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Car,
  Search,
  UserCheck,
  UserX,
  Send,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus
} from "lucide-react";
import type { DbStaffDirectory, DbTeamInvitation } from "@shared/schema";

export default function StaffDirectory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("staff");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DbStaffDirectory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "engineer",
    jobTitle: "",
    department: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    employeeNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
    jobTitle: "",
    department: "",
    startDate: "",
    endDate: "",
    employmentType: "full_time",
    lineManager: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    address: "",
    postcode: "",
    niNumber: "",
    drivingLicence: false,
    drivingLicenceExpiry: "",
    notes: "",
    isActive: true,
  });

  const { data: staff = [], isLoading } = useQuery<DbStaffDirectory[]>({
    queryKey: ["/api/staff-directory", user?.id],
    enabled: !!user?.id,
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<DbTeamInvitation[]>({
    queryKey: ["/api/team-invitations", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/team-invitations/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch invitations");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const createInvitationMutation = useMutation({
    mutationFn: (data: typeof inviteFormData) => apiRequest("POST", "/api/team-invitations", { ...data, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-invitations", user?.id] });
      setIsInviteDialogOpen(false);
      resetInviteForm();
      toast({ title: "Invitation sent", description: "An invitation link has been created for the new team member." });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/team-invitations/${id}/resend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-invitations", user?.id] });
      toast({ title: "Invitation resent", description: "A new invitation link has been generated." });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/team-invitations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-invitations", user?.id] });
      toast({ title: "Invitation cancelled" });
    },
  });

  const resetInviteForm = () => {
    setInviteFormData({
      email: "",
      firstName: "",
      lastName: "",
      role: "engineer",
      jobTitle: "",
      department: "",
      message: "",
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/staff-directory", { ...data, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-directory", user?.id] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Staff member added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/staff-directory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-directory", user?.id] });
      setIsDialogOpen(false);
      setEditingMember(null);
      resetForm();
      toast({ title: "Staff member updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/staff-directory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-directory", user?.id] });
      toast({ title: "Staff member deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      employeeNumber: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      mobile: "",
      jobTitle: "",
      department: "",
      startDate: "",
      endDate: "",
      employmentType: "full_time",
      lineManager: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      address: "",
      postcode: "",
      niNumber: "",
      drivingLicence: false,
      drivingLicenceExpiry: "",
      notes: "",
      isActive: true,
    });
  };

  const handleEdit = (member: DbStaffDirectory) => {
    setEditingMember(member);
    setFormData({
      employeeNumber: member.employeeNumber || "",
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || "",
      phone: member.phone || "",
      mobile: member.mobile || "",
      jobTitle: member.jobTitle || "",
      department: member.department || "",
      startDate: member.startDate || "",
      endDate: member.endDate || "",
      employmentType: member.employmentType || "full_time",
      lineManager: member.lineManager || "",
      emergencyContactName: member.emergencyContactName || "",
      emergencyContactPhone: member.emergencyContactPhone || "",
      emergencyContactRelation: member.emergencyContactRelation || "",
      address: member.address || "",
      postcode: member.postcode || "",
      niNumber: member.niNumber || "",
      drivingLicence: member.drivingLicence || false,
      drivingLicenceExpiry: member.drivingLicenceExpiry || "",
      notes: member.notes || "",
      isActive: member.isActive !== false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getEmploymentTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      full_time: "Full Time",
      part_time: "Part Time",
      contractor: "Contractor",
      apprentice: "Apprentice",
    };
    return types[type] || type;
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && member.isActive) ||
      (filterStatus === "inactive" && !member.isActive);
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" data-testid="loading-state">Loading...</div>;
  }

  const getInvitationStatusBadge = (invitation: DbTeamInvitation) => {
    const isExpired = invitation.expiresAt && new Date(invitation.expiresAt) < new Date();
    if (invitation.status === "accepted") {
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvitationMutation.mutate(inviteFormData);
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-staff-directory">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Staff Directory</h1>
          <p className="text-muted-foreground">Manage team members and invitations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isInviteDialogOpen} onOpenChange={(open) => { setIsInviteDialogOpen(open); if (!open) resetInviteForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-invite-member">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle data-testid="text-invite-dialog-title">Invite Team Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={inviteFormData.firstName} onChange={(e) => setInviteFormData({ ...inviteFormData, firstName: e.target.value })} required data-testid="input-invite-first-name" />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={inviteFormData.lastName} onChange={(e) => setInviteFormData({ ...inviteFormData, lastName: e.target.value })} required data-testid="input-invite-last-name" />
                  </div>
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input type="email" value={inviteFormData.email} onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })} required data-testid="input-invite-email" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Role</Label>
                    <Select value={inviteFormData.role} onValueChange={(v) => setInviteFormData({ ...inviteFormData, role: v })}>
                      <SelectTrigger data-testid="select-invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineer">Engineer</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="office">Office Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    <Input value={inviteFormData.jobTitle} onChange={(e) => setInviteFormData({ ...inviteFormData, jobTitle: e.target.value })} data-testid="input-invite-job-title" />
                  </div>
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={inviteFormData.department} onChange={(e) => setInviteFormData({ ...inviteFormData, department: e.target.value })} data-testid="input-invite-department" />
                </div>
                <div>
                  <Label>Personal Message (optional)</Label>
                  <Textarea value={inviteFormData.message} onChange={(e) => setInviteFormData({ ...inviteFormData, message: e.target.value })} placeholder="Welcome to the team..." data-testid="input-invite-message" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)} data-testid="button-invite-cancel">Cancel</Button>
                  <Button type="submit" disabled={createInvitationMutation.isPending} data-testid="button-invite-submit">
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingMember(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-staff">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingMember ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Number</Label>
                  <Input value={formData.employeeNumber} onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })} data-testid="input-employee-number" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} data-testid="switch-active" />
                  <Label>Active Employee</Label>
                </div>
                <div>
                  <Label>First Name *</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required data-testid="input-first-name" />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required data-testid="input-last-name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} data-testid="input-email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} data-testid="input-phone" />
                </div>
                <div>
                  <Label>Mobile</Label>
                  <Input value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} data-testid="input-mobile" />
                </div>
                <div>
                  <Label>Job Title</Label>
                  <Input value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} data-testid="input-job-title" />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} data-testid="input-department" />
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <Select value={formData.employmentType} onValueChange={(v) => setFormData({ ...formData, employmentType: v })}>
                    <SelectTrigger data-testid="select-employment-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="apprentice">Apprentice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} data-testid="input-start-date" />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} data-testid="input-end-date" />
                </div>
                <div>
                  <Label>Line Manager</Label>
                  <Input value={formData.lineManager} onChange={(e) => setFormData({ ...formData, lineManager: e.target.value })} data-testid="input-line-manager" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} data-testid="input-emergency-name" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} data-testid="input-emergency-phone" />
                  </div>
                  <div>
                    <Label>Relation</Label>
                    <Input value={formData.emergencyContactRelation} onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })} data-testid="input-emergency-relation" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Address & Other Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} data-testid="input-address" />
                  </div>
                  <div>
                    <Label>Postcode</Label>
                    <Input value={formData.postcode} onChange={(e) => setFormData({ ...formData, postcode: e.target.value })} data-testid="input-postcode" />
                  </div>
                  <div>
                    <Label>NI Number</Label>
                    <Input value={formData.niNumber} onChange={(e) => setFormData({ ...formData, niNumber: e.target.value })} data-testid="input-ni-number" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.drivingLicence} onCheckedChange={(v) => setFormData({ ...formData, drivingLicence: v })} data-testid="switch-driving" />
                    <Label>Has Driving Licence</Label>
                  </div>
                  <div>
                    <Label>Driving Licence Expiry</Label>
                    <Input type="date" value={formData.drivingLicenceExpiry} onChange={(e) => setFormData({ ...formData, drivingLicenceExpiry: e.target.value })} data-testid="input-licence-expiry" />
                  </div>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-notes" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingMember ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="staff" data-testid="tab-staff">
            <Users className="w-4 h-4 mr-2" />
            Staff ({staff.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" data-testid="tab-invitations">
            <Send className="w-4 h-4 mr-2" />
            Invitations ({invitations.filter(i => i.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-4 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search staff..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" data-testid="badge-count">{filteredStaff.length} staff</Badge>
          </div>

          {filteredStaff.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-empty-state">No staff members found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredStaff.map((member) => (
            <Card key={member.id} data-testid={`card-staff-${member.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-name-${member.id}`}>{member.firstName} {member.lastName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{member.jobTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.isActive ? (
                      <Badge variant="default"><UserCheck className="w-3 h-3 mr-1" /> Active</Badge>
                    ) : (
                      <Badge variant="secondary"><UserX className="w-3 h-3 mr-1" /> Inactive</Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(member)} data-testid={`button-edit-${member.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(member.id)} data-testid={`button-delete-${member.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{member.email}</span>
                    </div>
                  )}
                  {(member.phone || member.mobile) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{member.mobile || member.phone}</span>
                    </div>
                  )}
                  {member.department && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>{member.department}</span>
                    </div>
                  )}
                  {member.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Started {format(parseISO(member.startDate), "dd MMM yyyy")}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge variant="outline">{getEmploymentTypeBadge(member.employmentType || "full_time")}</Badge>
                  {member.drivingLicence && <Badge variant="secondary"><Car className="w-3 h-3 mr-1" /> Driver</Badge>}
                  {member.employeeNumber && <Badge variant="outline">#{member.employeeNumber}</Badge>}
                </div>
              </CardContent>
            </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="mt-4 space-y-4">
          {invitationsLoading ? (
            <div className="flex items-center justify-center h-32">Loading invitations...</div>
          ) : invitations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4" data-testid="text-no-invitations">No pending invitations</p>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)} data-testid="button-send-first-invite">
                  <Send className="w-4 h-4 mr-2" />
                  Send First Invitation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => {
                const isExpired = invitation.expiresAt && new Date(invitation.expiresAt) < new Date();
                return (
                  <Card key={invitation.id} data-testid={`card-invitation-${invitation.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(invitation.firstName, invitation.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{invitation.firstName} {invitation.lastName}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {invitation.email}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getInvitationStatusBadge(invitation)}
                          {invitation.role && <Badge variant="outline">{invitation.role}</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="text-sm text-muted-foreground">
                          {invitation.jobTitle && <span className="mr-3">{invitation.jobTitle}</span>}
                          {invitation.department && <span className="mr-3">{invitation.department}</span>}
                          {invitation.createdAt && (
                            <span>Sent {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}</span>
                          )}
                          {invitation.expiresAt && (
                            <span className="ml-3">
                              {isExpired ? "Expired" : `Expires ${formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}`}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {invitation.status !== "accepted" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => resendInvitationMutation.mutate(invitation.id)}
                                disabled={resendInvitationMutation.isPending}
                                data-testid={`button-resend-${invitation.id}`}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                                disabled={deleteInvitationMutation.isPending}
                                data-testid={`button-cancel-${invitation.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
