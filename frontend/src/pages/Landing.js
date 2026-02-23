import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Building2, 
  Users, 
  ClipboardCheck, 
  FileText, 
  Bell,
  Shield,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Calendar,
  Building,
  Clock,
  Zap,
  Star,
  ChevronDown,
  Play,
  TrendingUp,
  Target,
  Award,
  Lock,
  X,
  Wrench,
  MessageCircle,
  Download,
  Headphones,
  CreditCard,
  ShieldCheck,
  BadgeCheck,
  Globe
} from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Property & Unit Management',
    description: 'Add unlimited properties and units. Track occupancy, rent amounts, and unit details all in one place.',
    benefit: 'Save 5+ hours/week on admin'
  },
  {
    icon: Users,
    title: 'Tenant Tracking',
    description: 'Complete tenant profiles with lease dates, contact info, and payment status. Never miss a lease renewal.',
    benefit: 'Zero missed renewals'
  },
  {
    icon: ClipboardCheck,
    title: 'Inspection Workflows',
    description: 'Schedule inspections, assign to team members, track completion status, and maintain compliance records.',
    benefit: '100% inspection compliance'
  },
  {
    icon: FileText,
    title: 'Document Storage',
    description: 'Upload leases, IDs, inspection reports. Everything organized and linked to the right tenant or property.',
    benefit: 'Find any doc in seconds'
  },
  {
    icon: Wrench,
    title: 'Maintenance Requests',
    description: 'Track and manage work orders from submission to completion. Assign tasks, set priorities, and monitor progress.',
    benefit: 'Faster response times'
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Get alerts for lease expirations, upcoming inspections, and team activities. Never miss a deadline.',
    benefit: 'Stay ahead of deadlines'
  },
  {
    icon: Shield,
    title: 'Team Access Control',
    description: 'Invite your team with Admin, Manager, or Staff roles. Control exactly who can view and edit what.',
    benefit: 'Secure & organized'
  },
  {
    icon: MessageCircle,
    title: 'Tenant Portal',
    description: 'Give tenants a dedicated portal to submit requests, upload documents, and communicate securely.',
    benefit: 'Happy tenants, less calls'
  }
];

const testimonials = [
  {
    quote: "We went from juggling 5 different spreadsheets to having everything in one place. Our team saves at least 10 hours per week.",
    author: "Sarah M.",
    role: "Property Manager",
    company: "Horizon Properties",
    units: "45 units"
  },
  {
    quote: "The inspection tracking alone is worth it. We've never been more compliant, and our audit prep time dropped by 80%.",
    author: "Michael R.",
    role: "Operations Director",
    company: "Urban Living Co",
    units: "120 units"
  },
  {
    quote: "Finally, a tool that understands property management. Setup took 15 minutes and my team was productive on day one.",
    author: "Jennifer K.",
    role: "Portfolio Manager",
    company: "Coastal Rentals",
    units: "78 units"
  }
];

const stats = [
  { value: '10+', label: 'Hours saved per week', icon: Clock },
  { value: '100%', label: 'Inspection compliance', icon: Target },
  { value: '15 min', label: 'Average setup time', icon: Zap },
  { value: '4.9/5', label: 'Customer rating', icon: Star }
];

const pricingPlans = {
  monthly: {
    free: { price: 0, period: '/month' },
    standard: { price: 49, period: '/month' },
    pro: { price: 149, period: '/month' }
  },
  annual: {
    free: { price: 0, period: '/month' },
    standard: { price: 39, period: '/month', savings: 'Save $120/year' },
    pro: { price: 119, period: '/month', savings: 'Save $360/year' }
  }
};

