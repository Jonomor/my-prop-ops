import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar } from '../components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { format } from 'date-fns';
import { 
  ClipboardCheck, 
  Plus, 
  Search,
  Loader2,
  CalendarIcon,
  Building2,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const statusConfig = {
  scheduled: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  completed: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
  failed: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
  approved: { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: CheckCircle }
};

const Inspections = () => {
  const { api, currentOrg } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    scheduled_date: null,
    notes: ''
  });
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '',
    completed_date: null
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const [inspectionsRes, propertiesRes, unitsRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.org_id}/inspections`),
        api.get(`/organizations/${currentOrg.org_id}/properties`),
        api.get(`/organizations/${currentOrg.org_id}/units`)
      ]);
      setInspections(inspectionsRes.data);
      setProperties(propertiesRes.data);
      setUnits(unitsRes.data);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheduled_date) {
      toast.error('Please select a scheduled date');
      return;
    }
    setSaving(true);
    try {
      const data = {
        property_id: formData.property_id,
        unit_id: formData.unit_id || null,
        scheduled_date: format(formData.scheduled_date, 'yyyy-MM-dd'),
        notes: formData.notes || null
      };
      await api.post(`/organizations/${currentOrg.org_id}/inspections`, data);
      toast.success('Inspection scheduled successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create inspection:', error);
      toast.error('Failed to schedule inspection');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        status: updateData.status,
        notes: updateData.notes || null,
        completed_date: updateData.completed_date ? format(updateData.completed_date, 'yyyy-MM-dd') : null
      };
      await api.put(`/organizations/${currentOrg.org_id}/inspections/${selectedInspection.id}`, data);
      toast.success('Inspection updated successfully');
      setIsUpdateDialogOpen(false);
      setSelectedInspection(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update inspection:', error);
      toast.error('Failed to update inspection');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: '',
      unit_id: '',
      scheduled_date: null,
      notes: ''
    });
  };

  const openUpdateDialog = (inspection) => {
    setSelectedInspection(inspection);
    setUpdateData({
      status: inspection.status,
      notes: inspection.notes || '',
      completed_date: inspection.completed_date ? new Date(inspection.completed_date) : null
    });
    setIsUpdateDialogOpen(true);
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'Unknown';
  };

  const getUnitNumber = (unitId) => {
    if (!unitId) return null;
    const unit = units.find(u => u.id === unitId);
    return unit?.unit_number;
  };

  const filteredInspections = inspections.filter(i => {
    const propertyName = getPropertyName(i.property_id).toLowerCase();
    const matchesSearch = propertyName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const propertyUnits = formData.property_id 
    ? units.filter(u => u.property_id === formData.property_id)
    : [];

  return (
    <Layout>
      <div className="space-y-6" data-testid="inspections-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading">Inspections</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and track property inspections
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-active" data-testid="schedule-inspection-btn">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Inspection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Inspection</DialogTitle>
                <DialogDescription>
                  Create a new inspection for a property or unit.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="property">Property *</Label>
                    <Select 
                      value={formData.property_id} 
                      onValueChange={(val) => setFormData({ ...formData, property_id: val, unit_id: '' })}
                    >
                      <SelectTrigger data-testid="inspection-property-select">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map(property => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.property_id && propertyUnits.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit (Optional)</Label>
                      <Select 
                        value={formData.unit_id} 
                        onValueChange={(val) => setFormData({ ...formData, unit_id: val })}
                      >
                        <SelectTrigger data-testid="inspection-unit-select">
                          <SelectValue placeholder="Select a unit (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All units</SelectItem>
                          {propertyUnits.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              Unit {unit.unit_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Scheduled Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.scheduled_date && "text-muted-foreground"
                          )}
                          data-testid="inspection-date-btn"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.scheduled_date ? format(formData.scheduled_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.scheduled_date}
                          onSelect={(date) => setFormData({ ...formData, scheduled_date: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional notes..."
                      rows={3}
                      data-testid="inspection-notes-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving || !formData.property_id} data-testid="inspection-submit-btn">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Schedule
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
              placeholder="Search by property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="inspection-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="inspection-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inspections Table */}
        <Card className="glass">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredInspections.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No inspections found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Schedule your first inspection to get started'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInspections.map(inspection => {
                    const StatusIcon = statusConfig[inspection.status]?.icon || AlertCircle;
                    return (
                      <TableRow key={inspection.id} data-testid={`inspection-row-${inspection.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{getPropertyName(inspection.property_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {inspection.unit_id ? (
                            <div className="flex items-center gap-1">
                              <Home className="w-4 h-4 text-muted-foreground" />
                              {getUnitNumber(inspection.unit_id)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">All units</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            {new Date(inspection.scheduled_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {inspection.completed_date 
                            ? new Date(inspection.completed_date).toLocaleDateString()
                            : <span className="text-muted-foreground">-</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig[inspection.status]?.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {inspection.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openUpdateDialog(inspection)}
                            data-testid={`update-inspection-${inspection.id}`}
                          >
                            Update
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

        {/* Update Status Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Inspection</DialogTitle>
              <DialogDescription>
                Update the status and notes for this inspection.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateStatus}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={updateData.status} onValueChange={(val) => setUpdateData({ ...updateData, status: val })}>
                    <SelectTrigger data-testid="update-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(updateData.status === 'completed' || updateData.status === 'failed' || updateData.status === 'approved') && (
                  <div className="space-y-2">
                    <Label>Completed Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !updateData.completed_date && "text-muted-foreground"
                          )}
                          data-testid="update-completed-date-btn"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {updateData.completed_date ? format(updateData.completed_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={updateData.completed_date}
                          onSelect={(date) => setUpdateData({ ...updateData, completed_date: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="update_notes">Notes</Label>
                  <Textarea
                    id="update_notes"
                    value={updateData.notes}
                    onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                    placeholder="Add inspection notes..."
                    rows={3}
                    data-testid="update-notes-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} data-testid="update-inspection-submit">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Inspections;
