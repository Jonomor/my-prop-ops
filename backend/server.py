from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum
import shutil
import secrets

# Stripe Integration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Mailchimp Integration (optional - only if keys are provided)
try:
    import mailchimp_marketing as MailchimpMarketing
    import mailchimp_transactional as MailchimpTransactional
    MAILCHIMP_AVAILABLE = True
except ImportError:
    MAILCHIMP_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "propops-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

# Subscription Plan Pricing (amounts in USD)
SUBSCRIPTION_PLANS = {
    "standard_monthly": {"amount": 29.00, "plan": "standard", "period": "monthly"},
    "standard_annual": {"amount": 288.00, "plan": "standard", "period": "annual"},  # $24/mo billed annually
    "pro_monthly": {"amount": 99.00, "plan": "pro", "period": "monthly"},
    "pro_annual": {"amount": 984.00, "plan": "pro", "period": "annual"},  # $82/mo billed annually
}

# Mailchimp Configuration
MAILCHIMP_MARKETING_API_KEY = os.environ.get("MAILCHIMP_MARKETING_API_KEY", "")
MAILCHIMP_MARKETING_SERVER = os.environ.get("MAILCHIMP_MARKETING_SERVER", "us1")
MAILCHIMP_MARKETING_AUDIENCE_ID = os.environ.get("MAILCHIMP_MARKETING_AUDIENCE_ID", "")
MAILCHIMP_TRANSACTIONAL_API_KEY = os.environ.get("MAILCHIMP_TRANSACTIONAL_API_KEY", "")
MAILCHIMP_FROM_EMAIL = os.environ.get("MAILCHIMP_TRANSACTIONAL_FROM_EMAIL", "noreply@mypropops.com")

# Initialize Mailchimp clients (if keys are provided)
mailchimp_marketing_client = None
mailchimp_transactional_client = None

if MAILCHIMP_AVAILABLE and MAILCHIMP_MARKETING_API_KEY:
    try:
        mailchimp_marketing_client = MailchimpMarketing.Client()
        mailchimp_marketing_client.set_config({
            "api_key": MAILCHIMP_MARKETING_API_KEY,
            "server": MAILCHIMP_MARKETING_SERVER
        })
        logger.info("Mailchimp Marketing client initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize Mailchimp Marketing: {e}")

if MAILCHIMP_AVAILABLE and MAILCHIMP_TRANSACTIONAL_API_KEY:
    try:
        mailchimp_transactional_client = MailchimpTransactional.Client(MAILCHIMP_TRANSACTIONAL_API_KEY)
        logger.info("Mailchimp Transactional client initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize Mailchimp Transactional: {e}")

# File upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="PropOps API", version="1.0.0")


@app.get("/")
async def root():
    return {"ok": True, "service": "propops-api", "docs": "/docs", "api_base": "/api"}


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/pretty-print")
async def pretty_print():
    return {
        "ok": True,
        "detail": "Endpoint not implemented. Use /docs to view available routes.",
    }


# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ============== FEATURE FLAGS ==============
# All advanced features default to OFF for monetization readiness
FEATURE_FLAGS = {
    "email_invites": False,      # Email delivery for invitations
    "billing": False,            # Stripe/payment integration
    "maintenance": False,        # Maintenance request workflows
    "advanced_analytics": False, # Advanced reporting features
    "api_access": False,         # External API access
}

def is_feature_enabled(feature: str) -> bool:
    """Check if a feature flag is enabled"""
    return FEATURE_FLAGS.get(feature, False)

# ============== PLAN LIMITS ==============
PLAN_LIMITS = {
    "free": {
        "max_properties": 2,
        "max_units": 5,
        "max_team_members": 1,
        "document_storage_mb": 500,
        "tenant_portal": False,
        "api_access": False,
    },
    "standard": {
        "max_properties": 20,
        "max_units": 40,
        "max_team_members": 5,
        "document_storage_mb": 10240,  # 10GB
        "tenant_portal": False,
        "api_access": False,
    },
    "pro": {
        "max_properties": None,  # Unlimited
        "max_units": None,       # Unlimited
        "max_team_members": None,
        "document_storage_mb": 102400,  # 100GB
        "tenant_portal": True,
        "api_access": True,
    }
}

async def get_org_plan_limits(org_id: str):
    """Get the plan limits for an organization"""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0, "plan": 1})
    plan = org.get("plan", "free") if org else "free"
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])

async def check_property_limit(org_id: str):
    """Check if organization can create more properties"""
    limits = await get_org_plan_limits(org_id)
    max_props = limits["max_properties"]
    if max_props is None:
        return True, None
    
    current_count = await db.properties.count_documents({"org_id": org_id})
    if current_count >= max_props:
        return False, f"Property limit reached ({max_props}). Upgrade your plan to add more properties."
    return True, None

async def check_unit_limit(org_id: str, additional_units: int = 1):
    """Check if organization can create more units"""
    limits = await get_org_plan_limits(org_id)
    max_units = limits["max_units"]
    if max_units is None:
        return True, None
    
    current_count = await db.units.count_documents({"org_id": org_id})
    if current_count + additional_units > max_units:
        return False, f"Unit limit reached ({max_units}). Upgrade your plan to add more units."
    return True, None

async def get_org_usage(org_id: str):
    """Get current usage stats for an organization"""
    property_count = await db.properties.count_documents({"org_id": org_id})
    unit_count = await db.units.count_documents({"org_id": org_id})
    team_count = await db.memberships.count_documents({"org_id": org_id})
    
    limits = await get_org_plan_limits(org_id)
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0, "plan": 1})
    plan = org.get("plan", "free") if org else "free"
    
    return {
        "plan": plan,
        "usage": {
            "properties": property_count,
            "units": unit_count,
            "team_members": team_count
        },
        "limits": {
            "max_properties": limits["max_properties"],
            "max_units": limits["max_units"],
            "max_team_members": limits["max_team_members"],
            "tenant_portal": limits["tenant_portal"],
            "api_access": limits["api_access"]
        }
    }

# ============== ENUMS ==============
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"

class TenantStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    INACTIVE = "inactive"

class InspectionStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    FAILED = "failed"
    APPROVED = "approved"

class DocumentCategory(str, Enum):
    LEASE = "lease"
    ID = "id"
    INSPECTION = "inspection"
    MAINTENANCE = "maintenance"
    OTHER = "other"

class InviteStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"

class OrganizationPlan(str, Enum):
    FREE = "free"
    STANDARD = "standard"
    PRO = "pro"
    ENTERPRISE = "enterprise"

# Tenant Portal Enums
class ApplicationStage(str, Enum):
    NOT_STARTED = "not_started"
    APPLICATION_SUBMITTED = "application_submitted"
    DOCUMENTS_UNDER_REVIEW = "documents_under_review"
    BACKGROUND_CHECK = "background_check"
    INSPECTION_SCHEDULED = "inspection_scheduled"
    INSPECTION_COMPLETE = "inspection_complete"
    APPROVED = "approved"
    DENIED = "denied"

class DocumentChecklistStatus(str, Enum):
    NOT_STARTED = "not_started"
    UPLOADED = "uploaded"
    VERIFIED = "verified"
    REJECTED = "rejected"

class HousingProgram(str, Enum):
    SECTION_8 = "section_8"
    HUD = "hud"
    LIHTC = "lihtc"
    PUBLIC_HOUSING = "public_housing"
    HOME = "home"
    HOPWA = "hopwa"
    VASH = "vash"
    OTHER = "other"

# ============== INSPECTION STATUS STATE MACHINE ==============
VALID_TRANSITIONS = {
    InspectionStatus.SCHEDULED: [InspectionStatus.COMPLETED, InspectionStatus.FAILED],
    InspectionStatus.COMPLETED: [InspectionStatus.APPROVED, InspectionStatus.FAILED],
    InspectionStatus.FAILED: [],
    InspectionStatus.APPROVED: []
}

# ============== MODELS ==============
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class OrganizationCreate(BaseModel):
    name: str
    description: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    plan: str = "free"
    created_at: str

class MembershipResponse(BaseModel):
    id: str
    org_id: str
    org_name: str
    user_id: str
    role: str
    created_at: str

class MemberResponse(BaseModel):
    """Read-only member info for directory"""
    id: str
    name: str
    email: str
    role: str
    joined_at: str

class PropertyCreate(BaseModel):
    name: str
    address: str
    description: Optional[str] = None
    total_units: int = 0

class PropertyResponse(BaseModel):
    id: str
    org_id: str
    name: str
    address: str
    description: Optional[str]
    total_units: int
    created_at: str

class UnitCreate(BaseModel):
    property_id: str
    unit_number: str
    bedrooms: int = 1
    bathrooms: float = 1.0
    square_feet: Optional[int] = None
    rent_amount: Optional[float] = None

class UnitResponse(BaseModel):
    id: str
    org_id: str
    property_id: str
    unit_number: str
    bedrooms: int
    bathrooms: float
    square_feet: Optional[int]
    rent_amount: Optional[float]
    tenant_id: Optional[str]
    created_at: str

class TenantCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    unit_id: Optional[str] = None
    lease_start: Optional[str] = None
    lease_end: Optional[str] = None
    status: TenantStatus = TenantStatus.PENDING

class TenantResponse(BaseModel):
    id: str
    org_id: str
    name: str
    email: str
    phone: Optional[str]
    unit_id: Optional[str]
    lease_start: Optional[str]
    lease_end: Optional[str]
    status: str
    created_at: str

