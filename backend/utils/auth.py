from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from .config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS
from .database import db

security = HTTPBearer()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_tenant_token(tenant_id: str, email: str) -> str:
    payload = {
        "sub": tenant_id,
        "email": email,
        "type": "tenant",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_contractor_token(contractor_id: str, email: str) -> str:
    payload = {
        "sub": contractor_id,
        "email": email,
        "type": "contractor",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_tenant(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        tenant_id = payload.get("sub")
        token_type = payload.get("type")
        
        if tenant_id is None or token_type != "tenant":
            raise HTTPException(status_code=401, detail="Invalid tenant token")
        
        tenant = await db.tenant_portal_users.find_one({"id": tenant_id})
        if tenant is None:
            raise HTTPException(status_code=401, detail="Tenant not found")
        
        return tenant
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_contractor(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        contractor_id = payload.get("sub")
        token_type = payload.get("type")
        
        if contractor_id is None or token_type != "contractor":
            raise HTTPException(status_code=401, detail="Invalid contractor token")
        
        contractor = await db.contractors.find_one({"id": contractor_id})
        if contractor is None:
            raise HTTPException(status_code=401, detail="Contractor not found")
        
        return contractor
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def verify_org_membership(user_id: str, org_id: str):
    membership = await db.memberships.find_one({
        "user_id": user_id,
        "org_id": org_id
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    return membership


async def check_plan_limits(org_id: str, resource_type: str):
    from .config import PLAN_LIMITS
    
    org = await db.organizations.find_one({"id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    plan = org.get("plan", "free")
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    
    if resource_type == "property":
        if limits["max_properties"] == -1:
            return True
        count = await db.properties.count_documents({"org_id": org_id})
        if count >= limits["max_properties"]:
            raise HTTPException(
                status_code=403,
                detail=f"Property limit reached for {plan} plan ({limits['max_properties']} max). Please upgrade."
            )
    
    elif resource_type == "unit":
        if limits["max_units"] == -1:
            return True
        count = await db.units.count_documents({"org_id": org_id})
        if count >= limits["max_units"]:
            raise HTTPException(
                status_code=403,
                detail=f"Unit limit reached for {plan} plan ({limits['max_units']} max). Please upgrade."
            )
    
    return True
