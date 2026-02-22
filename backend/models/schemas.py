from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime
from .enums import (
    UserRole, TenantStatus, InspectionStatus, DocumentCategory, InviteStatus,
    OrganizationPlan, ApplicationStage, DocumentChecklistStatus, HousingProgram,
    MaintenancePriority, MaintenanceStatus, MaintenanceCategory,
    ContractorSpecialty, ContractorStatus
)


# Auth Models
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
    role: Optional[UserRole] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Organization Models
class OrganizationCreate(BaseModel):
    name: str
    address: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    plan: str = "free"
    created_at: datetime


class MembershipResponse(BaseModel):
    organization_id: str
    organization_name: str
    role: UserRole
    is_owner: bool
    joined_at: datetime


class MemberResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    joined_at: datetime
    is_owner: bool = False


# Property Models
class PropertyCreate(BaseModel):
    name: str
    address: str
    property_type: str = "residential"
    unit_count: int = 1
    year_built: Optional[int] = None


class PropertyResponse(BaseModel):
    id: str
    name: str
    address: str
    property_type: str
    unit_count: int
    year_built: Optional[int] = None
    org_id: str
    created_at: datetime


# Unit Models
class UnitCreate(BaseModel):
    property_id: str
    unit_number: str
    bedrooms: int = 1
    bathrooms: float = 1.0
    square_feet: Optional[int] = None
    rent_amount: Optional[float] = None
    status: str = "vacant"


class UnitResponse(BaseModel):
    id: str
    property_id: str
    unit_number: str
    bedrooms: int
    bathrooms: float
    square_feet: Optional[int] = None
    rent_amount: Optional[float] = None
    status: str
    org_id: str
    created_at: datetime


# Tenant Models
class TenantCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    unit_id: Optional[str] = None
    lease_start: Optional[datetime] = None
    lease_end: Optional[datetime] = None


class TenantResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    unit_id: Optional[str] = None
    lease_start: Optional[datetime] = None
    lease_end: Optional[datetime] = None
    status: TenantStatus
    org_id: str
    created_at: datetime


# Inspection Models
class InspectionCreate(BaseModel):
    property_id: str
    unit_id: Optional[str] = None
    inspection_type: str
    scheduled_date: datetime


class InspectionUpdate(BaseModel):
    status: Optional[InspectionStatus] = None
    notes: Optional[str] = None
    completed_date: Optional[datetime] = None


class InspectionResponse(BaseModel):
    id: str
    property_id: str
    unit_id: Optional[str] = None
    inspection_type: str
    status: InspectionStatus
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    notes: Optional[str] = None
    inspector_id: Optional[str] = None
    org_id: str
    created_at: datetime


# Document Models
class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    category: DocumentCategory
    property_id: Optional[str] = None
    unit_id: Optional[str] = None
    tenant_id: Optional[str] = None
    uploaded_by: str
    org_id: str
    created_at: datetime


# Notification Models
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime


# Audit Log Models
class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[Dict] = None
    org_id: str
    created_at: datetime


# Dashboard Models
class DashboardStats(BaseModel):
    total_properties: int
    total_units: int
    total_tenants: int
    occupancy_rate: float
    pending_inspections: int
    upcoming_lease_expirations: int


# Invite Models
class InviteCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.staff


class InviteResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    status: InviteStatus
    org_id: str
    org_name: str
    invited_by: str
    invited_by_name: str
    created_at: datetime
    expires_at: datetime
    token: Optional[str] = None


class AcceptInviteRequest(BaseModel):
    token: str
    password: Optional[str] = None


# Calendar Models
class CalendarEvent(BaseModel):
    id: str
    title: str
    start: datetime
    end: Optional[datetime] = None
    type: str
    entity_id: str
    description: Optional[str] = None
    status: Optional[str] = None


class FeatureFlagsResponse(BaseModel):
    enable_maintenance_requests: bool
    enable_tenant_screening: bool
    enable_contractor_portal: bool
    enable_ai_insights: bool
    enable_rent_payments: bool


# Tenant Portal Models
class HouseholdMember(BaseModel):
    name: str
    relationship: str
    date_of_birth: Optional[str] = None
    ssn_last_4: Optional[str] = None
    income: Optional[float] = None


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
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    ssn_last_4: Optional[str] = None
    current_address: Optional[str] = None
    employer: Optional[str] = None
    employer_phone: Optional[str] = None
    monthly_income: Optional[float] = None
    housing_program: Optional[HousingProgram] = None
    household_members: List[HouseholdMember] = []


class TenantPortalProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    ssn_last_4: Optional[str] = None
    current_address: Optional[str] = None
    employer: Optional[str] = None
    employer_phone: Optional[str] = None
    monthly_income: Optional[float] = None
    housing_program: Optional[HousingProgram] = None
    household_members: Optional[List[HouseholdMember]] = None


class TenantPortalProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    current_address: Optional[str] = None
    employer: Optional[str] = None
    employer_phone: Optional[str] = None
    monthly_income: Optional[float] = None
    housing_program: Optional[HousingProgram] = None
    household_members: List[HouseholdMember] = []
    connected_organization: Optional[str] = None
    connected_organization_name: Optional[str] = None
    application_stage: ApplicationStage = ApplicationStage.not_started
    created_at: datetime


class DocumentChecklistItem(BaseModel):
    id: str
    document_type: str
    display_name: str
    description: str
    required: bool
    status: DocumentChecklistStatus
    uploaded_at: Optional[datetime] = None
    file_id: Optional[str] = None
    rejection_reason: Optional[str] = None


class ApplicationStatusResponse(BaseModel):
    stage: ApplicationStage
    updated_at: Optional[datetime] = None
    notes: Optional[str] = None


class TenantAppointment(BaseModel):
    id: str
    title: str
    appointment_type: str
    scheduled_date: datetime
    location: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime


class AppointmentCreate(BaseModel):
    title: str
    appointment_type: str
    scheduled_date: datetime
    location: Optional[str] = None
    notes: Optional[str] = None


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_type: str
    sender_id: str
    sender_name: str
    content: str
    read: bool
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_name: str
    org_id: str
    org_name: str
    subject: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int
    created_at: datetime


class DocumentRequestCreate(BaseModel):
    document_type: str
    notes: Optional[str] = None


class ConnectOrgRequest(BaseModel):
    invite_code: str


# Maintenance Request Models
class MaintenanceRequestCreate(BaseModel):
    org_id: str
    property_id: str
    unit_id: Optional[str] = None
    tenant_id: Optional[str] = None
    category: MaintenanceCategory
    priority: MaintenancePriority
    title: str
    description: str
    preferred_access_times: Optional[str] = None
    permission_to_enter: bool = False


class MaintenanceRequestUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    priority: Optional[MaintenancePriority] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None


class MaintenanceRequestResponse(BaseModel):
    id: str
    org_id: str
    property_id: str
    property_name: Optional[str] = None
    unit_id: Optional[str] = None
    unit_number: Optional[str] = None
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    category: MaintenanceCategory
    priority: MaintenancePriority
    status: MaintenanceStatus
    title: str
    description: str
    preferred_access_times: Optional[str] = None
    permission_to_enter: bool
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    photos: List[str] = []


class TenantMaintenanceRequestCreate(BaseModel):
    category: MaintenanceCategory
    priority: MaintenancePriority
    title: str
    description: str
    preferred_access_times: Optional[str] = None
    permission_to_enter: bool = False


# Contractor Models
class ContractorRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str
    company_name: Optional[str] = None
    license_number: Optional[str] = None
    specialties: List[ContractorSpecialty] = []
    service_area: Optional[str] = None


class ContractorLogin(BaseModel):
    email: EmailStr
    password: str


class ContractorResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: str
    company_name: Optional[str] = None
    license_number: Optional[str] = None
    specialties: List[ContractorSpecialty] = []
    service_area: Optional[str] = None
    status: ContractorStatus
    rating: Optional[float] = None
    jobs_completed: int = 0
    created_at: datetime


class ContractorProfileUpdate(BaseModel):
    phone: Optional[str] = None
    company_name: Optional[str] = None
    license_number: Optional[str] = None
    specialties: Optional[List[ContractorSpecialty]] = None
    service_area: Optional[str] = None


class ContractorJobResponse(BaseModel):
    id: str
    org_id: str
    org_name: str
    property_id: str
    property_name: str
    property_address: str
    unit_id: Optional[str] = None
    unit_number: Optional[str] = None
    category: MaintenanceCategory
    priority: MaintenancePriority
    status: MaintenanceStatus
    title: str
    description: str
    permission_to_enter: bool
    scheduled_date: Optional[datetime] = None
    assigned_at: datetime
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    photos: List[str] = []


class AssignContractorRequest(BaseModel):
    contractor_id: str
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None


class ContractorJobUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    notes: Optional[str] = None
    completion_notes: Optional[str] = None


# Screening Models
class ScreeningRequestCreate(BaseModel):
    tenant_id: str


class ScreeningResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_name: str
    status: str
    credit_score: Optional[int] = None
    criminal_check: Optional[str] = None
    eviction_history: Optional[str] = None
    income_verification: Optional[str] = None
    requested_at: datetime
    completed_at: Optional[datetime] = None


# Billing Models
class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class EmbeddedCheckoutResponse(BaseModel):
    client_secret: str
    session_id: str
    publishable_key: str


class SubscriptionStatusResponse(BaseModel):
    plan: str
    billing_period: str
    properties_used: int
    properties_limit: int
    units_used: int
    units_limit: int
    team_members_used: int
    team_members_limit: int
    features: List[str]
    subscription_active: bool
    plan_updated_at: Optional[datetime] = None
