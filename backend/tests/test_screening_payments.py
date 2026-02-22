"""
Test file for Screening and Rent Payments API endpoints.
Tests the new modular routers: screening.py and payments.py
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"


class TestAuth:
    """Helper class for authentication"""
    
    @staticmethod
    def login():
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json()
        return None


class TestScreeningEndpoints:
    """Tests for /api/screening endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup before each test"""
        auth = TestAuth.login()
        assert auth is not None, "Failed to login"
        self.token = auth['token']
        self.user = auth['user']
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get organization
        orgs_response = requests.get(f"{BASE_URL}/api/organizations", headers=self.headers)
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        assert len(orgs) > 0, "No organizations found"
        self.org_id = orgs[0]['org_id']
    
    def test_get_screening_requests_empty(self):
        """Test GET /api/screening/requests returns empty list when no screenings exist"""
        response = requests.get(
            f"{BASE_URL}/api/screening/requests?org_id={self.org_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ GET screening requests returned {len(data)} results")
    
    def test_screening_requires_auth(self):
        """Test that screening endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/screening/requests?org_id={self.org_id}")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Screening endpoint correctly requires authentication")
    
    def test_create_screening_requires_tenant(self):
        """Test that creating screening requires a valid tenant"""
        response = requests.post(
            f"{BASE_URL}/api/screening/requests?org_id={self.org_id}",
            headers=self.headers,
            json={
                "tenant_id": "invalid-tenant-id",
                "screening_type": "comprehensive",
                "include_credit": True,
                "include_criminal": True,
                "include_eviction": True,
                "include_income": False
            }
        )
        # Should fail with 404 because tenant doesn't exist
        assert response.status_code == 404, f"Expected 404 for invalid tenant, got {response.status_code}"
        print("✓ Screening creation correctly validates tenant existence")


class TestRentPaymentsEndpoints:
    """Tests for /api/rent-payments endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup before each test"""
        auth = TestAuth.login()
        assert auth is not None, "Failed to login"
        self.token = auth['token']
        self.user = auth['user']
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get organization
        orgs_response = requests.get(f"{BASE_URL}/api/organizations", headers=self.headers)
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        assert len(orgs) > 0, "No organizations found"
        self.org_id = orgs[0]['org_id']
    
    def test_get_rent_payments(self):
        """Test GET /api/rent-payments returns payments list"""
        response = requests.get(
            f"{BASE_URL}/api/rent-payments?org_id={self.org_id}&month=2&year=2026",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ GET rent payments returned {len(data)} results")
    
    def test_get_rent_summary(self):
        """Test GET /api/rent-payments/summary returns summary"""
        response = requests.get(
            f"{BASE_URL}/api/rent-payments/summary?org_id={self.org_id}&month=2&year=2026",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # Verify expected fields in summary
        assert "total_expected" in data, "Missing total_expected in summary"
        assert "total_collected" in data, "Missing total_collected in summary"
        assert "total_outstanding" in data, "Missing total_outstanding in summary"
        assert "collection_rate" in data, "Missing collection_rate in summary"
        print(f"✓ GET rent summary: Expected={data['total_expected']}, Collected={data['total_collected']}, Rate={data['collection_rate']}%")
    
    def test_rent_payments_requires_auth(self):
        """Test that rent-payments endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/rent-payments?org_id={self.org_id}&month=2&year=2026")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Rent payments endpoint correctly requires authentication")
    
    def test_create_payment_requires_valid_tenant_unit(self):
        """Test that creating payment requires valid tenant and unit"""
        response = requests.post(
            f"{BASE_URL}/api/rent-payments?org_id={self.org_id}",
            headers=self.headers,
            json={
                "tenant_id": "invalid-tenant-id",
                "unit_id": "invalid-unit-id",
                "amount": 1500.00,
                "due_date": (datetime.now() + timedelta(days=30)).isoformat()
            }
        )
        # Should fail with 404 because tenant/unit doesn't exist
        assert response.status_code == 404, f"Expected 404 for invalid tenant/unit, got {response.status_code}"
        print("✓ Payment creation correctly validates tenant/unit existence")


class TestIntegration:
    """Integration tests for screening and payments with real data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup before each test"""
        auth = TestAuth.login()
        assert auth is not None, "Failed to login"
        self.token = auth['token']
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get organization
        orgs_response = requests.get(f"{BASE_URL}/api/organizations", headers=self.headers)
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        assert len(orgs) > 0, "No organizations found"
        self.org_id = orgs[0]['org_id']
    
    def test_get_tenants_for_screening(self):
        """Test that we can get tenants to use for screening"""
        response = requests.get(
            f"{BASE_URL}/api/organizations/{self.org_id}/tenants",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        tenants = response.json()
        print(f"✓ Found {len(tenants)} tenants for screening")
        
        # If tenants exist, try to get screening details
        if len(tenants) > 0:
            tenant = tenants[0]
            print(f"  - Sample tenant: {tenant.get('name', 'N/A')} ({tenant.get('email', 'N/A')})")
    
    def test_get_units_for_payments(self):
        """Test that we can get units to use for payments"""
        response = requests.get(
            f"{BASE_URL}/api/organizations/{self.org_id}/units",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        units = response.json()
        print(f"✓ Found {len(units)} units for rent payments")
        
        # If units exist, show some details
        if len(units) > 0:
            unit = units[0]
            print(f"  - Sample unit: Unit {unit.get('unit_number', 'N/A')} - ${unit.get('rent_amount', 0)}/mo")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
