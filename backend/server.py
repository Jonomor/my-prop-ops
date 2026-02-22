from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status, Query, Request, BackgroundTasks, Header
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
import stripe

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
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Subscription Plan Pricing (amounts in USD)
SUBSCRIPTION_PLANS = {
    "standard_monthly": {"amount": 49.00, "plan": "standard", "period": "monthly"},
    "standard_annual": {"amount": 468.00, "plan": "standard", "period": "annual"},  # $39/mo billed annually
    "pro_monthly": {"amount": 149.00, "plan": "pro", "period": "monthly"},
    "pro_annual": {"amount": 1428.00, "plan": "pro", "period": "annual"},  # $119/mo billed annually
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


# ============== FEATURE FLAGS ==============
# All advanced features default to OFF for monetization readiness
FEATURE_FLAGS = {
    "email_invites": False,      # Email delivery for invitations
    "billing": True,             # Stripe/payment integration - NOW ENABLED
    "maintenance": True,         # Maintenance request workflows - NOW ENABLED
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
        "contractor_portal": False,
        "api_access": False,
        "analytics": False,
        "custom_branding": False,
        "two_factor_auth": False,
        "exportable_reports": False,
        "tenant_screening": False,
    },
    "standard": {
        "max_properties": 20,
        "max_units": 40,
        "max_team_members": 5,
        "document_storage_mb": 10240,  # 10GB
        "tenant_portal": True,
        "contractor_portal": True,
        "api_access": False,
        "analytics": False,
        "custom_branding": False,
        "two_factor_auth": False,
        "exportable_reports": True,
        "tenant_screening": True,  # pay per use
    },
    "pro": {
        "max_properties": None,  # Unlimited
        "max_units": None,       # Unlimited
        "max_team_members": None,
        "document_storage_mb": 102400,  # 100GB
        "tenant_portal": True,
        "contractor_portal": True,
        "api_access": True,
        "analytics": True,
        "custom_branding": True,
        "two_factor_auth": True,
        "exportable_reports": True,
        "tenant_screening": True,
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

# ============== MAINTENANCE REQUEST MODELS ==============
class MaintenancePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EMERGENCY = "emergency"

class MaintenanceStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING_PARTS = "pending_parts"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MaintenanceCategory(str, Enum):
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    HVAC = "hvac"
    APPLIANCES = "appliances"
    STRUCTURAL = "structural"
    PEST_CONTROL = "pest_control"
    LANDSCAPING = "landscaping"
    OTHER = "other"

class MaintenanceRequestCreate(BaseModel):
    property_id: str
    unit_id: Optional[str] = None
    tenant_id: Optional[str] = None
    category: MaintenanceCategory
    priority: MaintenancePriority = MaintenancePriority.MEDIUM
    title: str
    description: str
    preferred_access_time: Optional[str] = None
    permission_to_enter: bool = False

class MaintenanceRequestUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    priority: Optional[MaintenancePriority] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    scheduled_date: Optional[str] = None
    completion_notes: Optional[str] = None

class MaintenanceRequestResponse(BaseModel):
    id: str
    org_id: str
    property_id: str
    property_name: Optional[str] = None
    unit_id: Optional[str]
    unit_number: Optional[str] = None
    tenant_id: Optional[str]
    tenant_name: Optional[str] = None
    category: str
    priority: str
    status: str
    title: str
    description: str
    preferred_access_time: Optional[str]
    permission_to_enter: bool
    assigned_to: Optional[str]
    assigned_to_name: Optional[str] = None
    contractor_id: Optional[str] = None
    contractor_name: Optional[str] = None
    photos: Optional[List[str]] = []
    notes: Optional[str]
    scheduled_date: Optional[str]
    completion_notes: Optional[str]
    created_by: str
    created_at: str
    updated_at: Optional[str]

# ============== CONTRACTOR MODELS ==============

class ContractorSpecialty(str, Enum):
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    HVAC = "hvac"
    APPLIANCES = "appliances"
    GENERAL = "general"
    CARPENTRY = "carpentry"
    PAINTING = "painting"
    ROOFING = "roofing"
    LANDSCAPING = "landscaping"
    CLEANING = "cleaning"

class ContractorStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

class ContractorRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    company_name: Optional[str] = None
    phone: str
    specialties: List[ContractorSpecialty]
    service_area: Optional[str] = None
    hourly_rate: Optional[float] = None
    license_number: Optional[str] = None

class ContractorLogin(BaseModel):
    email: EmailStr
    password: str

class ContractorResponse(BaseModel):
    id: str
    email: str
    name: str
    company_name: Optional[str]
    phone: str
    specialties: List[str]
    service_area: Optional[str]
    hourly_rate: Optional[float]
    license_number: Optional[str]
    status: str
    rating: Optional[float] = None
    jobs_completed: int = 0
    created_at: str

class ContractorProfileUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    specialties: Optional[List[ContractorSpecialty]] = None
    service_area: Optional[str] = None
    hourly_rate: Optional[float] = None
    status: Optional[ContractorStatus] = None

class ContractorJobResponse(BaseModel):
    id: str
    maintenance_request_id: str
    org_id: str
    property_name: str
    property_address: Optional[str] = None
    unit_number: Optional[str] = None
    category: str
    priority: str
    status: str
    title: str
    description: str
    photos: List[str] = []
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    scheduled_date: Optional[str] = None
    assigned_at: str
    completed_at: Optional[str] = None
    notes: Optional[str] = None

class AssignContractorRequest(BaseModel):
    contractor_id: str
    scheduled_date: Optional[str] = None
    notes: Optional[str] = None

class ContractorJobUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    notes: Optional[str] = None
    completion_notes: Optional[str] = None

# Tenant Portal Maintenance Request (with photos)
class TenantMaintenanceRequestCreate(BaseModel):
    category: MaintenanceCategory
    priority: MaintenancePriority = MaintenancePriority.MEDIUM
    title: str
    description: str
    preferred_access_time: Optional[str] = None
    permission_to_enter: bool = False

# Tenant Screening Models (inspired by competitors like Yardi ScreeningWorks)
class ScreeningRequestCreate(BaseModel):
    tenant_id: str
    screening_type: str = "standard"  # basic, standard, comprehensive

class ScreeningResponse(BaseModel):
    id: str
    org_id: str
    tenant_id: str
    tenant_name: str
    screening_type: str
    status: str  # pending, in_progress, completed, failed
    credit_score: Optional[int] = None
    background_clear: Optional[bool] = None
    eviction_history: Optional[bool] = None
    income_verified: Optional[bool] = None
    recommendation: Optional[str] = None  # approved, conditional, denied
    created_at: str
    completed_at: Optional[str] = None

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
async def register(data: UserCreate, background_tasks: BackgroundTasks):
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
    
    # Send welcome email in background
    background_tasks.add_task(send_welcome_email, data.email, data.name)
    
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

# ============== MAINTENANCE REQUEST ENDPOINTS ==============

@api_router.post("/maintenance-requests", response_model=MaintenanceRequestResponse)
async def create_maintenance_request(
    data: MaintenanceRequestCreate,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new maintenance request"""
    user = await get_current_user(credentials)
    membership = await db.memberships.find_one({"user_id": user["id"]}, {"_id": 0, "org_id": 1})
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found")
    
    org_id = membership["org_id"]
    
    # Verify property belongs to org
    property_doc = await db.properties.find_one(
        {"id": data.property_id, "org_id": org_id},
        {"_id": 0, "name": 1}
    )
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get unit and tenant info if provided
    unit_number = None
    tenant_name = None
    tenant_email = None
    
    if data.unit_id:
        unit = await db.units.find_one({"id": data.unit_id, "org_id": org_id}, {"_id": 0, "unit_number": 1})
        if unit:
            unit_number = unit.get("unit_number")
    
    if data.tenant_id:
        tenant = await db.tenants.find_one({"id": data.tenant_id, "org_id": org_id}, {"_id": 0, "name": 1, "email": 1})
        if tenant:
            tenant_name = tenant.get("name")
            tenant_email = tenant.get("email")
    
    request_doc = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "property_id": data.property_id,
        "property_name": property_doc.get("name"),
        "unit_id": data.unit_id,
        "unit_number": unit_number,
        "tenant_id": data.tenant_id,
        "tenant_name": tenant_name,
        "category": data.category.value,
        "priority": data.priority.value,
        "status": MaintenanceStatus.OPEN.value,
        "title": data.title,
        "description": data.description,
        "preferred_access_time": data.preferred_access_time,
        "permission_to_enter": data.permission_to_enter,
        "assigned_to": None,
        "assigned_to_name": None,
        "notes": None,
        "scheduled_date": None,
        "completion_notes": None,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.maintenance_requests.insert_one(request_doc)
    request_doc.pop("_id", None)
    
    # Create notification
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "user_id": user["id"],
        "title": "New Maintenance Request",
        "message": f"Maintenance request created: {data.title}",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email notifications in background
    # Notify org admins
    admin_memberships = await db.memberships.find(
        {"org_id": org_id, "role": "admin"},
        {"_id": 0, "user_id": 1}
    ).to_list(10)
    
    for admin_membership in admin_memberships:
        admin_user = await db.users.find_one(
            {"id": admin_membership["user_id"]},
            {"_id": 0, "email": 1, "name": 1}
        )
        if admin_user:
            background_tasks.add_task(
                send_maintenance_request_email,
                admin_user["email"],
                admin_user["name"],
                data.title,
                data.description,
                property_doc.get("name"),
                data.priority.value,
                False
            )
    
    # Notify tenant if one is associated
    if tenant_email and tenant_name:
        background_tasks.add_task(
            send_maintenance_request_email,
            tenant_email,
            tenant_name,
            data.title,
            data.description,
            property_doc.get("name"),
            data.priority.value,
            True
        )
    
    return MaintenanceRequestResponse(**request_doc)

@api_router.get("/maintenance-requests", response_model=List[MaintenanceRequestResponse])
async def list_maintenance_requests(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    property_id: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """List maintenance requests for the organization"""
    user = await get_current_user(credentials)
    membership = await db.memberships.find_one({"user_id": user["id"]}, {"_id": 0, "org_id": 1})
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found")
    
    query = {"org_id": membership["org_id"]}
    
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if property_id:
        query["property_id"] = property_id
    
    requests = await db.maintenance_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [MaintenanceRequestResponse(**r) for r in requests]

@api_router.get("/maintenance-requests/{request_id}", response_model=MaintenanceRequestResponse)
async def get_maintenance_request(
    request_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get a specific maintenance request"""
    user = await get_current_user(credentials)
    membership = await db.memberships.find_one({"user_id": user["id"]}, {"_id": 0, "org_id": 1})
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found")
    
    request_doc = await db.maintenance_requests.find_one(
        {"id": request_id, "org_id": membership["org_id"]},
        {"_id": 0}
    )
    
    if not request_doc:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    return MaintenanceRequestResponse(**request_doc)

@api_router.put("/maintenance-requests/{request_id}", response_model=MaintenanceRequestResponse)
async def update_maintenance_request(
    request_id: str,
    data: MaintenanceRequestUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update a maintenance request"""
    user = await get_current_user(credentials)
    membership = await db.memberships.find_one({"user_id": user["id"]}, {"_id": 0, "org_id": 1})
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found")
    
    request_doc = await db.maintenance_requests.find_one(
        {"id": request_id, "org_id": membership["org_id"]},
        {"_id": 0}
    )
    
    if not request_doc:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.status:
        update_data["status"] = data.status.value
    if data.priority:
        update_data["priority"] = data.priority.value
    if data.assigned_to is not None:
        update_data["assigned_to"] = data.assigned_to
        # Get assigned user name
        if data.assigned_to:
            assigned_user = await db.users.find_one({"id": data.assigned_to}, {"_id": 0, "name": 1})
            update_data["assigned_to_name"] = assigned_user.get("name") if assigned_user else None
        else:
            update_data["assigned_to_name"] = None
    if data.notes is not None:
        update_data["notes"] = data.notes
    if data.scheduled_date is not None:
        update_data["scheduled_date"] = data.scheduled_date
    if data.completion_notes is not None:
        update_data["completion_notes"] = data.completion_notes
    
    await db.maintenance_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    # Fetch updated document
    updated = await db.maintenance_requests.find_one({"id": request_id}, {"_id": 0})
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "org_id": membership["org_id"],
        "user_id": user["id"],
        "user_name": user["name"],
        "action": "updated",
        "entity_type": "maintenance_request",
        "entity_id": request_id,
        "details": f"Updated maintenance request: {request_doc.get('title')}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return MaintenanceRequestResponse(**updated)

@api_router.delete("/maintenance-requests/{request_id}")
async def delete_maintenance_request(
    request_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete a maintenance request"""
    user = await get_current_user(credentials)
    membership = await db.memberships.find_one({"user_id": user["id"]}, {"_id": 0, "org_id": 1, "role": 1})
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found")
    
    if membership["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only admins and managers can delete maintenance requests")
    
    result = await db.maintenance_requests.delete_one(
        {"id": request_id, "org_id": membership["org_id"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    return {"message": "Maintenance request deleted"}

@api_router.get("/maintenance-requests/stats/summary")
async def get_maintenance_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get maintenance request statistics"""
    user = await get_current_user(credentials)
    membership = await db.memberships.find_one({"user_id": user["id"]}, {"_id": 0, "org_id": 1})
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found")
    
    org_id = membership["org_id"]
    
    total = await db.maintenance_requests.count_documents({"org_id": org_id})
    open_count = await db.maintenance_requests.count_documents({"org_id": org_id, "status": "open"})
    in_progress = await db.maintenance_requests.count_documents({"org_id": org_id, "status": "in_progress"})
    completed = await db.maintenance_requests.count_documents({"org_id": org_id, "status": "completed"})
    emergency = await db.maintenance_requests.count_documents({"org_id": org_id, "priority": "emergency", "status": {"$ne": "completed"}})
    
    # Get by category
    categories = {}
    for cat in MaintenanceCategory:
        categories[cat.value] = await db.maintenance_requests.count_documents({"org_id": org_id, "category": cat.value})
    
    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "completed": completed,
        "emergency": emergency,
        "by_category": categories
    }


# ============== TENANT RENT PAYMENT ENDPOINTS ==============

@api_router.get("/tenant-portal/rent-payments")
async def get_tenant_rent_payments(tenant = Depends(get_current_tenant)):
    """Get rent payments for the logged-in tenant"""
    if not tenant.get("org_id"):
        return []
    
    # Get the linked tenant record from the organization
    linked_tenant = await db.tenants.find_one({
        "org_id": tenant["org_id"],
        "email": tenant.get("email")
    }, {"_id": 0})
    
    if not linked_tenant:
        return []
    
    # Get rent payments for this tenant
    payments = await db.rent_payments.find(
        {"tenant_id": linked_tenant["id"], "org_id": tenant["org_id"]},
        {"_id": 0}
    ).sort("due_date", -1).to_list(50)
    
    return payments

# NOTE: Online rent payment collection removed - requires Stripe Connect for proper implementation
# The endpoint below is disabled. Landlords collect payments externally and mark as paid manually.
# class TenantPayRentRequest(BaseModel):
#     return_url: str = None
#
# @api_router.post("/tenant-portal/pay-rent/{payment_id}")
# async def tenant_pay_rent_online(...):
#     ... (see git history for implementation if Stripe Connect is added)


# Tenant Portal - Submit Maintenance Request
@api_router.post("/portal/maintenance-requests")
async def tenant_submit_maintenance_request(
    data: MaintenanceRequestCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Tenant submits a maintenance request through the portal"""
    tenant = await get_current_tenant(credentials)
    
    if not tenant.get("org_id"):
        raise HTTPException(status_code=400, detail="Not connected to any organization")
    
    org_id = tenant["org_id"]
    
    # Verify property belongs to the tenant's organization
    property_doc = await db.properties.find_one(
        {"id": data.property_id, "org_id": org_id},
        {"_id": 0, "name": 1}
    )
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    request_doc = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "property_id": data.property_id,
        "property_name": property_doc.get("name"),
        "unit_id": data.unit_id,
        "tenant_portal_id": tenant["id"],
        "tenant_name": tenant["name"],
        "category": data.category.value,
        "priority": data.priority.value,
        "status": MaintenanceStatus.OPEN.value,
        "title": data.title,
        "description": data.description,
        "preferred_access_time": data.preferred_access_time,
        "permission_to_enter": data.permission_to_enter,
        "assigned_to": None,
        "created_by": tenant["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "tenant_portal"
    }
    
    await db.maintenance_requests.insert_one(request_doc)
    request_doc.pop("_id", None)
    
    return {"message": "Maintenance request submitted", "request_id": request_doc["id"]}

@api_router.get("/portal/maintenance-requests")
async def tenant_list_maintenance_requests(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Tenant views their submitted maintenance requests"""
    tenant = await get_current_tenant(credentials)
    
    if not tenant.get("org_id"):
        return []
    
    requests = await db.maintenance_requests.find(
        {"tenant_portal_id": tenant["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return requests

# Tenant Portal - Submit Maintenance Request with Photos
@api_router.post("/portal/maintenance-requests/with-photos")
async def tenant_submit_maintenance_with_photos(
    category: str = Form(...),
    priority: str = Form("medium"),
    title: str = Form(...),
    description: str = Form(...),
    preferred_access_time: Optional[str] = Form(None),
    permission_to_enter: bool = Form(False),
    photos: List[UploadFile] = File(default=[]),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Tenant submits a maintenance request with photos through the portal"""
    tenant = await get_current_tenant(credentials)
    
    if not tenant.get("org_id"):
        raise HTTPException(status_code=400, detail="Not connected to any organization")
    
    org_id = tenant["org_id"]
    property_id = tenant.get("property_id")
    unit_id = tenant.get("unit_id")
    
    # Get property info
    property_doc = None
    if property_id:
        property_doc = await db.properties.find_one(
            {"id": property_id, "org_id": org_id},
            {"_id": 0, "name": 1, "address": 1}
        )
    
    # Save uploaded photos
    photo_urls = []
    request_id = str(uuid.uuid4())
    
    for photo in photos[:5]:  # Limit to 5 photos
        if photo.filename:
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
            if photo.content_type not in allowed_types:
                continue
            
            ext = photo.filename.split('.')[-1] if '.' in photo.filename else 'jpg'
            filename = f"maintenance_{request_id}_{len(photo_urls)}.{ext}"
            file_path = UPLOAD_DIR / filename
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            
            photo_urls.append(f"/api/uploads/{filename}")
    
    request_doc = {
        "id": request_id,
        "org_id": org_id,
        "property_id": property_id,
        "property_name": property_doc.get("name") if property_doc else None,
        "unit_id": unit_id,
        "tenant_portal_id": tenant["id"],
        "tenant_id": tenant.get("linked_tenant_id"),
        "tenant_name": tenant["name"],
        "tenant_phone": tenant.get("phone"),
        "category": category,
        "priority": priority,
        "status": MaintenanceStatus.OPEN.value,
        "title": title,
        "description": description,
        "photos": photo_urls,
        "preferred_access_time": preferred_access_time,
        "permission_to_enter": permission_to_enter,
        "assigned_to": None,
        "contractor_id": None,
        "contractor_name": None,
        "created_by": tenant["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
        "source": "tenant_portal"
    }
    
    await db.maintenance_requests.insert_one(request_doc)
    
    # Create notification for property managers
    admin_memberships = await db.memberships.find(
        {"org_id": org_id, "role": {"$in": ["admin", "manager"]}},
        {"_id": 0, "user_id": 1}
    ).to_list(10)
    
    for membership in admin_memberships:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "user_id": membership["user_id"],
            "title": "New Maintenance Request",
            "message": f"Tenant {tenant['name']} submitted: {title}",
            "is_read": False,
            "link": f"/maintenance/{request_id}",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Send email notification in background
    background_tasks.add_task(
        send_maintenance_request_email,
        tenant.get("email", ""),
        tenant["name"],
        title,
        description,
        property_doc.get("name") if property_doc else "Your Property",
        priority,
        True
    )
    
    return {
        "message": "Maintenance request submitted successfully",
        "request_id": request_id,
        "photos_uploaded": len(photo_urls)
    }

# ============== CONTRACTOR PORTAL ROUTES ==============

def create_contractor_token(contractor_id: str, email: str) -> str:
    """Create JWT for contractor portal"""
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS * 7)  # 7 days
    payload = {
        "contractor_id": contractor_id,
        "email": email,
        "type": "contractor",
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_contractor(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify contractor JWT and return contractor data"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "contractor":
            raise HTTPException(status_code=401, detail="Invalid contractor token")
        contractor_id = payload.get("contractor_id")
        contractor = await db.contractors.find_one({"id": contractor_id}, {"_id": 0, "hashed_password": 0})
        if not contractor:
            raise HTTPException(status_code=401, detail="Contractor not found")
        return contractor
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/contractor/register")
async def contractor_register(data: ContractorRegister):
    """Register a new contractor"""
    existing = await db.contractors.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    contractor_id = str(uuid.uuid4())
    contractor = {
        "id": contractor_id,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "name": data.name,
        "company_name": data.company_name,
        "phone": data.phone,
        "specialties": [s.value for s in data.specialties],
        "service_area": data.service_area,
        "hourly_rate": data.hourly_rate,
        "license_number": data.license_number,
        "status": ContractorStatus.AVAILABLE.value,
        "rating": None,
        "jobs_completed": 0,
        "connected_orgs": [],  # Orgs that have approved this contractor
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contractors.insert_one(contractor)
    
    token = create_contractor_token(contractor_id, data.email)
    
    return {
        "token": token,
        "contractor": ContractorResponse(
            id=contractor_id,
            email=data.email,
            name=data.name,
            company_name=data.company_name,
            phone=data.phone,
            specialties=[s.value for s in data.specialties],
            service_area=data.service_area,
            hourly_rate=data.hourly_rate,
            license_number=data.license_number,
            status=ContractorStatus.AVAILABLE.value,
            rating=None,
            jobs_completed=0,
            created_at=contractor["created_at"]
        )
    }

@api_router.post("/contractor/login")
async def contractor_login(data: ContractorLogin):
    """Contractor login"""
    contractor = await db.contractors.find_one({"email": data.email})
    if not contractor or not verify_password(data.password, contractor["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_contractor_token(contractor["id"], data.email)
    
    return {
        "token": token,
        "contractor": ContractorResponse(
            id=contractor["id"],
            email=contractor["email"],
            name=contractor["name"],
            company_name=contractor.get("company_name"),
            phone=contractor["phone"],
            specialties=contractor["specialties"],
            service_area=contractor.get("service_area"),
            hourly_rate=contractor.get("hourly_rate"),
            license_number=contractor.get("license_number"),
            status=contractor["status"],
            rating=contractor.get("rating"),
            jobs_completed=contractor.get("jobs_completed", 0),
            created_at=contractor["created_at"]
        )
    }

@api_router.get("/contractor/me", response_model=ContractorResponse)
async def contractor_profile(contractor = Depends(get_current_contractor)):
    """Get current contractor profile"""
    return ContractorResponse(**contractor)

@api_router.put("/contractor/me", response_model=ContractorResponse)
async def update_contractor_profile(
    data: ContractorProfileUpdate,
    contractor = Depends(get_current_contractor)
):
    """Update contractor profile"""
    update_data = {}
    if data.name:
        update_data["name"] = data.name
    if data.company_name is not None:
        update_data["company_name"] = data.company_name
    if data.phone:
        update_data["phone"] = data.phone
    if data.specialties:
        update_data["specialties"] = [s.value for s in data.specialties]
    if data.service_area is not None:
        update_data["service_area"] = data.service_area
    if data.hourly_rate is not None:
        update_data["hourly_rate"] = data.hourly_rate
    if data.status:
        update_data["status"] = data.status.value
    
    if update_data:
        await db.contractors.update_one(
            {"id": contractor["id"]},
            {"$set": update_data}
        )
    
    updated = await db.contractors.find_one({"id": contractor["id"]}, {"_id": 0, "hashed_password": 0})
    return ContractorResponse(**updated)

@api_router.get("/contractor/jobs")
async def contractor_list_jobs(
    status: Optional[str] = None,
    contractor = Depends(get_current_contractor)
):
    """List jobs assigned to contractor"""
    query = {"contractor_id": contractor["id"]}
    if status:
        query["status"] = status
    
    jobs = await db.maintenance_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for job in jobs:
        # Get property address
        property_doc = await db.properties.find_one(
            {"id": job.get("property_id")},
            {"_id": 0, "address": 1}
        )
        
        result.append(ContractorJobResponse(
            id=job["id"],
            maintenance_request_id=job["id"],
            org_id=job["org_id"],
            property_name=job.get("property_name", ""),
            property_address=property_doc.get("address") if property_doc else None,
            unit_number=job.get("unit_number"),
            category=job["category"],
            priority=job["priority"],
            status=job["status"],
            title=job["title"],
            description=job["description"],
            photos=job.get("photos", []),
            tenant_name=job.get("tenant_name"),
            tenant_phone=job.get("tenant_phone"),
            scheduled_date=job.get("scheduled_date"),
            assigned_at=job.get("assigned_at", job["created_at"]),
            completed_at=job.get("completed_at"),
            notes=job.get("notes")
        ))
    
    return result

@api_router.get("/contractor/jobs/{job_id}", response_model=ContractorJobResponse)
async def contractor_get_job(job_id: str, contractor = Depends(get_current_contractor)):
    """Get specific job details"""
    job = await db.maintenance_requests.find_one(
        {"id": job_id, "contractor_id": contractor["id"]},
        {"_id": 0}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    property_doc = await db.properties.find_one(
        {"id": job.get("property_id")},
        {"_id": 0, "address": 1}
    )
    
    return ContractorJobResponse(
        id=job["id"],
        maintenance_request_id=job["id"],
        org_id=job["org_id"],
        property_name=job.get("property_name", ""),
        property_address=property_doc.get("address") if property_doc else None,
        unit_number=job.get("unit_number"),
        category=job["category"],
        priority=job["priority"],
        status=job["status"],
        title=job["title"],
        description=job["description"],
        photos=job.get("photos", []),
        tenant_name=job.get("tenant_name"),
        tenant_phone=job.get("tenant_phone"),
        scheduled_date=job.get("scheduled_date"),
        assigned_at=job.get("assigned_at", job["created_at"]),
        completed_at=job.get("completed_at"),
        notes=job.get("notes")
    )

@api_router.put("/contractor/jobs/{job_id}")
async def contractor_update_job(
    job_id: str,
    data: ContractorJobUpdate,
    contractor = Depends(get_current_contractor)
):
    """Contractor updates job status"""
    job = await db.maintenance_requests.find_one(
        {"id": job_id, "contractor_id": contractor["id"]},
        {"_id": 0}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.status:
        update_data["status"] = data.status.value
        if data.status == MaintenanceStatus.COMPLETED:
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            # Increment contractor's jobs_completed
            await db.contractors.update_one(
                {"id": contractor["id"]},
                {"$inc": {"jobs_completed": 1}}
            )
    
    if data.notes:
        update_data["notes"] = data.notes
    if data.completion_notes:
        update_data["completion_notes"] = data.completion_notes
    
    await db.maintenance_requests.update_one(
        {"id": job_id},
        {"$set": update_data}
    )
    
    return {"message": "Job updated successfully"}

@api_router.get("/contractor/stats")
async def contractor_stats(contractor = Depends(get_current_contractor)):
    """Get contractor statistics"""
    total_jobs = await db.maintenance_requests.count_documents({"contractor_id": contractor["id"]})
    active_jobs = await db.maintenance_requests.count_documents({
        "contractor_id": contractor["id"],
        "status": {"$in": ["open", "in_progress", "scheduled"]}
    })
    completed_jobs = await db.maintenance_requests.count_documents({
        "contractor_id": contractor["id"],
        "status": "completed"
    })
    
    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "jobs_completed_count": contractor.get("jobs_completed", 0),
        "rating": contractor.get("rating"),
        "status": contractor["status"]
    }

# ============== LANDLORD - CONTRACTOR MANAGEMENT ==============

@api_router.get("/organizations/{org_id}/contractors")
async def list_org_contractors(org_id: str, user = Depends(get_current_user)):
    """List contractors available to the organization"""
    await get_user_membership(user['id'], org_id)
    
    # Get contractors connected to this org
    contractors = await db.contractors.find(
        {"connected_orgs": org_id},
        {"_id": 0, "hashed_password": 0}
    ).to_list(100)
    
    return [ContractorResponse(**c) for c in contractors]

@api_router.post("/organizations/{org_id}/contractors/invite")
async def invite_contractor(
    org_id: str,
    contractor_email: str = Form(...),
    user = Depends(get_current_user)
):
    """Invite a contractor to work with the organization"""
    membership = await get_user_membership(user['id'], org_id)
    if membership['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Only admins and managers can invite contractors")
    
    contractor = await db.contractors.find_one({"email": contractor_email})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found. They need to register first.")
    
    if org_id in contractor.get("connected_orgs", []):
        raise HTTPException(status_code=400, detail="Contractor already connected to this organization")
    
    # Add org to contractor's connected orgs
    await db.contractors.update_one(
        {"id": contractor["id"]},
        {"$addToSet": {"connected_orgs": org_id}}
    )
    
    return {"message": f"Contractor {contractor['name']} has been added to your organization"}

@api_router.post("/maintenance-requests/{request_id}/assign-contractor")
async def assign_contractor_to_request(
    request_id: str,
    data: AssignContractorRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Assign a contractor to a maintenance request"""
    user = await get_current_user(credentials)
    
    # Get the maintenance request
    request = await db.maintenance_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    # Verify user has access to this org
    membership = await get_user_membership(user['id'], request["org_id"])
    if membership['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Only admins and managers can assign contractors")
    
    # Verify contractor exists and is connected to org
    contractor = await db.contractors.find_one(
        {"id": data.contractor_id, "connected_orgs": request["org_id"]},
        {"_id": 0, "hashed_password": 0}
    )
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found or not connected to your organization")
    
    # Update the maintenance request
    update_data = {
        "contractor_id": contractor["id"],
        "contractor_name": contractor["name"],
        "status": MaintenanceStatus.SCHEDULED.value if data.scheduled_date else MaintenanceStatus.IN_PROGRESS.value,
        "assigned_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if data.scheduled_date:
        update_data["scheduled_date"] = data.scheduled_date
    if data.notes:
        update_data["notes"] = data.notes
    
    await db.maintenance_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    # Create notification for contractor (stored for when they log in)
    await db.contractor_notifications.insert_one({
        "id": str(uuid.uuid4()),
        "contractor_id": contractor["id"],
        "title": "New Job Assigned",
        "message": f"You've been assigned to: {request['title']}",
        "request_id": request_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email to contractor
    background_tasks.add_task(
        send_notification_email,
        contractor.get("email", ""),
        contractor["name"],
        "New Job Assignment - MyPropOps",
        f"""
        <p>You've been assigned a new maintenance job:</p>
        <p><strong>Title:</strong> {request['title']}</p>
        <p><strong>Property:</strong> {request.get('property_name', 'N/A')}</p>
        <p><strong>Priority:</strong> {request['priority'].upper()}</p>
        <p><strong>Description:</strong> {request['description']}</p>
        {f"<p><strong>Scheduled:</strong> {data.scheduled_date}</p>" if data.scheduled_date else ""}
        <p>Log in to your Contractor Portal to view details and update the job status.</p>
        """,
        "job_assignment"
    )
    
    return {
        "message": f"Job assigned to {contractor['name']}",
        "contractor_name": contractor["name"],
        "status": update_data["status"]
    }

@api_router.get("/contractor/notifications")
async def contractor_notifications(contractor = Depends(get_current_contractor)):
    """Get contractor notifications"""
    notifications = await db.contractor_notifications.find(
        {"contractor_id": contractor["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return notifications

@api_router.put("/contractor/notifications/{notification_id}/read")
async def mark_contractor_notification_read(
    notification_id: str,
    contractor = Depends(get_current_contractor)
):
    """Mark contractor notification as read"""
    await db.contractor_notifications.update_one(
        {"id": notification_id, "contractor_id": contractor["id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}


# ============== CONTRACTOR-MANAGER MESSAGING ==============

class ContractorMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    job_id: str = Field(..., description="The maintenance request ID this message is about")

@api_router.get("/contractor/jobs/{job_id}/messages")
async def get_contractor_job_messages(job_id: str, contractor = Depends(get_current_contractor)):
    """Get messages for a specific job (contractor view)"""
    # Verify contractor has access to this job
    job = await db.maintenance_requests.find_one({
        "id": job_id, 
        "contractor_id": contractor["id"]
    })
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")
    
    messages = await db.contractor_messages.find(
        {"job_id": job_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Mark manager messages as read for contractor
    await db.contractor_messages.update_many(
        {"job_id": job_id, "sender_type": "manager", "read_by_contractor": False},
        {"$set": {"read_by_contractor": True}}
    )
    
    return messages

@api_router.post("/contractor/jobs/{job_id}/messages")
async def contractor_send_message(
    job_id: str, 
    data: ContractorMessageCreate,
    contractor = Depends(get_current_contractor)
):
    """Contractor sends a message to manager about a job"""
    # Verify contractor has access to this job
    job = await db.maintenance_requests.find_one({
        "id": job_id, 
        "contractor_id": contractor["id"]
    })
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")
    
    message = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "org_id": job["org_id"],
        "sender_type": "contractor",
        "sender_id": contractor["id"],
        "sender_name": contractor["name"],
        "content": data.content,
        "read_by_manager": False,
        "read_by_contractor": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.contractor_messages.insert_one(message)
    
    # Create notification for org managers
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "org_id": job["org_id"],
        "type": "contractor_message",
        "title": f"New message from {contractor['name']}",
        "message": f"Regarding: {job['title']}",
        "reference_id": job_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"id": message["id"], "message": "Message sent"}

@api_router.get("/maintenance-requests/{job_id}/messages")
async def get_job_messages_manager(job_id: str, user = Depends(get_current_user)):
    """Get messages for a specific job (manager view)"""
    # Verify user has access to this job's org
    job = await db.maintenance_requests.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    await get_user_membership(user['id'], job["org_id"])
    
    messages = await db.contractor_messages.find(
        {"job_id": job_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Mark contractor messages as read for manager
    await db.contractor_messages.update_many(
        {"job_id": job_id, "sender_type": "contractor", "read_by_manager": False},
        {"$set": {"read_by_manager": True}}
    )
    
    return messages

@api_router.post("/maintenance-requests/{job_id}/messages")
async def manager_send_message_to_contractor(
    job_id: str,
    data: ContractorMessageCreate,
    user = Depends(get_current_user)
):
    """Manager sends a message to contractor about a job"""
    job = await db.maintenance_requests.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    membership = await get_user_membership(user['id'], job["org_id"])
    
    if not job.get("contractor_id"):
        raise HTTPException(status_code=400, detail="No contractor assigned to this job")
    
    message = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "org_id": job["org_id"],
        "sender_type": "manager",
        "sender_id": user["id"],
        "sender_name": user["name"],
        "content": data.content,
        "read_by_manager": True,
        "read_by_contractor": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.contractor_messages.insert_one(message)
    
    # Create notification for contractor
    await db.contractor_notifications.insert_one({
        "id": str(uuid.uuid4()),
        "contractor_id": job["contractor_id"],
        "title": f"New message from {user['name']}",
        "message": f"Regarding: {job['title']}",
        "request_id": job_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"id": message["id"], "message": "Message sent"}

@api_router.get("/contractor/unread-messages-count")
async def get_contractor_unread_count(contractor = Depends(get_current_contractor)):
    """Get count of unread messages for contractor"""
    count = await db.contractor_messages.count_documents({
        "sender_type": "manager",
        "read_by_contractor": False,
        "job_id": {"$in": [
            job["id"] async for job in db.maintenance_requests.find(
                {"contractor_id": contractor["id"]}, {"id": 1}
            )
        ]}
    })
    return {"unread_count": count}


class CreateCheckoutRequest(BaseModel):
    plan_id: str = Field(..., description="Plan ID: standard_monthly, standard_annual, pro_monthly, pro_annual")
    origin_url: str = Field(..., description="Frontend origin URL for redirect")

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class SubscriptionStatusResponse(BaseModel):
    plan: str
    status: str
    billing_period: Optional[str]
    next_billing_date: Optional[str]
    usage: dict
    limits: dict

@api_router.post("/billing/create-checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    http_request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a Stripe checkout session for subscription upgrade"""
    user = await get_current_user(credentials)
    
    # Get user's current organization
    membership = await db.memberships.find_one(
        {"user_id": user["id"]},
        {"_id": 0, "org_id": 1, "role": 1}
    )
    
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found. Please create one first.")
    
    if membership["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only organization admins can manage billing")
    
    # Validate plan
    if request.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan ID. Valid options: {list(SUBSCRIPTION_PLANS.keys())}")
    
    plan_details = SUBSCRIPTION_PLANS[request.plan_id]
    
    # Check if already on this plan or higher
    org = await db.organizations.find_one({"id": membership["org_id"]}, {"_id": 0, "plan": 1})
    current_plan = org.get("plan", "free") if org else "free"
    
    plan_hierarchy = {"free": 0, "standard": 1, "pro": 2, "enterprise": 3}
    if plan_hierarchy.get(plan_details["plan"], 0) <= plan_hierarchy.get(current_plan, 0):
        if plan_details["plan"] == current_plan:
            raise HTTPException(status_code=400, detail=f"You're already on the {current_plan} plan")
    
    try:
        # Initialize Stripe checkout
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Build success and cancel URLs
        success_url = f"{request.origin_url}/settings?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/settings?payment=cancelled"
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=plan_details["amount"],
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "org_id": membership["org_id"],
                "user_id": user["id"],
                "plan_id": request.plan_id,
                "plan_name": plan_details["plan"],
                "billing_period": plan_details["period"]
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "org_id": membership["org_id"],
            "user_id": user["id"],
            "plan_id": request.plan_id,
            "amount": plan_details["amount"],
            "currency": "usd",
            "status": "pending",
            "payment_status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Checkout session created for org {membership['org_id']}, plan {request.plan_id}")
        
        return CheckoutResponse(
            checkout_url=session.url,
            session_id=session.session_id
        )
        
    except Exception as e:
        logger.error(f"Failed to create checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@api_router.get("/billing/checkout-status/{session_id}")
async def get_checkout_status(
    session_id: str,
    http_request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Check the status of a checkout session and update subscription if successful"""
    user = await get_current_user(credentials)
    
    # Find the transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify user owns this transaction
    if transaction["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # If already processed successfully, return cached status
    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "plan_upgraded": True,
            "new_plan": transaction.get("plan_id", "").split("_")[0]
        }
    
    try:
        # Initialize Stripe checkout
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Get checkout status from Stripe
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction record
        update_data = {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # If payment successful, upgrade the organization's plan
        plan_upgraded = False
        new_plan = None
        
        if checkout_status.payment_status == "paid":
            plan_id = transaction.get("plan_id", "")
            plan_name = plan_id.split("_")[0] if "_" in plan_id else plan_id
            billing_period = plan_id.split("_")[1] if "_" in plan_id else "monthly"
            
            # Update organization plan
            await db.organizations.update_one(
                {"id": transaction["org_id"]},
                {
                    "$set": {
                        "plan": plan_name,
                        "billing_period": billing_period,
                        "plan_updated_at": datetime.now(timezone.utc).isoformat(),
                        "subscription_active": True
                    }
                }
            )
            
            plan_upgraded = True
            new_plan = plan_name
            
            # Create audit log
            await db.audit_logs.insert_one({
                "id": str(uuid.uuid4()),
                "org_id": transaction["org_id"],
                "user_id": user["id"],
                "user_name": user["name"],
                "action": "plan_upgraded",
                "entity_type": "subscription",
                "entity_id": session_id,
                "details": f"Upgraded to {plan_name} ({billing_period})",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            logger.info(f"Organization {transaction['org_id']} upgraded to {plan_name}")
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "plan_upgraded": plan_upgraded,
            "new_plan": new_plan
        }
        
    except Exception as e:
        logger.error(f"Failed to check checkout status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response:
            session_id = webhook_response.session_id
            payment_status = webhook_response.payment_status
            metadata = webhook_response.metadata
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": payment_status,
                        "webhook_received_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # If payment successful, upgrade plan
            if payment_status == "paid" and metadata:
                org_id = metadata.get("org_id")
                plan_name = metadata.get("plan_name")
                billing_period = metadata.get("billing_period")
                
                if org_id and plan_name:
                    await db.organizations.update_one(
                        {"id": org_id},
                        {
                            "$set": {
                                "plan": plan_name,
                                "billing_period": billing_period,
                                "plan_updated_at": datetime.now(timezone.utc).isoformat(),
                                "subscription_active": True
                            }
                        }
                    )
                    logger.info(f"Webhook: Organization {org_id} upgraded to {plan_name}")
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

@api_router.get("/billing/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get current subscription status and usage"""
    user = await get_current_user(credentials)
    
    membership = await db.memberships.find_one(
        {"user_id": user["id"]},
        {"_id": 0, "org_id": 1}
    )
    
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found")
    
    org = await db.organizations.find_one(
        {"id": membership["org_id"]},
        {"_id": 0, "plan": 1, "billing_period": 1, "plan_updated_at": 1, "subscription_active": 1}
    )
    
    plan = org.get("plan", "free") if org else "free"
    usage = await get_org_usage(membership["org_id"])
    
    # Calculate next billing date (30 days from last update for monthly, 365 for annual)
    next_billing = None
    if org and org.get("plan_updated_at") and plan != "free":
        from datetime import datetime
        update_date = datetime.fromisoformat(org["plan_updated_at"].replace('Z', '+00:00'))
        days = 30 if org.get("billing_period") == "monthly" else 365
        next_billing = (update_date + timedelta(days=days)).isoformat()
    
    return SubscriptionStatusResponse(
        plan=plan,
        status="active" if org and org.get("subscription_active") else "inactive" if plan != "free" else "free",
        billing_period=org.get("billing_period") if org else None,
        next_billing_date=next_billing,
        usage=usage["usage"],
        limits=usage["limits"]
    )

@api_router.get("/billing/plans")
async def get_available_plans():
    """Get available subscription plans with pricing"""
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "description": "For small portfolios",
                "features": [
                    "Up to 2 properties",
                    "Up to 5 units", 
                    "1 team member",
                    "Basic document storage (500MB)",
                    "Basic maintenance requests"
                ],
                "pricing": {"monthly": 0, "annual": 0}
            },
            {
                "id": "standard",
                "name": "Standard",
                "description": "For growing property managers",
                "features": [
                    "Up to 20 properties",
                    "Up to 40 units",
                    "5 team members",
                    "Full inspection workflows",
                    "10GB document storage",
                    "Tenant Portal with photo uploads",
                    "Rent payment tracking",
                    "Email notifications",
                    "Contractor Portal access",
                    "One-tap contractor assignment",
                    "Exportable reports (CSV/PDF)",
                    "Tenant Screening (pay per use)"
                ],
                "pricing": {"monthly": 49, "annual": 39},
                "annual_savings": 120,
                "popular": True
            },
            {
                "id": "pro",
                "name": "Pro",
                "description": "For professional property managers",
                "features": [
                    "Unlimited properties",
                    "Unlimited units",
                    "Unlimited team members",
                    "Everything in Standard",
                    "100GB document storage",
                    "AI-Powered Insights Dashboard",
                    "Advanced analytics dashboard",
                    "API access with key management",
                    "Two-factor authentication (2FA)",
                    "Full audit logs",
                    "24/7 priority support"
                ],
                "pricing": {"monthly": 149, "annual": 119},
                "annual_savings": 360
            }
        ]
    }

# ============== EMBEDDED CHECKOUT ENDPOINTS ==============

class EmbeddedCheckoutRequest(BaseModel):
    plan_id: str = Field(..., description="Plan ID: standard_monthly, standard_annual, pro_monthly, pro_annual")
    return_url: str = Field(..., description="Return URL after checkout completes")

class EmbeddedCheckoutResponse(BaseModel):
    client_secret: str
    session_id: str
    publishable_key: str

@api_router.post("/billing/create-embedded-checkout", response_model=EmbeddedCheckoutResponse)
async def create_embedded_checkout_session(
    request: EmbeddedCheckoutRequest,
    http_request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a Stripe embedded checkout session that returns client_secret"""
    user = await get_current_user(credentials)
    
    # Get user's current organization
    membership = await db.memberships.find_one(
        {"user_id": user["id"]},
        {"_id": 0, "org_id": 1, "role": 1}
    )
    
    if not membership:
        raise HTTPException(status_code=400, detail="No organization found. Please create one first.")
    
    if membership["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only organization admins can manage billing")
    
    # Validate plan
    if request.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan ID. Valid options: {list(SUBSCRIPTION_PLANS.keys())}")
    
    plan_details = SUBSCRIPTION_PLANS[request.plan_id]
    
    # Check if already on this plan or higher
    org = await db.organizations.find_one({"id": membership["org_id"]}, {"_id": 0, "plan": 1})
    current_plan = org.get("plan", "free") if org else "free"
    
    plan_hierarchy = {"free": 0, "standard": 1, "pro": 2, "enterprise": 3}
    if plan_hierarchy.get(plan_details["plan"], 0) <= plan_hierarchy.get(current_plan, 0):
        if plan_details["plan"] == current_plan:
            raise HTTPException(status_code=400, detail=f"You're already on the {current_plan} plan")
    
    try:
        # Configure Stripe with API key
        stripe.api_key = STRIPE_API_KEY
        
        # Get user email for customer_email
        user_email = user.get("email", "")
        
        # Determine recurring interval based on billing period
        interval = "year" if plan_details["period"] == "annual" else "month"
        
        # Create embedded checkout session with subscription mode
        session = stripe.checkout.Session.create(
            ui_mode="embedded",
            mode="subscription",
            customer_email=user_email,
            billing_address_collection="required",
            return_url=f"{request.return_url}?session_id={{CHECKOUT_SESSION_ID}}",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"MyPropOps {plan_details['plan'].title()} Plan",
                            "description": f"Property management software - {plan_details['period'].title()} billing"
                        },
                        "unit_amount": int(plan_details["amount"] * 100),  # Convert to cents
                        "recurring": {
                            "interval": interval,
                            "interval_count": 1
                        }
                    },
                    "quantity": 1
                }
            ],
            subscription_data={
                "metadata": {
                    "org_id": membership["org_id"],
                    "user_id": user["id"],
                    "plan_id": request.plan_id,
                    "plan_name": plan_details["plan"],
                    "billing_period": plan_details["period"]
                }
            },
            metadata={
                "org_id": membership["org_id"],
                "user_id": user["id"],
                "plan_id": request.plan_id,
                "plan_name": plan_details["plan"],
                "billing_period": plan_details["period"]
            },
            automatic_tax={"enabled": False}
        )
        
        # Store payment transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "org_id": membership["org_id"],
            "user_id": user["id"],
            "plan_id": request.plan_id,
            "amount": plan_details["amount"],
            "currency": "usd",
            "status": "pending",
            "payment_status": "initiated",
            "checkout_type": "embedded",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Embedded checkout session created for org {membership['org_id']}, plan {request.plan_id}")
        
        return EmbeddedCheckoutResponse(
            client_secret=session.client_secret,
            session_id=session.id,
            publishable_key=STRIPE_PUBLISHABLE_KEY
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating embedded checkout: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to create embedded checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@api_router.get("/billing/session-status/{session_id}")
async def get_session_status(
    session_id: str,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get the status of an embedded checkout session"""
    user = await get_current_user(credentials)
    
    # Find the transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify user owns this transaction
    if transaction["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        stripe.api_key = STRIPE_API_KEY
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Update transaction with current status
        update_data = {
            "status": session.status,
            "payment_status": session.payment_status or "unpaid",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # If payment successful, upgrade the organization's plan
        if session.payment_status == "paid" and transaction.get("payment_status") != "paid":
            plan_id = transaction.get("plan_id", "")
            plan_name = plan_id.split("_")[0] if "_" in plan_id else plan_id
            billing_period = plan_id.split("_")[1] if "_" in plan_id else "monthly"
            
            # Update organization plan
            await db.organizations.update_one(
                {"id": transaction["org_id"]},
                {
                    "$set": {
                        "plan": plan_name,
                        "billing_period": billing_period,
                        "plan_updated_at": datetime.now(timezone.utc).isoformat(),
                        "subscription_active": True
                    }
                }
            )
            
            # Update transaction to paid
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            # Create audit log
            await db.audit_logs.insert_one({
                "id": str(uuid.uuid4()),
                "org_id": transaction["org_id"],
                "user_id": user["id"],
                "user_name": user["name"],
                "action": "plan_upgraded",
                "entity_type": "subscription",
                "entity_id": session_id,
                "details": f"Upgraded to {plan_name} ({billing_period})",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            logger.info(f"Organization {transaction['org_id']} upgraded to {plan_name}")
            
            # Send subscription upgrade email
            background_tasks.add_task(
                send_subscription_upgraded_email,
                user["email"],
                user["name"],
                plan_name,
                billing_period
            )
        
        return {
            "status": session.status,
            "payment_status": session.payment_status or "unpaid",
            "customer_email": session.customer_details.email if session.customer_details else None
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error checking session status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check session status")

# ============== EMAIL NOTIFICATION HELPERS ==============

async def send_welcome_email(email: str, name: str):
    """Send welcome email to new user (if Mailchimp is configured)"""
    if not mailchimp_transactional_client:
        logger.info(f"Mailchimp not configured - skipping welcome email to {email}")
        return False
    
    try:
        message = {
            "from_email": MAILCHIMP_FROM_EMAIL,
            "subject": "Welcome to MyPropOps!",
            "html": f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Welcome to MyPropOps!</h1>
                    </div>
                    <div style="padding: 40px 20px;">
                        <p>Hi {name},</p>
                        <p>Thank you for signing up for MyPropOps! We're excited to help you manage your properties more efficiently.</p>
                        <p>Here's what you can do next:</p>
                        <ul>
                            <li>Add your first property</li>
                            <li>Create units and add tenants</li>
                            <li>Schedule inspections</li>
                            <li>Upload important documents</li>
                        </ul>
                        <p>If you have any questions, don't hesitate to reach out to our support team.</p>
                        <p>Best regards,<br>The MyPropOps Team</p>
                    </div>
                </body>
            </html>
            """,
            "to": [{"email": email, "name": name, "type": "to"}],
            "tags": ["welcome", "onboarding"]
        }
        
        result = mailchimp_transactional_client.messages.send({"message": message})
        logger.info(f"Welcome email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")
        return False

async def send_notification_email(email: str, name: str, subject: str, content: str, email_type: str = "notification"):
    """Send a notification email (if Mailchimp is configured)"""
    if not mailchimp_transactional_client:
        logger.info(f"Mailchimp not configured - skipping notification to {email}")
        return False
    
    try:
        message = {
            "from_email": MAILCHIMP_FROM_EMAIL,
            "subject": subject,
            "html": f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1f2937; padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0;">MyPropOps</h2>
                    </div>
                    <div style="padding: 30px 20px;">
                        <p>Hi {name},</p>
                        {content}
                        <p style="margin-top: 30px;">Best regards,<br>The MyPropOps Team</p>
                    </div>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                        <p>You're receiving this email because you have an account with MyPropOps.</p>
                    </div>
                </body>
            </html>
            """,
            "to": [{"email": email, "name": name, "type": "to"}],
            "tags": [email_type]
        }
        
        result = mailchimp_transactional_client.messages.send({"message": message})
        logger.info(f"Notification email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send notification email: {str(e)}")
        return False

async def send_maintenance_request_email(email: str, name: str, request_title: str, request_description: str, property_name: str, priority: str, is_tenant: bool = False):
    """Send maintenance request notification email"""
    if not mailchimp_transactional_client:
        logger.info(f"Mailchimp not configured - skipping maintenance email to {email}")
        return False
    
    priority_color = {
        "low": "#22c55e",
        "medium": "#3b82f6",
        "high": "#f97316",
        "emergency": "#ef4444"
    }.get(priority, "#3b82f6")
    
    subject = f"{'New' if not is_tenant else 'Your'} Maintenance Request: {request_title}"
    
    try:
        message = {
            "from_email": MAILCHIMP_FROM_EMAIL,
            "subject": subject,
            "html": f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Maintenance Request</h1>
                    </div>
                    <div style="padding: 30px 20px;">
                        <p>Hi {name},</p>
                        <p>{'A new maintenance request has been submitted' if not is_tenant else 'Your maintenance request has been received'}:</p>
                        
                        <div style="background: #f8fafc; border-left: 4px solid {priority_color}; padding: 20px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Title:</strong> {request_title}</p>
                            <p style="margin: 0 0 10px 0;"><strong>Property:</strong> {property_name}</p>
                            <p style="margin: 0 0 10px 0;"><strong>Priority:</strong> <span style="color: {priority_color}; font-weight: bold;">{priority.upper()}</span></p>
                            <p style="margin: 0;"><strong>Description:</strong></p>
                            <p style="margin: 5px 0 0 0; color: #64748b;">{request_description}</p>
                        </div>
                        
                        <p>{'Log in to your MyPropOps dashboard to manage this request.' if not is_tenant else 'We will keep you updated on the progress of your request.'}</p>
                        
                        <p style="margin-top: 30px;">Best regards,<br>The MyPropOps Team</p>
                    </div>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                        <p>You're receiving this email because of a maintenance request on MyPropOps.</p>
                    </div>
                </body>
            </html>
            """,
            "to": [{"email": email, "name": name, "type": "to"}],
            "tags": ["maintenance", priority]
        }
        
        result = mailchimp_transactional_client.messages.send({"message": message})
        logger.info(f"Maintenance request email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send maintenance request email: {str(e)}")
        return False

async def send_subscription_upgraded_email(email: str, name: str, plan_name: str, billing_period: str):
    """Send email when user upgrades their subscription"""
    if not mailchimp_transactional_client:
        logger.info(f"Mailchimp not configured - skipping subscription email to {email}")
        return False
    
    plan_features = {
        "standard": ["Up to 20 properties", "Up to 40 units", "5 team members", "Full inspection workflows", "10GB document storage"],
        "pro": ["Unlimited properties", "Unlimited units", "Unlimited team members", "Tenant Portal", "24/7 priority support", "API access"]
    }
    
    features = plan_features.get(plan_name, [])
    features_html = "".join([f"<li style='margin: 5px 0;'>{f}</li>" for f in features])
    
    try:
        message = {
            "from_email": MAILCHIMP_FROM_EMAIL,
            "subject": f"Welcome to MyPropOps {plan_name.title()}!",
            "html": f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">You're Upgraded!</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Welcome to {plan_name.title()}</p>
                    </div>
                    <div style="padding: 40px 20px;">
                        <p>Hi {name},</p>
                        <p>Thank you for upgrading to the <strong>{plan_name.title()}</strong> plan! Your subscription is now active.</p>
                        
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0; font-weight: bold; color: #166534;">Your new features include:</p>
                            <ul style="margin: 0; padding-left: 20px; color: #166534;">
                                {features_html}
                            </ul>
                        </div>
                        
                        <p><strong>Billing:</strong> You will be billed {billing_period} at the current rate.</p>
                        
                        <p>If you have any questions about your new features, our support team is here to help!</p>
                        
                        <p style="margin-top: 30px;">Best regards,<br>The MyPropOps Team</p>
                    </div>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                        <p>Manage your subscription in your MyPropOps dashboard.</p>
                    </div>
                </body>
            </html>
            """,
            "to": [{"email": email, "name": name, "type": "to"}],
            "tags": ["subscription", "upgrade", plan_name]
        }
        
        result = mailchimp_transactional_client.messages.send({"message": message})
        logger.info(f"Subscription upgraded email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send subscription upgraded email: {str(e)}")
        return False

async def send_team_invite_email(email: str, inviter_name: str, org_name: str, role: str, invite_link: str):
    """Send team invitation email"""
    if not mailchimp_transactional_client:
        logger.info(f"Mailchimp not configured - skipping invite email to {email}")
        return False
    
    try:
        message = {
            "from_email": MAILCHIMP_FROM_EMAIL,
            "subject": f"You're invited to join {org_name} on MyPropOps",
            "html": f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">You're Invited!</h1>
                    </div>
                    <div style="padding: 40px 20px;">
                        <p>Hi there,</p>
                        <p><strong>{inviter_name}</strong> has invited you to join <strong>{org_name}</strong> on MyPropOps as a <strong>{role}</strong>.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{invite_link}" style="background: #3b82f6; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Accept Invitation</a>
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px;">This invitation will expire in 7 days.</p>
                        
                        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                        
                        <p style="margin-top: 30px;">Best regards,<br>The MyPropOps Team</p>
                    </div>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                        <p>MyPropOps - Property Management Made Simple</p>
                    </div>
                </body>
            </html>
            """,
            "to": [{"email": email, "type": "to"}],
            "tags": ["invitation", "team"]
        }
        
        result = mailchimp_transactional_client.messages.send({"message": message})
        logger.info(f"Team invite email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send team invite email: {str(e)}")
        return False

# ============== REPORTS EXPORT ENDPOINTS ==============

import csv
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

@api_router.get("/reports/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = "csv",
    date_range: str = "all",
    user = Depends(get_current_user)
):
    """Export report data in CSV or PDF format"""
    # Check plan allows reports
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    org = await db.organizations.find_one({"id": org_id})
    plan = org.get("plan", "free") if org else "free"
    
    if plan not in ["standard", "pro"]:
        raise HTTPException(status_code=403, detail="Exportable reports require Standard or Pro plan")
    
    # Fetch data based on report type
    if report_type == "properties":
        data = await db.properties.find({"org_id": org_id}, {"_id": 0}).to_list(1000)
        headers = ["Name", "Address", "Units", "Created Date"]
        rows = [[p.get("name", ""), p.get("address", ""), str(p.get("unit_count", 0)), p.get("created_at", "")[:10] if p.get("created_at") else ""] for p in data]
    elif report_type == "tenants":
        data = await db.tenants.find({"org_id": org_id}, {"_id": 0}).to_list(1000)
        headers = ["Name", "Email", "Phone", "Property", "Unit", "Lease Start", "Lease End", "Status"]
        rows = [[
            f"{t.get('first_name', '')} {t.get('last_name', '')}",
            t.get("email", ""),
            t.get("phone", ""),
            t.get("property_name", ""),
            t.get("unit_number", ""),
            t.get("lease_start", "")[:10] if t.get("lease_start") else "",
            t.get("lease_end", "")[:10] if t.get("lease_end") else "",
            t.get("status", "")
        ] for t in data]
    elif report_type == "maintenance":
        data = await db.maintenance_requests.find({"org_id": org_id}, {"_id": 0}).to_list(1000)
        headers = ["Title", "Property", "Unit", "Priority", "Status", "Created", "Contractor"]
        rows = [[
            m.get("title", ""),
            m.get("property_name", ""),
            m.get("unit_number", ""),
            m.get("priority", ""),
            m.get("status", ""),
            m.get("created_at", "")[:10] if m.get("created_at") else "",
            m.get("contractor_name", "N/A")
        ] for m in data]
    elif report_type == "inspections":
        data = await db.inspections.find({"org_id": org_id}, {"_id": 0}).to_list(1000)
        headers = ["Property", "Type", "Status", "Scheduled Date", "Completed Date", "Assigned To"]
        rows = [[
            i.get("property_name", ""),
            i.get("type", ""),
            i.get("status", ""),
            i.get("scheduled_date", "")[:10] if i.get("scheduled_date") else "",
            i.get("completed_date", "")[:10] if i.get("completed_date") else "",
            i.get("assigned_to_name", "")
        ] for i in data]
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(rows)
        content = output.getvalue()
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report_type}-report.csv"}
        )
    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        elements = []
        
        styles = getSampleStyleSheet()
        title = Paragraph(f"{report_type.title()} Report", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 20))
        
        table_data = [headers] + rows
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={report_type}-report.pdf"}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'csv' or 'pdf'")


# ============== ANALYTICS ENDPOINTS ==============

@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    date_range: str = "30days",
    user = Depends(get_current_user)
):
    """Get analytics dashboard data"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    
    # Get basic counts
    properties = await db.properties.find({"org_id": org_id}, {"_id": 0}).to_list(1000)
    tenants = await db.tenants.find({"org_id": org_id, "status": "active"}, {"_id": 0}).to_list(1000)
    maintenance = await db.maintenance_requests.find({"org_id": org_id, "status": {"$in": ["pending", "in_progress"]}}, {"_id": 0}).to_list(1000)
    units = await db.units.find({"org_id": org_id}, {"_id": 0}).to_list(1000)
    
    total_units = len(units)
    occupied_units = len([u for u in units if u.get("tenant_id")])
    occupancy_rate = round((occupied_units / total_units * 100) if total_units > 0 else 0)
    
    # Calculate estimated revenue (sum of rent amounts from occupied units)
    monthly_revenue = sum([u.get("rent", 0) for u in units if u.get("tenant_id")])
    
    return {
        "occupancy": {"current": occupancy_rate, "trend": 3, "previous": occupancy_rate - 3},
        "revenue": {"current": monthly_revenue, "trend": 8, "previous": int(monthly_revenue * 0.92)},
        "maintenance": {"open": len(maintenance), "avgResolution": 3.2, "trend": -15},
        "tenants": {"total": len(tenants), "newThisMonth": 2, "leavingThisMonth": 0},
        "properties": {"total": len(properties), "occupiedUnits": occupied_units, "totalUnits": total_units},
        "monthlyData": [
            {"month": "Jul", "occupancy": max(0, occupancy_rate - 4), "revenue": int(monthly_revenue * 0.85), "maintenance": 8},
            {"month": "Aug", "occupancy": max(0, occupancy_rate - 2), "revenue": int(monthly_revenue * 0.89), "maintenance": 6},
            {"month": "Sep", "occupancy": max(0, occupancy_rate - 3), "revenue": int(monthly_revenue * 0.91), "maintenance": 9},
            {"month": "Oct", "occupancy": max(0, occupancy_rate - 1), "revenue": int(monthly_revenue * 0.96), "maintenance": 5},
            {"month": "Nov", "occupancy": occupancy_rate, "revenue": int(monthly_revenue * 0.98), "maintenance": 4},
            {"month": "Dec", "occupancy": occupancy_rate, "revenue": monthly_revenue, "maintenance": len(maintenance)}
        ],
        "topProperties": [
            {"name": p["name"], "occupancy": 95, "units": p.get("unit_count", 0), "revenue": p.get("unit_count", 0) * 1200}
            for p in properties[:3]
        ],
        "maintenanceByCategory": [
            {"category": "Plumbing", "count": 12, "avgCost": 250},
            {"category": "Electrical", "count": 8, "avgCost": 180},
            {"category": "HVAC", "count": 6, "avgCost": 450},
            {"category": "Appliances", "count": 4, "avgCost": 200}
        ]
    }


# ============== API KEY MANAGEMENT ENDPOINTS ==============

import secrets

class CreateApiKeyRequest(BaseModel):
    name: str

@api_router.get("/api-keys")
async def list_api_keys(user = Depends(get_current_user)):
    """List all API keys for the user's organization"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    
    # Check plan allows API access
    org = await db.organizations.find_one({"id": org_id})
    plan = org.get("plan", "free") if org else "free"
    
    if plan != "pro":
        return {"keys": [], "plan_required": "pro"}
    
    keys = await db.api_keys.find({"org_id": org_id}, {"_id": 0, "key_hash": 0}).to_list(100)
    return {"keys": keys}

@api_router.post("/api-keys")
async def create_api_key(data: CreateApiKeyRequest, user = Depends(get_current_user)):
    """Create a new API key"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    
    # Check plan allows API access
    org = await db.organizations.find_one({"id": org_id})
    plan = org.get("plan", "free") if org else "free"
    
    if plan != "pro":
        raise HTTPException(status_code=403, detail="API key management requires Pro plan")
    
    # Generate API key
    api_key = f"pk_{secrets.token_hex(24)}"
    key_id = str(uuid.uuid4())
    
    key_doc = {
        "id": key_id,
        "org_id": org_id,
        "name": data.name,
        "key_preview": api_key[:8] + "..." + api_key[-4:],
        "key_hash": hashlib.sha256(api_key.encode()).hexdigest(),
        "is_active": True,
        "created_by": user['id'],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_used": None
    }
    
    await db.api_keys.insert_one(key_doc)
    
    return {
        "id": key_id,
        "name": data.name,
        "key": api_key,  # Only returned once at creation
        "message": "Save this key now. You won't be able to see it again."
    }

@api_router.delete("/api-keys/{key_id}")
async def delete_api_key(key_id: str, user = Depends(get_current_user)):
    """Delete an API key"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    result = await db.api_keys.delete_one({"id": key_id, "org_id": membership['org_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {"message": "API key deleted"}


# ============== CUSTOM BRANDING ENDPOINTS ==============

@api_router.get("/branding")
async def get_branding(user = Depends(get_current_user)):
    """Get organization branding settings"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    branding = await db.branding.find_one({"org_id": org_id}, {"_id": 0})
    
    if not branding:
        return {
            "logo_url": "",
            "primary_color": "#3b82f6",
            "company_name": ""
        }
    
    return branding

@api_router.post("/branding")
async def update_branding(
    primary_color: str = Form("#3b82f6"),
    company_name: str = Form(""),
    remove_logo: str = Form(None),
    logo: UploadFile = File(None),
    user = Depends(get_current_user)
):
    """Update organization branding settings"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    
    # Check plan allows branding
    org = await db.organizations.find_one({"id": org_id})
    plan = org.get("plan", "free") if org else "free"
    
    if plan != "pro":
        raise HTTPException(status_code=403, detail="Custom branding requires Pro plan")
    
    branding_data = {
        "org_id": org_id,
        "primary_color": primary_color,
        "company_name": company_name,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Handle logo upload
    if logo:
        logo_dir = UPLOAD_DIR / "logos"
        logo_dir.mkdir(exist_ok=True)
        
        ext = logo.filename.split(".")[-1] if logo.filename else "png"
        logo_filename = f"{org_id}_logo.{ext}"
        logo_path = logo_dir / logo_filename
        
        with open(logo_path, "wb") as f:
            content = await logo.read()
            f.write(content)
        
        branding_data["logo_url"] = f"/uploads/logos/{logo_filename}"
    elif remove_logo == "true":
        branding_data["logo_url"] = ""
    else:
        # Keep existing logo if not removing
        existing = await db.branding.find_one({"org_id": org_id})
        if existing:
            branding_data["logo_url"] = existing.get("logo_url", "")
    
    await db.branding.update_one(
        {"org_id": org_id},
        {"$set": branding_data},
        upsert=True
    )
    
    return {"message": "Branding updated successfully"}


# ============== SCREENING CREDITS ENDPOINTS ==============

SCREENING_PACKAGES = {
    "single": {"credits": 1, "price": 3900},  # $39
    "pack5": {"credits": 5, "price": 17500},  # $175
    "pack10": {"credits": 10, "price": 32000},  # $320
    "pack25": {"credits": 25, "price": 72500}  # $725
}


# ============== RENT PAYMENTS ENDPOINTS ==============

class RentPaymentCreate(BaseModel):
    tenant_id: str
    unit_id: str
    amount: float
    due_date: str
    notes: Optional[str] = None

class RecordPaymentRequest(BaseModel):
    amount: float
    payment_method: str = "check"
    notes: Optional[str] = None

@api_router.get("/rent-payments")
async def get_rent_payments(
    org_id: str,
    month: int = None,
    year: int = None,
    status: str = None,
    user = Depends(get_current_user)
):
    """Get rent payments for organization"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership or membership['org_id'] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"org_id": org_id}
    
    if month and year:
        # Filter by month/year
        start_date = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        query["due_date"] = {"$gte": start_date.isoformat(), "$lt": end_date.isoformat()}
    
    if status and status != 'all':
        query["status"] = status
    
    payments = await db.rent_payments.find(query, {"_id": 0}).sort("due_date", -1).to_list(500)
    return payments

@api_router.get("/rent-payments/summary")
async def get_rent_payments_summary(
    org_id: str,
    month: int = None,
    year: int = None,
    user = Depends(get_current_user)
):
    """Get rent payment summary for organization"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership or membership['org_id'] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"org_id": org_id}
    
    if month and year:
        start_date = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        query["due_date"] = {"$gte": start_date.isoformat(), "$lt": end_date.isoformat()}
    
    payments = await db.rent_payments.find(query, {"_id": 0}).to_list(500)
    
    total_expected = sum(p.get("amount", 0) for p in payments)
    total_collected = sum(p.get("paid_amount", 0) for p in payments if p.get("status") == "paid")
    pending_count = len([p for p in payments if p.get("status") == "pending"])
    paid_count = len([p for p in payments if p.get("status") == "paid"])
    overdue_count = len([p for p in payments if p.get("status") == "overdue"])
    
    return {
        "total_expected": total_expected,
        "total_collected": total_collected,
        "outstanding": total_expected - total_collected,
        "collection_rate": round((total_collected / total_expected * 100) if total_expected > 0 else 0, 1),
        "pending_count": pending_count,
        "paid_count": paid_count,
        "overdue_count": overdue_count,
        "total_payments": len(payments)
    }

@api_router.post("/rent-payments")
async def create_rent_payment(
    org_id: str,
    data: RentPaymentCreate,
    user = Depends(get_current_user)
):
    """Create a rent payment record"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership or membership['org_id'] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get tenant and unit info
    tenant = await db.tenants.find_one({"id": data.tenant_id, "org_id": org_id})
    unit = await db.units.find_one({"id": data.unit_id, "org_id": org_id})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    due_date = datetime.fromisoformat(data.due_date.replace('Z', '+00:00'))
    status = "overdue" if due_date < now else "pending"
    
    payment_doc = {
        "id": payment_id,
        "org_id": org_id,
        "tenant_id": data.tenant_id,
        "tenant_name": f"{tenant['first_name']} {tenant['last_name']}",
        "tenant_email": tenant.get("email"),
        "unit_id": data.unit_id,
        "unit_number": unit.get("unit_number") if unit else None,
        "property_name": unit.get("property_name") if unit else None,
        "amount": data.amount,
        "paid_amount": 0,
        "due_date": data.due_date,
        "status": status,
        "notes": data.notes,
        "created_by": user['id'],
        "created_at": now.isoformat()
    }
    
    await db.rent_payments.insert_one(payment_doc)
    
    return {"id": payment_id, "message": "Rent payment created"}

@api_router.post("/rent-payments/{payment_id}/record")
async def record_payment(
    payment_id: str,
    data: RecordPaymentRequest,
    user = Depends(get_current_user)
):
    """Record a payment received"""
    payment = await db.rent_payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership or membership['org_id'] != payment['org_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    now = datetime.now(timezone.utc)
    new_paid_amount = payment.get("paid_amount", 0) + data.amount
    new_status = "paid" if new_paid_amount >= payment['amount'] else "partial"
    
    await db.rent_payments.update_one(
        {"id": payment_id},
        {"$set": {
            "paid_amount": new_paid_amount,
            "status": new_status,
            "payment_method": data.payment_method,
            "payment_date": now.isoformat(),
            "payment_notes": data.notes
        }}
    )
    
    return {"message": "Payment recorded", "new_status": new_status}

@api_router.post("/rent-payments/generate-monthly")
async def generate_monthly_payments(
    org_id: str,
    month: int,
    year: int,
    user = Depends(get_current_user)
):
    """Generate rent payment records for all active tenants"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership or membership['org_id'] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all active tenants with their units
    tenants = await db.tenants.find({"org_id": org_id, "status": "active"}, {"_id": 0}).to_list(500)
    
    created_count = 0
    skipped_count = 0
    
    for tenant in tenants:
        unit = await db.units.find_one({"tenant_id": tenant['id'], "org_id": org_id})
        if not unit or not unit.get("rent"):
            skipped_count += 1
            continue
        
        # Check if payment already exists for this tenant/month
        due_date = datetime(year, month, 1, tzinfo=timezone.utc)
        existing = await db.rent_payments.find_one({
            "tenant_id": tenant['id'],
            "org_id": org_id,
            "due_date": {"$regex": f"^{year}-{month:02d}"}
        })
        
        if existing:
            skipped_count += 1
            continue
        
        payment_id = str(uuid.uuid4())
        payment_doc = {
            "id": payment_id,
            "org_id": org_id,
            "tenant_id": tenant['id'],
            "tenant_name": f"{tenant['first_name']} {tenant['last_name']}",
            "tenant_email": tenant.get("email"),
            "unit_id": unit['id'],
            "unit_number": unit.get("unit_number"),
            "property_name": unit.get("property_name"),
            "amount": unit['rent'],
            "paid_amount": 0,
            "due_date": due_date.isoformat(),
            "status": "pending",
            "created_by": user['id'],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.rent_payments.insert_one(payment_doc)
        created_count += 1
    
    return {
        "message": f"Generated {created_count} payment records, skipped {skipped_count}",
        "created": created_count,
        "skipped": skipped_count
    }


@api_router.get("/screening/credits")
async def get_screening_credits(user = Depends(get_current_user)):
    """Get organization's screening credit balance"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    
    # Get credit balance
    credits_doc = await db.screening_credits.find_one({"org_id": org_id})
    
    if not credits_doc:
        # Initialize with 0 credits
        credits_doc = {
            "org_id": org_id,
            "balance": 0,
            "purchased": 0,
            "plan_included": 0,
            "used": 0
        }
        await db.screening_credits.insert_one(credits_doc)
    
    return {
        "balance": credits_doc.get("balance", 0),
        "purchased": credits_doc.get("purchased", 0),
        "plan_included": credits_doc.get("plan_included", 0),
        "used": credits_doc.get("used", 0)
    }


class PurchaseCreditsRequest(BaseModel):
    package_id: str
    return_url: str = None

@api_router.post("/screening/purchase-credits")
async def purchase_screening_credits(
    data: PurchaseCreditsRequest,
    user = Depends(get_current_user)
):
    """Purchase screening credits via Stripe"""
    if data.package_id not in SCREENING_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    package = SCREENING_PACKAGES[data.package_id]
    
    # Check if Stripe is configured
    if not stripe.api_key:
        # Simulate purchase for demo
        await db.screening_credits.update_one(
            {"org_id": org_id},
            {
                "$inc": {
                    "balance": package["credits"],
                    "purchased": package["credits"]
                },
                "$setOnInsert": {"org_id": org_id}
            },
            upsert=True
        )
        return {"success": True, "credits_added": package["credits"], "message": "Credits added (demo mode)"}
    
    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Tenant Screening Credits ({package['credits']} screenings)",
                        "description": f"Purchase {package['credits']} tenant screening credits for MyPropOps"
                    },
                    "unit_amount": package["price"],
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=data.return_url or f"{os.environ.get('FRONTEND_URL', '')}/screening?success=true",
            cancel_url=data.return_url or f"{os.environ.get('FRONTEND_URL', '')}/screening?canceled=true",
            metadata={
                "org_id": org_id,
                "package_id": data.package_id,
                "credits": str(package["credits"]),
                "type": "screening_credits"
            }
        )
        
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@api_router.post("/screening/use-credit")
async def use_screening_credit(user = Depends(get_current_user)):
    """Deduct one screening credit (called internally when screening is submitted)"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    
    # Check and deduct credit
    result = await db.screening_credits.find_one_and_update(
        {"org_id": org_id, "balance": {"$gt": 0}},
        {"$inc": {"balance": -1, "used": 1}},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=402, detail="No screening credits available")
    
    return {"success": True, "remaining_credits": result["balance"]}


# ============== TWO-FACTOR AUTHENTICATION (2FA) ENDPOINTS ==============

import pyotp
import qrcode
import io
import base64

# ============== AI-POWERED INSIGHTS ENDPOINTS ==============

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

class AIInsightsRequest(BaseModel):
    question: Optional[str] = None
    insight_type: str = "general"  # general, occupancy, maintenance, revenue, forecast

@api_router.post("/ai/insights")
async def get_ai_insights(data: AIInsightsRequest, user = Depends(get_current_user)):
    """Generate AI-powered insights from property data"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    
    # Check plan allows AI features (Pro only)
    org = await db.organizations.find_one({"id": org_id})
    plan = org.get("plan", "free") if org else "free"
    
    if plan != "pro":
        raise HTTPException(status_code=403, detail="AI insights require Pro plan")
    
    # Gather data for analysis
    properties = await db.properties.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    tenants = await db.tenants.find({"org_id": org_id, "status": "active"}, {"_id": 0}).to_list(500)
    units = await db.units.find({"org_id": org_id}, {"_id": 0}).to_list(500)
    maintenance = await db.maintenance_requests.find({"org_id": org_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    rent_payments = await db.rent_payments.find({"org_id": org_id}, {"_id": 0}).sort("due_date", -1).to_list(100)
    
    # Calculate key metrics
    total_units = len(units)
    occupied_units = len([u for u in units if u.get("tenant_id")])
    occupancy_rate = round((occupied_units / total_units * 100) if total_units > 0 else 0)
    
    total_rent_expected = sum([u.get("rent", 0) for u in units if u.get("tenant_id")])
    total_collected = sum([p.get("paid_amount", 0) for p in rent_payments if p.get("status") == "paid"])
    
    open_maintenance = len([m for m in maintenance if m.get("status") in ["pending", "in_progress"]])
    emergency_maintenance = len([m for m in maintenance if m.get("priority") == "emergency"])
    
    # Build context for AI
    context = f"""
Property Portfolio Summary:
- Total Properties: {len(properties)}
- Total Units: {total_units}
- Occupied Units: {occupied_units}
- Occupancy Rate: {occupancy_rate}%
- Active Tenants: {len(tenants)}
- Monthly Expected Revenue: ${total_rent_expected:,.2f}
- Open Maintenance Requests: {open_maintenance}
- Emergency Maintenance: {emergency_maintenance}

Recent Maintenance Issues:
{chr(10).join([f"- {m.get('title', 'Unknown')}: {m.get('status', 'Unknown')} ({m.get('priority', 'normal')})" for m in maintenance[:10]])}

Recent Rent Collection:
- Total payments this period: {len(rent_payments)}
- Paid: {len([p for p in rent_payments if p.get('status') == 'paid'])}
- Pending: {len([p for p in rent_payments if p.get('status') == 'pending'])}
- Overdue: {len([p for p in rent_payments if p.get('status') == 'overdue'])}
"""
    
    # Generate AI insight
    system_message = """You are an AI assistant for property managers. Analyze the provided data and give actionable insights.
Be concise, specific, and focus on:
1. Key observations from the data
2. Potential issues or risks
3. Opportunities for improvement
4. Specific action items

Keep responses under 300 words. Use bullet points for clarity."""
    
    if data.insight_type == "occupancy":
        user_prompt = f"Analyze occupancy trends and suggest ways to improve vacancy rates:\n\n{context}"
    elif data.insight_type == "maintenance":
        user_prompt = f"Analyze maintenance patterns and suggest proactive measures:\n\n{context}"
    elif data.insight_type == "revenue":
        user_prompt = f"Analyze revenue and rent collection, suggest optimization strategies:\n\n{context}"
    elif data.insight_type == "forecast":
        user_prompt = f"Based on current data, provide a 3-month forecast and recommendations:\n\n{context}"
    elif data.question:
        user_prompt = f"Answer this question about the property portfolio: {data.question}\n\nData:\n{context}"
    else:
        user_prompt = f"Provide a brief executive summary of this property portfolio with key insights and recommendations:\n\n{context}"
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"insights-{org_id}-{datetime.now().timestamp()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        return {
            "insight": response,
            "insight_type": data.insight_type,
            "metrics": {
                "occupancy_rate": occupancy_rate,
                "total_properties": len(properties),
                "total_units": total_units,
                "active_tenants": len(tenants),
                "open_maintenance": open_maintenance,
                "monthly_revenue": total_rent_expected
            }
        }
    except Exception as e:
        logger.error(f"AI insights error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate AI insights")


@api_router.get("/ai/quick-stats")
async def get_ai_quick_stats(user = Depends(get_current_user)):
    """Get quick AI-generated stats for dashboard"""
    membership = await db.memberships.find_one({"user_id": user['id']})
    if not membership:
        raise HTTPException(status_code=403, detail="No organization membership")
    
    org_id = membership['org_id']
    
    # Calculate stats
    properties = await db.properties.count_documents({"org_id": org_id})
    units = await db.units.find({"org_id": org_id}, {"_id": 0, "tenant_id": 1, "rent": 1}).to_list(1000)
    tenants = await db.tenants.count_documents({"org_id": org_id, "status": "active"})
    open_maintenance = await db.maintenance_requests.count_documents({"org_id": org_id, "status": {"$in": ["pending", "in_progress"]}})
    
    total_units = len(units)
    occupied = len([u for u in units if u.get("tenant_id")])
    monthly_revenue = sum([u.get("rent", 0) for u in units if u.get("tenant_id")])
    
    return {
        "properties": properties,
        "units": total_units,
        "occupied_units": occupied,
        "occupancy_rate": round((occupied / total_units * 100) if total_units > 0 else 0),
        "active_tenants": tenants,
        "monthly_revenue": monthly_revenue,
        "open_maintenance": open_maintenance
    }


class Enable2FARequest(BaseModel):
    password: str

class Verify2FARequest(BaseModel):
    code: str

class Disable2FARequest(BaseModel):
    password: str
    code: str

@api_router.get("/auth/2fa/status")
async def get_2fa_status(user = Depends(get_current_user)):
    """Get user's 2FA status"""
    user_doc = await db.users.find_one({"id": user['id']})
    
    # Check if user's org has Pro plan
    membership = await db.memberships.find_one({"user_id": user['id']})
    has_pro = False
    if membership:
        org = await db.organizations.find_one({"id": membership['org_id']})
        has_pro = org.get("plan") == "pro" if org else False
    
    return {
        "enabled": user_doc.get("two_factor_enabled", False),
        "plan_allows_2fa": has_pro,
        "setup_complete": user_doc.get("two_factor_verified", False)
    }

@api_router.post("/auth/2fa/setup")
async def setup_2fa(data: Enable2FARequest, user = Depends(get_current_user)):
    """Initialize 2FA setup - generates secret and QR code"""
    user_doc = await db.users.find_one({"id": user['id']})
    
    # Verify password
    if not verify_password(data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Check if user's org has Pro plan
    membership = await db.memberships.find_one({"user_id": user['id']})
    if membership:
        org = await db.organizations.find_one({"id": membership['org_id']})
        if not org or org.get("plan") != "pro":
            raise HTTPException(status_code=403, detail="Two-factor authentication requires Pro plan")
    
    # Generate secret
    secret = pyotp.random_base32()
    
    # Create TOTP object
    totp = pyotp.TOTP(secret)
    
    # Generate provisioning URI for authenticator apps
    provisioning_uri = totp.provisioning_uri(
        name=user_doc['email'],
        issuer_name="MyPropOps"
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Store secret temporarily (not verified yet)
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {
            "two_factor_secret": secret,
            "two_factor_enabled": False,
            "two_factor_verified": False
        }}
    )
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "message": "Scan the QR code with your authenticator app, then verify with a code"
    }

@api_router.post("/auth/2fa/verify")
async def verify_2fa_setup(data: Verify2FARequest, user = Depends(get_current_user)):
    """Verify 2FA setup with a code from authenticator app"""
    user_doc = await db.users.find_one({"id": user['id']})
    
    secret = user_doc.get("two_factor_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
    
    # Verify the code
    totp = pyotp.TOTP(secret)
    if not totp.verify(data.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid verification code")
    
    # Generate backup codes
    backup_codes = [pyotp.random_base32()[:8] for _ in range(10)]
    hashed_backup_codes = [hashlib.sha256(code.encode()).hexdigest() for code in backup_codes]
    
    # Enable 2FA
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {
            "two_factor_enabled": True,
            "two_factor_verified": True,
            "two_factor_backup_codes": hashed_backup_codes,
            "two_factor_enabled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": "Two-factor authentication enabled successfully",
        "backup_codes": backup_codes,
        "warning": "Save these backup codes securely. They can only be shown once."
    }

@api_router.post("/auth/2fa/disable")
async def disable_2fa(data: Disable2FARequest, user = Depends(get_current_user)):
    """Disable 2FA"""
    user_doc = await db.users.find_one({"id": user['id']})
    
    # Verify password
    if not verify_password(data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Verify 2FA code
    secret = user_doc.get("two_factor_secret")
    if secret:
        totp = pyotp.TOTP(secret)
        if not totp.verify(data.code, valid_window=1):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    # Disable 2FA
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {
            "two_factor_enabled": False,
            "two_factor_verified": False,
            "two_factor_secret": None,
            "two_factor_backup_codes": None
        }}
    )
    
    return {"success": True, "message": "Two-factor authentication disabled"}

@api_router.post("/auth/2fa/validate")
async def validate_2fa_code(data: Verify2FARequest, user = Depends(get_current_user)):
    """Validate a 2FA code (used during login)"""
    user_doc = await db.users.find_one({"id": user['id']})
    
    if not user_doc.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA not enabled for this user")
    
    secret = user_doc.get("two_factor_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA not configured")
    
    # Try TOTP code first
    totp = pyotp.TOTP(secret)
    if totp.verify(data.code, valid_window=1):
        return {"success": True, "method": "totp"}
    
    # Try backup codes
    backup_codes = user_doc.get("two_factor_backup_codes", [])
    code_hash = hashlib.sha256(data.code.encode()).hexdigest()
    
    if code_hash in backup_codes:
        # Remove used backup code
        backup_codes.remove(code_hash)
        await db.users.update_one(
            {"id": user['id']},
            {"$set": {"two_factor_backup_codes": backup_codes}}
        )
        return {"success": True, "method": "backup_code", "remaining_backup_codes": len(backup_codes)}
    
    raise HTTPException(status_code=401, detail="Invalid 2FA code")


# ============== ADMIN DASHBOARD ==============

# Admin credentials - In production, store in database with hashed passwords
ADMIN_CREDENTIALS = {
    "admin@mypropops.com": os.environ.get("ADMIN_PASSWORD", "AdminPass123!")
}

class AdminLoginRequest(BaseModel):
    email: str
    password: str

async def get_current_admin(authorization: str = Header(None)):
    """Verify admin JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid admin token")

@api_router.post("/admin/login")
async def admin_login(data: AdminLoginRequest):
    """Admin login endpoint"""
    if data.email not in ADMIN_CREDENTIALS:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if data.password != ADMIN_CREDENTIALS[data.email]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({
        "type": "admin",
        "email": data.email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")
    
    return {"token": token, "email": data.email}

@api_router.get("/admin/stats")
async def get_admin_stats(admin = Depends(get_current_admin)):
    """Get platform-wide statistics"""
    total_users = await db.users.count_documents({})
    total_organizations = await db.organizations.count_documents({})
    total_properties = await db.properties.count_documents({})
    total_units = await db.units.count_documents({})
    total_tenants = await db.tenants.count_documents({})
    total_maintenance = await db.maintenance_requests.count_documents({})
    
    # Subscription breakdown
    free_users = await db.users.count_documents({"subscription_plan": {"$in": [None, "", "free"]}})
    standard_users = await db.users.count_documents({"subscription_plan": "standard"})
    pro_users = await db.users.count_documents({"subscription_plan": "pro"})
    
    # Calculate MRR (Monthly Recurring Revenue)
    mrr = (standard_users * 49) + (pro_users * 149)
    
    return {
        "total_users": total_users,
        "total_organizations": total_organizations,
        "total_properties": total_properties,
        "total_units": total_units,
        "total_tenants": total_tenants,
        "total_maintenance": total_maintenance,
        "free_users": free_users,
        "standard_users": standard_users,
        "pro_users": pro_users,
        "mrr": mrr
    }

@api_router.get("/admin/users")
async def get_admin_users(admin = Depends(get_current_admin), skip: int = 0, limit: int = 100):
    """Get all users"""
    users = await db.users.find(
        {},
        {"_id": 0, "password": 0, "two_factor_secret": 0, "two_factor_backup_codes": 0}
    ).skip(skip).limit(limit).to_list(limit)
    return users

@api_router.delete("/admin/users/{user_id}")
async def delete_admin_user(user_id: str, admin = Depends(get_current_admin)):
    """Delete a user"""
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@api_router.get("/admin/organizations")
async def get_admin_organizations(admin = Depends(get_current_admin)):
    """Get all organizations with stats"""
    organizations = await db.organizations.find({}, {"_id": 0}).to_list(1000)
    
    # Enrich with counts
    for org in organizations:
        org["property_count"] = await db.properties.count_documents({"org_id": org["id"]})
        org["unit_count"] = await db.units.count_documents({"org_id": org["id"]})
        
        # Get owner email - first try owner_id, then fall back to first admin membership
        owner = None
        if org.get("owner_id"):
            owner = await db.users.find_one({"id": org.get("owner_id")}, {"_id": 0, "email": 1})
        
        if not owner:
            # Fall back to first admin membership
            admin_membership = await db.memberships.find_one(
                {"org_id": org["id"], "role": "admin"},
                {"_id": 0, "user_id": 1}
            )
            if admin_membership:
                owner = await db.users.find_one(
                    {"id": admin_membership["user_id"]},
                    {"_id": 0, "email": 1}
                )
        
        org["owner_email"] = owner.get("email") if owner else "Unknown"
    
    return organizations

@api_router.get("/admin/audit-logs")
async def get_admin_audit_logs(admin = Depends(get_current_admin), limit: int = 100):
    """Get platform-wide audit logs"""
    logs = await db.audit_logs.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # If no logs exist, return sample data
    if not logs:
        logs = [
            {"action": "User registered", "type": "info", "details": "New user signup", "user_email": "user@example.com", "created_at": datetime.now(timezone.utc).isoformat()},
            {"action": "Subscription upgraded", "type": "info", "details": "User upgraded to Pro", "user_email": "user@example.com", "created_at": datetime.now(timezone.utc).isoformat()},
            {"action": "Property created", "type": "info", "details": "New property added", "user_email": "user@example.com", "created_at": datetime.now(timezone.utc).isoformat()}
        ]
    
    return logs

@api_router.delete("/admin/blog/{post_id}")
async def delete_admin_blog_post(post_id: str, admin = Depends(get_current_admin)):
    """Delete a blog post"""
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted"}

@api_router.put("/admin/feature-flags")
async def update_feature_flags(flags: dict, admin = Depends(get_current_admin)):
    """Update feature flags"""
    await db.system_settings.update_one(
        {"type": "feature_flags"},
        {"$set": {"flags": flags, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Feature flags updated"}

@api_router.get("/admin/feature-flags")
async def get_feature_flags(admin = Depends(get_current_admin)):
    """Get current feature flags"""
    settings = await db.system_settings.find_one({"type": "feature_flags"}, {"_id": 0})
    if settings and "flags" in settings:
        return settings["flags"]
    return {
        "maintenance_requests": True,
        "tenant_screening": True,
        "ai_insights": True,
        "auto_blog": True
    }

@api_router.get("/admin/users/{user_id}")
async def get_admin_user_details(user_id: str, admin = Depends(get_current_admin)):
    """Get detailed user information"""
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password": 0, "two_factor_secret": 0, "two_factor_backup_codes": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's memberships and organizations
    memberships = await db.memberships.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    org_ids = [m["org_id"] for m in memberships]
    organizations = await db.organizations.find({"id": {"$in": org_ids}}, {"_id": 0}).to_list(100)
    
    # Get activity stats
    properties_count = 0
    units_count = 0
    tenants_count = 0
    maintenance_count = 0
    
    for org_id in org_ids:
        properties_count += await db.properties.count_documents({"org_id": org_id})
        units_count += await db.units.count_documents({"org_id": org_id})
        tenants_count += await db.tenants.count_documents({"org_id": org_id})
        maintenance_count += await db.maintenance_requests.count_documents({"org_id": org_id})
    
    user["organizations"] = organizations
    user["memberships"] = memberships
    user["stats"] = {
        "properties": properties_count,
        "units": units_count,
        "tenants": tenants_count,
        "maintenance_requests": maintenance_count
    }
    
    return user

@api_router.put("/admin/users/{user_id}/status")
async def toggle_user_status(user_id: str, admin = Depends(get_current_admin)):
    """Enable or disable a user account"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("disabled", False)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"disabled": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log the action
    await db.audit_logs.insert_one({
        "action": f"User {'disabled' if new_status else 'enabled'}",
        "type": "warning" if new_status else "info",
        "details": f"User {user.get('email')} was {'disabled' if new_status else 'enabled'} by admin",
        "user_email": user.get("email"),
        "admin_action": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"User {'disabled' if new_status else 'enabled'}", "disabled": new_status}

@api_router.post("/admin/users/{user_id}/impersonate")
async def impersonate_user(user_id: str, admin = Depends(get_current_admin)):
    """Generate a token to impersonate a user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate an impersonation token
    token = jwt.encode({
        "user_id": user["id"],
        "email": user["email"],
        "impersonated_by": admin["email"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=2)
    }, JWT_SECRET, algorithm="HS256")
    
    # Log the impersonation
    await db.audit_logs.insert_one({
        "action": "User impersonation",
        "type": "warning",
        "details": f"Admin impersonated user {user.get('email')}",
        "user_email": user.get("email"),
        "admin_email": admin["email"],
        "admin_action": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"token": token, "user": user}

class AdminBlogPost(BaseModel):
    title: str
    excerpt: str
    content: str
    category: str = "Property Management"
    status: str = "published"
    meta_description: Optional[str] = None
    keywords: Optional[List[str]] = None

@api_router.post("/admin/blog")
async def create_admin_blog_post(post: AdminBlogPost, admin = Depends(get_current_admin)):
    """Create a new blog post"""
    slug = post.title.lower().replace(" ", "-").replace("'", "").replace('"', "")
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    blog_post = {
        "id": str(uuid.uuid4()),
        "title": post.title,
        "slug": slug,
        "excerpt": post.excerpt,
        "content": post.content,
        "category": post.category,
        "status": post.status,
        "author": "MyPropOps Team",
        "read_time": max(1, len(post.content.split()) // 200),
        "meta_description": post.meta_description or post.excerpt[:160],
        "keywords": post.keywords or [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "published_at": datetime.now(timezone.utc).isoformat() if post.status == "published" else None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blog_posts.insert_one(blog_post)
    if "_id" in blog_post:
        del blog_post["_id"]
    
    return blog_post

@api_router.put("/admin/blog/{post_id}")
async def update_admin_blog_post(post_id: str, post: AdminBlogPost, admin = Depends(get_current_admin)):
    """Update a blog post"""
    existing = await db.blog_posts.find_one({"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    update_data = {
        "title": post.title,
        "excerpt": post.excerpt,
        "content": post.content,
        "category": post.category,
        "status": post.status,
        "meta_description": post.meta_description or post.excerpt[:160],
        "keywords": post.keywords or [],
        "read_time": max(1, len(post.content.split()) // 200),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if post.status == "published" and existing.get("status") != "published":
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.blog_posts.update_one({"id": post_id}, {"$set": update_data})
    
    updated = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return updated

@api_router.get("/admin/blog/{post_id}")
async def get_admin_blog_post(post_id: str, admin = Depends(get_current_admin)):
    """Get a blog post by ID (including drafts)"""
    post = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post

@api_router.get("/admin/blog")
async def get_admin_all_blog_posts(admin = Depends(get_current_admin)):
    """Get all blog posts including drafts"""
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return posts


# ============== BLOG SYSTEM ==============

class BlogPostCreate(BaseModel):
    title: str
    excerpt: str
    content: str
    category: str = "Property Management"
    image_url: Optional[str] = None
    read_time: int = 5

@api_router.get("/blog/posts")
async def get_blog_posts(limit: int = 20, category: str = None):
    """Get all published blog posts"""
    query = {"status": "published"}
    if category and category != "all":
        query["category"] = category
    
    posts = await db.blog_posts.find(
        query,
        {"_id": 0}
    ).sort("published_at", -1).limit(limit).to_list(limit)
    
    return posts

@api_router.get("/blog/posts/{slug}")
async def get_blog_post(slug: str):
    """Get a single blog post by slug"""
    post = await db.blog_posts.find_one(
        {"slug": slug, "status": "published"},
        {"_id": 0}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@api_router.post("/blog/generate")
async def generate_blog_post(topic: str = None):
    """Generate an SEO-optimized blog post using AI"""
    
    # SEO-focused topics with target keywords
    topics_with_keywords = [
        {"topic": "Tenant Screening Best Practices", "keywords": ["tenant screening", "background check", "rental application", "credit check tenant"]},
        {"topic": "Late Rent Payment Solutions", "keywords": ["late rent payment", "rent collection", "tenant payment plans", "landlord rent tips"]},
        {"topic": "Property Inspection Checklist", "keywords": ["property inspection", "rental inspection checklist", "move-in inspection", "landlord inspection guide"]},
        {"topic": "Increase Rental Property ROI", "keywords": ["rental property ROI", "maximize rental income", "property investment returns", "landlord profit tips"]},
        {"topic": "Difficult Tenant Management", "keywords": ["difficult tenants", "tenant disputes", "landlord tenant conflict", "problem tenant solutions"]},
        {"topic": "Fair Housing Compliance Guide", "keywords": ["fair housing laws", "housing discrimination", "landlord legal requirements", "rental compliance"]},
        {"topic": "Maintenance Request Management", "keywords": ["maintenance requests", "property maintenance", "rental repairs", "landlord maintenance tips"]},
        {"topic": "Landlord Tenant Communication", "keywords": ["landlord tenant relationship", "tenant communication", "property management communication", "tenant retention"]},
        {"topic": "Property Management Automation", "keywords": ["property management software", "landlord automation", "rental management tools", "proptech solutions"]},
        {"topic": "Section 8 Housing Guide", "keywords": ["Section 8 housing", "HUD rental program", "housing voucher landlord", "affordable housing"]},
        {"topic": "Rental Pricing Strategy", "keywords": ["rental pricing", "rent price analysis", "market rent calculation", "competitive rental rates"]},
        {"topic": "Eviction Process Guide", "keywords": ["eviction process", "tenant eviction", "legal eviction steps", "landlord eviction rights"]},
        {"topic": "Property Management Software Guide", "keywords": ["property management software", "landlord software", "rental management app", "best PM software"]},
        {"topic": "Landlord Tax Deductions", "keywords": ["landlord tax deductions", "rental property taxes", "property tax write-offs", "real estate tax tips"]},
        {"topic": "Emergency Repair Protocol", "keywords": ["emergency repairs", "urgent maintenance", "rental emergency response", "landlord repair duties"]}
    ]
    
    import random
    
    # Pick random topic with keywords if not provided
    if topic:
        selected = {"topic": topic, "keywords": ["property management", "landlord tips", "rental property"]}
    else:
        selected = random.choice(topics_with_keywords)
    
    selected_topic = selected["topic"]
    target_keywords = selected["keywords"]
    
    categories = ["Property Management", "Landlord Tips", "Legal & Compliance", "Technology"]
    selected_category = random.choice(categories[:3])
    
    try:
        # SEO-optimized system message
        system_message = """You are an expert SEO content writer for MyPropOps, a leading property management software company. 
You specialize in creating high-ranking, engaging blog content for landlords and property managers.
Your content consistently ranks on the first page of Google because you understand:
- Search intent and user needs
- Strategic keyword placement (title, H1, H2s, first paragraph, throughout)
- Proper content structure with clear hierarchy
- E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness)
- Engaging hooks and compelling CTAs"""
        
        prompt = f"""Create an SEO-optimized blog post about: "{selected_topic}"

TARGET KEYWORDS (use naturally throughout): {', '.join(target_keywords)}

REQUIREMENTS:

1. SEO TITLE (50-60 characters):
   - Include primary keyword near the beginning
   - Use power words (Ultimate, Complete, Essential, Proven, Expert)
   - Make it compelling and click-worthy

2. META DESCRIPTION (150-160 characters):
   - Include primary keyword
   - Clear value proposition
   - Call-to-action hint

3. CONTENT STRUCTURE:
   - Opening hook that addresses reader's pain point (use primary keyword in first 100 words)
   - 3-5 H2 subheadings with keywords where natural
   - H3 subheadings for detailed sections
   - Bullet points and numbered lists for scannability
   - 1000-1500 words total
   - Internal linking suggestions marked as [INTERNAL LINK: topic]
   - Strong CTA mentioning MyPropOps at the end

4. SEO BEST PRACTICES:
   - Use keywords 3-5 times naturally (avoid stuffing)
   - Include semantic variations and LSI keywords
   - Write for humans first, search engines second
   - Answer the "People Also Ask" questions on this topic

FORMAT YOUR RESPONSE EXACTLY AS:
---
TITLE: [Your SEO-optimized title]
META_DESCRIPTION: [Your 150-160 character meta description]
KEYWORDS: [comma-separated list of 5-7 keywords used]
READ_TIME: [estimated minutes]
EXCERPT: [2-3 sentence compelling summary for previews]
---

[HTML content starting with <p> - use <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em> tags]"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"blog-seo-{datetime.now().timestamp()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=prompt)
        response_text = await chat.send_message(user_message)
        
        # Parse AI response with enhanced SEO fields
        content_text = response_text
        
        # Extract SEO metadata
        lines = content_text.split('\n')
        title = selected_topic
        meta_description = ""
        keywords = target_keywords
        excerpt = ""
        read_time = 5
        content_start = 0
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            if line_lower.startswith('title:'):
                title = line.split(':', 1)[1].strip() if ':' in line else title
            elif line_lower.startswith('meta_description:') or line_lower.startswith('meta description:'):
                meta_description = line.split(':', 1)[1].strip() if ':' in line else ""
            elif line_lower.startswith('keywords:'):
                kw_str = line.split(':', 1)[1].strip() if ':' in line else ""
                keywords = [k.strip() for k in kw_str.split(',') if k.strip()]
            elif line_lower.startswith('read_time:') or line_lower.startswith('read time:'):
                try:
                    read_time = int(''.join(filter(str.isdigit, line)))
                    read_time = max(3, min(15, read_time))  # Clamp between 3-15 minutes
                except:
                    read_time = 5
            elif line_lower.startswith('excerpt:'):
                excerpt = line.split(':', 1)[1].strip() if ':' in line else ""
            elif '<p>' in line.lower() or '<h2>' in line.lower():
                content_start = i
                break
        
        content = '\n'.join(lines[content_start:])
        
        # Clean up content - remove any remaining metadata markers
        content = content.replace('---', '').strip()
        
        # If no meta description found, create from excerpt or content
        if not meta_description:
            if excerpt:
                meta_description = excerpt[:157] + "..." if len(excerpt) > 160 else excerpt
            else:
                import re
                p_match = re.search(r'<p>(.*?)</p>', content, re.DOTALL)
                if p_match:
                    clean_text = re.sub(r'<[^>]+>', '', p_match.group(1))
                    meta_description = clean_text[:157] + "..." if len(clean_text) > 160 else clean_text
        
        # If no excerpt found, create one
        if not excerpt:
            import re
            p_match = re.search(r'<p>(.*?)</p>', content, re.DOTALL)
            if p_match:
                excerpt = re.sub(r'<[^>]+>', '', p_match.group(1))[:250]
            else:
                excerpt = meta_description or selected_topic
        
        # Create SEO-friendly slug from title
        slug = title.lower()
        slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
        slug = '-'.join(slug.split())[:60]  # Limit slug length
        slug = f"{slug}-{str(uuid.uuid4())[:6]}"
        
        # Calculate word count
        import re
        word_count = len(re.sub(r'<[^>]+>', '', content).split())
        
        # Save to database with SEO metadata
        post = {
            "id": str(uuid.uuid4()),
            "slug": slug,
            "title": title,
            "excerpt": excerpt,
            "meta_description": meta_description,
            "keywords": keywords,
            "content": content,
            "category": selected_category,
            "read_time": read_time,
            "word_count": word_count,
            "image_url": None,
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "auto_generated": True,
            "seo_score": "optimized"
        }
        
        await db.blog_posts.insert_one(post)
        
        return {"success": True, "post_id": post["id"], "title": title, "slug": slug}
        
    except Exception as e:
        logger.error(f"Failed to generate blog post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate blog post: {str(e)}")

@api_router.post("/blog/schedule-generation")
async def schedule_blog_generation():
    """Check if blog post should be generated today (Monday, Thursday, Sunday)"""
    from datetime import datetime
    
    today = datetime.now(timezone.utc)
    day_of_week = today.weekday()  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    
    # Generate on Monday (0), Thursday (3), Sunday (6)
    publish_days = [0, 3, 6]
    
    if day_of_week not in publish_days:
        return {"message": f"Not a publish day. Current day: {today.strftime('%A')}", "should_publish": False}
    
    # Check if already published today
    today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.blog_posts.find_one({
        "published_at": {"$gte": today_start.isoformat()},
        "auto_generated": True
    })
    
    if existing:
        return {"message": "Already published today", "should_publish": False, "existing_post": existing.get("title")}
    
    # Generate new post
    result = await generate_blog_post()
    return {"message": "Blog post generated", "should_publish": True, "result": result}


# Include the router in the main app
app.include_router(api_router)

# Include new modular routers
from routers.screening import router as screening_router
from routers.payments import router as payments_router

app.include_router(screening_router, prefix="/api")
app.include_router(payments_router, prefix="/api")

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
