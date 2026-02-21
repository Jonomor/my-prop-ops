import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Building, ArrowLeft } from 'lucide-react';

const Terms = () => {
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

          <h1 className="text-4xl font-bold font-heading mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 21, 2026</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using MyPropOps ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                MyPropOps is a cloud-based property management platform that helps property managers and housing operators manage properties, tenants, inspections, and documents. The Service includes:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Property and unit management</li>
                <li>Tenant tracking and lease management</li>
                <li>Inspection scheduling and compliance tracking</li>
                <li>Document storage and organization</li>
                <li>Team collaboration features</li>
                <li>Notifications and reminders</li>
              </ul>
            </section>

            <section className="bg-blue-50 dark:bg-blue-950/30 -mx-4 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h2 className="text-2xl font-semibold font-heading mb-4 text-blue-900 dark:text-blue-100">3. Software License Grant</h2>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-4">
                <strong>IMPORTANT:</strong> MyPropOps is provided as a Software-as-a-Service (SaaS) subscription. You are granted a LICENSE to use the software, NOT ownership of the software itself.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-blue-900 dark:text-blue-100">3.1 License Grant</h3>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                Subject to your compliance with these Terms and payment of applicable fees, MyPropOps, Inc. grants you a <strong>limited, non-exclusive, non-transferable, revocable, subscription-based license</strong> to access and use the Service solely for your internal business purposes related to property management operations.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-blue-900 dark:text-blue-100">3.2 License Restrictions</h3>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-3">
                You expressly agree that you will NOT:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-blue-800 dark:text-blue-200">
                <li>Copy, modify, adapt, or create derivative works of the Software or Service</li>
                <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Software</li>
                <li>Rent, lease, lend, sell, redistribute, sublicense, or transfer the Software or access to the Service</li>
                <li>Remove, alter, or obscure any proprietary notices, labels, or marks on the Software</li>
                <li>Use the Software or Service to develop a competing product or service</li>
                <li>Access the Software or Service to build a similar or competitive product</li>
                <li>Use automated systems to access the Service in a manner that exceeds reasonable request volumes</li>
                <li>Share your account credentials or allow multiple users to access a single account</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-blue-900 dark:text-blue-100">3.3 Reservation of Rights</h3>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                All rights not expressly granted to you are reserved by MyPropOps, Inc. This license does not grant you any rights to use MyPropOps's trademarks, service marks, or trade dress.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">4. User Accounts</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Account Creation</h3>
              <p className="text-muted-foreground leading-relaxed">
                To use MyPropOps, you must create an account with accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Account Responsibilities</h3>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other breach of security.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Organizations</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you create or join an organization, you agree to the organization's internal policies and acknowledge that organization administrators may have access to your account activity within that organization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">5. Subscription Plans and Billing</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Free Plan</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Free plan is available at no cost with limitations on the number of properties (2) and units (5). The Free plan is provided "as is" without any service level guarantees.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Paid Plans</h3>
              <p className="text-muted-foreground leading-relaxed">
                Paid plans (Standard, Pro) are billed monthly or annually as selected at the time of purchase. Prices are subject to change with 30 days notice.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Billing</h3>
              <p className="text-muted-foreground leading-relaxed">
                By subscribing to a paid plan, you authorize us to charge your payment method on a recurring basis. You are responsible for providing accurate billing information and keeping it up to date.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Refunds</h3>
              <p className="text-muted-foreground leading-relaxed">
                We offer a 14-day money-back guarantee for first-time subscribers to paid plans. After 14 days, subscriptions are non-refundable. Annual subscriptions may be eligible for prorated refunds at our discretion.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.5 Cancellation</h3>
              <p className="text-muted-foreground leading-relaxed">
                You may cancel your subscription at any time. Upon cancellation, you will retain access to paid features until the end of your current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">6. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Collect or harvest user data without consent</li>
                <li>Send spam or unsolicited communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">6. Your Content</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Ownership</h3>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of all content you upload, submit, or create through the Service ("Your Content"). We do not claim ownership of Your Content.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.2 License</h3>
              <p className="text-muted-foreground leading-relaxed">
                By uploading Your Content, you grant us a limited license to store, process, and display Your Content solely for the purpose of providing the Service to you and your organization.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Responsibility</h3>
              <p className="text-muted-foreground leading-relaxed">
                You are solely responsible for Your Content and the consequences of uploading it. You represent that you have all necessary rights to upload Your Content and that it does not violate any third-party rights.
              </p>
            </section>

            <section className="bg-amber-50 dark:bg-amber-950/30 -mx-4 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
              <h2 className="text-2xl font-semibold font-heading mb-4 text-amber-900 dark:text-amber-100">8. Intellectual Property Rights</h2>
              
              <div className="bg-amber-100 dark:bg-amber-900/50 rounded-lg p-4 mb-4">
                <p className="text-amber-900 dark:text-amber-100 font-semibold text-sm">
                  OWNERSHIP NOTICE: MyPropOps, Inc. exclusively owns all intellectual property rights in and to the Service.
                </p>
              </div>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-amber-900 dark:text-amber-100">8.1 Our Intellectual Property</h3>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed mb-3">
                The following are the exclusive property of MyPropOps, Inc. and its licensors:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-amber-800 dark:text-amber-200">
                <li>All software code, including source code, object code, and compiled applications</li>
                <li>Algorithms, data structures, and technical specifications</li>
                <li>User interface designs, layouts, visual elements, and user experience flows</li>
                <li>The MyPropOps name, logo, tagline "#1 Property Management Software," and all related trademarks and service marks</li>
                <li>Documentation, training materials, help content, and marketing materials</li>
                <li>APIs, webhooks, integrations, and system architectures</li>
                <li>Any improvements, modifications, enhancements, or derivatives of the above</li>
                <li>All patents, patent applications, copyrights, trade secrets, and other intellectual property rights</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-amber-900 dark:text-amber-100">8.2 Protection of Intellectual Property</h3>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                The Service is protected by copyright, trademark, patent, trade secret, and other intellectual property laws of the United States and foreign countries. You acknowledge that the Service contains proprietary and confidential information that is protected by applicable intellectual property and other laws. Unauthorized copying, distribution, modification, public display, or public performance of the Service is strictly prohibited.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-amber-900 dark:text-amber-100">8.3 Trademark Notice</h3>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                "MyPropOps," the MyPropOps logo, "#1 Property Management Software," and all related names, logos, product and service names, designs, and slogans are trademarks of MyPropOps, Inc. You may not use such marks without our prior written permission. All other names, logos, product and service names, designs, and slogans are the trademarks of their respective owners.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-amber-900 dark:text-amber-100">8.4 Feedback</h3>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                Any suggestions, ideas, enhancement requests, feedback, or other information you provide regarding the Service ("Feedback") will be the sole and exclusive property of MyPropOps, Inc. You hereby assign all rights in Feedback to us, and we shall be entitled to unrestricted use of Feedback for any purpose without acknowledgment or compensation to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">8. Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which describes how we collect, use, and share information about you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You may request export of your data within 30 days of termination. After 30 days, we may delete your data in accordance with our data retention policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROPOPS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                IN NO EVENT SHALL OUR AGGREGATE LIABILITY EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100) OR THE AMOUNT YOU PAID US, IF ANY, IN THE PAST SIX MONTHS FOR THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">11. Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not warrant that the Service will be uninterrupted, secure, or error-free, or that any defects will be corrected.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in San Francisco, California, except that either party may seek injunctive relief in any court of competent jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-heading mb-4">14. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Email: legal@propops.com</li>
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

export default Terms;
