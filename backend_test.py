#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class PropOpsAPITester:
    def __init__(self, base_url="https://propops.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.org_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.property_id = None
        self.unit_id = None
        self.tenant_id = None
        self.inspection_id = None
        self.document_id = None
        self.invite_id = None
        self.invite_token = None
        
        # Staff user for role testing
        self.staff_token = None
        self.staff_user_id = None

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {error}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "error": error
        })

    def make_request(self, method, endpoint, data=None, files=None):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            headers.pop('Content-Type', None)  # Let requests set it for multipart
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                print(f"Unsupported method: {method}")
                return None
            
            return response
        except Exception as e:
            print(f"Request error for {method} {url}: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

    def test_health_check(self):
        """Test health endpoint"""
        response = self.make_request('GET', 'health')
        success = response and response.status_code == 200
        self.log_test("Health Check", success, 
                     f"Status: {response.status_code if response else 'No response'}")
        return success

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_name = f"Test User {uuid.uuid4().hex[:6]}"
        
        data = {
            "email": test_email,
            "password": "testpass123",
            "name": test_name
        }
        
        response = self.make_request('POST', 'auth/register', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.token = result.get('token')
            self.user_id = result.get('user', {}).get('id')
            success = bool(self.token and self.user_id)
            self.log_test("User Registration", success, 
                         f"User ID: {self.user_id}, Token received: {bool(self.token)}")
            return success
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("User Registration", False, error=error_msg)
            return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # We'll use the registered user's credentials
        if not hasattr(self, '_test_email'):
            self.log_test("User Login", False, error="No test user available")
            return False
            
        data = {
            "email": self._test_email,
            "password": "testpass123"
        }
        
        response = self.make_request('POST', 'auth/login', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.token = result.get('token')
            success = bool(self.token)
            self.log_test("User Login", success, f"Token received: {bool(self.token)}")
            return success
        else:
            error_msg = response.json().get('detail', 'Invalid credentials') if response else 'No response'
            self.log_test("User Login", False, error=error_msg)
            return False

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        if not self.token:
            self.log_test("Auth Me", False, error="No token available")
            return False
            
        response = self.make_request('GET', 'auth/me')
        
        if response and response.status_code == 200:
            result = response.json()
            success = 'id' in result and 'email' in result and 'name' in result
            self.log_test("Auth Me", success, f"User data: {result.get('name', 'N/A')}")
            return success
        else:
            error_msg = response.json().get('detail', 'Unauthorized') if response else 'No response'
            self.log_test("Auth Me", False, error=error_msg)
            return False

    def test_get_organizations(self):
        """Test getting user organizations"""
        if not self.token:
            self.log_test("Get Organizations", False, error="No token available")
            return False
            
        response = self.make_request('GET', 'organizations')
        
        if response and response.status_code == 200:
            orgs = response.json()
            success = isinstance(orgs, list) and len(orgs) > 0
            if success:
                self.org_id = orgs[0]['org_id']
            self.log_test("Get Organizations", success, 
                         f"Organizations count: {len(orgs) if success else 0}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to get orgs') if response else 'No response'
            self.log_test("Get Organizations", False, error=error_msg)
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        if not self.org_id:
            self.log_test("Dashboard Stats", False, error="No org_id available")
            return False
            
        response = self.make_request('GET', f'organizations/{self.org_id}/dashboard')
        
        if response and response.status_code == 200:
            stats = response.json()
            required_fields = ['total_properties', 'total_units', 'total_tenants', 'active_tenants', 'pending_inspections']
            success = all(field in stats for field in required_fields)
            self.log_test("Dashboard Stats", success, 
                         f"Stats: {stats if success else 'Missing fields'}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to get stats') if response else 'No response'
            self.log_test("Dashboard Stats", False, error=error_msg)
            return False

    def test_create_property(self):
        """Test creating a property"""
        if not self.org_id:
            self.log_test("Create Property", False, error="No org_id available")
            return False
            
        data = {
            "name": f"Test Property {uuid.uuid4().hex[:6]}",
            "address": "123 Test Street, Test City, TC 12345",
            "description": "A test property for API testing",
            "total_units": 5
        }
        
        response = self.make_request('POST', f'organizations/{self.org_id}/properties', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.property_id = result.get('id')
            success = bool(self.property_id)
            self.log_test("Create Property", success, 
                         f"Property ID: {self.property_id}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to create') if response else 'No response'
            self.log_test("Create Property", False, error=error_msg)
            return False

    def test_list_properties(self):
        """Test listing properties"""
        if not self.org_id:
            self.log_test("List Properties", False, error="No org_id available")
            return False
            
        response = self.make_request('GET', f'organizations/{self.org_id}/properties')
        
        if response and response.status_code == 200:
            properties = response.json()
            success = isinstance(properties, list)
            self.log_test("List Properties", success, 
                         f"Properties count: {len(properties) if success else 0}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to list') if response else 'No response'
            self.log_test("List Properties", False, error=error_msg)
            return False

    def test_create_unit(self):
        """Test creating a unit"""
        if not self.property_id:
            self.log_test("Create Unit", False, error="No property_id available")
            return False
            
        data = {
            "property_id": self.property_id,
            "unit_number": f"Unit-{uuid.uuid4().hex[:4]}",
            "bedrooms": 2,
            "bathrooms": 1.5,
            "square_feet": 850,
            "rent_amount": 1200.00
        }
        
        response = self.make_request('POST', f'organizations/{self.org_id}/units', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.unit_id = result.get('id')
            success = bool(self.unit_id)
            self.log_test("Create Unit", success, 
                         f"Unit ID: {self.unit_id}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to create unit') if response else 'No response'
            self.log_test("Create Unit", False, error=error_msg)
            return False

    def test_create_tenant(self):
        """Test creating a tenant"""
        if not self.org_id:
            self.log_test("Create Tenant", False, error="No org_id available")
            return False
            
        data = {
            "name": f"Test Tenant {uuid.uuid4().hex[:6]}",
            "email": f"tenant_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "+1-555-0123",
            "unit_id": self.unit_id,
            "lease_start": (datetime.now()).strftime('%Y-%m-%d'),
            "lease_end": (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'),
            "status": "active"
        }
        
        response = self.make_request('POST', f'organizations/{self.org_id}/tenants', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.tenant_id = result.get('id')
            success = bool(self.tenant_id)
            self.log_test("Create Tenant", success, 
                         f"Tenant ID: {self.tenant_id}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to create tenant') if response else 'No response'
            self.log_test("Create Tenant", False, error=error_msg)
            return False

    def test_list_tenants(self):
        """Test listing tenants"""
        if not self.org_id:
            self.log_test("List Tenants", False, error="No org_id available")
            return False
            
        response = self.make_request('GET', f'organizations/{self.org_id}/tenants')
        
        if response and response.status_code == 200:
            tenants = response.json()
            success = isinstance(tenants, list)
            self.log_test("List Tenants", success, 
                         f"Tenants count: {len(tenants) if success else 0}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to list tenants') if response else 'No response'
            self.log_test("List Tenants", False, error=error_msg)
            return False

    def test_create_inspection(self):
        """Test creating an inspection"""
        if not self.property_id:
            self.log_test("Create Inspection", False, error="No property_id available")
            return False
            
        data = {
            "property_id": self.property_id,
            "unit_id": self.unit_id,
            "scheduled_date": (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
            "notes": "Test inspection for API testing"
        }
        
        response = self.make_request('POST', f'organizations/{self.org_id}/inspections', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.inspection_id = result.get('id')
            success = bool(self.inspection_id)
            self.log_test("Create Inspection", success, 
                         f"Inspection ID: {self.inspection_id}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to create inspection') if response else 'No response'
            self.log_test("Create Inspection", False, error=error_msg)
            return False

    def test_list_inspections(self):
        """Test listing inspections"""
        if not self.org_id:
            self.log_test("List Inspections", False, error="No org_id available")
            return False
            
        response = self.make_request('GET', f'organizations/{self.org_id}/inspections')
        
        if response and response.status_code == 200:
            inspections = response.json()
            success = isinstance(inspections, list)
            self.log_test("List Inspections", success, 
                         f"Inspections count: {len(inspections) if success else 0}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to list inspections') if response else 'No response'
            self.log_test("List Inspections", False, error=error_msg)
            return False

    def test_list_documents(self):
        """Test listing documents"""
        if not self.org_id:
            self.log_test("List Documents", False, error="No org_id available")
            return False
            
        response = self.make_request('GET', f'organizations/{self.org_id}/documents')
        
        if response and response.status_code == 200:
            documents = response.json()
            success = isinstance(documents, list)
            self.log_test("List Documents", success, 
                         f"Documents count: {len(documents) if success else 0}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to list documents') if response else 'No response'
            self.log_test("List Documents", False, error=error_msg)
            return False

    def test_notifications(self):
        """Test notifications endpoint"""
        if not self.token:
            self.log_test("List Notifications", False, error="No token available")
            return False
            
        response = self.make_request('GET', 'notifications')
        
        if response and response.status_code == 200:
            notifications = response.json()
            success = isinstance(notifications, list)
            self.log_test("List Notifications", success, 
                         f"Notifications count: {len(notifications) if success else 0}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to list notifications') if response else 'No response'
            self.log_test("List Notifications", False, error=error_msg)
            return False

    def test_audit_logs(self):
        """Test audit logs endpoint (admin only)"""
        if not self.org_id:
            self.log_test("List Audit Logs", False, error="No org_id available")
            return False
            
        response = self.make_request('GET', f'organizations/{self.org_id}/audit-logs')
        
        if response and response.status_code == 200:
            logs = response.json()
            success = isinstance(logs, list)
            self.log_test("List Audit Logs", success, 
                         f"Audit logs count: {len(logs) if success else 0}")
            return success
        elif response and response.status_code == 403:
            # Expected for non-admin users
            self.log_test("List Audit Logs", True, "Access denied (expected for non-admin)")
            return True
        else:
            error_msg = response.json().get('detail', 'Failed to list audit logs') if response else 'No response'
            self.log_test("List Audit Logs", False, error=error_msg)
            return False

    # ============== NEW FEATURE TESTS ==============
    
    def test_create_staff_user(self):
        """Create a staff user for role enforcement testing"""
        self.staff_email = f"staff_{uuid.uuid4().hex[:8]}@example.com"
        test_name = f"Staff User {uuid.uuid4().hex[:6]}"
        
        data = {
            "email": self.staff_email,
            "password": "staffpass123",
            "name": test_name
        }
        
        response = self.make_request('POST', 'auth/register', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.staff_token = result.get('token')
            self.staff_user_id = result.get('user', {}).get('id')
            success = bool(self.staff_token and self.staff_user_id)
            self.log_test("Create Staff User", success, 
                         f"Staff User ID: {self.staff_user_id}")
            return success
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Create Staff User", False, error=error_msg)
            return False

    def test_team_invitation_create(self):
        """Test creating team invitation (Admin only)"""
        if not self.org_id or not hasattr(self, 'staff_email'):
            self.log_test("Create Team Invitation", False, error="No org_id or staff_email available")
            return False
            
        data = {
            "email": self.staff_email,  # Invite the staff user we just created
            "role": "staff"
        }
        
        response = self.make_request('POST', f'organizations/{self.org_id}/invites', data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.invite_id = result.get('id')
            self.invite_token = result.get('token')
            success = bool(self.invite_id and self.invite_token)
            self.log_test("Create Team Invitation", success, 
                         f"Invite ID: {self.invite_id}, Token: {bool(self.invite_token)}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to create invite') if response else 'No response'
            self.log_test("Create Team Invitation", False, error=error_msg)
            return False

    def test_staff_accept_invitation(self):
        """Test staff user accepting invitation to join organization"""
        if not self.invite_token or not self.staff_token:
            self.log_test("Staff Accept Invitation", False, error="No invite token or staff token available")
            return False
        
        # Switch to staff token to accept invitation
        original_token = self.token
        self.token = self.staff_token
        
        data = {
            "token": self.invite_token
        }
        
        response = self.make_request('POST', 'invites/accept', data)
        
        # Restore original token
        self.token = original_token
        
        if response and response.status_code == 200:
            result = response.json()
            success = 'message' in result and 'org_id' in result
            self.log_test("Staff Accept Invitation", success, 
                         f"Joined organization: {result.get('message', 'N/A')}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to accept invite') if response else 'No response'
            self.log_test("Staff Accept Invitation", False, error=error_msg)
            return False

    def test_team_invitation_list(self):
        """Test listing team invitations (Admin only)"""
        if not self.org_id:
            self.log_test("List Team Invitations", False, error="No org_id available")
            return False
            
        response = self.make_request('GET', f'organizations/{self.org_id}/invites')
        
        if response and response.status_code == 200:
            invites = response.json()
            success = isinstance(invites, list)
            self.log_test("List Team Invitations", success, 
                         f"Invites count: {len(invites) if success else 0}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to list invites') if response else 'No response'
            self.log_test("List Team Invitations", False, error=error_msg)
            return False

    def test_invite_token_lookup(self):
        """Test public invite token lookup"""
        # Create a separate invitation for testing token lookup
        if not self.org_id:
            self.log_test("Invite Token Lookup", False, error="No org_id available")
            return False
            
        # Create a test invitation
        data = {
            "email": f"lookup_test_{uuid.uuid4().hex[:8]}@example.com",
            "role": "manager"
        }
        
        response = self.make_request('POST', f'organizations/{self.org_id}/invites', data)
        
        if not response or response.status_code != 200:
            self.log_test("Invite Token Lookup", False, error="Failed to create test invite")
            return False
            
        test_token = response.json().get('token')
        
        # Now test the lookup
        response = self.make_request('GET', f'invites/{test_token}')
        
        if response and response.status_code == 200:
            result = response.json()
            success = 'org_name' in result and 'email' in result and 'role' in result
            self.log_test("Invite Token Lookup", success, 
                         f"Invite details: {result.get('org_name', 'N/A')}")
            return success
        else:
            error_msg = response.json().get('detail', 'Invalid token') if response else 'No response'
            self.log_test("Invite Token Lookup", False, error=error_msg)
            return False

    def test_calendar_endpoint(self):
        """Test calendar endpoint for inspections and lease dates"""
        if not self.org_id:
            self.log_test("Calendar Endpoint", False, error="No org_id available")
            return False
            
        # Test with date range
        from datetime import datetime, timedelta
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        response = self.make_request('GET', f'organizations/{self.org_id}/calendar?start_date={start_date}&end_date={end_date}')
        
        if response and response.status_code == 200:
            events = response.json()
            success = isinstance(events, list)
            self.log_test("Calendar Endpoint", success, 
                         f"Calendar events count: {len(events) if success else 0}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to get calendar') if response else 'No response'
            self.log_test("Calendar Endpoint", False, error=error_msg)
            return False

    def test_inspection_state_machine_valid(self):
        """Test valid inspection status transition (scheduled -> completed)"""
        if not self.inspection_id:
            self.log_test("Inspection State Machine (Valid)", False, error="No inspection_id available")
            return False
            
        data = {
            "status": "completed",
            "notes": "Inspection completed successfully",
            "completed_date": datetime.now().strftime('%Y-%m-%d')
        }
        
        response = self.make_request('PUT', f'organizations/{self.org_id}/inspections/{self.inspection_id}', data)
        
        if response and response.status_code == 200:
            result = response.json()
            success = result.get('status') == 'completed'
            self.log_test("Inspection State Machine (Valid)", success, 
                         f"Status updated to: {result.get('status', 'N/A')}")
            return success
        else:
            error_msg = response.json().get('detail', 'Failed to update') if response else 'No response'
            self.log_test("Inspection State Machine (Valid)", False, error=error_msg)
            return False

    def test_inspection_state_machine_invalid(self):
        """Test invalid inspection status transition (scheduled -> approved should fail)"""
        # Create a new inspection for this test
        if not self.property_id:
            self.log_test("Inspection State Machine (Invalid)", False, error="No property_id available")
            return False
            
        # First create a new inspection
        create_data = {
            "property_id": self.property_id,
            "unit_id": self.unit_id,
            "scheduled_date": (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
            "notes": "Test inspection for invalid transition"
        }
        
        create_response = self.make_request('POST', f'organizations/{self.org_id}/inspections', create_data)
        
        if not create_response or create_response.status_code != 200:
            self.log_test("Inspection State Machine (Invalid)", False, error="Failed to create test inspection")
            return False
            
        test_inspection_id = create_response.json().get('id')
        
        # Now try invalid transition: scheduled -> approved (should fail)
        data = {
            "status": "approved",
            "notes": "Trying invalid transition"
        }
        
        response = self.make_request('PUT', f'organizations/{self.org_id}/inspections/{test_inspection_id}', data)
        
        # This should fail with 400 status
        if response and response.status_code == 400:
            success = True
            self.log_test("Inspection State Machine (Invalid)", success, 
                         "Invalid transition correctly rejected")
            return success
        else:
            self.log_test("Inspection State Machine (Invalid)", False, 
                         error="Invalid transition was allowed (should have been rejected)")
            return False

    def test_role_enforcement_staff_property_create(self):
        """Test that Staff cannot create properties (should get 403)"""
        if not self.staff_token or not self.org_id:
            self.log_test("Role Enforcement - Staff Property Create", False, 
                         error="No staff token or org_id available")
            return False
        
        # Switch to staff token temporarily
        original_token = self.token
        self.token = self.staff_token
        
        data = {
            "name": f"Staff Test Property {uuid.uuid4().hex[:6]}",
            "address": "456 Staff Street, Staff City, SC 67890",
            "description": "Property creation attempt by staff user",
            "total_units": 3
        }
        
        response = self.make_request('POST', f'organizations/{self.org_id}/properties', data)
        
        # Restore original token
        self.token = original_token
        
        # Should get 403 Forbidden
        if response and response.status_code == 403:
            success = True
            self.log_test("Role Enforcement - Staff Property Create", success, 
                         "Staff correctly denied property creation")
            return success
        else:
            status = response.status_code if response else 'No response'
            error_detail = response.json().get('detail', 'Unknown') if response else 'No response'
            self.log_test("Role Enforcement - Staff Property Create", False, 
                         error=f"Expected 403, got {status}: {error_detail}")
            return False

    def test_role_enforcement_staff_tenant_update(self):
        """Test that Staff cannot update tenants (should get 403)"""
        if not self.staff_token or not self.tenant_id:
            self.log_test("Role Enforcement - Staff Tenant Update", False, 
                         error="No staff token or tenant_id available")
            return False
        
        # Switch to staff token temporarily
        original_token = self.token
        self.token = self.staff_token
        
        data = {
            "name": "Updated by Staff",
            "email": f"updated_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "+1-555-9999",
            "status": "inactive"
        }
        
        print(f"DEBUG: About to make request with staff token")
        print(f"DEBUG: Endpoint: organizations/{self.org_id}/tenants/{self.tenant_id}")
        print(f"DEBUG: Staff token exists: {bool(self.staff_token)}")
        print(f"DEBUG: Tenant ID exists: {bool(self.tenant_id)}")
        
        response = self.make_request('PUT', f'organizations/{self.org_id}/tenants/{self.tenant_id}', data)
        
        print(f"DEBUG: Response received: {response}")
        print(f"DEBUG: Response type: {type(response)}")
        if response:
            print(f"DEBUG: Response status: {response.status_code}")
        
        # Restore original token
        self.token = original_token
        
        # Should get 403 Forbidden
        if response and response.status_code == 403:
            success = True
            self.log_test("Role Enforcement - Staff Tenant Update", success, 
                         "Staff correctly denied tenant update")
            return success
        else:
            status = response.status_code if response else 'No response'
            self.log_test("Role Enforcement - Staff Tenant Update", False, 
                         error=f"Expected 403, got {status}")
            return False

    def test_role_enforcement_staff_inspection_approve(self):
        """Test that Staff cannot approve inspections (should get 403)"""
        if not self.staff_token or not self.inspection_id:
            self.log_test("Role Enforcement - Staff Inspection Approve", False, 
                         error="No staff token or inspection_id available")
            return False
        
        # First, update inspection to completed status (as admin)
        data = {
            "status": "completed",
            "notes": "Completed for approval test"
        }
        
        response = self.make_request('PUT', f'organizations/{self.org_id}/inspections/{self.inspection_id}', data)
        
        if not response or response.status_code != 200:
            self.log_test("Role Enforcement - Staff Inspection Approve", False, 
                         error="Failed to set inspection to completed")
            return False
        
        # Now try to approve as staff (should fail)
        original_token = self.token
        self.token = self.staff_token
        
        approve_data = {
            "status": "approved",
            "notes": "Staff trying to approve"
        }
        
        response = self.make_request('PUT', f'organizations/{self.org_id}/inspections/{self.inspection_id}', approve_data)
        
        # Restore original token
        self.token = original_token
        
        # Should get 403 Forbidden
        if response and response.status_code == 403:
            success = True
            self.log_test("Role Enforcement - Staff Inspection Approve", success, 
                         "Staff correctly denied inspection approval")
            return success
        else:
            status = response.status_code if response else 'No response'
            self.log_test("Role Enforcement - Staff Inspection Approve", False, 
                         error=f"Expected 403, got {status}")
            return False

    def test_role_enforcement_staff_document_delete(self):
        """Test that Staff cannot delete documents (should get 403)"""
        if not self.staff_token or not self.org_id:
            self.log_test("Role Enforcement - Staff Document Delete", False, 
                         error="No staff token or org_id available")
            return False
        
        # First create a document as admin
        # Since we can't easily upload files in this test, we'll test the endpoint directly
        # and expect it to fail due to role enforcement before file handling
        
        original_token = self.token
        self.token = self.staff_token
        
        # Try to delete a non-existent document (role check should happen first)
        fake_doc_id = str(uuid.uuid4())
        response = self.make_request('DELETE', f'organizations/{self.org_id}/documents/{fake_doc_id}')
        
        # Restore original token
        self.token = original_token
        
        # Should get 403 Forbidden (role check happens before document existence check)
        if response and response.status_code == 403:
            success = True
            self.log_test("Role Enforcement - Staff Document Delete", success, 
                         "Staff correctly denied document deletion")
            return success
        else:
            status = response.status_code if response else 'No response'
            self.log_test("Role Enforcement - Staff Document Delete", False, 
                         error=f"Expected 403, got {status}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting PropOps API Tests - New Features Focus")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Core setup tests
        setup_tests = [
            self.test_health_check,
            self.test_user_registration,
            self.test_auth_me,
            self.test_get_organizations,
            self.test_create_property,
            self.test_create_unit,
            self.test_create_tenant,
            self.test_create_inspection,
        ]
        
        # New feature tests
        new_feature_tests = [
            self.test_create_staff_user,
            self.test_team_invitation_create,
            self.test_staff_accept_invitation,
            self.test_team_invitation_list,
            self.test_invite_token_lookup,
            self.test_calendar_endpoint,
            self.test_inspection_state_machine_valid,
            self.test_inspection_state_machine_invalid,
            self.test_role_enforcement_staff_property_create,
            self.test_role_enforcement_staff_tenant_update,
            self.test_role_enforcement_staff_inspection_approve,
            self.test_role_enforcement_staff_document_delete,
        ]
        
        all_tests = setup_tests + new_feature_tests
        
        print("🔧 Running setup tests...")
        for test in setup_tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, error=f"Exception: {str(e)}")
        
        print("\n🆕 Running new feature tests...")
        for test in new_feature_tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, error=f"Exception: {str(e)}")
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed, self.tests_run, self.test_results

def main():
    tester = PropOpsAPITester()
    passed, total, results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())