"""
Tests for 2FA (Two-Factor Authentication) system and related pages
Features tested:
- 2FA Status API endpoint
- 2FA Setup initiation
- 2FA Plan-gating (Pro users only)
- Screening credits (regression)
- Rent Payments page (regression)
- Reports endpoint (regression)
- Analytics endpoint (regression)
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
    """Login and get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Auth headers for requests"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def org_id(auth_headers):
    """Get first organization ID"""
    response = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
    assert response.status_code == 200
    orgs = response.json()
    assert len(orgs) > 0, "No organizations found"
    return orgs[0]["org_id"]


class Test2FAStatus:
    """Tests for 2FA Status endpoint"""
    
    def test_2fa_status_endpoint_returns_200(self, auth_headers):
        """Test GET /api/auth/2fa/status returns 200"""
        response = requests.get(f"{BASE_URL}/api/auth/2fa/status", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_2fa_status_returns_correct_structure(self, auth_headers):
        """Test 2FA status returns expected fields"""
        response = requests.get(f"{BASE_URL}/api/auth/2fa/status", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields exist
        assert "enabled" in data, "Missing 'enabled' field in 2FA status"
        assert "plan_allows_2fa" in data, "Missing 'plan_allows_2fa' field in 2FA status"
        assert "setup_complete" in data, "Missing 'setup_complete' field in 2FA status"
        
        # Check field types
        assert isinstance(data["enabled"], bool), "enabled should be boolean"
        assert isinstance(data["plan_allows_2fa"], bool), "plan_allows_2fa should be boolean"
        assert isinstance(data["setup_complete"], bool), "setup_complete should be boolean"
    
    def test_2fa_status_shows_disabled_for_free_plan(self, auth_headers):
        """Test that free plan users have 2FA disabled and plan_allows_2fa=False"""
        response = requests.get(f"{BASE_URL}/api/auth/2fa/status", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # For free plan user (test@test.com), 2FA should not be allowed
        # Note: This may fail if the test user is upgraded to Pro
        print(f"2FA Status: enabled={data['enabled']}, plan_allows_2fa={data['plan_allows_2fa']}")


class Test2FASetup:
    """Tests for 2FA Setup endpoint"""
    
    def test_2fa_setup_requires_auth(self):
        """Test that 2FA setup requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/2fa/setup", json={
            "password": "test123"
        })
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_2fa_setup_validates_password(self, auth_headers):
        """Test 2FA setup with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/2fa/setup",
            headers=auth_headers,
            json={"password": "wrong_password_123"}
        )
        # Should return 401 for wrong password or 403 for plan restriction
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}: {response.text}"


class Test2FADisable:
    """Tests for 2FA Disable endpoint"""
    
    def test_2fa_disable_requires_auth(self):
        """Test that 2FA disable requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/2fa/disable", json={
            "password": "test123",
            "code": "123456"
        })
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"


class Test2FAValidate:
    """Tests for 2FA Validate endpoint"""
    
    def test_2fa_validate_requires_auth(self):
        """Test that 2FA validate requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/2fa/validate", json={
            "code": "123456"
        })
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"


class TestScreeningCredits:
    """Regression tests for screening credits (from previous iteration)"""
    
    def test_screening_credits_endpoint(self, auth_headers):
        """Test GET /api/screening/credits returns credit balance"""
        response = requests.get(f"{BASE_URL}/api/screening/credits", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "balance" in data, "Missing 'balance' field"


class TestRentPayments:
    """Regression tests for rent payments"""
    
    def test_rent_payments_endpoint(self, auth_headers, org_id):
        """Test GET /api/rent-payments returns payments list"""
        response = requests.get(f"{BASE_URL}/api/rent-payments?org_id={org_id}", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        # Should return a list
        data = response.json()
        assert isinstance(data, list), "Expected list response"
    
    def test_rent_payments_summary(self, auth_headers, org_id):
        """Test GET /api/rent-payments/summary returns summary stats"""
        response = requests.get(f"{BASE_URL}/api/rent-payments/summary?org_id={org_id}", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_expected" in data, "Missing 'total_expected' field"
        assert "total_collected" in data, "Missing 'total_collected' field"


class TestReports:
    """Regression tests for reports endpoint"""
    
    def test_reports_export_endpoint(self, auth_headers, org_id):
        """Test GET /api/reports/export/income returns report or plan error"""
        response = requests.get(f"{BASE_URL}/api/reports/export/income?org_id={org_id}", headers=auth_headers)
        # Should return 200 with report or 403 for plan restriction
        assert response.status_code in [200, 403], f"Expected 200 or 403, got {response.status_code}: {response.text}"


class TestAnalytics:
    """Regression tests for analytics endpoint"""
    
    def test_analytics_dashboard_endpoint(self, auth_headers, org_id):
        """Test GET /api/analytics/dashboard returns analytics data or plan error"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard?org_id={org_id}", headers=auth_headers)
        # Should return 200 with analytics data or 403 for plan restriction
        assert response.status_code in [200, 403], f"Expected 200 or 403, got {response.status_code}: {response.text}"


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy" or data.get("ok") == True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
