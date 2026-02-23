"""
Comprehensive Feature Tests for MyPropOps - Production Launch Testing
Tests all critical API endpoints and flows
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MANAGER_EMAIL = "test@test.com"
MANAGER_PASSWORD = "test123"
CONTRACTOR_EMAIL = "testcontractor@test.com"
CONTRACTOR_PASSWORD = "test123"
ADMIN_EMAIL = "admin@mypropops.com"
ADMIN_PASSWORD = "MyPropOps@Admin2026!"


class TestHealthAndBasics:
    """Basic health checks and API availability"""
    
    def test_api_health(self):
        """Test API is reachable"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("API health check: PASSED")


class TestManagerAuthFlow:
    """Manager authentication and dashboard flows"""
    
    def test_manager_login_success(self):
        """Test manager login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Manager login: PASSED - User: {data['user'].get('name', 'Unknown')}")
        return data["token"]
    
    def test_manager_login_invalid_password(self):
        """Test manager login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400]
        print("Manager invalid password rejection: PASSED")
    
    def test_dashboard_stats(self):
        """Test dashboard returns stats after login"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
        user = login_resp.json()["user"]
        
        # Get organization from memberships
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get user's organizations
        if user.get("memberships"):
            org_id = user["memberships"][0].get("org_id")
            if org_id:
                dash_resp = requests.get(
                    f"{BASE_URL}/api/organizations/{org_id}/dashboard",
                    headers=headers
                )
                assert dash_resp.status_code == 200
                stats = dash_resp.json()
                assert "total_properties" in stats
                assert "total_units" in stats
                print(f"Dashboard stats: PASSED - Properties: {stats.get('total_properties')}, Units: {stats.get('total_units')}")


class TestContractorAuth:
    """Contractor portal authentication"""
    
    def test_contractor_login_success(self):
        """Test contractor login"""
        response = requests.post(f"{BASE_URL}/api/contractor/login", json={
            "email": CONTRACTOR_EMAIL,
            "password": CONTRACTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "contractor" in data
        print(f"Contractor login: PASSED - Contractor: {data['contractor'].get('name', 'Unknown')}")
    
    def test_contractor_login_invalid(self):
        """Test contractor login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/contractor/login", json={
            "email": "invalid@contractor.com",
            "password": "wrongpass"
        })
        assert response.status_code in [401, 400]
        print("Contractor invalid login rejection: PASSED")


