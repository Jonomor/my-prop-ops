import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { 
  Search, UserCheck, AlertTriangle, CheckCircle, XCircle, 
  Clock, FileText, RefreshCw, Loader2, Shield, CreditCard,
  Home, DollarSign, ChevronRight, Plus, Coins, ShoppingCart,
  User, Building2, Phone, Mail, Calendar, TrendingUp, TrendingDown,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

const Screening = () => {
  const { api, currentOrg } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState({ balance: 0, plan_included: 0, purchased: 0 });
  const [planAllowsScreening, setPlanAllowsScreening] = useState(false);
  
  // Dialog states
  const [newScreeningOpen, setNewScreeningOpen] = useState(false);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState(null);
  
  // Form states
  const [selectedTenant, setSelectedTenant] = useState('');
  const [screeningType, setScreeningType] = useState('comprehensive');
  const [includeCredit, setIncludeCredit] = useState(true);
  const [includeCriminal, setIncludeCriminal] = useState(true);
  const [includeEviction, setIncludeEviction] = useState(true);
  const [includeIncome, setIncludeIncome] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const creditPackages = [
    { id: 'single', name: '1 Screening', credits: 1, price: 39, perCredit: 39 },
    { id: 'pack5', name: '5 Screenings', credits: 5, price: 175, perCredit: 35, savings: 20 },
    { id: 'pack10', name: '10 Screenings', credits: 10, price: 320, perCredit: 32, savings: 70, popular: true },
    { id: 'pack25', name: '25 Screenings', credits: 25, price: 725, perCredit: 29, savings: 250 }
  ];

  useEffect(() => {
    if (currentOrg) {
      fetchData();
    }
  }, [currentOrg]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [screeningsRes, tenantsRes, creditsRes, planRes] = await Promise.all([
        api.get(`/screening/requests?org_id=${currentOrg.org_id}`),
        api.get(`/organizations/${currentOrg.org_id}/tenants`),
        api.get('/screening/credits'),
        api.get('/billing/subscription-status')
      ]);
      
      setScreenings(screeningsRes.data);
      setTenants(tenantsRes.data);
      setCredits(creditsRes.data);
      
      const plan = planRes.data?.plan || 'free';
      setPlanAllowsScreening(plan === 'standard' || plan === 'pro');
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScreening = async () => {
    if (!selectedTenant) {
      toast.error('Please select a tenant');
      return;
    }

    if (credits.balance <= 0) {
      toast.error('No screening credits available. Please purchase credits.');
      setBuyCreditsOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/screening/requests?org_id=${currentOrg.org_id}`, {
        tenant_id: selectedTenant,
        screening_type: screeningType,
        include_credit: includeCredit,
        include_criminal: includeCriminal,
        include_eviction: includeEviction,
        include_income: includeIncome
      });
      toast.success('Screening submitted! Results will be ready in 2-5 minutes.');
      setNewScreeningOpen(false);
      setSelectedTenant('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit screening');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchaseCredits = async (packageId) => {
    setPurchasing(true);
    try {
      const res = await api.post('/screening/purchase-credits', {
        package_id: packageId,
        return_url: window.location.href
      });
      
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        toast.success('Credits purchased successfully!');
        fetchData();
        setBuyCreditsOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to purchase credits');
    } finally {
      setPurchasing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRecommendationBadge = (rec) => {
    switch (rec) {
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'conditional':
        return <Badge className="bg-yellow-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" /> Conditional</Badge>;
      case 'denied':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" /> Denied</Badge>;
      default:
        return null;
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditScoreColor = (score) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6" data-testid="screening-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Tenant Screening</h1>
            <p className="text-muted-foreground mt-1">
              Run comprehensive background checks on prospective tenants
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button 
              variant="outline"
              onClick={() => setBuyCreditsOpen(true)}
              data-testid="buy-credits-btn"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Coins className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Buy Credits</span>
              <span className="sm:hidden">Credits</span>
            </Button>
            <Button 
              onClick={() => setNewScreeningOpen(true)}
              disabled={!planAllowsScreening}
              data-testid="new-screening-btn"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Screening</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Plan Notice */}
        {!planAllowsScreening && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Lock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Tenant Screening requires Standard or Pro plan
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Upgrade your plan to run background checks on prospective tenants.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => window.location.href = '/billing'}>
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Credits & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Credit Balance Card */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{credits.balance}</p>
                  <p className="text-sm text-muted-foreground">Screening Credits</p>
                </div>
              </div>
              {credits.balance <= 2 && credits.balance > 0 && (
                <p className="text-xs text-amber-600 mt-2">Running low! Purchase more credits.</p>
              )}
              {credits.balance === 0 && (
                <Button 
                  size="sm" 
                  className="w-full mt-3" 
                  onClick={() => setBuyCreditsOpen(true)}
                >
                  Buy Credits
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
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
                  <p className="text-sm text-muted-foreground">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Screenings List */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Screening History</CardTitle>
            <CardDescription>View all tenant screening reports</CardDescription>
          </CardHeader>
          <CardContent>
            {screenings.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No screenings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Run your first tenant screening to get started
                </p>
                <Button onClick={() => setNewScreeningOpen(true)} disabled={!planAllowsScreening}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Screening
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {screenings.map((screening) => (
                  <div 
                    key={screening.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedScreening(screening);
                      setDetailsOpen(true);
                    }}
                    data-testid={`screening-${screening.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{screening.tenant_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {screening.screening_type} screening · {new Date(screening.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {screening.status === 'completed' && screening.risk_score !== undefined && (
                        <div className="text-right">
                          <p className={`text-xl font-bold ${getRiskScoreColor(screening.risk_score)}`}>
                            {screening.risk_score}
                          </p>
                          <p className="text-xs text-muted-foreground">Risk Score</p>
                        </div>
                      )}
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(screening.status)}
                        {screening.overall_recommendation && getRecommendationBadge(screening.overall_recommendation)}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Screening Dialog */}
        <Dialog open={newScreeningOpen} onOpenChange={setNewScreeningOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                New Tenant Screening
              </DialogTitle>
              <DialogDescription>
                Run a comprehensive background check on a prospective tenant.
                This will use 1 screening credit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Credit Balance Notice */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="font-medium">Credits Available:</span>
                </div>
                <Badge variant={credits.balance > 0 ? "default" : "destructive"}>
                  {credits.balance} credits
                </Badge>
              </div>

              {/* Tenant Selection */}
              <div className="space-y-2">
                <Label>Select Tenant</Label>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger data-testid="tenant-select">
                    <SelectValue placeholder="Choose a tenant to screen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.first_name} {tenant.last_name} - {tenant.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Screening Type */}
              <div className="space-y-2">
                <Label>Screening Type</Label>
                <Select value={screeningType} onValueChange={setScreeningType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - Credit & Identity</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive - Full Background</SelectItem>
                    <SelectItem value="premium">Premium - Full + Income Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checks to Include */}
              <div className="space-y-3">
                <Label>Include in Report</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox checked={includeCredit} onCheckedChange={setIncludeCredit} />
                    <div>
                      <p className="font-medium text-sm">Credit Check</p>
                      <p className="text-xs text-muted-foreground">Credit score & history</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox checked={includeCriminal} onCheckedChange={setIncludeCriminal} />
                    <div>
                      <p className="font-medium text-sm">Criminal Check</p>
                      <p className="text-xs text-muted-foreground">Criminal records</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox checked={includeEviction} onCheckedChange={setIncludeEviction} />
                    <div>
                      <p className="font-medium text-sm">Eviction Check</p>
                      <p className="text-xs text-muted-foreground">Eviction history</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox checked={includeIncome} onCheckedChange={setIncludeIncome} />
                    <div>
                      <p className="font-medium text-sm">Income Verify</p>
                      <p className="text-xs text-muted-foreground">Employment & income</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNewScreeningOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitScreening} 
                disabled={submitting || credits.balance <= 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Run Screening (1 Credit)
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Buy Credits Dialog */}
        <Dialog open={buyCreditsOpen} onOpenChange={setBuyCreditsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Purchase Screening Credits
              </DialogTitle>
              <DialogDescription>
                Buy credits to run tenant background checks. Credits never expire.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              {creditPackages.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    pkg.popular ? 'border-primary border-2 relative' : ''
                  }`}
                  onClick={() => handlePurchaseCredits(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Best Value</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <p className="text-3xl font-bold">{pkg.credits}</p>
                    <p className="text-muted-foreground mb-4">{pkg.name}</p>
                    <p className="text-2xl font-bold text-primary">${pkg.price}</p>
                    <p className="text-sm text-muted-foreground">${pkg.perCredit}/screening</p>
                    {pkg.savings && (
                      <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                        Save ${pkg.savings}
                      </Badge>
                    )}
                    <Button 
                      className="w-full mt-4" 
                      variant={pkg.popular ? "default" : "outline"}
                      disabled={purchasing}
                    >
                      {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Purchase'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-lg">
              <Shield className="w-4 h-4" />
              <span>Secure payment powered by Stripe. Credits never expire.</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* Screening Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedScreening && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Screening Report: {selectedScreening.tenant_name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedScreening.screening_type} screening · Completed {selectedScreening.completed_at ? new Date(selectedScreening.completed_at).toLocaleDateString() : 'Processing...'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Overall Result */}
                  {selectedScreening.status === 'completed' && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Overall Recommendation</p>
                        <div className="mt-1">
                          {getRecommendationBadge(selectedScreening.overall_recommendation)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <p className={`text-3xl font-bold ${getRiskScoreColor(selectedScreening.risk_score)}`}>
                          {selectedScreening.risk_score}/100
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreening.status === 'pending' && (
                    <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Processing Screening</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Results will be ready in 2-5 minutes. Refresh to check status.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  )}

                  {/* Credit Score */}
                  {selectedScreening.credit_score && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Credit Report
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-4xl font-bold ${getCreditScoreColor(selectedScreening.credit_score)}`}>
                              {selectedScreening.credit_score}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">{selectedScreening.credit_status} Credit</p>
                          </div>
                          <div className="w-32">
                            <Progress 
                              value={(selectedScreening.credit_score - 300) / 5.5} 
                              className="h-3"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>300</span>
                              <span>850</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Criminal Check */}
                  {selectedScreening.criminal_check && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Criminal Background
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          {selectedScreening.criminal_check === 'clear' ? (
                            <>
                              <CheckCircle className="w-8 h-8 text-green-500" />
                              <div>
                                <p className="font-medium text-green-700">No Records Found</p>
                                <p className="text-sm text-muted-foreground">Criminal background check is clear</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-8 h-8 text-amber-500" />
                              <div>
                                <p className="font-medium text-amber-700">Records Found</p>
                                <p className="text-sm text-muted-foreground">{selectedScreening.criminal_details}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Eviction History */}
                  {selectedScreening.eviction_history && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Eviction History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          {selectedScreening.eviction_history === 'clear' ? (
                            <>
                              <CheckCircle className="w-8 h-8 text-green-500" />
                              <div>
                                <p className="font-medium text-green-700">No Evictions Found</p>
                                <p className="text-sm text-muted-foreground">No eviction records on file</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-8 h-8 text-red-500" />
                              <div>
                                <p className="font-medium text-red-700">{selectedScreening.eviction_count} Eviction(s) Found</p>
                                <p className="text-sm text-muted-foreground">Review detailed report for more information</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Income Verification */}
                  {selectedScreening.income_verification && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Income Verification
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedScreening.income_ratio >= 3 ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {selectedScreening.income_ratio >= 3 ? (
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              Income to Rent Ratio: <span className={selectedScreening.income_ratio >= 3 ? 'text-green-600' : 'text-yellow-600'}>
                                {selectedScreening.income_ratio}x
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedScreening.income_ratio >= 3 
                                ? 'Meets recommended 3x rent requirement'
                                : 'Below recommended 3x rent requirement'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                    Close
                  </Button>
                  <Button>
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Screening;