const planFeatures = {
  free: [
    { text: 'Up to 2 properties', included: true },
    { text: 'Up to 5 units', included: true },
    { text: '1 team member', included: true },
    { text: 'Basic document storage (500MB)', included: true },
    { text: 'Basic maintenance requests', included: true }
  ],
  standard: [
    { text: 'Up to 20 properties', included: true },
    { text: 'Up to 40 units', included: true },
    { text: '5 team members', included: true },
    { text: 'Full inspection workflows', included: true },
    { text: '10GB document storage', included: true },
    { text: 'Tenant Portal with photo uploads', included: true },
    { text: 'Rent payment tracking', included: true },
    { text: 'Email notifications', included: true },
    { text: 'Contractor Portal access', included: true },
    { text: 'One-tap contractor assignment', included: true },
    { text: 'Exportable reports (CSV/PDF)', included: true },
    { text: 'Tenant Screening (pay per use)', included: true }
  ],
  pro: [
    { text: 'Unlimited properties', included: true },
    { text: 'Unlimited units', included: true },
    { text: 'Unlimited team members', included: true },
    { text: 'Everything in Standard', included: true },
    { text: '100GB document storage', included: true },
    { text: 'AI-Powered Insights Dashboard', included: true },
    { text: 'Advanced analytics dashboard', included: true },
    { text: 'API access with key management', included: true },
    { text: 'Two-factor authentication (2FA)', included: true },
    { text: 'Full audit logs', included: true },
    { text: '24/7 priority support', included: true }
  ]
};

const faqs = [
  {
    q: "How long is the free plan available?",
    a: "The free plan is available forever, not a trial. You can use MyPropOps completely free for up to 2 properties and 5 units with no time limit. When you're ready to scale, upgrade to Standard or Pro."
  },
  {
    q: "Do I need a credit card to start?",
    a: "No credit card required. Sign up with just your email and start using MyPropOps immediately. We'll only ask for payment info if you choose to upgrade."
  },
  {
    q: "What's the difference between monthly and annual billing?",
    a: "Annual billing saves you up to 17% compared to monthly billing. You're billed once per year at the discounted rate. You can switch between billing periods at any time."
  },
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Yes! You can upgrade instantly and get immediate access to new features. Downgrades take effect at the end of your current billing period. No penalties or fees."
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use industry-standard AES-256 encryption, secure cloud infrastructure on AWS, and role-based access controls. Your data is backed up daily across multiple regions."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express), as well as ACH bank transfers for annual plans. Enterprise customers can pay via invoice."
  }
];

const INFOGRAPHIC_URL = "https://static.prod-images.emergentagent.com/jobs/ff35c095-fb57-42ce-8736-9575eebfd0f0/images/8d3cdb0f84cc5c5fc4bb51faed874a21a964e83906fc272099fbb18c77725831.png";

