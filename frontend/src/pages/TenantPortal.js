import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenantAuth } from '../contexts/TenantAuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Home, 
  FileText, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Calendar, 
  BookOpen,
  User,
  Upload,
  Download,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Shield,
  HelpCircle,
  Send,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Camera,
  Image,
  Trash2
} from 'lucide-react';

const HOUSING_PROGRAMS = [
  { value: 'section_8', label: 'Section 8 Housing Choice Voucher' },
  { value: 'hud', label: 'HUD Assisted Housing' },
  { value: 'lihtc', label: 'Low-Income Housing Tax Credit (LIHTC)' },
  { value: 'public_housing', label: 'Public Housing' },
  { value: 'home', label: 'HOME Investment Partnership' },
  { value: 'hopwa', label: 'HOPWA (HIV/AIDS Housing)' },
  { value: 'vash', label: 'HUD-VASH (Veterans)' },
  { value: 'other', label: 'Other Housing Program' }
];

const TenantPortal = () => {
  const { tenant, logout, updateProfile, api } = useTenantAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [checklist, setChecklist] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [resources, setResources] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  
  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [householdDialogOpen, setHouseholdDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [connectOrgDialogOpen, setConnectOrgDialogOpen] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({});
  const [orgCode, setOrgCode] = useState('');
  const [householdMember, setHouseholdMember] = useState({
    name: '', relationship: 'other', date_of_birth: '', income: '', income_source: ''
  });
  const [appointmentForm, setAppointmentForm] = useState({
    title: '', description: '', date: '', time: '', location: '', type: 'other'
  });

  useEffect(() => {
    if (tenant) {
      setProfileForm({
        name: tenant.name || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        housing_program: tenant.housing_program || '',
        voucher_number: tenant.voucher_number || '',
        household_size: tenant.household_size || 1,
        annual_income: tenant.annual_income || '',
        income_sources: tenant.income_sources || '',
        emergency_contact_name: tenant.emergency_contact_name || '',
        emergency_contact_phone: tenant.emergency_contact_phone || ''
      });
    }
  }, [tenant]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard' || activeTab === 'documents') {
        const [checklistRes, statusRes] = await Promise.all([
          api.get('/api/tenant-portal/checklist'),
          api.get('/api/tenant-portal/application-status')
        ]);
        setChecklist(checklistRes.data);
        setApplicationStatus(statusRes.data);
      }
      if (activeTab === 'appointments') {
        const res = await api.get('/api/tenant-portal/appointments');
        setAppointments(res.data);
      }
      if (activeTab === 'messages') {
        const res = await api.get('/api/tenant-portal/conversations');
        setConversations(res.data);
      }
      if (activeTab === 'resources') {
        const res = await api.get('/api/tenant-portal/resources');
        setResources(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (itemId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post(`/api/tenant-portal/checklist/${itemId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated!');
      setProfileDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddHouseholdMember = async () => {
    const members = [...(tenant.household_members || []), householdMember];
    try {
      await updateProfile({ 
        household_members: members,
        household_size: members.length + 1
      });
      toast.success('Household member added!');
      setHouseholdDialogOpen(false);
      setHouseholdMember({ name: '', relationship: 'other', date_of_birth: '', income: '', income_source: '' });
    } catch (error) {
      toast.error('Failed to add household member');
    }
  };

  const handleCreateAppointment = async () => {
    try {
      await api.post('/api/tenant-portal/appointments', appointmentForm);
      toast.success('Appointment created!');
      setAppointmentDialogOpen(false);
      setAppointmentForm({ title: '', description: '', date: '', time: '', location: '', type: 'other' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create appointment');
    }
  };

  const handleSubmitApplication = async () => {
    try {
      await api.put('/api/tenant-portal/application-status?stage=application_submitted');
      toast.success('Application submitted!');
      fetchData();
    } catch (error) {
      toast.error('Failed to submit application');
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const res = await api.get(`/api/tenant-portal/conversations/${conversationId}/messages`);
      setMessages(res.data);
      setSelectedConversation(conversationId);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await api.post(`/api/tenant-portal/conversations/${selectedConversation}/messages`, {
        content: newMessage
      });
      setNewMessage('');
      loadMessages(selectedConversation);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/tenant-portal/login');
  };

  const handleConnectOrg = async () => {
    if (!orgCode.trim()) {
      toast.error('Please enter an organization code');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/tenant-portal/connect-organization', { org_code: orgCode.toUpperCase() });
      toast.success(res.data.message);
      setConnectOrgDialogOpen(false);
      setOrgCode('');
      // Refresh tenant data
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to connect to organization');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectOrg = async () => {
    try {
      await api.delete('/api/tenant-portal/disconnect-organization');
      toast.success('Disconnected from organization');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'uploaded': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'requested': return <Mail className="w-5 h-5 text-purple-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const completedDocs = checklist.filter(c => c.status === 'verified' || c.status === 'uploaded').length;
  const requiredDocs = checklist.filter(c => c.required).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'status', label: 'Application Status', icon: CheckCircle },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'resources', label: 'Resources', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-emerald-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg">Tenant Portal</span>
                <p className="text-xs text-muted-foreground">Housing Application Hub</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {tenant?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
            
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-emerald-100 dark:border-gray-700 p-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === item.id 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Welcome back, {tenant?.name}!</h1>
                  <p className="text-muted-foreground">Here's an overview of your housing application.</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <CardContent className="p-6">
                      <FileText className="w-8 h-8 mb-2 opacity-80" />
                      <p className="text-3xl font-bold">{completedDocs}/{checklist.length}</p>
                      <p className="text-sm opacity-80">Documents Submitted</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <CheckCircle className="w-8 h-8 mb-2 text-emerald-500" />
                      <p className="text-lg font-semibold capitalize">
                        {applicationStatus?.stage?.replace(/_/g, ' ') || 'Not Started'}
                      </p>
                      <p className="text-sm text-muted-foreground">Application Status</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <Calendar className="w-8 h-8 mb-2 text-blue-500" />
                      <p className="text-3xl font-bold">{appointments.length}</p>
                      <p className="text-sm text-muted-foreground">Upcoming Appointments</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <MessageSquare className="w-8 h-8 mb-2 text-purple-500" />
                      <p className="text-3xl font-bold">{conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)}</p>
                      <p className="text-sm text-muted-foreground">Unread Messages</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Tracker */}
                {applicationStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Application Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {applicationStatus.stages?.slice(0, 7).map((stage, i) => (
                          <div
                            key={stage.stage}
                            className={`flex-1 min-w-[120px] p-3 rounded-lg text-center ${
                              stage.completed ? 'bg-emerald-100 dark:bg-emerald-900/50' :
                              stage.current ? 'bg-emerald-500 text-white' :
                              'bg-gray-100 dark:bg-gray-800'
                            }`}
                          >
                            <p className="text-xs font-medium">{stage.label}</p>
                          </div>
                        ))}
                      </div>
                      {applicationStatus.stage === 'not_started' && (
                        <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitApplication}>
                          Submit Application
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('documents')}>
                        <Upload className="w-6 h-6 mb-2" />
                        <span className="text-sm">Upload Docs</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setProfileDialogOpen(true)}>
                        <User className="w-6 h-6 mb-2" />
                        <span className="text-sm">Update Profile</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('messages')}>
                        <MessageSquare className="w-6 h-6 mb-2" />
                        <span className="text-sm">Messages</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('resources')}>
                        <HelpCircle className="w-6 h-6 mb-2" />
                        <span className="text-sm">Get Help</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Document Checklist</h1>
                  <p className="text-muted-foreground">Upload and track your required documents.</p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span>You provide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Download & sign</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Request from landlord</span>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Required Documents</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {completedDocs} of {checklist.length} completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all" 
                        style={{ width: `${(completedDocs / checklist.length) * 100}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {checklist.map((item) => (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-lg border ${
                            item.status === 'verified' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' :
                            item.status === 'uploaded' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200' :
                            item.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200' :
                            item.status === 'requested' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200' :
                            'bg-gray-50 dark:bg-gray-800/50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              {getStatusIcon(item.status)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{item.name}</p>
                                  {item.required && <span className="text-xs text-red-500 font-medium">*Required</span>}
                                  {item.source_type === 'download_sign' && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Download & Sign</span>
                                  )}
                                  {item.source_type === 'request_from_landlord' && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Request from Landlord</span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                {item.help_text && (
                                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                    <HelpCircle className="w-3 h-3" />
                                    {item.help_text}
                                  </p>
                                )}
                                {item.status === 'uploaded' && (
                                  <p className="text-xs text-amber-600 mt-1 font-medium">Pending verification</p>
                                )}
                                {item.status === 'verified' && (
                                  <p className="text-xs text-green-600 mt-1 font-medium">Verified</p>
                                )}
                                {item.status === 'rejected' && item.notes && (
                                  <p className="text-xs text-red-600 mt-1 font-medium">{item.notes}</p>
                                )}
                                {item.status === 'requested' && (
                                  <p className="text-xs text-purple-600 mt-1 font-medium">
                                    Requested on {new Date(item.requested_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Download template button for download_sign type */}
                              {item.source_type === 'download_sign' && item.template && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  asChild
                                >
                                  <a 
                                    href={`${process.env.REACT_APP_BACKEND_URL}/api/tenant-portal/templates/${item.template}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Template
                                  </a>
                                </Button>
                              )}
                              
                              {/* Request from landlord button */}
                              {item.source_type === 'request_from_landlord' && item.status === 'not_started' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                  onClick={async () => {
                                    try {
                                      await api.post(`/api/tenant-portal/checklist/${item.id}/request`, {
                                        message: `Please provide ${item.name} for my housing application.`
                                      });
                                      toast.success(`Request sent for ${item.name}`);
                                      fetchData();
                                    } catch (error) {
                                      toast.error('Failed to send request');
                                    }
                                  }}
                                >
                                  <Mail className="w-4 h-4 mr-1" />
                                  Request
                                </Button>
                              )}
                              
                              {/* Download uploaded document */}
                              {item.document_id && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={`${process.env.REACT_APP_BACKEND_URL}/api/tenant-portal/documents/${item.document_id}/download`} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              
                              {/* Upload button */}
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                                />
                                <Button variant="outline" size="sm" className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white" asChild>
                                  <span>
                                    <Upload className="w-4 h-4 mr-1" />
                                    {item.status === 'not_started' || item.status === 'requested' ? 'Upload' : 'Replace'}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Application Status Tab */}
            {activeTab === 'status' && applicationStatus && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Application Status</h1>
                  <p className="text-muted-foreground">Track your housing application progress.</p>
                </div>

                <Card>
                  <CardContent className="p-8">
                    <div className="space-y-8">
                      {applicationStatus.stages?.map((stage, i) => (
                        <div key={stage.stage} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              stage.completed ? 'bg-emerald-500 text-white' :
                              stage.current ? 'bg-emerald-500 text-white ring-4 ring-emerald-200' :
                              'bg-gray-200 text-gray-500'
                            }`}>
                              {stage.completed ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                            </div>
                            {i < applicationStatus.stages.length - 1 && (
                              <div className={`w-0.5 h-16 ${stage.completed ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <h3 className={`font-semibold ${stage.current ? 'text-emerald-600' : ''}`}>
                              {stage.label}
                            </h3>
                            <p className="text-sm text-muted-foreground">{stage.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Appointments</h1>
                    <p className="text-muted-foreground">Manage your scheduled appointments.</p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAppointmentDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Reminder
                  </Button>
                </div>

                {appointments.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No appointments scheduled</h3>
                      <p className="text-muted-foreground mb-4">Add reminders for inspections and important dates.</p>
                      <Button onClick={() => setAppointmentDialogOpen(true)}>Add Reminder</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <Card key={apt.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{apt.title}</h3>
                              <p className="text-sm text-muted-foreground">{apt.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {apt.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {apt.time}
                                </span>
                                {apt.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {apt.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Messages</h1>
                  <p className="text-muted-foreground">Communicate with your landlord or property manager.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Conversations List */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-lg">Conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {conversations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No conversations yet. Your property manager will contact you here.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {conversations.map((conv) => (
                            <button
                              key={conv.id}
                              onClick={() => loadMessages(conv.id)}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedConversation === conv.id 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/50' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{conv.landlord_name}</span>
                                {conv.unread_count > 0 && (
                                  <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {conv.unread_count}
                                  </span>
                                )}
                              </div>
                              {conv.last_message && (
                                <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Messages */}
                  <Card className="lg:col-span-2">
                    <CardContent className="p-0">
                      {selectedConversation ? (
                        <div className="flex flex-col h-[500px]">
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === 'tenant' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[80%] p-3 rounded-lg ${
                                  msg.sender_type === 'tenant'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                  <p className="text-sm">{msg.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    msg.sender_type === 'tenant' ? 'text-emerald-100' : 'text-muted-foreground'
                                  }`}>
                                    {new Date(msg.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t p-4">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              />
                              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={sendMessage}>
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                          <div className="text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Select a conversation to view messages</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <p className="text-muted-foreground">Manage your personal and household information.</p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setProfileDialogOpen(true)}>
                    Edit Profile
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{tenant?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{tenant?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{tenant?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Current Address</p>
                          <p className="font-medium">{tenant?.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Housing Program</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Program Type</p>
                          <p className="font-medium capitalize">
                            {HOUSING_PROGRAMS.find(p => p.value === tenant?.housing_program)?.label || 'Not selected'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Voucher Number</p>
                          <p className="font-medium">{tenant?.voucher_number || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Annual Income</p>
                          <p className="font-medium">
                            {tenant?.annual_income ? `$${tenant.annual_income.toLocaleString()}` : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connected Organization Card */}
                  <Card className="md:col-span-2 border-2 border-dashed border-emerald-200 dark:border-emerald-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-emerald-600" />
                        Property Manager Connection
                      </CardTitle>
                      <CardDescription>
                        Connect with your property manager to submit document requests and communicate directly.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {tenant?.connected_org_id ? (
                        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <div>
                            <p className="font-medium text-emerald-700 dark:text-emerald-300">
                              Connected to: {tenant.connected_org_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              You can now request documents and send messages to your property manager.
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={handleDisconnectOrg} className="text-red-600 border-red-200 hover:bg-red-50">
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground mb-4">
                            Ask your property manager for an organization code to connect your account.
                          </p>
                          <Button onClick={() => setConnectOrgDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="w-4 h-4 mr-1" />
                            Enter Organization Code
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Household Members</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setHouseholdDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Member
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Household Size: {tenant?.household_size || 1}</span>
                      </div>
                      {tenant?.household_members?.length > 0 ? (
                        <div className="space-y-3">
                          {tenant.household_members.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{member.relationship}</p>
                              </div>
                              {member.income && (
                                <p className="text-sm text-muted-foreground">
                                  ${parseFloat(member.income).toLocaleString()}/year
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No additional household members added.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && resources && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Housing Resources</h1>
                  <p className="text-muted-foreground">Learn about housing programs and your rights as a tenant.</p>
                </div>

                {/* Housing Programs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Housing Programs Guide</CardTitle>
                    <CardDescription>Learn about different housing assistance programs.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resources.programs?.map((program) => (
                      <details key={program.id} className="group">
                        <summary className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                          <span className="font-medium">{program.name}</span>
                          <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="p-4 border-l-2 border-emerald-500 ml-4 mt-2 space-y-3">
                          <p className="text-muted-foreground">{program.description}</p>
                          <div>
                            <p className="font-medium text-sm">Eligibility:</p>
                            <p className="text-sm text-muted-foreground">{program.eligibility}</p>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Process:</p>
                            <ol className="list-decimal list-inside text-sm text-muted-foreground">
                              {program.process?.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Timeline:</p>
                            <p className="text-sm text-muted-foreground">{program.timeline}</p>
                          </div>
                          <a 
                            href={program.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-600 hover:underline"
                          >
                            Learn more →
                          </a>
                        </div>
                      </details>
                    ))}
                  </CardContent>
                </Card>

                {/* Tenant Rights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      Know Your Rights
                    </CardTitle>
                    <CardDescription>Understanding your rights as a tenant.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {resources.tenant_rights?.map((right, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">{right.title}</h4>
                          <p className="text-sm text-muted-foreground">{right.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* FAQs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-emerald-500" />
                      Frequently Asked Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resources.faqs?.map((faq, i) => (
                      <details key={i} className="group">
                        <summary className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                          <span className="font-medium pr-4">{faq.question}</span>
                          <ChevronRight className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-90" />
                        </summary>
                        <p className="p-4 text-muted-foreground">{faq.answer}</p>
                      </details>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Profile Edit Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Current Address</Label>
              <Input
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Housing Program</Label>
                <Select 
                  value={profileForm.housing_program} 
                  onValueChange={(val) => setProfileForm({ ...profileForm, housing_program: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUSING_PROGRAMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Voucher Number</Label>
                <Input
                  value={profileForm.voucher_number}
                  onChange={(e) => setProfileForm({ ...profileForm, voucher_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Annual Income ($)</Label>
                <Input
                  type="number"
                  value={profileForm.annual_income}
                  onChange={(e) => setProfileForm({ ...profileForm, annual_income: parseFloat(e.target.value) || '' })}
                />
              </div>
              <div className="space-y-2">
                <Label>Income Sources</Label>
                <Input
                  placeholder="Employment, SSI, etc."
                  value={profileForm.income_sources}
                  onChange={(e) => setProfileForm({ ...profileForm, income_sources: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emergency Contact Name</Label>
                <Input
                  value={profileForm.emergency_contact_name}
                  onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact Phone</Label>
                <Input
                  value={profileForm.emergency_contact_phone}
                  onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_phone: e.target.value })}
                />
              </div>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleProfileUpdate}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Household Member Dialog */}
      <Dialog open={householdDialogOpen} onOpenChange={setHouseholdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Household Member</DialogTitle>
            <DialogDescription>Add information about household members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={householdMember.name}
                onChange={(e) => setHouseholdMember({ ...householdMember, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select 
                value={householdMember.relationship} 
                onValueChange={(val) => setHouseholdMember({ ...householdMember, relationship: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse/Partner</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={householdMember.date_of_birth}
                onChange={(e) => setHouseholdMember({ ...householdMember, date_of_birth: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Annual Income ($)</Label>
                <Input
                  type="number"
                  value={householdMember.income}
                  onChange={(e) => setHouseholdMember({ ...householdMember, income: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Income Source</Label>
                <Input
                  value={householdMember.income_source}
                  onChange={(e) => setHouseholdMember({ ...householdMember, income_source: e.target.value })}
                />
              </div>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleAddHouseholdMember}>
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Appointment Reminder</DialogTitle>
            <DialogDescription>Schedule a reminder for important dates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Unit Inspection"
                value={appointmentForm.title}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Additional details..."
                value={appointmentForm.description}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location (Optional)</Label>
              <Input
                placeholder="Address or location"
                value={appointmentForm.location}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={appointmentForm.type} 
                onValueChange={(val) => setAppointmentForm({ ...appointmentForm, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="orientation">Orientation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateAppointment}>
              Create Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connect Organization Dialog */}
      <Dialog open={connectOrgDialogOpen} onOpenChange={setConnectOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to Property Manager</DialogTitle>
            <DialogDescription>
              Enter the organization code provided by your property manager to connect your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Code</Label>
              <Input
                placeholder="e.g., ABC123"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground">
                This code is provided by your landlord or property manager.
              </p>
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleConnectOrg}
              disabled={loading || !orgCode.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Connect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantPortal;