class TestAdminAuth:
    """Admin dashboard authentication"""
    
    def test_admin_login_success(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print("Admin login: PASSED")
    
    def test_admin_login_invalid(self):
        """Test admin login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400]
        print("Admin invalid login rejection: PASSED")


class TestPropertyCRUD:
    """Property CRUD operations"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def org_id(self, auth_headers):
        """Get organization ID"""
        me_resp = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        if me_resp.status_code == 200:
            user = me_resp.json()
            if user.get("memberships"):
                return user["memberships"][0].get("org_id")
        return None
    
    def test_list_properties(self, auth_headers, org_id):
        """Test listing properties"""
        if not org_id:
            pytest.skip("No organization ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/organizations/{org_id}/properties",
            headers=auth_headers
        )
        assert response.status_code == 200
        properties = response.json()
        assert isinstance(properties, list)
        print(f"List properties: PASSED - Found {len(properties)} properties")


class TestTenantCRUD:
    """Tenant CRUD operations"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def org_id(self, auth_headers):
        """Get organization ID"""
        me_resp = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        if me_resp.status_code == 200:
            user = me_resp.json()
            if user.get("memberships"):
                return user["memberships"][0].get("org_id")
        return None
    
    def test_list_tenants(self, auth_headers, org_id):
        """Test listing tenants"""
        if not org_id:
            pytest.skip("No organization ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/organizations/{org_id}/tenants",
            headers=auth_headers
        )
        assert response.status_code == 200
        tenants = response.json()
        assert isinstance(tenants, list)
        print(f"List tenants: PASSED - Found {len(tenants)} tenants")


class TestMaintenanceRequests:
    """Maintenance request operations"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def org_id(self, auth_headers):
        """Get organization ID"""
        me_resp = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        if me_resp.status_code == 200:
            user = me_resp.json()
            if user.get("memberships"):
                return user["memberships"][0].get("org_id")
        return None
    
    def test_list_maintenance_requests(self, auth_headers, org_id):
        """Test listing maintenance requests"""
        if not org_id:
            pytest.skip("No organization ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/organizations/{org_id}/maintenance-requests",
            headers=auth_headers
        )
        assert response.status_code == 200
        requests_list = response.json()
        assert isinstance(requests_list, list)
        print(f"List maintenance requests: PASSED - Found {len(requests_list)} requests")


class TestInspections:
    """Inspection operations"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def org_id(self, auth_headers):
        """Get organization ID"""
        me_resp = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        if me_resp.status_code == 200:
            user = me_resp.json()
            if user.get("memberships"):
                return user["memberships"][0].get("org_id")
        return None
    
    def test_list_inspections(self, auth_headers, org_id):
        """Test listing inspections"""
        if not org_id:
            pytest.skip("No organization ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/organizations/{org_id}/inspections",
            headers=auth_headers
        )
        assert response.status_code == 200
        inspections = response.json()
        assert isinstance(inspections, list)
        print(f"List inspections: PASSED - Found {len(inspections)} inspections")


class TestRentPayments:
    """Rent payment operations"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def org_id(self, auth_headers):
        """Get organization ID"""
        me_resp = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        if me_resp.status_code == 200:
            user = me_resp.json()
            if user.get("memberships"):
                return user["memberships"][0].get("org_id")
        return None
    
    def test_list_rent_payments(self, auth_headers, org_id):
        """Test listing rent payments"""
        if not org_id:
            pytest.skip("No organization ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/organizations/{org_id}/rent-payments",
            headers=auth_headers
        )
        assert response.status_code == 200
        payments = response.json()
        assert isinstance(payments, list)
        print(f"List rent payments: PASSED - Found {len(payments)} payments")


class TestDocuments:
    """Document operations"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def org_id(self, auth_headers):
        """Get organization ID"""
        me_resp = requests.get(f"{BASE_URL}/api/users/me", headers=auth_headers)
        if me_resp.status_code == 200:
            user = me_resp.json()
            if user.get("memberships"):
                return user["memberships"][0].get("org_id")
        return None
    
    def test_list_documents(self, auth_headers, org_id):
        """Test listing documents"""
        if not org_id:
            pytest.skip("No organization ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/organizations/{org_id}/documents",
            headers=auth_headers
        )
        assert response.status_code == 200
        docs = response.json()
        assert isinstance(docs, list)
        print(f"List documents: PASSED - Found {len(docs)} documents")


class TestNotifications:
    """Notification operations"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_list_notifications(self, auth_headers):
        """Test listing notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=auth_headers
        )
        assert response.status_code == 200
        notifications = response.json()
        assert isinstance(notifications, list)
        print(f"List notifications: PASSED - Found {len(notifications)} notifications")


class TestPublicPages:
    """Public page endpoints"""
    
    def test_blog_posts(self):
        """Test public blog listing"""
        response = requests.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list)
        print(f"Blog posts: PASSED - Found {len(posts)} posts")
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("Health endpoint: PASSED")


class TestContractorRegistration:
    """Contractor registration - testing the FIXED specialty selection flow"""
    
    def test_contractor_registration_endpoint(self):
        """Test contractor registration endpoint exists"""
        # Test with invalid data to check endpoint exists
        response = requests.post(f"{BASE_URL}/api/contractor/register", json={
            "email": "",
            "password": ""
        })
        # Should get validation error, not 404
        assert response.status_code != 404
        print("Contractor registration endpoint: EXISTS")
    
    def test_contractor_registration_validation(self):
        """Test contractor registration validates required fields"""
        response = requests.post(f"{BASE_URL}/api/contractor/register", json={
            "email": "testonly@example.com",
            "password": "Test123!",
            "name": "Test Only",
            "phone": "555-000-0000",
            "specialties": []  # Empty specialties should fail
        })
        # Should fail validation for empty specialties
        assert response.status_code in [400, 422]
        print("Contractor registration validation: PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
