import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Building2, Globe, TrendingUp, TrendingDown, Target } from "lucide-react";

interface Competitor {
  id: string;
  userId: string;
  companyName: string;
  tradingName: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postcode: string | null;
  region: string | null;
  specializations: string | null;
  marketPosition: string | null;
  companySize: string | null;
  estimatedRevenue: string | null;
  employeeCount: number | null;
  foundedYear: number | null;
  accreditations: string | null;
  keyStrengths: string | null;
  keyWeaknesses: string | null;
  pricingLevel: string | null;
  averageQuoteVariance: number | null;
  wonAgainst: number | null;
  lostTo: number | null;
  lastEncounterDate: string | null;
  lastEncounterOutcome: string | null;
  notes: string | null;
  isActive: boolean | null;
  threatLevel: string | null;
  createdAt: string;
  updatedAt: string;
}

const defaultFormData = {
  companyName: "",
  tradingName: "",
  website: "",
  phone: "",
  email: "",
  address: "",
  postcode: "",
  region: "",
  specializations: "",
  marketPosition: "direct",
  companySize: "unknown",
  estimatedRevenue: "",
  employeeCount: "",
  foundedYear: "",
  accreditations: "",
  keyStrengths: "",
  keyWeaknesses: "",
  pricingLevel: "unknown",
  averageQuoteVariance: "",
  wonAgainst: "0",
  lostTo: "0",
  lastEncounterDate: "",
  lastEncounterOutcome: "",
  notes: "",
  isActive: true,
  threatLevel: "medium",
};

