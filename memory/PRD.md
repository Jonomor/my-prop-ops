# MyPropOps - Product Requirements Document

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

### P1 - High Priority
- [x] ~~Mailchimp email notifications~~ (DONE - needs keys)
- [x] ~~Maintenance request workflow~~ (DONE)
- [ ] Tenant screening feature (models exist, needs API/UI)
- [ ] Link promotional videos from Google Drive to landing page (user provided URLs)

### P2 - Medium Priority
- [ ] Rent payment tracking module
- [ ] Advanced analytics dashboard
- [ ] AI-powered dashboard insights

### P3 - Future
- [ ] Mobile app optimization
- [ ] AI-powered document processing
- [ ] Integration with accounting software

## Known Technical Debt
1. **CRITICAL:** `server.py` is monolithic (~3800+ lines) and needs to be split into APIRouter modules
2. Mailchimp keys not configured (emails gracefully skip when unconfigured)

## Files of Reference
- `/app/backend/server.py` - Main backend (needs refactoring)
- `/app/backend/.env` - Contains Stripe keys and Mailchimp placeholders
- `/app/frontend/src/pages/Billing.js` - Billing page with embedded checkout
- `/app/frontend/src/components/EmbeddedCheckout.js` - Stripe checkout component
- `/app/frontend/src/pages/Maintenance.js` - Maintenance request page
- `/app/frontend/src/pages/TenantPortal.js` - Tenant portal UI
- `/app/test_reports/iteration_6.json` - Latest test results

## Project Health
- **Working:** All core features, authentication, tenant portal, billing, maintenance
- **Configured:** Stripe embedded checkout (TEST MODE with real keys)
- **Configured:** Mailchimp Marketing & Mandrill Transactional emails
- **Needs Work:** Backend architecture (modularization)

## Legal & IP Protection
- **Terms of Service:** Updated with Software License Grant, IP protection, and trademark notices
- **Privacy Policy:** Comprehensive data handling and user rights documentation
- **Trademark:** "#1 Property Management Software" and MyPropOps registered
- **Site Description:** Marketing copy and SEO keywords at `/app/SITE_DESCRIPTION.md`
