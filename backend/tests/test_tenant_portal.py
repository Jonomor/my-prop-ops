"""
Tenant Portal API Tests
Tests cover: Registration, Login, Profile, Document Checklist, Application Status, Appointments, Messages, Resources
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_EMAIL_PREFIX = "TEST_tenant_"

class TestTenantPortalAuth:
    """Tenant Portal Authentication Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_email = f"{TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "test123456"
        self.test_name = "Test Tenant User"
        self.session = requests.Session()
    
    def test_tenant_register_success(self):
        """Test tenant registration creates account and returns token"""
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name,
            "phone": "+1555123456"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify token and tenant data returned
        assert "token" in data, "Token not returned"
        assert "tenant" in data, "Tenant data not returned"
        assert data["tenant"]["email"] == self.test_email
        assert data["tenant"]["name"] == self.test_name
        assert "id" in data["tenant"]
        print(f"✓ Tenant registration successful: {self.test_email}")
    
    def test_tenant_register_duplicate_email(self):
        """Test registration fails with duplicate email"""
        # First registration
        self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Duplicate registration
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Another Name"
        })
        
        assert response.status_code == 400, "Duplicate email should fail"
        print("✓ Duplicate email registration rejected")
    
    def test_tenant_login_success(self):
        """Test tenant login with valid credentials"""
        # Register first
        self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Login
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "tenant" in data
        assert data["tenant"]["email"] == self.test_email
        print(f"✓ Tenant login successful: {self.test_email}")
    
    def test_tenant_login_invalid_credentials(self):
        """Test login fails with wrong password"""
        # Register first
        self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Login with wrong password
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/login", json={
            "email": self.test_email,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, "Invalid credentials should return 401"
        print("✓ Invalid credentials rejected")


class TestTenantPortalProfile:
    """Tenant Portal Profile Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_email = f"{TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "test123456"
        self.session = requests.Session()
        
        # Register and get token
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Profile Test User"
        })
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_tenant_profile(self):
        """Test getting current tenant profile via /me endpoint"""
        response = self.session.get(f"{BASE_URL}/api/tenant-portal/me", headers=self.headers)
        
        assert response.status_code == 200, f"Profile fetch failed: {response.text}"
        data = response.json()
        assert data["email"] == self.test_email
        assert "application_stage" in data
        print("✓ Tenant profile fetched successfully")
    
    def test_update_tenant_profile(self):
        """Test updating tenant profile"""
        update_data = {
            "name": "Updated Name",
            "phone": "+1555999888",
            "address": "123 Test Street, City, ST 12345",
            "housing_program": "section_8",
            "voucher_number": "VOUCHER123",
            "household_size": 3,
            "annual_income": 35000,
            "income_sources": "Employment, SSI"
        }
        
        response = self.session.put(f"{BASE_URL}/api/tenant-portal/profile", 
                                    json=update_data, headers=self.headers)
        
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        
        # Verify updates
        assert data["name"] == "Updated Name"
        assert data["phone"] == "+1555999888"
        assert data["housing_program"] == "section_8"
        assert data["household_size"] == 3
        print("✓ Tenant profile updated successfully")
        
        # Verify persistence via GET
        get_response = self.session.get(f"{BASE_URL}/api/tenant-portal/me", headers=self.headers)
        get_data = get_response.json()
        assert get_data["name"] == "Updated Name"
        assert get_data["address"] == "123 Test Street, City, ST 12345"
        print("✓ Profile updates persisted correctly")


class TestTenantDocumentChecklist:
    """Tenant Portal Document Checklist Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_email = f"{TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "test123456"
        self.session = requests.Session()
        
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Checklist Test User"
        })
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_document_checklist(self):
        """Test getting document checklist"""
        response = self.session.get(f"{BASE_URL}/api/tenant-portal/checklist", headers=self.headers)
        
        assert response.status_code == 200, f"Checklist fetch failed: {response.text}"
        checklist = response.json()
        
        assert isinstance(checklist, list), "Checklist should be a list"
        assert len(checklist) > 0, "Checklist should have items"
        
        # Verify structure
        item = checklist[0]
        assert "id" in item
        assert "name" in item
        assert "description" in item
        assert "required" in item
        assert "status" in item
        print(f"✓ Document checklist fetched: {len(checklist)} items")