export default function CompetitorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const { toast } = useToast();

  const userId = "demo-user";

  const { data: competitors = [], isLoading } = useQuery<Competitor[]>({
    queryKey: ["/api/competitors"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/competitors", { ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitors"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Competitor added successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/competitors/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitors"] });
      setIsDialogOpen(false);
      setEditingCompetitor(null);
      resetForm();
      toast({ title: "Competitor updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/competitors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitors"] });
      toast({ title: "Competitor deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingCompetitor(null);
  };

  const handleEdit = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    setFormData({
      companyName: competitor.companyName || "",
      tradingName: competitor.tradingName || "",
      website: competitor.website || "",
      phone: competitor.phone || "",
      email: competitor.email || "",
      address: competitor.address || "",
      postcode: competitor.postcode || "",
      region: competitor.region || "",
      specializations: competitor.specializations || "",
      marketPosition: competitor.marketPosition || "direct",
      companySize: competitor.companySize || "unknown",
      estimatedRevenue: competitor.estimatedRevenue || "",
      employeeCount: competitor.employeeCount?.toString() || "",
      foundedYear: competitor.foundedYear?.toString() || "",
      accreditations: competitor.accreditations || "",
      keyStrengths: competitor.keyStrengths || "",
      keyWeaknesses: competitor.keyWeaknesses || "",
      pricingLevel: competitor.pricingLevel || "unknown",
      averageQuoteVariance: competitor.averageQuoteVariance?.toString() || "",
      wonAgainst: competitor.wonAgainst?.toString() || "0",
      lostTo: competitor.lostTo?.toString() || "0",
      lastEncounterDate: competitor.lastEncounterDate || "",
      lastEncounterOutcome: competitor.lastEncounterOutcome || "",
      notes: competitor.notes || "",
      isActive: competitor.isActive !== false,
      threatLevel: competitor.threatLevel || "medium",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.companyName) {
      toast({ title: "Please enter company name", variant: "destructive" });
      return;
    }
    const submitData = {
      ...formData,
      employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : null,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
      averageQuoteVariance: formData.averageQuoteVariance ? parseFloat(formData.averageQuoteVariance) : null,
      wonAgainst: formData.wonAgainst ? parseInt(formData.wonAgainst) : 0,
      lostTo: formData.lostTo ? parseInt(formData.lostTo) : 0,
    };
    if (editingCompetitor) {
      updateMutation.mutate({ ...submitData, id: editingCompetitor.id });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getThreatBadge = (level: string | null) => {
    switch (level) {
      case "high": return <Badge variant="destructive" data-testid="badge-threat">High Threat</Badge>;
      case "medium": return <Badge className="bg-amber-100 text-amber-800" data-testid="badge-threat">Medium Threat</Badge>;
      case "low": return <Badge className="bg-green-100 text-green-800" data-testid="badge-threat">Low Threat</Badge>;
      default: return null;
    }
  };

  const getPricingBadge = (level: string | null) => {
    switch (level) {
      case "budget": return <Badge variant="outline" className="text-green-600" data-testid="badge-pricing">Budget</Badge>;
      case "competitive": return <Badge variant="outline" className="text-blue-600" data-testid="badge-pricing">Competitive</Badge>;
      case "premium": return <Badge variant="outline" className="text-purple-600" data-testid="badge-pricing">Premium</Badge>;
      default: return null;
    }
  };

  const getWinRate = (won: number, lost: number) => {
    const total = won + lost;
    if (total === 0) return null;
    const rate = (won / total) * 100;
    return rate.toFixed(0);
  };

  if (isLoading) {
    return <div className="p-6" data-testid="loading-competitors">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="competitors-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Competitor Analysis</h1>
          <p className="text-muted-foreground">Track and analyze competitor information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-competitor">
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">{editingCompetitor ? "Edit Competitor" : "Add Competitor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Legal company name"
                    data-testid="input-company-name"
                  />
                </div>
                <div>
                  <Label>Trading Name</Label>
                  <Input
                    value={formData.tradingName}
                    onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                    placeholder="Trading as"
                    data-testid="input-trading-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    data-testid="input-website"
                  />
                </div>
                <div>
                  <Label>Region</Label>
                  <Input
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Operating region"
                    data-testid="input-region"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Contact email"
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Market Position</Label>
                  <Select value={formData.marketPosition} onValueChange={(v) => setFormData({ ...formData, marketPosition: v })}>
                    <SelectTrigger data-testid="select-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="indirect">Indirect</SelectItem>
                      <SelectItem value="potential">Potential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company Size</Label>
                  <Select value={formData.companySize} onValueChange={(v) => setFormData({ ...formData, companySize: v })}>
                    <SelectTrigger data-testid="select-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="micro">Micro (1-9)</SelectItem>
                      <SelectItem value="small">Small (10-49)</SelectItem>
                      <SelectItem value="medium">Medium (50-249)</SelectItem>
                      <SelectItem value="large">Large (250+)</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Threat Level</Label>
                  <Select value={formData.threatLevel} onValueChange={(v) => setFormData({ ...formData, threatLevel: v })}>
                    <SelectTrigger data-testid="select-threat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Pricing Level</Label>
                  <Select value={formData.pricingLevel} onValueChange={(v) => setFormData({ ...formData, pricingLevel: v })}>
                    <SelectTrigger data-testid="select-pricing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Employee Count</Label>
                  <Input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                    placeholder="Estimated"
                    data-testid="input-employees"
                  />
                </div>
                <div>
                  <Label>Founded Year</Label>
                  <Input
                    type="number"
                    value={formData.foundedYear}
                    onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                    placeholder="e.g., 2010"
                    data-testid="input-founded"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quote Variance (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.averageQuoteVariance}
                    onChange={(e) => setFormData({ ...formData, averageQuoteVariance: e.target.value })}
                    placeholder="e.g., -10 for 10% cheaper"
                    data-testid="input-variance"
                  />
                </div>
                <div>
                  <Label>Won Against</Label>
                  <Input
                    type="number"
                    value={formData.wonAgainst}
                    onChange={(e) => setFormData({ ...formData, wonAgainst: e.target.value })}
                    placeholder="0"
                    data-testid="input-won"
                  />
                </div>
                <div>
                  <Label>Lost To</Label>
                  <Input
                    type="number"
                    value={formData.lostTo}
                    onChange={(e) => setFormData({ ...formData, lostTo: e.target.value })}
                    placeholder="0"
                    data-testid="input-lost"
                  />
                </div>
              </div>
              <div>
                <Label>Specializations</Label>
                <Input
                  value={formData.specializations}
                  onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                  placeholder="Comma-separated services"
                  data-testid="input-specializations"
                />
              </div>
              <div>
                <Label>Accreditations</Label>
                <Input
                  value={formData.accreditations}
                  onChange={(e) => setFormData({ ...formData, accreditations: e.target.value })}
                  placeholder="BAFE, SSAIB, etc."
                  data-testid="input-accreditations"
                />
              </div>
              <div>
                <Label>Key Strengths</Label>
                <Textarea
                  value={formData.keyStrengths}
                  onChange={(e) => setFormData({ ...formData, keyStrengths: e.target.value })}
                  placeholder="What they do well"
                  data-testid="input-strengths"
                />
              </div>
              <div>
                <Label>Key Weaknesses</Label>
                <Textarea
                  value={formData.keyWeaknesses}
                  onChange={(e) => setFormData({ ...formData, keyWeaknesses: e.target.value })}
                  placeholder="Where they fall short"
                  data-testid="input-weaknesses"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Last Encounter Date</Label>
                  <Input
                    type="date"
                    value={formData.lastEncounterDate}
                    onChange={(e) => setFormData({ ...formData, lastEncounterDate: e.target.value })}
                    data-testid="input-encounter-date"
                  />
                </div>
                <div>
                  <Label>Outcome</Label>
                  <Input
                    value={formData.lastEncounterOutcome}
                    onChange={(e) => setFormData({ ...formData, lastEncounterOutcome: e.target.value })}
                    placeholder="Won/Lost/Pending"
                    data-testid="input-encounter-outcome"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                  data-testid="switch-active"
                />
                <Label>Active Competitor</Label>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  data-testid="input-notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingCompetitor ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {competitors.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No competitors tracked yet. Add your first competitor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {competitors.map((competitor) => {
            const winRate = getWinRate(competitor.wonAgainst || 0, competitor.lostTo || 0);
            return (
              <Card key={competitor.id} data-testid={`card-competitor-${competitor.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate" data-testid={`text-name-${competitor.id}`}>
                        {competitor.companyName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getThreatBadge(competitor.threatLevel)}
                        {getPricingBadge(competitor.pricingLevel)}
                        {!competitor.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(competitor)} data-testid={`button-edit-${competitor.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(competitor.id)} data-testid={`button-delete-${competitor.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {competitor.tradingName && competitor.tradingName !== competitor.companyName && (
                      <p className="text-muted-foreground" data-testid={`text-trading-${competitor.id}`}>
                        Trading as: {competitor.tradingName}
                      </p>
                    )}
                    {competitor.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate" data-testid={`link-website-${competitor.id}`}>
                          {competitor.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {competitor.region && (
                      <p data-testid={`text-region-${competitor.id}`}>
                        <span className="text-muted-foreground">Region:</span> {competitor.region}
                      </p>
                    )}
                    {competitor.specializations && (
                      <p className="text-muted-foreground line-clamp-1" data-testid={`text-specs-${competitor.id}`}>
                        {competitor.specializations}
                      </p>
                    )}
                    {winRate !== null && (
                      <div className="flex items-center gap-2">
                        {parseInt(winRate) >= 50 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span data-testid={`text-winrate-${competitor.id}`}>
                          Win rate: {winRate}% ({competitor.wonAgainst}W / {competitor.lostTo}L)
                        </span>
                      </div>
                    )}
                    {competitor.averageQuoteVariance !== null && (
                      <p className="text-muted-foreground" data-testid={`text-variance-${competitor.id}`}>
                        Quote variance: {competitor.averageQuoteVariance > 0 ? '+' : ''}{competitor.averageQuoteVariance}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}