import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ClipboardCheck, 
  Cloud, 
  FileText, 
  Gauge, 
  Shield, 
  Smartphone,
  TrendingUp,
  Building2
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Airflow Velocity Testing</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Professional Smoke Control Testing
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            UK regulation-compliant airflow velocity testing for smoke control dampers. 
            Automatic grid calculation per BS EN 12101-8 and BSRIA BG 49/2024 standards.
          </p>
          <Button size="lg" asChild data-testid="button-get-started">
            <a href="/api/login">Get Started</a>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-10 w-10 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">UK Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatic 5x5, 6x6, or 7x7 grid calculation per BS EN 12101-8
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-10 w-10 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Professional Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                PDF exports with grid visualizations, signatures, and QR codes
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Cloud className="h-10 w-10 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Cloud Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Data syncs across devices with offline support for field work
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Smartphone className="h-10 w-10 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Mobile Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Touch-optimized interface for tablets and mobile devices
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <ClipboardCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Compliance Checklists</h3>
                <p className="text-muted-foreground text-sm">
                  BS EN 12101-8 verification with categorized items and progress tracking
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Trend Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  Year-over-year velocity trends with predictive maintenance alerts
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Building2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Project Management</h3>
                <p className="text-muted-foreground text-sm">
                  Organize tests by building and project with floor sequencing mode
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Gauge className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Stairwell Pressure Testing</h3>
                <p className="text-muted-foreground text-sm">
                  BS EN 12101-6 compliant differential pressure measurements
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <p className="text-center text-muted-foreground text-sm">
          Compliant with BS EN 12101-8, BS EN 12101-6, and BSRIA BG 49/2024 standards
        </p>
      </footer>
    </div>
  );
}
