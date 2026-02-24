import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import MobileNav from './MobileNav';
import {
  Building2,
  Home,
  Users,
  ClipboardCheck,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Building,
  History,
  Plus,
  Calendar,
  UserPlus,
  Mail,
  CreditCard,
  Wrench,
  Search,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
  Key,
  Shield,
  Sparkles,
  Wifi,
  WifiOff,
  PenTool
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  { path: '/properties', label: 'Properties', icon: Building2 },
  { path: '/tenants', label: 'Tenants', icon: Users },
  { path: '/screening', label: 'Screening', icon: Search },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/rent-payments', label: 'Rent Payments', icon: DollarSign },
  { path: '/inspections', label: 'Inspections', icon: ClipboardCheck },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/e-signatures', label: 'E-Signatures', icon: PenTool },
  { path: '/reports', label: 'Reports', icon: FileSpreadsheet },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/team', label: 'Team', icon: UserPlus },
  { path: '/members', label: 'Members', icon: Users },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/2fa-settings', label: 'Security (2FA)', icon: Shield },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/audit-logs', label: 'Audit Logs', icon: History },
];

export const Layout = ({ children }) => {
  const { user, logout, organizations, currentOrg, switchOrganization, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { 
    isConnected: wsConnected, 
    connect: wsConnect, 
    disconnect: wsDisconnect,
    notifications: wsNotifications,
    unreadCount: wsUnreadCount,
    markAsRead: wsMarkAsRead,
    setNotifications: wsSetNotifications,
    setUnreadCount: wsSetUnreadCount
  } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const { api } = useAuth();

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (user && token) {
      wsConnect('manager', token);
    }
    return () => {
      wsDisconnect();
    };
  }, [user, token, wsConnect, wsDisconnect]);

  // Merge WebSocket notifications with local notifications
  useEffect(() => {
    if (wsNotifications.length > 0) {
      setNotifications(prev => {
        // Merge, dedupe by id, and sort by created_at
        const merged = [...wsNotifications, ...prev];
        const deduped = merged.reduce((acc, n) => {
          if (!acc.find(existing => existing.id === n.id)) {
            acc.push(n);
          }
          return acc;
        }, []);
        return deduped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);
      });
    }
  }, [wsNotifications]);

  // Update unread count from WebSocket
  useEffect(() => {
    if (wsUnreadCount > 0) {
      setUnreadCount(prev => Math.max(prev, wsUnreadCount));
    }
  }, [wsUnreadCount]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(prev => {
          // Merge with WebSocket notifications
          const apiNotifications = response.data.slice(0, 10);
          const merged = [...prev, ...apiNotifications];
          const deduped = merged.reduce((acc, n) => {
            if (!acc.find(existing => existing.id === n.id)) {
              acc.push(n);
            }
            return acc;
          }, []);
          return deduped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);
        });
        setUnreadCount(response.data.filter(n => !n.is_read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
    // Only poll every 60 seconds since WebSocket handles real-time
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [api]);

  React.useEffect(() => {
    const fetchPendingInvites = async () => {
      try {
        const response = await api.get('/invites/pending');
        setPendingInvitesCount(response.data.length);
      } catch (error) {
        console.error('Failed to fetch pending invites:', error);
      }
    };
    fetchPendingInvites();
    const interval = setInterval(fetchPendingInvites, 60000);
    return () => clearInterval(interval);
  }, [api]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Also update WebSocket state
      wsMarkAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-[100dvh] w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full pb-16 lg:pb-0 overflow-hidden">
          {/* Close button for mobile */}
          <button 
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-accent z-10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-border flex-shrink-0">
            <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <img 
                src="/logo.jpg" 
                alt="MyPropOps" 
                className="w-10 h-10 rounded-lg object-contain"
              />
              <span className="text-xl font-bold font-heading">MyPropOps</span>
            </Link>
          </div>

          {/* Organization Switcher */}
          <div className="p-3 sm:p-4 border-b border-border flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" data-testid="org-switcher">
                  <span className="truncate">{currentOrg?.org_name || 'Select Org'}</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.map(org => (
                  <DropdownMenuItem
                    key={org.org_id}
                    onClick={() => switchOrganization(org)}
                    className={currentOrg?.org_id === org.org_id ? 'bg-accent' : ''}
                    data-testid={`org-option-${org.org_id}`}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    {org.org_name}
                    <Badge variant="outline" className="ml-auto text-xs">{org.role}</Badge>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/organizations/new')} data-testid="create-org-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation - Scrollable */}
          <ScrollArea className="flex-1 min-h-0">
            <nav className="px-3 py-4 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User menu - Always visible at bottom */}
          <div className="p-3 sm:p-4 border-t border-border flex-shrink-0 bg-card">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2" data-testid="user-menu">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => { navigate('/'); setSidebarOpen(false); }} data-testid="back-to-website-btn">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Website
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { navigate('/invites'); setSidebarOpen(false); }} data-testid="pending-invites-btn">
                  <Mail className="w-4 h-4 mr-2" />
                  Pending Invites
                  {pendingInvitesCount > 0 && (
                    <Badge variant="default" className="ml-auto text-xs">{pendingInvitesCount}</Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/settings'); setSidebarOpen(false); }} data-testid="settings-btn">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-btn">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* WebSocket Status Indicator */}
              <div 
                className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                  wsConnected 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
                title={wsConnected ? 'Real-time notifications active' : 'Connecting to real-time...'}
                data-testid="ws-status"
              >
                {wsConnected ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span>Offline</span>
                  </>
                )}
              </div>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="notification-bell">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2">
                      <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                      {wsConnected && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} data-testid="mark-all-read">
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-accent transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                          data-testid={`notification-${notification.id}`}
                        >
                          <div className="flex items-start gap-2">
                            {notification.priority === 'critical' && (
                              <span className="w-2 h-2 mt-1.5 bg-red-500 rounded-full flex-shrink-0" />
                            )}
                            {notification.priority === 'important' && (
                              <span className="w-2 h-2 mt-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 truncate">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/notifications')} className="justify-center" data-testid="view-all-notifications">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
};
