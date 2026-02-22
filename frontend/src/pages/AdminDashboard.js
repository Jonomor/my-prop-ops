import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Building2,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  FileText,
  Shield,
  LogOut,
  Search,
  Trash2,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  TrendingUp,
  Activity,
  Wrench,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editBlogOpen, setEditBlogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [generatingBlog, setGeneratingBlog] = useState(false);
  
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
      const [statsRes, usersRes, orgsRes, blogsRes, logsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/organizations'),
        api.get('/api/blog/posts'),
        api.get('/api/admin/audit-logs')
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setOrganizations(orgsRes.data);
      setBlogPosts(blogsRes.data);
      setAuditLogs(logsRes.data);
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

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success('User deleted');
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

  const handleGenerateBlog = async () => {
    setGeneratingBlog(true);
    try {
      const res = await api.post('/api/blog/generate');
      toast.success(`Generated: ${res.data.title}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to generate blog post');
    } finally {
      setGeneratingBlog(false);
    }
  };

  const handleUpdateFeatureFlag = async (flag, value) => {
    try {
      await api.put('/api/admin/feature-flags', { [flag]: value });
      setFeatureFlags(prev => ({ ...prev, [flag]: value }));
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
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
              <Card>
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
              <Card>
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
              <Card>
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
                          <div className="h-full bg-gray-400" style={{ width: `${(stats?.free_users / stats?.total_users * 100) || 0}%` }} />
                        </div>
                        <span className="font-medium">{stats?.free_users || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Standard</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(stats?.standard_users / stats?.total_users * 100) || 0}%` }} />
                        </div>
                        <span className="font-medium">{stats?.standard_users || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pro</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${(stats?.pro_users / stats?.total_users * 100) || 0}%` }} />
                        </div>
                        <span className="font-medium">{stats?.pro_users || 0}</span>
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
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        className="pl-9 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">User</th>
                        <th className="text-left py-3 px-2 font-medium">Email</th>
                        <th className="text-left py-3 px-2 font-medium">Plan</th>
                        <th className="text-left py-3 px-2 font-medium">Joined</th>
                        <th className="text-left py-3 px-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">{user.name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{user.email}</td>
                          <td className="py-3 px-2">
                            <Badge variant={user.subscription_plan === 'pro' ? 'default' : user.subscription_plan === 'standard' ? 'secondary' : 'outline'}>
                              {user.subscription_plan || 'free'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>All organizations on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
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
                        <tr key={org.id} className="border-b hover:bg-muted/50">
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
                            {new Date(org.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
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
                      <p className="font-medium">Standard Plan</p>
                      <p className="text-sm text-muted-foreground">{stats?.standard_users || 0} subscribers</p>
                    </div>
                    <p className="text-xl font-bold">${(stats?.standard_users || 0) * 49}/mo</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Pro Plan</p>
                      <p className="text-sm text-muted-foreground">{stats?.pro_users || 0} subscribers</p>
                    </div>
                    <p className="text-xl font-bold">${(stats?.pro_users || 0) * 149}/mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Blog Management</CardTitle>
                    <CardDescription>Manage blog posts and content</CardDescription>
                  </div>
                  <Button onClick={handleGenerateBlog} disabled={generatingBlog}>
                    {generatingBlog ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Generate New Post
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blogPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No blog posts yet</p>
                      <p className="text-sm">Click "Generate New Post" to create one</p>
                    </div>
                  ) : (
                    blogPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{post.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(post.published_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/blog/${post.slug}`} target="_blank">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBlog(post.id)}>
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
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Platform Audit Logs</CardTitle>
                <CardDescription>Track all platform-wide activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {auditLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-4 p-3 border rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          log.type === 'error' ? 'bg-red-100 text-red-600' :
                          log.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {log.type === 'error' ? <XCircle className="w-4 h-4" /> :
                           log.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                           <CheckCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">{log.details}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.user_email} • {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
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
                      { id: 'auto_blog', name: 'Auto Blog Generation', description: 'Automatically generate blog posts' }
                    ].map((flag) => (
                      <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{flag.name}</p>
                          <p className="text-sm text-muted-foreground">{flag.description}</p>
                        </div>
                        <Switch
                          checked={featureFlags[flag.id] ?? true}
                          onCheckedChange={(value) => handleUpdateFeatureFlag(flag.id, value)}
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
                      <p className="font-medium">MongoDB Atlas</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">AI Provider</p>
                      <p className="font-medium">OpenAI GPT-4o</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
