import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Building2, Home, Users, DollarSign, Wrench, TrendingUp,
  LogOut, FileText, Calendar, AlertCircle, CheckCircle,
  Clock, BarChart3, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('ownerToken');
    const ownerData = localStorage.getItem('ownerData');
    
    if (!token || !ownerData) {
      navigate('/owner/login');
      return;
    }
    
    setOwner(JSON.parse(ownerData));
    fetchDashboardData(token);
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('ownerToken');
        localStorage.removeItem('ownerData');
        navigate('/owner/login');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerData');
    navigate('/owner/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const properties = dashboardData?.properties || [];
  const recentMaintenance = dashboardData?.recent_maintenance || [];
  const financials = dashboardData?.financials || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold">Owner Portal</h1>
              <p className="text-sm text-muted-foreground">{owner?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome back, {owner?.name?.split(' ')[0]}</h2>
          <p className="text-muted-foreground">Here's an overview of your property investments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Properties</p>
                  <p className="text-3xl font-bold">{stats.total_properties || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="text-3xl font-bold">{stats.total_units || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                  <p className="text-3xl font-bold">{stats.occupancy_rate || 0}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                {stats.occupancy_rate >= 90 ? (
                  <><ArrowUpRight className="w-4 h-4 text-green-500 mr-1" /><span className="text-green-500">Excellent</span></>
                ) : stats.occupancy_rate >= 75 ? (
                  <><TrendingUp className="w-4 h-4 text-yellow-500 mr-1" /><span className="text-yellow-500">Good</span></>
                ) : (
                  <><ArrowDownRight className="w-4 h-4 text-red-500 mr-1" /><span className="text-red-500">Needs attention</span></>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold">${(stats.monthly_revenue || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            {properties.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No properties assigned yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {properties.map((property) => (
                  <Card key={property.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{property.name}</h3>
                            <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                              {property.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">{property.address}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <p className="text-2xl font-bold">{property.total_units}</p>
                            <p className="text-xs text-muted-foreground">Units</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{property.occupied_units}</p>
                            <p className="text-xs text-muted-foreground">Occupied</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-emerald-600">
                              ${(property.monthly_rent || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Monthly Rent</p>
                          </div>
                        </div>
                      </div>
                      {property.vacant_units > 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-700 dark:text-yellow-400">
                            {property.vacant_units} vacant unit{property.vacant_units > 1 ? 's' : ''} - potential revenue: ${(property.vacant_units * (property.avg_rent || 0)).toLocaleString()}/mo
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Income
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gross Rent Potential</span>
                    <span className="font-semibold">${(financials.gross_potential || 0).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Actual Collected</span>
                    <span className="font-semibold text-green-600">${(financials.collected || 0).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Collection Rate</span>
                    <span className="font-semibold">{financials.collection_rate || 0}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Annual Revenue (Est.)</span>
                    <span className="font-semibold">${((financials.collected || 0) * 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avg. Rent per Unit</span>
                    <span className="font-semibold">${(financials.avg_rent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Open Maintenance</span>
                    <span className="font-semibold">{financials.open_maintenance || 0} requests</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">Detailed statements coming soon</p>
                <p className="text-sm text-muted-foreground">Contact your property manager for detailed financial reports</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            {recentMaintenance.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="font-medium">No maintenance issues</p>
                  <p className="text-muted-foreground text-sm">All properties are in good condition</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentMaintenance.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            request.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                            request.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            <Wrench className={`w-5 h-5 ${
                              request.priority === 'high' ? 'text-red-600' :
                              request.priority === 'medium' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{request.title}</p>
                            <p className="text-sm text-muted-foreground">{request.property_name} - Unit {request.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'in_progress' ? 'secondary' :
                            'outline'
                          }>
                            {request.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Questions about your properties? Contact your property manager.</p>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">
            Powered by MyPropOps
          </Link>
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;
