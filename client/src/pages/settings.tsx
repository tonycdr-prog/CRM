import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Building2, Users, Mail, UserPlus, Trash2, Shield, Copy, Check } from "lucide-react";
import type { User, Organization, OrganizationInvitation } from "@shared/schema";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  office_staff: "Office Staff",
  engineer: "Engineer",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full control including billing and organization deletion",
  admin: "Manage team and full data access",
  office_staff: "CRM access, scheduling, invoicing",
  engineer: "Field work, test data, job updates",
  viewer: "Read-only access to data",
};

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("engineer");
  const [orgName, setOrgName] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: organization, isLoading: orgLoading } = useQuery<Organization | null>({
    queryKey: ["/api/organization"],
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/organization/members"],
    enabled: !!organization,
  });

  const { data: invitations = [] } = useQuery<OrganizationInvitation[]>({
    queryKey: ["/api/organization/invitations"],
    enabled: !!organization,
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: { name: string }) => apiRequest("POST", "/api/organization", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Organization created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create organization", variant: "destructive" });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data: Partial<Organization>) => apiRequest("PATCH", "/api/organization", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
      toast({ title: "Organization updated" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      apiRequest("POST", "/api/organization/invitations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/invitations"] });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("engineer");
      toast({ title: "Invitation sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send invitation", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      apiRequest("PATCH", `/api/organization/members/${memberId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/members"] });
      toast({ title: "Role updated" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiRequest("DELETE", `/api/organization/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/members"] });
      toast({ title: "Member removed" });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/organization/invitations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/invitations"] });
      toast({ title: "Invitation deleted" });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/join?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({ title: "Invite link copied to clipboard" });
  };

  const canManageTeam = user?.organizationRole === "owner" || user?.organizationRole === "admin";

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground">Manage your account and organization</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          data-testid="button-logout"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
          <TabsTrigger value="organization" data-testid="tab-organization">Organization</TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your personal account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm mt-1" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm mt-1" data-testid="text-user-email">
                    {user?.email || "Not set"}
                  </p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Badge variant="secondary" className="mt-1" data-testid="badge-user-role">
                    {ROLE_LABELS[user?.organizationRole || ""] || user?.organizationRole || "No organization"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          {!organization ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Create Organization
                </CardTitle>
                <CardDescription>
                  Create an organization to start inviting team members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="Your Company Name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    data-testid="input-org-name"
                  />
                </div>
                <Button
                  onClick={() => createOrgMutation.mutate({ name: orgName })}
                  disabled={!orgName.trim() || createOrgMutation.isPending}
                  data-testid="button-create-org"
                >
                  {createOrgMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Organization
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Details
                </CardTitle>
                <CardDescription>Manage your organization settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input
                      value={organization.name}
                      onChange={(e) =>
                        canManageTeam && updateOrgMutation.mutate({ name: e.target.value })
                      }
                      disabled={!canManageTeam}
                      data-testid="input-org-name-edit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={organization.email || ""}
                      onChange={(e) =>
                        canManageTeam && updateOrgMutation.mutate({ email: e.target.value })
                      }
                      disabled={!canManageTeam}
                      placeholder="contact@company.com"
                      data-testid="input-org-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={organization.phone || ""}
                      onChange={(e) =>
                        canManageTeam && updateOrgMutation.mutate({ phone: e.target.value })
                      }
                      disabled={!canManageTeam}
                      placeholder="+44 123 456 7890"
                      data-testid="input-org-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={organization.website || ""}
                      onChange={(e) =>
                        canManageTeam && updateOrgMutation.mutate({ website: e.target.value })
                      }
                      disabled={!canManageTeam}
                      placeholder="https://company.com"
                      data-testid="input-org-website"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={organization.address || ""}
                    onChange={(e) =>
                      canManageTeam && updateOrgMutation.mutate({ address: e.target.value })
                    }
                    disabled={!canManageTeam}
                    placeholder="123 Business Street, City, Postcode"
                    data-testid="input-org-address"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          {!organization ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Create an organization first to manage team members
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members
                    </CardTitle>
                    <CardDescription>
                      {members.length} member{members.length !== 1 ? "s" : ""} in your organization
                    </CardDescription>
                  </div>
                  {canManageTeam && (
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-invite-member">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join your organization
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              placeholder="colleague@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              data-testid="input-invite-email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-role">Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger data-testid="select-invite-role">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="office_staff">Office Staff</SelectItem>
                                <SelectItem value="engineer">Engineer</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {ROLE_DESCRIPTIONS[inviteRole]}
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                            disabled={!inviteEmail.trim() || inviteMutation.isPending}
                            data-testid="button-send-invite"
                          >
                            {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          data-testid={`member-row-${member.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {member.firstName?.[0]}
                                {member.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {member.firstName} {member.lastName}
                                {member.id === user?.id && (
                                  <span className="text-muted-foreground ml-1">(You)</span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canManageTeam && member.id !== user?.id ? (
                              <>
                                <Select
                                  value={member.organizationRole || "engineer"}
                                  onValueChange={(role) =>
                                    updateRoleMutation.mutate({ memberId: member.id, role })
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="office_staff">Office Staff</SelectItem>
                                    <SelectItem value="engineer">Engineer</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeMemberMutation.mutate(member.id)}
                                  data-testid={`button-remove-member-${member.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            ) : (
                              <Badge variant="secondary">
                                <Shield className="h-3 w-3 mr-1" />
                                {ROLE_LABELS[member.organizationRole || ""] || member.organizationRole}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {invitations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Pending Invitations
                    </CardTitle>
                    <CardDescription>
                      Invitations waiting to be accepted
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          data-testid={`invitation-row-${invitation.id}`}
                        >
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {ROLE_LABELS[invitation.role || "engineer"]}
                              </Badge>
                              <span>
                                Expires{" "}
                                {new Date(invitation.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyInviteLink(invitation.token)}
                              data-testid={`button-copy-invite-${invitation.id}`}
                            >
                              {copiedToken === invitation.token ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            {canManageTeam && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                                data-testid={`button-delete-invite-${invitation.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
