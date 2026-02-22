import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Building, 
  ArrowLeft, 
  Shield, 
  Lock, 
  Server, 
  Eye, 
  Key, 
  RefreshCw,
  CheckCircle,
  Globe,
  FileCheck,
  Users
} from 'lucide-react';

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit. Your sensitive property and tenant data is protected at every step.'
  },
  {
    icon: Server,
    title: 'Secure Cloud Infrastructure',
    description: 'Hosted on AWS with SOC 2 Type II certified data centers. Multi-region deployment ensures high availability and disaster recovery.'
  },
  {
    icon: Eye,
    title: 'Access Controls',
    description: 'Role-based access control (RBAC) ensures team members only see what they need. Admin, Manager, and Staff roles with granular permissions.'
  },
  {
    icon: Key,
    title: 'Secure Authentication',
    description: 'Industry-standard JWT authentication with bcrypt password hashing. Support for strong password policies and session management.'
  },
  {
    icon: RefreshCw,
    title: 'Regular Backups',
    description: 'Automated daily backups with 30-day retention. Geographically redundant storage ensures your data is never lost.'
  },
  {
    icon: FileCheck,
    title: 'Audit Logging',
    description: 'Comprehensive audit trails of all user actions. Know who did what and when for compliance and accountability.'
  }
];

const certifications = [
  { name: 'GDPR', status: 'Privacy policy compliant, formal audit pending' },
  { name: 'CCPA', status: 'Privacy policy compliant, formal audit pending' },
  { name: 'Data Encryption', status: 'AES-256 at rest, TLS 1.3 in transit' },
  { name: 'Secure Authentication', status: '2FA available, bcrypt hashing' }
];

const Security = () => {
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
              <span className="text-xl font-bold font-heading">MyPropOps</span>
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
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-heading mb-4">Security at MyPropOps</h1>
            <p className="text-xl text-muted-foreground">
              Your property data deserves enterprise-grade protection. Here's how we keep it safe.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold font-heading text-center mb-12">How We Protect Your Data</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, i) => (
              <Card key={i} className="glass">
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

      {/* Compliance */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold font-heading mb-4">Compliance & Certifications</h2>
              <p className="text-muted-foreground mb-8">
                We maintain compliance with major industry standards and regulations to ensure your data meets the highest security requirements.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-sm text-muted-foreground">{cert.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Card className="glass">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold font-heading mb-6">Security Practices</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Regular Security Audits</p>
                      <p className="text-sm text-muted-foreground">Annual third-party penetration testing and vulnerability assessments</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Employee Training</p>
                      <p className="text-sm text-muted-foreground">All team members complete security awareness training annually</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Incident Response</p>
                      <p className="text-sm text-muted-foreground">24/7 security monitoring with documented incident response procedures</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Secure Development</p>
                      <p className="text-sm text-muted-foreground">OWASP-aligned secure coding practices and code review processes</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Residency */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold font-heading mb-4">Data Residency</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your data is stored in secure AWS data centers. Enterprise customers can choose their preferred data region.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="glass text-center">
              <CardContent className="p-6">
                <p className="text-2xl font-bold font-heading mb-1">US East</p>
                <p className="text-muted-foreground">Virginia, USA</p>
                <p className="text-sm text-primary mt-2">Default Region</p>
              </CardContent>
            </Card>
            <Card className="glass text-center">
              <CardContent className="p-6">
                <p className="text-2xl font-bold font-heading mb-1">EU West</p>
                <p className="text-muted-foreground">Ireland</p>
                <p className="text-sm text-muted-foreground mt-2">Enterprise Only</p>
              </CardContent>
            </Card>
            <Card className="glass text-center">
              <CardContent className="p-6">
                <p className="text-2xl font-bold font-heading mb-1">Asia Pacific</p>
                <p className="text-muted-foreground">Sydney, Australia</p>
                <p className="text-sm text-muted-foreground mt-2">Enterprise Only</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="glass">
            <CardContent className="p-8 sm:p-12">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-heading mb-4">Responsible Disclosure</h2>
                  <p className="text-muted-foreground mb-6">
                    We value the security community and welcome responsible disclosure of vulnerabilities. If you discover a security issue, please report it to us privately.
                  </p>
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Email:</strong> security@propops.com
                    </p>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">PGP Key:</strong> Available upon request
                    </p>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Response Time:</strong> Within 24 hours
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-6">
                    We do not pursue legal action against security researchers who act in good faith and follow responsible disclosure practices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-heading mb-4">Questions about security?</h2>
          <p className="text-muted-foreground mb-8">
            Our security team is happy to answer your questions and provide additional documentation for enterprise evaluations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:security@propops.com">
              <Button size="lg" variant="outline">
                Contact Security Team
              </Button>
            </a>
            <Link to="/register">
              <Button size="lg" className="btn-active">
                Start Free Trial
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
            <span className="font-semibold">MyPropOps</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/security" className="hover:text-foreground">Security</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MyPropOps. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Security;
