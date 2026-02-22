import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Building2, 
  ArrowLeft, 
  FileText,
  Shield,
  Globe,
  Clock,
  Mail,
  CheckCircle
} from 'lucide-react';

const DPA = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
        </div>
      </nav>

      {/* Header */}
      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/security" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Security
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Data Processing Agreement</h1>
              <p className="text-muted-foreground">Summary for Enterprise Customers</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">Last updated: {currentDate}</p>
        </div>
      </section>

      {/* DPA Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Overview */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Overview
              </h2>
              <p className="text-muted-foreground mb-4">
                This Data Processing Agreement ("DPA") summary outlines how MyPropOps ("Processor") handles personal data on behalf of our customers ("Controllers") in compliance with applicable data protection laws, including GDPR and CCPA.
              </p>
              <p className="text-muted-foreground">
                MyPropOps acts as a <strong>data processor</strong> when handling tenant, property, and user data on behalf of property managers and landlords who use our platform.
              </p>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">1. Definitions and Roles</h2>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium">Data Controller (You)</p>
                  <p className="text-sm text-muted-foreground">The property manager, landlord, or organization that uses MyPropOps and determines the purposes and means of processing personal data.</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium">Data Processor (MyPropOps)</p>
                  <p className="text-sm text-muted-foreground">MyPropOps processes personal data only on your documented instructions as part of providing the property management service.</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium">Data Subjects</p>
                  <p className="text-sm text-muted-foreground">Tenants, contractors, team members, and other individuals whose personal data is processed through the platform.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Processing */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">2. Data We Process</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">Tenant Data</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Names and contact information</li>
                    <li>• Lease details and payment history</li>
                    <li>• Maintenance request records</li>
                    <li>• Documents (IDs, applications)</li>
                    <li>• Communication history</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">Property Data</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Property addresses and details</li>
                    <li>• Unit information</li>
                    <li>• Inspection records and photos</li>
                    <li>• Contractor assignments</li>
                    <li>• Financial records</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Measures */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">3. Security Measures</h2>
              <p className="text-muted-foreground mb-4">We implement appropriate technical and organizational measures to protect personal data:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Encryption at rest (AES-256)',
                  'Encryption in transit (TLS 1.3)',
                  'Role-based access controls',
                  'Secure authentication (bcrypt, 2FA)',
                  'Audit logging of all access',
                  'Regular security updates',
                  'Access limited to authorized personnel',
                  'Secure cloud infrastructure'
                ].map((measure, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{measure}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sub-processors */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">4. Sub-processors</h2>
              <p className="text-muted-foreground mb-4">We use the following sub-processors to provide our services:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Sub-processor</th>
                      <th className="text-left py-2 font-medium">Purpose</th>
                      <th className="text-left py-2 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="py-2">MongoDB Atlas</td>
                      <td className="py-2">Database hosting</td>
                      <td className="py-2">USA</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Stripe</td>
                      <td className="py-2">Payment processing</td>
                      <td className="py-2">USA</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Mailchimp/Mandrill</td>
                      <td className="py-2">Email delivery</td>
                      <td className="py-2">USA</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">OpenAI</td>
                      <td className="py-2">AI features (insights)</td>
                      <td className="py-2">USA</td>
                    </tr>
                    <tr>
                      <td className="py-2">Cloud hosting provider</td>
                      <td className="py-2">Application hosting</td>
                      <td className="py-2">USA</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Data Subject Rights */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">5. Data Subject Rights</h2>
              <p className="text-muted-foreground mb-4">
                We assist you in responding to data subject requests. Data subjects (your tenants) have the right to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Access</strong> - Request a copy of their personal data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Rectification</strong> - Request correction of inaccurate data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Erasure</strong> - Request deletion of their data ("right to be forgotten")</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Portability</strong> - Request data export in a machine-readable format</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Restriction</strong> - Request limitation of processing</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                As the data controller, you are responsible for responding to these requests. We provide tools within the platform to help you comply.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                6. Data Retention
              </h2>
              <p className="text-muted-foreground mb-4">
                We retain personal data only for as long as necessary to provide our services or as required by law:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Active account data:</strong> Retained while your account is active</li>
                <li>• <strong>After account termination:</strong> Deleted within 90 days, unless legally required to retain</li>
                <li>• <strong>Backups:</strong> Automatically purged within 30 days of deletion</li>
                <li>• <strong>Audit logs:</strong> Retained for 12 months for security purposes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Breach */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">7. Data Breach Notification</h2>
              <p className="text-muted-foreground">
                In the event of a personal data breach, we will notify you without undue delay (and in any event within 72 hours) after becoming aware of the breach. The notification will include:
              </p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                <li>• Nature of the breach and categories of data affected</li>
                <li>• Approximate number of data subjects affected</li>
                <li>• Likely consequences of the breach</li>
                <li>• Measures taken or proposed to address the breach</li>
              </ul>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                8. International Data Transfers
              </h2>
              <p className="text-muted-foreground">
                Data is primarily processed and stored in the United States. For transfers from the EU/EEA, we rely on:
              </p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                <li>• Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>• Data Processing Agreements with all sub-processors</li>
                <li>• Appropriate safeguards as required by applicable law</li>
              </ul>
            </CardContent>
          </Card>

          {/* Request Full DPA */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Request Full DPA Document
              </h2>
              <p className="text-muted-foreground mb-4">
                Enterprise customers can request our complete, legally binding Data Processing Agreement for review and execution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="mailto:legal@mypropops.com?subject=DPA Request">
                  <Button>
                    <Mail className="w-4 h-4 mr-2" />
                    Request Full DPA
                  </Button>
                </a>
                <a href="mailto:security@mypropops.com?subject=Security Questions">
                  <Button variant="outline">
                    Contact Security Team
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">MyPropOps</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/security" className="hover:text-foreground">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DPA;