const Landing = () => {
  const [openFaq, setOpenFaq] = React.useState(null);
  const [billingPeriod, setBillingPeriod] = React.useState('annual');

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="MyPropOps" 
                className="w-10 h-10 rounded-lg object-contain"
              />
              <span className="text-xl font-bold font-heading">MyPropOps</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
              <Link to="/tenant-portal/login" className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium">For Tenants</Link>
              <Link to="/contractor/login" className="text-orange-600 hover:text-orange-700 transition-colors font-medium">For Contractors</Link>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" data-testid="nav-login">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button data-testid="nav-get-started">Start Free</Button>
              </Link>
            </div>
            {/* Mobile: Just show Sign In and Start Free */}
            <div className="flex sm:hidden items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Start Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Bar - Fixed at bottom on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-14">
          <a href="#features" className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground">
            <span className="text-xs">Features</span>
          </a>
          <a href="#pricing" className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground">
            <span className="text-xs">Pricing</span>
          </a>
          <Link to="/blog" className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground">
            <span className="text-xs">Blog</span>
          </Link>
          <Link to="/about" className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground">
            <span className="text-xs">About</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                #1 Property Management Software
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-tight">
                Stop drowning in spreadsheets.<br />
                <span className="text-primary">Start managing.</span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-xl">
                MyPropOps is the all-in-one cloud-based property management platform trusted by 500+ property managers. Streamline operations, ensure compliance, and scale your portfolio with our industry-leading software solution.
              </p>
              
              {/* Value Props */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Setup in 15 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Free up to 5 units</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Cancel anytime</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto btn-active text-base px-8" data-testid="hero-get-started">
                    Start My Free Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base">
                    <Play className="w-4 h-4 mr-2" />
                    See How It Works
                  </Button>
                </a>
              </div>
              
              <p className="mt-4 text-sm text-muted-foreground">
                Join 500+ property managers who switched this month
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-3xl blur-3xl" />
              <Card className="relative glass overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8">
                    <div className="bg-card rounded-xl p-4 shadow-lg mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Dashboard Overview</span>
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Live
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <BarChart3 className="w-6 h-6 text-primary mb-1" />
                          <p className="text-xl font-bold">24</p>
                          <p className="text-xs text-muted-foreground">Properties</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <Users className="w-6 h-6 text-primary mb-1" />
                          <p className="text-xl font-bold">156</p>
                          <p className="text-xs text-muted-foreground">Tenants</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <ClipboardCheck className="w-6 h-6 text-green-500 mb-1" />
                          <p className="text-xl font-bold">98%</p>
                          <p className="text-xs text-muted-foreground">Compliance</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <Calendar className="w-6 h-6 text-amber-500 mb-1" />
                          <p className="text-xl font-bold">3</p>
                          <p className="text-xs text-muted-foreground">Due This Week</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card rounded-xl p-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm">Inspection completed: Unit 4B - Oak Apartments</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-3xl font-bold font-heading">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-card border-b" data-testid="trust-signals">
        <div className="max-w-7xl mx-auto">
          {/* Security & Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 rounded-full border border-green-200 dark:border-green-800">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Bank-Grade 256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-full border border-blue-200 dark:border-blue-800">
              <Lock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-full border border-amber-200 dark:border-amber-800">
              <Star className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Rated 4.9/5 by Landlords</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/30 rounded-full border border-purple-200 dark:border-purple-800">
              <Headphones className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">U.S. Based Support</span>
            </div>
          </div>

          {/* Powered By / Integrations */}
          <div className="text-center mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Powered by world-class infrastructure</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
              {/* Stripe */}
              <div className="flex items-center gap-2">
                <svg className="h-8 w-16" viewBox="0 0 60 25" fill="currentColor" aria-label="Stripe">
                  <path d="M5 10.1c0-.6.6-1 1.3-1 1.2 0 2.7.4 3.9 1.1V6.7c-1.3-.5-2.6-.8-3.9-.8C3.2 5.9 1 7.6 1 10.3c0 4 5.5 3.4 5.5 5.1 0 .7-.6 1-1.4 1-1.2 0-2.8-.5-4.1-1.2v3.6c1.4.6 2.8.9 4.1.9 3.2 0 5.4-1.6 5.4-4.3C10.5 11.1 5 11.8 5 10.1z"/>
                  <path d="M19.5 5.9l-3.3.7v3.5h-1.7v3.1h1.7v4.3c0 2.7 1.3 3.7 3.6 3.7.8 0 1.6-.2 2.3-.4v-3c-.4.1-.8.2-1.3.2-.9 0-1.3-.4-1.3-1.3v-3.5h2.6V10h-2.6V5.9z"/>
                  <path d="M27.4 8.5l-.2-1.6h-3.5v14h4V12.3c.9-1.2 2.4-1 2.9-.8V7.9c-.5-.2-2.3-.5-3.2 1z"/>
                  <path d="M33.5 6.9h4v14h-4z"/>
                  <path d="M33.5 3.4l4-.8v3h-4z"/>
                  <path d="M45.2 6.4c-1.5 0-2.4.7-3 1.2l-.2-1h-3.5v17.8l4-.8V21c.6.4 1.5.8 2.6.8 2.6 0 5-2.1 5-6.7.1-4.2-2.4-6.6-4.9-6.7zm-.9 10.3c-.9 0-1.4-.3-1.8-.7v-5.5c.4-.5.9-.7 1.8-.7 1.4 0 2.3 1.5 2.3 3.4 0 2-1 3.5-2.3 3.5z"/>
                  <path d="M56.3 6.4c-2.8 0-4.7 2.4-4.7 6.7 0 4.4 2.1 6.6 5.7 6.6 1.6 0 2.9-.4 3.8-.9V16c-.8.4-1.8.6-2.9.6-1.2 0-2.2-.4-2.3-1.8h5.8c0-.2 0-.8 0-1.1 0-4.5-2.1-6.7-5.4-6.7zM54 12c0-1.3.8-1.9 1.7-1.9s1.6.6 1.6 1.9H54z"/>
                </svg>
                <span className="text-sm font-medium">Stripe</span>
              </div>
              {/* AWS */}
              <div className="flex items-center gap-2">
                <Globe className="w-6 h-6" />
                <span className="text-sm font-medium">Cloud Hosted</span>
              </div>
              {/* MongoDB */}
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <span className="text-sm font-medium">Enterprise Database</span>
              </div>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">No Hidden Fees</p>
                <p className="text-xs text-muted-foreground">Clear pricing always</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Export Anytime</p>
                <p className="text-xs text-muted-foreground">Your data is yours</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">No Unit Minimums</p>
                <p className="text-xs text-muted-foreground">Start with 1 property</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Human Support</p>
                <p className="text-xs text-muted-foreground">Real people, real help</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30" data-testid="video-showcase">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Play className="w-4 h-4" />
              See It In Action
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Property Management, Simplified
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Watch how MyPropOps transforms the way you manage properties in just seconds
            </p>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Video 1: Spreadsheet Killer */}
            <div className="group relative rounded-2xl overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all">
              <video 
                className="w-full aspect-video object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source src="https://customer-assets.emergentagent.com/job_9fe5d8d9-7e94-4b0b-a436-c83b4b94ab4a/artifacts/j0e4chjv_prop5.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-red-300">No More Spreadsheets</span>
                </div>
                <h3 className="text-lg font-bold">Spreadsheet Killer</h3>
                <p className="text-xs text-white/80">Ditch the spreadsheets. Get the dashboard.</p>
              </div>
            </div>

            {/* Video 2: Compliance Shield */}
            <div className="group relative rounded-2xl overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all">
              <video 
                className="w-full aspect-video object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source src="https://customer-assets.emergentagent.com/job_9fe5d8d9-7e94-4b0b-a436-c83b4b94ab4a/artifacts/fzrlnm2b_prop3.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Shield className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-blue-300">100% Compliant</span>
                </div>
                <h3 className="text-lg font-bold">Compliance Shield</h3>
                <p className="text-xs text-white/80">Compliance deadlines? Already handled.</p>
              </div>
            </div>

            {/* Video 3: Maintenance Magic */}
            <div className="group relative rounded-2xl overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all">
              <video 
                className="w-full aspect-video object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source src="https://customer-assets.emergentagent.com/job_9fe5d8d9-7e94-4b0b-a436-c83b4b94ab4a/artifacts/lf1xwx6w_prop2.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Wrench className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-orange-300">One-Tap Fixes</span>
                </div>
                <h3 className="text-lg font-bold">Maintenance Magic</h3>
                <p className="text-xs text-white/80">Click. Assigned. Done.</p>
              </div>
            </div>

            {/* Video 4: Whole Team */}
            <div className="group relative rounded-2xl overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all">
              <video 
                className="w-full aspect-video object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source src="https://customer-assets.emergentagent.com/job_9fe5d8d9-7e94-4b0b-a436-c83b4b94ab4a/artifacts/fyzgszf2_prop1.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-purple-300">Team Sync</span>
                </div>
                <h3 className="text-lg font-bold">Whole Team</h3>
                <p className="text-xs text-white/80">Get your whole team on the same page.</p>
              </div>
            </div>

            {/* CTA Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 shadow-lg flex flex-col items-center justify-center p-6 text-white aspect-video">
              <div className="text-center flex flex-col items-center justify-center h-full">
                <Play className="w-10 h-10 mb-3 opacity-80" />
                <h3 className="text-lg font-bold mb-1">Ready to Transform?</h3>
                <p className="text-white/80 text-xs mb-3">Join 500+ property managers</p>
                <Link to="/register">
                  <Button size="sm" variant="secondary" className="font-semibold">
                    Start Free
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Infographic Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" data-testid="infographic-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              See your portfolio at a glance
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time analytics and insights to help you make smarter property decisions
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-3xl blur-2xl" />
            <Card className="relative glass overflow-hidden">
              <CardContent className="p-4 sm:p-8">
                <img 
                  src={INFOGRAPHIC_URL} 
                  alt="MyPropOps Financial Analytics Dashboard showing property metrics, occupancy rates, and revenue insights"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="problem-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Sound familiar?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Problems */}
            <Card className="glass border-destructive/30 bg-destructive/5">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-destructive flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-sm">1</span>
                  The old way
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <div>
                      <p className="font-medium">Spreadsheet chaos</p>
                      <p className="text-sm text-muted-foreground">Multiple files, outdated info, no single source of truth</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <div>
                      <p className="font-medium">Missed inspections</p>
                      <p className="text-sm text-muted-foreground">No reminders, compliance risk, scrambling at audit time</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <div>
                      <p className="font-medium">Team confusion</p>
                      <p className="text-sm text-muted-foreground">No visibility into who's doing what, duplicate work</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <div>
                      <p className="font-medium">Lost documents</p>
                      <p className="text-sm text-muted-foreground">Leases in email, IDs in folders, nothing linked</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            {/* Solutions */}
            <Card className="glass border-primary/30 bg-primary/5">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">2</span>
                  The MyPropOps way
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">One dashboard</p>
                      <p className="text-sm text-muted-foreground">All properties, tenants, and data in one place</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Automated reminders</p>
                      <p className="text-sm text-muted-foreground">Never miss an inspection or lease renewal again</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Team coordination</p>
                      <p className="text-sm text-muted-foreground">Assign tasks, track progress, complete audit trail</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Organized documents</p>
                      <p className="text-sm text-muted-foreground">Everything linked to the right tenant and property</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Get started in 3 simple steps
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Most teams are fully operational in under 15 minutes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create your account</h3>
              <p className="text-muted-foreground">
                Sign up free in 30 seconds. No credit card, no commitment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Add your properties</h3>
              <p className="text-muted-foreground">
                Enter your properties and units. We'll auto-create unit records for you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Invite your team</h3>
              <p className="text-muted-foreground">
                Add team members with the right access levels. Start collaborating immediately.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link to="/register">
              <Button size="lg" className="btn-active">
                Start My Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Everything you need. Nothing you don't.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for property managers—not a generic tool adapted for real estate
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="glass card-hover group" data-testid={`feature-card-${i}`}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold font-heading mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-3">{feature.description}</p>
                  <p className="text-sm text-primary font-medium flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {feature.benefit}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Trusted by property managers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See why teams are switching to MyPropOps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="glass">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">{t.author[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{t.author}</p>
                      <p className="text-sm text-muted-foreground">{t.role}, {t.company}</p>
                      <p className="text-xs text-primary">{t.units}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you're ready. No hidden fees.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-6 mb-12">
            <span className={`text-sm font-medium transition-colors ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-16 h-8 rounded-full transition-colors ${billingPeriod === 'annual' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              data-testid="billing-toggle"
            >
              <span className={`absolute top-1.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${billingPeriod === 'annual' ? 'translate-x-9' : 'translate-x-1.5'}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium transition-colors ${billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>Annual</span>
              <span className="text-xs text-green-600 font-semibold bg-green-100 dark:bg-green-950/50 px-2 py-0.5 rounded-full">Save 17%</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="glass relative overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold font-heading">Free</h3>
                  <p className="text-muted-foreground">Perfect for getting started</p>
                </div>
                <div className="mb-4">
                  <span className="text-5xl font-bold font-heading">${pricingPlans[billingPeriod].free.price}</span>
                  <span className="text-muted-foreground">{pricingPlans[billingPeriod].free.period}</span>
                </div>
                <p className="text-sm text-green-600 font-medium mb-6 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Free forever, not a trial
                </p>
                <ul className="space-y-3 mb-8">
                  {planFeatures.free.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button className="w-full" size="lg" variant="outline" data-testid="pricing-free-btn">
                    Start Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Standard Plan */}
            <Card className="glass relative overflow-hidden border-primary border-2 scale-105">
              <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-sm font-medium py-1.5">
                MOST POPULAR
              </div>
              <CardContent className="p-8 pt-12">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold font-heading">Standard</h3>
                  <p className="text-muted-foreground">For growing portfolios</p>
                </div>
                <div className="mb-2">
                  <span className="text-5xl font-bold font-heading">${pricingPlans[billingPeriod].standard.price}</span>
                  <span className="text-muted-foreground">{pricingPlans[billingPeriod].standard.period}</span>
                </div>
                {pricingPlans[billingPeriod].standard.savings && (
                  <p className="text-sm text-green-600 font-medium mb-4">
                    {pricingPlans[billingPeriod].standard.savings}
                  </p>
                )}
                <ul className="space-y-3 mb-8">
                  {planFeatures.standard.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button className="w-full btn-active" size="lg" data-testid="pricing-standard-btn">
                    Start Free, Upgrade Later
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="glass relative overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold font-heading flex items-center gap-2">
                    Pro
                    <span className="text-xs bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">Best Value</span>
                  </h3>
                  <p className="text-muted-foreground">For professional managers</p>
                </div>
                <div className="mb-2">
                  <span className="text-5xl font-bold font-heading">${pricingPlans[billingPeriod].pro.price}</span>
                  <span className="text-muted-foreground">{pricingPlans[billingPeriod].pro.period}</span>
                </div>
                {pricingPlans[billingPeriod].pro.savings && (
                  <p className="text-sm text-green-600 font-medium mb-4">
                    {pricingPlans[billingPeriod].pro.savings}
                  </p>
                )}
                <ul className="space-y-3 mb-8">
                  {planFeatures.pro.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button className="w-full" size="lg" variant="outline" data-testid="pricing-pro-btn">
                    Start Free, Upgrade Later
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Need enterprise features? <a href="mailto:sales@propops.com" className="text-primary hover:underline">Contact us</a> for custom pricing.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8" data-testid="faq-section">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="glass">
                <CardContent className="p-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-muted-foreground">{faq.a}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-12 border border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Ready to take control of your properties?
            </h2>
            <p className="text-lg text-muted-foreground mb-4 max-w-xl mx-auto">
              Join 500+ property managers who've ditched the spreadsheets.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Free forever for up to 2 properties • No credit card required • Setup in 15 minutes
            </p>
            <Link to="/register">
              <Button size="lg" className="btn-active text-base px-8" data-testid="cta-get-started">
                Start My Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/logo.jpg" 
                  alt="MyPropOps" 
                  className="w-8 h-8 rounded-lg object-contain"
                />
                <span className="font-semibold">MyPropOps</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Simple property management for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-foreground">Reviews</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground">About</Link></li>
                <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><a href="mailto:support@mypropops.com" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link to="/security" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MyPropOps. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with care for property managers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
