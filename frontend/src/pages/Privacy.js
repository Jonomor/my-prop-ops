import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Building, ArrowLeft } from 'lucide-react';

const Privacy = () => {
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

      {/* Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold font-heading mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 21, 2026</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                MyPropOps ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our property management platform and services.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By accessing or using MyPropOps, you agree to this Privacy Policy. If you do not agree with the terms of this policy, please do not access the application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Name and email address when you create an account</li>
                <li>Organization and role information</li>
                <li>Property details, tenant information, and inspection data you enter into the platform</li>
                <li>Documents you upload (leases, IDs, inspection reports)</li>
                <li>Payment information when you subscribe to paid plans</li>
                <li>Communications you send to us</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you access our platform, we automatically collect:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>IP address and device information</li>
                <li>Browser type and operating system</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Personalize and improve your experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">4. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li><strong>Within Your Organization:</strong> Other members of your organization can access shared data according to their role permissions</li>
                <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (hosting, analytics, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly agree to the sharing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You can request deletion of your account and associated data at any time by contacting us at privacy@propops.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">6. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>AES-256 encryption for data at rest and in transit</li>
                <li>Secure cloud infrastructure with SOC 2 compliance</li>
                <li>Regular security audits and penetration testing</li>
                <li>Role-based access controls</li>
                <li>Daily backups with geographic redundancy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Request a portable copy of your data</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, contact us at privacy@propops.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">8. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings. Essential cookies are required for the platform to function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                MyPropOps is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Email: privacy@propops.com</li>
                <li>Address: 123 Property Lane, Suite 100, San Francisco, CA 94105</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

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

export default Privacy;
