import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ClipboardCheck, 
  Cloud, 
  FileText, 
  Gauge, 
  Shield, 
  Smartphone,
  TrendingUp,
  Building2,
  Users,
  Calendar,
  FileSpreadsheet,
  Truck,
  Wrench,
  Bell,
  MapPin,
  Clock,
  BarChart3,
  Briefcase,
  Receipt,
  UserCheck,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  AlertTriangle,
  Package,
  GraduationCap,
  Star,
  Quote,
  Calculator,
  Check,
  X,
  ChevronDown,
  Moon,
  Sun,
  Lock,
  Award,
  Mail,
  Phone,
  BookOpen,
  Play,
  Download
} from "lucide-react";
import { SiApple, SiGoogleplay } from "react-icons/si";

function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  return { count, ref };
}

const UK_STANDARDS = [
  { code: "BS EN 12101-1", title: "Smoke barriers" },
  { code: "BS EN 12101-2", title: "Natural smoke and heat exhaust ventilators" },
  { code: "BS EN 12101-3", title: "Powered smoke and heat control ventilators" },
  { code: "BS EN 12101-4", title: "Smoke and heat exhaust ventilation systems" },
  { code: "BS EN 12101-5", title: "Guidelines on functional recommendations" },
  { code: "BS EN 12101-6", title: "Pressure differential systems" },
  { code: "BS EN 12101-7", title: "Smoke duct sections" },
  { code: "BS EN 12101-8", title: "Smoke control dampers" },
  { code: "BS EN 12101-10", title: "Power supplies" },
  { code: "BS EN 12101-13", title: "Pressure differential systems kits" },
  { code: "BS ISO 21927-9", title: "Smoke/heat exhaust ventilators control panels" },
  { code: "BS 7346-8", title: "Smoke control systems" },
  { code: "BS 9999", title: "Fire safety in buildings - Code of practice" },
  { code: "BS 9991", title: "Fire safety in residential buildings" },
  { code: "RRFSO 2005", title: "Regulatory Reform (Fire Safety) Order" },
  { code: "BSRIA BG 49/2024", title: "Commissioning air systems" },
];

const TESTIMONIALS = [
  {
    name: "James Mitchell",
    role: "Operations Director",
    company: "SafeVent Solutions Ltd",
    quote: "This platform has transformed how we manage smoke control testing. What used to take days of paperwork now happens automatically. Our compliance rate is at 100%.",
    rating: 5
  },
  {
    name: "Sarah Thompson",
    role: "Fire Safety Consultant",
    company: "BuildSafe Consulting",
    quote: "The automatic grid calculations and professional PDF reports have saved us countless hours. Our clients love the QR-verified certificates.",
    rating: 5
  },
  {
    name: "David Chen",
    role: "Managing Director",
    company: "AirFlow Testing UK",
    quote: "From job scheduling to invoicing, everything is integrated. We've reduced admin time by 60% and can now focus on what matters - keeping buildings safe.",
    rating: 5
  }
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for small teams getting started",
    features: [
      "Up to 50 tests per month",
      "2 user accounts",
      "Basic PDF reports",
      "Email support",
      "Mobile app access",
      "Cloud sync"
    ],
    notIncluded: [
      "CRM features",
      "Custom branding",
      "API access",
      "Priority support"
    ]
  },
  {
    name: "Professional",
    price: 149,
    description: "For growing smoke control businesses",
    popular: true,
    features: [
      "Unlimited tests",
      "10 user accounts",
      "Professional PDF reports with branding",
      "Full CRM & job scheduling",
      "Trend analysis & predictions",
      "Priority email & phone support",
      "Offline mode with sync",
      "Equipment tracking"
    ],
    notIncluded: [
      "API access",
      "White-label reports"
    ]
  },
  {
    name: "Enterprise",
    price: 399,
    description: "Complete solution for large organisations",
    features: [
      "Everything in Professional",
      "Unlimited users",
      "API access & integrations",
      "White-label PDF reports",
      "Dedicated account manager",
      "Custom training sessions",
      "SLA with guaranteed uptime",
      "Multi-site management",
      "Advanced analytics dashboard",
      "Custom compliance checklists"
    ],
    notIncluded: []
  }
];

