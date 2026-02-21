import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Building, Loader2, AlertCircle, CheckCircle, Users } from 'lucide-react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, token: authToken, refreshOrganizations } = useAuth();
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInviteDetails();
  }, [token]);

  const fetchInviteDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/invites/${token}`);
      setInviteDetails(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !authToken) {
      // Store the token and redirect to login
      localStorage.setItem('pendingInviteToken', token);
      navigate('/login');
      return;
    }

    setAccepting(true);
    setError(null);
    
    try {
      await axios.post(
        `${API_URL}/invites/accept`,
        { token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setSuccess(true);
      await refreshOrganizations();
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome to {inviteDetails?.org_name}!</h2>
            <p className="text-muted-foreground mb-4">
              You've successfully joined the organization. Redirecting to dashboard...
            </p>
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="accept-invite-page">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join an organization on MyPropOps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Organization</span>
              <span className="font-medium">{inviteDetails?.org_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{inviteDetails?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invited by</span>
              <span className="font-medium">{inviteDetails?.invited_by_name}</span>
            </div>
          </div>

          {user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Logged in as <strong>{user.email}</strong>
              </p>
              {inviteDetails?.email.toLowerCase() !== user.email.toLowerCase() && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This invite was sent to {inviteDetails?.email}. Make sure you're logged in with the correct account.
                  </AlertDescription>
                </Alert>
              )}
              <Button 
                className="w-full" 
                onClick={handleAccept}
                disabled={accepting}
                data-testid="accept-invite-btn"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Please log in or create an account to accept this invitation
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" state={{ returnTo: `/invite/${token}` }}>
                  <Button variant="outline" className="w-full" data-testid="invite-login-btn">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" state={{ returnTo: `/invite/${token}`, email: inviteDetails?.email }}>
                  <Button className="w-full" data-testid="invite-register-btn">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
