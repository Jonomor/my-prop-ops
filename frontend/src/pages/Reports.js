import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  Building2, 
  Users, 
  Wrench, 
  ClipboardCheck,
  FileSpreadsheet,
  Loader2,
  Calendar,
  Lock
} from 'lucide-react';

const Reports = () => {
  const { api, currentOrg } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportingReport, setExportingReport] = useState(null);
  const [planAllowsReports, setPlanAllowsReports] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    checkPlanAccess();
  }, [currentOrg]);

  const checkPlanAccess = async () => {
    if (!currentOrg) return;
    try {
      const res = await api.get('/billing/subscription-status');
      const plan = res.data?.plan || 'free';
      setPlanAllowsReports(plan === 'standard' || plan === 'pro');
    } catch (error) {
      console.error('Error checking plan:', error);
    }
  };

  const reportTypes = [
    {
      id: 'properties',
      name: 'Properties Report',
      description: 'Export all properties with addresses, unit counts, and occupancy rates',
      icon: Building2,
      fields: ['Name', 'Address', 'Units', 'Occupancy Rate', 'Created Date']
    },
    {
      id: 'tenants',
      name: 'Tenants Report',
      description: 'Export all tenants with contact info, lease dates, and payment status',
      icon: Users,
      fields: ['Name', 'Email', 'Phone', 'Property', 'Unit', 'Lease Start', 'Lease End', 'Status']
    },
    {
      id: 'maintenance',
      name: 'Maintenance History',
      description: 'Export maintenance requests with status, priority, and resolution details',
      icon: Wrench,
      fields: ['Title', 'Property', 'Unit', 'Priority', 'Status', 'Created', 'Resolved', 'Contractor']
    },
    {
      id: 'inspections',
      name: 'Inspections Report',
      description: 'Export inspection history with dates, status, and assigned inspectors',
      icon: ClipboardCheck,
      fields: ['Property', 'Type', 'Status', 'Scheduled Date', 'Completed Date', 'Assigned To', 'Notes']
    }
  ];

  const exportReport = async (reportType, format) => {
    if (!planAllowsReports) {
      toast.error('Please upgrade to Standard or Pro to export reports');
      return;
    }

    setExportingReport(`${reportType}-${format}`);
    try {
      const response = await api.get(`/reports/export/${reportType}`, {
        params: { format, date_range: dateRange },
        responseType: format === 'csv' ? 'blob' : 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${reportType} report downloaded successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.detail || 'Failed to export report');
    } finally {
      setExportingReport(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8" data-testid="reports-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Export your data in CSV or PDF format
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]" data-testid="date-range-select">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Plan Notice */}
        {!planAllowsReports && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Lock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Exportable reports require Standard or Pro plan
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Upgrade your plan to export properties, tenants, maintenance, and inspection data.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => window.location.href = '/billing'}>
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Report Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {reportTypes.map((report) => (
            <Card key={report.id} className="glass" data-testid={`report-card-${report.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <report.icon className="w-5 h-5 text-primary" />
                  {report.name}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fields Preview */}
                <div className="flex flex-wrap gap-2">
                  {report.fields.map((field, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>

                {/* Export Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!planAllowsReports || exportingReport === `${report.id}-csv`}
                    onClick={() => exportReport(report.id, 'csv')}
                    data-testid={`export-csv-${report.id}`}
                  >
                    {exportingReport === `${report.id}-csv` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!planAllowsReports || exportingReport === `${report.id}-pdf`}
                    onClick={() => exportReport(report.id, 'pdf')}
                    data-testid={`export-pdf-${report.id}`}
                  >
                    {exportingReport === `${report.id}-pdf` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
