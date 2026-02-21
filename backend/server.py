from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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
    PRO = "pro"
    ENTERPRISE = "enterprise"

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
