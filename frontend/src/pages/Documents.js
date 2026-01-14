import React, { useState, useEffect, useRef } from 'react';
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
  FileText, 
  Plus, 
  Search,
  Loader2,
  Upload,
  Download,
  Trash2,
  File,
  FileImage,
  FileSpreadsheet,
  FilePdf
} from 'lucide-react';
import { toast } from 'sonner';

const categoryColors = {
  lease: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  id: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  inspection: 'bg-green-500/10 text-green-500 border-green-500/20',
  maintenance: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
};

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return FileImage;
  if (['pdf'].includes(ext)) return FilePdf;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  return File;
};

const Documents = () => {
  const { api, currentOrg } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [formData, setFormData] = useState({
    category: 'other',
    tenant_id: '',
    inspection_id: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const [docsRes, tenantsRes, inspectionsRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.org_id}/documents`),
        api.get(`/organizations/${currentOrg.org_id}/tenants`),
        api.get(`/organizations/${currentOrg.org_id}/inspections`)
      ]);
      setDocuments(docsRes.data);
      setTenants(tenantsRes.data);
      setInspections(inspectionsRes.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    
    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', selectedFile);
      formDataObj.append('category', formData.category);
      if (formData.tenant_id) formDataObj.append('tenant_id', formData.tenant_id);
      if (formData.inspection_id) formDataObj.append('inspection_id', formData.inspection_id);

      await api.post(`/organizations/${currentOrg.org_id}/documents`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Document uploaded successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(
        `/organizations/${currentOrg.org_id}/documents/${doc.id}/download`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;
    try {
      await api.delete(`/organizations/${currentOrg.org_id}/documents/${selectedDocument.id}`);
      toast.success('Document deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'other',
      tenant_id: '',
      inspection_id: ''
    });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getTenantName = (tenantId) => {
    if (!tenantId) return null;
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.name;
  };

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.original_filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="space-y-6" data-testid="documents-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading">Documents</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your documents
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-active" data-testid="upload-document-btn">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a new document and categorize it.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      ref={fileInputRef}
                      id="file"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                      data-testid="document-file-input"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                    >
                      <SelectTrigger data-testid="document-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lease">Lease</SelectItem>
                        <SelectItem value="id">ID Document</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tenant">Link to Tenant (Optional)</Label>
                    <Select 
                      value={formData.tenant_id} 
                      onValueChange={(val) => setFormData({ ...formData, tenant_id: val })}
                    >
                      <SelectTrigger data-testid="document-tenant-select">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No tenant</SelectItem>
                        {tenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="inspection">Link to Inspection (Optional)</Label>
                    <Select 
                      value={formData.inspection_id} 
                      onValueChange={(val) => setFormData({ ...formData, inspection_id: val })}
                    >
                      <SelectTrigger data-testid="document-inspection-select">
                        <SelectValue placeholder="Select an inspection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No inspection</SelectItem>
                        {inspections.map(inspection => (
                          <SelectItem key={inspection.id} value={inspection.id}>
                            {new Date(inspection.scheduled_date).toLocaleDateString()} - {inspection.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading || !selectedFile} data-testid="document-upload-submit">
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="document-search"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40" data-testid="category-filter">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="lease">Lease</SelectItem>
              <SelectItem value="id">ID Document</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="glass">
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-12 rounded mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Upload your first document to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => {
              const FileIcon = getFileIcon(doc.original_filename);
              const tenantName = getTenantName(doc.tenant_id);
              
              return (
                <Card key={doc.id} className="glass card-hover" data-testid={`document-card-${doc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate" title={doc.original_filename}>
                            {doc.original_filename}
                          </p>
                          <Badge variant="outline" className={`mt-1 ${categoryColors[doc.category]}`}>
                            {doc.category}
                          </Badge>
                          {tenantName && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Linked to: {tenantName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDownload(doc)}
                        data-testid={`download-doc-${doc.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setIsDeleteDialogOpen(true);
                        }}
                        data-testid={`delete-doc-${doc.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedDocument?.original_filename}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" data-testid="confirm-delete-doc">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Documents;
