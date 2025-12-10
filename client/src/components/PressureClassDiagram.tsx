import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  DoorOpen, 
  DoorClosed, 
  Wind, 
  ArrowRight, 
  ArrowLeft,
  Flame,
  Users,
  Shield,
  CheckCircle,
  Info
} from "lucide-react";

interface PressureClassDiagramProps {
  selectedClass?: string;
}

const CLASS_DATA = {
  class_a: {
    name: "Class A",
    title: "Firefighting Shaft",
    description: "Provides protected access for firefighting operations with maximum smoke protection",
    pressureRange: "45-60 Pa",
    nominalPressure: "50 Pa",
    openDoorMin: "10 Pa",
    doorForce: "100 N (without closer)",
    doorForceCloser: "67 N (with door closer)",
    color: "bg-red-500",
    borderColor: "border-red-500",
    textColor: "text-red-600 dark:text-red-400",
    bgLight: "bg-red-50 dark:bg-red-950/30",
    icon: Flame,
    scenarios: [
      { name: "All Doors Closed", pressure: "45-60 Pa", required: true },
      { name: "Single Door Open", pressure: "≥10 Pa", required: true },
      { name: "Door Force Test", pressure: "≤100 N", required: true },
    ],
    standards: ["BS EN 12101-6", "BS 5588-4"],
    purpose: "Firefighter access & smoke-free zone",
  },
  class_b: {
    name: "Class B",
    title: "Protected Escape Route",
    description: "Maintains safe evacuation conditions with lower pressure differential",
    pressureRange: "10-25 Pa",
    nominalPressure: "12.5 Pa",
    openDoorMin: "10 Pa",
    doorForce: "100 N (without closer)",
    doorForceCloser: "67 N (with door closer)",
    color: "bg-blue-500",
    borderColor: "border-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    icon: Users,
    scenarios: [
      { name: "All Doors Closed", pressure: "10-25 Pa", required: true },
      { name: "Single Door Open", pressure: "≥10 Pa", required: true },
      { name: "Door Force Test", pressure: "≤100 N", required: true },
    ],
    standards: ["BS EN 12101-6", "BS 9999", "BS 9991"],
    purpose: "Occupant evacuation route",
  },
  class_c: {
    name: "Class C",
    title: "Smoke Clearance",
    description: "Clears smoke from protected areas after fire event",
    pressureRange: "Variable",
    nominalPressure: "As designed",
    openDoorMin: "N/A",
    doorForce: "N/A",
    doorForceCloser: "N/A",
    color: "bg-amber-500",
    borderColor: "border-amber-500",
    textColor: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    icon: Wind,
    scenarios: [
      { name: "Smoke Extraction", pressure: "Per design", required: true },
      { name: "Air Changes", pressure: "Per design", required: true },
    ],
    standards: ["BS EN 12101-6", "BS 7346"],
    purpose: "Post-fire smoke clearance",
  },
  class_d: {
    name: "Class D",
    title: "External Air Curtain",
    description: "Creates air barrier at openings to prevent smoke spread",
    pressureRange: "Variable",
    nominalPressure: "As designed",
    openDoorMin: "N/A",
    doorForce: "N/A",
    doorForceCloser: "N/A",
    color: "bg-green-500",
    borderColor: "border-green-500",
    textColor: "text-green-600 dark:text-green-400",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    icon: Wind,
    scenarios: [
      { name: "Air Velocity", pressure: "Per design", required: true },
      { name: "Curtain Coverage", pressure: "Per design", required: true },
    ],
    standards: ["BS EN 12101-6"],
    purpose: "External smoke barrier",
  },
  class_e: {
    name: "Class E",
    title: "Smoke Control Lobby",
    description: "Maintains lobby pressure to prevent smoke ingress",
    pressureRange: "10-50 Pa",
    nominalPressure: "Variable",
    openDoorMin: "10 Pa",
    doorForce: "100 N",
    doorForceCloser: "67 N",
    color: "bg-purple-500",
    borderColor: "border-purple-500",
    textColor: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    icon: Shield,
    scenarios: [
      { name: "All Doors Closed", pressure: "10-50 Pa", required: true },
      { name: "Lobby Integrity", pressure: "Per design", required: true },
    ],
    standards: ["BS EN 12101-6", "BS 9999"],
    purpose: "Protected lobby zone",
  },
  class_f: {
    name: "Class F",
    title: "Protected Lift Shaft",
    description: "Pressurizes lift shaft to prevent smoke spread via elevator",
    pressureRange: "25-50 Pa",
    nominalPressure: "Variable",
    openDoorMin: "10 Pa",
    doorForce: "N/A (lift doors)",
    doorForceCloser: "N/A",
    color: "bg-cyan-500",
    borderColor: "border-cyan-500",
    textColor: "text-cyan-600 dark:text-cyan-400",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/30",
    icon: Building2,
    scenarios: [
      { name: "All Doors Closed", pressure: "25-50 Pa", required: true },
      { name: "Lift at Ground", pressure: "Per design", required: true },
    ],
    standards: ["BS EN 12101-6", "BS EN 81-72"],
    purpose: "Smoke-free lift access",
  },
};

