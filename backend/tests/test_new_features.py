"""
Test suite for new feature pages:
- Reports (Standard/Pro plan required)
- Analytics (Pro plan required)
- API Keys (Pro plan required)
- Branding (Pro plan required)
- Billing page with 3 tiers (Free, Standard, Pro)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return headers with authentication"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestBillingPlans:
    """Test billing plans endpoint - should show 3 tiers now"""
    
    def test_get_billing_plans(self, auth_headers):
        """GET /api/billing/plans should return 3 plans: free, standard, pro"""
        response = requests.get(f"{BASE_URL}/api/billing/plans", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "plans" in data, "Response should contain 'plans' key"
        
        plans = data["plans"]
        plan_ids = [p["id"] for p in plans]
        
        # Verify 3 tiers (Enterprise removed)
        assert "free" in plan_ids, "Free plan should exist"
        assert "standard" in plan_ids, "Standard plan should exist"
        assert "pro" in plan_ids, "Pro plan should exist"
        assert "enterprise" not in plan_ids, "Enterprise plan should NOT exist (removed)"
        assert len(plans) == 3, f"Should have exactly 3 plans, got {len(plans)}"
        
        print("✓ Billing plans API returns 3 tiers: Free, Standard, Pro")
    
    def test_billing_plan_pricing(self, auth_headers):
        """Verify correct pricing for each plan"""
        response = requests.get(f"{BASE_URL}/api/billing/plans", headers=auth_headers)
        assert response.status_code == 200
        
        plans = {p["id"]: p for p in response.json()["plans"]}
        
        # Free plan
        assert plans["free"]["pricing"]["monthly"] == 0, "Free plan should be $0/month"
        assert plans["free"]["pricing"]["annual"] == 0, "Free plan should be $0/year"
        
        # Standard plan
        assert plans["standard"]["pricing"]["monthly"] == 49, "Standard should be $49/month"
        assert plans["standard"]["pricing"]["annual"] == 39, "Standard should be $39/month annual"
        
        # Pro plan
        assert plans["pro"]["pricing"]["monthly"] == 149, "Pro should be $149/month"
        assert plans["pro"]["pricing"]["annual"] == 119, "Pro should be $119/month annual"
        
        print("✓ Pricing verified: Free $0, Standard $39/$49, Pro $119/$149")
    
    def test_billing_plan_features(self, auth_headers):
        """Verify plan features match requirements"""
        response = requests.get(f"{BASE_URL}/api/billing/plans", headers=auth_headers)
        assert response.status_code == 200
        
        plans = {p["id"]: p for p in response.json()["plans"]}
        
        # Standard features should include new features
        standard_features = " ".join(plans["standard"]["features"]).lower()
        assert "contractor" in standard_features or "export" in standard_features, \
            "Standard should include Contractor Portal or Exportable reports"
        
        # Pro features should include analytics, branding, API
        pro_features = " ".join(plans["pro"]["features"]).lower()
        assert "analytics" in pro_features, "Pro should include analytics"
        assert "branding" in pro_features or "custom" in pro_features, "Pro should include custom branding"
        assert "api" in pro_features, "Pro should include API access"
        
        print("✓ Plan features include Contractor Portal, Reports, Analytics, Branding, API")


class TestSubscriptionStatus:
    """Test subscription status endpoint"""
    
    def test_get_subscription_status(self, auth_headers):
        """GET /api/billing/subscription-status"""
        response = requests.get(f"{BASE_URL}/api/billing/subscription-status", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "plan" in data, "Response should contain 'plan'"
        assert data["plan"] in ["free", "standard", "pro"], f"Plan should be one of free/standard/pro, got {data['plan']}"
        
        print(f"✓ Subscription status returns plan: {data['plan']}")


class TestReportsEndpoint:
    """Test reports export endpoint (Standard/Pro required)"""
    
    def test_reports_export_properties_csv(self, auth_headers):
        """GET /api/reports/export/properties?format=csv"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/properties",
            params={"format": "csv"},
            headers=auth_headers
        )
        
        # Either succeeds (Standard/Pro) or returns 403 (Free)
        if response.status_code == 200:
            assert "text/csv" in response.headers.get("content-type", ""), "Should return CSV"
            print("✓ Reports export CSV works (user has Standard/Pro plan)")
        elif response.status_code == 403:
            assert "Standard" in response.text or "Pro" in response.text, "Should mention plan requirement"
            print("✓ Reports export correctly requires Standard/Pro plan")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_reports_export_properties_pdf(self, auth_headers):
        """GET /api/reports/export/properties?format=pdf"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/properties",
            params={"format": "pdf"},
            headers=auth_headers
        )
        
        if response.status_code == 200:
            assert "application/pdf" in response.headers.get("content-type", ""), "Should return PDF"
            print("✓ Reports export PDF works (user has Standard/Pro plan)")
        elif response.status_code == 403:
            print("✓ Reports export PDF correctly requires Standard/Pro plan")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_reports_all_types_exist(self, auth_headers):
        """Test all 4 report types: properties, tenants, maintenance, inspections"""
        report_types = ["properties", "tenants", "maintenance", "inspections"]
        
        for report_type in report_types:
            response = requests.get(
                f"{BASE_URL}/api/reports/export/{report_type}",
                params={"format": "csv"},
                headers=auth_headers
            )
            # Should be either 200 (success) or 403 (plan required), not 404
            assert response.status_code in [200, 403], \
                f"Report type '{report_type}' returned {response.status_code}"
        
        print("✓ All 4 report types exist: properties, tenants, maintenance, inspections")


class TestAnalyticsEndpoint:
    """Test analytics dashboard endpoint (Pro required)"""
    
    def test_analytics_dashboard(self, auth_headers):
        """GET /api/analytics/dashboard"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard", headers=auth_headers)
        
        # Analytics endpoint should always return data (demo for non-Pro)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "occupancy" in data, "Should have occupancy data"
        assert "revenue" in data, "Should have revenue data"
        assert "maintenance" in data, "Should have maintenance data"
        assert "tenants" in data, "Should have tenants data"
        assert "monthlyData" in data, "Should have monthly data"
        
        print("✓ Analytics dashboard endpoint returns proper data structure")


