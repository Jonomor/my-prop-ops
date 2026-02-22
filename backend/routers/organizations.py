from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List
import uuid

from models.schemas import (
    OrganizationCreate, OrganizationResponse, MembershipResponse, MemberResponse,
    InviteCreate, InviteResponse, AcceptInviteRequest, FeatureFlagsResponse
)
from models.enums import UserRole, InviteStatus
from utils.database import db
from utils.auth import get_current_user, verify_org_membership, hash_password
from utils.config import FEATURE_FLAGS, PLAN_LIMITS
import secrets

router = APIRouter(tags=["Organizations"])


@router.get("/organizations", response_model=List[MembershipResponse])
async def get_organizations(current_user: dict = Depends(get_current_user)):
    memberships = await db.memberships.find({"user_id": current_user["id"]}).to_list(100)
    result = []
    for m in memberships:
        org = await db.organizations.find_one({"id": m["org_id"]})
        if org:
            result.append(MembershipResponse(
                organization_id=org["id"],
                organization_name=org["name"],
                role=m["role"],
                is_owner=m.get("is_owner", False),
                joined_at=m["joined_at"]
            ))
    return result


@router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(org: OrganizationCreate, current_user: dict = Depends(get_current_user)):
    org_id = str(uuid.uuid4())
    org_doc = {
        "id": org_id,
        "name": org.name,
        "address": org.address,
        "owner_id": current_user["id"],
        "plan": "free",
        "billing_period": "monthly",
        "subscription_active": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.organizations.insert_one(org_doc)
    
    membership_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "org_id": org_id,
        "role": "admin",
        "is_owner": True,
        "joined_at": datetime.now(timezone.utc)
    }
    await db.memberships.insert_one(membership_doc)
    
    return OrganizationResponse(
        id=org_id,
        name=org.name,
        address=org.address,
        plan="free",
        created_at=org_doc["created_at"]
    )


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    org = await db.organizations.find_one({"id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return OrganizationResponse(
        id=org["id"],
        name=org["name"],
        address=org.get("address"),
        plan=org.get("plan", "free"),
        created_at=org["created_at"]
    )


@router.get("/organizations/{org_id}/usage")
async def get_org_usage(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    org = await db.organizations.find_one({"id": org_id})
    plan = org.get("plan", "free")
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    
    properties_count = await db.properties.count_documents({"org_id": org_id})
    units_count = await db.units.count_documents({"org_id": org_id})
    members_count = await db.memberships.count_documents({"org_id": org_id})
    
    return {
        "plan": plan,
        "properties": {"used": properties_count, "limit": limits["max_properties"]},
        "units": {"used": units_count, "limit": limits["max_units"]},
        "team_members": {"used": members_count, "limit": limits["max_team_members"]},
        "features": limits["features"]
    }


@router.get("/organizations/{org_id}/members", response_model=List[MemberResponse])
async def get_org_members(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    memberships = await db.memberships.find({"org_id": org_id}).to_list(100)
    result = []
    for m in memberships:
        user = await db.users.find_one({"id": m["user_id"]})
        if user:
            result.append(MemberResponse(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                role=m["role"],
                joined_at=m["joined_at"],
                is_owner=m.get("is_owner", False)
            ))
    return result


# Team Invitation Routes
@router.post("/organizations/{org_id}/invites", response_model=InviteResponse)
async def create_invite(org_id: str, invite: InviteCreate, current_user: dict = Depends(get_current_user)):
    membership = await verify_org_membership(current_user["id"], org_id)
    
    if membership["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only admins and managers can invite")
    
    existing = await db.invites.find_one({
        "org_id": org_id,
        "email": invite.email,
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Pending invite already exists")
    
    org = await db.organizations.find_one({"id": org_id})
    
    invite_id = str(uuid.uuid4())
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    
    invite_doc = {
        "id": invite_id,
        "org_id": org_id,
        "email": invite.email,
        "role": invite.role.value,
        "status": "pending",
        "token": token,
        "invited_by": current_user["id"],
        "created_at": now,
        "expires_at": datetime.now(timezone.utc).replace(day=datetime.now(timezone.utc).day + 7)
    }
    await db.invites.insert_one(invite_doc)
    
    return InviteResponse(
        id=invite_id,
        email=invite.email,
        role=invite.role,
        status=InviteStatus.pending,
        org_id=org_id,
        org_name=org["name"],
        invited_by=current_user["id"],
        invited_by_name=current_user["name"],
        created_at=now,
        expires_at=invite_doc["expires_at"],
        token=token
    )


@router.get("/organizations/{org_id}/invites", response_model=List[InviteResponse])
async def get_org_invites(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    invites = await db.invites.find({"org_id": org_id}).to_list(100)
    org = await db.organizations.find_one({"id": org_id})
    
    result = []
    for inv in invites:
        inviter = await db.users.find_one({"id": inv["invited_by"]})
        result.append(InviteResponse(
            id=inv["id"],
            email=inv["email"],
            role=inv["role"],
            status=inv["status"],
            org_id=org_id,
            org_name=org["name"],
            invited_by=inv["invited_by"],
            invited_by_name=inviter["name"] if inviter else "Unknown",
            created_at=inv["created_at"],
            expires_at=inv["expires_at"]
        ))
    return result


@router.delete("/organizations/{org_id}/invites/{invite_id}")
async def delete_invite(org_id: str, invite_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    result = await db.invites.delete_one({"id": invite_id, "org_id": org_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invite not found")
    return {"message": "Invite deleted"}


@router.get("/invites/pending", response_model=List[InviteResponse])
async def get_pending_invites(current_user: dict = Depends(get_current_user)):
    invites = await db.invites.find({
        "email": current_user["email"],
        "status": "pending"
    }).to_list(100)
    
    result = []
    for inv in invites:
        org = await db.organizations.find_one({"id": inv["org_id"]})
        inviter = await db.users.find_one({"id": inv["invited_by"]})
        result.append(InviteResponse(
            id=inv["id"],
            email=inv["email"],
            role=inv["role"],
            status=inv["status"],
            org_id=inv["org_id"],
            org_name=org["name"] if org else "Unknown",
            invited_by=inv["invited_by"],
            invited_by_name=inviter["name"] if inviter else "Unknown",
            created_at=inv["created_at"],
            expires_at=inv["expires_at"],
            token=inv["token"]
        ))
    return result


@router.get("/invites/{token}")
async def get_invite_by_token(token: str):
    invite = await db.invites.find_one({"token": token, "status": "pending"})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired")
    
    org = await db.organizations.find_one({"id": invite["org_id"]})
    inviter = await db.users.find_one({"id": invite["invited_by"]})
    
    return {
        "id": invite["id"],
        "email": invite["email"],
        "role": invite["role"],
        "org_name": org["name"] if org else "Unknown",
        "invited_by_name": inviter["name"] if inviter else "Unknown",
        "expires_at": invite["expires_at"]
    }


@router.post("/invites/accept")
async def accept_invite(data: AcceptInviteRequest, current_user: dict = Depends(get_current_user)):
    invite = await db.invites.find_one({"token": data.token, "status": "pending"})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired")
    
    existing_membership = await db.memberships.find_one({
        "user_id": current_user["id"],
        "org_id": invite["org_id"]
    })
    if existing_membership:
        raise HTTPException(status_code=400, detail="Already a member")
    
    membership_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "org_id": invite["org_id"],
        "role": invite["role"],
        "is_owner": False,
        "joined_at": datetime.now(timezone.utc)
    }
    await db.memberships.insert_one(membership_doc)
    
    await db.invites.update_one(
        {"id": invite["id"]},
        {"$set": {"status": "accepted"}}
    )
    
    return {"message": "Invite accepted", "org_id": invite["org_id"]}


@router.get("/feature-flags", response_model=FeatureFlagsResponse)
async def get_feature_flags():
    return FeatureFlagsResponse(**FEATURE_FLAGS)


# Tenant Invite Code Routes
@router.post("/organizations/{org_id}/tenant-invite-code")
async def generate_tenant_invite_code(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    code = secrets.token_urlsafe(8).upper()[:8]
    
    await db.organizations.update_one(
        {"id": org_id},
        {"$set": {
            "tenant_invite_code": code,
            "tenant_invite_code_created_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"invite_code": code}


@router.get("/organizations/{org_id}/tenant-invite-code")
async def get_tenant_invite_code(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    org = await db.organizations.find_one({"id": org_id})
    return {"invite_code": org.get("tenant_invite_code")}
