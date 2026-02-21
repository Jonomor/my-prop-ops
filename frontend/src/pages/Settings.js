import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { User, Mail, Calendar, Building2, Users, Copy, RefreshCw, FileText } from 'lucide-react';

const Settings = () => {
  const { user, organizations, currentOrg, api } = useAuth();
  const [tenantInviteCode, setTenantInviteCode] = useState(null);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [loadingCode, setLoadingCode] = useState(false);

  useEffect(() => {
    if (currentOrg?.org_id) {
      fetchTenantInviteCode();
      fetchDocumentRequests();
    }
  }, [currentOrg]);

  const fetchTenantInviteCode = async () => {
    try {
      const res = await api.get(`/api/organizations/${currentOrg.org_id}/tenant-invite-code`);
      setTenantInviteCode(res.data.invite_code);
    } catch (error) {
      // No code exists yet
      setTenantInviteCode(null);
    }
  };

  const fetchDocumentRequests = async () => {
    try {
      const res = await api.get(`/api/organizations/${currentOrg.org_id}/document-requests`);
      setDocumentRequests(res.data);
    } catch (error) {
      console.error('Failed to fetch document requests');
    }
  };

  const generateInviteCode = async () => {
    try {
      setLoadingCode(true);
      const res = await api.post(`/api/organizations/${currentOrg.org_id}/tenant-invite-code`);
      setTenantInviteCode(res.data.invite_code);
      toast.success('Tenant invite code generated!');
    } catch (error) {
      toast.error('Failed to generate code');
    } finally {
      setLoadingCode(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(tenantInviteCode);
    toast.success('Code copied to clipboard!');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6" data-testid="settings-page">
        <div>
          <h1 className="text-3xl font-bold font-heading">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user?.name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">User ID</p>
                <p className="font-mono text-xs mt-1">{user?.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Member Since</p>
                <p className="mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizations Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organizations
            </CardTitle>
            <CardDescription>Organizations you belong to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizations.map(org => (
                <div 
                  key={org.org_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    currentOrg?.org_id === org.org_id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{org.org_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(org.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{org.role}</Badge>
                    {currentOrg?.org_id === org.org_id && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
