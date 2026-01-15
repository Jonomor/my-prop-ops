import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  Users, 
  Search,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const roleColors = {
  admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  manager: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  staff: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
};

const MemberDirectory = () => {
  const { api, currentOrg } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [currentOrg]);

  const fetchMembers = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const response = await api.get(`/organizations/${currentOrg.org_id}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6" data-testid="members-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            View all members in your organization
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="member-search"
          />
        </div>

        {/* Members Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Users className="w-5 h-5" />
              Organization Members
            </CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? 's' : ''} in {currentOrg?.org_name}
            </CardDescription>
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
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No members found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search' : 'No members in this organization yet'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map(member => (
                    <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[member.role]}>
                          <Shield className="w-3 h-3 mr-1" />
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MemberDirectory;
