import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, UserCheck, Globe } from 'lucide-react';

const PrivacyPolicy = () => {
  const effectiveDate = "February 21, 2026";
  const companyName = "MyPropOps";
  const companyLegal = "MyPropOps, Inc.";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to {companyName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold">Privacy</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Shield className="w-4 h-4" />
              Your Privacy Matters
            </div>
            <h1 className="text-4xl font-bold font-heading">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Effective Date: {effectiveDate}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Secure by Design</h3>
              <p className="text-sm text-muted-foreground">Your data is encrypted at rest and in transit</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <Eye className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Transparent</h3>
              <p className="text-sm text-muted-foreground">We clearly explain how we use your data</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <UserCheck className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Your Control</h3>
              <p className="text-sm text-muted-foreground">You can access, export, or delete your data</p>
            </div>
          </div>

          {/* Privacy Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            
            {/* Introduction */}
            <section className="space-y-4">
              <p className="text-lg text-muted-foreground">
                At {companyName}, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our property management platform.
              </p>
            </section>

            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                Information We Collect
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Account Information</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Name, email address, and contact information</li>
                    <li>Company/organization name and details</li>
                    <li>Billing information and payment details (processed securely via Stripe)</li>
                    <li>Account preferences and settings</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Property & Tenant Data</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Property addresses and unit information</li>
                    <li>Tenant names, contact details, and lease information</li>
                    <li>Maintenance requests and inspection records</li>
                    <li>Documents you upload to the platform</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Usage Information</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Log data (IP address, browser type, pages visited)</li>
                    <li>Device information and identifiers</li>
                    <li>Feature usage and interaction data</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                How We Use Your Information
              </h2>
              <div className="text-muted-foreground">
                <p className="mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Provide the Service:</strong> Operate, maintain, and deliver the features and functionality of {companyName}</li>
                  <li><strong>Process Payments:</strong> Handle subscription billing and payment processing</li>
                  <li><strong>Communicate:</strong> Send service updates, security alerts, and support messages</li>
                  <li><strong>Improve:</strong> Analyze usage patterns to enhance our platform</li>
                  <li><strong>Comply:</strong> Meet legal obligations and enforce our terms</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                Information Sharing
              </h2>
              <div className="text-muted-foreground">
                <p className="mb-4">We do not sell your personal information. We may share data with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Providers:</strong> Third parties who help us operate the Service (e.g., Stripe for payments, cloud hosting providers)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary" />
                Data Security
              </h2>
              <div className="text-muted-foreground">
                <p className="mb-4">We implement industry-standard security measures including:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Encryption</h4>
                    <p className="text-sm">All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</p>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Access Controls</h4>
                    <p className="text-sm">Strict access controls and authentication requirements</p>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Monitoring</h4>
                    <p className="text-sm">Continuous security monitoring and threat detection</p>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Compliance</h4>
                    <p className="text-sm">Regular security audits and compliance assessments</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-primary" />
                Your Rights
              </h2>
              <div className="text-muted-foreground">
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correct:</strong> Update inaccurate or incomplete information</li>
                  <li><strong>Delete:</strong> Request deletion of your personal data</li>
                  <li><strong>Export:</strong> Receive your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                </ul>
                <p className="mt-4">To exercise these rights, contact us at privacy@mypropops.com</p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Cookies and Tracking
              </h2>
              <div className="text-muted-foreground">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Keep you logged in</li>
                  <li>Remember your preferences</li>
                  <li>Analyze how our Service is used</li>
                  <li>Improve user experience</li>
                </ul>
                <p className="mt-4">You can control cookies through your browser settings.</p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading">Data Retention</h2>
              <div className="text-muted-foreground">
                <p>We retain your data for as long as your account is active or as needed to provide the Service. After account termination, we retain data for up to 90 days before deletion, unless legally required to retain it longer.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading">Children's Privacy</h2>
              <div className="text-muted-foreground">
                <p>The Service is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading">Changes to This Policy</h2>
              <div className="text-muted-foreground">
                <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through the Service.</p>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4 pt-8 border-t">
              <h2 className="text-2xl font-bold font-heading">Contact Us</h2>
              <div className="text-muted-foreground">
                <p>For privacy-related questions or concerns:</p>
                <div className="mt-4 bg-card border rounded-lg p-4">
                  <p className="font-semibold text-foreground">{companyLegal}</p>
                  <p>Privacy Team</p>
                  <p>Email: privacy@mypropops.com</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 {companyLegal}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
