import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { Wrench, Mail, Lock, User, Phone, Building, MapPin, ArrowRight, DollarSign, FileText } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const specialties = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'general', label: 'General Maintenance' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'cleaning', label: 'Cleaning' }
];

const ContractorRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company_name: '',
    phone: '',
    specialties: [],
    service_area: '',
    hourly_rate: '',
    license_number: ''
  });

  const toggleSpecialty = (value) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(value)
        ? prev.specialties.filter(s => s !== value)
        : [...prev.specialties, value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.specialties.length === 0) {
      toast.error('Please select at least one specialty');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: form.email,
        password: form.password,
        name: form.name,
        company_name: form.company_name || null,
        phone: form.phone,
        specialties: form.specialties,
        service_area: form.service_area || null,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        license_number: form.license_number || null
      };

      const res = await axios.post(`${API_URL}/contractor/register`, payload);
      localStorage.setItem('contractor_token', res.data.token);
      localStorage.setItem('contractor', JSON.stringify(res.data.contractor));
      toast.success('Registration successful! Welcome to MyPropOps.');
      navigate('/contractor/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-orange-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold font-heading text-foreground">MyPropOps</span>
              <p className="text-sm text-orange-600 font-medium">Contractor Portal</p>
            </div>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-heading">Join as a Contractor</CardTitle>
            <CardDescription>
              Get assigned jobs from property managers and grow your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="John Smith"
                        className="pl-10"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="company"
                        placeholder="Smith Repairs LLC"
                        className="pl-10"
                        value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@smithrepairs.com"
                        className="pl-10"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Specialties *</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specialties.map((specialty) => {
                    const isSelected = form.specialties.includes(specialty.value);
                    return (
                      <div
                        key={specialty.value}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                            : 'border-border hover:border-orange-300'
                        }`}
                        onClick={() => toggleSpecialty(specialty.value)}
                        onKeyDown={(e) => e.key === 'Enter' && toggleSpecialty(specialty.value)}
                        data-testid={`specialty-${specialty.value}`}
                      >
                        <div className={`h-4 w-4 shrink-0 rounded-sm border shadow ${
                          isSelected 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : 'border-gray-300'
                        } flex items-center justify-center`}>
                          {isSelected && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">{specialty.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Additional Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service_area">Service Area</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="service_area"
                        placeholder="e.g., Greater Boston Area"
                        className="pl-10"
                        value={form.service_area}
                        onChange={(e) => setForm({ ...form, service_area: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="hourly_rate"
                        type="number"
                        placeholder="75"
                        className="pl-10"
                        value={form.hourly_rate}
                        onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="license">License Number</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="license"
                        placeholder="e.g., MA-12345"
                        className="pl-10"
                        value={form.license_number}
                        onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Contractor Account'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/contractor/login" className="text-orange-600 hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractorRegister;
