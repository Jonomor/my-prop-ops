"""
Test pricing features and updated tiers
Tests for:
1. Billing plans API returns correct features
2. Landing page content validation via API
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBillingPlansAPI:
    """Test billing plans endpoint returns updated features"""
    
    def test_billing_plans_endpoint_returns_200(self):
        """GET /api/billing/plans should return 200"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/billing/plans returns 200")
    
    def test_billing_plans_has_three_tiers(self):
        """Should have free, standard, and pro tiers"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        data = response.json()
        assert "plans" in data, "Response should have 'plans' key"
        plans = data["plans"]
        assert len(plans) == 3, f"Expected 3 plans, got {len(plans)}"
        plan_ids = [p["id"] for p in plans]
        assert "free" in plan_ids, "Should have 'free' plan"
        assert "standard" in plan_ids, "Should have 'standard' plan"
        assert "pro" in plan_ids, "Should have 'pro' plan"
        print("✓ Billing plans has three tiers: free, standard, pro")
    
    def test_standard_tier_has_rent_payment_tracking(self):
        """Standard tier should include 'Rent payment tracking'"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        data = response.json()
        standard_plan = next((p for p in data["plans"] if p["id"] == "standard"), None)
        assert standard_plan is not None, "Standard plan not found"
        features = standard_plan.get("features", [])
        
        # Check for rent payment tracking feature
        rent_tracking_found = any("rent payment tracking" in f.lower() for f in features)
        assert rent_tracking_found, f"Standard plan should have 'Rent payment tracking'. Features: {features}"
        print("✓ Standard tier includes 'Rent payment tracking'")
    
    def test_pro_tier_has_ai_insights_dashboard(self):
        """Pro tier should include 'AI-Powered Insights Dashboard'"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        data = response.json()
        pro_plan = next((p for p in data["plans"] if p["id"] == "pro"), None)
        assert pro_plan is not None, "Pro plan not found"
        features = pro_plan.get("features", [])
        
        # Check for AI insights dashboard feature
        ai_insights_found = any("ai-powered insights" in f.lower() for f in features)
        assert ai_insights_found, f"Pro plan should have 'AI-Powered Insights Dashboard'. Features: {features}"
        print("✓ Pro tier includes 'AI-Powered Insights Dashboard'")
    
    def test_standard_tier_pricing(self):
        """Standard tier should have correct pricing"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        data = response.json()
        standard_plan = next((p for p in data["plans"] if p["id"] == "standard"), None)
        assert standard_plan is not None, "Standard plan not found"
        pricing = standard_plan.get("pricing", {})
        assert pricing.get("monthly") == 49, f"Expected monthly price $49, got {pricing.get('monthly')}"
        assert pricing.get("annual") == 39, f"Expected annual price $39/mo, got {pricing.get('annual')}"
        print("✓ Standard tier has correct pricing: $49/mo or $39/mo annually")
    
    def test_pro_tier_pricing(self):
        """Pro tier should have correct pricing"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        data = response.json()
        pro_plan = next((p for p in data["plans"] if p["id"] == "pro"), None)
        assert pro_plan is not None, "Pro plan not found"
        pricing = pro_plan.get("pricing", {})
        assert pricing.get("monthly") == 149, f"Expected monthly price $149, got {pricing.get('monthly')}"
        assert pricing.get("annual") == 119, f"Expected annual price $119/mo, got {pricing.get('annual')}"
        print("✓ Pro tier has correct pricing: $149/mo or $119/mo annually")


class TestMaintenanceAPI:
    """Test maintenance-related APIs"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        if login_resp.status_code != 200:
            pytest.skip("Manager login failed - skipping authenticated tests")
        token = login_resp.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_maintenance_requests_endpoint(self, auth_headers):
        """GET /api/maintenance-requests should return 200 when authenticated"""
        response = requests.get(f"{BASE_URL}/api/maintenance-requests", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Should return a list of maintenance requests"
        print(f"✓ GET /api/maintenance-requests returns 200 with {len(data)} requests")
    
    def test_contractors_endpoint(self, auth_headers):
        """GET /api/organizations/{{org_id}}/contractors should be accessible"""
        # First get org_id
        orgs_resp = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
        if orgs_resp.status_code != 200:
            pytest.skip("Could not get organizations")
        orgs = orgs_resp.json()
        if not orgs:
            pytest.skip("No organizations found")
        org_id = orgs[0]["org_id"]
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/contractors", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Should return a list of contractors"
        print(f"✓ GET /api/organizations/{org_id}/contractors returns 200 with {len(data)} contractors")


class TestContractorAssignment:
    """Test contractor assignment API"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        if login_resp.status_code != 200:
            pytest.skip("Manager login failed")
        token = login_resp.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_assign_contractor_endpoint_exists(self, auth_headers):
        """POST /api/maintenance-requests/{id}/assign-contractor should exist"""
        # First get maintenance requests
        requests_resp = requests.get(f"{BASE_URL}/api/maintenance-requests", headers=auth_headers)
        if requests_resp.status_code != 200:
            pytest.skip("Could not get maintenance requests")
        
        requests_list = requests_resp.json()
        if not requests_list:
            print("⚠ No maintenance requests found - creating test request first")
            # Get org_id first
            orgs_resp = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
            orgs = orgs_resp.json()
            if not orgs:
                pytest.skip("No organizations found")
            org_id = orgs[0]["org_id"]
            
            # Get properties to create a maintenance request
            props_resp = requests.get(f"{BASE_URL}/api/organizations/{org_id}/properties", headers=auth_headers)
            if props_resp.status_code != 200 or not props_resp.json():
                pytest.skip("No properties found to create maintenance request")
            prop_id = props_resp.json()[0]["id"]
            
            # Create a test maintenance request
            create_resp = requests.post(f"{BASE_URL}/api/maintenance-requests", 
                headers=auth_headers,
                json={
                    "property_id": prop_id,
                    "category": "other",
                    "priority": "medium",
                    "title": "Test request for contractor assignment",
                    "description": "Testing contractor assignment API"
                }
            )
            if create_resp.status_code not in [200, 201]:
                pytest.skip("Could not create test maintenance request")
            request_id = create_resp.json().get("id")
        else:
            request_id = requests_list[0]["id"]
        
        # Test that the endpoint exists (may fail without contractor_id but should not 404)
        response = requests.post(
            f"{BASE_URL}/api/maintenance-requests/{request_id}/assign-contractor",
            headers=auth_headers,
            json={"contractor_id": "test-contractor-id"}
        )
        # Expect 400 (contractor not found) or 404 (maintenance not found) but not 405 (method not allowed)
        assert response.status_code != 405, "Endpoint should exist (405 Method Not Allowed received)"
        print(f"✓ POST /api/maintenance-requests/{{id}}/assign-contractor endpoint exists (status: {response.status_code})")


class TestTenantPortalPayments:
    """Test tenant portal payment-related features"""
    
    def test_tenant_portal_rent_payments_requires_auth(self):
        """GET /api/tenant-portal/rent-payments should require authentication"""
        response = requests.get(f"{BASE_URL}/api/tenant-portal/rent-payments")
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
        print("✓ GET /api/tenant-portal/rent-payments requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
