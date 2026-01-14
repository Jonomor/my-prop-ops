import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Building2, 
  Home, 
  Users, 
  ClipboardCheck, 
  Bell,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, loading }) => (
  <Card className="glass card-hover" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="text-3xl font-bold font-heading mt-1">{value}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-500' : 'text-destructive'}`}>
              {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{trend}</span>
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

const Dashboard = () => {
  const { api, currentOrg, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentOrg) return;
      
      setLoading(true);
      try {
        const [statsRes, logsRes] = await Promise.all([
          api.get(`/organizations/${currentOrg.org_id}/dashboard`),
          api.get(`/organizations/${currentOrg.org_id}/audit-logs`).catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data);
        setRecentActivity(logsRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api, currentOrg]);

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'bg-green-500/10 text-green-500';
      case 'updated': return 'bg-blue-500/10 text-blue-500';
      case 'deleted': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}! Here's what's happening with your properties.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Properties"
            value={stats?.total_properties || 0}
            icon={Building2}
            loading={loading}
          />
          <StatCard
            title="Total Units"
            value={stats?.total_units || 0}
            icon={Home}
            loading={loading}
          />
          <StatCard
            title="Active Tenants"
            value={stats?.active_tenants || 0}
            icon={Users}
            trend={stats ? `${stats.total_tenants} total` : null}
            trendUp={true}
            loading={loading}
          />
          <StatCard
            title="Pending Inspections"
            value={stats?.pending_inspections || 0}
            icon={ClipboardCheck}
            loading={loading}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 glass" data-testid="recent-activity">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Recent Activity</CardTitle>
              <CardDescription>Latest actions in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm mt-1">Start by adding properties or tenants</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {activity.user_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{activity.user_name}</span>
                          <Badge variant="secondary" className={getActionColor(activity.action)}>
                            {activity.action}
                          </Badge>
                          <span className="text-muted-foreground">{activity.entity_type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {activity.details}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats / Notifications */}
          <Card className="glass" data-testid="quick-stats">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Unread: {stats?.unread_notifications || 0}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Upcoming Inspections</p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{stats?.pending_inspections || 0}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Total Tenants</p>
                      <p className="text-xs text-muted-foreground">All statuses</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{stats?.total_tenants || 0}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Vacant Units</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {(stats?.total_units || 0) - (stats?.active_tenants || 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
