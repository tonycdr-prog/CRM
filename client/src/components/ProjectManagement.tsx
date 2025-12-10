import { useState } from "react";
import { nanoid } from "nanoid";
import { Project, Report } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Trash2, FolderOpen, Check, X, Edit } from "lucide-react";

interface ProjectManagementProps {
  projects: Record<string, Project>;
  onSaveProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onSelectProject: (project: Project) => void;
  currentReport: Partial<Report>;
  existingBuildings: string[];
}

export function ProjectManagement({
  projects,
  onSaveProject,
  onDeleteProject,
  onSelectProject,
  currentReport,
  existingBuildings,
}: ProjectManagementProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newBuildingName, setNewBuildingName] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [sitePostcode, setSitePostcode] = useState("");
  const [clientName, setClientName] = useState("");
  const [mainContractor, setMainContractor] = useState("");
  const [buildings, setBuildings] = useState<string[]>([]);

  const projectList = Object.values(projects).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setSiteAddress("");
    setSitePostcode("");
    setClientName("");
    setMainContractor("");
    setBuildings([]);
    setEditingProject(null);
    setNewBuildingName("");
  };

  const openNewProjectDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditProjectDialog = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || "");
    setSiteAddress(project.siteAddress);
    setSitePostcode(project.sitePostcode || "");
    setClientName(project.clientName);
    setMainContractor(project.mainContractor || "");
    setBuildings([...project.buildings]);
    setIsDialogOpen(true);
  };

  const handleAddBuilding = () => {
    if (!newBuildingName.trim()) return;
    if (buildings.includes(newBuildingName.trim())) {
      toast({
        title: "Building exists",
        description: "This building is already in the project",
        variant: "destructive",
      });
      return;
    }
    setBuildings([...buildings, newBuildingName.trim()]);
    setNewBuildingName("");
  };

  const handleRemoveBuilding = (building: string) => {
    setBuildings(buildings.filter((b) => b !== building));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    if (!siteAddress.trim()) {
      toast({
        title: "Address required",
        description: "Please enter the site address",
        variant: "destructive",
      });
      return;
    }

    if (!clientName.trim()) {
      toast({
        title: "Client required",
        description: "Please enter the client name",
        variant: "destructive",
      });
      return;
    }

    const project: Project = {
      id: editingProject?.id || nanoid(),
      name: name.trim(),
      description: description.trim() || undefined,
      siteAddress: siteAddress.trim(),
      sitePostcode: sitePostcode.trim() || undefined,
      clientName: clientName.trim(),
      mainContractor: mainContractor.trim() || undefined,
      buildings,
      createdAt: editingProject?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSaveProject(project);
    setIsDialogOpen(false);
    resetForm();

    toast({
      title: editingProject ? "Project updated" : "Project created",
      description: `"${project.name}" has been saved`,
    });
  };

  const handleDelete = (project: Project) => {
    onDeleteProject(project.id);
    toast({
      title: "Project deleted",
      description: `"${project.name}" has been removed`,
    });
  };

  const handleSelect = (project: Project) => {
    onSelectProject(project);
    toast({
      title: "Project loaded",
      description: `Report settings updated from "${project.name}"`,
    });
  };

  const handleAddExistingBuilding = (building: string) => {
    if (!buildings.includes(building)) {
      setBuildings([...buildings, building]);
    }
  };

  // Find buildings from tests that aren't in any project
  const unassignedBuildings = existingBuildings.filter(
    (b) => !Object.values(projects).some((p) => p.buildings.includes(b))
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Projects
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={openNewProjectDialog}
                data-testid="button-new-project"
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? "Edit Project" : "Create Project"}
                </DialogTitle>
                <DialogDescription>
                  Group multiple buildings under one project for easier management
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Riverside Development Phase 2"
                    data-testid="input-project-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief project description..."
                    className="resize-none"
                    rows={2}
                    data-testid="input-project-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="site-address">Site Address *</Label>
                    <Input
                      id="site-address"
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      placeholder="123 Main Street, London"
                      data-testid="input-project-address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site-postcode">Postcode</Label>
                    <Input
                      id="site-postcode"
                      value={sitePostcode}
                      onChange={(e) => setSitePostcode(e.target.value)}
                      placeholder="SW1A 1AA"
                      data-testid="input-project-postcode"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-name">Client Name *</Label>
                    <Input
                      id="client-name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client Ltd"
                      data-testid="input-project-client"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="main-contractor">Main Contractor</Label>
                  <Input
                    id="main-contractor"
                    value={mainContractor}
                    onChange={(e) => setMainContractor(e.target.value)}
                    placeholder="Construction Co Ltd"
                    data-testid="input-project-contractor"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Buildings in Project</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newBuildingName}
                      onChange={(e) => setNewBuildingName(e.target.value)}
                      placeholder="Add building name..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddBuilding();
                        }
                      }}
                      data-testid="input-new-building"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBuilding}
                      data-testid="button-add-building"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {unassignedBuildings.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Add from existing tests:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {unassignedBuildings.map((b) => (
                          <Badge
                            key={b}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => handleAddExistingBuilding(b)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {b}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {buildings.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {buildings.map((building) => (
                        <Badge
                          key={building}
                          variant="secondary"
                          className="pr-1"
                        >
                          <Building2 className="h-3 w-3 mr-1" />
                          {building}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-destructive/20"
                            onClick={() => handleRemoveBuilding(building)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} data-testid="button-save-project">
                  {editingProject ? "Update Project" : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {projectList.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No projects yet. Create one to group buildings.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {projectList.map((project) => (
              <AccordionItem key={project.id} value={project.id}>
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{project.name}</span>
                    <Badge variant="outline" className="ml-1">
                      {project.buildings.length} building
                      {project.buildings.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-6">
                    <div className="text-xs text-muted-foreground">
                      <p>{project.siteAddress}</p>
                      {project.sitePostcode && <p>{project.sitePostcode}</p>}
                      <p className="mt-1">Client: {project.clientName}</p>
                    </div>

                    {project.buildings.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.buildings.map((b) => (
                          <Badge key={b} variant="secondary" className="text-xs">
                            <Building2 className="h-3 w-3 mr-1" />
                            {b}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-1 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelect(project)}
                        data-testid={`button-use-project-${project.id}`}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditProjectDialog(project)}
                        data-testid={`button-edit-project-${project.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(project)}
                        data-testid={`button-delete-project-${project.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

export default ProjectManagement;
