import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { 
  DollarSign, Calendar, CheckCircle, Clock, AlertTriangle,
  Plus, Loader2, TrendingUp, Users, Home, CreditCard,
  ChevronRight, Download, RefreshCw, Building2, User,
  CircleDollarSign, Receipt, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';

const RentPayments = () => {
  const { api, currentOrg } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Form states
  const [formTenant, setFormTenant] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [recordAmount, setRecordAmount] = useState('');
  const [recordMethod, setRecordMethod] = useState('check');
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  useEffect(() => {
    if (currentOrg) {
      fetchData();
    }
  }, [currentOrg, selectedMonth, selectedYear, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/rent-payments?org_id=${currentOrg.org_id}&month=${selectedMonth}&year=${selectedYear}`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      
      const [paymentsRes, summaryRes, tenantsRes, unitsRes] = await Promise.all([
        api.get(url),
        api.get(`/rent-payments/summary?org_id=${currentOrg.org_id}&month=${selectedMonth}&year=${selectedYear}`),
        api.get(`/organizations/${currentOrg.org_id}/tenants`),
        api.get(`/organizations/${currentOrg.org_id}/units`)
      ]);
      
      setPayments(paymentsRes.data);
      setSummary(summaryRes.data);
      setTenants(tenantsRes.data);
      setUnits(unitsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormTenant('');
    setFormUnit('');
    setFormAmount('');
    setFormDueDate('');
  };

  const handleCreatePayment = async () => {
    if (!formTenant || !formAmount || !formDueDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/rent-payments?org_id=${currentOrg.org_id}`, {
        tenant_id: formTenant,
        unit_id: formUnit || '',
        amount: parseFloat(formAmount),
        due_date: new Date(formDueDate).toISOString()
      });
      
      toast.success('Rent payment created');
      setCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!recordAmount || parseFloat(recordAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/rent-payments/${selectedPayment.id}/record`, {
        amount: parseFloat(recordAmount),
        payment_method: recordMethod
      });
      
      toast.success('Payment recorded successfully!');
      setRecordDialogOpen(false);
      setSelectedPayment(null);
      setRecordAmount('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateMonthly = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/rent-payments/generate-monthly?org_id=${currentOrg.org_id}&month=${selectedMonth}&year=${selectedYear}`);
      toast.success(res.data.message);
      setGenerateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate payments');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-700"><CircleDollarSign className="w-3 h-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
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
      <div className="max-w-7xl mx-auto space-y-6" data-testid="rent-payments-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Rent Payments</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage tenant rent payments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Monthly
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="add-payment-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(summary.total_expected)}</p>
                  </div>
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Collected</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_collected)}</p>
                  </div>
                  <div className="p-3 bg-green-200 dark:bg-green-900/50 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.outstanding)}</p>
                  </div>
                  <div className="p-3 bg-amber-200 dark:bg-amber-900/50 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold">{summary.collection_rate}%</p>
                  </div>
                  <div className="w-16">
                    <Progress value={summary.collection_rate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments List */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Payment Records
            </CardTitle>
            <CardDescription>
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear} · {payments.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No payments for this period</h3>
                <p className="text-muted-foreground mb-4">
                  Generate monthly payments or add individual payment records
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Monthly
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div 
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                    data-testid={`payment-${payment.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.tenant_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.property_name && `${payment.property_name} · `}
                          {payment.unit_number && `Unit ${payment.unit_number} · `}
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                        {payment.paid_amount > 0 && payment.paid_amount < payment.amount && (
                          <p className="text-sm text-green-600">
                            Paid: {formatCurrency(payment.paid_amount)}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(payment.status)}
                      {payment.status !== 'paid' && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setRecordAmount((payment.amount - (payment.paid_amount || 0)).toString());
                            setRecordDialogOpen(true);
                          }}
                        >
                          Record Payment
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Payment Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Rent Payment</DialogTitle>
              <DialogDescription>
                Create a new rent payment record for a tenant.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tenant *</Label>
                <Select value={formTenant} onValueChange={setFormTenant}>
                  <SelectTrigger data-testid="payment-tenant-select">
                    <SelectValue placeholder="Select tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.first_name} {tenant.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unit (Optional)</Label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.property_name} - Unit {unit.unit_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-9"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePayment} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment received from {selectedPayment?.tenant_name}
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Total Due:</span>
                    <span className="font-bold">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Already Paid:</span>
                    <span className="text-green-600">{formatCurrency(selectedPayment.paid_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(selectedPayment.amount - (selectedPayment.paid_amount || 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount Received</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-9"
                      value={recordAmount}
                      onChange={(e) => setRecordAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={recordMethod} onValueChange={setRecordMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Monthly Dialog */}
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Monthly Payments</DialogTitle>
              <DialogDescription>
                Automatically create rent payment records for all active tenants for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This will create payment records for all active tenants who have a unit with rent amount set. Existing records will not be duplicated.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateMonthly} disabled={generating}>
                {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Payments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default RentPayments;
