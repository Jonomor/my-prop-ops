# PropOps - Property Operations Management SaaS
## MVP Readiness Document - Updated January 2026

## Original Problem Statement
Build a full-stack SaaS web application for property and housing operations management.

## Architecture
- **Frontend**: React 19 + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Local disk storage

---

## PHASE 1 — AUDIT & COMPLIANCE HARDENING ✅

### 1. Role Enforcement ✅
- `require_role()` helper implemented and consistently applied
- Permissions enforced server-side:
  - **Properties** Create/Update/Delete → Admin, Manager only
  - **Tenants** Update → Admin, Manager only
  - **Inspections** Approve → Admin, Manager only
  - **Documents** Delete → Admin, Manager only
- Staff users correctly receive 403 Forbidden

### 2. Inspection Workflow State Machine ✅
- VALID_TRANSITIONS enforced:
  - scheduled → completed | failed
  - completed → approved | failed
  - approved → terminal (immutable)
  - failed → terminal (immutable)
- Invalid transitions return 400 Bad Request
- Approved inspections cannot be modified

### 3. Audit Log Hardening ✅
- Immutable audit logs (insert only, no update/delete endpoints)
- Each audit record includes:
  - actor user_id ✅
  - org_id ✅
  - action ✅
  - timestamp ✅
  - ip_address ✅
  - user_agent ✅

---

## PHASE 2 — TEAM & ORG OPERATIONS ✅

### 4. Team Invitations ✅
- **Admin capabilities:**
  - Invite user by email ✅
  - Select role (Admin/Manager/Staff) ✅
  - View pending invites ✅
  - Revoke/delete invites ✅
- **User capabilities:**
  - View pending invites at /invites ✅
  - Accept invite ✅
  - Auto-switch org after acceptance ✅
- **Validation:**
  - Cannot invite users already in org ✅
  - Cannot duplicate pending invites ✅
- No email delivery (share link manually)

---

## PHASE 3 — VISIBILITY & OPERATIONS ✅

### 5. Calendar View ✅
- Route: /calendar
- Shows scheduled inspections ✅
- Shows lease end dates ✅
- Read-only ✅
- Clickable items navigate to detail pages ✅

### 6. Member Directory ✅
- Route: /members
- Read-only member list per organization ✅
- Shows: name, email, role, joined date ✅
- Searchable ✅

---

## PHASE 4 — MONETIZATION PREP ✅

### 7. Billing Foundation ✅
- Organization `plan` field added (free/pro/enterprise)
- All new orgs default to 'free' plan
- No Stripe/payments yet (feature-gated)

### 8. Feature Flags ✅
- GET /api/feature-flags endpoint
- Flags implemented:
  - email_invites: false
  - billing: false
  - maintenance: false
  - advanced_analytics: false
  - api_access: false
- All advanced features disabled by default

---

## PHASE 5 — MARKETING ✅

### 9. Public Landing Page ✅ (REDESIGNED Feb 2026)
- Route: /
- **Hero Section:**
  - Badge: "Free forever for small portfolios"
  - Headline: "Stop drowning in spreadsheets. Start managing."
  - Value props: Setup in 15 min, No credit card, Free up to 5 units
  - First-person CTA: "Start My Free Account"
  - Social proof: "Join 500+ property managers"
- **Stats Bar:** 10+ hours saved, 100% compliance, 15 min setup, 4.9/5 rating
- **Financial Infographic:** 4K analytics dashboard showing rental income, occupancy rates, income breakdown
- **Problem/Solution:** "The old way" vs "The PropOps way" comparison
- **How It Works:** 3 simple steps
- **Features Grid:** 6 features with specific benefits
- **Testimonials:** 3 customer quotes with star ratings
- **Pricing Section (3-Tier with Monthly/Annual Toggle) - UPDATED Dec 2026:**
  - Free: $0/month (2 properties, 5 units, 1 team member)
  - Standard (MOST POPULAR): $29/month or $24/month annually (20 properties, 40 units, 5 team members, 10GB storage, full inspection workflows, calendar integrations)
  - Pro: $99/month or $82/month annually (unlimited everything, 24/7 support, API access, 100GB storage, **Tenant Portal access**, **Real-time tenant messaging**)
  - Annual billing saves 17%
  - "Free forever, not a trial" messaging
