import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PostcodeLookup } from "@/components/PostcodeLookup";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  FileText,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { Link } from "wouter";

interface Client {
  id: string;
  userId: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  vatNumber: string | null;
  accountNumber: string | null;
  paymentTerms: number;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CommunicationLog {
  id: string;
  userId: string;
  clientId: string | null;
  type: string;
  subject: string;
  content: string | null;
  contactName: string | null;
  createdAt: string;
}

export default function Clients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formPostcode, setFormPostcode] = useState("");

  const resetClientFormState = () => {
    setFormAddress("");
    setFormCity("");
    setFormPostcode("");
  };

  const handleAddressFound = (address: { postcode: string; address1: string; address2: string; city: string; county: string; country: string }) => {
    setFormPostcode(address.postcode);
    setFormCity(address.city);
    if (address.address2) {
      setFormAddress(address.address2);
    }
    toast({ title: "Address found", description: `${address.city}, ${address.postcode}` });
  };

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const { data: communicationLogs = [] } = useQuery<CommunicationLog[]>({
    queryKey: ["/api/communication-logs", user?.id],
    enabled: !!user?.id,
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", user?.id] });
      setIsCreateDialogOpen(false);
      toast({ title: "Client created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create client", variant: "destructive" });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      return apiRequest("PATCH", `/api/clients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", user?.id] });
      setSelectedClient(null);
      toast({ title: "Client updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update client", variant: "destructive" });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", user?.id] });
      toast({ title: "Client deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete client", variant: "destructive" });
    },
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: Partial<CommunicationLog>) => {
      return apiRequest("POST", "/api/communication-logs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication-logs", user?.id] });
      setIsLogDialogOpen(false);
      toast({ title: "Communication logged successfully" });
    },
    onError: () => {
      toast({ title: "Failed to log communication", variant: "destructive" });
    },
  });

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && client.status === activeTab;
  });

  const handleCreateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createClientMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      companyName: formData.get("companyName") as string,
      contactName: formData.get("contactName") as string || null,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formAddress || null,
      city: formCity || null,
      postcode: formPostcode || null,
      vatNumber: formData.get("vatNumber") as string || null,
      paymentTerms: parseInt(formData.get("paymentTerms") as string) || 30,
      notes: formData.get("notes") as string || null,
      status: "active",
    });
  };

  const handleLogCommunication = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createLogMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      clientId: selectedClient?.id,
      type: formData.get("type") as string,
      subject: formData.get("subject") as string,
      content: formData.get("content") as string || null,
      contactName: formData.get("contactName") as string || null,
    });
  };

  const getClientLogs = (clientId: string) => {
    return communicationLogs.filter(log => log.clientId === clientId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "prospect":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Prospect</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
          <h1 className="text-2xl font-bold" data-testid="text-clients-title">Clients</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetClientFormState(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Enter the client's details below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClient}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input id="companyName" name="companyName" required data-testid="input-company-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" name="contactName" data-testid="input-contact-name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" data-testid="input-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" data-testid="input-phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Postcode Lookup</Label>
                  <PostcodeLookup onAddressFound={handleAddressFound} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} data-testid="input-address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formCity} onChange={(e) => setFormCity(e.target.value)} data-testid="input-city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input id="postcode" name="postcode" value={formPostcode} onChange={(e) => setFormPostcode(e.target.value)} data-testid="input-postcode" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input id="vatNumber" name="vatNumber" data-testid="input-vat" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                    <Input id="paymentTerms" name="paymentTerms" type="number" defaultValue={30} data-testid="input-payment-terms" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} data-testid="input-notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createClientMutation.isPending} data-testid="button-save-client">
                  {createClientMutation.isPending ? "Saving..." : "Save Client"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-clients"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-clients">All</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active-clients">Active</TabsTrigger>
            <TabsTrigger value="prospect" data-testid="tab-prospect-clients">Prospects</TabsTrigger>
            <TabsTrigger value="inactive" data-testid="tab-inactive-clients">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Try adjusting your search" : "Add your first client to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-client">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="hidden lg:table-cell">Payment Terms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                  <TableCell>
                    <Link href={`/clients/${client.id}`}>
                      <div className="font-medium hover:underline cursor-pointer" data-testid={`link-client-${client.id}`}>{client.companyName}</div>
                    </Link>
                    {client.email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.contactName && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {client.contactName}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {client.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.city}
                        {client.postcode && `, ${client.postcode}`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.paymentTerms} days
                  </TableCell>
                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-client-menu-${client.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedClient(client);
                            setIsLogDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Log Communication
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          View Contracts
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteClientMutation.mutate(client.id)}
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

      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
            <DialogDescription>
              {selectedClient && `Record communication with ${selectedClient.companyName}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogCommunication}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue="call">
                  <SelectTrigger data-testid="select-log-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="site_visit">Site Visit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input id="subject" name="subject" required data-testid="input-log-subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Person</Label>
                <Input 
                  id="contactName" 
                  name="contactName" 
                  defaultValue={selectedClient?.contactName || ""} 
                  data-testid="input-log-contact"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Notes</Label>
                <Textarea id="content" name="content" rows={4} data-testid="input-log-content" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLogDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLogMutation.isPending} data-testid="button-save-log">
                {createLogMutation.isPending ? "Saving..." : "Save Log"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selectedClient && getClientLogs(selectedClient.id).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Communication History - {selectedClient.companyName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getClientLogs(selectedClient.id).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.type}</Badge>
                      <span className="font-medium">{log.subject}</span>
                    </div>
                    {log.content && (
                      <p className="text-sm text-muted-foreground mt-1">{log.content}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      {log.contactName && `${log.contactName} - `}
                      {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
