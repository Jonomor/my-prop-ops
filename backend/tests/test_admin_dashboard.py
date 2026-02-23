"""
Admin Dashboard Backend API Tests
Tests for admin login, stats, users, organizations, blog management, and feature flags
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mypropops-preview.preview.emergentagent.com')

# Admin credentials
ADMIN_EMAIL = "admin@mypropops.com"
ADMIN_PASSWORD = "MyPropOps@Admin2026!"

class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "email" in data, "Response should contain email"
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful, token received")
    
    def test_admin_login_invalid_email(self):
        """Test admin login with invalid email"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": "wrong@mypropops.com", "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Invalid email correctly rejected")
    
    def test_admin_login_invalid_password(self):
        """Test admin login with invalid password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": "WrongPassword123!"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Invalid password correctly rejected")


class TestAdminStats:
    """Test admin stats endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_admin_stats(self):
        """Test GET /api/admin/stats returns all metrics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify all required fields
        required_fields = [
            "total_users", "total_organizations", "total_properties", 
            "total_units", "total_tenants", "total_maintenance",
            "free_users", "standard_users", "pro_users", "mrr"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
            assert isinstance(data[field], (int, float)), f"{field} should be numeric"
        
        print(f"✓ Stats returned: {data['total_users']} users, {data['total_organizations']} orgs, MRR: ${data['mrr']}")
    
    def test_stats_without_auth(self):
        """Test stats endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 422], f"Expected 401 or 422, got {response.status_code}"
        print(f"✓ Stats correctly requires authentication")


