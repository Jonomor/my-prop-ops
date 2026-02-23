"""
WebSocket Connection Manager for Real-time Notifications
Supports multiple user types: manager, contractor, tenant, admin
"""

from fastapi import WebSocket
from typing import Dict, List, Set
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time notifications"""
    
    def __init__(self):
        # Store connections by user type and user_id
        # Structure: {user_type: {user_id: [websocket, ...]}}
        self.active_connections: Dict[str, Dict[str, List[WebSocket]]] = {
            "manager": {},
            "contractor": {},
            "tenant": {},
            "admin": {}
        }
        # Store org memberships for broadcasting to org members
        # Structure: {org_id: {user_id, ...}}
        self.org_members: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, user_type: str, user_id: str, org_id: str = None):
        """Accept a WebSocket connection and register it"""
        await websocket.accept()
        
        if user_type not in self.active_connections:
            self.active_connections[user_type] = {}
        
        if user_id not in self.active_connections[user_type]:
            self.active_connections[user_type][user_id] = []
        
        self.active_connections[user_type][user_id].append(websocket)
        
        # Track org membership for managers/staff
        if org_id and user_type == "manager":
            if org_id not in self.org_members:
                self.org_members[org_id] = set()
            self.org_members[org_id].add(user_id)
        
        logger.info(f"WebSocket connected: {user_type}:{user_id} (org:{org_id})")
    
    def disconnect(self, websocket: WebSocket, user_type: str, user_id: str, org_id: str = None):
        """Remove a WebSocket connection"""
        if user_type in self.active_connections:
            if user_id in self.active_connections[user_type]:
                if websocket in self.active_connections[user_type][user_id]:
                    self.active_connections[user_type][user_id].remove(websocket)
                
                # Clean up empty lists
                if not self.active_connections[user_type][user_id]:
                    del self.active_connections[user_type][user_id]
                    
                    # Remove from org members if no connections left
                    if org_id and org_id in self.org_members:
                        self.org_members[org_id].discard(user_id)
                        if not self.org_members[org_id]:
                            del self.org_members[org_id]
        
        logger.info(f"WebSocket disconnected: {user_type}:{user_id}")
    
    async def send_personal(self, user_type: str, user_id: str, message: dict):
        """Send a message to a specific user (all their connections)"""
        if user_type in self.active_connections:
            if user_id in self.active_connections[user_type]:
                disconnected = []
                for connection in self.active_connections[user_type][user_id]:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"Failed to send to {user_type}:{user_id}: {e}")
                        disconnected.append(connection)
                
                # Clean up failed connections
                for conn in disconnected:
                    self.active_connections[user_type][user_id].remove(conn)
    
    async def broadcast_to_org(self, org_id: str, message: dict, exclude_user_id: str = None):
        """Broadcast a message to all managers in an organization"""
        if org_id in self.org_members:
            for user_id in self.org_members[org_id]:
                if user_id != exclude_user_id:
                    await self.send_personal("manager", user_id, message)
    
    async def broadcast_to_type(self, user_type: str, message: dict):
        """Broadcast a message to all users of a specific type"""
        if user_type in self.active_connections:
            for user_id in list(self.active_connections[user_type].keys()):
                await self.send_personal(user_type, user_id, message)
    
    async def broadcast_all(self, message: dict):
        """Broadcast a message to all connected users"""
        for user_type in self.active_connections:
            await self.broadcast_to_type(user_type, message)
    
    def get_connection_count(self) -> dict:
        """Get count of active connections by type"""
        return {
            user_type: sum(len(connections) for connections in users.values())
            for user_type, users in self.active_connections.items()
        }


# Global connection manager instance
manager = ConnectionManager()


def create_notification_message(
    notification_type: str,
    title: str,
    message: str,
    priority: str = "info",
    data: dict = None
) -> dict:
    """Create a standardized notification message"""
    return {
        "type": "notification",
        "notification_type": notification_type,
        "title": title,
        "message": message,
        "priority": priority,  # critical, important, info
        "data": data or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
