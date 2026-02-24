import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, Send, Clock, CheckCircle, XCircle, 
  Upload, Plus, Loader2, Copy, ExternalLink,
  Trash2, RefreshCw, Mail, User, Calendar
} from 'lucide-react';

const ESignatures = () => {
  const { api, currentOrg } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [sendForm, setSendForm] = useState({
    templateId: '',
    signerName: '',
    signerEmail: '',
    documentName: ''
  });
  
  const [uploadForm, setUploadForm] = useState({
    file: null,
    templateName: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    try {
      const [docsRes, templatesRes] = await Promise.all([
        api.get('/esign/documents'),
        api.get('/esign/templates')
      ]);
      setDocuments(docsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Failed to fetch eSign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTemplate = async () => {
    if (!uploadForm.file || !uploadForm.templateName.trim()) {
      toast.error('Please select a file and enter a template name');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('template_name', uploadForm.templateName);

      await api.post('/esign/templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Template uploaded successfully');
      setUploadDialogOpen(false);
      setUploadForm({ file: null, templateName: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleSendForSignature = async () => {
    if (!sendForm.templateId || !sendForm.signerName.trim() || !sendForm.signerEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      const response = await api.post('/esign/send', {
        template_id: sendForm.templateId,
        signer_name: sendForm.signerName,
        signer_email: sendForm.signerEmail,
        document_name: sendForm.documentName || undefined
      });

      toast.success('Document sent for signature!');
      setSendDialogOpen(false);
      setSendForm({ templateId: '', signerName: '', signerEmail: '', documentName: '' });
      fetchData();
      
      // Copy signing link to clipboard
      const signingUrl = `${window.location.origin}/sign/${response.data.signing_token}`;
      navigator.clipboard.writeText(signingUrl);
      toast.info('Signing link copied to clipboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send document');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.delete(`/esign/templates/${templateId}`);
      toast.success('Template deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleResend = async (documentId) => {
    try {
      await api.post(`/esign/documents/${documentId}/resend`);
      toast.success('Reminder sent');
    } catch (error) {
      toast.error('Failed to send reminder');
    }
  };

  const copySigningLink = (token) => {
    const url = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Signing link copied to clipboard');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Signed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">E-Signatures</h1>
            <p className="text-muted-foreground">Send documents for electronic signature</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Template
            </Button>
            <Button onClick={() => setSendDialogOpen(true)}>
              <Send className="w-4 h-4 mr-2" />
              Send for Signature
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="documents">
          <TabsList>
            <TabsTrigger value="documents">
              Sent Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="templates">
              Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                </CardContent>
              </Card>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No documents sent yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a template and send your first document for signature
                  </p>
                  <Button onClick={() => setSendDialogOpen(true)}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{doc.document_name}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {doc.signer_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {doc.signer_email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(doc.status)}
                          <div className="flex gap-1">
                            {doc.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => copySigningLink(doc.signing_token)}
                                  title="Copy signing link"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleResend(doc.id)}
                                  title="Send reminder"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {doc.status === 'signed' && doc.signed_document_url && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                asChild
                                title="Download signed document"
                              >
                                <a href={`${process.env.REACT_APP_BACKEND_URL}${doc.signed_document_url}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No templates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a PDF document to use as a template for signatures
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Uploaded {new Date(template.created_at).toLocaleDateString()}
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setSendForm({ ...sendForm, templateId: template.id });
                          setSendDialogOpen(true);
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Template Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document Template</DialogTitle>
            <DialogDescription>
              Upload a PDF document to use as a signature template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={uploadForm.templateName}
                onChange={(e) => setUploadForm({ ...uploadForm, templateName: e.target.value })}
                placeholder="e.g., Standard Lease Agreement"
              />
            </div>
            <div className="space-y-2">
              <Label>PDF Document *</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
              />
              <p className="text-xs text-muted-foreground">Only PDF files are supported</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadTemplate} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send for Signature Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Document for Signature</DialogTitle>
            <DialogDescription>
              Select a template and enter the signer's details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Template *</Label>
              <Select 
                value={sendForm.templateId} 
                onValueChange={(v) => setSendForm({ ...sendForm, templateId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Name (optional)</Label>
              <Input
                value={sendForm.documentName}
                onChange={(e) => setSendForm({ ...sendForm, documentName: e.target.value })}
                placeholder="e.g., John Doe - Lease Agreement"
              />
            </div>
            <div className="space-y-2">
              <Label>Signer's Full Name *</Label>
              <Input
                value={sendForm.signerName}
                onChange={(e) => setSendForm({ ...sendForm, signerName: e.target.value })}
                placeholder="Enter signer's full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Signer's Email *</Label>
              <Input
                type="email"
                value={sendForm.signerEmail}
                onChange={(e) => setSendForm({ ...sendForm, signerEmail: e.target.value })}
                placeholder="Enter signer's email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendForSignature} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send for Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ESignatures;
