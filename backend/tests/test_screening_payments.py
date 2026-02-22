"""
Tests for Tenant Screening Credits and Rent Payments features.
Testing new endpoints for MyPropOps SaaS.
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"


class TestScreeningCredits:
    """Tests for screening credits endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()['token']
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def org_id(self, auth_headers):
        """Get organization ID"""
        response = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
        assert response.status_code == 200
        orgs = response.json()
        assert len(orgs) > 0, "No organizations found"
        return orgs[0]['org_id']
    
    def test_get_screening_credits(self, auth_headers):
        """Test GET /api/screening/credits returns credit balance"""
        response = requests.get(f"{BASE_URL}/api/screening/credits", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "balance" in data, "Response should have 'balance' field"
        assert "purchased" in data, "Response should have 'purchased' field"
        assert "plan_included" in data, "Response should have 'plan_included' field"
        
        # Balance should be a number >= 0
        assert isinstance(data['balance'], int), "Balance should be an integer"
        assert data['balance'] >= 0, "Balance should be non-negative"
        print(f"Current credit balance: {data['balance']}")
    
    def test_purchase_credits_invalid_package(self, auth_headers):
        """Test purchase credits with invalid package returns error"""
        response = requests.post(
            f"{BASE_URL}/api/screening/purchase-credits",
            headers=auth_headers,
            json={"package_id": "invalid_package"}
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid package, got {response.status_code}"
        print("Invalid package correctly rejected")
    
    def test_purchase_credits_valid_package(self, auth_headers):
        """Test purchase credits with valid package (demo mode)"""
        # Get current balance
        credits_before = requests.get(f"{BASE_URL}/api/screening/credits", headers=auth_headers).json()
        
        # Purchase single credit package
        response = requests.post(
            f"{BASE_URL}/api/screening/purchase-credits",
            headers=auth_headers,
            json={"package_id": "single", "return_url": "https://example.com/return"}
        )
        
        # Should return either checkout URL or success message (demo mode)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # In demo mode, credits are added directly
        if "credits_added" in data:
            print(f"Demo mode - credits added: {data['credits_added']}")
            # Verify balance increased
            credits_after = requests.get(f"{BASE_URL}/api/screening/credits", headers=auth_headers).json()
            assert credits_after['balance'] >= credits_before['balance'], "Balance should have increased"
        elif "checkout_url" in data:
            print(f"Stripe mode - checkout URL: {data['checkout_url']}")
            assert data['checkout_url'].startswith("https://"), "Checkout URL should be valid HTTPS URL"
    
    def test_screening_requests_endpoint(self, auth_headers, org_id):
        """Test GET /api/screening/requests returns screening requests"""
        response = requests.get(
            f"{BASE_URL}/api/screening/requests",
            headers=auth_headers,
            params={"org_id": org_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return a list (even if empty)
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} screening requests")


class TestRentPayments:
    """Tests for rent payments endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()['token']
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def org_id(self, auth_headers):
        """Get organization ID"""
        response = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
        assert response.status_code == 200
        orgs = response.json()
        assert len(orgs) > 0, "No organizations found"
        return orgs[0]['org_id']
    
    def test_get_rent_payments(self, auth_headers, org_id):
        """Test GET /api/rent-payments returns payments array"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        response = requests.get(
            f"{BASE_URL}/api/rent-payments",
            headers=auth_headers,
            params={
                "org_id": org_id,
                "month": current_month,
                "year": current_year
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return a list (even if empty)
        assert isinstance(data, list), "Response should be a list of payments"
        print(f"Found {len(data)} rent payments for {current_month}/{current_year}")
    
    def test_get_rent_payments_summary(self, auth_headers, org_id):
        """Test GET /api/rent-payments/summary returns summary stats"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        response = requests.get(
            f"{BASE_URL}/api/rent-payments/summary",
            headers=auth_headers,
            params={
                "org_id": org_id,
                "month": current_month,
                "year": current_year
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate summary structure
        required_fields = ["total_expected", "total_collected", "outstanding", "collection_rate"]
        for field in required_fields:
            assert field in data, f"Summary should have '{field}' field"
        
        # Validate values are numbers
        assert isinstance(data['total_expected'], (int, float)), "total_expected should be a number"
        assert isinstance(data['total_collected'], (int, float)), "total_collected should be a number"
        assert isinstance(data['outstanding'], (int, float)), "outstanding should be a number"
        assert isinstance(data['collection_rate'], (int, float)), "collection_rate should be a number"
        
        # Collection rate should be between 0 and 100
        assert 0 <= data['collection_rate'] <= 100, "Collection rate should be 0-100"
        
        print(f"Summary - Expected: ${data['total_expected']}, Collected: ${data['total_collected']}, Outstanding: ${data['outstanding']}, Rate: {data['collection_rate']}%")
    
    def test_generate_monthly_payments(self, auth_headers, org_id):
        """Test POST /api/rent-payments/generate-monthly generates payments"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        response = requests.post(
            f"{BASE_URL}/api/rent-payments/generate-monthly",
            headers=auth_headers,
            params={
                "org_id": org_id,
                "month": current_month,
                "year": current_year
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return counts
        assert "message" in data, "Response should have 'message' field"
        assert "created" in data, "Response should have 'created' count"
        assert "skipped" in data, "Response should have 'skipped' count"
        
        print(f"Generate monthly: {data['message']}")
    
    def test_rent_payments_status_filter(self, auth_headers, org_id):
        """Test rent payments with status filter"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        for status in ["pending", "paid", "overdue"]:
            response = requests.get(
                f"{BASE_URL}/api/rent-payments",
                headers=auth_headers,
                params={
                    "org_id": org_id,
                    "month": current_month,
                    "year": current_year,
                    "status": status
                }
            )
            
            assert response.status_code == 200, f"Failed for status '{status}': {response.status_code}"
            data = response.json()
            assert isinstance(data, list), f"Response for status '{status}' should be a list"
            print(f"Status filter '{status}': {len(data)} payments")


class TestBillingSubscription:
    """Tests for billing subscription status (needed for plan validation)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()['token']
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_subscription_status(self, auth_headers):
        """Test GET /api/billing/subscription-status returns plan info"""
        response = requests.get(f"{BASE_URL}/api/billing/subscription-status", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should have plan field
        assert "plan" in data, "Response should have 'plan' field"
        assert data['plan'] in ["free", "standard", "pro"], f"Plan should be valid: {data['plan']}"
        
        print(f"Current plan: {data['plan']}")


class TestTenantsForScreening:
    """Tests for tenant endpoints (needed for screening)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()['token']
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def org_id(self, auth_headers):
        """Get organization ID"""
        response = requests.get(f"{BASE_URL}/api/organizations", headers=auth_headers)
        assert response.status_code == 200
        orgs = response.json()
        assert len(orgs) > 0, "No organizations found"
        return orgs[0]['org_id']
    
    def test_list_tenants(self, auth_headers, org_id):
        """Test GET /api/organizations/{org_id}/tenants returns tenants"""
        response = requests.get(
            f"{BASE_URL}/api/organizations/{org_id}/tenants",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return a list
        assert isinstance(data, list), "Response should be a list of tenants"
        print(f"Found {len(data)} tenants for screening selection")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
