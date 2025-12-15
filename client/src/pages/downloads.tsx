import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BookOpen } from "lucide-react";

export default function Downloads() {
  const handleDownload = () => {
    window.location.href = "/api/downloads/capabilities-pdf";
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Downloads</h1>
        <p className="text-muted-foreground">
          Download documentation and guides
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">App Capabilities Guide</CardTitle>
                <CardDescription>Complete feature documentation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              A comprehensive 20-page guide demonstrating all features of the Airflow Velocity Testing application, including:
            </p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Smoke damper velocity testing</li>
              <li>• Stairwell pressure testing</li>
              <li>• Professional PDF reports</li>
              <li>• Business management CRM</li>
              <li>• Staff & equipment tracking</li>
              <li>• Trend analysis features</li>
            </ul>
            <Button 
              onClick={handleDownload}
              className="w-full"
              data-testid="button-download-capabilities-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
