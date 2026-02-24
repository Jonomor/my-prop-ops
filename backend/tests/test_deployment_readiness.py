"""
Final Deployment Readiness Test Suite for MyPropOps
Tests all critical API endpoints for production deployment
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://propops-fixes.preview.emergentagent.com').rstrip('/')

# Test credentials
MANAGER_EMAIL = "test@test.com"
MANAGER_PASSWORD = "test123"
CONTRACTOR_EMAIL = "testcontractor@test.com"
CONTRACTOR_PASSWORD = "test123"
TENANT_EMAIL = "testtenant@test.com"
TENANT_PASSWORD = "test123"
ADMIN_EMAIL = "admin@mypropops.com"
ADMIN_PASSWORD = "MyPropOps@Admin2026!"


class TestHealthCheck:
    """Basic health checks"""
    
    def test_api_health(self):
        """API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check: PASSED")
    
    def test_root_endpoint(self):
        """Root endpoint returns ok"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        print("✓ Root endpoint: PASSED")


class TestManagerAuthentication:
    """Manager login flow - PRIMARY AUTH"""
    
    def test_manager_login_success(self):
        """Manager login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == MANAGER_EMAIL
        print(f"✓ Manager login: PASSED - User: {data['user'].get('name')}")
        return data["token"]
    
    def test_manager_login_invalid_credentials(self):
        """Manager login rejects invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": "wrongpassword123"
        })
        assert response.status_code == 401
        print("✓ Manager invalid credentials rejected: PASSED")
    
    def test_manager_me_endpoint(self):
        """Get current user info after login"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_resp.status_code == 200
        user = me_resp.json()
        assert user["email"] == MANAGER_EMAIL
        print(f"✓ Manager /me endpoint: PASSED")


class TestContractorAuthentication:
    """Contractor portal login"""
    
    def test_contractor_login_success(self):
        """Contractor login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/contractor/login", json={
            "email": CONTRACTOR_EMAIL,
            "password": CONTRACTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "contractor" in data
        print(f"✓ Contractor login: PASSED - Name: {data['contractor'].get('name')}")
    
    def test_contractor_login_invalid(self):
        """Contractor login rejects invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/contractor/login", json={
            "email": "fake@contractor.com",
            "password": "wrongpass"
        })
        assert response.status_code in [401, 400]
        print("✓ Contractor invalid login rejected: PASSED")


