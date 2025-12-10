import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Play, 
  Pause, 
  SkipForward, 
  Check, 
  X, 
  Building2, 
  Layers,
  ChevronRight,
  Trash2,
  Copy
} from "lucide-react";
import { nanoid } from "nanoid";
import { Project } from "@shared/schema";

interface DamperSequenceItem {
  floorNumber: string;
  location: string;
  shaftId: string;
  completed: boolean;
  testId?: string;
}

interface TestSession {
  id: string;
  name: string;
  building: string;
  projectId?: string;
  status: "pending" | "in_progress" | "completed";
  currentIndex: number;
  damperSequence: DamperSequenceItem[];
  totalDampers: number;
  completedDampers: number;
  createdAt: number;
}

interface FloorSequencingProps {
  projects: Project[];
  onStartTest: (damper: DamperSequenceItem, session: TestSession) => void;
  onSessionComplete: (session: TestSession) => void;
}

export function FloorSequencing({ projects, onStartTest, onSessionComplete }: FloorSequencingProps) {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // New session form state
  const [sessionName, setSessionName] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [floorCount, setFloorCount] = useState(10);
  const [startFloor, setStartFloor] = useState(0);
  const [dampersPerFloor, setDampersPerFloor] = useState(1);
  const [defaultLocation, setDefaultLocation] = useState("Smoke Shaft");
  const [defaultShaftId, setDefaultShaftId] = useState("SS1");

  const createSession = () => {
    const sequence: DamperSequenceItem[] = [];
    
    for (let floor = startFloor; floor < startFloor + floorCount; floor++) {
      for (let damper = 1; damper <= dampersPerFloor; damper++) {
        sequence.push({
          floorNumber: floor.toString().padStart(2, "0"),
          location: defaultLocation,
          shaftId: dampersPerFloor > 1 ? `${defaultShaftId}-${damper}` : defaultShaftId,
          completed: false,
        });
      }
    }

    const newSession: TestSession = {
      id: nanoid(),
      name: sessionName || `${selectedBuilding} - ${new Date().toLocaleDateString()}`,
      building: selectedBuilding,
      projectId: selectedProject || undefined,
      status: "pending",
      currentIndex: 0,
      damperSequence: sequence,
      totalDampers: sequence.length,
      completedDampers: 0,
      createdAt: Date.now(),
    };

    setSessions([...sessions, newSession]);
    setShowCreateDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setSessionName("");
    setSelectedProject("");
    setSelectedBuilding("");
    setFloorCount(10);
    setStartFloor(0);
    setDampersPerFloor(1);
    setDefaultLocation("Smoke Shaft");
    setDefaultShaftId("SS1");
  };

  const startSession = (session: TestSession) => {
    const updatedSession = { ...session, status: "in_progress" as const };
    setSessions(sessions.map(s => s.id === session.id ? updatedSession : s));
    setActiveSession(updatedSession);
    
    // Start first test
    if (updatedSession.damperSequence.length > 0) {
      onStartTest(updatedSession.damperSequence[0], updatedSession);
    }
  };

  const markCurrentComplete = (testId?: string) => {
    if (!activeSession) return;

    const updatedSequence = [...activeSession.damperSequence];
    updatedSequence[activeSession.currentIndex] = {
      ...updatedSequence[activeSession.currentIndex],
      completed: true,
      testId,
    };

    const nextIndex = activeSession.currentIndex + 1;
    const isComplete = nextIndex >= updatedSequence.length;

    const updatedSession: TestSession = {
      ...activeSession,
      damperSequence: updatedSequence,
      currentIndex: isComplete ? activeSession.currentIndex : nextIndex,
      completedDampers: updatedSequence.filter(d => d.completed).length,
      status: isComplete ? "completed" : "in_progress",
    };

    setSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s));
    setActiveSession(updatedSession);

    if (isComplete) {
      onSessionComplete(updatedSession);
    } else {
      // Auto-advance to next damper
      onStartTest(updatedSequence[nextIndex], updatedSession);
    }
  };

  const skipCurrent = () => {
    if (!activeSession) return;

    const nextIndex = activeSession.currentIndex + 1;
    if (nextIndex >= activeSession.damperSequence.length) return;

    const updatedSession = {
      ...activeSession,
      currentIndex: nextIndex,
    };

    setSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s));
    setActiveSession(updatedSession);
    onStartTest(activeSession.damperSequence[nextIndex], updatedSession);
  };

  const pauseSession = () => {
    if (!activeSession) return;

    const updatedSession = { ...activeSession, status: "pending" as const };
    setSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s));
    setActiveSession(null);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
    }
  };

  const duplicateSession = (session: TestSession) => {
    const newSession: TestSession = {
      ...session,
      id: nanoid(),
      name: `${session.name} (Copy)`,
      status: "pending",
      currentIndex: 0,
      completedDampers: 0,
      damperSequence: session.damperSequence.map(d => ({ ...d, completed: false, testId: undefined })),
      createdAt: Date.now(),
    };
    setSessions([...sessions, newSession]);
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Floor Sequencing</h3>
          <p className="text-sm text-muted-foreground">Pre-define and sequence damper tests</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-session">
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Test Session</DialogTitle>
              <DialogDescription>
                Define the dampers to test in sequence
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Session Name (optional)</Label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Block A Annual Inspection"
                  data-testid="input-session-name"
                />
              </div>

              {projects.length > 0 && (
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger data-testid="select-project">
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Building</Label>
                {selectedProjectData && selectedProjectData.buildings.length > 0 ? (
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger data-testid="select-building">
                      <SelectValue placeholder="Select building..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProjectData.buildings.map(building => (
                        <SelectItem key={building} value={building}>
                          {building}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                    placeholder="Building name"
                    data-testid="input-building"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Floor</Label>
                  <Input
                    type="number"
                    value={startFloor}
                    onChange={(e) => setStartFloor(parseInt(e.target.value) || 0)}
                    data-testid="input-start-floor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Floors</Label>
                  <Input
                    type="number"
                    min={1}
                    value={floorCount}
                    onChange={(e) => setFloorCount(parseInt(e.target.value) || 1)}
                    data-testid="input-floor-count"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dampers per Floor</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={dampersPerFloor}
                  onChange={(e) => setDampersPerFloor(parseInt(e.target.value) || 1)}
                  data-testid="input-dampers-per-floor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Location</Label>
                  <Input
                    value={defaultLocation}
                    onChange={(e) => setDefaultLocation(e.target.value)}
                    placeholder="e.g., Smoke Shaft"
                    data-testid="input-default-location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Shaft ID</Label>
                  <Input
                    value={defaultShaftId}
                    onChange={(e) => setDefaultShaftId(e.target.value)}
                    placeholder="e.g., SS1"
                    data-testid="input-default-shaft"
                  />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  This will create {floorCount * dampersPerFloor} damper tests
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={createSession}
                disabled={!selectedBuilding}
                data-testid="button-create-session-confirm"
              >
                Create Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Session */}
      {activeSession && (
        <Card className="border-primary" data-testid="card-active-session">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-500" />
                  {activeSession.name}
                </CardTitle>
                <CardDescription>
                  {activeSession.building} · Floor {activeSession.damperSequence[activeSession.currentIndex]?.floorNumber}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={skipCurrent} data-testid="button-skip">
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={pauseSession} data-testid="button-pause">
                  <Pause className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{activeSession.completedDampers} / {activeSession.totalDampers}</span>
              </div>
              <Progress value={(activeSession.completedDampers / activeSession.totalDampers) * 100} />
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">
                    Current: Floor {activeSession.damperSequence[activeSession.currentIndex]?.floorNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activeSession.damperSequence[activeSession.currentIndex]?.location} - {activeSession.damperSequence[activeSession.currentIndex]?.shaftId}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => markCurrentComplete()}
                  data-testid="button-mark-complete"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No test sessions yet</p>
            <p className="text-sm">Create a session to sequence your damper tests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.filter(s => s.id !== activeSession?.id).map((session) => (
            <Card key={session.id} data-testid={`card-session-${session.id}`}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{session.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.building} · {session.totalDampers} dampers
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      session.status === "completed" ? "default" :
                      session.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {session.status === "completed" ? "Complete" :
                       session.status === "in_progress" ? "In Progress" : "Pending"}
                    </Badge>
                    
                    {session.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startSession(session)}
                        data-testid={`button-start-session-${session.id}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => duplicateSession(session)}
                      data-testid={`button-duplicate-session-${session.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSession(session.id)}
                      data-testid={`button-delete-session-${session.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {session.completedDampers > 0 && (
                  <Progress 
                    value={(session.completedDampers / session.totalDampers) * 100} 
                    className="mt-2 h-1"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default FloorSequencing;
