import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';

const ApiKeys = () => {
  const { api, currentOrg } = useAuth();
  const [loading, setLoading] = useState(true);
  const [planAllowsApi, setPlanAllowsApi] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [showKey, setShowKey] = useState({});
  const [creating, setCreating] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState(null);

  useEffect(() => {
    if (currentOrg) {
      fetchData();
    }
  }, [currentOrg]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planRes, keysRes] = await Promise.all([
        api.get('/billing/subscription-status'),
        api.get('/api-keys')
      ]);
      
      const plan = planRes.data?.plan || 'free';
      setPlanAllowsApi(plan === 'pro');
      setApiKeys(keysRes.data?.keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/api-keys', { name: newKeyName });
      setCreatedKey(res.data);
      setNewKeyName('');
      fetchData();
      toast.success('API key created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (keyId) => {
    try {
      await api.delete(`/api-keys/${keyId}`);
      toast.success('API key deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete API key');
    } finally {
      setDeleteKeyId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const maskKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
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
      <div className="max-w-4xl mx-auto space-y-8" data-testid="api-keys-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">API Keys</h1>
            <p className="text-muted-foreground mt-1">
              Manage API keys for programmatic access
            </p>
          </div>
          {planAllowsApi && (
            <Button onClick={() => setShowCreateDialog(true)} data-testid="create-api-key-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create New Key
            </Button>
          )}
        </div>

        {/* Plan Notice */}
        {!planAllowsApi && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Lock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  API access requires Pro plan
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Upgrade to Pro to generate API keys and integrate with external systems.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => window.location.href = '/billing'}>
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* API Documentation Link */}
        {planAllowsApi && (
          <Card className="glass border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <Key className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">API Documentation</p>
                <p className="text-sm text-muted-foreground">
                  View our API documentation to learn how to integrate with MyPropOps.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => window.open('/docs', '_blank')}>
                View Docs
              </Button>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Your API Keys
            </CardTitle>
            <CardDescription>
              API keys are used to authenticate requests to the MyPropOps API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No API keys created yet</p>
                {planAllowsApi && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Create Your First Key
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div 
                    key={key.id} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    data-testid={`api-key-${key.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                            {showKey[key.id] ? key.key_preview : maskKey(key.key_preview)}
                          </code>
                          <button 
                            onClick={() => setShowKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {showKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(key.created_at).toLocaleDateString()} · 
                          Last used: {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={key.is_active ? 'default' : 'secondary'}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(key.key_preview)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteKeyId(key.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        {planAllowsApi && apiKeys.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>This month's API request statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold font-heading">0</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold font-heading text-green-600">100%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold font-heading">Unlimited</p>
                  <p className="text-sm text-muted-foreground">Rate Limit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Give your API key a name to help you identify it later.
              </DialogDescription>
            </DialogHeader>
            
            {!createdKey ? (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Production Server, Integration Test"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      data-testid="api-key-name-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createApiKey} disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Key
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">API Key Created!</span>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Save this key now!
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        This is the only time you'll see the full key. Store it securely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your API Key</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                      {createdKey.key}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(createdKey.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={() => {
                    setShowCreateDialog(false);
                    setCreatedKey(null);
                  }}>
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete API Key</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this API key? Any applications using this key will lose access.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteKeyId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => deleteApiKey(deleteKeyId)}>
                Delete Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ApiKeys;
