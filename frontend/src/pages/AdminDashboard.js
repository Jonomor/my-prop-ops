import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import RichTextEditor from '../components/ui/RichTextEditor';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Building2,
  Users,
  DollarSign,
  Shield,
  LogOut,
  Search,
  Trash2,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Activity,
  Home,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  UserX,
  UserCheck,
  LogIn,
  FileText,
  Save,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [featureFlags, setFeatureFlags] = useState({});
  
  // Dialog states
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [editBlogOpen, setEditBlogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Blog form state
  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Property Management',
    status: 'published',
    meta_description: '',
    keywords: []
  });
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const adminToken = localStorage.getItem('admin_token');
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, orgsRes, blogsRes, logsRes, flagsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/organizations'),
        api.get('/api/admin/blog'),
        api.get('/api/admin/audit-logs'),
        api.get('/api/admin/feature-flags')
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setOrganizations(orgsRes.data);
      setBlogPosts(blogsRes.data);
      setAuditLogs(logsRes.data);
      setFeatureFlags(flagsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
    setLoadingAction(true);
    try {
      const res = await api.get(`/api/admin/users/${user.id}`);
      setSelectedUserDetails(res.data);
    } catch (error) {
      toast.error('Failed to load user details');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.put(`/api/admin/users/${userId}/status`);
      toast.success(res.data.message);
      fetchData();
      if (selectedUserDetails?.id === userId) {
        setSelectedUserDetails(prev => ({ ...prev, disabled: res.data.disabled }));
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleImpersonateUser = async (userId) => {
    try {
      const res = await api.post(`/api/admin/users/${userId}/impersonate`);
      // Store the impersonation token and redirect to dashboard
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('impersonating', 'true');
      toast.success(`Impersonating ${res.data.user.email}`);
      window.open('/dashboard', '_blank');
    } catch (error) {
      toast.error('Failed to impersonate user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success('User deleted');
      setUserDetailOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteBlog = async (postId) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await api.delete(`/api/admin/blog/${postId}`);
      toast.success('Blog post deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete blog post');
    }
  };

  const handleEditBlog = (post) => {
    setSelectedBlog(post);
    setBlogForm({
      title: post?.title || '',
      excerpt: post?.excerpt || '',
      content: post?.content || '',
      category: post?.category || 'Property Management',
      status: post?.status || 'published',
      meta_description: post?.meta_description || '',
      keywords: post?.keywords || []
    });
    setEditBlogOpen(true);
  };

  const handleSaveBlog = async () => {
    if (!blogForm.title || !blogForm.content) {
      toast.error('Title and content are required');
      return;
    }
    
    setLoadingAction(true);
    try {
      if (selectedBlog) {
        await api.put(`/api/admin/blog/${selectedBlog.id}`, blogForm);
        toast.success('Blog post updated');
      } else {
        await api.post('/api/admin/blog', blogForm);
        toast.success('Blog post created');
      }
      setEditBlogOpen(false);
      setSelectedBlog(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save blog post');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGenerateBlog = async () => {
    setGeneratingBlog(true);
    try {
      const res = await api.post('/api/blog/generate');
      toast.success(`Generated: ${res.data.title}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to generate blog post. Try running the generate script in the backend.');
    } finally {
      setGeneratingBlog(false);
    }
  };

  const handleUpdateFeatureFlag = async (flag, value) => {
    try {
      const newFlags = { ...featureFlags, [flag]: value };
      await api.put('/api/admin/feature-flags', newFlags);
      setFeatureFlags(newFlags);
      toast.success('Feature flag updated');
    } catch (error) {
      toast.error('Failed to update feature flag');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="admin-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">MyPropOps Platform Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData} data-testid="refresh-btn">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="admin-logout-btn">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="organizations" data-testid="tab-organizations">Organizations</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
            <TabsTrigger value="blog" data-testid="tab-blog">Blog</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" data-testid="overview-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card data-testid="stat-users">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="stat-organizations">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Organizations</p>
                      <p className="text-3xl font-bold">{stats?.total_organizations || 0}</p>
                    </div>
                    <Building2 className="w-10 h-10 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="stat-mrr">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">MRR</p>
                      <p className="text-3xl font-bold">${stats?.mrr || 0}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-emerald-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="stat-properties">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Properties</p>
                      <p className="text-3xl font-bold">{stats?.total_properties || 0}</p>
                    </div>
                    <Home className="w-10 h-10 text-orange-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Free</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gray-400" style={{ width: `${stats?.total_users ? (stats?.free_users / stats?.total_users * 100) : 0}%` }} />
                        </div>
                        <span className="font-medium w-8 text-right">{stats?.free_users || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Standard</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${stats?.total_users ? (stats?.standard_users / stats?.total_users * 100) : 0}%` }} />
                        </div>
                        <span className="font-medium w-8 text-right">{stats?.standard_users || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pro</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${stats?.total_users ? (stats?.pro_users / stats?.total_users * 100) : 0}%` }} />
                        </div>
                        <span className="font-medium w-8 text-right">{stats?.pro_users || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {auditLogs.slice(0, 10).map((log, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <Activity className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p>{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <p className="text-muted-foreground text-sm">No recent activity</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" data-testid="users-content">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        className="pl-9 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="user-search-input"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="users-table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">User</th>
                        <th className="text-left py-3 px-2 font-medium">Email</th>
                        <th className="text-left py-3 px-2 font-medium">Plan</th>
                        <th className="text-left py-3 px-2 font-medium">Status</th>
                        <th className="text-left py-3 px-2 font-medium">Joined</th>
                        <th className="text-left py-3 px-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50" data-testid={`user-row-${user.id}`}>
                          <td className="py-3 px-2">{user.name || 'N/A'}</td>
                          <td className="py-3 px-2 text-muted-foreground">{user.email}</td>
                          <td className="py-3 px-2">
                            <Badge variant={user.subscription_plan === 'pro' ? 'default' : user.subscription_plan === 'standard' ? 'secondary' : 'outline'}>
                              {user.subscription_plan || 'free'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={user.disabled ? 'destructive' : 'success'} className={user.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                              {user.disabled ? 'Disabled' : 'Active'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)} title="View Details" data-testid={`view-user-${user.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleImpersonateUser(user.id)} title="Impersonate" data-testid={`impersonate-user-${user.id}`}>
                                <LogIn className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleToggleUserStatus(user.id)} title={user.disabled ? 'Enable' : 'Disable'} data-testid={`toggle-user-${user.id}`}>
                                {user.disabled ? <UserCheck className="w-4 h-4 text-green-500" /> : <UserX className="w-4 h-4 text-orange-500" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} title="Delete" data-testid={`delete-user-${user.id}`}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-muted-foreground">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" data-testid="organizations-content">
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>All organizations on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="organizations-table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Name</th>
                        <th className="text-left py-3 px-2 font-medium">Owner</th>
                        <th className="text-left py-3 px-2 font-medium">Properties</th>
                        <th className="text-left py-3 px-2 font-medium">Units</th>
                        <th className="text-left py-3 px-2 font-medium">Plan</th>
                        <th className="text-left py-3 px-2 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizations.map((org) => (
                        <tr key={org.id} className="border-b hover:bg-muted/50" data-testid={`org-row-${org.id}`}>
                          <td className="py-3 px-2 font-medium">{org.name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{org.owner_email}</td>
                          <td className="py-3 px-2">{org.property_count || 0}</td>
                          <td className="py-3 px-2">{org.unit_count || 0}</td>
                          <td className="py-3 px-2">
                            <Badge variant={org.subscription_plan === 'pro' ? 'default' : org.subscription_plan === 'standard' ? 'secondary' : 'outline'}>
                              {org.subscription_plan || 'free'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                      {organizations.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-muted-foreground">
                            No organizations found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" data-testid="billing-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                  <p className="text-3xl font-bold text-green-600">${stats?.mrr || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Annual Recurring Revenue</p>
                  <p className="text-3xl font-bold text-blue-600">${(stats?.mrr || 0) * 12}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Paying Customers</p>
                  <p className="text-3xl font-bold">{(stats?.standard_users || 0) + (stats?.pro_users || 0)}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Standard Plan ($49/mo)</p>
                      <p className="text-sm text-muted-foreground">{stats?.standard_users || 0} subscribers</p>
                    </div>
                    <p className="text-xl font-bold">${(stats?.standard_users || 0) * 49}/mo</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Pro Plan ($149/mo)</p>
                      <p className="text-sm text-muted-foreground">{stats?.pro_users || 0} subscribers</p>
                    </div>
                    <p className="text-xl font-bold">${(stats?.pro_users || 0) * 149}/mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" data-testid="blog-content">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Blog Management</CardTitle>
                    <CardDescription>Create, edit, and manage blog posts</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleGenerateBlog} disabled={generatingBlog} data-testid="generate-blog-btn">
                      {generatingBlog ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      AI Generate
                    </Button>
                    <Button onClick={() => handleEditBlog(null)} data-testid="create-blog-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      New Post
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blogPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No blog posts yet</p>
                      <p className="text-sm">Click "New Post" to create one or "AI Generate" to auto-generate</p>
                    </div>
                  ) : (
                    blogPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`blog-row-${post.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={post.status === 'published' ? 'secondary' : 'outline'}>
                              {post.status || 'published'}
                            </Badge>
                            <Badge variant="outline">{post.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="sm" asChild data-testid={`view-blog-${post.id}`}>
                            <Link to={`/blog/${post.slug}`} target="_blank">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditBlog(post)} data-testid={`edit-blog-${post.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBlog(post.id)} data-testid={`delete-blog-${post.id}`}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" data-testid="logs-content">
            <Card>
              <CardHeader>
                <CardTitle>Platform Audit Logs</CardTitle>
                <CardDescription>Track all platform-wide activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {auditLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-4 p-3 border rounded-lg" data-testid={`audit-log-${i}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          log.type === 'error' ? 'bg-red-100 text-red-600' :
                          log.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {log.type === 'error' ? <XCircle className="w-4 h-4" /> :
                           log.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                           <CheckCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground truncate">{log.details}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.user_email} • {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">No audit logs available</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" data-testid="settings-content">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>Enable or disable platform features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: 'maintenance_requests', name: 'Maintenance Requests', description: 'Allow users to create maintenance requests' },
                      { id: 'tenant_screening', name: 'Tenant Screening', description: 'Enable tenant screening feature' },
                      { id: 'ai_insights', name: 'AI Insights', description: 'Enable AI-powered insights dashboard' },
                      { id: 'auto_blog', name: 'Auto Blog Generation', description: 'Automatically generate blog posts weekly' }
                    ].map((flag) => (
                      <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`feature-flag-${flag.id}`}>
                        <div>
                          <p className="font-medium">{flag.name}</p>
                          <p className="text-sm text-muted-foreground">{flag.description}</p>
                        </div>
                        <Switch
                          checked={featureFlags[flag.id] ?? true}
                          onCheckedChange={(value) => handleUpdateFeatureFlag(flag.id, value)}
                          data-testid={`toggle-flag-${flag.id}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Version</p>
                      <p className="font-medium">1.0.0</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Environment</p>
                      <p className="font-medium">Production</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Database</p>
                      <p className="font-medium">MongoDB</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">AI Provider</p>
                      <p className="font-medium">OpenAI GPT-4</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Detail Dialog */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user account information
            </DialogDescription>
          </DialogHeader>
          {loadingAction ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : selectedUserDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedUserDetails.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUserDetails.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plan</Label>
                  <Badge variant={selectedUserDetails.subscription_plan === 'pro' ? 'default' : 'secondary'}>
                    {selectedUserDetails.subscription_plan || 'free'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedUserDetails.disabled ? 'destructive' : 'success'} className={selectedUserDetails.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {selectedUserDetails.disabled ? 'Disabled' : 'Active'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">2FA Enabled</Label>
                  <p className="font-medium">{selectedUserDetails.two_factor_enabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">{selectedUserDetails.created_at ? new Date(selectedUserDetails.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              
              {selectedUserDetails.stats && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Activity Stats</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xl font-bold">{selectedUserDetails.stats.properties}</p>
                      <p className="text-xs text-muted-foreground">Properties</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xl font-bold">{selectedUserDetails.stats.units}</p>
                      <p className="text-xs text-muted-foreground">Units</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xl font-bold">{selectedUserDetails.stats.tenants}</p>
                      <p className="text-xs text-muted-foreground">Tenants</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xl font-bold">{selectedUserDetails.stats.maintenance_requests}</p>
                      <p className="text-xs text-muted-foreground">Maintenance</p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedUserDetails.organizations?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Organizations</Label>
                  <div className="space-y-2">
                    {selectedUserDetails.organizations.map((org) => (
                      <div key={org.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedUserDetails.memberships?.find(m => m.org_id === org.id)?.role || 'member'}
                          </p>
                        </div>
                        <Badge variant="outline">{org.subscription_plan || 'free'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleImpersonateUser(selectedUserDetails?.id)} data-testid="dialog-impersonate-btn">
              <LogIn className="w-4 h-4 mr-2" />
              Impersonate
            </Button>
            <Button 
              variant={selectedUserDetails?.disabled ? 'default' : 'outline'}
              onClick={() => handleToggleUserStatus(selectedUserDetails?.id)}
              data-testid="dialog-toggle-status-btn"
            >
              {selectedUserDetails?.disabled ? (
                <><UserCheck className="w-4 h-4 mr-2" /> Enable User</>
              ) : (
                <><UserX className="w-4 h-4 mr-2" /> Disable User</>
              )}
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteUser(selectedUserDetails?.id)} data-testid="dialog-delete-btn">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blog Edit Dialog */}
      <Dialog open={editBlogOpen} onOpenChange={setEditBlogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBlog ? 'Edit Blog Post' : 'Create Blog Post'}</DialogTitle>
            <DialogDescription>
              {selectedBlog ? 'Update the blog post content' : 'Write a new blog post for your audience'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={blogForm.title}
                onChange={(e) => setBlogForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter blog post title"
                data-testid="blog-title-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={blogForm.category} onValueChange={(value) => setBlogForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger data-testid="blog-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Property Management">Property Management</SelectItem>
                    <SelectItem value="Tenant Relations">Tenant Relations</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Legal & Compliance">Legal & Compliance</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Industry News">Industry News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={blogForm.status} onValueChange={(value) => setBlogForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger data-testid="blog-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={blogForm.excerpt}
                onChange={(e) => setBlogForm(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Short description for previews..."
                rows={2}
                data-testid="blog-excerpt-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={blogForm.content}
                onChange={(e) => setBlogForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog post content here... (Markdown supported)"
                rows={12}
                className="font-mono text-sm"
                data-testid="blog-content-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description (SEO)</Label>
              <Textarea
                id="meta_description"
                value={blogForm.meta_description}
                onChange={(e) => setBlogForm(prev => ({ ...prev, meta_description: e.target.value }))}
                placeholder="Description for search engines (max 160 characters)"
                rows={2}
                maxLength={160}
                data-testid="blog-meta-input"
              />
              <p className="text-xs text-muted-foreground">{blogForm.meta_description.length}/160 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">SEO Keywords</Label>
              <Input
                id="keywords"
                value={blogForm.keywords?.join(', ') || ''}
                onChange={(e) => setBlogForm(prev => ({ 
                  ...prev, 
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                }))}
                placeholder="keyword1, keyword2, keyword3 (comma-separated)"
                data-testid="blog-keywords-input"
              />
              <p className="text-xs text-muted-foreground">
                {blogForm.keywords?.length || 0} keywords • Recommended: 5-7 relevant keywords
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBlogOpen(false)} data-testid="blog-cancel-btn">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveBlog} disabled={loadingAction} data-testid="blog-save-btn">
              {loadingAction ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {selectedBlog ? 'Update Post' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
