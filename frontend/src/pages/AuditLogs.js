import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { 
  History, 
  Search,
  User,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Clock
} from 'lucide-react';

const actionIcons = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  uploaded: Upload
};

const actionColors = {
  created: 'bg-green-500/10 text-green-500 border-green-500/20',
  updated: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  deleted: 'bg-red-500/10 text-red-500 border-red-500/20',
  uploaded: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};

const AuditLogs = () => {
  const { api, currentOrg } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [currentOrg]);

  const fetchLogs = async () => {
    if (!currentOrg) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/organizations/${currentOrg.org_id}/audit-logs`);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      if (error.response?.status === 403) {
        setError('Admin access required to view audit logs');
      } else {
        setError('Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const entityTypes = [...new Set(logs.map(log => log.entity_type))];

  return (
    <Layout>
      <div className="space-y-6" data-testid="audit-logs-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all actions and changes in your organization
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="audit-search"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40" data-testid="entity-filter">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {entityTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        <Card className="glass">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3 mt-2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <History className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No logs found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || entityFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No activity recorded yet'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => {
                    const ActionIcon = actionIcons[log.action] || Clock;
                    return (
                      <TableRow key={log.id} data-testid={`audit-row-${log.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{log.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={actionColors[log.action]}>
                            <ActionIcon className="w-3 h-3 mr-1" />
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.entity_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {log.details || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleString()}
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
      </div>
    </Layout>
  );
};

export default AuditLogs;