class TestAdminUsers:
    """Test admin user management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_users(self):
        """Test GET /api/admin/users returns user list"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        
        if len(data) > 0:
            user = data[0]
            assert "id" in user, "User should have id"
            assert "email" in user, "User should have email"
            assert "password" not in user, "Password should not be exposed"
            assert "two_factor_secret" not in user, "2FA secret should not be exposed"
        
        print(f"✓ Users list returned: {len(data)} users")
    
    def test_get_user_details(self):
        """Test GET /api/admin/users/{user_id} returns detailed info"""
        # First get a user ID
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert users_response.status_code == 200
        users = users_response.json()
        
        if len(users) == 0:
            pytest.skip("No users available for testing")
        
        user_id = users[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/admin/users/{user_id}", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "organizations" in data, "Should include user's organizations"
        assert "memberships" in data, "Should include user's memberships"
        assert "stats" in data, "Should include activity stats"
        
        # Verify stats structure
        stats = data["stats"]
        assert "properties" in stats
        assert "units" in stats
        assert "tenants" in stats
        assert "maintenance_requests" in stats
        
        print(f"✓ User details returned for {data['email']} with {len(data['organizations'])} orgs")
    
    def test_toggle_user_status(self):
        """Test PUT /api/admin/users/{user_id}/status toggles disabled status"""
        # Get a user
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        users = users_response.json()
        
        if len(users) == 0:
            pytest.skip("No users available for testing")
        
        user_id = users[0]["id"]
        
        response = requests.put(f"{BASE_URL}/api/admin/users/{user_id}/status", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "disabled" in data
        
        # Toggle back
        requests.put(f"{BASE_URL}/api/admin/users/{user_id}/status", headers=self.headers)
        
        print(f"✓ User status toggled successfully: {data['message']}")
    
    def test_impersonate_user(self):
        """Test POST /api/admin/users/{user_id}/impersonate returns token"""
        # Get a user
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        users = users_response.json()
        
        if len(users) == 0:
            pytest.skip("No users available for testing")
        
        user_id = users[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/admin/users/{user_id}/impersonate", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Should return impersonation token"
        assert "user" in data, "Should return user info"
        
        print(f"✓ Impersonation token generated for user {data['user']['email']}")


class TestAdminOrganizations:
    """Test admin organization management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_organizations(self):
        """Test GET /api/admin/organizations returns all organizations"""
        response = requests.get(f"{BASE_URL}/api/admin/organizations", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        
        if len(data) > 0:
            org = data[0]
            assert "id" in org, "Org should have id"
            assert "name" in org, "Org should have name"
            assert "property_count" in org, "Should include property count"
            assert "unit_count" in org, "Should include unit count"
            assert "owner_email" in org, "Should include owner email"
        
        print(f"✓ Organizations list returned: {len(data)} organizations")


class TestAdminBlog:
    """Test admin blog management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.created_post_id = None
    
    def test_list_blog_posts(self):
        """Test GET /api/admin/blog returns all posts"""
        response = requests.get(f"{BASE_URL}/api/admin/blog", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        print(f"✓ Blog posts list returned: {len(data)} posts")
    
    def test_create_blog_post(self):
        """Test POST /api/admin/blog creates new post"""
        post_data = {
            "title": "TEST_Admin Dashboard Test Post",
            "excerpt": "This is a test post excerpt",
            "content": "This is the full test post content for testing admin blog management.",
            "category": "Property Management",
            "status": "draft",
            "meta_description": "Test meta description",
            "keywords": ["test", "admin", "blog"]
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/blog", json=post_data, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Should return post id"
        assert data["title"] == post_data["title"], "Title should match"
        assert data["status"] == "draft", "Status should be draft"
        assert "slug" in data, "Should generate slug"
        
        self.created_post_id = data["id"]
        print(f"✓ Blog post created with ID: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/blog/{data['id']}", headers=self.headers)
    
    def test_update_blog_post(self):
        """Test PUT /api/admin/blog/{post_id} updates post"""
        # First create a post
        post_data = {
            "title": "TEST_Post to Update",
            "excerpt": "Original excerpt",
            "content": "Original content",
            "category": "Property Management",
            "status": "draft"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/blog", json=post_data, headers=self.headers)
        assert create_response.status_code == 200
        post_id = create_response.json()["id"]
        
        # Update the post
        update_data = {
            "title": "TEST_Updated Post Title",
            "excerpt": "Updated excerpt",
            "content": "Updated content for the blog post",
            "category": "Technology",
            "status": "published"
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/blog/{post_id}", json=update_data, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["title"] == update_data["title"], "Title should be updated"
        assert data["category"] == "Technology", "Category should be updated"
        assert data["status"] == "published", "Status should be updated"
        
        print(f"✓ Blog post updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/blog/{post_id}", headers=self.headers)
    
    def test_delete_blog_post(self):
        """Test DELETE /api/admin/blog/{post_id} deletes post"""
        # First create a post
        post_data = {
            "title": "TEST_Post to Delete",
            "excerpt": "Will be deleted",
            "content": "Delete me",
            "category": "Property Management",
            "status": "draft"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/blog", json=post_data, headers=self.headers)
        assert create_response.status_code == 200
        post_id = create_response.json()["id"]
        
        # Delete the post
        response = requests.delete(f"{BASE_URL}/api/admin/blog/{post_id}", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify it's deleted
        get_response = requests.get(f"{BASE_URL}/api/admin/blog/{post_id}", headers=self.headers)
        assert get_response.status_code == 404, "Post should be deleted"
        
        print(f"✓ Blog post deleted successfully")


class TestAdminFeatureFlags:
    """Test admin feature flags endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_feature_flags(self):
        """Test GET /api/admin/feature-flags returns current flags"""
        response = requests.get(f"{BASE_URL}/api/admin/feature-flags", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, dict), "Should return a dictionary"
        print(f"✓ Feature flags retrieved: {list(data.keys())}")
    
    def test_update_feature_flags(self):
        """Test PUT /api/admin/feature-flags updates flags"""
        # Get current flags
        get_response = requests.get(f"{BASE_URL}/api/admin/feature-flags", headers=self.headers)
        original_flags = get_response.json()
        
        # Update flags
        new_flags = {
            "maintenance_requests": True,
            "tenant_screening": True,
            "ai_insights": True,
            "auto_blog": False
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/feature-flags", json=new_flags, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update
        verify_response = requests.get(f"{BASE_URL}/api/admin/feature-flags", headers=self.headers)
        updated_flags = verify_response.json()
        assert updated_flags["auto_blog"] == False, "Flag should be updated"
        
        # Restore original
        requests.put(f"{BASE_URL}/api/admin/feature-flags", json=original_flags, headers=self.headers)
        
        print(f"✓ Feature flags updated and restored")


class TestAdminAuditLogs:
    """Test admin audit logs endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_audit_logs(self):
        """Test GET /api/admin/audit-logs returns logs"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        
        if len(data) > 0:
            log = data[0]
            assert "action" in log, "Log should have action"
            assert "created_at" in log, "Log should have timestamp"
        
        print(f"✓ Audit logs retrieved: {len(data)} entries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
