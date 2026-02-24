# MyPropOps - Product Requirements Document

## Project Overview
MyPropOps is a full-stack SaaS property management platform deployed on Railway with MongoDB Atlas.

**Production URL:** https://www.mypropops.com
**Backend URL:** https://backend-production-0325.up.railway.app

## Core Features (Implemented)

### User Portals
- **Manager Dashboard** - Full property management suite
- **Tenant Portal** - Maintenance requests, documents, messaging
- **Contractor Portal** - View/manage assigned maintenance jobs
- **Owner Portal** (NEW) - Property investment dashboard for owners

### Property Management
- Multi-tenant organization architecture
- Property and unit management
- Tenant tracking and lease management
- Inspection workflows (HQS compliant)
- Maintenance request system
- Document management

### Additional Features
- Real-time WebSocket notifications
- AI-powered insights (Pro plan, requires Gemini API)
- Stripe billing integration
- Rich text blog editor with image upload
- Help Center with 30+ FAQ articles
- Super Admin dashboard

## Tech Stack
- **Frontend:** React 18, TailwindCSS, Shadcn UI, TipTap Editor
- **Backend:** FastAPI (Python), MongoDB Atlas
- **Deployment:** Railway
- **Integrations:** Stripe, Gemini AI

## Environment Variables

### Backend (Railway)
- `MONGO_URL` - MongoDB Atlas connection string
- `DB_NAME` - mypropops
- `JWT_SECRET` - Production secret key
- `GEMINI_API_KEY` - For AI blog generation (optional)
- `PORT` - Auto-set by Railway

### Frontend (Railway)
- `CI` - false
- `REACT_APP_BACKEND_URL` - https://backend-production-0325.up.railway.app

## Recent Updates (Feb 24, 2026)

### Owner Portal
- New login and dashboard for property owners
- View assigned properties, occupancy, financials
- Track maintenance on their properties

### Blog Editor Enhancements
- Rich text editor with TipTap
- Image upload from computer (not just URL)
- Alt text prompts for accessibility/SEO
- Sticky toolbar

### Help Center
- 30+ FAQ articles covering all features
- Search and category filtering
- Located at /help

### Bug Fixes
- Fixed blog post formatting (content no longer jams together)
- Fixed backend URL fallback for production
- Fixed footer mobile navigation overlap

## API Endpoints

### Owner Portal
- `POST /api/owner/login` - Owner authentication
- `GET /api/owner/dashboard` - Dashboard data
- `POST /api/organizations/{org_id}/owners` - Create owner
- `PUT /api/properties/{property_id}/assign-owner` - Assign owner

## Backlog

### P1 - High Priority
- Online rent collection (Stripe Connect)
- Real tenant screening integration
- Listing syndication (Zillow, Trulia)
- eSignatures for leases

### P2 - Medium Priority
- Owner statements (PDF generation)
- QuickBooks integration
- Bulk SMS/email messaging
- Renters insurance partnerships

### P3 - Future
- AI rent pricing suggestions
- Native mobile apps
- 1099 e-filing
- Accounting reports (P&L, Balance Sheet)

## Credentials
- **Admin:** admin@mypropops.com / MyPropOps@Admin2026!
