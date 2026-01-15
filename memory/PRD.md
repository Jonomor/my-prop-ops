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

### 9. Public Landing Page ✅
- Route: /
- Hero: "All your property operations. One dashboard."
- Pain points vs solutions
- Feature showcase
- Target audience section
- CTA → /register
- Uses existing theme, no new dependencies

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
