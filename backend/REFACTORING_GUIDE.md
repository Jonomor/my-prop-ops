# Backend Refactoring Guide

## Current State
- `server.py` contains ~5700 lines with all business logic
- Router structure exists in `/routers/` but is not fully utilized
- Only `screening` and `payments` routers are currently included

## Refactoring Strategy

### Phase 1: Extract Authentication Routes (Safest)
Move auth routes from `server.py` to `routers/auth.py`:
- `/auth/register`
- `/auth/login`
- `/auth/me`

### Phase 2: Extract Organization Routes
Move organization management routes:
- `/organizations` (list, create)
- `/organizations/{org_id}` (get, update, delete)
- `/organizations/{org_id}/members`

### Phase 3: Extract Property Routes
- `/organizations/{org_id}/properties`
- `/organizations/{org_id}/units`

### Phase 4: Extract Maintenance Routes
- `/maintenance-requests`
- `/maintenance-requests/{id}`
- `/maintenance-requests/{id}/assign-contractor`

### Phase 5: Extract Tenant Portal Routes
- `/tenant-portal/register`
- `/tenant-portal/login`
- `/tenant-portal/me`
- `/tenant-portal/*`

### Phase 6: Extract Contractor Routes
- `/contractor/register`
- `/contractor/login`
- `/contractor/me`
- `/contractor/jobs`

### Phase 7: Extract Billing Routes
- `/billing/plans`
- `/billing/subscription-status`
- `/billing/create-embedded-checkout`

## Shared Dependencies
Routes that need to be shared via `utils/`:
- `get_current_user` - Auth dependency
- `get_current_tenant` - Tenant auth dependency
- `get_current_contractor` - Contractor auth dependency
- `get_user_membership` - Org membership check
- `check_plan_limits` - Subscription limit enforcement

## Testing Each Phase
After each phase:
1. Run pytest tests if available
2. Test API endpoints manually
3. Verify frontend integration
4. Commit changes

## Risk Mitigation
- Keep original code commented until verification
- Test each phase thoroughly before moving to next
- Maintain backward compatibility with existing API contracts
