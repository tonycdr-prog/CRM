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
  Info,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { 
  StandardVersion, 
  SystemClass, 
  STANDARD_VERSIONS, 
  getClassRequirements,
  getAvailableClasses,
  isClassAvailableForStandard
} from "@/lib/pressureStandards";

interface PressureClassDiagramProps {
  selectedClass?: string;
  selectedStandard?: string;
}

const CLASS_STYLING: Record<string, {
  color: string;
  borderColor: string;
  textColor: string;
  bgLight: string;
  icon: typeof Flame;
}> = {
  class_a: {
    color: "bg-red-500",
    borderColor: "border-red-500",
    textColor: "text-red-600 dark:text-red-400",
    bgLight: "bg-red-50 dark:bg-red-950/30",
    icon: Flame,
  },
  class_b: {
    color: "bg-blue-500",
    borderColor: "border-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    icon: Users,
  },
  class_c: {
    color: "bg-amber-500",
    borderColor: "border-amber-500",
    textColor: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    icon: Wind,
  },
  class_d: {
    color: "bg-green-500",
    borderColor: "border-green-500",
    textColor: "text-green-600 dark:text-green-400",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    icon: Wind,
  },
  class_e: {
    color: "bg-purple-500",
    borderColor: "border-purple-500",
    textColor: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    icon: Shield,
  },
  class_f: {
    color: "bg-cyan-500",
    borderColor: "border-cyan-500",
    textColor: "text-cyan-600 dark:text-cyan-400",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/30",
    icon: Building2,
  },
};

export default function PressureClassDiagram({ selectedClass, selectedStandard }: PressureClassDiagramProps) {
  const standardVersion = (selectedStandard || "bs_en_12101_6_2022") as StandardVersion;
  const standard = STANDARD_VERSIONS[standardVersion];
  const systemClass = selectedClass as SystemClass;
  
  const classRequirements = selectedClass 
    ? getClassRequirements(standardVersion, systemClass) 
    : null;
  const styling = selectedClass ? CLASS_STYLING[selectedClass] : null;
  
  const availableClasses = getAvailableClasses(standardVersion);
  const isClassAvailable = selectedClass ? isClassAvailableForStandard(standardVersion, systemClass) : false;
  
  if (!selectedClass || !classRequirements || !styling) {
    return (
      <Card className="mt-4" data-testid="card-class-diagram-empty">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            System Class Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Standard: <strong>{standard?.shortName || "BS EN 12101-6 (Current)"}</strong></span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Select a system classification above to view the testing requirements
          </p>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableClasses.map((classKey) => {
              const classReq = getClassRequirements(standardVersion, classKey);
              const style = CLASS_STYLING[classKey];
              if (!classReq || !style) return null;
              
              return (
                <div 
                  key={classKey}
                  className={`p-2 rounded-md border ${style.bgLight} ${style.borderColor}/30`}
                  data-testid={`preview-${classKey}`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${style.color}`} />
                    <span className={`text-xs font-medium ${style.textColor}`}>{classReq.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{classReq.title}</p>
                </div>
              );
            })}
          </div>
          
          {standard?.supersededBy && (
            <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <p>This standard has been superseded. Use only for testing systems installed before {standard.year + 10}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (!isClassAvailable) {
    return (
      <Card className="mt-4 border-l-4 border-amber-500" data-testid="card-class-diagram-unavailable">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Class Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <strong>{selectedClass?.replace("_", " ").toUpperCase()}</strong> is not defined in <strong>{standard?.shortName}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This classification was introduced in a later version of the standard. 
            Please select a different system class or update the applicable standard.
          </p>
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Classes available in {standard?.shortName}:</p>
            <div className="flex gap-2 flex-wrap">
              {availableClasses.map((classKey) => {
                const classReq = getClassRequirements(standardVersion, classKey);
                const style = CLASS_STYLING[classKey];
                if (!classReq || !style) return null;
                return (
                  <Badge key={classKey} variant="outline" className={`${style.textColor}`}>
                    {classReq.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = styling.icon;

  return (
    <Card className={`mt-4 border-l-4 ${styling.borderColor}`} data-testid={`card-class-diagram-${selectedClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className={`p-1.5 rounded ${styling.color} text-white`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <span>{classRequirements.name}: {classRequirements.title}</span>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {standard?.shortName}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{classRequirements.description}</p>
        {classRequirements.notes && (
          <p className="text-xs text-muted-foreground italic mt-1">{classRequirements.notes}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg ${styling.bgLight} border ${styling.borderColor}/20`}>
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
                        <ArrowRight className={`h-3 w-3 ${styling.textColor}`} />
                        <Badge className={`${styling.color} text-white text-[10px] px-1.5`}>
                          {classRequirements.pressureRange}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Nominal: {classRequirements.nominalPressure}
                      </p>
                    </div>
                  </div>
                  
                  {classRequirements.openDoorMin !== "N/A" && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Door Open</span>
                          <ArrowRight className={`h-3 w-3 ${styling.textColor}`} />
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            ≥{classRequirements.openDoorMin}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Minimum pressure maintained
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {classRequirements.doorForce !== "N/A" && classRequirements.doorForce !== "N/A (lift doors)" && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                      <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium">Door Force</span>
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            ≤{classRequirements.doorForce}
                          </Badge>
                        </div>
                        {classRequirements.doorForceCloser && classRequirements.doorForceCloser !== "N/A" && (
                          <p className="text-[10px] text-muted-foreground">
                            With closer: ≤{classRequirements.doorForceCloser}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center">
                  <Wind className={`h-5 w-5 ${styling.textColor}`} />
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
                  {classRequirements.scenarios.map((scenario, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 text-xs"
                      data-testid={`scenario-${idx}`}
                    >
                      <CheckCircle className={`h-3.5 w-3.5 ${styling.textColor}`} />
                      <span className="flex-1">{scenario.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {scenario.pressure}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {standard?.supersededBy && (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <p>
              <strong>{standard.shortName}</strong> has been superseded by a newer version. 
              Use these requirements only for systems originally designed to this standard.
            </p>
          </div>
        )}
        
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
