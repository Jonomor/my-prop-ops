# PropOps - Property Operations Management SaaS

## Original Problem Statement
Build a full-stack SaaS web application for property and housing operations management with:
- User authentication with roles (Admin, Manager, Staff)
- Organization-based multi-tenant architecture
- Property management with properties, units, and tenants
- Tenant records with status (active, pending, inactive)
- Inspection workflow system with statuses (scheduled, completed, failed, approved)
- Document management (upload, categorize, attach to tenants or inspections)
- Notification system for upcoming deadlines and status changes
- Admin dashboard with metrics and recent activity
- Audit log of important actions

## User Personas
1. **Property Admin** - Full access to all features including team management
2. **Property Manager** - Can manage properties, tenants, and approve inspections
3. **Staff** - View and basic operations only

## Core Requirements
- JWT-based authentication (email/password)
- Multi-tenant architecture with org_id scoping
- CRUD operations for all entities
- Role-based access control
- Light/Dark theme toggle
- Professional blue color scheme

## Architecture
- **Frontend**: React 19 + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Local disk storage

## What's Been Implemented (January 2026)

### Phase 1 - MVP Complete
- [x] User registration with automatic org creation
- [x] JWT-based login/logout
- [x] Protected routes
- [x] Organizations CRUD with memberships
- [x] Properties, Units, Tenants, Inspections CRUD
- [x] Documents with file upload
- [x] Notifications system
- [x] Audit Logs (admin-only)
- [x] Dashboard with KPIs
- [x] Dark/Light theme toggle

### Phase 2 - Backend Hardening + Extensions (Jan 2026)

#### Role Enforcement (require_role helper)
- [x] Properties Create/Update/Delete → Admin, Manager only
- [x] Tenants Update → Admin, Manager only
- [x] Inspections Approve → Admin, Manager only
- [x] Documents Delete → Admin, Manager only

#### Inspection Status State Machine
- [x] VALID_TRANSITIONS enforcement:
  - scheduled → completed, failed
  - completed → approved, failed
  - failed → (terminal)
  - approved → (terminal)
- [x] Invalid transitions return 400 error
- [x] Terminal states cannot be modified

#### Landing Page
- [x] Professional marketing landing page
- [x] Hero section: "All your property operations. One dashboard."
- [x] Pain points vs solutions comparison
- [x] Core features grid
- [x] Target audience section
- [x] CTA → /register

#### Calendar View
- [x] Monthly calendar showing inspections and lease end dates
- [x] Event type filtering (all, inspections, lease ends)
- [x] Date selection with event details sidebar
- [x] Links to inspection/tenant pages

#### Team Invitations (Lightweight)
- [x] Admin can invite users by email
- [x] Generates unique invite token/link
- [x] User accepts invite after login/registration
- [x] Invite status tracking (pending, accepted, expired)
- [x] No email delivery integration (share link manually)

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Organizations
- GET/POST /api/organizations
- GET /api/organizations/{org_id}

### Team Invitations (NEW)
- POST /api/organizations/{org_id}/invites (Admin only)
- GET /api/organizations/{org_id}/invites (Admin only)
- DELETE /api/organizations/{org_id}/invites/{id} (Admin only)
- GET /api/invites/{token} (Public - get invite details)
- POST /api/invites/accept (Authenticated)
- GET /api/invites/pending (Authenticated - user's pending invites)

### Properties (Role-enforced)
- GET /api/organizations/{org_id}/properties
- POST /api/organizations/{org_id}/properties (Admin/Manager)
- GET /api/organizations/{org_id}/properties/{id}
- PUT /api/organizations/{org_id}/properties/{id} (Admin/Manager)
- DELETE /api/organizations/{org_id}/properties/{id} (Admin/Manager)

### Units
- GET/POST /api/organizations/{org_id}/units
- GET/PUT /api/organizations/{org_id}/units/{id}

### Tenants (Role-enforced for updates)
- GET/POST /api/organizations/{org_id}/tenants
- GET /api/organizations/{org_id}/tenants/{id}
- PUT /api/organizations/{org_id}/tenants/{id} (Admin/Manager)

### Inspections (State machine + role enforcement)
- GET/POST /api/organizations/{org_id}/inspections
- GET /api/organizations/{org_id}/inspections/{id}
- PUT /api/organizations/{org_id}/inspections/{id} (State machine enforced, Approve = Admin/Manager)

### Calendar (NEW)
- GET /api/organizations/{org_id}/calendar?start_date=&end_date=

### Documents (Role-enforced for delete)
- GET/POST /api/organizations/{org_id}/documents
- GET /api/organizations/{org_id}/documents/{id}/download
- DELETE /api/organizations/{org_id}/documents/{id} (Admin/Manager)

### Notifications
- GET /api/notifications
- PUT /api/notifications/{id}/read
- PUT /api/notifications/read-all

### Audit Logs
- GET /api/organizations/{org_id}/audit-logs (Admin only)

### Dashboard
- GET /api/organizations/{org_id}/dashboard

## Prioritized Backlog

### P0 (Complete)
- [x] All MVP features
- [x] Role enforcement
- [x] Inspection state machine
- [x] Landing page
- [x] Calendar view
- [x] Team invitations

### P1 (Next Phase - Deferred)
- [ ] Email notifications for inspections
- [ ] Maintenance request workflows
- [ ] Rent payment tracking
- [ ] Search across all entities
- [ ] Bulk import/export

### P2 (Future)
- [ ] Financial reports
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Two-factor authentication

## Explicitly NOT Implemented (Phase 2 Scope)
- Email delivery for invitations (share link manually)
- Email notifications
- Maintenance request workflows
- Rent payment tracking
