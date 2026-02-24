import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import SignaturePad from '../components/SignaturePad';
import axios from 'axios';
import { 
  FileText, CheckCircle, Loader2, Download, 
  PenTool, AlertCircle, Home, Calendar, User
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const DocumentSigning = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const signatureRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [signed, setSigned] = useState(false);
  const [signedDocUrl, setSignedDocUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    signerName: '',
    signerEmail: '',
    agreedToTerms: false
  });

  useEffect(() => {
    fetchDocument();
  }, [token]);

  const fetchDocument = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/esign/document/${token}`);
      setDocument(response.data);
      setFormData(prev => ({
        ...prev,
        signerName: response.data.signer_name || '',
        signerEmail: response.data.signer_email || ''
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Document not found or link expired');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!formData.signerName.trim()) {
      toast.error('Please enter your full legal name');
      return;
    }
    if (!formData.agreedToTerms) {
      toast.error('Please agree to the terms to continue');
      return;
    }
    
    const signature = signatureRef.current?.getSignature();
    if (!signature) {
      toast.error('Please provide your signature');
      return;
    }

    setSigning(true);
    try {
      const response = await axios.post(`${API_URL}/api/esign/sign/${token}`, {
        signature_image: signature,
        signer_name: formData.signerName,
        signer_email: formData.signerEmail
      });
      
      setSigned(true);
      setSignedDocUrl(response.data.signed_document_url);
      toast.success('Document signed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to sign document');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Document</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link to="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Document Signed Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              Your signature has been applied to the document. A copy has been sent to your email.
            </p>
            {signedDocUrl && (
              <Button asChild className="w-full mb-3">
                <a href={`${API_URL}${signedDocUrl}`} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download Signed Document
                </a>
              </Button>
            )}
            <Link to="/">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <PenTool className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Sign Document</h1>
          <p className="text-muted-foreground">Review and sign the document below</p>
        </div>

        {/* Document Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {document.document_name}
            </CardTitle>
            <CardDescription>
              Sent by {document.sender_name} from {document.organization_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Sent: {new Date(document.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>For: {document.signer_name}</span>
              </div>
            </div>
            
            {/* Document Preview */}
            {document.preview_url && (
              <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50">
                <iframe 
                  src={`${API_URL}${document.preview_url}`}
                  className="w-full h-96"
                  title="Document Preview"
                />
              </div>
            )}
            
            {!document.preview_url && (
              <div className="mt-4 p-8 border rounded-lg bg-muted/50 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Document preview not available</p>
                <Button variant="link" asChild className="mt-2">
                  <a href={`${API_URL}${document.document_url}`} target="_blank" rel="noopener noreferrer">
                    Download to view
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Signature</CardTitle>
            <CardDescription>
              Enter your details and sign below to complete the document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="signerName">Full Legal Name *</Label>
                <Input
                  id="signerName"
                  value={formData.signerName}
                  onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                  placeholder="Enter your full legal name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signerEmail">Email Address</Label>
                <Input
                  id="signerEmail"
                  type="email"
                  value={formData.signerEmail}
                  onChange={(e) => setFormData({ ...formData, signerEmail: e.target.value })}
                  placeholder="Enter your email for a copy"
                />
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Draw Your Signature *</Label>
              <SignaturePad ref={signatureRef} width={500} height={150} />
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="terms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked })}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                I agree that my signature above is the legal equivalent of my handwritten signature 
                and that I have read and understood the document I am signing.
              </label>
            </div>

            <Button 
              onClick={handleSign} 
              disabled={signing}
              className="w-full"
              size="lg"
            >
              {signing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Document
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing, you agree that this electronic signature is valid and binding.
              <br />
              Timestamp will be recorded: {new Date().toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentSigning;
