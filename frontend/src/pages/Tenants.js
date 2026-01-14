import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  Users, 
  Plus, 
  Search,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Home,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
};

const Tenants = () => {
  const { api, currentOrg } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    unit_id: '',
    lease_start: '',
    lease_end: '',
    status: 'pending'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const [tenantsRes, unitsRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.org_id}/tenants`),
        api.get(`/organizations/${currentOrg.org_id}/units`)
      ]);
      setTenants(tenantsRes.data);
      setUnits(unitsRes.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        unit_id: formData.unit_id || null,
        lease_start: formData.lease_start || null,
        lease_end: formData.lease_end || null
      };
      
      if (selectedTenant) {
        await api.put(`/organizations/${currentOrg.org_id}/tenants/${selectedTenant.id}`, data);
        toast.success('Tenant updated successfully');
      } else {
        await api.post(`/organizations/${currentOrg.org_id}/tenants`, data);
        toast.success('Tenant created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save tenant:', error);
      toast.error('Failed to save tenant');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      unit_id: '',
      lease_start: '',
      lease_end: '',
      status: 'pending'
    });
    setSelectedTenant(null);
  };

  const openEditDialog = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || '',
      unit_id: tenant.unit_id || '',
      lease_start: tenant.lease_start || '',
      lease_end: tenant.lease_end || '',
      status: tenant.status
    });
    setIsDialogOpen(true);
  };

  const getUnitInfo = (unitId) => {
    if (!unitId) return null;
    return units.find(u => u.id === unitId);
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const vacantUnits = units.filter(u => !u.tenant_id || (selectedTenant && u.tenant_id === selectedTenant.id));

  return (
    <Layout>
      <div className="space-y-6" data-testid="tenants-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading">Tenants</h1>
            <p className="text-muted-foreground mt-1">
              Manage your tenant records
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-active" data-testid="add-tenant-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
                <DialogDescription>
                  {selectedTenant ? 'Update tenant information.' : 'Enter the details for the new tenant.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      data-testid="tenant-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      data-testid="tenant-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      data-testid="tenant-phone-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Assign Unit</Label>
                    <Select value={formData.unit_id} onValueChange={(val) => setFormData({ ...formData, unit_id: val })}>
                      <SelectTrigger data-testid="tenant-unit-select">
                        <SelectValue placeholder="Select a unit (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No unit assigned</SelectItem>
                        {vacantUnits.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            Unit {unit.unit_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lease_start">Lease Start</Label>
                      <Input
                        id="lease_start"
                        type="date"
                        value={formData.lease_start}
                        onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
                        data-testid="tenant-lease-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lease_end">Lease End</Label>
                      <Input
                        id="lease_end"
                        type="date"
                        value={formData.lease_end}
                        onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
                        data-testid="tenant-lease-end"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                      <SelectTrigger data-testid="tenant-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} data-testid="tenant-submit-btn">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {selectedTenant ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="tenant-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tenants Table */}
        <Card className="glass">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tenants found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Get started by adding your first tenant'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Lease Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map(tenant => {
                    const unit = getUnitInfo(tenant.unit_id);
                    return (
                      <TableRow key={tenant.id} data-testid={`tenant-row-${tenant.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary">
                                {tenant.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{tenant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {tenant.email}
                            </div>
                            {tenant.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {tenant.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {unit ? (
                            <div className="flex items-center gap-1">
                              <Home className="w-4 h-4 text-muted-foreground" />
                              Unit {unit.unit_number}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tenant.lease_start && tenant.lease_end ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {new Date(tenant.lease_start).toLocaleDateString()} - {new Date(tenant.lease_end).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[tenant.status]}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditDialog(tenant)}
                            data-testid={`edit-tenant-${tenant.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Tenants;
