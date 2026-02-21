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

## Tech Stack
- **Backend:** FastAPI, Pydantic, MongoDB (motor), JWT, WebSockets
- **Frontend:** React, React Router, Tailwind CSS, Shadcn/UI, Axios, React Context
- **Architecture:** Full-stack, Multi-tenant SaaS, Monolithic Backend (needs refactoring)

## What's Been Implemented

### December 2025 - Session Completed Items

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

#### SEO Backlink Strategy (COMPLETE)
- Comprehensive competitor analysis of yardi.com
- Strategy document created: `/app/SEO_BACKLINK_STRATEGY.md`
- Identified 20+ priority outreach targets
- Anchor text distribution recommendations

## Key API Endpoints
- `/api/portal/connect_organization` - Connect tenant to org
- `/api/portal/documents/request` - Request documents from landlord
- `/api/portal/documents/templates/{template_name}` - Download templates
- `/api/organizations/{org_id}/tenant_invite_code` - Manage invite codes
- `/api/organizations/{org_id}/document_requests` - View document requests
- `/api/organization/usage` - Check resource usage

## Database Schema Updates
- **organizations:** Added `tenant_invite_code` field
- **tenant_documents:** Added `source_type`, `template_path` fields
- **document_requests:** New collection for tenant-landlord requests

## Test Credentials
- **Manager:** test@test.com / test123
- **Tenant:** testtenant@test.com / test123

## Prioritized Backlog

### P0 - Critical
- [ ] Backend refactoring: Break `server.py` into modular routers

### P1 - High Priority
- [ ] Stripe billing integration for paid tier upgrades
- [ ] Email notifications (SendGrid/Resend) for reminders and alerts

### P2 - Medium Priority
- [ ] Maintenance request workflow
- [ ] Rent payment tracking module
- [ ] Advanced analytics dashboard

### P3 - Future
- [ ] Mobile app optimization
- [ ] AI-powered document processing
- [ ] Integration with accounting software

## Known Technical Debt
1. **CRITICAL:** `server.py` is monolithic and needs to be split into APIRouter modules
2. Subscription model is partially mocked (limits enforced but no payment to upgrade)

## Files of Reference
- `/app/backend/server.py` - Main backend (needs refactoring)
- `/app/frontend/src/pages/TenantPortal.js` - Tenant portal UI
- `/app/frontend/src/pages/Settings.js` - Landlord settings
- `/app/SEO_BACKLINK_STRATEGY.md` - SEO strategy document
- `/app/test_reports/iteration_1.json` - Test results

## Project Health
- **Working:** All core features, authentication, tenant portal
- **Mocked:** Subscription upgrade path (no payment integration)
- **Needs Work:** Backend architecture (modularization)
