import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { 
  Search, 
  Building2, 
  Users, 
  ClipboardCheck, 
  Wrench, 
  FileText, 
  CreditCard,
  Bell,
  Shield,
  UserCog,
  Home,
  Key,
  Calendar,
  BarChart3,
  MessageSquare,
  HelpCircle,
  PlayCircle,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen },
    { id: 'getting-started', name: 'Getting Started', icon: PlayCircle },
    { id: 'properties', name: 'Properties & Units', icon: Building2 },
    { id: 'tenants', name: 'Tenants', icon: Users },
    { id: 'inspections', name: 'Inspections', icon: ClipboardCheck },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'billing', name: 'Billing & Plans', icon: CreditCard },
    { id: 'team', name: 'Team Management', icon: UserCog },
    { id: 'tenant-portal', name: 'Tenant Portal', icon: Home },
    { id: 'contractor-portal', name: 'Contractor Portal', icon: Key },
  ];

  const faqs = [
    // Getting Started
    {
      category: 'getting-started',
      question: 'How do I get started with MyPropOps?',
      answer: `<p>Welcome to MyPropOps! Here's how to get started:</p>
        <ol>
          <li><strong>Create your account</strong> - Sign up with your email and create a secure password.</li>
          <li><strong>Set up your organization</strong> - Enter your company name and details.</li>
          <li><strong>Add your first property</strong> - Go to Properties → Add Property and enter the property address and details.</li>
          <li><strong>Add units</strong> - For each property, add the individual units (apartments, houses, etc.).</li>
          <li><strong>Add tenants</strong> - Link tenants to their respective units with lease information.</li>
        </ol>
        <p>That's it! You're now ready to manage your properties efficiently.</p>`
    },
    {
      category: 'getting-started',
      question: 'What are the different user roles in MyPropOps?',
      answer: `<p>MyPropOps has four main user roles:</p>
        <ul>
          <li><strong>Admin</strong> - Full access to all features, can manage team members, billing, and organization settings.</li>
          <li><strong>Manager</strong> - Can manage properties, tenants, inspections, and maintenance. Cannot access billing or invite new admins.</li>
          <li><strong>Staff</strong> - Limited access for day-to-day operations like inspections and maintenance tracking.</li>
          <li><strong>Contractor</strong> - External users who can only view and update assigned maintenance jobs.</li>
        </ul>
        <p>Additionally, <strong>Tenants</strong> have their own separate portal to submit requests and view documents.</p>`
    },
    {
      category: 'getting-started',
      question: 'How do I invite team members to my organization?',
      answer: `<p>To invite team members:</p>
        <ol>
          <li>Go to <strong>Team Management</strong> from the sidebar.</li>
          <li>Click <strong>Invite Member</strong>.</li>
          <li>Enter their email address and select their role (Admin, Manager, or Staff).</li>
          <li>Click <strong>Send Invite</strong>.</li>
        </ol>
        <p>They'll receive an email with a link to join your organization. The invite expires after 7 days.</p>`
    },

    // Properties & Units
    {
      category: 'properties',
      question: 'How do I add a new property?',
      answer: `<p>To add a new property:</p>
        <ol>
          <li>Navigate to <strong>Properties</strong> in the sidebar.</li>
          <li>Click the <strong>Add Property</strong> button.</li>
          <li>Fill in the property details:
            <ul>
              <li>Property name</li>
              <li>Full address</li>
              <li>Property type (Single Family, Multi-Family, Commercial, etc.)</li>
              <li>Number of units</li>
            </ul>
          </li>
          <li>Click <strong>Save</strong> to create the property.</li>
        </ol>
        <p>Units will be automatically created based on the number you specify, or you can add them manually.</p>`
    },
    {
      category: 'properties',
      question: 'How do I add or edit units within a property?',
      answer: `<p>To manage units:</p>
        <ol>
          <li>Go to <strong>Properties</strong> and click on the property name.</li>
          <li>You'll see the <strong>Units</strong> tab showing all units.</li>
          <li>Click <strong>Add Unit</strong> to create a new unit, or click on an existing unit to edit it.</li>
          <li>For each unit, you can set:
            <ul>
              <li>Unit number/name</li>
              <li>Bedrooms and bathrooms</li>
              <li>Square footage</li>
              <li>Monthly rent</li>
              <li>Status (Vacant, Occupied, Maintenance)</li>
            </ul>
          </li>
        </ol>`
    },
    {
      category: 'properties',
      question: 'How do I track occupancy and vacancy rates?',
      answer: `<p>MyPropOps automatically calculates occupancy rates:</p>
        <ul>
          <li>View your <strong>Dashboard</strong> to see overall occupancy percentage.</li>
          <li>The <strong>Properties</strong> page shows occupancy for each property.</li>
          <li>Units are considered "occupied" when they have an active tenant with a current lease.</li>
          <li>For Pro plan users, the <strong>Analytics</strong> page provides detailed occupancy trends over time.</li>
        </ul>`
    },

    // Tenants
    {
      category: 'tenants',
      question: 'How do I add a new tenant?',
      answer: `<p>To add a tenant:</p>
        <ol>
          <li>Go to <strong>Tenants</strong> in the sidebar.</li>
          <li>Click <strong>Add Tenant</strong>.</li>
          <li>Fill in tenant information:
            <ul>
              <li>Full name and contact details</li>
              <li>Email address (required for portal access)</li>
              <li>Phone number</li>
              <li>Emergency contact</li>
            </ul>
          </li>
          <li>Assign them to a property and unit.</li>
          <li>Enter lease details (start date, end date, monthly rent).</li>
          <li>Click <strong>Save</strong>.</li>
        </ol>
        <p>The tenant will receive an email invitation to access their Tenant Portal.</p>`
    },
    {
      category: 'tenants',
      question: 'How do tenants access their portal?',
      answer: `<p>Tenants can access their portal in two ways:</p>
        <ol>
          <li><strong>Email Invitation</strong> - When you add a tenant, they receive an email with a link to set up their account.</li>
          <li><strong>Direct Link</strong> - Tenants can go to your site and click "For Tenants" to access the tenant login page.</li>
        </ol>
        <p>In the Tenant Portal, they can:</p>
        <ul>
          <li>Submit maintenance requests with photos</li>
          <li>View and upload documents</li>
          <li>See their lease information</li>
          <li>Communicate with management</li>
          <li>Track their application status (for new tenants)</li>
        </ul>`
    },
    {
      category: 'tenants',
      question: 'How do I track lease renewals?',
      answer: `<p>MyPropOps helps you stay on top of lease renewals:</p>
        <ul>
          <li>The <strong>Dashboard</strong> shows upcoming lease expirations.</li>
          <li>You'll receive <strong>notifications</strong> when leases are expiring within 60, 30, and 14 days.</li>
          <li>Go to <strong>Tenants</strong> and filter by "Lease Expiring Soon" to see all upcoming renewals.</li>
          <li>To renew a lease, edit the tenant record and update the lease end date.</li>
        </ul>`
    },

    // Inspections
    {
      category: 'inspections',
      question: 'How do I create and schedule an inspection?',
      answer: `<p>To schedule an inspection:</p>
        <ol>
          <li>Go to <strong>Inspections</strong> in the sidebar.</li>
          <li>Click <strong>Schedule Inspection</strong>.</li>
          <li>Select the inspection type:
            <ul>
              <li>Move-In Inspection</li>
              <li>Move-Out Inspection</li>
              <li>Routine Inspection</li>
              <li>Safety Inspection</li>
              <li>HQS Inspection (Housing Quality Standards)</li>
            </ul>
          </li>
          <li>Choose the property and unit.</li>
          <li>Set the date and time.</li>
          <li>Assign an inspector (yourself or a team member).</li>
          <li>Click <strong>Schedule</strong>.</li>
        </ol>`
    },
    {
      category: 'inspections',
      question: 'How do I complete an inspection checklist?',
      answer: `<p>To complete an inspection:</p>
        <ol>
          <li>Go to <strong>Inspections</strong> and find your scheduled inspection.</li>
          <li>Click <strong>Start Inspection</strong>.</li>
          <li>Go through each checklist item:
            <ul>
              <li>Mark items as Pass, Fail, or N/A</li>
              <li>Add notes for any issues</li>
              <li>Take photos directly or upload them</li>
            </ul>
          </li>
          <li>When complete, click <strong>Submit Inspection</strong>.</li>
        </ol>
        <p>The inspection report is automatically saved and can be shared with tenants or owners.</p>`
    },
    {
      category: 'inspections',
      question: 'How do I track HQS compliance for housing programs?',
      answer: `<p>For HQS (Housing Quality Standards) inspections:</p>
        <ul>
          <li>Select <strong>HQS Inspection</strong> when creating a new inspection.</li>
          <li>The checklist includes all required HQS items.</li>
          <li>Failed items are automatically flagged for follow-up.</li>
          <li>Track compliance status on the Dashboard and in the Inspections list.</li>
          <li>Generate HQS reports for housing authorities.</li>
        </ul>
        <p>MyPropOps helps ensure you stay compliant with housing program requirements.</p>`
    },

    // Maintenance
    {
      category: 'maintenance',
      question: 'How do I create a maintenance request?',
      answer: `<p>Maintenance requests can be created two ways:</p>
        <p><strong>By Property Managers:</strong></p>
        <ol>
          <li>Go to <strong>Maintenance</strong> in the sidebar.</li>
          <li>Click <strong>New Request</strong>.</li>
          <li>Select the property and unit.</li>
          <li>Choose the category (Plumbing, Electrical, HVAC, etc.).</li>
          <li>Describe the issue and set priority.</li>
          <li>Optionally assign to a contractor.</li>
        </ol>
        <p><strong>By Tenants:</strong></p>
        <p>Tenants can submit requests through their portal with photos and descriptions. These appear in your Maintenance queue automatically.</p>`
    },
    {
      category: 'maintenance',
      question: 'How do I assign work to contractors?',
      answer: `<p>To assign maintenance to a contractor:</p>
        <ol>
          <li>Open the maintenance request.</li>
          <li>Click <strong>Assign Contractor</strong>.</li>
          <li>Select from your contractor list or invite a new contractor.</li>
          <li>Set a due date if needed.</li>
          <li>Click <strong>Assign</strong>.</li>
        </ol>
        <p>The contractor will receive an email notification and can view the job in their Contractor Portal. They can update the status and add notes as they work on it.</p>`
    },
    {
      category: 'maintenance',
      question: 'How do contractors update job status?',
      answer: `<p>Contractors access their portal at the "For Contractors" link on your site. In their portal, they can:</p>
        <ul>
          <li>View all assigned jobs</li>
          <li>See job details, photos, and location</li>
          <li>Update status (In Progress, Completed, On Hold)</li>
          <li>Add notes and completion photos</li>
          <li>Message property managers</li>
        </ul>
        <p>You'll receive notifications when contractors update their jobs.</p>`
    },

    // Documents
    {
      category: 'documents',
      question: 'How do I upload and organize documents?',
      answer: `<p>To manage documents:</p>
        <ol>
          <li>Go to <strong>Documents</strong> in the sidebar.</li>
          <li>Click <strong>Upload Document</strong>.</li>
          <li>Select the file from your computer.</li>
          <li>Choose a category (Leases, Inspections, Contracts, etc.).</li>
          <li>Optionally link it to a property, unit, or tenant.</li>
          <li>Click <strong>Upload</strong>.</li>
        </ol>
        <p>Documents are securely stored and can be filtered by category, property, or tenant.</p>`
    },
    {
      category: 'documents',
      question: 'How do I share documents with tenants?',
      answer: `<p>To share documents with tenants:</p>
        <ol>
          <li>When uploading a document, check <strong>Share with Tenant</strong>.</li>
          <li>Or, open an existing document and click <strong>Share</strong>.</li>
          <li>Select which tenant(s) should have access.</li>
        </ol>
        <p>Shared documents appear in the tenant's portal under their Documents section. They can view and download, but cannot edit or delete.</p>`
    },
    {
      category: 'documents',
      question: 'What document types are supported?',
      answer: `<p>MyPropOps supports common document formats:</p>
        <ul>
          <li><strong>Documents:</strong> PDF, DOC, DOCX</li>
          <li><strong>Spreadsheets:</strong> XLS, XLSX, CSV</li>
          <li><strong>Images:</strong> JPG, PNG, GIF</li>
          <li><strong>Other:</strong> TXT, RTF</li>
        </ul>
        <p>Maximum file size is 10MB per document. For larger files, we recommend using cloud storage and linking to them.</p>`
    },

    // Billing & Plans
    {
      category: 'billing',
      question: 'What are the different pricing plans?',
      answer: `<p>MyPropOps offers three plans:</p>
        <p><strong>Free Plan:</strong></p>
        <ul>
          <li>Up to 2 properties</li>
          <li>Basic features</li>
          <li>Email support</li>
        </ul>
        <p><strong>Standard Plan ($39/month or $29/month annually):</strong></p>
        <ul>
          <li>Up to 15 properties</li>
          <li>All features including inspections and maintenance tracking</li>
          <li>Priority support</li>
        </ul>
        <p><strong>Pro Plan ($119/month or $99/month annually):</strong></p>
        <ul>
          <li>Unlimited properties</li>
          <li>AI-powered insights and analytics</li>
          <li>Advanced reporting</li>
          <li>API access</li>
          <li>Dedicated support</li>
        </ul>`
    },
    {
      category: 'billing',
      question: 'How do I upgrade my plan?',
      answer: `<p>To upgrade your plan:</p>
        <ol>
          <li>Go to <strong>Billing</strong> in the sidebar.</li>
          <li>View available plans and click <strong>Upgrade</strong> on your desired plan.</li>
          <li>Enter your payment information.</li>
          <li>Confirm your subscription.</li>
        </ol>
        <p>Your new features will be available immediately. You'll be charged the prorated amount for the remainder of your billing cycle.</p>`
    },
    {
      category: 'billing',
      question: 'How do I cancel my subscription?',
      answer: `<p>To cancel your subscription:</p>
        <ol>
          <li>Go to <strong>Billing</strong> in the sidebar.</li>
          <li>Click <strong>Manage Subscription</strong>.</li>
          <li>Select <strong>Cancel Subscription</strong>.</li>
        </ol>
        <p>Your subscription will remain active until the end of your current billing period. After that, your account will revert to the Free plan. Your data is never deleted - you can upgrade again anytime to regain access to all features.</p>`
    },

    // Team Management
    {
      category: 'team',
      question: 'How do I change a team member\'s role?',
      answer: `<p>To change a team member's role:</p>
        <ol>
          <li>Go to <strong>Team Management</strong>.</li>
          <li>Find the team member in the list.</li>
          <li>Click the <strong>Edit</strong> button (or three dots menu).</li>
          <li>Select the new role from the dropdown.</li>
          <li>Click <strong>Save</strong>.</li>
        </ol>
        <p>Note: Only Admins can change user roles. You cannot change your own role.</p>`
    },
    {
      category: 'team',
      question: 'How do I remove a team member?',
      answer: `<p>To remove a team member:</p>
        <ol>
          <li>Go to <strong>Team Management</strong>.</li>
          <li>Find the team member.</li>
          <li>Click <strong>Remove</strong> or the delete icon.</li>
          <li>Confirm the removal.</li>
        </ol>
        <p>Removed members immediately lose access to your organization. Their past activity (inspections, notes, etc.) is preserved in the system.</p>`
    },

    // Tenant Portal
    {
      category: 'tenant-portal',
      question: 'What can tenants do in their portal?',
      answer: `<p>The Tenant Portal allows tenants to:</p>
        <ul>
          <li><strong>Submit Maintenance Requests</strong> - Report issues with photos and descriptions.</li>
          <li><strong>Track Request Status</strong> - See updates on their maintenance requests.</li>
          <li><strong>View Documents</strong> - Access shared documents like lease agreements.</li>
          <li><strong>Upload Documents</strong> - Submit required documents for their file.</li>
          <li><strong>View Lease Info</strong> - See lease dates and rent amount.</li>
          <li><strong>Message Management</strong> - Send secure messages to property managers.</li>
          <li><strong>Educational Resources</strong> - Access guides about tenant rights and responsibilities.</li>
        </ul>`
    },
    {
      category: 'tenant-portal',
      question: 'How do I set up document requirements for tenants?',
      answer: `<p>To set up document requirements:</p>
        <ol>
          <li>Go to <strong>Settings</strong>.</li>
          <li>Find <strong>Tenant Document Requirements</strong>.</li>
          <li>Add required document types (ID, Income Verification, etc.).</li>
          <li>Set which are mandatory vs optional.</li>
        </ol>
        <p>Tenants will see a checklist in their portal showing which documents they need to upload. You'll be notified when they submit documents for review.</p>`
    },

    // Contractor Portal
    {
      category: 'contractor-portal',
      question: 'How do I add a contractor to my system?',
      answer: `<p>To add a contractor:</p>
        <ol>
          <li>Go to <strong>Maintenance</strong> and open any request.</li>
          <li>Click <strong>Assign Contractor</strong>.</li>
          <li>Click <strong>Add New Contractor</strong>.</li>
          <li>Enter their name, email, phone, and specialty.</li>
          <li>Click <strong>Save</strong>.</li>
        </ol>
        <p>The contractor will receive an email to set up their account. They can then log in to view and manage assigned jobs.</p>`
    },
    {
      category: 'contractor-portal',
      question: 'Can contractors see tenant contact information?',
      answer: `<p>For privacy and security:</p>
        <ul>
          <li>Contractors can see the <strong>property address</strong> and <strong>unit number</strong>.</li>
          <li>They can see the <strong>issue description</strong> and any <strong>photos</strong>.</li>
          <li>They <strong>cannot</strong> see tenant personal information (name, phone, email).</li>
          <li>Communication between contractors and tenants goes through the messaging system.</li>
        </ul>
        <p>This protects tenant privacy while giving contractors the information they need to do their job.</p>`
    },
  ];

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Help Center</h1>
              <p className="text-muted-foreground">Everything you need to know about using MyPropOps</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mt-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-4">
              <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Categories</h2>
              <nav className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = category.id === 'all' 
                    ? faqs.length 
                    : faqs.filter(f => f.category === category.id).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{category.name}</span>
                      </span>
                      <Badge variant={selectedCategory === category.id ? 'secondary' : 'outline'} className="text-xs">
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Links */}
              <div className="mt-8 pt-8 border-t">
                <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Quick Links</h2>
                <div className="space-y-2">
                  <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronRight className="w-4 h-4" />
                    Manager Login
                  </Link>
                  <Link to="/tenant-portal/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronRight className="w-4 h-4" />
                    Tenant Portal
                  </Link>
                  <Link to="/contractor/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronRight className="w-4 h-4" />
                    Contractor Portal
                  </Link>
                  <a href="mailto:support@mypropops.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronRight className="w-4 h-4" />
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - FAQs */}
          <div className="flex-1">
            {searchQuery && (
              <p className="text-sm text-muted-foreground mb-4">
                {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            )}

            {filteredFaqs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or browse by category.
                  </p>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="border rounded-lg px-4 data-[state=open]:bg-muted/30"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5 text-xs flex-shrink-0">
                          {categories.find(c => c.id === faq.category)?.name || faq.category}
                        </Badge>
                        <span className="font-medium">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert pl-[72px] prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            {/* Still need help? */}
            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardContent className="py-8 text-center">
                <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-4">
                  Our support team is here to help you get the most out of MyPropOps.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild>
                    <a href="mailto:support@mypropops.com">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Support
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/register">
                      Start Free Trial
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
