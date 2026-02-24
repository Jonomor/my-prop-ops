"""
E-Signature API Tests
Tests for upload templates, send for signature, sign documents, and get documents
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://propops-fixes.preview.emergentagent.com').rstrip('/')

# Test credentials
MANAGER_EMAIL = "manager@test.mypropops.com"
MANAGER_PASSWORD = "TestManager2026!"

@pytest.fixture(scope="module")
def manager_token():
    """Get manager authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": MANAGER_EMAIL, "password": MANAGER_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Manager login failed: {response.text}")
    return response.json().get("token")

@pytest.fixture(scope="module")
def auth_headers(manager_token):
    """Get authenticated headers"""
    return {
        "Authorization": f"Bearer {manager_token}",
        "Content-Type": "application/json"
    }

class TestESignatureTemplates:
    """Tests for e-signature template endpoints"""
    
    def test_get_templates_empty(self, auth_headers):
        """Test getting templates list (may be empty)"""
        response = requests.get(f"{BASE_URL}/api/esign/templates", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Templates list returned {len(data)} templates")
    
    def test_upload_template_no_file(self, manager_token):
        """Test upload template fails without file"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = requests.post(
            f"{BASE_URL}/api/esign/templates",
            headers=headers,
            data={"template_name": "Test Template"}
        )
        # Should fail without file
        assert response.status_code in [400, 422], f"Expected 400/422 without file, got {response.status_code}"
        print(f"Upload without file correctly rejected: {response.status_code}")
    
    def test_upload_template_with_pdf(self, manager_token):
        """Test uploading a PDF template"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        
        # Create a minimal PDF content
        pdf_content = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer << /Root 1 0 R /Size 4 >>
startxref
184
%%EOF"""
        
        files = {
            'file': ('test_lease_agreement.pdf', pdf_content, 'application/pdf')
        }
        data = {
            'template_name': 'TEST_Lease Agreement Template'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/esign/templates",
            headers=headers,
            files=files,
            data=data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert 'id' in result, "Response should contain template id"
        assert result.get('name') == 'TEST_Lease Agreement Template'
        print(f"Template uploaded successfully: {result.get('id')}")
        return result.get('id')


class TestESignatureDocuments:
    """Tests for e-signature document endpoints"""
    
    @pytest.fixture(scope="class")
    def uploaded_template_id(self, manager_token):
        """Upload a template for testing documents"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        
        pdf_content = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer << /Root 1 0 R /Size 4 >>
startxref
184
%%EOF"""
        
        files = {'file': ('test_doc.pdf', pdf_content, 'application/pdf')}
        data = {'template_name': 'TEST_Document Template for Signing'}
        
        response = requests.post(
            f"{BASE_URL}/api/esign/templates",
            headers=headers,
            files=files,
            data=data
        )
        
        if response.status_code != 200:
            pytest.skip(f"Failed to upload template: {response.text}")
        
        return response.json().get('id')
    
    def test_get_documents_list(self, auth_headers):
        """Test getting sent documents list"""
        response = requests.get(f"{BASE_URL}/api/esign/documents", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Documents list returned {len(data)} documents")
    
    def test_send_document_for_signature(self, auth_headers, uploaded_template_id):
        """Test sending a document for signature"""
        payload = {
            "template_id": uploaded_template_id,
            "signer_name": "Test Tenant",
            "signer_email": "testtenant@example.com",
            "document_name": "TEST_Lease Agreement - John Doe"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/esign/send",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert 'id' in result, "Response should contain document id"
        assert 'signing_token' in result, "Response should contain signing_token"
        assert result.get('status') == 'sent', f"Status should be 'sent', got {result.get('status')}"
        print(f"Document sent successfully: {result.get('id')}, token: {result.get('signing_token')[:20]}...")
        return result
    
    def test_send_document_invalid_template(self, auth_headers):
        """Test sending document with invalid template fails"""
        payload = {
            "template_id": "nonexistent-template-id",
            "signer_name": "Test Tenant",
            "signer_email": "test@example.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/esign/send",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid template, got {response.status_code}"
        print("Invalid template correctly rejected with 404")


class TestPublicSigningEndpoints:
    """Tests for public document signing endpoints"""
    
    @pytest.fixture(scope="class")
    def sent_document(self, manager_token):
        """Create a document for signing tests"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        
        # First upload a template
        pdf_content = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer << /Root 1 0 R /Size 4 >>
startxref
184
%%EOF"""
        
        files = {'file': ('signing_test.pdf', pdf_content, 'application/pdf')}
        data = {'template_name': f'TEST_Signing Test Template {int(time.time())}'}
        
        response = requests.post(
            f"{BASE_URL}/api/esign/templates",
            headers=headers,
            files=files,
            data=data
        )
        
        if response.status_code != 200:
            pytest.skip(f"Failed to upload template: {response.text}")
        
        template_id = response.json().get('id')
        
        # Now send for signature
        headers_json = {
            "Authorization": f"Bearer {manager_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "template_id": template_id,
            "signer_name": "Public Test Signer",
            "signer_email": "publicsigner@example.com",
            "document_name": f"TEST_Public Signing Test {int(time.time())}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/esign/send",
            headers=headers_json,
            json=payload
        )
        
        if response.status_code != 200:
            pytest.skip(f"Failed to send document: {response.text}")
        
        return response.json()
    
    def test_get_document_for_signing(self, sent_document):
        """Test getting document details via public signing endpoint"""
        token = sent_document.get('signing_token')
        response = requests.get(f"{BASE_URL}/api/esign/document/{token}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'document_name' in data, "Response should contain document_name"
        assert 'signer_name' in data, "Response should contain signer_name"
        assert 'preview_url' in data, "Response should contain preview_url"
        print(f"Public signing endpoint returned document: {data.get('document_name')}")
    
    def test_get_document_invalid_token(self):
        """Test getting document with invalid token"""
        response = requests.get(f"{BASE_URL}/api/esign/document/invalid-token-here")
        assert response.status_code == 404, f"Expected 404 for invalid token, got {response.status_code}"
        print("Invalid token correctly rejected with 404")
    
    def test_preview_document(self, sent_document):
        """Test previewing document PDF"""
        token = sent_document.get('signing_token')
        response = requests.get(f"{BASE_URL}/api/esign/preview/{token}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'application/pdf' in response.headers.get('content-type', '').lower(), \
            f"Expected PDF content-type, got {response.headers.get('content-type')}"
        print(f"Document preview returned PDF, size: {len(response.content)} bytes")
    
    def test_sign_document(self, sent_document):
        """Test signing a document with signature image"""
        token = sent_document.get('signing_token')
        
        # Create a minimal base64 PNG signature image (1x1 pixel)
        # This is a valid minimal PNG
        signature_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        payload = {
            "signature_image": signature_base64,
            "signer_name": "Test Signer Full Name",
            "signer_email": "signer@example.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/esign/sign/{token}",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert result.get('status') == 'signed', f"Expected status 'signed', got {result.get('status')}"
        assert 'signed_document_url' in result, "Response should contain signed_document_url"
        print(f"Document signed successfully! Download URL: {result.get('signed_document_url')}")
    
    def test_sign_already_signed_document(self, sent_document):
        """Test signing an already signed document fails"""
        token = sent_document.get('signing_token')
        
        payload = {
            "signature_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "signer_name": "Another Signer",
            "signer_email": "another@example.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/esign/sign/{token}",
            json=payload
        )
        
        assert response.status_code == 400, f"Expected 400 for already signed doc, got {response.status_code}"
        print("Already signed document correctly rejected with 400")


class TestESignatureCleanup:
    """Cleanup tests - deleting test templates"""
    
    def test_cleanup_test_templates(self, manager_token):
        """Delete test templates created during tests"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        
        # Get all templates
        response = requests.get(f"{BASE_URL}/api/esign/templates", headers=headers)
        if response.status_code != 200:
            print("Could not get templates for cleanup")
            return
        
        templates = response.json()
        deleted_count = 0
        
        for template in templates:
            if template.get('name', '').startswith('TEST_'):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/esign/templates/{template['id']}",
                    headers=headers
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test templates")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
