import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Home,
  ArrowLeft,
  Loader2,
  Bed,
  Bath,
  Square,
  DollarSign,
  User
} from 'lucide-react';
import { toast } from 'sonner';

const PropertyDetail = () => {
  const { propertyId } = useParams();
  const { api, currentOrg } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    property_id: propertyId,
    unit_number: '',
    bedrooms: 1,
    bathrooms: 1,
    square_feet: '',
    rent_amount: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPropertyData();
  }, [currentOrg, propertyId]);

  const fetchPropertyData = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const [propertyRes, unitsRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.org_id}/properties/${propertyId}`),
        api.get(`/organizations/${currentOrg.org_id}/units?property_id=${propertyId}`)
      ]);
      setProperty(propertyRes.data);
      setUnits(unitsRes.data);
    } catch (error) {
      console.error('Failed to fetch property:', error);
      toast.error('Failed to load property details');
      navigate('/properties');
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
        square_feet: formData.square_feet ? parseInt(formData.square_feet) : null,
        rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null
      };
      await api.post(`/organizations/${currentOrg.org_id}/units`, data);
      toast.success('Unit created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchPropertyData();
    } catch (error) {
      console.error('Failed to create unit:', error);
      toast.error('Failed to create unit');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: propertyId,
      unit_number: '',
      bedrooms: 1,
      bathrooms: 1,
      square_feet: '',
      rent_amount: ''
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="property-detail">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/properties')} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-heading">{property?.name}</h1>
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>{property?.address}</span>
            </div>
          </div>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{property?.total_units}</p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <User className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{units.filter(u => u.tenant_id).length}</p>
                <p className="text-sm text-muted-foreground">Occupied</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Home className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{units.filter(u => !u.tenant_id).length}</p>
                <p className="text-sm text-muted-foreground">Vacant</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {property?.description && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{property.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Units Section */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-heading">Units</CardTitle>
              <CardDescription>Manage units in this property</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn-active" data-testid="add-unit-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Unit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Unit</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new unit.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_number">Unit Number</Label>
                      <Input
                        id="unit_number"
                        value={formData.unit_number}
                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                        placeholder="e.g., 101, A1"
                        required
                        data-testid="unit-number-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          min="0"
                          value={formData.bedrooms}
                          onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                          data-testid="unit-bedrooms-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          min="0"
                          step="0.5"
                          value={formData.bathrooms}
                          onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) || 0 })}
                          data-testid="unit-bathrooms-input"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="square_feet">Square Feet</Label>
                        <Input
                          id="square_feet"
                          type="number"
                          min="0"
                          value={formData.square_feet}
                          onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
                          placeholder="Optional"
                          data-testid="unit-sqft-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rent_amount">Rent Amount ($)</Label>
                        <Input
                          id="rent_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.rent_amount}
                          onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                          placeholder="Optional"
                          data-testid="unit-rent-input"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} data-testid="unit-submit-btn">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Create Unit
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No units yet</p>
                <p className="text-sm mt-1">Add your first unit to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Beds/Baths</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map(unit => (
                    <TableRow key={unit.id} data-testid={`unit-row-${unit.id}`}>
                      <TableCell className="font-medium font-mono">{unit.unit_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Bed className="w-4 h-4 text-muted-foreground" />
                            {unit.bedrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4 text-muted-foreground" />
                            {unit.bathrooms}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {unit.square_feet ? (
                          <span className="flex items-center gap-1">
                            <Square className="w-4 h-4 text-muted-foreground" />
                            {unit.square_feet} sqft
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {unit.rent_amount ? (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            {unit.rent_amount.toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={unit.tenant_id ? 'default' : 'secondary'}>
                          {unit.tenant_id ? 'Occupied' : 'Vacant'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PropertyDetail;
