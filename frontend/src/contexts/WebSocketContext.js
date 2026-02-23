import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

const WebSocketContext = createContext(null);

// Notification priority icons and colors
const PRIORITY_CONFIG = {
  critical: { icon: '🔴', color: 'destructive' },
  important: { icon: '🟡', color: 'warning' },
  info: { icon: '🟢', color: 'default' }
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // Get WebSocket URL from backend URL
  const getWsUrl = useCallback((userType, token) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    // Convert http(s) to ws(s)
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${wsHost}/api/ws/${userType}/${token}`;
  }, []);

  const connect = useCallback((userType, token) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = getWsUrl(userType, token);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            // Ignore pong responses
            return;
          }
          
          if (data.type === 'connected') {
            console.log('WebSocket connection confirmed:', data.message);
            return;
          }

          if (data.type === 'notification') {
            handleNotification(data);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        clearInterval(pingIntervalRef.current);

        // Handle reconnection based on close code
        if (event.code === 4001 || event.code === 4002) {
          // Auth error - don't reconnect
          console.log('WebSocket auth error, not reconnecting');
          return;
        }

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.log(`WebSocket reconnecting... Attempt ${reconnectAttemptsRef.current}`);
            connect(userType, token);
          }, reconnectDelay * Math.pow(2, reconnectAttemptsRef.current));
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [getWsUrl]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    clearInterval(pingIntervalRef.current);
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const handleNotification = useCallback((data) => {
    const { title, message, priority = 'info', notification_type, data: notificationData } = data;
    
    // Add to notifications list
    const newNotification = {
      id: notificationData?.id || Date.now().toString(),
      title,
      message,
      priority,
      notification_type,
      is_read: false,
      created_at: data.timestamp || new Date().toISOString(),
      ...notificationData
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast notification based on priority
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.info;
    
    if (priority === 'critical') {
      toast.error(`${config.icon} ${title}`, {
        description: message,
        duration: 10000,
        action: {
          label: 'View',
          onClick: () => {
            if (notificationData?.link) {
              window.location.href = notificationData.link;
            }
          }
        }
      });
    } else if (priority === 'important') {
      toast.warning(`${config.icon} ${title}`, {
        description: message,
        duration: 6000
      });
    } else {
      toast.info(`${config.icon} ${title}`, {
        description: message,
        duration: 4000
      });
    }
  }, []);

  const markAsRead = useCallback((notificationId) => {
    // Send mark as read message via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }));
    }

    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = {
    isConnected,
    notifications,
    unreadCount,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setNotifications,
    setUnreadCount
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
