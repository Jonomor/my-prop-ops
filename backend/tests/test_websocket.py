"""
WebSocket Real-time Notification Tests
Tests WebSocket connection, status endpoint, and notification features
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MANAGER_EMAIL = "test@test.com"
MANAGER_PASSWORD = "test123"


class TestWebSocketFeatures:
    """Test WebSocket related endpoints and features"""

    def test_ws_status_endpoint(self):
        """Test WebSocket status endpoint returns connection count"""
        response = requests.get(f"{BASE_URL}/api/ws/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "connections" in data, "Expected 'connections' key in response"
        assert "total" in data, "Expected 'total' key in response"
        assert "manager" in data["connections"], "Expected 'manager' in connections"
        assert "contractor" in data["connections"], "Expected 'contractor' in connections"
        assert "tenant" in data["connections"], "Expected 'tenant' in connections"
        assert "admin" in data["connections"], "Expected 'admin' in connections"
        print(f"WebSocket status: {data}")

    def test_manager_login_returns_token(self):
        """Test manager login returns valid token for WebSocket connection"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        
        data = response.json()
        assert "token" in data, "Expected token in login response"
        assert "user" in data, "Expected user in login response"
        assert len(data["token"]) > 0, "Token should not be empty"
        print(f"Login successful, token received for user: {data['user']['email']}")

    def test_notifications_endpoint(self):
        """Test notifications endpoint with authenticated user"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert login_response.status_code == 200, "Login failed"
        token = login_response.json()["token"]
        
        # Fetch notifications
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of notifications"
        print(f"Fetched {len(data)} notifications")
        
        # Check notification structure if any exist
        if len(data) > 0:
            notification = data[0]
            assert "id" in notification, "Notification should have id"
            assert "title" in notification, "Notification should have title"
            assert "message" in notification, "Notification should have message"
            assert "is_read" in notification, "Notification should have is_read"
            assert "created_at" in notification, "Notification should have created_at"
            # Check for priority field (new for WebSocket notifications)
            if "priority" in notification:
                print(f"First notification has priority: {notification.get('priority')}")

    def test_mark_notification_read(self):
        """Test marking notification as read"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert login_response.status_code == 200, "Login failed"
        token = login_response.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get notifications
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200
        
        notifications = response.json()
        if len(notifications) > 0:
            # Try to mark first notification as read
            notification_id = notifications[0]["id"]
            mark_response = requests.put(
                f"{BASE_URL}/api/notifications/{notification_id}/read",
                headers=headers
            )
            assert mark_response.status_code == 200, f"Expected 200, got {mark_response.status_code}"
            print(f"Marked notification {notification_id} as read")
        else:
            print("No notifications to mark as read - skipping")

    def test_mark_all_notifications_read(self):
        """Test marking all notifications as read"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert login_response.status_code == 200, "Login failed"
        token = login_response.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Mark all as read
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("Marked all notifications as read")

    def test_health_endpoint(self):
        """Test health endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "healthy", "Expected healthy status"
        print(f"Health check: {data}")

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint after login"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MANAGER_EMAIL,
            "password": MANAGER_PASSWORD
        })
        assert login_response.status_code == 200, "Login failed"
        token = login_response.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get dashboard stats
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total_properties" in data, "Expected total_properties in stats"
        assert "total_units" in data, "Expected total_units in stats"
        assert "total_tenants" in data, "Expected total_tenants in stats"
        assert "unread_notifications" in data, "Expected unread_notifications in stats"
        print(f"Dashboard stats: Properties={data.get('total_properties')}, Units={data.get('total_units')}, Unread={data.get('unread_notifications')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
