import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Building2, 
  Target, 
  Heart, 
  Users, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Simplicity First",
      description: "We believe property management shouldn't require a PhD. Every feature we build is designed to save you time, not waste it."
    },
    {
      icon: Heart,
      title: "Customer Obsessed",
      description: "We're landlords and property managers ourselves. We build what we need, and we listen to what you need."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Our roadmap is shaped by real feedback from real property managers. Your voice matters."
    },
    {
      icon: Sparkles,
      title: "Innovation with Purpose",
      description: "We embrace AI and automation, but only when it genuinely makes your life easier."
    }
  ];

  const milestones = [
    { year: "2024", event: "MyPropOps founded with a simple mission: kill the spreadsheet" },
    { year: "2024", event: "Launched Tenant Portal for Section 8 and HUD housing" },
    { year: "2025", event: "Introduced AI-Powered Insights Dashboard" },
    { year: "2025", event: "500+ property managers trust MyPropOps" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MyPropOps</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            We're on a mission to make property management <span className="text-primary">simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            MyPropOps was born from frustration. As property managers ourselves, we were tired of juggling spreadsheets, 
            chasing tenants, and drowning in paperwork. So we built something better.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Story</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-4">
              It started with a 3 AM panic. A water heater burst in one of our rental units, and we couldn't find 
              the tenant's contact info buried somewhere in a maze of spreadsheets and sticky notes.
            </p>
            <p className="mb-4">
              That night, we decided enough was enough. Property management software existed, but it was either 
              too expensive, too complicated, or built for enterprise companies with dedicated IT teams.
            </p>
            <p className="mb-4">
              We wanted something different: a tool that's powerful enough to handle everything, yet simple enough 
              to use on day one. A platform that grows with you, whether you have 2 units or 200.
            </p>
            <p>
              Today, MyPropOps helps hundreds of property managers sleep better at night. And we're just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">What We Believe</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Journey</h2>
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-16 flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">{milestone.year}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{milestone.event}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to simplify your property management?</h2>
          <p className="text-muted-foreground mb-8">
            Join 500+ property managers who've ditched the spreadsheets.
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Start Free Today
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">MyPropOps</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/blog" className="hover:text-foreground">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
