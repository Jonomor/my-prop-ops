import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Mail, 
  Building2, 
  Users,
  CheckCircle,
  Loader2,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

const PendingInvites = () => {
  const { api, refreshOrganizations, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    fetchPendingInvites();
  }, []);

  const fetchPendingInvites = async () => {
    setLoading(true);
    try {
      const response = await api.get('/invites/pending');
      setInvites(response.data);
    } catch (error) {
      console.error('Failed to fetch pending invites:', error);
      toast.error('Failed to load pending invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invite) => {
    setAcceptingId(invite.id);
    try {
      const response = await api.post('/invites/accept', { token: invite.token });
      toast.success(`Successfully joined ${invite.org_name}!`);
      
      // Refresh organizations list
      await refreshOrganizations();
      
      // Remove the accepted invite from local state
      setInvites(prev => prev.filter(i => i.id !== invite.id));
      
      // Switch to the new organization and redirect
      const orgsResponse = await api.get('/organizations');
      const newOrg = orgsResponse.data.find(o => o.org_id === response.data.org_id);
      if (newOrg) {
        switchOrganization(newOrg);
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to accept invite:', error);
      toast.error(error.response?.data?.detail || 'Failed to accept invitation');
    } finally {
      setAcceptingId(null);
    }
  };

  const roleDescriptions = {
    admin: 'Full access to all features including team management',
    manager: 'Can manage properties, tenants, and approve inspections',
    staff: 'View access and basic operations'
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="pending-invites-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Pending Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Organization invitations waiting for your response
          </p>
        </div>

        {/* Invites List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map(i => (
              <Card key={i} className="glass">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-4" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : invites.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Pending Invitations</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any pending organization invitations. When someone invites you to join their organization, it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invites.map(invite => (
              <Card key={invite.id} className="glass card-hover" data-testid={`invite-card-${invite.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold font-heading">{invite.org_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="capitalize">{invite.role}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Invited by {invite.invited_by_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-3">
                        {roleDescriptions[invite.role]}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          onClick={() => handleAccept(invite)}
                          disabled={acceptingId === invite.id}
                          className="btn-active"
                          data-testid={`accept-invite-${invite.id}`}
                        >
                          {acceptingId === invite.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept Invitation
                            </>
                          )}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="glass border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">How invitations work</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When you accept an invitation, you'll be added as a member of that organization with the assigned role. 
                  You can switch between organizations using the organization switcher in the sidebar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PendingInvites;
