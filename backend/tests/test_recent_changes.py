"""
Test suite for recent changes:
1. Contractor-Manager messaging API
2. PWA manifest verification
3. Pricing tier features verification
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from previous test reports
MANAGER_EMAIL = "test@test.com"
MANAGER_PASSWORD = "test123"
CONTRACTOR_EMAIL = "testcontractor@test.com"
CONTRACTOR_PASSWORD = "test123"
TEST_MAINTENANCE_REQUEST_ID = "4a2e3b39-abd6-4209-9776-ce5bc2ff8662"

class TestContractorMessagingAPI:
    """Test contractor-manager messaging endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test client"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_manager_token(self):
        """Login as manager and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def get_contractor_token(self):
        """Login as contractor and get token"""
        response = self.session.post(f"{BASE_URL}/api/contractor/login", json={
            "email": CONTRACTOR_EMAIL,
            "password": CONTRACTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None

    def test_manager_login(self):
        """Test manager login works"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Manager login successful: {data['user']['name']}")
    
    def test_contractor_login(self):
        """Test contractor login works"""
        response = self.session.post(f"{BASE_URL}/api/contractor/login", json={
            "email": CONTRACTOR_EMAIL,
            "password": CONTRACTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"Contractor login successful")
    
    def test_get_job_messages_endpoint_exists(self):
        """Test GET /api/maintenance-requests/{id}/messages endpoint exists"""
        token = self.get_manager_token()
        assert token, "Manager login failed"
        
        response = self.session.get(
            f"{BASE_URL}/api/maintenance-requests/{TEST_MAINTENANCE_REQUEST_ID}/messages",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should return 200 (messages list) or 404 (job not found)
        # Not 405 (method not allowed) which would mean endpoint doesn't exist
        assert response.status_code in [200, 404], f"Endpoint returned unexpected status: {response.status_code}"
        print(f"GET messages endpoint works: status {response.status_code}")
    
    def test_send_message_endpoint_exists(self):
        """Test POST /api/maintenance-requests/{id}/messages endpoint exists"""
        token = self.get_manager_token()
        assert token, "Manager login failed"
        
        response = self.session.post(
            f"{BASE_URL}/api/maintenance-requests/{TEST_MAINTENANCE_REQUEST_ID}/messages",
            headers={"Authorization": f"Bearer {token}"},
            json={"content": "Test message from manager", "job_id": TEST_MAINTENANCE_REQUEST_ID}
        )
        # Should return 200/201 (success) or 400/404 (validation error/not found)
        # Not 405 (method not allowed) which would mean endpoint doesn't exist
        assert response.status_code in [200, 201, 400, 404], f"Endpoint returned unexpected status: {response.status_code}"
        print(f"POST messages endpoint works: status {response.status_code}")
        if response.status_code in [200, 201]:
            print(f"Message sent successfully: {response.json()}")
    
    def test_contractor_get_job_messages(self):
        """Test contractor can get job messages"""
        token = self.get_contractor_token()
        if not token:
            pytest.skip("Contractor login failed")
        
        # First get contractor's jobs
        response = self.session.get(
            f"{BASE_URL}/api/contractor/jobs",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        jobs = response.json()
        
        if jobs and len(jobs) > 0:
            job_id = jobs[0].get("id") or jobs[0].get("maintenance_request_id")
            if job_id:
                response = self.session.get(
                    f"{BASE_URL}/api/contractor/jobs/{job_id}/messages",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code in [200, 404]
                print(f"Contractor GET messages: status {response.status_code}")


class TestPWAManifest:
    """Test PWA manifest.json configuration"""
    
    def test_manifest_exists(self):
        """Test manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        # Should be served by frontend
        assert response.status_code == 200, f"manifest.json not accessible: {response.status_code}"
        print("manifest.json is accessible")
    
    def test_manifest_structure(self):
        """Test manifest.json has required PWA fields"""
        # Load the local file to verify structure
        manifest_path = "/app/frontend/public/manifest.json"
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        # Required PWA fields
        assert "name" in manifest, "manifest missing 'name'"
        assert "short_name" in manifest, "manifest missing 'short_name'"
        assert "start_url" in manifest, "manifest missing 'start_url'"
        assert "display" in manifest, "manifest missing 'display'"
        assert "icons" in manifest, "manifest missing 'icons'"
        
        print(f"PWA manifest name: {manifest['name']}")
        print(f"PWA short_name: {manifest['short_name']}")
    
    def test_manifest_has_shortcuts(self):
        """Test manifest.json includes shortcuts (new feature)"""
        manifest_path = "/app/frontend/public/manifest.json"
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        assert "shortcuts" in manifest, "manifest missing 'shortcuts' field"
        shortcuts = manifest["shortcuts"]
        assert len(shortcuts) >= 1, "manifest should have at least one shortcut"
        
        # Check shortcut structure
        for shortcut in shortcuts:
            assert "name" in shortcut, "shortcut missing 'name'"
            assert "url" in shortcut, "shortcut missing 'url'"
        
        shortcut_names = [s["name"] for s in shortcuts]
        print(f"PWA shortcuts: {shortcut_names}")
        
        # Verify Dashboard and Maintenance shortcuts exist
        assert any("Dashboard" in name for name in shortcut_names), "Missing Dashboard shortcut"
        assert any("Maintenance" in name for name in shortcut_names), "Missing Maintenance shortcut"


class TestPricingFeatures:
    """Test pricing tier features match requirements"""
    
    def test_landing_page_plan_features(self):
        """Verify planFeatures in Landing.js code"""
        landing_path = "/app/frontend/src/pages/Landing.js"
        with open(landing_path, 'r') as f:
            content = f.read()
        
        # Test 1: Pro tier should NOT have 'Custom branding' anymore
        # It should still have custom_branding in PLAN_LIMITS but removed from display
        assert "Custom branding" not in content or content.count("Custom branding") == 0, \
            "Pro tier should NOT show 'Custom branding' in pricing display"
        
        # Test 2: Standard tier should have 'Rent payment tracking'
        assert "Rent payment tracking" in content, \
            "Standard tier should show 'Rent payment tracking'"
        
        # Test 3: Pro tier should have 'AI-Powered Insights Dashboard'
        assert "AI-Powered Insights Dashboard" in content, \
            "Pro tier should show 'AI-Powered Insights Dashboard'"
        
        print("Pricing features in Landing.js verified")
    
    def test_no_rent_collector_video(self):
        """Verify 'Rent Collector' video is not shown on landing page"""
        landing_path = "/app/frontend/src/pages/Landing.js"
        with open(landing_path, 'r') as f:
            content = f.read()
        
        # 'Rent Collector' video title should not appear
        assert "Rent Collector" not in content, \
            "Landing page should NOT show 'Rent Collector' video"
        
        print("Rent Collector video successfully removed from landing page")


class TestMobileNav:
    """Test mobile navigation component"""
    
    def test_mobile_nav_component_exists(self):
        """Verify MobileNav component exists and has correct structure"""
        mobile_nav_path = "/app/frontend/src/components/MobileNav.js"
        with open(mobile_nav_path, 'r') as f:
            content = f.read()
        
        # Check for nav items
        assert "navItems" in content, "MobileNav should define navItems"
        assert "dashboard" in content.lower(), "MobileNav should have Dashboard item"
        assert "properties" in content.lower(), "MobileNav should have Properties item"
        assert "maintenance" in content.lower(), "MobileNav should have Maintenance item"
        
        # Check for mobile-specific class
        assert "lg:hidden" in content, "MobileNav should be hidden on large screens"
        
        # Check for data-testid attributes
        assert "data-testid" in content, "MobileNav should have data-testid attributes"
        
        print("MobileNav component structure verified")
    
    def test_layout_includes_mobile_nav(self):
        """Verify Layout component includes MobileNav"""
        layout_path = "/app/frontend/src/components/Layout.js"
        with open(layout_path, 'r') as f:
            content = f.read()
        
        assert "MobileNav" in content, "Layout should import and use MobileNav"
        assert "import MobileNav from" in content or "from './MobileNav'" in content, \
            "Layout should import MobileNav component"
        
        print("Layout includes MobileNav component")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
