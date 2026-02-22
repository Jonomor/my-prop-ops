import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Home,
  Users,
  Wrench,
  Calendar,
  Lock,
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Analytics = () => {
  const { api, currentOrg } = useAuth();
  const [loading, setLoading] = useState(true);
  const [planAllowsAnalytics, setPlanAllowsAnalytics] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    if (currentOrg) {
      checkPlanAndFetchData();
    }
  }, [currentOrg, dateRange]);

  const checkPlanAndFetchData = async () => {
    setLoading(true);
    try {
      const [planRes, analyticsRes] = await Promise.all([
        api.get('/billing/subscription-status'),
        api.get(`/analytics/dashboard?date_range=${dateRange}`)
      ]);
      
      const plan = planRes.data?.plan || 'free';
      setPlanAllowsAnalytics(plan === 'pro');
      setAnalyticsData(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set demo data for non-pro users
      setAnalyticsData({
        occupancy: { current: 92, trend: 3, previous: 89 },
        revenue: { current: 45000, trend: 8, previous: 41667 },
        maintenance: { open: 5, avgResolution: 3.2, trend: -15 },
        tenants: { total: 42, newThisMonth: 3, leavingThisMonth: 1 },
        properties: { total: 8, occupiedUnits: 38, totalUnits: 41 },
        monthlyData: [
          { month: 'Jul', occupancy: 88, revenue: 38000, maintenance: 8 },
          { month: 'Aug', occupancy: 90, revenue: 40000, maintenance: 6 },
          { month: 'Sep', occupancy: 89, revenue: 41000, maintenance: 9 },
          { month: 'Oct', occupancy: 91, revenue: 43000, maintenance: 5 },
          { month: 'Nov', occupancy: 92, revenue: 44000, maintenance: 4 },
          { month: 'Dec', occupancy: 92, revenue: 45000, maintenance: 5 }
        ],
        topProperties: [
          { name: 'Oak Apartments', occupancy: 100, units: 12, revenue: 14400 },
          { name: 'Maple Heights', occupancy: 95, units: 20, revenue: 19000 },
          { name: 'Pine View Complex', occupancy: 88, units: 8, revenue: 7040 }
        ],
        maintenanceByCategory: [
          { category: 'Plumbing', count: 12, avgCost: 250 },
          { category: 'Electrical', count: 8, avgCost: 180 },
          { category: 'HVAC', count: 6, avgCost: 450 },
          { category: 'Appliances', count: 4, avgCost: 200 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, trend, trendLabel, icon: Icon, prefix = '', suffix = '' }) => (
    <Card className="glass">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold font-heading mt-1">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{Math.abs(trend)}% {trendLabel || 'vs last period'}</span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SimpleBarChart = ({ data, dataKey, label }) => {
    const maxValue = Math.max(...data.map(d => d[dataKey]));
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-8">{item.month}</span>
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(item[dataKey] / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-16 text-right">
              {dataKey === 'revenue' ? `$${(item[dataKey]/1000).toFixed(0)}k` : `${item[dataKey]}%`}
            </span>
          </div>
        ))}
      </div>
    );
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
      <div className="max-w-7xl mx-auto space-y-8" data-testid="analytics-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your portfolio performance and trends
            </p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]" data-testid="analytics-date-range">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plan Notice for non-Pro users */}
        {!planAllowsAnalytics && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Lock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  You're viewing sample analytics data
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Upgrade to Pro to see your real portfolio analytics with live data.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => window.location.href = '/billing'}>
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Occupancy Rate"
            value={analyticsData?.occupancy?.current}
            suffix="%"
            trend={analyticsData?.occupancy?.trend}
            icon={Home}
          />
          <StatCard
            title="Monthly Revenue"
            value={analyticsData?.revenue?.current}
            prefix="$"
            trend={analyticsData?.revenue?.trend}
            icon={DollarSign}
          />
          <StatCard
            title="Active Tenants"
            value={analyticsData?.tenants?.total}
            trend={analyticsData?.tenants?.newThisMonth > 0 ? ((analyticsData?.tenants?.newThisMonth / analyticsData?.tenants?.total) * 100).toFixed(0) : 0}
            trendLabel="new this month"
            icon={Users}
          />
          <StatCard
            title="Open Maintenance"
            value={analyticsData?.maintenance?.open}
            trend={analyticsData?.maintenance?.trend}
            trendLabel="vs last month"
            icon={Wrench}
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Occupancy Trend */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Occupancy Trend
              </CardTitle>
              <CardDescription>Monthly occupancy rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart 
                data={analyticsData?.monthlyData || []} 
                dataKey="occupancy"
                label="Occupancy %"
              />
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart 
                data={analyticsData?.monthlyData || []} 
                dataKey="revenue"
                label="Revenue"
              />
            </CardContent>
          </Card>
        </div>

        {/* Details Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Properties */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Top Performing Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analyticsData?.topProperties || []).map((prop, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{prop.name}</p>
                      <p className="text-sm text-muted-foreground">{prop.units} units</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={prop.occupancy >= 95 ? 'default' : 'secondary'}>
                        {prop.occupancy}% occupied
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">${prop.revenue.toLocaleString()}/mo</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Maintenance by Category */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Maintenance by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analyticsData?.maintenanceByCategory || []).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{cat.category}</p>
                      <p className="text-sm text-muted-foreground">{cat.count} requests</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${cat.avgCost}</p>
                      <p className="text-sm text-muted-foreground">avg cost</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
