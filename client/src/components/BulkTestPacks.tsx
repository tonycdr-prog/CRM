import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Package, 
  Building2, 
  Layers, 
  Play,
  Trash2,
  Copy
} from "lucide-react";
import { nanoid } from "nanoid";

interface DamperConfig {
  width: number;
  height: number;
  systemType: string;
  locations: string[];
}

interface TestPack {
  id: string;
  name: string;
  description?: string;
  buildingType: string;
  floors: number;
  dampersPerFloor: number;
  damperConfig: DamperConfig;
  createdAt: number;
}

interface BulkTestPacksProps {
  onApplyPack: (pack: TestPack) => void;
}

const BUILDING_TYPES = [
  { value: "residential_high_rise", label: "Residential High-Rise" },
  { value: "residential_low_rise", label: "Residential Low-Rise" },
  { value: "commercial_office", label: "Commercial Office" },
  { value: "retail", label: "Retail" },
  { value: "hotel", label: "Hotel" },
  { value: "hospital", label: "Hospital / Healthcare" },
  { value: "education", label: "Education" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "other", label: "Other" },
];

const PRESET_PACKS: Omit<TestPack, "id" | "createdAt">[] = [
  {
    name: "Standard 10-Storey Residential",
    description: "Typical residential high-rise with single smoke shaft",
    buildingType: "residential_high_rise",
    floors: 10,
    dampersPerFloor: 1,
    damperConfig: {
      width: 600,
      height: 600,
      systemType: "push-pull",
      locations: ["Smoke Shaft"],
    },
  },
  {
    name: "20-Storey Residential Tower",
    description: "Tall residential building with dual smoke shafts",
    buildingType: "residential_high_rise",
    floors: 20,
    dampersPerFloor: 2,
    damperConfig: {
      width: 600,
      height: 600,
      systemType: "push-pull",
      locations: ["Smoke Shaft North", "Smoke Shaft South"],
    },
  },
  {
    name: "Commercial Office Block",
    description: "Multi-floor office with floor-by-floor dampers",
    buildingType: "commercial_office",
    floors: 8,
    dampersPerFloor: 3,
    damperConfig: {
      width: 800,
      height: 400,
      systemType: "push",
      locations: ["Core A", "Core B", "Core C"],
    },
  },
  {
    name: "Hotel Standard",
    description: "Hotel with corridor smoke ventilation",
    buildingType: "hotel",
    floors: 12,
    dampersPerFloor: 2,
    damperConfig: {
      width: 500,
      height: 500,
      systemType: "pull",
      locations: ["Corridor East", "Corridor West"],
    },
  },
];

export function BulkTestPacks({ onApplyPack }: BulkTestPacksProps) {
  const [customPacks, setCustomPacks] = useState<TestPack[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [floors, setFloors] = useState(10);
  const [dampersPerFloor, setDampersPerFloor] = useState(1);
  const [damperWidth, setDamperWidth] = useState(600);
  const [damperHeight, setDamperHeight] = useState(600);
  const [systemType, setSystemType] = useState("push-pull");
  const [locations, setLocations] = useState("Smoke Shaft");

  const createPack = () => {
    const newPack: TestPack = {
      id: nanoid(),
      name,
      description,
      buildingType,
      floors,
      dampersPerFloor,
      damperConfig: {
        width: damperWidth,
        height: damperHeight,
        systemType,
        locations: locations.split(",").map(l => l.trim()).filter(Boolean),
      },
      createdAt: Date.now(),
    };

    setCustomPacks([...customPacks, newPack]);
    setShowCreateDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setBuildingType("");
    setFloors(10);
    setDampersPerFloor(1);
    setDamperWidth(600);
    setDamperHeight(600);
    setSystemType("push-pull");
    setLocations("Smoke Shaft");
  };

  const deletePack = (packId: string) => {
    setCustomPacks(customPacks.filter(p => p.id !== packId));
  };

  const duplicatePack = (pack: TestPack) => {
    const newPack: TestPack = {
      ...pack,
      id: nanoid(),
      name: `${pack.name} (Copy)`,
      createdAt: Date.now(),
    };
    setCustomPacks([...customPacks, newPack]);
  };

  const applyPreset = (preset: Omit<TestPack, "id" | "createdAt">) => {
    onApplyPack({
      ...preset,
      id: nanoid(),
      createdAt: Date.now(),
    });
  };

  const allPacks = [
    ...customPacks,
  ];

  return (
    <div className="space-y-6">
      {/* Preset Packs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Quick Start Templates</h3>
            <p className="text-sm text-muted-foreground">Pre-configured building types</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESET_PACKS.map((preset, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-preset-${index}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-muted-foreground">{preset.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{preset.floors} floors</Badge>
                        <Badge variant="outline">{preset.dampersPerFloor * preset.floors} dampers</Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => applyPreset(preset)}
                    data-testid={`button-apply-preset-${index}`}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Packs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Custom Test Packs</h3>
            <p className="text-sm text-muted-foreground">Your saved configurations</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-create-pack">
                <Plus className="h-4 w-4 mr-2" />
                Create Pack
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Test Pack</DialogTitle>
                <DialogDescription>
                  Save a reusable configuration for similar buildings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Pack Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Standard Config"
                    data-testid="input-pack-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                    data-testid="input-pack-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Building Type</Label>
                  <Select value={buildingType} onValueChange={setBuildingType}>
                    <SelectTrigger data-testid="select-building-type">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BUILDING_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Floors</Label>
                    <Input
                      type="number"
                      min={1}
                      value={floors}
                      onChange={(e) => setFloors(parseInt(e.target.value) || 1)}
                      data-testid="input-floors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dampers/Floor</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={dampersPerFloor}
                      onChange={(e) => setDampersPerFloor(parseInt(e.target.value) || 1)}
                      data-testid="input-dampers-floor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Damper Width (mm)</Label>
                    <Input
                      type="number"
                      min={100}
                      value={damperWidth}
                      onChange={(e) => setDamperWidth(parseInt(e.target.value) || 600)}
                      data-testid="input-damper-width"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Damper Height (mm)</Label>
                    <Input
                      type="number"
                      min={100}
                      value={damperHeight}
                      onChange={(e) => setDamperHeight(parseInt(e.target.value) || 600)}
                      data-testid="input-damper-height"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>System Type</Label>
                  <Select value={systemType} onValueChange={setSystemType}>
                    <SelectTrigger data-testid="select-system-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="push">Push (Supply)</SelectItem>
                      <SelectItem value="pull">Pull (Extract)</SelectItem>
                      <SelectItem value="push-pull">Push-Pull</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location Names (comma-separated)</Label>
                  <Input
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                    placeholder="e.g., Smoke Shaft, Core A"
                    data-testid="input-locations"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={createPack}
                  disabled={!name || !buildingType}
                  data-testid="button-save-pack"
                >
                  Save Test Pack
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {allPacks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom test packs yet</p>
              <p className="text-sm">Create a pack to save your building configuration</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {allPacks.map((pack) => (
              <Card key={pack.id} data-testid={`card-pack-${pack.id}`}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{pack.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pack.floors} floors · {pack.dampersPerFloor * pack.floors} dampers · {pack.damperConfig.width}x{pack.damperConfig.height}mm
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => onApplyPack(pack)}
                        data-testid={`button-apply-pack-${pack.id}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Use
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => duplicatePack(pack)}
                        data-testid={`button-duplicate-pack-${pack.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePack(pack.id)}
                        data-testid={`button-delete-pack-${pack.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BulkTestPacks;
