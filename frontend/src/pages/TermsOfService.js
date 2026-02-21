import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Scale, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

const TermsOfService = () => {
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
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold">Legal</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Scale className="w-4 h-4" />
              Legal Agreement
            </div>
            <h1 className="text-4xl font-bold font-heading">Terms of Service</h1>
            <p className="text-muted-foreground">
              Effective Date: {effectiveDate}
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Important Notice</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Please read these Terms of Service carefully before using {companyName}. By accessing or using our Service, 
                  you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
                </p>
              </div>
            </div>
          </div>

          {/* Terms Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">1</span>
                Definitions and Interpretation
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <p><strong>"Service"</strong> refers to the {companyName} cloud-based property management software platform, including all features, functionality, and related services provided through our website and applications.</p>
                <p><strong>"Software"</strong> refers to the proprietary software application, including all source code, object code, algorithms, user interfaces, APIs, documentation, and related intellectual property owned by {companyLegal}.</p>
                <p><strong>"Subscription"</strong> refers to your paid or free-tier access to use the Service under a limited, non-exclusive, non-transferable license.</p>
                <p><strong>"User," "You," or "Your"</strong> refers to the individual or entity accessing or using the Service.</p>
                <p><strong>"Content"</strong> refers to any data, text, files, documents, images, or other materials uploaded, submitted, or transmitted through the Service.</p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">2</span>
                Software License Grant
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <p>Subject to your compliance with these Terms and payment of applicable fees, {companyLegal} grants you a:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Limited</strong> – The license is restricted to the specific use cases described herein</li>
                  <li><strong>Non-exclusive</strong> – We may grant similar licenses to other users</li>
                  <li><strong>Non-transferable</strong> – You may not transfer, assign, or sublicense your rights</li>
                  <li><strong>Revocable</strong> – We may terminate your license for breach of these Terms</li>
                  <li><strong>Subscription-based</strong> – Your license is valid only during your active subscription period</li>
                </ul>
                <p>This license permits you to access and use the Service solely for your internal business purposes related to property management operations.</p>
                
                <div className="bg-card border rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">License Restrictions</h4>
                  <p className="text-sm">You expressly agree NOT to:</p>
                  <ul className="list-disc pl-6 text-sm mt-2 space-y-1">
                    <li>Copy, modify, or create derivative works of the Software</li>
                    <li>Reverse engineer, decompile, or disassemble the Software</li>
                    <li>Rent, lease, lend, sell, or sublicense the Software</li>
                    <li>Remove or alter any proprietary notices or labels</li>
                    <li>Use the Software to develop competing products</li>
                    <li>Access the Software to build a similar or competitive service</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">3</span>
                Intellectual Property Rights
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Ownership Statement
                  </h4>
                  <p className="text-sm">
                    {companyLegal} and its licensors own all right, title, and interest in and to the Service and Software, 
                    including all intellectual property rights therein. The Service is protected by copyright, trademark, 
                    patent, trade secret, and other intellectual property laws.
                  </p>
                </div>
                
                <p><strong>3.1 {companyName} Property.</strong> The following are the exclusive property of {companyLegal}:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>All software code (source and object), algorithms, and technical specifications</li>
                  <li>User interface designs, layouts, and visual elements</li>
                  <li>The {companyName} name, logo, and all related trademarks</li>
                  <li>Documentation, training materials, and help content</li>
                  <li>APIs, integrations, and system architectures</li>
                  <li>Any improvements, modifications, or derivatives of the above</li>
                </ul>
                
                <p><strong>3.2 Your Content.</strong> You retain ownership of any Content you upload to the Service. By uploading Content, you grant {companyLegal} a limited license to host, store, and display your Content solely for the purpose of providing the Service to you.</p>
                
                <p><strong>3.3 Feedback.</strong> Any suggestions, ideas, or feedback you provide about the Service may be used by {companyLegal} without obligation to you.</p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">4</span>
                Subscription Plans and Payment
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <p><strong>4.1 Subscription Tiers.</strong> The Service is offered under the following subscription models:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Free Tier:</strong> Limited functionality with usage restrictions (2 properties, 5 units)</li>
                  <li><strong>Standard Plan:</strong> Enhanced features for growing property managers</li>
                  <li><strong>Pro Plan:</strong> Full-featured access for professional property management</li>
                </ul>
                
                <p><strong>4.2 Billing.</strong> Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as explicitly stated in our refund policy.</p>
                
                <p><strong>4.3 Automatic Renewal.</strong> Subscriptions automatically renew unless cancelled before the end of the current billing period.</p>
                
                <p><strong>4.4 Price Changes.</strong> We reserve the right to modify pricing with 30 days' notice to existing subscribers.</p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">5</span>
                Service Level and Availability
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <p><strong>5.1 Service "As Is."</strong> The Service is provided on an "as is" and "as available" basis. We strive for high availability but do not guarantee uninterrupted access.</p>
                
                <p><strong>5.2 Maintenance.</strong> We may perform scheduled and emergency maintenance that temporarily affects Service availability. We will endeavor to provide advance notice when possible.</p>
                
                <p><strong>5.3 Support.</strong> Support levels vary by subscription tier. Pro Plan subscribers receive priority support.</p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">6</span>
                User Responsibilities
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <p>You agree to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide accurate registration information</li>
                  <li>Maintain the confidentiality of your account credentials</li>
                  <li>Use the Service in compliance with all applicable laws</li>
                  <li>Not use the Service for any unlawful or prohibited purpose</li>
                  <li>Not interfere with or disrupt the Service or its infrastructure</li>
                  <li>Not attempt to gain unauthorized access to any part of the Service</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">7</span>
                Limitation of Liability
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-sm uppercase font-semibold text-foreground mb-2">Important Limitation</p>
                  <p className="text-sm">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, {companyLegal.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, 
                    DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                  </p>
                </div>
                <p>Our total liability for any claims arising under these Terms shall not exceed the amount you paid us in the twelve (12) months preceding the claim.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">8</span>
                Termination
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <p><strong>8.1 By You.</strong> You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period.</p>
                
                <p><strong>8.2 By Us.</strong> We may suspend or terminate your access immediately if you breach these Terms, fail to pay fees, or engage in conduct that we determine is harmful to the Service or other users.</p>
                
                <p><strong>8.3 Effect of Termination.</strong> Upon termination, your license to use the Service ends immediately. You may request export of your data within 30 days of termination.</p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">9</span>
                Governing Law and Disputes
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <p>These Terms shall be governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions.</p>
                <p>Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">10</span>
                Changes to Terms
              </h2>
              <div className="pl-10 space-y-3 text-muted-foreground">
                <p>We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.</p>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4 pt-8 border-t">
              <h2 className="text-2xl font-bold font-heading">Contact Us</h2>
              <div className="text-muted-foreground">
                <p>If you have questions about these Terms, please contact us at:</p>
                <div className="mt-4 bg-card border rounded-lg p-4">
                  <p className="font-semibold text-foreground">{companyLegal}</p>
                  <p>Email: legal@mypropops.com</p>
                  <p>Address: [Your Business Address]</p>
                </div>
              </div>
            </section>

          </div>

          {/* Acceptance */}
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6 mt-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">Acceptance of Terms</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  By creating an account or using {companyName}, you acknowledge that you have read, understood, and agree 
                  to be bound by these Terms of Service and our Privacy Policy.
                </p>
              </div>
            </div>
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
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
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

export default TermsOfService;