const FAQ_ITEMS = [
  {
    question: "Which UK standards does the platform support?",
    answer: "We support the complete BS EN 12101 series (Parts 1-13), BS ISO 21927-9, BS 7346-8, BS 9999, BS 9991, and the Regulatory Reform (Fire Safety) Order 2005. Our system automatically applies the correct testing parameters based on your selected standard."
  },
  {
    question: "How does the automatic grid calculation work?",
    answer: "Based on your damper dimensions, the system automatically calculates whether a 5x5, 6x6, or 7x7 grid is required per BS EN 12101-8 guidelines. This ensures consistent, compliant measurements every time."
  },
  {
    question: "Can I use the app offline in the field?",
    answer: "Yes! The mobile apps (iOS and Android) work fully offline. All your tests are saved locally and automatically sync to the cloud when you regain connectivity. You'll never lose data due to poor site connectivity."
  },
  {
    question: "What's included in the PDF reports?",
    answer: "Reports include cover pages with company branding, executive summaries, grid visualisations, trend charts, individual test details, pass/fail statistics, digital signatures, and QR codes linking to online verification."
  },
  {
    question: "How does the CRM integrate with testing?",
    answer: "Client information, site details, and contract data flow seamlessly into test reports. Schedule recurring annual tests, track contract renewals, and invoice directly from completed jobs - all in one platform."
  },
  {
    question: "Is my data secure and GDPR compliant?",
    answer: "Absolutely. All data is encrypted in transit and at rest. We're fully GDPR compliant with data processing agreements available. Our servers are UK-based with enterprise-grade security."
  },
  {
    question: "Can I import existing test data?",
    answer: "Yes, we support JSON and CSV import for migrating historical data. Our team can also assist with bulk data migration during onboarding."
  },
  {
    question: "What training and support is available?",
    answer: "All plans include documentation and video tutorials. Professional and Enterprise plans include onboarding calls, and Enterprise customers get dedicated account managers and custom training sessions."
  }
];

const COMPARISON_FEATURES = [
  { feature: "Automatic grid size calculation", platform: true, manual: false },
  { feature: "Real-time compliance checking", platform: true, manual: false },
  { feature: "Professional PDF reports", platform: true, manual: false },
  { feature: "Multi-standard support", platform: true, manual: false },
  { feature: "Trend analysis & predictions", platform: true, manual: false },
  { feature: "Offline field testing", platform: true, manual: true },
  { feature: "Cloud backup & sync", platform: true, manual: false },
  { feature: "Digital signatures", platform: true, manual: false },
  { feature: "QR code verification", platform: true, manual: false },
  { feature: "Integrated CRM", platform: true, manual: false },
  { feature: "Job scheduling", platform: true, manual: false },
  { feature: "Automatic invoicing", platform: true, manual: false },
];

