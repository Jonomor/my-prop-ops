import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  Palette, 
  Upload, 
  Trash2, 
  Lock,
  Loader2,
  CheckCircle,
  Eye,
  Image
} from 'lucide-react';

const Branding = () => {
  const { api, currentOrg } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planAllowsBranding, setPlanAllowsBranding] = useState(false);
  const [branding, setBranding] = useState({
    logo_url: '',
    primary_color: '#3b82f6',
    company_name: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    if (currentOrg) {
      fetchData();
    }
  }, [currentOrg]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planRes, brandingRes] = await Promise.all([
        api.get('/billing/subscription-status'),
        api.get('/branding')
      ]);
      
      const plan = planRes.data?.plan || 'free';
      setPlanAllowsBranding(plan === 'pro');
      
      if (brandingRes.data) {
        setBranding(brandingRes.data);
        if (brandingRes.data.logo_url) {
          setLogoPreview(brandingRes.data.logo_url);
        }
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setBranding(prev => ({ ...prev, logo_url: '' }));
  };

  const saveBranding = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('primary_color', branding.primary_color);
      formData.append('company_name', branding.company_name);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (!logoPreview) {
        formData.append('remove_logo', 'true');
      }

      await api.post('/branding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Branding settings saved!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const previewColors = [
    '#3b82f6', // Blue (default)
    '#10b981', // Green
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
  ];

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
      <div className="max-w-4xl mx-auto space-y-8" data-testid="branding-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Custom Branding</h1>
          <p className="text-muted-foreground mt-1">
            Customize the look and feel of your property management portal
          </p>
        </div>

        {/* Plan Notice */}
        {!planAllowsBranding && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Lock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Custom branding requires Pro plan
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Upgrade to Pro to upload your logo and customize colors.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => window.location.href = '/billing'}>
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logo Upload */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Company Logo
            </CardTitle>
            <CardDescription>
              Upload your company logo. Recommended size: 200x50 pixels, PNG or SVG format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              {/* Logo Preview */}
              <div className="w-48 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">No logo</span>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!planAllowsBranding}
                    onClick={() => document.getElementById('logo-upload').click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                  {logoPreview && (
                    <Button
                      variant="outline"
                      onClick={removeLogo}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, or SVG. Max 2MB.
                </p>
              </div>

              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Color Customization */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Brand Color
            </CardTitle>
            <CardDescription>
              Choose a primary color that matches your brand identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Color Presets */}
            <div>
              <Label className="mb-3 block">Quick Presets</Label>
              <div className="flex gap-3">
                {previewColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => planAllowsBranding && setBranding(prev => ({ ...prev, primary_color: color }))}
                    disabled={!planAllowsBranding}
                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                      branding.primary_color === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="custom-color" className="mb-2 block">Custom Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="custom-color"
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    disabled={!planAllowsBranding}
                    className="w-12 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    disabled={!planAllowsBranding}
                    className="w-28 font-mono"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div>
              <Label className="mb-3 block">Preview</Label>
              <div className="p-4 border rounded-lg bg-background">
                <div className="flex items-center gap-4">
                  <Button style={{ backgroundColor: branding.primary_color }} className="hover:opacity-90">
                    Primary Button
                  </Button>
                  <Button variant="outline" style={{ borderColor: branding.primary_color, color: branding.primary_color }}>
                    Outline Button
                  </Button>
                  <span style={{ color: branding.primary_color }} className="font-medium">
                    Link Text
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Name Override */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Company Name</CardTitle>
            <CardDescription>
              Override the default "MyPropOps" name shown in your portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="company-name">Display Name</Label>
              <Input
                id="company-name"
                value={branding.company_name}
                onChange={(e) => setBranding(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Your Company Name"
                disabled={!planAllowsBranding}
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                Leave blank to use "MyPropOps"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        {planAllowsBranding && (
          <div className="flex justify-end">
            <Button onClick={saveBranding} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Branding Settings
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Branding;
