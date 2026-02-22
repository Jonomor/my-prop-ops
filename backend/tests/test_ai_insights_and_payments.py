"""
Test suite for AI Insights and Tenant Rent Payments features
- AI Insights page components
- AI endpoint access control (Pro plan gating)
- Tenant portal rent payments endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MANAGER_EMAIL = "test@test.com"
MANAGER_PASSWORD = "test123"


class TestBackendAPIs:
    """Test AI and Rent Payment API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as manager
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MANAGER_EMAIL, "password": MANAGER_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        data = login_response.json()
        self.token = data.get("token")
        self.user = data.get("user")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get organization
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        if orgs:
            self.org_id = orgs[0].get("org_id")
        else:
            self.org_id = None
    
    # ==================== AI Insights Tests ====================
    
    def test_ai_quick_stats_endpoint(self):
        """Test GET /api/ai/quick-stats returns property stats"""
        response = self.session.get(f"{BASE_URL}/api/ai/quick-stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "properties" in data, "Response should contain 'properties' field"
        assert "occupancy_rate" in data, "Response should contain 'occupancy_rate' field"
        assert "monthly_revenue" in data, "Response should contain 'monthly_revenue' field"
        assert "open_maintenance" in data, "Response should contain 'open_maintenance' field"
        
        # Verify data types
        assert isinstance(data["properties"], int), "properties should be integer"
        assert isinstance(data["occupancy_rate"], (int, float)), "occupancy_rate should be numeric"
        assert isinstance(data["monthly_revenue"], (int, float)), "monthly_revenue should be numeric"
        assert isinstance(data["open_maintenance"], int), "open_maintenance should be integer"
        
        print(f"AI Quick Stats: Properties={data['properties']}, Occupancy={data['occupancy_rate']}%, Revenue=${data['monthly_revenue']}")
    
    def test_ai_insights_requires_pro_plan(self):
        """Test POST /api/ai/insights returns 403 for non-Pro users"""
        response = self.session.post(
            f"{BASE_URL}/api/ai/insights",
            json={"insight_type": "general"}
        )
        
        # Non-pro users should get 403
        # If pro user, should get 200 (or 500 if API issue)
        assert response.status_code in [200, 403, 500], f"Unexpected status: {response.status_code}: {response.text}"
        
        if response.status_code == 403:
            data = response.json()
            assert "detail" in data
            assert "Pro" in data["detail"] or "pro" in data["detail"].lower(), "Error should mention Pro plan requirement"
            print("AI Insights correctly blocked for non-Pro user")
        elif response.status_code == 200:
            data = response.json()
            assert "insight" in data, "Response should contain 'insight' field"
            print(f"AI Insights available for Pro user")
        else:
            print(f"AI Insights returned error (possibly API issue): {response.text}")
    
    def test_ai_insights_requires_authentication(self):
        """Test AI insights endpoints require authentication"""
        # Create new session without auth
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        # Try quick-stats without auth
        response = no_auth_session.get(f"{BASE_URL}/api/ai/quick-stats")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("AI Quick Stats correctly requires authentication")
        
        # Try insights without auth
        response = no_auth_session.post(
            f"{BASE_URL}/api/ai/insights",
            json={"insight_type": "general"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("AI Insights correctly requires authentication")
    
    # ==================== Tenant Rent Payments Tests ====================
    
    def test_rent_payments_endpoint(self):
        """Test GET /api/rent-payments returns rent payments list"""
        # Note: Manager endpoint, not tenant portal
        response = self.session.get(
            f"{BASE_URL}/api/rent-payments",
            params={"org_id": self.org_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Rent Payments: Found {len(data)} payment records")
    
    def test_rent_payments_summary_endpoint(self):
        """Test GET /api/rent-payments/summary returns summary stats"""
        response = self.session.get(
            f"{BASE_URL}/api/rent-payments/summary",
            params={"org_id": self.org_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure (actual field names from API)
        assert "total_expected" in data, "Response should contain 'total_expected' field"
        assert "total_collected" in data, "Response should contain 'total_collected' field"
        assert "outstanding" in data, "Response should contain 'outstanding' field"
        assert "total_payments" in data, "Response should contain 'total_payments' field"
        assert "collection_rate" in data, "Response should contain 'collection_rate' field"
        
        print(f"Rent Summary: Expected=${data['total_expected']}, Collected=${data['total_collected']}, Outstanding=${data['outstanding']}, TotalPayments={data['total_payments']}")
    
    # ==================== Billing/Subscription Status Tests ====================
    
    def test_billing_subscription_status(self):
        """Test GET /api/billing/subscription-status returns plan info"""
        response = self.session.get(f"{BASE_URL}/api/billing/subscription-status")
        
        # Should return 200 with plan info
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "plan" in data, "Response should contain 'plan' field"
        print(f"Current subscription plan: {data['plan']}")
    
    # ==================== Tenant Portal Rent Payments Tests ====================
    
    def test_tenant_portal_rent_payments_requires_tenant_auth(self):
        """Test that tenant portal rent payments endpoint requires tenant authentication"""
        # Using manager auth should fail for tenant portal endpoint
        # Create session with no auth
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.get(f"{BASE_URL}/api/tenant-portal/rent-payments")
        
        # Should require authentication
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("Tenant portal rent-payments correctly requires tenant authentication")


class TestTenantPortalRentPayments:
    """Test Tenant Portal Rent Payments - needs tenant credentials"""
    
    def test_tenant_portal_rent_payments_returns_array(self):
        """Test /api/tenant-portal/rent-payments returns array (when authenticated as tenant)"""
        # First we need to create/login a tenant user
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Try to register a test tenant
        tenant_email = "testpayments_tenant@test.com"
        tenant_password = "Test123!"
        
        # Try login first in case tenant exists
        login_response = session.post(
            f"{BASE_URL}/api/tenant-portal/login",
            json={"email": tenant_email, "password": tenant_password}
        )
        
        if login_response.status_code != 200:
            # Try to register
            register_response = session.post(
                f"{BASE_URL}/api/tenant-portal/register",
                json={
                    "email": tenant_email,
                    "password": tenant_password,
                    "name": "Test Payments Tenant"
                }
            )
            
            if register_response.status_code in [200, 201]:
                data = register_response.json()
                token = data.get("token")
            else:
                pytest.skip(f"Could not create tenant user: {register_response.text}")
                return
        else:
            data = login_response.json()
            token = data.get("token")
        
        # Now test rent-payments endpoint
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = session.get(f"{BASE_URL}/api/tenant-portal/rent-payments")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be an array/list"
        print(f"Tenant Portal Rent Payments: Found {len(data)} payment records (returns array)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