export default function PressureClassDiagram({ selectedClass }: PressureClassDiagramProps) {
  const classData = selectedClass ? CLASS_DATA[selectedClass as keyof typeof CLASS_DATA] : null;

  if (!classData) {
    return (
      <Card className="mt-4" data-testid="card-class-diagram-empty">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            System Class Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a system type above to view the testing requirements diagram
          </p>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(CLASS_DATA).map(([key, data]) => (
              <div 
                key={key}
                className={`p-2 rounded-md border ${data.bgLight} ${data.borderColor}/30`}
                data-testid={`preview-${key}`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${data.color}`} />
                  <span className={`text-xs font-medium ${data.textColor}`}>{data.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{data.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = classData.icon;

  return (
    <Card className={`mt-4 border-l-4 ${classData.borderColor}`} data-testid={`card-class-diagram-${selectedClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className={`p-1.5 rounded ${classData.color} text-white`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <span>{classData.name}: {classData.title}</span>
          </CardTitle>
          <div className="flex gap-1 flex-wrap">
            {classData.standards.map((std) => (
              <Badge key={std} variant="outline" className="text-xs">
                {std}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{classData.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg ${classData.bgLight} border ${classData.borderColor}/20`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="text-center mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Building Cross-Section
                </span>
              </div>
              
              <div className="relative bg-card border rounded-lg p-3 min-h-[180px]">
                <div className="absolute left-2 top-0 bottom-0 w-12 bg-muted/50 rounded flex flex-col justify-center items-center border-r">
                  <Building2 className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    Protected<br/>Shaft
                  </span>
                </div>
                
                <div className="ml-16 space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                    <DoorClosed className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">Doors Closed</span>
                        <ArrowRight className={`h-3 w-3 ${classData.textColor}`} />
                        <Badge className={`${classData.color} text-white text-[10px] px-1.5`}>
                          {classData.pressureRange}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Nominal: {classData.nominalPressure}
                      </p>
                    </div>
                  </div>
                  
                  {classData.openDoorMin !== "N/A" && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Door Open</span>
                          <ArrowRight className={`h-3 w-3 ${classData.textColor}`} />
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            ≥{classData.openDoorMin}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Minimum pressure maintained
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {classData.doorForce !== "N/A" && classData.doorForce !== "N/A (lift doors)" && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                      <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium">Door Force</span>
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            ≤{classData.doorForce}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          With closer: ≤{classData.doorForceCloser}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center">
                  <Wind className={`h-5 w-5 ${classData.textColor}`} />
                  <span className="text-[9px] text-muted-foreground mt-0.5">Pressurized</span>
                </div>
              </div>
            </div>
            
            <div className="md:w-48 space-y-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Test Scenarios
                </span>
                <div className="mt-2 space-y-1.5">
                  {classData.scenarios.map((scenario, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 text-xs"
                      data-testid={`scenario-${idx}`}
                    >
                      <CheckCircle className={`h-3.5 w-3.5 ${classData.textColor}`} />
                      <span className="flex-1">{scenario.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {scenario.pressure}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Purpose
                </span>
                <p className={`text-xs mt-1 ${classData.textColor} font-medium`}>
                  {classData.purpose}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>
            All measurements must be taken at each level of the protected shaft. 
            Door opening force tests are required to ensure safe evacuation even under full pressurization.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