export default function Landing() {
  const [isDark, setIsDark] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [roiInputs, setRoiInputs] = useState({ testsPerMonth: 50, hoursPerTest: 2, hourlyRate: 45 });

  const stat1 = useCountUp(500, 2000);
  const stat2 = useCountUp(98, 2000);
  const stat3 = useCountUp(15, 2000);
  const stat4 = useCountUp(60, 2000);

  useEffect(() => {
    const storedTheme = localStorage.getItem("landing-theme");
    if (storedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((scrollTop / docHeight) * 100);
      setShowBackToTop(scrollTop > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("landing-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("landing-theme", "light");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const calculateROI = () => {
    const monthlyHoursSaved = roiInputs.testsPerMonth * roiInputs.hoursPerTest * 0.6;
    const monthlySavings = monthlyHoursSaved * roiInputs.hourlyRate;
    const yearlySavings = monthlySavings * 12;
    return { monthlyHoursSaved, monthlySavings, yearlySavings };
  };

  const roi = calculateROI();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div 
        className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
        data-testid="scroll-progress"
      />

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Life Safety Ops</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild data-testid="button-features">
                <a href="#features">Features</a>
              </Button>
              <Button variant="ghost" size="sm" asChild data-testid="button-standards">
                <a href="#standards">Standards</a>
              </Button>
              <Button variant="ghost" size="sm" asChild data-testid="button-pricing">
                <a href="#pricing">Pricing</a>
              </Button>
              <Button variant="ghost" size="sm" asChild data-testid="button-crm">
                <a href="#crm">Business Tools</a>
              </Button>
              <Button variant="ghost" size="sm" asChild data-testid="button-faq">
                <a href="#faq">FAQ</a>
              </Button>
              <Button variant="ghost" size="sm" asChild data-testid="button-downloads-nav">
                <a href="#downloads">Downloads</a>
              </Button>
            </nav>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button asChild data-testid="button-login">
                <a href="/api/login">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4 animate-pulse">
              UK Regulation Compliant
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Life Safety Operations &amp; Compliance Management Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Professional UK life safety testing platform with full business management. 
              From field testing to invoicing, Building Safety Act compliance to Golden Thread documentation - all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-demo">
                <a href="#demo">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Button variant="outline" size="lg" className="h-auto py-2 px-4 bg-black text-white border-black hover:bg-black/90 hover:text-white" asChild data-testid="link-app-store">
                <a href="#" className="inline-flex items-center gap-2">
                  <SiApple className="h-6 w-6" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </a>
              </Button>
              <Button variant="outline" size="lg" className="h-auto py-2 px-4 bg-black text-white border-black hover:bg-black/90 hover:text-white" asChild data-testid="link-play-store">
                <a href="#" className="inline-flex items-center gap-2">
                  <SiGoogleplay className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div ref={stat1.ref} className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl font-bold text-primary mb-1" data-testid="stat-companies">{stat1.count}+</div>
              <div className="text-sm text-muted-foreground">Companies Trust Us</div>
            </div>
            <div ref={stat2.ref} className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl font-bold text-primary mb-1" data-testid="stat-compliance">{stat2.count}%</div>
              <div className="text-sm text-muted-foreground">Compliance Rate</div>
            </div>
            <div ref={stat3.ref} className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl font-bold text-primary mb-1" data-testid="stat-standards">{stat3.count}+</div>
              <div className="text-sm text-muted-foreground">UK Standards</div>
            </div>
            <div ref={stat4.ref} className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl font-bold text-primary mb-1" data-testid="stat-time-saved">{stat4.count}%</div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
          </div>
        </section>

        <section id="standards" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Full UK Compliance</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Standards Coverage</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built-in support for the complete suite of UK smoke control regulations and standards.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {UK_STANDARDS.map((standard, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-background border hover-elevate"
                  data-testid={`standard-${index}`}
                >
                  <div className="font-semibold text-primary text-sm">{standard.code}</div>
                  <div className="text-sm text-muted-foreground">{standard.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Testing &amp; Compliance Tools</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need for professional smoke control testing, from automatic grid calculations to comprehensive PDF reports.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">UK Regulation Compliant</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Automatic 5x5, 6x6, or 7x7 grid calculation based on damper dimensions per BS EN 12101-8 standards
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Professional Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    PDF exports with cover pages, grid visualisations, trend charts, signatures, and QR code verification
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Gauge className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Pressure Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    BS EN 12101-6 compliant stairwell differential pressure testing with multi-standard support
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <TrendingUp className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Year-over-year velocity trends with predictive maintenance alerts for declining performance
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex gap-4 items-start">
                <ClipboardCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Compliance Checklists</h3>
                  <p className="text-muted-foreground text-sm">
                    BS EN 12101-8 verification with categorized items, progress tracking, and inspection types
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Building2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Project Management</h3>
                  <p className="text-muted-foreground text-sm">
                    Organise tests by building and project with floor sequencing mode for efficient testing
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Anomaly Detection</h3>
                  <p className="text-muted-foreground text-sm">
                    Intelligent MAD algorithm detects unusual readings and statistical outliers
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Cloud className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Offline Support</h3>
                  <p className="text-muted-foreground text-sm">
                    Full offline functionality with delta sync for field work without internet
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Mobile Apps</h3>
                  <p className="text-muted-foreground text-sm">
                    Native iOS and Android apps with camera integration for damper documentation
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <FileSpreadsheet className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Data Export</h3>
                  <p className="text-muted-foreground text-sm">
                    CSV and JSON export with backup/restore for data portability and analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="comparison" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform vs Manual Methods</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how our digital solution compares to traditional spreadsheet and paper-based testing.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-3 gap-4 p-4 border-b font-semibold">
                    <div>Feature</div>
                    <div className="text-center text-primary">Our Platform</div>
                    <div className="text-center text-muted-foreground">Manual/Spreadsheets</div>
                  </div>
                  {COMPARISON_FEATURES.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-4 border-b last:border-b-0 items-center" data-testid={`comparison-row-${index}`}>
                      <div className="text-sm">{item.feature}</div>
                      <div className="text-center">
                        {item.platform ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </div>
                      <div className="text-center">
                        {item.manual ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="roi" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Calculator className="h-3 w-3 mr-1" />
                ROI Calculator
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Calculate Your Savings</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how much time and money you could save by switching to our platform.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label className="mb-2 block">Tests per month: {roiInputs.testsPerMonth}</Label>
                        <Slider
                          value={[roiInputs.testsPerMonth]}
                          onValueChange={(v) => setRoiInputs(prev => ({ ...prev, testsPerMonth: v[0] }))}
                          min={10}
                          max={500}
                          step={10}
                          data-testid="slider-tests"
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Hours per test (current): {roiInputs.hoursPerTest}</Label>
                        <Slider
                          value={[roiInputs.hoursPerTest]}
                          onValueChange={(v) => setRoiInputs(prev => ({ ...prev, hoursPerTest: v[0] }))}
                          min={0.5}
                          max={8}
                          step={0.5}
                          data-testid="slider-hours"
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Hourly rate (GBP): {roiInputs.hourlyRate}</Label>
                        <Slider
                          value={[roiInputs.hourlyRate]}
                          onValueChange={(v) => setRoiInputs(prev => ({ ...prev, hourlyRate: v[0] }))}
                          min={20}
                          max={100}
                          step={5}
                          data-testid="slider-rate"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="text-sm text-muted-foreground mb-1">Monthly Hours Saved</div>
                        <div className="text-3xl font-bold text-primary" data-testid="roi-hours-saved">{roi.monthlyHoursSaved.toFixed(0)} hours</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="text-sm text-muted-foreground mb-1">Monthly Cost Savings</div>
                        <div className="text-3xl font-bold text-primary" data-testid="roi-monthly-savings">£{roi.monthlySavings.toLocaleString()}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-primary text-primary-foreground">
                        <div className="text-sm opacity-90 mb-1">Annual Cost Savings</div>
                        <div className="text-4xl font-bold" data-testid="roi-annual-savings">£{roi.yearlySavings.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See what smoke control professionals are saying about our platform.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {TESTIMONIALS.map((testimonial, index) => (
                <Card key={index} className="hover-elevate" data-testid={`testimonial-${index}`}>
                  <CardHeader>
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-muted-foreground/30" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-sm text-primary">{testimonial.company}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="crm" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Business Management</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete CRM for Service Companies</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Manage your entire smoke control service business from one platform. Clients, contracts, jobs, invoicing, and more.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <Card className="hover-elevate">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Client Management</CardTitle>
                  <CardDescription>
                    Full CRM with company and contact details, communication logs, status tracking, and client type categorisation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Contact database with full details
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Commercial, residential, public sector
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Status tracking and notes
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <Briefcase className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Contract Management</CardTitle>
                  <CardDescription>
                    Service agreements with SLA tracking, auto-renewal alerts, contract value tracking, and renewal warning badges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      SLA response and resolution times
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Auto-renewal management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Color-coded renewal urgency badges
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <Calendar className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Job Scheduling</CardTitle>
                  <CardDescription>
                    Work order management with scheduling, priority levels, multi-engineer assignment, and recurring job automation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Gantt timeline and calendar views
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Map view with job locations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Conflict detection and travel time
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Receipt className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Quotes &amp; Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Financial document management with VAT calculations, status tracking, and overdue alerts
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Clock className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Timesheets</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Working hours tracking with job assignment, hourly rates, and weekly summaries
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Truck className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Vehicle Fleet</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Fleet management with MOT, tax, insurance expiry tracking and maintenance schedules
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <UserCheck className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Subcontractors</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Approved subcontractor database with insurance and accreditation expiry alerts
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Wrench className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Equipment Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Asset register with calibration due dates and maintenance schedules
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <GraduationCap className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Staff qualifications tracking (CSCS, IPAF, PASMA) with expiry monitoring
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <BarChart3 className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Sales Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Kanban-style lead tracking with stages, values, and win probability
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Package className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Full PO workflow with supplier linking and automatic calculations
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your business. All plans include a 14-day free trial.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PRICING_TIERS.map((tier, index) => (
                <Card 
                  key={index} 
                  className={`hover-elevate relative ${tier.popular ? 'border-primary border-2' : ''}`}
                  data-testid={`pricing-tier-${index}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">£{tier.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {tier.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                      {tier.notIncluded.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant={tier.popular ? "default" : "outline"} asChild>
                      <a href="/api/login">Start Free Trial</a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Additional Capabilities</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A comprehensive suite of tools designed specifically for smoke control service companies.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="flex gap-4 items-start p-4 rounded-lg bg-card border">
                <Bell className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Notifications Center</h3>
                  <p className="text-muted-foreground text-sm">
                    Internal notification system with category filtering and bulk operations
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-card border">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Site Access Notes</h3>
                  <p className="text-muted-foreground text-sm">
                    Parking instructions, access codes, key safe locations per site
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-card border">
                <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Incident Reporting</h3>
                  <p className="text-muted-foreground text-sm">
                    Accident and near-miss logging with RIDDOR flags and corrective actions
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-card border">
                <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Risk Assessments</h3>
                  <p className="text-muted-foreground text-sm">
                    RAMS creation with method statements and approval workflow
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-card border">
                <Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Holiday Management</h3>
                  <p className="text-muted-foreground text-sm">
                    Leave requests with approval workflow and annual allowance tracking
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-card border">
                <Briefcase className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Tender Management</h3>
                  <p className="text-muted-foreground text-sm">
                    Full tender register with submission deadlines and win rate tracking
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Security &amp; Trust</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your data security is our priority. Built with enterprise-grade security and full UK compliance.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6 rounded-lg bg-background border">
                <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">256-bit SSL</h3>
                <p className="text-sm text-muted-foreground">End-to-end encryption</p>
              </div>
              <div className="text-center p-6 rounded-lg bg-background border">
                <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">GDPR Compliant</h3>
                <p className="text-sm text-muted-foreground">Full UK data protection</p>
              </div>
              <div className="text-center p-6 rounded-lg bg-background border">
                <Award className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">ISO 27001</h3>
                <p className="text-sm text-muted-foreground">Security certified</p>
              </div>
              <div className="text-center p-6 rounded-lg bg-background border">
                <Cloud className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">UK Data Centers</h3>
                <p className="text-sm text-muted-foreground">Data stays in UK</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Got questions? We've got answers.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {FAQ_ITEMS.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4" data-testid={`faq-item-${index}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section id="resources" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Resources &amp; Guides</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Learn more about smoke control testing and best practices.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="hover-elevate">
                <CardHeader>
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">BS EN 12101 Guide</CardTitle>
                  <CardDescription>
                    Comprehensive guide to the BS EN 12101 standard series for smoke control systems.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <Play className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Video Tutorials</CardTitle>
                  <CardDescription>
                    Step-by-step video guides for using the platform and conducting compliant tests.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    Watch Now
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Case Studies</CardTitle>
                  <CardDescription>
                    Real-world examples of how companies improved their testing efficiency.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    Read More
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <section id="downloads" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Download className="h-3 w-3 mr-1" />
                Resources
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Download Our Operations Guide</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get the comprehensive guide to using Life Safety Ops, including detailed how-to instructions, 
                feature documentation, and best practices.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card className="border-2 hover-elevate">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Operations Guide</h3>
                          <p className="text-sm text-muted-foreground">Complete How-To Manual</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        Everything you need to know about Life Safety Ops, from initial setup to advanced features. 
                        Over 50 pages of detailed documentation with step-by-step instructions.
                      </p>
                      <Button size="lg" className="w-full" asChild data-testid="button-download-guide">
                        <a href="/api/downloads/capabilities-pdf">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF Guide
                        </a>
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold mb-3">What's included:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Getting started & organisation setup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Smoke control damper testing guide</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Stairwell pressure testing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Full CRM documentation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Field Companion mobile app</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Golden Thread compliance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Team & certification management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Reporting & analytics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="demo" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2">
                <CardContent className="p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                      <p className="text-muted-foreground mb-6">
                        Book a demo with our team or start your free trial today. No credit card required.
                      </p>
                      <div className="space-y-4">
                        <Button size="lg" className="w-full" asChild data-testid="button-book-demo">
                          <a href="/api/login">
                            Start Free Trial
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="lg" variant="outline" className="w-full" asChild data-testid="button-contact-sales">
                          <a href="mailto:sales@example.com">
                            <Phone className="mr-2 h-4 w-4" />
                            Contact Sales
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold mb-4">Stay Updated</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Subscribe to our newsletter for industry updates and product news.
                      </p>
                      <div className="flex gap-2">
                        <Input 
                          type="email" 
                          placeholder="Enter your email" 
                          className="flex-1"
                          data-testid="input-newsletter-email"
                        />
                        <Button data-testid="button-subscribe">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        By subscribing, you agree to our privacy policy. Unsubscribe anytime.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-semibold">Life Safety Ops</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Life Safety Operations & Compliance Management Platform for UK fire safety professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#crm" className="hover:text-foreground">CRM</a></li>
                <li><a href="#" className="hover:text-foreground">Mobile Apps</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#resources" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                Compliant with BS EN 12101 (Parts 1-13), BS ISO 21927-9, BS 7346-8, BS 9999, BS 9991, RRFSO 2005, and BSRIA BG 49/2024
              </p>
              <p className="text-muted-foreground text-sm">
                © 2024 Life Safety Ops. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {showBackToTop && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={scrollToTop}
          data-testid="button-back-to-top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
