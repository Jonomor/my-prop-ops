import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff,
  Smartphone,
  Key,
  Lock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

const TwoFactorAuth = () => {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ enabled: false, plan_allows_2fa: false, setup_complete: false });
  
  // Dialog states
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [backupCodesDialogOpen, setBackupCodesDialogOpen] = useState(false);
  
  // Setup states
  const [setupData, setSetupData] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/2fa/status');
      setStatus(res.data);
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/2fa/setup', { password });
      setSetupData(res.data);
      setSetupDialogOpen(false);
      setVerifyDialogOpen(true);
      setPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to setup 2FA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/2fa/verify', { code: verificationCode });
      setBackupCodes(res.data.backup_codes);
      setVerifyDialogOpen(false);
      setBackupCodesDialogOpen(true);
      setVerificationCode('');
      toast.success('Two-factor authentication enabled!');
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!password || !verificationCode) {
      toast.error('Please enter password and 2FA code');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/2fa/disable', { password, code: verificationCode });
      toast.success('Two-factor authentication disabled');
      setDisableDialogOpen(false);
      setPassword('');
      setVerificationCode('');
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to disable 2FA');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyAllBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('All backup codes copied!');
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
      <div className="max-w-3xl mx-auto space-y-6" data-testid="2fa-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Two-Factor Authentication</h1>
          <p className="text-muted-foreground mt-1">
            Add an extra layer of security to your account
          </p>
        </div>

        {/* Plan Notice */}
        {!status.plan_allows_2fa && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Lock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Two-factor authentication requires Pro plan
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Upgrade to Pro to enable 2FA and protect your account.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => window.location.href = '/billing'}>
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2FA Status Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status.enabled ? (
                <ShieldCheck className="w-6 h-6 text-green-500" />
              ) : (
                <Shield className="w-6 h-6 text-muted-foreground" />
              )}
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              {status.enabled 
                ? "Your account is protected with two-factor authentication"
                : "Enable 2FA to add an extra layer of security to your account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  status.enabled ? 'bg-green-100' : 'bg-muted'
                }`}>
                  {status.enabled ? (
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  ) : (
                    <ShieldOff className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <Badge variant={status.enabled ? "default" : "secondary"}>
                    {status.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              
              {status.plan_allows_2fa && (
                status.enabled ? (
                  <Button variant="outline" onClick={() => setDisableDialogOpen(true)}>
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Disable 2FA
                  </Button>
                ) : (
                  <Button onClick={() => setSetupDialogOpen(true)}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Enable 2FA
                  </Button>
                )
              )}
            </div>

            {/* How it works */}
            <div className="space-y-4">
              <h3 className="font-medium">How it works</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-sm">Download App</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Install Google Authenticator or Authy
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <Key className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-sm">Scan QR Code</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link your account to the app
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-sm">Enter Code</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use 6-digit codes when logging in
                  </p>
                </div>
              </div>
            </div>

            {/* Supported Apps */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">Supported Authenticator Apps</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Google Authenticator, Microsoft Authenticator, Authy, 1Password, or any TOTP-compatible app
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Setup Dialog - Step 1: Enter Password */}
        <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Enable Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Enter your password to begin the setup process.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetup} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Verify Dialog - Step 2: Scan QR & Enter Code */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Scan QR Code
              </DialogTitle>
              <DialogDescription>
                Scan this QR code with your authenticator app, then enter the 6-digit code.
              </DialogDescription>
            </DialogHeader>

            {setupData && (
              <div className="space-y-6 py-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <img 
                    src={setupData.qr_code} 
                    alt="2FA QR Code" 
                    className="w-48 h-48 rounded-lg border"
                  />
                </div>

                {/* Manual Entry */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Can't scan? Enter this code manually:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="px-3 py-1 bg-muted rounded font-mono text-sm">
                      {setupData.secret}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(setupData.secret)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Verification Code Input */}
                <div className="space-y-2">
                  <Label>Enter 6-digit code from app</Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerify} disabled={submitting || verificationCode.length !== 6}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify & Enable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Backup Codes Dialog */}
        <Dialog open={backupCodesDialogOpen} onOpenChange={setBackupCodesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Save Your Backup Codes
              </DialogTitle>
              <DialogDescription>
                Keep these codes safe. You can use them to access your account if you lose your authenticator device.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Important!</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      These codes will only be shown once. Save them in a secure location.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 bg-muted rounded font-mono text-sm"
                  >
                    <span>{code}</span>
                    <button onClick={() => copyToClipboard(code)} className="text-muted-foreground hover:text-foreground">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full" onClick={copyAllBackupCodes}>
                <Copy className="w-4 h-4 mr-2" />
                Copy All Codes
              </Button>
            </div>

            <DialogFooter>
              <Button onClick={() => setBackupCodesDialogOpen(false)}>
                I've Saved My Codes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Disable Dialog */}
        <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldOff className="w-5 h-5" />
                Disable Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                This will make your account less secure. Enter your password and current 2FA code to confirm.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div className="space-y-2">
                <Label>2FA Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDisable} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Disable 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TwoFactorAuth;