class TestApiKeysEndpoint:
    """Test API keys management endpoint (Pro required)"""
    
    def test_list_api_keys(self, auth_headers):
        """GET /api/api-keys"""
        response = requests.get(f"{BASE_URL}/api/api-keys", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "keys" in data, "Response should contain 'keys'"
        
        # If not Pro, should indicate plan required
        if "plan_required" in data:
            assert data["plan_required"] == "pro", "Should require Pro plan"
            print("✓ API keys correctly shows Pro plan required")
        else:
            print(f"✓ API keys list returns {len(data['keys'])} keys")
    
    def test_create_api_key_requires_pro(self, auth_headers):
        """POST /api/api-keys should require Pro plan"""
        response = requests.post(
            f"{BASE_URL}/api/api-keys",
            json={"name": "Test API Key"},
            headers=auth_headers
        )
        
        # Either succeeds (Pro) or returns 403 (not Pro)
        if response.status_code == 200:
            data = response.json()
            assert "key" in data, "Should return the API key"
            print("✓ API key creation works (user has Pro plan)")
            
            # Clean up - delete the created key
            if "id" in data:
                requests.delete(f"{BASE_URL}/api/api-keys/{data['id']}", headers=auth_headers)
        elif response.status_code == 403:
            assert "Pro" in response.text, "Should mention Pro plan requirement"
            print("✓ API key creation correctly requires Pro plan")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestBrandingEndpoint:
    """Test branding endpoint (Pro required)"""
    
    def test_get_branding(self, auth_headers):
        """GET /api/branding"""
        response = requests.get(f"{BASE_URL}/api/branding", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "primary_color" in data, "Should have primary_color"
        assert "company_name" in data, "Should have company_name"
        assert "logo_url" in data, "Should have logo_url"
        
        print("✓ Branding endpoint returns correct structure")
    
    def test_update_branding_requires_pro(self, auth_headers):
        """POST /api/branding should require Pro plan"""
        response = requests.post(
            f"{BASE_URL}/api/branding",
            data={"primary_color": "#ff0000", "company_name": "Test Company"},
            headers=auth_headers
        )
        
        # Either succeeds (Pro) or returns 403 (not Pro)
        if response.status_code == 200:
            print("✓ Branding update works (user has Pro plan)")
        elif response.status_code == 403:
            assert "Pro" in response.text, "Should mention Pro plan requirement"
            print("✓ Branding update correctly requires Pro plan")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestHealthEndpoints:
    """Basic health checks"""
    
    def test_api_health(self):
        """GET /api/health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("✓ API health check passed")
    
    def test_root_endpoint(self):
        """GET /"""
        response = requests.get(f"{BASE_URL}")
        assert response.status_code == 200, f"Root endpoint failed: {response.status_code}"
        print("✓ Root endpoint accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
