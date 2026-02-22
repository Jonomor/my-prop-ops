import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "propops-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")

# Subscription Plan Pricing (amounts in USD)
SUBSCRIPTION_PLANS = {
    "standard_monthly": {"amount": 49.00, "plan": "standard", "period": "monthly"},
    "standard_annual": {"amount": 468.00, "plan": "standard", "period": "annual"},
    "pro_monthly": {"amount": 149.00, "plan": "pro", "period": "monthly"},
    "pro_annual": {"amount": 1428.00, "plan": "pro", "period": "annual"},
    "enterprise_monthly": {"amount": 299.00, "plan": "enterprise", "period": "monthly"},
    "enterprise_annual": {"amount": 2868.00, "plan": "enterprise", "period": "annual"},
}

# Mailchimp Configuration
MAILCHIMP_MARKETING_API_KEY = os.environ.get("MAILCHIMP_MARKETING_API_KEY", "")
MAILCHIMP_MARKETING_SERVER = os.environ.get("MAILCHIMP_MARKETING_SERVER", "us1")
MAILCHIMP_MARKETING_AUDIENCE_ID = os.environ.get("MAILCHIMP_MARKETING_AUDIENCE_ID", "")
MAILCHIMP_TRANSACTIONAL_API_KEY = os.environ.get("MAILCHIMP_TRANSACTIONAL_API_KEY", "")
MAILCHIMP_FROM_EMAIL = os.environ.get("MAILCHIMP_TRANSACTIONAL_FROM_EMAIL", "noreply@mypropops.com")

# Feature Flags
FEATURE_FLAGS = {
    "enable_maintenance_requests": True,
    "enable_tenant_screening": True,
    "enable_contractor_portal": True,
    "enable_ai_insights": False,
    "enable_rent_payments": False,
}

# Plan Limits
PLAN_LIMITS = {
    "free": {
        "max_properties": 2,
        "max_units": 5,
        "max_team_members": 1,
        "features": ["basic_maintenance"]
    },
    "standard": {
        "max_properties": 20,
        "max_units": 40,
        "max_team_members": 5,
        "features": ["full_inspections", "document_storage", "calendar", "maintenance_requests", "email_notifications"]
    },
    "pro": {
        "max_properties": -1,
        "max_units": -1,
        "max_team_members": -1,
        "features": ["all_standard", "priority_support", "analytics", "api_access", "tenant_portal", "messaging", "maintenance_requests", "work_orders", "contractor_portal"]
    },
    "enterprise": {
        "max_properties": -1,
        "max_units": -1,
        "max_team_members": -1,
        "features": ["all_pro", "white_label", "sla", "dedicated_support", "custom_integrations"]
    }
}

# File upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
