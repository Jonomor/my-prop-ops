import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Search, UserCheck, AlertTriangle, CheckCircle, XCircle, 
  Clock, FileText, RefreshCw, Loader2, Shield, CreditCard,
  Home, DollarSign, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const Screening = () => {
  const { token, currentOrg } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [screeningType, setScreeningType] = useState('comprehensive');
  const [includeCredit, setIncludeCredit] = useState(true);
  const [includeCriminal, setIncludeCriminal] = useState(true);
  const [includeEviction, setIncludeEviction] = useState(true);
  const [includeIncome, setIncludeIncome] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      fetchScreenings();
      fetchTenants();
    }
  }, [currentOrg]);

  const fetchScreenings = async () => {
    try {
      const res = await axios.get(`${API}/api/screening/requests?org_id=${currentOrg.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScreenings(res.data);
    } catch (error) {
      console.error('Failed to fetch screenings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await axios.get(`${API}/api/organizations/${currentOrg.id}/tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenants(res.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  };

  const handleSubmitScreening = async () => {
    if (!selectedTenant) {
      toast.error('Please select a tenant');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/api/screening/requests?org_id=${currentOrg.id}`, {
        tenant_id: selectedTenant,
        screening_type: screeningType,
        include_credit: includeCredit,
        include_criminal: includeCriminal,
        include_eviction: includeEviction,
        include_income: includeIncome
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Screening request submitted');
      setDialogOpen(false);
      setSelectedTenant('');
      fetchScreenings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit screening');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Processing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const getRecommendationBadge = (rec) => {
    switch (rec) {
      case 'approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'conditional':
        return <Badge className="bg-yellow-500 text-white">Conditional</Badge>;
      case 'denied':
        return <Badge className="bg-red-500 text-white">Denied</Badge>;
      default:
        return null;
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const viewDetails = (screening) => {
    setSelectedScreening(screening);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="screening-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenant Screening</h1>
          <p className="text-muted-foreground">Run background checks on prospective tenants</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setDialogOpen(true)}
          data-testid="new-screening-btn"
        >
          <Search className="w-4 h-4 mr-2" />
          New Screening
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{screenings.length}</p>
                <p className="text-sm text-muted-foreground">Total Screenings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{screenings.filter(s => s.overall_recommendation === 'approved').length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{screenings.filter(s => s.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{screenings.filter(s => s.overall_recommendation === 'denied').length}</p>
                <p className="text-sm text-muted-foreground">Denied</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Screenings List */}
      <Card>
        <CardHeader>
          <CardTitle>Screening Results</CardTitle>
          <CardDescription>View and manage tenant screening reports</CardDescription>
        </CardHeader>
        <CardContent>
          {screenings.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No screenings yet</h3>
              <p className="text-muted-foreground mb-4">Run your first tenant screening to get started</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Search className="w-4 h-4 mr-2" />
                New Screening
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {screenings.map((screening) => (
                <div 
                  key={screening.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => viewDetails(screening)}
                  data-testid={`screening-${screening.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-full">
                      <UserCheck className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{screening.tenant_name}</h3>
                        {getStatusBadge(screening.status)}
                        {screening.overall_recommendation && getRecommendationBadge(screening.overall_recommendation)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Type: {screening.screening_type}</span>
                        <span>Requested: {new Date(screening.requested_at).toLocaleDateString()}</span>
                        {screening.risk_score !== null && (
                          <span className={`font-semibold ${getRiskColor(screening.risk_score)}`}>
                            Risk Score: {screening.risk_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Screening Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Tenant Screening</DialogTitle>
            <DialogDescription>Select a tenant and screening options</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Tenant *</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name || `${tenant.first_name} ${tenant.last_name}`} - {tenant.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Screening Type</Label>
              <Select value={screeningType} onValueChange={setScreeningType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic ($15)</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive ($35)</SelectItem>
                  <SelectItem value="premium">Premium ($55)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Include Checks</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="credit" 
                    checked={includeCredit}
                    onCheckedChange={setIncludeCredit}
                  />
                  <Label htmlFor="credit" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" /> Credit Check
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="criminal" 
                    checked={includeCriminal}
                    onCheckedChange={setIncludeCriminal}
                  />
                  <Label htmlFor="criminal" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" /> Criminal Background
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="eviction" 
                    checked={includeEviction}
                    onCheckedChange={setIncludeEviction}
                  />
                  <Label htmlFor="eviction" className="flex items-center gap-2 cursor-pointer">
                    <Home className="w-4 h-4" /> Eviction History
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="income" 
                    checked={includeIncome}
                    onCheckedChange={setIncludeIncome}
                  />
                  <Label htmlFor="income" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="w-4 h-4" /> Income Verification
                  </Label>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleSubmitScreening}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <>Submit Screening Request</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screening Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Screening Results</DialogTitle>
            <DialogDescription>{selectedScreening?.tenant_name}</DialogDescription>
          </DialogHeader>
          {selectedScreening && (
            <div className="space-y-4">
              {selectedScreening.status === 'pending' ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-emerald-600 mb-4" />
                  <p className="text-muted-foreground">Screening in progress...</p>
                  <Button variant="outline" className="mt-4" onClick={() => { fetchScreenings(); setDetailsOpen(false); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                  </Button>
                </div>
              ) : (
                <>
                  {/* Overall Recommendation */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Recommendation</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRecommendationBadge(selectedScreening.overall_recommendation)}
                        <span className={`text-xl font-bold ${getRiskColor(selectedScreening.risk_score)}`}>
                          Score: {selectedScreening.risk_score}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Credit Check */}
                  {selectedScreening.credit_score && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold">Credit Check</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Credit Score</p>
                          <p className="text-2xl font-bold">{selectedScreening.credit_score}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge className={
                            selectedScreening.credit_status === 'excellent' ? 'bg-green-100 text-green-700' :
                            selectedScreening.credit_status === 'good' ? 'bg-blue-100 text-blue-700' :
                            selectedScreening.credit_status === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {selectedScreening.credit_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Criminal Check */}
                  {selectedScreening.criminal_check && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold">Criminal Background</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedScreening.criminal_check === 'clear' ? (
                          <><CheckCircle className="w-5 h-5 text-green-600" /> No records found</>
                        ) : (
                          <><AlertTriangle className="w-5 h-5 text-yellow-600" /> Records found</>
                        )}
                      </div>
                      {selectedScreening.criminal_details && (
                        <p className="text-sm text-muted-foreground mt-2">{selectedScreening.criminal_details}</p>
                      )}
                    </div>
                  )}

                  {/* Eviction Check */}
                  {selectedScreening.eviction_history && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="w-5 h-5 text-orange-600" />
                        <h3 className="font-semibold">Eviction History</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedScreening.eviction_history === 'clear' ? (
                          <><CheckCircle className="w-5 h-5 text-green-600" /> No evictions found</>
                        ) : (
                          <><XCircle className="w-5 h-5 text-red-600" /> {selectedScreening.eviction_count} eviction(s) found</>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Income Verification */}
                  {selectedScreening.income_verification && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold">Income Verification</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge className="bg-green-100 text-green-700">Verified</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Income-to-Rent Ratio</p>
                          <p className="text-xl font-bold">{selectedScreening.income_ratio}x</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Completed: {new Date(selectedScreening.completed_at).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Screening;
