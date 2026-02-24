import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Home, User, Mail, Phone, Briefcase, DollarSign, 
  Calendar, Users, FileText, CheckCircle, Loader2,
  Building2, ArrowLeft
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app';

const TenantApplication = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [unitInfo, setUnitInfo] = useState(null);
  
  const unitId = searchParams.get('unit');
  const propertyId = searchParams.get('property');

  const [formData, setFormData] = useState({
    // Personal Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    
    // Current Address
    current_address: '',
    current_city: '',
    current_state: '',
    current_zip: '',
    current_rent: '',
    move_in_date: '',
    reason_for_moving: '',
    
    // Employment
    employer_name: '',
    employer_phone: '',
    job_title: '',
    monthly_income: '',
    employment_length: '',
    
    // Additional Info
    num_occupants: '1',
    pets: 'no',
    pet_details: '',
    smoking: 'no',
    
    // References
    reference1_name: '',
    reference1_phone: '',
    reference1_relationship: '',
    reference2_name: '',
    reference2_phone: '',
    reference2_relationship: '',
    
    // Emergency Contact
    emergency_name: '',
    emergency_phone: '',
    emergency_relationship: '',
    
    // Consent
    background_check_consent: false,
    terms_consent: false,
    
    // Additional
    additional_info: ''
  });

  useEffect(() => {
    if (unitId) {
      fetchUnitInfo();
    }
  }, [unitId]);

  const fetchUnitInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/public/unit/${unitId}`);
      setUnitInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch unit info');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.background_check_consent || !formData.terms_consent) {
      toast.error('Please agree to the required terms');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/public/applications`, {
        ...formData,
        unit_id: unitId,
        property_id: propertyId
      });
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your application. The property manager will review it and contact you within 2-3 business days.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation email has been sent to <strong>{formData.email}</strong>
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link to="/rentals">View More Listings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link to="/rentals" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Listings
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Rental Application</h1>
          {unitInfo && (
            <p className="text-primary-foreground/80 mt-2">
              Applying for: {unitInfo.unit_name} at {unitInfo.property_name}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="move_in_date">Desired Move-in Date *</Label>
                <Input
                  id="move_in_date"
                  type="date"
                  value={formData.move_in_date}
                  onChange={(e) => handleChange('move_in_date', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Residence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Current Residence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_address">Street Address *</Label>
                <Input
                  id="current_address"
                  value={formData.current_address}
                  onChange={(e) => handleChange('current_address', e.target.value)}
                  required
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_city">City *</Label>
                  <Input
                    id="current_city"
                    value={formData.current_city}
                    onChange={(e) => handleChange('current_city', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_state">State *</Label>
                  <Input
                    id="current_state"
                    value={formData.current_state}
                    onChange={(e) => handleChange('current_state', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_zip">ZIP Code *</Label>
                  <Input
                    id="current_zip"
                    value={formData.current_zip}
                    onChange={(e) => handleChange('current_zip', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_rent">Current Monthly Rent</Label>
                  <Input
                    id="current_rent"
                    type="number"
                    value={formData.current_rent}
                    onChange={(e) => handleChange('current_rent', e.target.value)}
                    placeholder="$"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason_for_moving">Reason for Moving</Label>
                  <Input
                    id="reason_for_moving"
                    value={formData.reason_for_moving}
                    onChange={(e) => handleChange('reason_for_moving', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Employment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employer_name">Employer Name *</Label>
                  <Input
                    id="employer_name"
                    value={formData.employer_name}
                    onChange={(e) => handleChange('employer_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employer_phone">Employer Phone</Label>
                  <Input
                    id="employer_phone"
                    type="tel"
                    value={formData.employer_phone}
                    onChange={(e) => handleChange('employer_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title *</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => handleChange('job_title', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_length">Length of Employment</Label>
                  <Input
                    id="employment_length"
                    value={formData.employment_length}
                    onChange={(e) => handleChange('employment_length', e.target.value)}
                    placeholder="e.g., 2 years"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_income">Monthly Income (Gross) *</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  value={formData.monthly_income}
                  onChange={(e) => handleChange('monthly_income', e.target.value)}
                  placeholder="$"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="num_occupants">Number of Occupants *</Label>
                  <Select value={formData.num_occupants} onValueChange={(v) => handleChange('num_occupants', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pets">Do you have pets? *</Label>
                  <Select value={formData.pets} onValueChange={(v) => handleChange('pets', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.pets === 'yes' && (
                <div className="space-y-2">
                  <Label htmlFor="pet_details">Pet Details (type, breed, weight)</Label>
                  <Input
                    id="pet_details"
                    value={formData.pet_details}
                    onChange={(e) => handleChange('pet_details', e.target.value)}
                    placeholder="e.g., Dog, Labrador, 50 lbs"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="smoking">Do you smoke? *</Label>
                <Select value={formData.smoking} onValueChange={(v) => handleChange('smoking', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* References */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                References
              </CardTitle>
              <CardDescription>Please provide two personal or professional references</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Reference 1 Name *</Label>
                  <Input
                    value={formData.reference1_name}
                    onChange={(e) => handleChange('reference1_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={formData.reference1_phone}
                    onChange={(e) => handleChange('reference1_phone', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship *</Label>
                  <Input
                    value={formData.reference1_relationship}
                    onChange={(e) => handleChange('reference1_relationship', e.target.value)}
                    placeholder="e.g., Former Landlord"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Reference 2 Name</Label>
                  <Input
                    value={formData.reference2_name}
                    onChange={(e) => handleChange('reference2_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formData.reference2_phone}
                    onChange={(e) => handleChange('reference2_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input
                    value={formData.reference2_relationship}
                    onChange={(e) => handleChange('reference2_relationship', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.emergency_name}
                  onChange={(e) => handleChange('emergency_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => handleChange('emergency_phone', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship *</Label>
                <Input
                  value={formData.emergency_relationship}
                  onChange={(e) => handleChange('emergency_relationship', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Is there anything else you'd like us to know?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.additional_info}
                onChange={(e) => handleChange('additional_info', e.target.value)}
                placeholder="Any additional information that might support your application..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Consent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="background_check"
                  checked={formData.background_check_consent}
                  onCheckedChange={(v) => handleChange('background_check_consent', v)}
                />
                <Label htmlFor="background_check" className="text-sm leading-relaxed cursor-pointer">
                  I authorize the property manager to conduct a background check, credit check, and verify all information provided in this application. *
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.terms_consent}
                  onCheckedChange={(v) => handleChange('terms_consent', v)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I certify that all information provided is true and accurate to the best of my knowledge. I understand that providing false information may result in denial of my application or termination of my lease. *
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" size="lg" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" asChild>
              <Link to="/rentals">Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TenantApplication;
