import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { 
  DollarSign, Calendar, CheckCircle, Clock, AlertTriangle,
  Plus, Loader2, TrendingUp, Users, Home, CreditCard,
  ChevronRight, Download, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const RentPayments = () => {
  const { token, currentOrg } = useAuth();
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

  useEffect(() => {
    if (currentOrg) {
      fetchData();
    }
  }, [currentOrg, selectedMonth, selectedYear, filter]);

  const fetchData = async () => {
    try {
      let url = `${API}/api/rent-payments?org_id=${currentOrg.id}&month=${selectedMonth}&year=${selectedYear}`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      
      const [paymentsRes, summaryRes, tenantsRes, unitsRes] = await Promise.all([
        axios.get(url, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/rent-payments/summary?org_id=${currentOrg.id}&month=${selectedMonth}&year=${selectedYear}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/organizations/${currentOrg.id}/tenants`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/organizations/${currentOrg.id}/units`, { headers: { Authorization: `Bearer ${token}` } })
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

  const handleCreatePayment = async () => {
    if (!formTenant || !formUnit || !formAmount || !formDueDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/api/rent-payments?org_id=${currentOrg.id}`, {
        tenant_id: formTenant,
        unit_id: formUnit,
        amount: parseFloat(formAmount),
        due_date: new Date(formDueDate).toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
      await axios.post(
        `${API}/api/rent-payments/${selectedPayment.id}/record-payment?amount=${recordAmount}&payment_method=${recordMethod}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Payment recorded');
      setRecordDialogOpen(false);
      setRecordAmount('');
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateMonthly = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API}/api/rent-payments/generate-monthly?org_id=${currentOrg.id}&month=${selectedMonth}&year=${selectedYear}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(res.data.message);
      setGenerateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate payments');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTenant('');
    setFormUnit('');
    setFormAmount('');
    setFormDueDate('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-700">Partial</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="rent-payments-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rent Payments</h1>
          <p className="text-muted-foreground">Track and manage rent collection</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate Monthly
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setCreateDialogOpen(true)}
            data-testid="new-payment-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, idx) => (
              <SelectItem key={idx} value={(idx + 1).toString()}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_expected)}</p>
                  <p className="text-sm text-muted-foreground">Expected</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_collected)}</p>
                  <p className="text-sm text-muted-foreground">Collected</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_outstanding)}</p>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.collection_rate}%</p>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Alert */}
      {summary && summary.overdue_count > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  {summary.overdue_count} overdue payment{summary.overdue_count > 1 ? 's' : ''} totaling {formatCurrency(summary.overdue_amount)}
                </p>
                <p className="text-sm text-red-600">Action required - follow up with tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>{months[selectedMonth - 1]} {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No payments found</h3>
              <p className="text-muted-foreground mb-4">Generate monthly payments or add them manually</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
                  Generate Monthly
                </Button>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  Add Payment
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`payment-${payment.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      payment.status === 'paid' ? 'bg-green-100' :
                      payment.status === 'overdue' ? 'bg-red-100' :
                      payment.status === 'partial' ? 'bg-blue-100' :
                      'bg-yellow-100'
                    }`}>
                      {payment.status === 'paid' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                       payment.status === 'overdue' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                       <Clock className="w-5 h-5 text-yellow-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{payment.tenant_name}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {payment.property_name} - Unit {payment.unit_number}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                      {payment.paid_amount > 0 && payment.paid_amount < payment.amount && (
                        <p className="text-sm text-green-600">Paid: {formatCurrency(payment.paid_amount)}</p>
                      )}
                    </div>
                    {payment.status !== 'paid' && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setRecordAmount((payment.amount - payment.paid_amount).toString());
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Rent Payment</DialogTitle>
            <DialogDescription>Create a new rent payment record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tenant *</Label>
              <Select value={formTenant} onValueChange={setFormTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name || `${tenant.first_name} ${tenant.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select value={formUnit} onValueChange={setFormUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      Unit {unit.unit_number} - {formatCurrency(unit.rent_amount || 0)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input 
                type="date" 
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleCreatePayment}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedPayment && `${selectedPayment.tenant_name} - ${formatCurrency(selectedPayment.amount - selectedPayment.paid_amount)} remaining`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount Received *</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={recordAmount}
                onChange={(e) => setRecordAmount(e.target.value)}
              />
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
                  <SelectItem value="money_order">Money Order</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleRecordPayment}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Monthly Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Monthly Rent</DialogTitle>
            <DialogDescription>
              Create rent payment records for all active tenants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This will create rent payment records for all active tenants with assigned units for {months[selectedMonth - 1]} {selectedYear}.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700" 
                onClick={handleGenerateMonthly}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentPayments;
