import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Home,
  Search,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

const Properties = () => {
  const { api, currentOrg } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    total_units: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [currentOrg]);

  const fetchProperties = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const response = await api.get(`/organizations/${currentOrg.org_id}/properties`);
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedProperty) {
        await api.put(`/organizations/${currentOrg.org_id}/properties/${selectedProperty.id}`, formData);
        toast.success('Property updated successfully');
      } else {
        await api.post(`/organizations/${currentOrg.org_id}/properties`, formData);
        toast.success('Property created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProperties();
    } catch (error) {
      console.error('Failed to save property:', error);
      toast.error('Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProperty) return;
    try {
      await api.delete(`/organizations/${currentOrg.org_id}/properties/${selectedProperty.id}`);
      toast.success('Property deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedProperty(null);
      fetchProperties();
    } catch (error) {
      console.error('Failed to delete property:', error);
      toast.error('Failed to delete property');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', description: '', total_units: 0 });
    setSelectedProperty(null);
  };

  const openEditDialog = (property) => {
    setSelectedProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      description: property.description || '',
      total_units: property.total_units
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (property) => {
    setSelectedProperty(property);
    setIsDeleteDialogOpen(true);
  };

  const filteredProperties = properties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6" data-testid="properties-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading">Properties</h1>
            <p className="text-muted-foreground mt-1">
              Manage your property portfolio
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-active" data-testid="add-property-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
                <DialogDescription>
                  {selectedProperty ? 'Update the property details below.' : 'Enter the details for your new property.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Sunset Apartments"
                      required
                      data-testid="property-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, City, State"
                      required
                      data-testid="property-address-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_units">Total Units</Label>
                    <Input
                      id="total_units"
                      type="number"
                      min="0"
                      value={formData.total_units}
                      onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) || 0 })}
                      data-testid="property-units-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the property..."
                      rows={3}
                      data-testid="property-description-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} data-testid="property-submit-btn">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {selectedProperty ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="property-search"
          />
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="glass">
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full rounded-lg mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first property'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsDialogOpen(true)} data-testid="empty-add-property-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <Card 
                key={property.id} 
                className="glass card-hover cursor-pointer group"
                data-testid={`property-card-${property.id}`}
              >
                <CardContent className="p-0">
                  <div 
                    className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-xl flex items-center justify-center"
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
                    <Building2 className="w-16 h-16 text-primary/50" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        <h3 className="font-semibold text-lg font-heading group-hover:text-primary transition-colors">
                          {property.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{property.address}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`property-menu-${property.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(property)} data-testid={`edit-property-${property.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(property)} 
                            className="text-destructive"
                            data-testid={`delete-property-${property.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {property.total_units} units
                      </Badge>
                    </div>
                    {property.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {property.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedProperty?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" data-testid="confirm-delete-property">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Properties;
