from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    staff = "staff"


class TenantStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    pending = "pending"


class InspectionStatus(str, Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"


class DocumentCategory(str, Enum):
    lease = "lease"
    inspection = "inspection"
    maintenance = "maintenance"
    legal = "legal"
    other = "other"


class InviteStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    expired = "expired"


class OrganizationPlan(str, Enum):
    free = "free"
    standard = "standard"
    pro = "pro"
    enterprise = "enterprise"


class ApplicationStage(str, Enum):
    not_started = "not_started"
    documents_submitted = "documents_submitted"
    under_review = "under_review"
    background_check = "background_check"
    inspection_scheduled = "inspection_scheduled"
    inspection_complete = "inspection_complete"
    approved = "approved"
    denied = "denied"


class DocumentChecklistStatus(str, Enum):
    pending = "pending"
    uploaded = "uploaded"
    approved = "approved"
    rejected = "rejected"


class HousingProgram(str, Enum):
    section_8 = "section_8"
    public_housing = "public_housing"
    lihtc = "lihtc"
    market_rate = "market_rate"
    emergency_housing = "emergency_housing"
    transitional = "transitional"


class MaintenancePriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    emergency = "emergency"


class MaintenanceStatus(str, Enum):
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"


class MaintenanceCategory(str, Enum):
    plumbing = "plumbing"
    electrical = "electrical"
    hvac = "hvac"
    appliances = "appliances"
    structural = "structural"
    pest_control = "pest_control"
    landscaping = "landscaping"
    other = "other"


class ContractorSpecialty(str, Enum):
    plumbing = "plumbing"
    electrical = "electrical"
    hvac = "hvac"
    general = "general"
    appliances = "appliances"
    roofing = "roofing"
    painting = "painting"
    carpentry = "carpentry"
    landscaping = "landscaping"
    cleaning = "cleaning"


class ContractorStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


# Inspection status state machine
VALID_STATUS_TRANSITIONS = {
    InspectionStatus.scheduled: [InspectionStatus.in_progress],
    InspectionStatus.in_progress: [InspectionStatus.completed, InspectionStatus.failed, InspectionStatus.scheduled],
    InspectionStatus.completed: [],
    InspectionStatus.failed: [InspectionStatus.scheduled],
}
