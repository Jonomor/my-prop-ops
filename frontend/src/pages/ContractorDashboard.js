import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Wrench, 
  LogOut, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  Calendar,
  Phone,
  User,
  Image,
  ChevronRight,
  Star,
  Bell,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app'}/api`;

const priorityColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700'
};

const statusColors = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700'
};

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', notes: '' });
  
  // Messaging states
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('contractor_token');

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    if (!token) {
      navigate('/contractor/login');
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [profileRes, jobsRes, statsRes] = await Promise.all([
        api.get('/contractor/me'),
        api.get('/contractor/jobs'),
        api.get('/contractor/stats')
      ]);
      setContractor(profileRes.data);
      setJobs(jobsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('contractor_token');
        navigate('/contractor/login');
      }
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('contractor_token');
    localStorage.removeItem('contractor');
    navigate('/contractor/login');
  };

  const openUpdateDialog = (job) => {
    setSelectedJob(job);
    setUpdateForm({ status: job.status, notes: job.notes || '' });
    setUpdateDialogOpen(true);
  };

  const handleUpdateJob = async () => {
    if (!selectedJob) return;
    
    try {
      await api.put(`/contractor/jobs/${selectedJob.id}`, {
        status: updateForm.status,
        notes: updateForm.notes,
        completion_notes: updateForm.status === 'completed' ? updateForm.notes : null
      });
      toast.success('Job updated successfully');
      setUpdateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  // Messaging functions
  const openMessageDialog = async (job) => {
    setSelectedJob(job);
    setMessageDialogOpen(true);
    setLoadingMessages(true);
    
    try {
      const res = await api.get(`/contractor/jobs/${job.id}/messages`);
      setMessages(res.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedJob) return;
    
    setSendingMessage(true);
    try {
      await api.post(`/contractor/jobs/${selectedJob.id}/messages`, {
        content: newMessage,
        job_id: selectedJob.id
      });
      setNewMessage('');
      // Refresh messages
      const res = await api.get(`/contractor/jobs/${selectedJob.id}/messages`);
      setMessages(res.data);
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredJobs = jobs.filter(job => 
    statusFilter === 'all' || job.status === statusFilter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-orange-950 flex items-center justify-center">
        <div className="animate-pulse text-orange-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-orange-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold font-heading">Contractor Portal</span>
              <p className="text-sm text-muted-foreground">{contractor?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.active_jobs || 0}</p>
                </div>
                <ClipboardList className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.completed_jobs || 0}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.total_jobs || 0}</p>
                </div>
                <Clock className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-3xl font-bold text-amber-600">{stats?.rating || '-'}</p>
                </div>
                <Star className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card className="bg-white/90 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-orange-600" />
                Your Jobs
              </CardTitle>
              <CardDescription>Manage and update your assigned work orders</CardDescription>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No jobs found</p>
                <p className="text-sm">Jobs assigned to you will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div 
                    key={job.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openUpdateDialog(job)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={priorityColors[job.priority]}>{job.priority}</Badge>
                          <Badge className={statusColors[job.status]}>{job.status.replace('_', ' ')}</Badge>
                          <Badge variant="outline">{job.category}</Badge>
                        </div>
                        
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.property_name} {job.unit_number && `- Unit ${job.unit_number}`}
                          </span>
                          {job.tenant_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {job.tenant_name}
                            </span>
                          )}
                          {job.tenant_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {job.tenant_phone}
                            </span>
                          )}
                          {job.scheduled_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(job.scheduled_date).toLocaleDateString()}
                            </span>
                          )}
                          {job.photos?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Image className="w-4 h-4" />
                              {job.photos.length} photos
                            </span>
                          )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMessageDialog(job);
                            }}
                            data-testid={`message-btn-${job.id}`}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message Manager
                          </Button>
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Update Job Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
            <DialogDescription>{selectedJob?.title}</DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-4">
              {/* Photos */}
              {selectedJob.photos?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Attached Photos</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedJob.photos.map((photo, idx) => (
                      <img 
                        key={idx}
                        src={`${process.env.REACT_APP_BACKEND_URL}${photo}`}
                        alt={`Issue photo ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {selectedJob.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status</label>
                <Select value={updateForm.status} onValueChange={(val) => setUpdateForm({ ...updateForm, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add notes about the job..."
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateJob}
              className="bg-gradient-to-r from-orange-500 to-amber-600"
            >
              Update Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              Messages
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.title} - Chat with property manager
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[400px]">
            {/* Messages area */}
            <ScrollArea className="flex-1 pr-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation with the manager</p>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'contractor' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.sender_type === 'contractor' 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {msg.sender_name}
                        </p>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-50">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            
            {/* Message input */}
            <div className="flex gap-2 pt-4 border-t mt-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={sendingMessage}
                data-testid="message-input"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
                data-testid="send-message-btn"
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractorDashboard;
