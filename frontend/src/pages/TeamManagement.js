import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { 
  Users, 
  UserPlus, 
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
  Loader2,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  accepted: 'bg-green-500/10 text-green-500 border-green-500/20',
  expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
};

const statusIcons = {
  pending: Clock,
  accepted: CheckCircle,
  expired: XCircle
};

const TeamManagement = () => {
  const { api, currentOrg, organizations } = useAuth();
  const [invites, setInvites] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'staff'
  });
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    if (!currentOrg) return;
    setLoading(true);
    
    // Get current user's role
    const currentMembership = organizations.find(o => o.org_id === currentOrg.org_id);
    setUserRole(currentMembership?.role);
    
    try {
      // Only admins can see invites
      if (currentMembership?.role === 'admin') {
        const invitesRes = await api.get(`/organizations/${currentOrg.org_id}/invites`);
        setInvites(invitesRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.post(`/organizations/${currentOrg.org_id}/invites`, formData);
      toast.success('Invitation sent successfully');
      
      // Show the invite link
      const inviteUrl = `${window.location.origin}/invite/${response.data.token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.info('Invite link copied to clipboard!', {
        description: 'Share this link with the invitee'
      });
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create invite:', error);
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvite) return;
    try {
      await api.delete(`/organizations/${currentOrg.org_id}/invites/${selectedInvite.id}`);
      toast.success('Invitation deleted');
      setIsDeleteDialogOpen(false);
      setSelectedInvite(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete invite:', error);
      toast.error('Failed to delete invitation');
    }
  };

  const copyInviteLink = (token) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied to clipboard');
  };

  const resetForm = () => {
    setFormData({ email: '', role: 'staff' });
  };

  if (userRole !== 'admin') {
    return (
      <Layout>
        <div className="space-y-6" data-testid="team-page">
          <div>
            <h1 className="text-3xl font-bold font-heading">Team</h1>
            <p className="text-muted-foreground mt-1">
              Team management is restricted to administrators
            </p>
          </div>
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Admin Access Required</h3>
              <p className="text-muted-foreground">
                Only organization administrators can manage team invitations.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="team-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading">Team</h1>
            <p className="text-muted-foreground mt-1">
              Invite and manage team members
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-active" data-testid="invite-member-btn">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization. They'll receive a link to accept.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="colleague@example.com"
                      required
                      data-testid="invite-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                      <SelectTrigger data-testid="invite-role-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                        <SelectItem value="manager">Manager - Can manage properties & tenants</SelectItem>
                        <SelectItem value="staff">Staff - View and basic operations</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.role === 'admin' && 'Full access to all features including team management'}
                      {formData.role === 'manager' && 'Can create/edit properties, tenants, and approve inspections'}
                      {formData.role === 'staff' && 'Can view data and perform basic operations'}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} data-testid="invite-submit-btn">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Send Invite
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="glass border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">How invitations work</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When you invite someone, a unique link is generated. Share this link with them. 
                  After they register or log in, they can accept the invitation to join your organization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invitations Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Pending Invitations</CardTitle>
            <CardDescription>Invitations waiting to be accepted</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : invites.length === 0 ? (
              <div className="p-12 text-center">
                <UserPlus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No invitations</h3>
                <p className="text-muted-foreground mb-4">
                  Invite team members to collaborate on property management
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map(invite => {
                    const StatusIcon = statusIcons[invite.status];
                    return (
                      <TableRow key={invite.id} data-testid={`invite-row-${invite.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {invite.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{invite.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[invite.status]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invite.invited_by_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {invite.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => copyInviteLink(invite.token)}
                                title="Copy invite link"
                                data-testid={`copy-invite-${invite.id}`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedInvite(invite);
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Delete invitation"
                              data-testid={`delete-invite-${invite.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the invitation for "{selectedInvite?.email}"? 
                They will no longer be able to use this invite link.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" data-testid="confirm-delete-invite">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default TeamManagement;
