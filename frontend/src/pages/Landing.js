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
  Building
} from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Property Management',
    description: 'Manage all your properties and units in one centralized dashboard with real-time updates.'
  },
  {
    icon: Users,
    title: 'Tenant Tracking',
    description: 'Keep track of tenant information, lease dates, and status changes effortlessly.'
  },
  {
    icon: ClipboardCheck,
    title: 'Inspection Workflows',
    description: 'Schedule, track, and approve inspections with a built-in state machine for compliance.'
  },
  {
    icon: FileText,
    title: 'Document Storage',
    description: 'Upload and organize leases, IDs, and inspection reports linked to tenants and properties.'
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Stay informed with real-time alerts for deadlines, status changes, and team activities.'
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Control who can view and modify data with Admin, Manager, and Staff roles.'
  }
];

const painPoints = [
  'Scattered spreadsheets and paper records',
  'Missed inspection deadlines',
  'No visibility into team activities',
  'Difficult lease tracking'
];

const solutions = [
  'One unified dashboard for everything',
  'Automated inspection scheduling',
  'Complete audit trail of all actions',
  'Calendar view with lease end dates'
];

const Landing = () => {
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
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" data-testid="nav-login">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button data-testid="nav-get-started">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-tight">
                All your property operations.{' '}
                <span className="text-primary">One dashboard.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Streamline property management, track tenants, schedule inspections, and keep your team aligned—all in one powerful platform built for housing operators.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto btn-active" data-testid="hero-get-started">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Free to start
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No credit card
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-3xl blur-3xl" />
              <Card className="relative glass overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card/80 backdrop-blur rounded-xl p-4 shadow-sm">
                        <BarChart3 className="w-8 h-8 text-primary mb-2" />
                        <p className="text-2xl font-bold font-heading">24</p>
                        <p className="text-sm text-muted-foreground">Properties</p>
                      </div>
                      <div className="bg-card/80 backdrop-blur rounded-xl p-4 shadow-sm">
                        <Users className="w-8 h-8 text-primary mb-2" />
                        <p className="text-2xl font-bold font-heading">156</p>
                        <p className="text-sm text-muted-foreground">Tenants</p>
                      </div>
                      <div className="bg-card/80 backdrop-blur rounded-xl p-4 shadow-sm">
                        <ClipboardCheck className="w-8 h-8 text-primary mb-2" />
                        <p className="text-2xl font-bold font-heading">12</p>
                        <p className="text-sm text-muted-foreground">Inspections</p>
                      </div>
                      <div className="bg-card/80 backdrop-blur rounded-xl p-4 shadow-sm">
                        <Calendar className="w-8 h-8 text-primary mb-2" />
                        <p className="text-2xl font-bold font-heading">8</p>
                        <p className="text-sm text-muted-foreground">This Week</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points vs Solutions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="pain-points-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Stop juggling. Start managing.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Property management doesn't have to be chaotic. Replace scattered tools with one unified solution.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pain Points */}
            <Card className="glass border-destructive/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-destructive">Without PropOps</h3>
                <ul className="space-y-3">
                  {painPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✕</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            {/* Solutions */}
            <Card className="glass border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary">With PropOps</h3>
                <ul className="space-y-3">
                  {solutions.map((solution, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      {solution}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Everything you need to manage properties
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit for property managers and housing operators
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="glass card-hover" data-testid={`feature-card-${i}`}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold font-heading mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="audience-section">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            Built for property professionals
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Whether you manage 10 units or 1,000, PropOps scales with your portfolio
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Property Managers</h3>
              <p className="text-sm text-muted-foreground">Oversee multiple properties with ease</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Housing Operators</h3>
              <p className="text-sm text-muted-foreground">Streamline daily operations</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Compliance Teams</h3>
              <p className="text-sm text-muted-foreground">Track inspections and audits</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-12 border border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Ready to simplify your property operations?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join property managers who trust PropOps to keep their operations running smoothly.
            </p>
            <Link to="/register">
              <Button size="lg" className="btn-active" data-testid="cta-get-started">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">PropOps</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PropOps. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
