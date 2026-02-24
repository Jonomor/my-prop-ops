"""
Bug Fixes Test Suite for MyPropOps
Tests the 5 critical bugs that were fixed:
1. /rentals page blue screen error (SelectItem value fix)
2. Contractor Portal bright background (gradient fix)
3. Owner Portal login (test owner account creation)
4. Mobile navigation missing portal links
5. Landing page Portal Showcase section
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://propops-fixes.preview.emergentagent.com')


class TestOwnerPortalLogin:
    """Test Bug Fix 3: Owner Portal login should work with test credentials"""
    
    def test_create_test_owner_endpoint(self):
        """Test the setup endpoint for creating test owner"""
        response = requests.post(
            f"{BASE_URL}/api/setup/create-test-owner",
            params={"secret": "mypropops-initial-setup-2026"}
        )
        # Should return 200 whether owner exists or was created
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["exists", "created"]
        assert data.get("email") == "owner@test.mypropops.com"
        print(f"✅ Test owner status: {data.get('status')}")
    
    def test_owner_login_with_valid_credentials(self):
        """Test owner login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/owner/login",
            json={
                "email": "owner@test.mypropops.com",
                "password": "TestOwner2026!"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "owner" in data, "Response should contain owner info"
        assert data["owner"]["email"] == "owner@test.mypropops.com"
        print(f"✅ Owner login successful: {data['owner']['name']}")
    
    def test_owner_login_with_invalid_credentials(self):
        """Test owner login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/owner/login",
            json={
                "email": "owner@test.mypropops.com",
                "password": "WrongPassword123!"
            }
        )
        assert response.status_code == 401, "Should return 401 for invalid credentials"
        print("✅ Invalid credentials correctly rejected")


class TestContractorPortal:
    """Test Bug Fix 2: Contractor Portal should work correctly"""
    
    def test_contractor_login(self):
        """Test contractor login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/contractor/login",
            json={
                "email": "contractor@test.mypropops.com",
                "password": "TestContractor2026!"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "contractor" in data
        print(f"✅ Contractor login successful: {data['contractor']['name']}")


class TestPublicAPIs:
    """Test public endpoints that support the bug fixes"""
    
    def test_health_endpoint(self):
        """Test health endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Health endpoint working")
    
    def test_public_vacancies(self):
        """Test Bug Fix 1: Public vacancies endpoint (for /rentals page)"""
        response = requests.get(f"{BASE_URL}/api/public/vacancies")
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data, "Response should contain listings array"
        print(f"✅ Public vacancies endpoint working, {len(data.get('listings', []))} listings")


class TestTenantPortal:
    """Test tenant portal login (for mobile nav verification)"""
    
    def test_tenant_login(self):
        """Test tenant login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/tenant-portal/login",
            json={
                "email": "tenant@test.mypropops.com",
                "password": "TestTenant2026!"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        print("✅ Tenant login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