class TestTenantApplicationStatus:
    """Tenant Portal Application Status Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_email = f"{TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "test123456"
        self.session = requests.Session()
        
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Status Test User"
        })
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_application_status(self):
        """Test getting application status"""
        response = self.session.get(f"{BASE_URL}/api/tenant-portal/application-status", headers=self.headers)
        
        assert response.status_code == 200, f"Status fetch failed: {response.text}"
        data = response.json()
        
        assert "stage" in data
        assert "stages" in data
        assert isinstance(data["stages"], list)
        assert len(data["stages"]) > 0
        
        # Verify stage structure
        stage = data["stages"][0]
        assert "stage" in stage
        assert "label" in stage
        print(f"✓ Application status fetched: {data['stage']}")
    
    def test_submit_application(self):
        """Test submitting application (changing status)"""
        response = self.session.put(
            f"{BASE_URL}/api/tenant-portal/application-status?stage=application_submitted",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Status update failed: {response.text}"
        data = response.json()
        assert data["stage"] == "application_submitted"
        print("✓ Application submitted successfully")
        
        # Verify via GET
        get_response = self.session.get(f"{BASE_URL}/api/tenant-portal/application-status", headers=self.headers)
        get_data = get_response.json()
        assert get_data["stage"] == "application_submitted"
        print("✓ Application status persisted")


class TestTenantAppointments:
    """Tenant Portal Appointments Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_email = f"{TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "test123456"
        self.session = requests.Session()
        
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Appointment Test User"
        })
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_appointments_empty(self):
        """Test getting appointments list (initially empty)"""
        response = self.session.get(f"{BASE_URL}/api/tenant-portal/appointments", headers=self.headers)
        
        assert response.status_code == 200, f"Appointments fetch failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Appointments list fetched: {len(data)} items")
    
    def test_create_appointment(self):
        """Test creating a new appointment"""
        appointment_data = {
            "title": "Unit Inspection",
            "description": "Annual unit inspection",
            "date": "2026-02-15",
            "time": "10:00",
            "location": "123 Test St, Apt 4B",
            "type": "inspection"
        }
        
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/appointments",
                                     json=appointment_data, headers=self.headers)
        
        assert response.status_code == 200, f"Appointment creation failed: {response.text}"
        data = response.json()
        
        assert data["title"] == "Unit Inspection"
        assert "id" in data
        assert data["status"] == "scheduled"
        print("✓ Appointment created successfully")
        
        # Verify via GET
        get_response = self.session.get(f"{BASE_URL}/api/tenant-portal/appointments", headers=self.headers)
        appointments = get_response.json()
        assert len(appointments) == 1
        assert appointments[0]["title"] == "Unit Inspection"
        print("✓ Appointment persisted correctly")


class TestTenantMessages:
    """Tenant Portal Messaging Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_email = f"{TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "test123456"
        self.session = requests.Session()
        
        response = self.session.post(f"{BASE_URL}/api/tenant-portal/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Message Test User"
        })
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_conversations_empty(self):
        """Test getting conversations list (initially empty)"""
        response = self.session.get(f"{BASE_URL}/api/tenant-portal/conversations", headers=self.headers)
        
        assert response.status_code == 200, f"Conversations fetch failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Conversations list fetched: {len(data)} conversations")


class TestTenantResources:
    """Tenant Portal Educational Resources Tests"""
    
    def test_get_housing_resources(self):
        """Test getting housing resources (public endpoint)"""
        session = requests.Session()
        
        # This endpoint may or may not require auth - test both ways
        # First try without auth
        response = session.get(f"{BASE_URL}/api/tenant-portal/resources")
        
        # If 401, try with a test tenant
        if response.status_code == 401:
            test_email = f"{TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
            reg_response = session.post(f"{BASE_URL}/api/tenant-portal/register", json={
                "email": test_email,
                "password": "test123456",
                "name": "Resource Test User"
            })
            token = reg_response.json().get("token")
            response = session.get(f"{BASE_URL}/api/tenant-portal/resources", 
                                   headers={"Authorization": f"Bearer {token}"})
        
        assert response.status_code == 200, f"Resources fetch failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "programs" in data, "Programs should be present"
        assert len(data["programs"]) > 0, "Should have housing programs"
        
        # Verify program structure
        program = data["programs"][0]
        assert "id" in program
        assert "name" in program
        assert "description" in program
        assert "eligibility" in program
        print(f"✓ Housing resources fetched: {len(data['programs'])} programs")
        
        # Check for tenant rights and FAQs
        if "tenant_rights" in data:
            print(f"  - Tenant rights: {len(data['tenant_rights'])} items")
        if "faqs" in data:
            print(f"  - FAQs: {len(data['faqs'])} items")


class TestExistingTenantLogin:
    """Test with existing test tenant credentials"""
    
    def test_existing_tenant_login(self):
        """Test login with testtenant@test.com credentials"""
        session = requests.Session()
        
        # Try logging in with test credentials
        response = session.post(f"{BASE_URL}/api/tenant-portal/login", json={
            "email": "testtenant@test.com",
            "password": "test123"
        })
        
        if response.status_code == 401:
            # Test tenant may not exist yet, create it
            reg_response = session.post(f"{BASE_URL}/api/tenant-portal/register", json={
                "email": "testtenant@test.com",
                "password": "test123",
                "name": "Test Tenant"
            })
            if reg_response.status_code == 200:
                print("✓ Test tenant created: testtenant@test.com / test123")
            elif reg_response.status_code == 400:  # Already exists
                print("⚠ Test tenant exists but password may be different")
                pytest.skip("Test tenant exists with different password")
        else:
            assert response.status_code == 200
            data = response.json()
            assert "token" in data
            print(f"✓ Existing test tenant login successful: {data['tenant']['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