class TestTenantPortalAuthentication:
    """Tenant portal login"""
    
    def test_tenant_login_success(self):
        """Tenant portal login"""
        response = requests.post(f"{BASE_URL}/api/tenant-portal/login", json={
            "email": TENANT_EMAIL,
            "password": TENANT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Tenant portal login: PASSED")
    
    def test_tenant_login_invalid(self):
        """Tenant login rejects invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/tenant-portal/login", json={
            "email": "fake@tenant.com",
            "password": "wrongpass"
        })
        assert response.status_code in [401, 400]
        print("✓ Tenant invalid login rejected: PASSED")


class TestAdminAuthentication:
    """Admin dashboard login"""
    
    def test_admin_login_success(self):
        """Admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print("✓ Admin login: PASSED")
    
    def test_admin_login_invalid(self):
        """Admin login rejects invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongadminpass"
        })
        assert response.status_code in [401, 400]
        print("✓ Admin invalid login rejected: PASSED")
    
    def test_admin_stats(self):
        """Admin can access platform stats"""
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        stats_resp = requests.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {token}"
        })
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert "total_users" in stats
        assert "total_organizations" in stats
        print(f"✓ Admin stats: PASSED - Users: {stats.get('total_users')}, Orgs: {stats.get('total_organizations')}")


class TestOrganizations:
    """Organization endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_list_organizations(self, auth_headers):
        """List user organizations"""
        response = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
        assert response.status_code == 200
        orgs = response.json()
        assert isinstance(orgs, list)
        assert len(orgs) > 0
        print(f"✓ List organizations: PASSED - Found {len(orgs)} org(s)")
        return orgs[0]["org_id"] if orgs else None


class TestDashboardData:
    """Dashboard data loading"""
    
    @pytest.fixture
    def auth_headers_and_org(self):
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get org ID
        orgs_resp = requests.get(f"{BASE_URL}/api/organizations", headers=headers)
        orgs = orgs_resp.json()
        org_id = orgs[0]["org_id"] if orgs else None
        
        return headers, org_id
    
    def test_dashboard_stats(self, auth_headers_and_org):
        """Dashboard stats endpoint"""
        headers, org_id = auth_headers_and_org
        if not org_id:
            pytest.skip("No organization found")
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/dashboard", headers=headers)
        assert response.status_code == 200
        stats = response.json()
        assert "total_properties" in stats
        assert "total_units" in stats
        assert "total_tenants" in stats
        print(f"✓ Dashboard stats: PASSED - Properties: {stats.get('total_properties')}, Units: {stats.get('total_units')}, Tenants: {stats.get('total_tenants')}")
    
    def test_list_properties(self, auth_headers_and_org):
        """List properties"""
        headers, org_id = auth_headers_and_org
        if not org_id:
            pytest.skip("No organization found")
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/properties", headers=headers)
        assert response.status_code == 200
        properties = response.json()
        assert isinstance(properties, list)
        print(f"✓ List properties: PASSED - Found {len(properties)} properties")
    
    def test_list_tenants(self, auth_headers_and_org):
        """List tenants"""
        headers, org_id = auth_headers_and_org
        if not org_id:
            pytest.skip("No organization found")
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/tenants", headers=headers)
        assert response.status_code == 200
        tenants = response.json()
        assert isinstance(tenants, list)
        print(f"✓ List tenants: PASSED - Found {len(tenants)} tenants")
    
    def test_list_maintenance_requests(self, auth_headers_and_org):
        """List maintenance requests"""
        headers, org_id = auth_headers_and_org
        if not org_id:
            pytest.skip("No organization found")
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/maintenance-requests", headers=headers)
        assert response.status_code == 200
        requests_list = response.json()
        assert isinstance(requests_list, list)
        print(f"✓ List maintenance requests: PASSED - Found {len(requests_list)} requests")
    
    def test_list_inspections(self, auth_headers_and_org):
        """List inspections"""
        headers, org_id = auth_headers_and_org
        if not org_id:
            pytest.skip("No organization found")
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/inspections", headers=headers)
        assert response.status_code == 200
        inspections = response.json()
        assert isinstance(inspections, list)
        print(f"✓ List inspections: PASSED - Found {len(inspections)} inspections")
    
    def test_list_notifications(self, auth_headers_and_org):
        """List notifications"""
        headers, _ = auth_headers_and_org
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200
        notifications = response.json()
        assert isinstance(notifications, list)
        print(f"✓ List notifications: PASSED - Found {len(notifications)} notifications")


class TestPublicEndpoints:
    """Public page endpoints"""
    
    def test_blog_listing(self):
        """Public blog listing"""
        response = requests.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list)
        print(f"✓ Blog listing: PASSED - Found {len(posts)} posts")
    
    def test_billing_plans(self):
        """Public billing plans"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        print(f"✓ Billing plans: PASSED - Found {len(data.get('plans', []))} plans")


class TestBillingEndpoints:
    """Billing related endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_subscription_status(self, auth_headers):
        """Get subscription status"""
        response = requests.get(f"{BASE_URL}/api/billing/subscription-status", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        print(f"✓ Subscription status: PASSED - Current plan: {data.get('plan')}")


class TestContractorRegistration:
    """Contractor registration endpoint - RECENTLY FIXED"""
    
    def test_registration_endpoint_exists(self):
        """Contractor registration endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/contractor/register", json={})
        # Should return validation error, not 404
        assert response.status_code != 404
        print("✓ Contractor registration endpoint: EXISTS")
    
    def test_registration_requires_specialties(self):
        """Registration requires at least one specialty"""
        response = requests.post(f"{BASE_URL}/api/contractor/register", json={
            "email": "newcontractor_test@example.com",
            "password": "TestPass123!",
            "name": "Test Contractor",
            "phone": "555-123-4567",
            "specialties": []  # Empty specialties
        })
        # Should fail - empty specialties
        assert response.status_code in [400, 422]
        print("✓ Contractor registration validates specialties: PASSED")


class TestFeatureFlags:
    """Feature flag endpoints"""
    
    def test_public_feature_flags(self):
        """Get public feature flags"""
        response = requests.get(f"{BASE_URL}/api/feature-flags")
        assert response.status_code == 200
        flags = response.json()
        assert isinstance(flags, dict)
        print(f"✓ Feature flags: PASSED")


class TestCalendarAndReports:
    """Calendar and reporting endpoints"""
    
    @pytest.fixture
    def auth_headers_and_org(self):
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        orgs_resp = requests.get(f"{BASE_URL}/api/organizations", headers=headers)
        orgs = orgs_resp.json()
        org_id = orgs[0]["org_id"] if orgs else None
        
        return headers, org_id
    
    def test_calendar_events(self, auth_headers_and_org):
        """Get calendar events"""
        headers, org_id = auth_headers_and_org
        if not org_id:
            pytest.skip("No organization found")
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/calendar", headers=headers)
        assert response.status_code == 200
        events = response.json()
        assert isinstance(events, list)
        print(f"✓ Calendar events: PASSED - Found {len(events)} events")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
