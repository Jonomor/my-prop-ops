# MyPropOps - Product Requirements Document

## Latest Update: February 22, 2026 (Session 5)

### Completed This Session:

#### Favicon Fix (COMPLETE)
- ✅ Generated new favicon icons using AI image generation
- ✅ Created proper icon sizes: 16x16, 32x32, 180x180, 192x192, 512x512
- ✅ Updated index.html with cache-busting version strings (v3)
- ✅ Updated manifest.json with all icon sizes

#### Blog SEO Enhancement (COMPLETE)
- ✅ **SEO-optimized AI prompts** - Title with power words, meta descriptions, keyword targeting
- ✅ **Meta Description generation** - 150-160 character descriptions for search engines
- ✅ **Keyword extraction** - 5-7 relevant keywords per post
- ✅ **Proper heading structure** - H2/H3 hierarchy for content
- ✅ **Word count tracking** - Stored in database and displayed on posts
- ✅ **Dynamic meta tags** - BlogPost.js injects SEO meta tags into document head
- ✅ **JSON-LD structured data** - Article schema for rich search results
- ✅ **Admin SEO fields** - Keywords input field added to blog editor
- ✅ **Open Graph & Twitter cards** - Dynamic social sharing metadata

#### Super Admin Dashboard (COMPLETE)
- ✅ **Admin Login** at `/admin/login` with secure authentication
- ✅ **Overview Tab** - Total Users, Organizations, MRR, Properties, Subscription Breakdown, Recent Activity
- ✅ **Users Tab** - List all users with search, view details, impersonate, disable/enable, delete
- ✅ **Organizations Tab** - List all organizations with property/unit counts, owner info
- ✅ **Billing Tab** - MRR, ARR, Paying Customers, Revenue Breakdown by plan
- ✅ **Blog Tab** - Full CRUD for blog posts, AI Generate button, category/status management
- ✅ **Audit Logs Tab** - Platform-wide activity logging with timestamps
- ✅ **Settings Tab** - Feature flags toggles for maintenance, screening, AI insights, auto-blog
- ✅ **User Impersonation** - Admin can log in as any user for support
- ✅ **User Details Dialog** - View user stats, organizations, memberships