class InspectionCreate(BaseModel):
    property_id: str
    unit_id: Optional[str] = None
    scheduled_date: str
    notes: Optional[str] = None

class InspectionUpdate(BaseModel):
    status: Optional[InspectionStatus] = None
    notes: Optional[str] = None
    completed_date: Optional[str] = None

class InspectionResponse(BaseModel):
    id: str
    org_id: str
    property_id: str
    unit_id: Optional[str]
    scheduled_date: str
    completed_date: Optional[str]
    status: str
    notes: Optional[str]
    inspector_id: Optional[str]
    created_at: str

class DocumentResponse(BaseModel):
    id: str
    org_id: str
    filename: str
    original_filename: str
    category: str
    tenant_id: Optional[str]
    inspection_id: Optional[str]
    uploaded_by: str
    created_at: str

class NotificationResponse(BaseModel):
    id: str
    org_id: str
    user_id: str
    title: str
    message: str
    is_read: bool
    created_at: str

class AuditLogResponse(BaseModel):
    id: str
    org_id: str
    user_id: str
    user_name: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: str

class DashboardStats(BaseModel):
    total_properties: int
    total_units: int
    total_tenants: int
    active_tenants: int
    pending_inspections: int
    unread_notifications: int

# Team Invitation Models
class InviteCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.STAFF

class InviteResponse(BaseModel):
    id: str
    org_id: str
    org_name: str
    email: str
    role: str
    token: str
    status: str
    invited_by: str
    invited_by_name: str
    created_at: str
    expires_at: str

class AcceptInviteRequest(BaseModel):
    token: str

# Calendar Event Model
class CalendarEvent(BaseModel):
    id: str
    title: str
    date: str
    type: str  # 'inspection' or 'lease_end'
    status: Optional[str]
    property_name: Optional[str]
    unit_number: Optional[str]
    tenant_name: Optional[str]

# Feature Flags Response
class FeatureFlagsResponse(BaseModel):
    email_invites: bool
    billing: bool
    maintenance: bool
    advanced_analytics: bool
    api_access: bool

# ============== TENANT PORTAL MODELS ==============
class HouseholdMember(BaseModel):
    name: str
    relationship: str  # self, spouse, child, other
    date_of_birth: Optional[str] = None
    income: Optional[float] = None
    income_source: Optional[str] = None

class TenantPortalRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class TenantPortalLogin(BaseModel):
    email: EmailStr
    password: str

class TenantPortalProfile(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    housing_program: Optional[HousingProgram] = None
    voucher_number: Optional[str] = None
    household_size: int = 1
    household_members: List[HouseholdMember] = []
    annual_income: Optional[float] = None
    income_sources: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class TenantPortalProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    housing_program: Optional[HousingProgram] = None
    voucher_number: Optional[str] = None
    household_size: Optional[int] = None
    household_members: Optional[List[HouseholdMember]] = None
    annual_income: Optional[float] = None
    income_sources: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class TenantPortalProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str]
    address: Optional[str]
    housing_program: Optional[str]
    voucher_number: Optional[str]
    household_size: int
    household_members: List[dict]
    annual_income: Optional[float]
    income_sources: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    application_stage: str
    created_at: str

class DocumentChecklistItem(BaseModel):
    id: str
    name: str
    description: str
    required: bool
    status: str
    document_id: Optional[str]
    uploaded_at: Optional[str]
    verified_at: Optional[str]
    notes: Optional[str]

class ApplicationStatusResponse(BaseModel):
    stage: str
    stages: List[dict]
    updated_at: str

class TenantAppointment(BaseModel):
    id: str
    title: str
    description: Optional[str]
    date: str
    time: str
    location: Optional[str]
    type: str  # inspection, interview, orientation, other
    status: str  # scheduled, completed, cancelled
    created_at: str

class AppointmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    time: str
    location: Optional[str] = None
    type: str = "other"

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_type: str  # tenant or landlord
    content: str
    is_read: bool
    created_at: str

class ConversationResponse(BaseModel):
    id: str
    tenant_portal_id: str
    org_id: str
    property_id: Optional[str]
    tenant_name: str
    landlord_name: str
    last_message: Optional[str]
    last_message_at: Optional[str]
    unread_count: int
    created_at: str

# Default document checklist for housing programs
DEFAULT_DOCUMENT_CHECKLIST = [
    {"name": "Government-Issued ID", "description": "Valid driver's license, passport, or state ID for all adult household members", "required": True, "source_type": "tenant_provided", "template": None, "help_text": "You can obtain this from your state's DMV or use a valid passport"},
    {"name": "Social Security Cards", "description": "Social Security cards for all household members", "required": False, "source_type": "tenant_provided", "template": None, "help_text": "Only provide last 4 digits if requested - never share full SSN with landlords"},
    {"name": "Birth Certificates", "description": "Birth certificates for all household members", "required": False, "source_type": "tenant_provided", "template": None, "help_text": "Typically only needed for housing authority, not landlords"},
    {"name": "Proof of Income", "description": "Pay stubs, employer letter, or benefit statements from the last 30 days", "required": True, "source_type": "tenant_provided", "template": None, "help_text": "Get pay stubs from employer or benefit statements from your benefits provider"},
    {"name": "Housing Voucher", "description": "Section 8 voucher, HUD certificate, or other housing program documentation", "required": True, "source_type": "request_from_landlord", "template": None, "help_text": "Your local Public Housing Authority (PHA) issues these documents"},
    {"name": "Bank Statements", "description": "Last 3 months of bank statements for all accounts", "required": False, "source_type": "tenant_provided", "template": None, "help_text": "You may redact account numbers for privacy"},
    {"name": "Tax Returns", "description": "Most recent federal tax return (1040) or tax transcript", "required": False, "source_type": "tenant_provided", "template": None, "help_text": "Request transcripts free at irs.gov if you need copies"},
    {"name": "Proof of Assets", "description": "Documentation of any assets (stocks, bonds, property)", "required": False, "source_type": "tenant_provided", "template": None, "help_text": "Statements from financial institutions showing account balances"},
    {"name": "Previous Landlord References", "description": "Contact information and reference letters from previous landlords", "required": False, "source_type": "request_from_landlord", "template": None, "help_text": "Request a reference letter from your previous landlord"},
    {"name": "Criminal Background Authorization", "description": "Download, sign, and upload authorization form", "required": True, "source_type": "download_sign", "template": "background_check_authorization", "help_text": "Download the form below, print, sign, and upload"},
    {"name": "Credit Check Authorization", "description": "Download, sign, and upload authorization form", "required": True, "source_type": "download_sign", "template": "credit_check_authorization", "help_text": "Download the form below, print, sign, and upload"},
    {"name": "Disability Verification", "description": "If applicable, documentation of disability status", "required": False, "source_type": "tenant_provided", "template": None, "help_text": "Medical provider documentation or SSA disability determination letter"},
]

# Application stages with descriptions
APPLICATION_STAGES = [
    {"stage": "not_started", "label": "Not Started", "description": "Begin your application process"},
    {"stage": "application_submitted", "label": "Application Submitted", "description": "Your application has been received"},
    {"stage": "documents_under_review", "label": "Documents Under Review", "description": "We are reviewing your submitted documents"},
    {"stage": "background_check", "label": "Background Check", "description": "Background and credit checks in progress"},
    {"stage": "inspection_scheduled", "label": "Inspection Scheduled", "description": "Unit inspection has been scheduled"},
    {"stage": "inspection_complete", "label": "Inspection Complete", "description": "Unit inspection has been completed"},
    {"stage": "approved", "label": "Approved", "description": "Congratulations! Your application has been approved"},
    {"stage": "denied", "label": "Denied", "description": "Unfortunately, your application was not approved"},
]

