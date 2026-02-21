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
  X
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
    standard: { price: 29, period: '/month' },
    pro: { price: 99, period: '/month' }
  },
  annual: {
    free: { price: 0, period: '/month' },
    standard: { price: 24, period: '/month', savings: 'Save $60/year' },
    pro: { price: 82, period: '/month', savings: 'Save $204/year' }
  }
};

const planFeatures = {
  free: [
    { text: 'Up to 2 properties', included: true },
    { text: 'Up to 5 units', included: true },
    { text: '1 team member', included: true }
  ],
  standard: [
    { text: 'Up to 20 properties', included: true },
    { text: 'Up to 40 units', included: true },
    { text: '5 team members', included: true },
    { text: 'Full inspection workflows', included: true },
    { text: 'Document storage (10GB)', included: true },
    { text: 'Calendar integrations', included: true }
  ],
  pro: [
    { text: 'Unlimited properties', included: true },
    { text: 'Unlimited units', included: true },
    { text: 'Unlimited team members', included: true },
    { text: 'Full inspection workflows', included: true },
    { text: 'Document storage (100GB)', included: true },
    { text: '24/7 priority support', included: true },
    { text: 'Advanced analytics', included: true },
    { text: 'Calendar integrations', included: true },
    { text: 'Full API access', included: true }
  ]
};

const faqs = [
  {
    q: "How long is the free plan available?",
    a: "The free plan is available forever, not a trial. You can use PropOps completely free for up to 2 properties and 5 units with no time limit. When you're ready to scale, upgrade to Standard or Pro."
  },
  {
    q: "Do I need a credit card to start?",
    a: "No credit card required. Sign up with just your email and start using PropOps immediately. We'll only ask for payment info if you choose to upgrade."
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
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Building className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold font-heading">PropOps</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" data-testid="nav-login">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button data-testid="nav-get-started">Start Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Free forever for small portfolios
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-tight">
                Stop drowning in spreadsheets.{' '}
                <span className="text-primary">Start managing.</span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-xl">
                PropOps replaces your scattered spreadsheets, missed deadlines, and compliance headaches with one simple dashboard your whole team can use.
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
                  alt="PropOps Financial Analytics Dashboard showing property metrics, occupancy rates, and revenue insights"
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
                  The PropOps way
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
              See why teams are switching to PropOps
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
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${billingPeriod === 'annual' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              data-testid="billing-toggle"
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${billingPeriod === 'annual' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
              <span className="ml-2 text-xs text-green-600 font-semibold">Save 17%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="glass relative overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold font-heading">Free</h3>
                  <p className="text-muted-foreground">Perfect for getting started</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-bold font-heading">${pricingPlans[billingPeriod].free.price}</span>
                  <span className="text-muted-foreground">{pricingPlans[billingPeriod].free.period}</span>
                </div>
                <p className="text-sm text-green-600 font-medium mb-6 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Free forever, not a trial
                </p>
                <ul className="space-y-3 mb-8">
                  {planFeatures.free.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {item.included ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={item.included ? '' : 'text-muted-foreground/50'}>{item.text}</span>
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
                <p className="text-sm text-muted-foreground mb-6">
                  {billingPeriod === 'annual' ? 'Billed annually' : 'Billed monthly'}. Cancel anytime.
                </p>
                <ul className="space-y-3 mb-8">
                  {planFeatures.standard.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {item.included ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={item.included ? '' : 'text-muted-foreground/50'}>{item.text}</span>
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
                  <h3 className="text-2xl font-bold font-heading">Pro</h3>
                  <p className="text-muted-foreground">For large portfolios</p>
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
                <p className="text-sm text-muted-foreground mb-6">
                  {billingPeriod === 'annual' ? 'Billed annually' : 'Billed monthly'}. Cancel anytime.
                </p>
                <ul className="space-y-3 mb-8">
                  {planFeatures.pro.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
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
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-semibold">PropOps</span>
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
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="mailto:support@propops.com" className="hover:text-foreground">Contact</a></li>
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
              © {new Date().getFullYear()} PropOps. All rights reserved.
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
