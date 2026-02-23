# MyPropOps - Product Requirements Document

## Project Overview
MyPropOps is a full-stack SaaS web application for property and housing operations management, deployed on Railway with MongoDB Atlas.

**Production URL:** https://mypropops.com
**Backend URL:** https://backend-production-0325.up.railway.app

## Core Features (Implemented)
- Multi-tenant architecture with organization-based data isolation
- User authentication (Admin, Manager, Staff, Contractor roles)
- Tenant Portal for housing program participants
- Contractor Portal for maintenance professionals
- Property and unit management
- Tenant tracking and lease management
- Inspection workflows and compliance tracking
- Document management system
- Maintenance request system
- Real-time WebSocket notifications
- AI-powered dashboard insights
- Stripe billing integration
- Automated blog generation
- Super Admin dashboard

## Tech Stack
- **Frontend:** React 18, TailwindCSS, Shadcn UI, React Router v6
- **Backend:** FastAPI (Python), MongoDB (Atlas)
- **Deployment:** Railway (Frontend + Backend), MongoDB Atlas
- **Integrations:** Stripe, OpenAI GPT-4, Mailchimp/Mandrill

## Recent Updates (Feb 23, 2026)

### Production Deployment
- Successfully deployed to Railway
- Fixed $PORT environment variable issue in backend Dockerfile
- Configured frontend with CI=false for production builds

### PageSpeed Optimizations
- Added preconnect hints for external resources
- Optimized logo images (created logo-small.jpg at 2KB)
- Added explicit width/height to images for CLS improvement
- Improved accessibility: main landmark, ARIA labels, contrast fixes
- Fixed heading hierarchy in footer

### Favicon Updates
- Implemented new rounded logo design
- Generated all required sizes (ico, png, apple-touch-icon)
- Version bumped to v=5 for cache busting

## Environment Variables

### Backend (Railway)
- `MONGO_URL`: MongoDB Atlas connection string
- `DB_NAME`: mypropops
- `JWT_SECRET`: Production secret key
- `PORT`: Auto-set by Railway

### Frontend (Railway)
- `CI`: false (treats warnings as warnings, not errors)
- `REACT_APP_BACKEND_URL`: https://backend-production-0325.up.railway.app

## Credentials
- **Admin:** admin@mypropops.com / MyPropOps@Admin2026!

## Backlog

### P1 - High Priority
- Video optimization (self-host compressed versions)
- Code splitting for route-based chunking
- Backend refactoring (server.py is 6100+ lines)

### P2 - Medium Priority
- Real tenant screening API integration (currently demo mode)
- Browser push notifications
- CDN integration for static assets

### P3 - Future
- AI-enhanced security monitoring
- Accounting software integration
- Stripe Connect for online rent payments
- AI-powered document processing

## Known Limitations
- Tenant Screening is in "Demo Mode" (mock data)
- Large video files hosted on Emergent CDN (no cache control)
- Monolithic server.py needs refactoring post-launch
