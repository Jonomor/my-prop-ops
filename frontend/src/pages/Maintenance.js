import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Wrench, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  User,
  Building2,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  Zap,
  Droplets,
  Thermometer,
  Bug,
  Home,
  TreePine,
  HardHat,
  Image
} from 'lucide-react';

const categoryIcons = {
  plumbing: Droplets,
  electrical: Zap,
  hvac: Thermometer,
  appliances: Home,
  structural: Building2,
  pest_control: Bug,
  landscaping: TreePine,
  other: Wrench
};

const categoryColors = {
  plumbing: 'bg-blue-100 text-blue-700',
  electrical: 'bg-yellow-100 text-yellow-700',
  hvac: 'bg-orange-100 text-orange-700',
  appliances: 'bg-purple-100 text-purple-700',
  structural: 'bg-gray-100 text-gray-700',
  pest_control: 'bg-red-100 text-red-700',
  landscaping: 'bg-green-100 text-green-700',
  other: 'bg-slate-100 text-slate-700'
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700'
};

const statusColors = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  pending_parts: 'bg-purple-100 text-purple-700',
  scheduled: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700'
};

const Maintenance = () => {
  const { api, currentOrg } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assigningContractor, setAssigningContractor] = useState(false);

  // New request form state
  const [form, setForm] = useState({
    property_id: '',
    unit_id: '',
    tenant_id: '',
    category: 'other',
    priority: 'medium',
    title: '',
    description: '',
    preferred_access_time: '',
    permission_to_enter: false
  });

  useEffect(() => {
    if (currentOrg) {
      fetchData();
    }
  }, [currentOrg]);

  const fetchData = async () => {
    if (!currentOrg) return;
    
    try {
      const orgId = currentOrg.org_id;
      const [requestsRes, statsRes, propertiesRes, tenantsRes, membersRes, contractorsRes] = await Promise.all([
        api.get('/maintenance-requests'),
        api.get('/maintenance-requests/stats/summary'),
        api.get(`/organizations/${orgId}/properties`),
        api.get(`/organizations/${orgId}/tenants`),
        api.get(`/organizations/${orgId}/members`).catch(() => ({ data: [] })),
        api.get(`/organizations/${orgId}/contractors`).catch(() => ({ data: [] }))
      ]);
      
      setRequests(requestsRes.data);
      setStats(statsRes.data);
      setProperties(propertiesRes.data);
      setTenants(tenantsRes.data);
      setTeamMembers(membersRes.data);
      setContractors(contractorsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitsForProperty = async (propertyId) => {
    if (!currentOrg) return;
    try {
      const res = await api.get(`/organizations/${currentOrg.org_id}/units?property_id=${propertyId}`);
      setUnits(res.data);
    } catch (error) {
      setUnits([]);
    }
  };

  const handlePropertyChange = (propertyId) => {
    setForm({ ...form, property_id: propertyId, unit_id: '' });
    if (propertyId) {
      fetchUnitsForProperty(propertyId);
    } else {
      setUnits([]);
    }
  };

  const handleCreate = async () => {
    if (!form.property_id || !form.title || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      await api.post('/maintenance-requests', form);
      toast.success('Maintenance request created');
      setDialogOpen(false);
      setForm({
        property_id: '',
        unit_id: '',
        tenant_id: '',
        category: 'other',
        priority: 'medium',
        title: '',
        description: '',
        preferred_access_time: '',
        permission_to_enter: false
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error(error.response?.data?.detail || 'Failed to create request');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await api.put(`/maintenance-requests/${requestId}`, { status: newStatus });
      toast.success('Status updated');
      fetchData();
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (requestId, userId) => {
    try {
      await api.put(`/maintenance-requests/${requestId}`, { assigned_to: userId });
      toast.success('Request assigned');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign request');
    }
  };

  const handleAssignContractor = async (requestId, contractorId) => {
    if (!contractorId) return;
    setAssigningContractor(true);
    try {
      await api.post(`/maintenance-requests/${requestId}/assign-contractor`, {
        contractor_id: contractorId,
        scheduled_date: null,
        notes: null
      });
      toast.success('Contractor assigned! They will receive an email notification.');
      fetchData();
      setEditDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign contractor');
    } finally {
      setAssigningContractor(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (filterPriority !== 'all' && req.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        req.title.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q) ||
        req.property_name?.toLowerCase().includes(q) ||
        req.tenant_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="maintenance-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading">Maintenance Requests</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage property maintenance
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-request-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Maintenance Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property *</Label>
                    <Select value={form.property_id} onValueChange={handlePropertyChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={form.unit_id || "none"} onValueChange={v => setForm({ ...form, unit_id: v === "none" ? "" : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific unit</SelectItem>
                        {units.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="appliances">Appliances</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="pest_control">Pest Control</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input 
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea 
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed description of the maintenance issue..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tenant</Label>
                  <Select value={form.tenant_id || "none"} onValueChange={v => setForm({ ...form, tenant_id: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No tenant</SelectItem>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="permission"
                    checked={form.permission_to_enter}
                    onChange={e => setForm({ ...form, permission_to_enter: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="permission" className="text-sm cursor-pointer">
                    Permission to enter if no one is home
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    'Create Request'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <Wrench className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.open || 0}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats?.in_progress || 0}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <Loader2 className="w-8 h-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats?.emergency || 0}</p>
                  <p className="text-xs text-muted-foreground">Emergency</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <Wrench className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No maintenance requests</h3>
                <p className="text-muted-foreground mb-4">
                  {requests.length === 0 
                    ? "Create your first maintenance request to get started"
                    : "No requests match your filters"
                  }
                </p>
                {requests.length === 0 && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Request
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map(request => {
              const CategoryIcon = categoryIcons[request.category] || Wrench;
              return (
                <Card 
                  key={request.id} 
                  className={`glass hover:shadow-md transition-shadow cursor-pointer ${
                    request.priority === 'emergency' ? 'border-red-300' : ''
                  }`}
                  onClick={() => {
                    setSelectedRequest(request);
                    setEditDialogOpen(true);
                  }}
                  data-testid={`request-card-${request.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${categoryColors[request.category]}`}>
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{request.title}</h3>
                            <Badge className={priorityColors[request.priority]}>
                              {request.priority}
                            </Badge>
                            <Badge className={statusColors[request.status]}>
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {request.property_name}
                              {request.unit_number && ` - Unit ${request.unit_number}`}
                            </span>
                            {request.tenant_name && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {request.tenant_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {request.assigned_to_name && (
                        <Badge variant="outline" className="flex-shrink-0">
                          <User className="w-3 h-3 mr-1" />
                          {request.assigned_to_name}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Edit/View Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedRequest.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColors[selectedRequest.priority]}>
                      {selectedRequest.priority}
                    </Badge>
                    <Badge className={statusColors[selectedRequest.status]}>
                      {selectedRequest.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={categoryColors[selectedRequest.category]}>
                      {selectedRequest.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{selectedRequest.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Property</Label>
                      <p className="font-medium">{selectedRequest.property_name}</p>
                    </div>
                    {selectedRequest.unit_number && (
                      <div>
                        <Label className="text-muted-foreground">Unit</Label>
                        <p className="font-medium">{selectedRequest.unit_number}</p>
                      </div>
                    )}
                    {selectedRequest.tenant_name && (
                      <div>
                        <Label className="text-muted-foreground">Tenant</Label>
                        <p className="font-medium">{selectedRequest.tenant_name}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p className="font-medium">
                        {new Date(selectedRequest.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedRequest.permission_to_enter && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Permission to enter if no one is home
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Update Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {['open', 'in_progress', 'scheduled', 'completed', 'cancelled'].map(status => (
                        <Button
                          key={status}
                          variant={selectedRequest.status === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleUpdateStatus(selectedRequest.id, status)}
                        >
                          {status.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {teamMembers.length > 0 && (
                    <div className="space-y-2">
                      <Label>Assign to Team Member</Label>
                      <Select 
                        value={selectedRequest.assigned_to || 'unassigned'} 
                        onValueChange={v => handleAssign(selectedRequest.id, v === 'unassigned' ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {teamMembers.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Contractor Assignment */}
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-orange-500" />
                      Assign to Contractor
                    </Label>
                    {contractors.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRequest.contractor_id ? (
                          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center gap-2">
                              <HardHat className="w-5 h-5 text-orange-600" />
                              <span className="font-medium">{selectedRequest.contractor_name}</span>
                              <Badge variant="secondary">Assigned</Badge>
                            </div>
                          </div>
                        ) : (
                          <Select 
                            value={selectedRequest.contractor_id || ''} 
                            onValueChange={v => handleAssignContractor(selectedRequest.id, v)}
                            disabled={assigningContractor}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={assigningContractor ? "Assigning..." : "Select contractor"} />
                            </SelectTrigger>
                            <SelectContent>
                              {contractors.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{c.name}</span>
                                    {c.company_name && <span className="text-muted-foreground text-xs">({c.company_name})</span>}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Contractors will be notified via email when assigned
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No contractors connected. Go to Settings → Contractors to invite contractors.
                      </p>
                    )}
                  </div>

                  {/* Photos from tenant */}
                  {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Photos from Tenant ({selectedRequest.photos.length})
                      </Label>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedRequest.photos.map((photo, idx) => (
                          <img 
                            key={idx}
                            src={`${process.env.REACT_APP_BACKEND_URL}${photo}`}
                            alt={`Issue photo ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}${photo}`, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Maintenance;
