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
                <CardTitle className="text-lg">Operations Guide</CardTitle>
                <CardDescription>Complete how-to manual</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              A comprehensive operations guide for Life Safety Ops covering all platform features in detail:
            </p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Getting started & organisation setup</li>
              <li>• Smoke control damper testing</li>
              <li>• Stairwell pressure testing</li>
              <li>• Full CRM: clients, contracts, jobs</li>
              <li>• Finance: quotes, invoices, expenses</li>
              <li>• Asset & equipment management</li>
              <li>• Field Companion mobile app</li>
              <li>• Golden Thread compliance</li>
              <li>• Team & certification management</li>
              <li>• Reporting & analytics</li>
            </ul>
            <Button 
              onClick={handleDownload}
              className="w-full"
              data-testid="button-download-capabilities-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Operations Guide (PDF)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