# ============== HELPER FUNCTIONS ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_tenant_token(tenant_id: str, email: str) -> str:
    """Create JWT token for tenant portal users"""
    payload = {
        'tenant_portal_id': tenant_id,
        'email': email,
        'type': 'tenant',
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_current_tenant(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current tenant portal user"""
    payload = decode_token(credentials.credentials)
    if payload.get('type') != 'tenant':
        raise HTTPException(status_code=401, detail="Invalid tenant token")
    tenant = await db.tenant_portal_users.find_one({"id": payload['tenant_portal_id']}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=401, detail="Tenant not found")
    return tenant

async def get_user_membership(user_id: str, org_id: str):
    membership = await db.memberships.find_one({"user_id": user_id, "org_id": org_id}, {"_id": 0})
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    return membership

def require_role(membership: dict, allowed_roles: list):
    """Reusable helper for role enforcement"""
    if membership['role'] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

def validate_inspection_transition(current_status: str, new_status: InspectionStatus):
    """Validate inspection status transitions according to state machine"""
    current = InspectionStatus(current_status)
    valid_next_states = VALID_TRANSITIONS.get(current, [])
    if new_status not in valid_next_states:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid inspection status transition from '{current_status}' to '{new_status}'"
        )

async def create_audit_log(
    org_id: str, 
    user_id: str, 
    user_name: str, 
    action: str, 
    entity_type: str, 
    entity_id: str, 
    details: str = None,
    ip_address: str = None,
    user_agent: str = None
):
    """Create immutable audit log entry with full context"""
    log = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "user_id": user_id,
        "user_name": user_name,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    # Audit logs are immutable - insert only, no updates or deletes exposed
    await db.audit_logs.insert_one(log)

def get_client_info(request: Request) -> tuple:
    """Extract IP address and user agent from request"""
    ip_address = request.client.host if request.client else None
    # Handle X-Forwarded-For for proxied requests
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    user_agent = request.headers.get("User-Agent", "")[:500]  # Limit length
    return ip_address, user_agent

async def create_notification(org_id: str, user_id: str, title: str, message: str):
    notification = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "user_id": user_id,
        "title": title,
        "message": message,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)

# ============== AUTH ROUTES ==============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Create default organization for new user
    org_id = str(uuid.uuid4())
    org = {
        "id": org_id,
        "name": f"{data.name}'s Organization",
        "description": "Default organization",
        "plan": OrganizationPlan.FREE,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.organizations.insert_one(org)
    
    # Create membership
    membership = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "user_id": user_id,
        "role": UserRole.ADMIN,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.memberships.insert_one(membership)
    
    token = create_token(user_id, data.email)
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            email=data.email,
            name=data.name,
            created_at=user['created_at']
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], data.email)
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            created_at=user['created_at']
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user = Depends(get_current_user)):
    return UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        created_at=user['created_at']
    )

# ============== ORGANIZATION ROUTES ==============
@api_router.get("/organizations", response_model=List[MembershipResponse])
async def list_organizations(user = Depends(get_current_user)):
    memberships = await db.memberships.find({"user_id": user['id']}, {"_id": 0}).to_list(100)
    result = []
    for m in memberships:
        org = await db.organizations.find_one({"id": m['org_id']}, {"_id": 0})
        if org:
            result.append(MembershipResponse(
                id=m['id'],
                org_id=m['org_id'],
                org_name=org['name'],
                user_id=m['user_id'],
                role=m['role'],
                created_at=m['created_at']
            ))
    return result

@api_router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(data: OrganizationCreate, user = Depends(get_current_user)):
    org_id = str(uuid.uuid4())
    org = {
        "id": org_id,
        "name": data.name,
        "description": data.description,
        "plan": OrganizationPlan.FREE,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.organizations.insert_one(org)
    
    # Create admin membership for creator
    membership = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "user_id": user['id'],
        "role": UserRole.ADMIN,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.memberships.insert_one(membership)
    
    await create_audit_log(org_id, user['id'], user['name'], "created", "organization", org_id, f"Created organization: {data.name}")
    
    return OrganizationResponse(
        id=org_id,
        name=data.name,
        description=data.description,
        plan=OrganizationPlan.FREE,
        created_at=org['created_at']
    )

@api_router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    # Ensure plan field exists for backwards compatibility
    if 'plan' not in org:
        org['plan'] = OrganizationPlan.FREE
    return OrganizationResponse(**org)

@api_router.get("/organizations/{org_id}/usage")
async def get_organization_usage(org_id: str, user = Depends(get_current_user)):
    """Get current usage and plan limits for an organization"""
    await get_user_membership(user['id'], org_id)
    return await get_org_usage(org_id)

# ============== TEAM INVITATION ROUTES ==============
@api_router.post("/organizations/{org_id}/invites", response_model=InviteResponse)
async def create_invite(org_id: str, data: InviteCreate, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN])
    
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check if user with this email is already a member
    existing_user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if existing_user:
        existing_membership = await db.memberships.find_one({
            "org_id": org_id, 
            "user_id": existing_user['id']
        })
        if existing_membership:
            raise HTTPException(status_code=400, detail="User is already a member of this organization")
    
    # Check for existing pending invite
    existing_invite = await db.invites.find_one({
        "org_id": org_id, 
        "email": {"$regex": f"^{data.email}$", "$options": "i"},
        "status": InviteStatus.PENDING
    })
    if existing_invite:
        raise HTTPException(status_code=400, detail="An invite for this email is already pending")
    
    invite_id = str(uuid.uuid4())
    invite_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    invite = {
        "id": invite_id,
        "org_id": org_id,
        "email": data.email,
        "role": data.role,
        "token": invite_token,
        "status": InviteStatus.PENDING,
        "invited_by": user['id'],
        "invited_by_name": user['name'],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat()
    }
    await db.invites.insert_one(invite)
    
    await create_audit_log(org_id, user['id'], user['name'], "created", "invite", invite_id, f"Invited {data.email} as {data.role}")
    
    return InviteResponse(
        id=invite_id,
        org_id=org_id,
        org_name=org['name'],
        email=data.email,
        role=data.role,
        token=invite_token,
        status=InviteStatus.PENDING,
        invited_by=user['id'],
        invited_by_name=user['name'],
        created_at=invite['created_at'],
        expires_at=invite['expires_at']
    )

@api_router.get("/organizations/{org_id}/invites", response_model=List[InviteResponse])
async def list_invites(org_id: str, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN])
    
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    invites = await db.invites.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    return [InviteResponse(org_name=org['name'], **inv) for inv in invites]

@api_router.delete("/organizations/{org_id}/invites/{invite_id}")
async def delete_invite(org_id: str, invite_id: str, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN])
    
    result = await db.invites.delete_one({"id": invite_id, "org_id": org_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    return {"message": "Invite deleted"}

# Get pending invites for current user - must be before /invites/{token} to avoid route conflict
@api_router.get("/invites/pending", response_model=List[InviteResponse])
async def get_pending_invites(user = Depends(get_current_user)):
    invites = await db.invites.find({
        "email": user['email'],
        "status": InviteStatus.PENDING
    }, {"_id": 0}).to_list(100)
    
    result = []
    for inv in invites:
        org = await db.organizations.find_one({"id": inv['org_id']}, {"_id": 0})
        if org:
            result.append(InviteResponse(org_name=org['name'], **inv))
    return result

@api_router.get("/invites/{token}")
async def get_invite_by_token(token: str):
    """Public endpoint to get invite details by token"""
    invite = await db.invites.find_one({"token": token}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    # Check if expired
    expires_at = datetime.fromisoformat(invite['expires_at'].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        await db.invites.update_one({"token": token}, {"$set": {"status": InviteStatus.EXPIRED}})
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    if invite['status'] != InviteStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Invite is {invite['status']}")
    
    org = await db.organizations.find_one({"id": invite['org_id']}, {"_id": 0})
    return {
        "org_name": org['name'] if org else "Unknown",
        "email": invite['email'],
        "role": invite['role'],
        "invited_by_name": invite['invited_by_name']
    }

@api_router.post("/invites/accept")
async def accept_invite(data: AcceptInviteRequest, user = Depends(get_current_user)):
    """Accept an invite (user must be logged in)"""
    invite = await db.invites.find_one({"token": data.token}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    # Check if expired
    expires_at = datetime.fromisoformat(invite['expires_at'].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        await db.invites.update_one({"token": data.token}, {"$set": {"status": InviteStatus.EXPIRED}})
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    if invite['status'] != InviteStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Invite is {invite['status']}")
    
    # Verify email matches
    if invite['email'].lower() != user['email'].lower():
        raise HTTPException(status_code=403, detail="This invite was sent to a different email address")
    
    # Check if already a member
    existing = await db.memberships.find_one({"org_id": invite['org_id'], "user_id": user['id']})
    if existing:
        raise HTTPException(status_code=400, detail="You are already a member of this organization")
    
    # Create membership
    membership = {
        "id": str(uuid.uuid4()),
        "org_id": invite['org_id'],
        "user_id": user['id'],
        "role": invite['role'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.memberships.insert_one(membership)
    
    # Update invite status
    await db.invites.update_one({"token": data.token}, {"$set": {"status": InviteStatus.ACCEPTED}})
    
    await create_audit_log(invite['org_id'], user['id'], user['name'], "accepted", "invite", invite['id'], f"Accepted invite as {invite['role']}")
    
    org = await db.organizations.find_one({"id": invite['org_id']}, {"_id": 0})
    return {"message": f"Successfully joined {org['name']}", "org_id": invite['org_id']}

# ============== PROPERTY ROUTES ==============
@api_router.get("/organizations/{org_id}/properties", response_model=List[PropertyResponse])
async def list_properties(org_id: str, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    properties = await db.properties.find({"org_id": org_id}, {"_id": 0}).to_list(1000)
    return [PropertyResponse(**p) for p in properties]

@api_router.post("/organizations/{org_id}/properties", response_model=PropertyResponse)
async def create_property(org_id: str, data: PropertyCreate, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    # Check property limit
    can_create, error_msg = await check_property_limit(org_id)
    if not can_create:
        raise HTTPException(status_code=402, detail=error_msg)
    
    # Check unit limit if auto-creating units
    if data.total_units and data.total_units > 0:
        can_create_units, unit_error = await check_unit_limit(org_id, data.total_units)
        if not can_create_units:
            raise HTTPException(status_code=402, detail=unit_error)
    
    prop_id = str(uuid.uuid4())
    prop = {
        "id": prop_id,
        "org_id": org_id,
        "name": data.name,
        "address": data.address,
        "description": data.description,
        "total_units": data.total_units,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.properties.insert_one(prop)
    
    # Auto-create units if total_units is specified
    if data.total_units and data.total_units > 0:
        units_to_create = []
        for i in range(1, data.total_units + 1):
            unit = {
                "id": str(uuid.uuid4()),
                "org_id": org_id,
                "property_id": prop_id,
                "unit_number": str(i),
                "bedrooms": 1,
                "bathrooms": 1.0,
                "square_feet": None,
                "rent_amount": None,
                "tenant_id": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            units_to_create.append(unit)
        if units_to_create:
            await db.units.insert_many(units_to_create)
    
    await create_audit_log(org_id, user['id'], user['name'], "created", "property", prop_id, f"Created property: {data.name}")
    
    # Notify all org members
    memberships = await db.memberships.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    for m in memberships:
        await create_notification(org_id, m['user_id'], "New Property Added", f"Property '{data.name}' has been added.")
    
    return PropertyResponse(**prop)

@api_router.get("/organizations/{org_id}/properties/{property_id}", response_model=PropertyResponse)
async def get_property(org_id: str, property_id: str, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    prop = await db.properties.find_one({"id": property_id, "org_id": org_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return PropertyResponse(**prop)

@api_router.put("/organizations/{org_id}/properties/{property_id}", response_model=PropertyResponse)
async def update_property(org_id: str, property_id: str, data: PropertyCreate, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    result = await db.properties.update_one(
        {"id": property_id, "org_id": org_id},
        {"$set": {
            "name": data.name,
            "address": data.address,
            "description": data.description,
            "total_units": data.total_units
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    await create_audit_log(org_id, user['id'], user['name'], "updated", "property", property_id, f"Updated property: {data.name}")
    
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return PropertyResponse(**prop)

@api_router.delete("/organizations/{org_id}/properties/{property_id}")
async def delete_property(org_id: str, property_id: str, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    prop = await db.properties.find_one({"id": property_id, "org_id": org_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    await db.properties.delete_one({"id": property_id})
    await create_audit_log(org_id, user['id'], user['name'], "deleted", "property", property_id, f"Deleted property: {prop['name']}")
    
    return {"message": "Property deleted"}

# ============== UNIT ROUTES ==============
@api_router.get("/organizations/{org_id}/units", response_model=List[UnitResponse])
async def list_units(org_id: str, property_id: Optional[str] = None, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    query = {"org_id": org_id}
    if property_id:
        query["property_id"] = property_id
    units = await db.units.find(query, {"_id": 0}).to_list(1000)
    return [UnitResponse(**u) for u in units]

@api_router.post("/organizations/{org_id}/units", response_model=UnitResponse)
async def create_unit(org_id: str, data: UnitCreate, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    
    # Check unit limit
    can_create, error_msg = await check_unit_limit(org_id)
    if not can_create:
        raise HTTPException(status_code=402, detail=error_msg)
    
    # Verify property exists and belongs to org
    prop = await db.properties.find_one({"id": data.property_id, "org_id": org_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    unit_id = str(uuid.uuid4())
    unit = {
        "id": unit_id,
        "org_id": org_id,
        "property_id": data.property_id,
        "unit_number": data.unit_number,
        "bedrooms": data.bedrooms,
        "bathrooms": data.bathrooms,
        "square_feet": data.square_feet,
        "rent_amount": data.rent_amount,
        "tenant_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.units.insert_one(unit)
    
    await create_audit_log(org_id, user['id'], user['name'], "created", "unit", unit_id, f"Created unit: {data.unit_number}")
    
    return UnitResponse(**unit)

@api_router.get("/organizations/{org_id}/units/{unit_id}", response_model=UnitResponse)
async def get_unit(org_id: str, unit_id: str, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    unit = await db.units.find_one({"id": unit_id, "org_id": org_id}, {"_id": 0})
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return UnitResponse(**unit)

@api_router.put("/organizations/{org_id}/units/{unit_id}", response_model=UnitResponse)
async def update_unit(org_id: str, unit_id: str, data: UnitCreate, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    
    result = await db.units.update_one(
        {"id": unit_id, "org_id": org_id},
        {"$set": {
            "unit_number": data.unit_number,
            "bedrooms": data.bedrooms,
            "bathrooms": data.bathrooms,
            "square_feet": data.square_feet,
            "rent_amount": data.rent_amount
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    await create_audit_log(org_id, user['id'], user['name'], "updated", "unit", unit_id, f"Updated unit: {data.unit_number}")
    
    unit = await db.units.find_one({"id": unit_id}, {"_id": 0})
    return UnitResponse(**unit)

# ============== TENANT ROUTES ==============
@api_router.get("/organizations/{org_id}/tenants", response_model=List[TenantResponse])
async def list_tenants(org_id: str, status: Optional[TenantStatus] = None, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    query = {"org_id": org_id}
    if status:
        query["status"] = status
    tenants = await db.tenants.find(query, {"_id": 0}).to_list(1000)
    return [TenantResponse(**t) for t in tenants]

@api_router.post("/organizations/{org_id}/tenants", response_model=TenantResponse)
async def create_tenant(org_id: str, data: TenantCreate, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    
    tenant_id = str(uuid.uuid4())
    tenant = {
        "id": tenant_id,
        "org_id": org_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "unit_id": data.unit_id,
        "lease_start": data.lease_start,
        "lease_end": data.lease_end,
        "status": data.status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenants.insert_one(tenant)
    
    # Update unit with tenant if assigned
    if data.unit_id:
        await db.units.update_one({"id": data.unit_id, "org_id": org_id}, {"$set": {"tenant_id": tenant_id}})
    
    await create_audit_log(org_id, user['id'], user['name'], "created", "tenant", tenant_id, f"Created tenant: {data.name}")
    
    return TenantResponse(**tenant)

@api_router.get("/organizations/{org_id}/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(org_id: str, tenant_id: str, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    tenant = await db.tenants.find_one({"id": tenant_id, "org_id": org_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return TenantResponse(**tenant)

@api_router.put("/organizations/{org_id}/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(org_id: str, tenant_id: str, data: TenantCreate, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    old_tenant = await db.tenants.find_one({"id": tenant_id, "org_id": org_id}, {"_id": 0})
    if not old_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Clear old unit assignment
    if old_tenant.get('unit_id') and old_tenant['unit_id'] != data.unit_id:
        await db.units.update_one({"id": old_tenant['unit_id']}, {"$set": {"tenant_id": None}})
    
    # Update tenant
    result = await db.tenants.update_one(
        {"id": tenant_id, "org_id": org_id},
        {"$set": {
            "name": data.name,
            "email": data.email,
            "phone": data.phone,
            "unit_id": data.unit_id,
            "lease_start": data.lease_start,
            "lease_end": data.lease_end,
            "status": data.status
        }}
    )
    
    # Set new unit assignment
    if data.unit_id:
        await db.units.update_one({"id": data.unit_id, "org_id": org_id}, {"$set": {"tenant_id": tenant_id}})
    
    await create_audit_log(org_id, user['id'], user['name'], "updated", "tenant", tenant_id, f"Updated tenant: {data.name}")
    
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    return TenantResponse(**tenant)

# ============== INSPECTION ROUTES ==============
@api_router.get("/organizations/{org_id}/inspections", response_model=List[InspectionResponse])
async def list_inspections(org_id: str, status: Optional[InspectionStatus] = None, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    query = {"org_id": org_id}
    if status:
        query["status"] = status
    inspections = await db.inspections.find(query, {"_id": 0}).to_list(1000)
    return [InspectionResponse(**i) for i in inspections]

@api_router.post("/organizations/{org_id}/inspections", response_model=InspectionResponse)
async def create_inspection(org_id: str, data: InspectionCreate, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    
    # Verify property exists
    prop = await db.properties.find_one({"id": data.property_id, "org_id": org_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    inspection_id = str(uuid.uuid4())
    inspection = {
        "id": inspection_id,
        "org_id": org_id,
        "property_id": data.property_id,
        "unit_id": data.unit_id,
        "scheduled_date": data.scheduled_date,
        "completed_date": None,
        "status": InspectionStatus.SCHEDULED,
        "notes": data.notes,
        "inspector_id": user['id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.inspections.insert_one(inspection)
    
    await create_audit_log(org_id, user['id'], user['name'], "created", "inspection", inspection_id, f"Scheduled inspection for property: {prop['name']}")
    
    # Notify all org members
    memberships = await db.memberships.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    for m in memberships:
        await create_notification(org_id, m['user_id'], "Inspection Scheduled", f"Inspection scheduled for {prop['name']} on {data.scheduled_date}")
    
    return InspectionResponse(**inspection)

@api_router.get("/organizations/{org_id}/inspections/{inspection_id}", response_model=InspectionResponse)
async def get_inspection(org_id: str, inspection_id: str, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    inspection = await db.inspections.find_one({"id": inspection_id, "org_id": org_id}, {"_id": 0})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return InspectionResponse(**inspection)

@api_router.put("/organizations/{org_id}/inspections/{inspection_id}", response_model=InspectionResponse)
async def update_inspection(org_id: str, inspection_id: str, data: InspectionUpdate, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    
    old_inspection = await db.inspections.find_one({"id": inspection_id, "org_id": org_id}, {"_id": 0})
    if not old_inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    current_status = old_inspection['status']
    
    # Check if inspection is in a terminal state (approved/failed cannot be modified)
    if current_status in [InspectionStatus.APPROVED, InspectionStatus.FAILED]:
        raise HTTPException(status_code=400, detail=f"Cannot modify inspection with status '{current_status}'")
    
    # Validate status transition if status is being changed
    if data.status and data.status != current_status:
        validate_inspection_transition(current_status, data.status)
        
        # Approve requires Admin or Manager
        if data.status == InspectionStatus.APPROVED:
            require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    update_data = {}
    if data.status:
        update_data["status"] = data.status
    if data.notes is not None:
        update_data["notes"] = data.notes
    if data.completed_date:
        update_data["completed_date"] = data.completed_date
    
    if update_data:
        await db.inspections.update_one({"id": inspection_id}, {"$set": update_data})
    
    await create_audit_log(org_id, user['id'], user['name'], "updated", "inspection", inspection_id, f"Updated inspection status to: {data.status}")
    
    # Notify on status change
    if data.status and data.status != old_inspection['status']:
        memberships = await db.memberships.find({"org_id": org_id}, {"_id": 0}).to_list(100)
        for m in memberships:
            await create_notification(org_id, m['user_id'], "Inspection Status Updated", f"Inspection status changed to {data.status}")
    
    inspection = await db.inspections.find_one({"id": inspection_id}, {"_id": 0})
    return InspectionResponse(**inspection)

# ============== CALENDAR ROUTES ==============
@api_router.get("/organizations/{org_id}/calendar", response_model=List[CalendarEvent])
async def get_calendar_events(
    org_id: str, 
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    user = Depends(get_current_user)
):
    """Get calendar events including inspections and lease end dates"""
    await get_user_membership(user['id'], org_id)
    
    events = []
    
    # Get inspections
    inspection_query = {"org_id": org_id}
    if start_date and end_date:
        inspection_query["scheduled_date"] = {"$gte": start_date, "$lte": end_date}
    
    inspections = await db.inspections.find(inspection_query, {"_id": 0}).to_list(1000)
    
    for insp in inspections:
        # Get property name
        prop = await db.properties.find_one({"id": insp['property_id']}, {"_id": 0})
        prop_name = prop['name'] if prop else "Unknown Property"
        
        # Get unit number if applicable
        unit_number = None
        if insp.get('unit_id'):
            unit = await db.units.find_one({"id": insp['unit_id']}, {"_id": 0})
            unit_number = unit['unit_number'] if unit else None
        
        events.append(CalendarEvent(
            id=insp['id'],
            title=f"Inspection: {prop_name}" + (f" - Unit {unit_number}" if unit_number else ""),
            date=insp['scheduled_date'],
            type="inspection",
            status=insp['status'],
            property_name=prop_name,
            unit_number=unit_number,
            tenant_name=None
        ))
    
    # Get lease end dates
    tenant_query = {"org_id": org_id, "lease_end": {"$ne": None}}
    if start_date and end_date:
        tenant_query["lease_end"] = {"$gte": start_date, "$lte": end_date}
    
    tenants = await db.tenants.find(tenant_query, {"_id": 0}).to_list(1000)
    
    for tenant in tenants:
        if tenant.get('lease_end'):
            # Get unit and property info
            unit_number = None
            prop_name = None
            if tenant.get('unit_id'):
                unit = await db.units.find_one({"id": tenant['unit_id']}, {"_id": 0})
                if unit:
                    unit_number = unit['unit_number']
                    prop = await db.properties.find_one({"id": unit['property_id']}, {"_id": 0})
                    prop_name = prop['name'] if prop else None
            
            events.append(CalendarEvent(
                id=f"lease-{tenant['id']}",
                title=f"Lease End: {tenant['name']}",
                date=tenant['lease_end'],
                type="lease_end",
                status=tenant['status'],
                property_name=prop_name,
                unit_number=unit_number,
                tenant_name=tenant['name']
            ))
    
    # Sort by date
    events.sort(key=lambda x: x.date)
    
    return events

# ============== DOCUMENT ROUTES ==============
@api_router.get("/organizations/{org_id}/documents", response_model=List[DocumentResponse])
async def list_documents(org_id: str, tenant_id: Optional[str] = None, inspection_id: Optional[str] = None, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    query = {"org_id": org_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if inspection_id:
        query["inspection_id"] = inspection_id
    documents = await db.documents.find(query, {"_id": 0}).to_list(1000)
    return [DocumentResponse(**d) for d in documents]

@api_router.post("/organizations/{org_id}/documents", response_model=DocumentResponse)
async def upload_document(
    org_id: str,
    file: UploadFile = File(...),
    category: DocumentCategory = Form(DocumentCategory.OTHER),
    tenant_id: Optional[str] = Form(None),
    inspection_id: Optional[str] = Form(None),
    user = Depends(get_current_user)
):
    await get_user_membership(user['id'], org_id)
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    doc_id = str(uuid.uuid4())
    filename = f"{doc_id}{file_ext}"
    
    # Save file
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    doc = {
        "id": doc_id,
        "org_id": org_id,
        "filename": filename,
        "original_filename": file.filename,
        "category": category,
        "tenant_id": tenant_id,
        "inspection_id": inspection_id,
        "uploaded_by": user['id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.documents.insert_one(doc)
    
    await create_audit_log(org_id, user['id'], user['name'], "uploaded", "document", doc_id, f"Uploaded document: {file.filename}")
    
    return DocumentResponse(**doc)

@api_router.get("/organizations/{org_id}/documents/{doc_id}/download")
async def download_document(org_id: str, doc_id: str, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    
    doc = await db.documents.find_one({"id": doc_id, "org_id": org_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = UPLOAD_DIR / doc['filename']
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=doc['original_filename'])

@api_router.delete("/organizations/{org_id}/documents/{doc_id}")
async def delete_document(org_id: str, doc_id: str, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    doc = await db.documents.find_one({"id": doc_id, "org_id": org_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    file_path = UPLOAD_DIR / doc['filename']
    if file_path.exists():
        file_path.unlink()
    
    await db.documents.delete_one({"id": doc_id})
    await create_audit_log(org_id, user['id'], user['name'], "deleted", "document", doc_id, f"Deleted document: {doc['original_filename']}")
    
    return {"message": "Document deleted"}

# ============== NOTIFICATION ROUTES ==============
@api_router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(user = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [NotificationResponse(**n) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user['id']},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user['id']}, {"$set": {"is_read": True}})
    return {"message": "All notifications marked as read"}

# ============== AUDIT LOG ROUTES ==============
@api_router.get("/organizations/{org_id}/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(org_id: str, user = Depends(get_current_user)):
    membership = await get_user_membership(user['id'], org_id)
    if membership['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logs = await db.audit_logs.find({"org_id": org_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Ensure backwards compatibility for logs without ip/user_agent
    result = []
    for log in logs:
        if 'ip_address' not in log:
            log['ip_address'] = None
        if 'user_agent' not in log:
            log['user_agent'] = None
        result.append(AuditLogResponse(**log))
    return result

# ============== DASHBOARD ROUTES ==============
@api_router.get("/organizations/{org_id}/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(org_id: str, user = Depends(get_current_user)):
    await get_user_membership(user['id'], org_id)
    
    total_properties = await db.properties.count_documents({"org_id": org_id})
    total_units = await db.units.count_documents({"org_id": org_id})
    total_tenants = await db.tenants.count_documents({"org_id": org_id})
    active_tenants = await db.tenants.count_documents({"org_id": org_id, "status": TenantStatus.ACTIVE})
    pending_inspections = await db.inspections.count_documents({"org_id": org_id, "status": InspectionStatus.SCHEDULED})
    unread_notifications = await db.notifications.count_documents({"user_id": user['id'], "is_read": False})
    
    return DashboardStats(
        total_properties=total_properties,
        total_units=total_units,
        total_tenants=total_tenants,
        active_tenants=active_tenants,
        pending_inspections=pending_inspections,
        unread_notifications=unread_notifications
    )

# ============== HEALTH CHECK ==============
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============== MEMBER DIRECTORY ROUTES ==============
@api_router.get("/organizations/{org_id}/members", response_model=List[MemberResponse])
async def list_members(org_id: str, user = Depends(get_current_user)):
    """Read-only member directory for organization"""
    await get_user_membership(user['id'], org_id)
    
    memberships = await db.memberships.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    members = []
    
    for m in memberships:
        member_user = await db.users.find_one({"id": m['user_id']}, {"_id": 0})
        if member_user:
            members.append(MemberResponse(
                id=member_user['id'],
                name=member_user['name'],
                email=member_user['email'],
                role=m['role'],
                joined_at=m['created_at']
            ))
    
    return members

# ============== FEATURE FLAGS ROUTES ==============
@api_router.get("/feature-flags", response_model=FeatureFlagsResponse)
async def get_feature_flags(user = Depends(get_current_user)):
    """Get current feature flag states"""
    return FeatureFlagsResponse(**FEATURE_FLAGS)

# ============== TENANT PORTAL ROUTES ==============

# Tenant Portal Auth
@api_router.post("/tenant-portal/register")
async def tenant_portal_register(data: TenantPortalRegister):
    """Register a new tenant portal user"""
    existing = await db.tenant_portal_users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant_id = str(uuid.uuid4())
    
    # Initialize document checklist
    checklist = []
    for item in DEFAULT_DOCUMENT_CHECKLIST:
        checklist.append({
            "id": str(uuid.uuid4()),
            "name": item["name"],
            "description": item["description"],
            "required": item["required"],
            "source_type": item.get("source_type", "tenant_provided"),
            "template": item.get("template"),
            "help_text": item.get("help_text"),
            "status": DocumentChecklistStatus.NOT_STARTED.value,
            "document_id": None,
            "uploaded_at": None,
            "verified_at": None,
            "notes": None,
            "requested_at": None,
            "request_message": None
        })
    
    tenant = {
        "id": tenant_id,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "name": data.name,
        "phone": data.phone,
        "address": None,
        "housing_program": None,
        "voucher_number": None,
        "household_size": 1,
        "household_members": [],
        "annual_income": None,
        "income_sources": None,
        "emergency_contact_name": None,
        "emergency_contact_phone": None,
        "application_stage": ApplicationStage.NOT_STARTED.value,
        "document_checklist": checklist,
        "connected_org_id": None,
        "connected_property_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenant_portal_users.insert_one(tenant)
    
    token = create_tenant_token(tenant_id, data.email)
    
    return {
        "token": token,
        "tenant": TenantPortalProfileResponse(
            id=tenant_id,
            email=data.email,
            name=data.name,
            phone=data.phone,
            address=None,
            housing_program=None,
            voucher_number=None,
            household_size=1,
            household_members=[],
            annual_income=None,
            income_sources=None,
            emergency_contact_name=None,
            emergency_contact_phone=None,
            application_stage=ApplicationStage.NOT_STARTED.value,
            created_at=tenant["created_at"]
        )
    }

@api_router.post("/tenant-portal/login")
async def tenant_portal_login(data: TenantPortalLogin):
    """Login to tenant portal"""
    tenant = await db.tenant_portal_users.find_one({"email": data.email}, {"_id": 0})
    if not tenant or not verify_password(data.password, tenant['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_tenant_token(tenant['id'], tenant['email'])
    
    return {
        "token": token,
        "tenant": TenantPortalProfileResponse(
            id=tenant['id'],
            email=tenant['email'],
            name=tenant['name'],
            phone=tenant.get('phone'),
            address=tenant.get('address'),
            housing_program=tenant.get('housing_program'),
            voucher_number=tenant.get('voucher_number'),
            household_size=tenant.get('household_size', 1),
            household_members=tenant.get('household_members', []),
            annual_income=tenant.get('annual_income'),
            income_sources=tenant.get('income_sources'),
            emergency_contact_name=tenant.get('emergency_contact_name'),
            emergency_contact_phone=tenant.get('emergency_contact_phone'),
            application_stage=tenant.get('application_stage', ApplicationStage.NOT_STARTED.value),
            created_at=tenant['created_at']
        )
    }

@api_router.get("/tenant-portal/me")
async def tenant_portal_me(tenant = Depends(get_current_tenant)):
    """Get current tenant portal user profile"""
    return TenantPortalProfileResponse(
        id=tenant['id'],
        email=tenant['email'],
        name=tenant['name'],
        phone=tenant.get('phone'),
        address=tenant.get('address'),
        housing_program=tenant.get('housing_program'),
        voucher_number=tenant.get('voucher_number'),
        household_size=tenant.get('household_size', 1),
        household_members=tenant.get('household_members', []),
        annual_income=tenant.get('annual_income'),
        income_sources=tenant.get('income_sources'),
        emergency_contact_name=tenant.get('emergency_contact_name'),
        emergency_contact_phone=tenant.get('emergency_contact_phone'),
        application_stage=tenant.get('application_stage', ApplicationStage.NOT_STARTED.value),
        created_at=tenant['created_at']
    )

@api_router.put("/tenant-portal/profile")
async def update_tenant_profile(data: TenantPortalProfileUpdate, tenant = Depends(get_current_tenant)):
    """Update tenant portal profile"""
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    if 'household_members' in update_data:
        update_data['household_members'] = [m.dict() if hasattr(m, 'dict') else m for m in update_data['household_members']]
    
    if update_data:
        await db.tenant_portal_users.update_one(
            {"id": tenant['id']},
            {"$set": update_data}
        )
    
    updated = await db.tenant_portal_users.find_one({"id": tenant['id']}, {"_id": 0})
    return TenantPortalProfileResponse(
        id=updated['id'],
        email=updated['email'],
        name=updated['name'],
        phone=updated.get('phone'),
        address=updated.get('address'),
        housing_program=updated.get('housing_program'),
        voucher_number=updated.get('voucher_number'),
        household_size=updated.get('household_size', 1),
        household_members=updated.get('household_members', []),
        annual_income=updated.get('annual_income'),
        income_sources=updated.get('income_sources'),
        emergency_contact_name=updated.get('emergency_contact_name'),
        emergency_contact_phone=updated.get('emergency_contact_phone'),
        application_stage=updated.get('application_stage', ApplicationStage.NOT_STARTED.value),
        created_at=updated['created_at']
    )

# Document Checklist
@api_router.get("/tenant-portal/checklist")
async def get_document_checklist(tenant = Depends(get_current_tenant)):
    """Get tenant's document checklist with backward compatibility for new fields"""
    checklist = tenant.get('document_checklist', [])
    
    # Add missing fields for backward compatibility
    default_items_map = {item['name']: item for item in DEFAULT_DOCUMENT_CHECKLIST}
    
    for item in checklist:
        default_item = default_items_map.get(item['name'], {})
        # Update required field to match current defaults (privacy fix)
        if item['name'] in ['Social Security Cards', 'Birth Certificates', 'Bank Statements']:
            item['required'] = False
        # Add missing fields
        if 'source_type' not in item:
            item['source_type'] = default_item.get('source_type', 'tenant_provided')
            item['template'] = default_item.get('template')
            item['requested_at'] = None
            item['request_message'] = None
        # Always update help_text to latest
        item['help_text'] = default_item.get('help_text')
    
    return checklist

@api_router.post("/tenant-portal/checklist/{item_id}/upload")
async def upload_checklist_document(item_id: str, file: UploadFile = File(...), tenant = Depends(get_current_tenant)):
    """Upload a document for checklist item"""
    checklist = tenant.get('document_checklist', [])
    item_index = next((i for i, item in enumerate(checklist) if item['id'] == item_id), None)
    
    if item_index is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Save file
    doc_id = str(uuid.uuid4())
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    filename = f"tenant_{tenant['id']}_{doc_id}.{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Store document reference
    doc = {
        "id": doc_id,
        "tenant_portal_id": tenant['id'],
        "checklist_item_id": item_id,
        "filename": filename,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenant_portal_documents.insert_one(doc)
    
    # Update checklist item
    checklist[item_index]['status'] = DocumentChecklistStatus.UPLOADED.value
    checklist[item_index]['document_id'] = doc_id
    checklist[item_index]['uploaded_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.tenant_portal_users.update_one(
        {"id": tenant['id']},
        {"$set": {"document_checklist": checklist}}
    )
    
    return checklist[item_index]

@api_router.get("/tenant-portal/documents/{doc_id}/download")
async def download_tenant_document(doc_id: str, tenant = Depends(get_current_tenant)):
    """Download a tenant's document"""
    doc = await db.tenant_portal_documents.find_one({"id": doc_id, "tenant_portal_id": tenant['id']}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = UPLOAD_DIR / doc['filename']
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=doc['original_filename'])

# Document Templates
TEMPLATE_DIR = ROOT_DIR / "templates"

@api_router.get("/tenant-portal/templates/{template_name}")
async def download_template(template_name: str):
    """Download authorization form templates"""
    valid_templates = {
        "background_check_authorization": "Background_Check_Authorization.html",
        "credit_check_authorization": "Credit_Check_Authorization.html"
    }
    
    if template_name not in valid_templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    file_path = TEMPLATE_DIR / f"{template_name}.html"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Template file not found")
    
    return FileResponse(
        file_path, 
        filename=valid_templates[template_name],
        media_type="text/html"
    )

@api_router.get("/tenant-portal/templates")
async def list_templates():
    """List available document templates"""
    return {
        "templates": [
            {
                "id": "background_check_authorization",
                "name": "Background Check Authorization",
                "description": "Authorization form for criminal background check",
                "download_url": "/api/tenant-portal/templates/background_check_authorization"
            },
            {
                "id": "credit_check_authorization", 
                "name": "Credit Check Authorization",
                "description": "Authorization form for credit report check",
                "download_url": "/api/tenant-portal/templates/credit_check_authorization"
            }
        ]
    }

# Document Request from Landlord
class DocumentRequestCreate(BaseModel):
    message: Optional[str] = None

@api_router.post("/tenant-portal/checklist/{item_id}/request")
async def request_document_from_landlord(item_id: str, data: DocumentRequestCreate, tenant = Depends(get_current_tenant)):
    """Request a document from the landlord/property manager"""
    checklist = tenant.get('document_checklist', [])
    
    item_index = None
    item = None
    for i, doc in enumerate(checklist):
        if doc['id'] == item_id:
            item_index = i
            item = doc
            break
    
    if item is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Update the checklist item with request info
    checklist[item_index]['requested_at'] = datetime.now(timezone.utc).isoformat()
    checklist[item_index]['request_message'] = data.message
    checklist[item_index]['status'] = 'requested'
    
    await db.tenant_portal_users.update_one(
        {"id": tenant['id']},
        {"$set": {"document_checklist": checklist}}
    )
    
    # Create a notification/message to landlord if connected to an org
    if tenant.get('connected_org_id'):
        # Create a document request record
        request_record = {
            "id": str(uuid.uuid4()),
            "tenant_portal_id": tenant['id'],
            "tenant_name": tenant['name'],
            "org_id": tenant['connected_org_id'],
            "document_name": item['name'],
            "message": data.message,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.document_requests.insert_one(request_record)
    
    return {
        "message": f"Request sent for {item['name']}",
        "requested_at": checklist[item_index]['requested_at']
    }

# Connect Tenant to Organization
class ConnectOrgRequest(BaseModel):
    org_code: str

@api_router.post("/tenant-portal/connect-organization")
async def connect_to_organization(data: ConnectOrgRequest, tenant = Depends(get_current_tenant)):
    """Connect tenant to a property management organization via invite code"""
    # Look up organization by invite code
    org = await db.organizations.find_one({"tenant_invite_code": data.org_code}, {"_id": 0})
    
    if not org:
        raise HTTPException(status_code=404, detail="Invalid organization code. Please check with your property manager.")
    
    # Update tenant with connected org
    await db.tenant_portal_users.update_one(
        {"id": tenant['id']},
        {"$set": {
            "connected_org_id": org['id'],
            "connected_org_name": org['name'],
            "connected_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": f"Successfully connected to {org['name']}",
        "organization": {
            "id": org['id'],
            "name": org['name']
        }
    }

@api_router.delete("/tenant-portal/disconnect-organization")
async def disconnect_from_organization(tenant = Depends(get_current_tenant)):
    """Disconnect tenant from their organization"""
    await db.tenant_portal_users.update_one(
        {"id": tenant['id']},
        {"$set": {
            "connected_org_id": None,
            "connected_org_name": None,
            "connected_at": None
        }}
    )
    return {"message": "Disconnected from organization"}

# Generate tenant invite code for organization
@api_router.post("/organizations/{org_id}/tenant-invite-code")
async def generate_tenant_invite_code(org_id: str, user = Depends(get_current_user)):
    """Generate a tenant invite code for the organization"""
    membership = await db.memberships.find_one({
        "org_id": org_id,
        "user_id": user['id'],
        "role": {"$in": ["admin", "manager"]}
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Admin or manager access required")
    
    # Generate a simple 6-character code
    invite_code = ''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', k=6))
    
    await db.organizations.update_one(
        {"id": org_id},
        {"$set": {"tenant_invite_code": invite_code}}
    )
    
    return {"invite_code": invite_code}

@api_router.get("/organizations/{org_id}/tenant-invite-code")
async def get_tenant_invite_code(org_id: str, user = Depends(get_current_user)):
    """Get the tenant invite code for the organization"""
    membership = await db.memberships.find_one({
        "org_id": org_id,
        "user_id": user['id'],
        "role": {"$in": ["admin", "manager"]}
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Admin or manager access required")
    
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0, "tenant_invite_code": 1})
    return {"invite_code": org.get('tenant_invite_code')}

# View Document Requests (for landlords/managers)
@api_router.get("/organizations/{org_id}/document-requests")
async def get_document_requests(org_id: str, user = Depends(get_current_user)):
    """Get all document requests from tenants for this organization"""
    membership = await db.memberships.find_one({
        "org_id": org_id,
        "user_id": user['id']
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    requests = await db.document_requests.find(
        {"org_id": org_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return requests

@api_router.put("/organizations/{org_id}/document-requests/{request_id}")
async def update_document_request(org_id: str, request_id: str, status: str, user = Depends(get_current_user)):
    """Update a document request status (fulfilled, rejected)"""
    membership = await db.memberships.find_one({
        "org_id": org_id,
        "user_id": user['id']
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.document_requests.update_one(
        {"id": request_id, "org_id": org_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Request updated"}

# Application Status
@api_router.get("/tenant-portal/application-status")
async def get_application_status(tenant = Depends(get_current_tenant)):
    """Get tenant's application status"""
    current_stage = tenant.get('application_stage', ApplicationStage.NOT_STARTED.value)
    
    stages = []
    stage_order = [s['stage'] for s in APPLICATION_STAGES]
    current_index = stage_order.index(current_stage) if current_stage in stage_order else 0
    
    for i, stage in enumerate(APPLICATION_STAGES):
        stages.append({
            **stage,
            "completed": i < current_index,
            "current": i == current_index,
            "upcoming": i > current_index
        })
    
    return {
        "stage": current_stage,
        "stages": stages,
        "updated_at": tenant.get('stage_updated_at', tenant['created_at'])
    }

@api_router.put("/tenant-portal/application-status")
async def update_application_status(stage: ApplicationStage, tenant = Depends(get_current_tenant)):
    """Update application stage (self-update for certain stages)"""
    allowed_self_updates = [ApplicationStage.APPLICATION_SUBMITTED]
    
    if stage not in allowed_self_updates and stage != ApplicationStage.NOT_STARTED:
        raise HTTPException(status_code=403, detail="Cannot self-update to this stage")
    
    await db.tenant_portal_users.update_one(
        {"id": tenant['id']},
        {"$set": {
            "application_stage": stage.value,
            "stage_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"stage": stage.value, "message": "Application status updated"}

# Appointments
@api_router.get("/tenant-portal/appointments")
async def get_tenant_appointments(tenant = Depends(get_current_tenant)):
    """Get tenant's appointments"""
    appointments = await db.tenant_appointments.find(
        {"tenant_portal_id": tenant['id']},
        {"_id": 0}
    ).sort("date", 1).to_list(100)
    return appointments

@api_router.post("/tenant-portal/appointments")
async def create_tenant_appointment(data: AppointmentCreate, tenant = Depends(get_current_tenant)):
    """Create a new appointment"""
    appointment = {
        "id": str(uuid.uuid4()),
        "tenant_portal_id": tenant['id'],
        "title": data.title,
        "description": data.description,
        "date": data.date,
        "time": data.time,
        "location": data.location,
        "type": data.type,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenant_appointments.insert_one(appointment)
    # Remove MongoDB _id to avoid serialization issues
    appointment.pop('_id', None)
    return appointment

# Messaging System
@api_router.get("/tenant-portal/conversations")
async def get_tenant_conversations(tenant = Depends(get_current_tenant)):
    """Get tenant's conversations"""
    conversations = await db.tenant_conversations.find(
        {"tenant_portal_id": tenant['id']},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(50)
    return conversations

@api_router.post("/tenant-portal/conversations/{org_id}")
async def create_or_get_conversation(org_id: str, tenant = Depends(get_current_tenant)):
    """Create or get existing conversation with an organization"""
    existing = await db.tenant_conversations.find_one({
        "tenant_portal_id": tenant['id'],
        "org_id": org_id
    }, {"_id": 0})
    
    if existing:
        return existing
    
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    owner = await db.users.find_one({"id": org['owner_id']}, {"_id": 0})
    
    conversation = {
        "id": str(uuid.uuid4()),
        "tenant_portal_id": tenant['id'],
        "org_id": org_id,
        "property_id": None,
        "tenant_name": tenant['name'],
        "landlord_name": owner['name'] if owner else "Property Manager",
        "last_message": None,
        "last_message_at": None,
        "unread_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenant_conversations.insert_one(conversation)
    # Remove MongoDB _id to avoid serialization issues
    conversation.pop('_id', None)
    return conversation

@api_router.get("/tenant-portal/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, tenant = Depends(get_current_tenant)):
    """Get messages in a conversation"""
    conv = await db.tenant_conversations.find_one({
        "id": conversation_id,
        "tenant_portal_id": tenant['id']
    }, {"_id": 0})
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.tenant_messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    
    # Mark messages as read
    await db.tenant_messages.update_many(
        {"conversation_id": conversation_id, "sender_type": "landlord", "is_read": False},
        {"$set": {"is_read": True}}
    )
    await db.tenant_conversations.update_one(
        {"id": conversation_id},
        {"$set": {"unread_count": 0}}
    )
    
    return messages

@api_router.post("/tenant-portal/conversations/{conversation_id}/messages")
async def send_tenant_message(conversation_id: str, data: MessageCreate, tenant = Depends(get_current_tenant)):
    """Send a message in a conversation"""
    conv = await db.tenant_conversations.find_one({
        "id": conversation_id,
        "tenant_portal_id": tenant['id']
    }, {"_id": 0})
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    message = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": tenant['id'],
        "sender_name": tenant['name'],
        "sender_type": "tenant",
        "content": data.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenant_messages.insert_one(message)
    # Remove MongoDB _id to avoid serialization issues
    message.pop('_id', None)
    
    # Update conversation
    await db.tenant_conversations.update_one(
        {"id": conversation_id},
        {"$set": {
            "last_message": data.content[:100],
            "last_message_at": message['created_at']
        }}
    )
    
    return MessageResponse(**message)

# Educational Resources
@api_router.get("/tenant-portal/resources")
async def get_housing_resources():
    """Get educational resources about housing programs"""
    return {
        "programs": [
            {
                "id": "section_8",
                "name": "Section 8 Housing Choice Voucher Program",
                "description": "The Housing Choice Voucher Program is the federal government's major program for assisting very low-income families, the elderly, and the disabled to afford decent, safe, and sanitary housing in the private market.",
                "eligibility": "Generally, the family's income may not exceed 50% of the median income for the county or metropolitan area in which the family chooses to live.",
                "process": [
                    "Apply to your local Public Housing Agency (PHA)",
                    "Get placed on the waiting list",
                    "Receive your voucher when selected",
                    "Find a suitable rental unit",
                    "PHA inspects the unit",
                    "Sign lease and move in"
                ],
                "timeline": "Wait times vary from months to years depending on local demand",
                "link": "https://www.hud.gov/topics/housing_choice_voucher_program_section_8"
            },
            {
                "id": "public_housing",
                "name": "Public Housing",
                "description": "Public housing provides decent and safe rental housing for eligible low-income families, the elderly, and persons with disabilities.",
                "eligibility": "Eligibility is based on annual gross income, whether you qualify as elderly, disabled, or as a family, and U.S. citizenship or eligible immigration status.",
                "process": [
                    "Contact your local Public Housing Agency",
                    "Submit an application",
                    "Provide required documentation",
                    "Wait for available unit",
                    "Accept unit assignment"
                ],
                "timeline": "Wait times vary by location and unit availability",
                "link": "https://www.hud.gov/topics/rental_assistance/phprog"
            },
            {
                "id": "lihtc",
                "name": "Low-Income Housing Tax Credit (LIHTC)",
                "description": "LIHTC properties are privately owned apartments that offer reduced rents to qualifying low-income residents.",
                "eligibility": "Income limits typically range from 50-60% of Area Median Income (AMI)",
                "process": [
                    "Find LIHTC properties in your area",
                    "Contact property management",
                    "Submit application and income documentation",
                    "Complete income certification",
                    "Sign lease if approved"
                ],
                "timeline": "Application processing typically takes 1-4 weeks",
                "link": "https://www.huduser.gov/portal/datasets/lihtc.html"
            },
            {
                "id": "hud_assisted",
                "name": "HUD-Assisted Housing",
                "description": "HUD provides funding to apartment owners who offer reduced rents to low-income tenants.",
                "eligibility": "Based on income limits set by HUD for your area",
                "process": [
                    "Search for HUD-assisted properties",
                    "Apply directly to the property",
                    "Provide income and household documentation",
                    "Complete HUD income certification"
                ],
                "timeline": "Varies by property availability",
                "link": "https://www.hud.gov/topics/rental_assistance"
            },
            {
                "id": "vash",
                "name": "HUD-VASH (Veterans Affairs Supportive Housing)",
                "description": "HUD-VASH combines Housing Choice Voucher rental assistance with VA case management and clinical services for homeless veterans.",
                "eligibility": "Must be a veteran, homeless, and in need of case management services",
                "process": [
                    "Contact your local VA Medical Center",
                    "Complete VA assessment",
                    "Receive voucher referral",
                    "Find housing with VA support"
                ],
                "timeline": "Varies based on VA assessment and voucher availability",
                "link": "https://www.va.gov/homeless/hud-vash.asp"
            }
        ],
        "tenant_rights": [
            {
                "title": "Right to Fair Housing",
                "description": "You cannot be discriminated against based on race, color, national origin, religion, sex, familial status, or disability."
            },
            {
                "title": "Right to Habitable Housing",
                "description": "Your landlord must maintain the rental property in a safe and habitable condition."
            },
            {
                "title": "Right to Privacy",
                "description": "Your landlord must provide reasonable notice (usually 24-48 hours) before entering your unit, except in emergencies."
            },
            {
                "title": "Right to Security Deposit Return",
                "description": "You have the right to receive your security deposit back, minus legitimate deductions, within the timeframe specified by state law."
            },
            {
                "title": "Right to Proper Eviction Process",
                "description": "You cannot be evicted without proper legal notice and court proceedings."
            },
            {
                "title": "Right to Organize",
                "description": "You have the right to form or join a tenants' organization without retaliation."
            }
        ],
        "faqs": [
            {
                "question": "How long does the Section 8 application process take?",
                "answer": "The waiting list can range from a few months to several years depending on your local Public Housing Agency's demand. Once you receive a voucher, you typically have 60-120 days to find housing."
            },
            {
                "question": "What documents do I need for my housing application?",
                "answer": "Generally, you'll need: government-issued ID for all adults, Social Security cards for all household members, birth certificates, proof of income (pay stubs, benefit letters), bank statements, and your housing voucher if applicable."
            },
            {
                "question": "Can a landlord refuse to accept my Section 8 voucher?",
                "answer": "It depends on your state and local laws. Some jurisdictions prohibit discrimination based on source of income, meaning landlords must accept vouchers. Check your local fair housing laws."
            },
            {
                "question": "What happens during a housing inspection?",
                "answer": "An inspector will check that the unit meets Housing Quality Standards (HQS), including working utilities, safety features, adequate space, and general habitability. Any issues must be fixed before you can move in."
            },
            {
                "question": "How much rent will I pay with Section 8?",
                "answer": "Generally, you'll pay about 30% of your adjusted monthly income toward rent. The voucher covers the difference between your payment and the approved rent amount."
            },
            {
                "question": "Can I be evicted from Section 8 housing?",
                "answer": "Yes, you can be evicted for lease violations, non-payment of your portion of rent, or program violations. However, proper legal eviction procedures must be followed."
            }
        ]
    }

# Landlord access to tenant portal data (for property managers)
@api_router.get("/organizations/{org_id}/tenant-portal-users")
async def get_tenant_portal_users_for_org(org_id: str, user = Depends(get_current_user)):
    """Get all tenant portal users connected to this organization"""
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    # Get tenants who have conversations with this org
    conversations = await db.tenant_conversations.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    tenant_ids = [c['tenant_portal_id'] for c in conversations]
    
    tenants = []
    for tid in tenant_ids:
        tenant = await db.tenant_portal_users.find_one({"id": tid}, {"_id": 0, "hashed_password": 0})
        if tenant:
            tenants.append(tenant)
    
    return tenants

@api_router.get("/organizations/{org_id}/tenant-portal-users/{tenant_id}")
async def get_tenant_portal_user_detail(org_id: str, tenant_id: str, user = Depends(get_current_user)):
    """Get detailed tenant portal user info (for landlords)"""
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    tenant = await db.tenant_portal_users.find_one({"id": tenant_id}, {"_id": 0, "hashed_password": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return tenant

@api_router.put("/organizations/{org_id}/tenant-portal-users/{tenant_id}/stage")
async def update_tenant_stage_by_landlord(org_id: str, tenant_id: str, stage: ApplicationStage, user = Depends(get_current_user)):
    """Update tenant's application stage (landlord action)"""
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    result = await db.tenant_portal_users.update_one(
        {"id": tenant_id},
        {"$set": {
            "application_stage": stage.value,
            "stage_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Stage updated", "stage": stage.value}

@api_router.put("/organizations/{org_id}/tenant-portal-users/{tenant_id}/checklist/{item_id}/verify")
async def verify_checklist_item(org_id: str, tenant_id: str, item_id: str, verified: bool, user = Depends(get_current_user)):
    """Verify or reject a tenant's checklist document (landlord action)"""
    membership = await get_user_membership(user['id'], org_id)
    require_role(membership, [UserRole.ADMIN, UserRole.MANAGER])
    
    tenant = await db.tenant_portal_users.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    checklist = tenant.get('document_checklist', [])
    item_index = next((i for i, item in enumerate(checklist) if item['id'] == item_id), None)
    
    if item_index is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    checklist[item_index]['status'] = DocumentChecklistStatus.VERIFIED.value if verified else DocumentChecklistStatus.REJECTED.value
    checklist[item_index]['verified_at'] = datetime.now(timezone.utc).isoformat() if verified else None
    
    await db.tenant_portal_users.update_one(
        {"id": tenant_id},
        {"$set": {"document_checklist": checklist}}
    )
    
    return checklist[item_index]

# Landlord messaging
@api_router.get("/organizations/{org_id}/conversations")
async def get_org_conversations(org_id: str, user = Depends(get_current_user)):
    """Get all conversations for an organization"""
    membership = await get_user_membership(user['id'], org_id)
    
    conversations = await db.tenant_conversations.find(
        {"org_id": org_id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    
    return conversations

@api_router.get("/organizations/{org_id}/conversations/{conversation_id}/messages")
async def get_org_conversation_messages(org_id: str, conversation_id: str, user = Depends(get_current_user)):
    """Get messages in a conversation (landlord view)"""
    await get_user_membership(user['id'], org_id)
    
    conv = await db.tenant_conversations.find_one({
        "id": conversation_id,
        "org_id": org_id
    }, {"_id": 0})
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.tenant_messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    
    # Mark tenant messages as read
    await db.tenant_messages.update_many(
        {"conversation_id": conversation_id, "sender_type": "tenant", "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return messages

@api_router.post("/organizations/{org_id}/conversations/{conversation_id}/messages")
async def send_landlord_message(org_id: str, conversation_id: str, data: MessageCreate, user = Depends(get_current_user)):
    """Send a message as landlord"""
    await get_user_membership(user['id'], org_id)
    
    conv = await db.tenant_conversations.find_one({
        "id": conversation_id,
        "org_id": org_id
    }, {"_id": 0})
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    message = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": user['id'],
        "sender_name": user['name'],
        "sender_type": "landlord",
        "content": data.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenant_messages.insert_one(message)
    # Remove MongoDB _id to avoid serialization issues
    message.pop('_id', None)
    
    # Update conversation with unread count for tenant
    await db.tenant_conversations.update_one(
        {"id": conversation_id},
        {
            "$set": {
                "last_message": data.content[:100],
                "last_message_at": message['created_at']
            },
            "$inc": {"unread_count": 1}
        }
    )
    
    return MessageResponse(**message)

# Include the router in the main app
app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