- **Navigation:** Features, Pricing, Reviews, FAQ, **"For Tenants"** link
- **FAQ Section:** 6 collapsible questions addressing objections
- **Final CTA:** Reiterates free offer

### 10. Legal Pages ✅ (Feb 2026)
- **Privacy Policy** (/privacy): Comprehensive data collection, usage, sharing, and rights
- **Terms of Service** (/terms): Service description, billing, acceptable use, liability
- **Security** (/security): Encryption, infrastructure, compliance, certifications, responsible disclosure

### 11. Auto-Unit Generation ✅ (Feb 2026)
- When creating a property with total_units > 0, units are auto-created
- Reduces friction for new users
- Units numbered 1, 2, 3... by default

---

## PHASE 6 — TENANT PORTAL ✅ (COMPLETED Dec 2026)

### 12. Tenant Portal - Separate User System ✅
- **Route**: /tenant-portal/*
- **Authentication**: Separate JWT tokens with `type='tenant'`
- **Database**: `tenant_portal_users` collection

### 13. Tenant Portal Features ✅
- **Registration & Login** (/tenant-portal/register, /tenant-portal/login)
  - Separate account system for tenants
  - Email, password, name, phone
  - JWT token with tenant-specific payload
  
- **Dashboard** (/tenant-portal)
  - Document submission count (X/12)
  - Application status card
  - Upcoming appointments count
  - Unread messages count
  - Application progress tracker with stages
  - Quick action buttons
  
- **Document Checklist**
  - 12 standard housing program documents
  - Status tracking: not_started, uploaded, verified, rejected
  - File upload capability
  - Download previously uploaded documents
  - Required vs optional document flagging
  
- **Application Status Tracker**
  - 8 application stages:
    1. Not Started
    2. Application Submitted
    3. Documents Under Review
    4. Background Check
    5. Inspection Scheduled
    6. Inspection Complete
    7. Approved
    8. Denied
  - Visual progress indicator
  - Stage descriptions
  
- **Appointments**
  - Create appointment reminders
  - Track inspection dates, interviews, orientations
  - Date, time, location, type fields
  
- **Secure Messaging**
  - Conversation-based messaging with landlords
  - Real-time message display
  - Send/receive functionality
  - Unread message count
  
- **Profile Management**
  - Personal information (name, email, phone, address)
  - Housing program selection (Section 8, HUD, LIHTC, etc.)
  - Voucher number
  - Household size and members
  - Annual income and sources
  - Emergency contact
  
- **Housing Resources**
  - 5 Housing programs guide (Section 8, Public Housing, LIHTC, HUD, Veterans Affairs)
  - 6 Tenant rights information
  - 6 FAQs about housing programs

### 14. Landlord/Manager Integration ✅
- GET /api/organizations/{org_id}/tenant-portal-users (view connected tenants)
- PUT /api/organizations/{org_id}/tenant-portal-users/{id}/stage (update application stage)
- PUT /api/organizations/{org_id}/tenant-portal-users/{id}/checklist/{item_id}/verify (verify documents)
- POST /api/organizations/{org_id}/tenant-portal-users/{id}/conversations/{conv_id}/messages (send messages)

---

## API ENDPOINTS

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Organizations
- GET /api/organizations
- POST /api/organizations
- GET /api/organizations/{org_id}

### Members (NEW)
- GET /api/organizations/{org_id}/members (read-only)

### Team Invitations
- POST /api/organizations/{org_id}/invites (Admin)
- GET /api/organizations/{org_id}/invites (Admin)
- DELETE /api/organizations/{org_id}/invites/{id} (Admin)
- GET /api/invites/pending (User's invites)
- GET /api/invites/{token} (Public)
- POST /api/invites/accept

### Properties (Role-enforced)
- GET /api/organizations/{org_id}/properties
- POST /api/organizations/{org_id}/properties (Admin/Manager)
- GET /api/organizations/{org_id}/properties/{id}
- PUT /api/organizations/{org_id}/properties/{id} (Admin/Manager)
- DELETE /api/organizations/{org_id}/properties/{id} (Admin/Manager)

### Units
- GET/POST /api/organizations/{org_id}/units
- GET/PUT /api/organizations/{org_id}/units/{id}

### Tenants (Role-enforced)
- GET/POST /api/organizations/{org_id}/tenants
- GET /api/organizations/{org_id}/tenants/{id}
- PUT /api/organizations/{org_id}/tenants/{id} (Admin/Manager)

### Inspections (State machine + role enforcement)
- GET/POST /api/organizations/{org_id}/inspections
- GET /api/organizations/{org_id}/inspections/{id}
- PUT /api/organizations/{org_id}/inspections/{id}

### Calendar
- GET /api/organizations/{org_id}/calendar

### Documents (Role-enforced)
- GET/POST /api/organizations/{org_id}/documents
- GET /api/organizations/{org_id}/documents/{id}/download
- DELETE /api/organizations/{org_id}/documents/{id} (Admin/Manager)

### Notifications
- GET /api/notifications
- PUT /api/notifications/{id}/read
- PUT /api/notifications/read-all

### Audit Logs
- GET /api/organizations/{org_id}/audit-logs (Admin only)

### Feature Flags (NEW)
- GET /api/feature-flags

### Dashboard
- GET /api/organizations/{org_id}/dashboard

### Tenant Portal (PHASE 6 - NEW)
**Tenant Auth:**
- POST /api/tenant-portal/register
- POST /api/tenant-portal/login
- GET /api/tenant-portal/me

**Tenant Profile:**
- PUT /api/tenant-portal/profile

**Document Checklist:**
- GET /api/tenant-portal/checklist
- POST /api/tenant-portal/checklist/{item_id}/upload
- GET /api/tenant-portal/documents/{doc_id}/download

**Application:**
- GET /api/tenant-portal/application-status
- PUT /api/tenant-portal/application-status

**Appointments:**
- GET /api/tenant-portal/appointments
- POST /api/tenant-portal/appointments

**Messaging:**
- GET /api/tenant-portal/conversations
- POST /api/tenant-portal/conversations/{org_id}
- GET /api/tenant-portal/conversations/{conversation_id}/messages
- POST /api/tenant-portal/conversations/{conversation_id}/messages

**Resources:**
- GET /api/tenant-portal/resources

**Manager/Landlord Tenant Management:**
- GET /api/organizations/{org_id}/tenant-portal-users
- GET /api/organizations/{org_id}/tenant-portal-users/{tenant_id}
- PUT /api/organizations/{org_id}/tenant-portal-users/{tenant_id}/stage
- PUT /api/organizations/{org_id}/tenant-portal-users/{tenant_id}/checklist/{item_id}/verify
- POST /api/organizations/{org_id}/tenant-portal-users/{tenant_id}/conversations/{conversation_id}/messages

---

## MVP READINESS CHECKLIST ✅

### Security & Compliance
- [x] Role-based access control enforced server-side
- [x] Inspection state machine prevents invalid transitions
- [x] Audit logs immutable with full context
- [x] JWT authentication with secure token handling
- [x] org_id scoping on all domain entities

### Core Features
- [x] Multi-tenant organization management
- [x] Properties, units, tenants CRUD
- [x] Inspection workflow with state machine
- [x] Document upload/download
- [x] Notifications system
- [x] Calendar view
- [x] Team invitations
- [x] Member directory

### Monetization Ready
- [x] Organization plan field
- [x] Feature flags system
- [x] All premium features disabled by default

### User Experience
- [x] Professional landing page
- [x] Light/dark theme toggle
- [x] Responsive design
- [x] Clean navigation

---

## PHASE 2 RECOMMENDATIONS (NOT IMPLEMENTED)

### Email Integration
- SendGrid or AWS SES for invite notifications
- Inspection reminders
- Lease expiration alerts

### Stripe Integration
- Enable billing feature flag
- Subscription plans (free/pro/enterprise)
- Usage-based billing for API access

### Maintenance Workflows
- Enable maintenance feature flag
- Maintenance request system
- Work order tracking

### Advanced Analytics
- Enable advanced_analytics feature flag
- Property performance dashboards
- Occupancy reports
- Financial summaries

### API Access
- Enable api_access feature flag
- API key management
- Rate limiting
- Webhook integrations