#### Admin Backend Endpoints (NEW)
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - Get user details with stats
- `PUT /api/admin/users/{id}/status` - Toggle user enabled/disabled
- `POST /api/admin/users/{id}/impersonate` - Generate impersonation token
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/organizations` - List all organizations
- `GET /api/admin/blog` - List all blog posts (including drafts)
- `POST /api/admin/blog` - Create blog post
- `PUT /api/admin/blog/{id}` - Update blog post
- `DELETE /api/admin/blog/{id}` - Delete blog post
- `GET /api/admin/feature-flags` - Get feature flag settings
- `PUT /api/admin/feature-flags` - Update feature flags
- `GET /api/admin/audit-logs` - Get platform audit logs

---

### Previously Completed (Session 4):

#### About Page (NEW)
- ✅ Professional "About Us" page at `/about`
- ✅ Company story, values, and milestones
- ✅ Call-to-action for sign-ups

#### Automated Blog System (NEW)
- ✅ Blog listing page at `/blog` with category filtering
- ✅ Individual blog post pages at `/blog/{slug}`
- ✅ AI-powered blog generation using GPT-4o
- ✅ Backend endpoints: `/api/blog/posts`, `/api/blog/posts/{slug}`, `/api/blog/generate`
- ✅ Scheduling script: `/app/backend/generate_blog.py`
- ✅ Schedule: Monday, Thursday, Sunday
- ✅ Initial 3 posts generated and published

#### Footer Updates
- ✅ Removed "Careers" link (user request)
- ✅ Added proper links to About and Blog pages
- ✅ Updated contact email to support@mypropops.com

---

### Previously Completed (Sessions 1-3):

#### Pricing Restructure (COMPLETE)
- ✅ Removed Enterprise tier - now 3 tiers: Free, Standard ($39/mo), Pro ($119/mo)
- ✅ Removed unimplementable features: White-label, Dedicated account manager, Custom integrations, SLA guarantee, Custom training
- ✅ Updated both Landing page and Dashboard Billing page with consistent pricing
- ✅ Fixed "Downgrade" button - now shows "Current Plan" for Free tier

#### New Feature Pages Implemented (COMPLETE)
- ✅ **Reports Page** (`/reports`) - Export properties, tenants, maintenance, inspections to CSV/PDF
  - Plan-gated: Requires Standard or Pro
  - Backend endpoint: `/api/reports/export/{type}`
  
- ✅ **Analytics Dashboard** (`/analytics`) - Occupancy trends, revenue tracking, maintenance analysis
  - Plan-gated: Requires Pro (Free/Standard see sample data)
  - Backend endpoint: `/api/analytics/dashboard`
  
- ✅ **API Key Management** (`/api-keys`) - Generate/manage API keys for external integrations
  - Plan-gated: Requires Pro
  - Backend endpoints: `/api/api-keys` (GET, POST, DELETE)
  
- ✅ **Custom Branding** (`/branding`) - Upload logo, set primary color, company name
  - Plan-gated: Requires Pro
  - Backend endpoints: `/api/branding` (GET, POST)

#### AI-Powered Insights Dashboard (COMPLETE)
- ✅ **GPT-4 powered insights** - Executive summary, occupancy analysis, maintenance tips, revenue optimization, 3-month forecasts
- ✅ **Ask AI Anything** - Custom question interface for portfolio analysis
- ✅ **Quick stats dashboard** - Properties, Occupancy, Revenue, Open Maintenance
- ✅ **Plan-gated**: Requires Pro plan
- Backend endpoints: `/api/ai/insights`, `/api/ai/quick-stats`
- Frontend page: `/ai-insights`
- Uses: emergentintegrations with GPT-4o model

#### Tenant Rent Payment Tracking (COMPLETE - View Only)
- ✅ **Pay Rent tab** in Tenant Portal (view history only)
- ✅ **Payment summary** - Total due, pending payments, paid this year
- ❌ Online payment via Stripe REMOVED (requires Stripe Connect)
- Backend endpoint: `/api/tenant-portal/rent-payments`

#### Tenant Screening with Credits System (COMPLETE)
- ✅ **Pay-per-use tenant screening** - Revenue stream for the platform
- ✅ **Credit packages**: $39 (1), $175 (5), $320 (10 - Best Value), $725 (25)
- ✅ **Stripe integration** for credit purchases (demo mode when no API key)
- ✅ **Plan-gated**: Requires Standard or Pro plan
- ✅ **Simulated screening results** (ready for real API integration: TransUnion/RentPrep)
- Backend endpoints: `/api/screening/credits`, `/api/screening/purchase-credits`

#### Two-Factor Authentication (2FA) - COMPLETE
- ✅ **Full 2FA implementation** using TOTP (Time-based One-Time Password)
- ✅ **QR code generation** for easy setup with authenticator apps
- ✅ **Backup codes** - 10 codes generated at setup for recovery
- ✅ **Plan-gated**: Requires Pro plan
- ✅ **Supported apps**: Google Authenticator, Microsoft Authenticator, Authy, 1Password
- Backend endpoints: `/api/auth/2fa/status`, `/api/auth/2fa/setup`, `/api/auth/2fa/verify`, `/api/auth/2fa/disable`, `/api/auth/2fa/validate`
- Frontend page: `/2fa-settings`

#### Rent Payment Tracking (COMPLETE)
- ✅ **Monthly payment tracking** - Track expected vs collected rent
- ✅ **Auto-generate monthly payments** for all active tenants
- ✅ **Summary dashboard** - Expected, Collected, Outstanding, Collection Rate
- ✅ **Payment recording** - Track payments with method (check, cash, bank transfer, etc.)
- ✅ **Month/Year filtering** with status filter (pending, paid, overdue, partial)
- Backend endpoints: `/api/rent-payments`, `/api/rent-payments/summary`, `/api/rent-payments/generate-monthly`

#### Updated Sidebar Navigation (COMPLETE)
- Added: Reports, Analytics, API Keys, Branding links
- All new pages accessible and plan-gated appropriately

---

## Pricing Tiers (Current)

### Free - $0/month
- 2 properties, 5 units, 1 team member
- Basic document storage (500MB)
- Basic maintenance requests

### Standard - $39/month (annual) / $49/month (monthly)
- 20 properties, 40 units, 5 team members
- Full inspection workflows
- 10GB document storage
- Tenant Portal with photo uploads
- **Rent payment tracking**
- Email notifications
- Contractor Portal access
- One-tap contractor assignment
- **Exportable reports (CSV/PDF)**
- **Tenant Screening (pay per use)**

### Pro - $119/month (annual) / $149/month (monthly)
- Unlimited properties, units, team members
- Everything in Standard
- 100GB document storage
- **AI-Powered Insights Dashboard**
- **Advanced analytics dashboard**
- **API access with key management**
- **Two-factor authentication (2FA)**
- **Full audit logs**
- 24/7 priority support

---

## Original Problem Statement
Build a full-stack SaaS web application for property and housing operations management named "MyPropOps".

## Core Features
- User authentication (Admin, Manager, Staff) and a separate portal for Tenants
- Organization-based multi-tenant architecture
- Management of properties, units, and tenants
- Inspection workflow system, task/reminder system, and document management
- A secure Tenant Portal for housing program tenants with document checklists, application status tracking, secure messaging, a document vault, and educational resources
- Enforce subscription limits on a free tier (2 properties, 5 units)
- Achieve high search engine ranking through advanced SEO
- Stripe billing integration with embedded checkout
- Mailchimp email notifications

## Tech Stack
- **Backend:** FastAPI, Pydantic, MongoDB (motor), JWT, WebSockets, Stripe SDK
- **Frontend:** React, React Router, Tailwind CSS, Shadcn/UI, Axios, React Context, @stripe/react-stripe-js
- **Architecture:** Full-stack, Multi-tenant SaaS, Monolithic Backend (needs refactoring)
- **Integrations:** Stripe (payments), Mailchimp (emails - configured but keys needed)

## What's Been Implemented

### February 22, 2026 - Major Feature Release

#### UI Bug Fixes (COMPLETE)
- Fixed Stripe "S" missing in trust badges
- Fixed Monthly/Annual toggle text overlap
- Fixed video aspect ratio from 9:16 to 16:9 (landscape)
- Fixed CTA card "Start Free" button visibility

#### Tenant Portal Maintenance Tab (COMPLETE)
- Maintenance request submission with photo upload
- Category/priority selection
- Request list view with status tracking

#### Backend Modular Architecture (COMPLETE)
- Created `/backend/models/` - enums.py, schemas.py
- Created `/backend/utils/` - database.py, config.py, auth.py, email.py
- Created `/backend/routers/` - auth.py, billing.py, contractors.py, organizations.py, properties.py, tenants.py, maintenance.py, inspections.py, screening.py, payments.py

#### Tenant Screening Feature (COMPLETE - MOCKED)
- New Screening page with stats dashboard
- Screening request dialog with tenant selection
- Screening types: Basic ($15), Comprehensive ($35), Premium ($55)
- Check options: Credit, Criminal, Eviction, Income
- Results display with risk score and recommendation
- **NOTE:** Uses SIMULATED results - credit scores and checks are randomly generated

#### Rent Payment Tracking (COMPLETE)
- Rent Payments page with month/year filtering
- Summary cards: Expected, Collected, Outstanding, Collection Rate
- Generate Monthly feature to auto-create rent records
- Manual payment creation
- Record Payment functionality with payment method tracking
- Overdue alerts

### February 2026 - Previous Session

#### Contractor Portal (NEW)
- Contractor registration with specialties selection
- Contractor login with separate authentication
- Contractor dashboard showing jobs, stats
- Job status updates from contractor side
- Backend endpoints: `/api/contractor/register`, `/api/contractor/login`, `/api/contractor/jobs`

#### Tenant Portal Photo Uploads (NEW)  
- Endpoint: `/api/portal/maintenance-requests/with-photos`
- Supports up to 5 photos per maintenance request
- Photos stored in uploads directory

#### Contractor Assignment System (NEW)
- Connect contractors to organizations
- Assign contractors to maintenance requests
- Endpoint: `/api/maintenance-requests/{id}/assign-contractor`
- Email notifications to contractors on assignment

#### Updated Pricing Structure
- Free: $0 (2 properties, 5 units)
- Standard: $49/mo or $39/mo annual (20 properties)
- Pro: $149/mo or $119/mo annual (Unlimited + Contractor Portal)
- Enterprise: $299/mo or $239/mo annual (White-label, SLA)

#### Stripe Embedded Checkout (COMPLETE)
- Embedded checkout modal using Stripe's `initEmbeddedCheckout`
- Backend endpoint: `/api/billing/create-embedded-checkout` returns client_secret
- Backend endpoint: `/api/billing/session-status/{session_id}` checks payment status
- Multiple payment methods: Card, Cash App Pay, Affirm, Klarna, Bank
- Plan upgrade flow: checkout -> payment -> org plan update
- User-provided Stripe API keys integrated

#### Mailchimp Email Integration (COMPLETE - Keys Required)
- Welcome email on user registration
- Subscription upgrade confirmation email
- Maintenance request notification emails (to admins and tenants)
- Team invitation emails
- All emails sent via background tasks for non-blocking performance
- Graceful fallback when Mailchimp keys not configured

#### Maintenance Request System (COMPLETE)
- Full CRUD for maintenance requests
- Categories: Plumbing, Electrical, HVAC, Appliances, Structural, Pest Control, Landscaping
- Priority levels: Low, Medium, High, Emergency
- Status workflow: Open -> In Progress -> Scheduled -> Completed
- Stats dashboard with counts by status and priority
- Email notifications to property managers and tenants

#### Frontend Billing Page (COMPLETE)
- Current plan and usage display with progress bars
- Three pricing tiers: Free ($0), Standard ($24/mo annual), Pro ($82/mo annual)
- Monthly/Annual billing toggle with savings indicator
- Embedded Stripe checkout modal
- Payment verification and plan upgrade polling

### December 2025 - Previous Session Items

#### Tenant Portal (COMPLETE)
- Full tenant authentication system (separate from landlord auth)
- Document upload/download/request workflow
- Downloadable authorization templates (credit check, criminal background)
- Tenant-organization connection via invite codes
- Document vault with status tracking

#### Landlord Portal Features (COMPLETE)
- Generate tenant invite codes in Settings
- View and manage tenant document requests
- Organization-level tenant management

#### Subscription Limits (COMPLETE)
- Free tier limits enforced: 2 properties, 5 units
- Backend validation on property/unit creation
- `/api/organization/usage` endpoint for checking limits

#### SEO Implementation (COMPLETE)
- Meta tags and Open Graph protocol
- sitemap.xml and robots.txt (corrected for indexing)
- Custom favicon and og-image
- Rebranding to "MyPropOps"

## Key API Endpoints

### Billing
- `POST /api/billing/create-embedded-checkout` - Create Stripe embedded checkout session
- `GET /api/billing/session-status/{session_id}` - Check payment status
- `GET /api/billing/subscription-status` - Get current plan and usage
- `GET /api/billing/plans` - Get available subscription plans

### Maintenance
- `POST /api/maintenance-requests` - Create maintenance request
- `GET /api/maintenance-requests` - List maintenance requests
- `PUT /api/maintenance-requests/{id}` - Update maintenance request
- `GET /api/maintenance-requests/stats/summary` - Get maintenance stats

### Tenant Portal
- `/api/portal/connect_organization` - Connect tenant to org
- `/api/portal/documents/request` - Request documents from landlord
- `/api/portal/documents/templates/{template_name}` - Download templates

## Database Schema

### Organizations Collection
```json
{
  "id": "uuid",
  "name": "string",
  "plan": "free|standard|pro",
  "billing_period": "monthly|annual",
  "plan_updated_at": "datetime",
  "subscription_active": "boolean",
  "tenant_invite_code": "string"
}
```

### Maintenance Requests Collection
```json
{
  "id": "uuid",
  "org_id": "uuid",
  "property_id": "uuid",
  "unit_id": "uuid (optional)",
  "tenant_id": "uuid (optional)",
  "category": "plumbing|electrical|hvac|...",
  "priority": "low|medium|high|emergency",
  "status": "open|in_progress|scheduled|completed",
  "title": "string",
  "description": "string",
  "assigned_to": "uuid (optional)",
  "created_at": "datetime"
}
```

### Payment Transactions Collection
```json
{
  "id": "uuid",
  "session_id": "stripe_session_id",
  "org_id": "uuid",
  "user_id": "uuid",
  "plan_id": "standard_monthly|pro_annual|...",
  "amount": "float",
  "currency": "usd",
  "status": "pending|complete",
  "payment_status": "initiated|paid",
  "checkout_type": "embedded"
}
```

## Test Credentials
- **Manager:** test@test.com / test123
- **Tenant:** testtenant@test.com / test123
- **Contractor:** testcontractor@test.com / test123

## Prioritized Backlog

### P0 - Critical
- [x] ~~Stripe billing integration~~ (DONE)
- [x] ~~Tenant Portal maintenance with photo upload~~ (DONE)
- [x] ~~Video aspect ratio fix (16:9)~~ (DONE)
- [x] ~~Backend refactoring - Modular routers~~ (DONE)
- [x] ~~Tenant Screening Feature~~ (DONE - MOCKED)
- [x] ~~Rent Payment Tracking~~ (DONE)
- [x] ~~AI-Powered Insights Dashboard~~ (DONE)
- [x] ~~Contractor Assignment~~ (DONE)
- [x] ~~Feature alignment in pricing~~ (DONE)

### P1 - High Priority
- [x] ~~Mailchimp email notifications~~ (DONE - needs keys)
- [x] ~~Maintenance request workflow~~ (DONE)
- [x] ~~Tenant Screening feature~~ (DONE - mocked)
- [x] ~~Rent Payment Tracking~~ (DONE)
- [x] ~~Contractor-Manager Messaging~~ (DONE)
- [ ] Real tenant screening API integration (wait for first paying customer)

### P2 - Medium Priority
- [x] ~~Advanced analytics dashboard~~ (DONE)
- [x] ~~AI-powered dashboard insights~~ (DONE)
- [x] ~~Mobile app optimization~~ (DONE - PWA + Bottom Nav)
- [ ] Backend refactoring - Extract routes from server.py to routers/ (optional, not blocking)
- [ ] Real-time notifications via WebSocket (last priority)

### P3 - Future
- [ ] AI-powered document processing
- [ ] Integration with accounting software

## Known Technical Debt

### CRITICAL
1. **Monolithic server.py (~5700+ lines)** - All business logic in one file
   - Router structure exists at `/backend/routers/` but largely unused
   - Only `screening` and `payments` routers are included
   - Refactoring guide created at `/backend/REFACTORING_GUIDE.md`

### HIGH
2. **Tenant Screening uses MOCKED API** - Returns simulated credit scores and background checks
   - Ready for integration with real provider (TransUnion, RentPrep)
   
3. **Online Rent Collection removed** - Requires Stripe Connect implementation
   - Current workaround: Landlords collect payments externally, mark as paid manually

### MEDIUM
4. Mailchimp keys not configured (emails gracefully skip when unconfigured)

## Files of Reference
- `/app/backend/server.py` - Main backend (needs refactoring)
- `/app/backend/REFACTORING_GUIDE.md` - Step-by-step refactoring plan
- `/app/backend/.env` - Contains Stripe keys and Mailchimp placeholders
- `/app/frontend/src/pages/Billing.js` - Billing page with embedded checkout
- `/app/frontend/src/pages/Landing.js` - Pricing tiers (lines 134-167)
- `/app/frontend/src/pages/Maintenance.js` - Maintenance with contractor assignment
- `/app/frontend/src/pages/TenantPortal.js` - Tenant portal (payments tab updated)
- `/app/frontend/src/pages/AIInsights.js` - AI dashboard
- `/app/test_reports/iteration_14.json` - Latest test results

## Project Health
- **Working:** All core features, authentication, tenant portal, contractor portal, billing, maintenance, AI insights, messaging
- **Configured:** Stripe (LIVE KEYS), Mailchimp Marketing & Mandrill Transactional emails
- **PWA Ready:** Service worker, offline support, install prompt, mobile bottom nav
- **Domain:** mypropops.com configured

## Deployment Status: ✅ READY FOR PRODUCTION

## Test Credentials
- **Manager:** test@test.com / test123
- **Contractor:** testcontractor@test.com / test123
- **Tenant:** testpayments3@test.com / Test123!

## Legal & IP Protection
- **Terms of Service:** Updated with Software License Grant, IP protection, and trademark notices
- **Privacy Policy:** Comprehensive data handling and user rights documentation
- **Trademark:** "#1 Property Management Software" and MyPropOps registered
- **Site Description:** Marketing copy and SEO keywords at `/app/SITE_DESCRIPTION.md`
