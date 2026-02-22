from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List
import uuid

from models.schemas import TenantCreate, TenantResponse
from models.enums import TenantStatus
from utils.database import db
from utils.auth import get_current_user, verify_org_membership

router = APIRouter(tags=["Tenants"])


@router.get("/organizations/{org_id}/tenants", response_model=List[TenantResponse])
async def get_tenants(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    tenants = await db.tenants.find({"org_id": org_id}).to_list(500)
    return [TenantResponse(
        id=t["id"],
        first_name=t["first_name"],
        last_name=t["last_name"],
        email=t["email"],
        phone=t.get("phone"),
        unit_id=t.get("unit_id"),
        lease_start=t.get("lease_start"),
        lease_end=t.get("lease_end"),
        status=t.get("status", TenantStatus.active),
        org_id=t["org_id"],
        created_at=t["created_at"]
    ) for t in tenants]


@router.post("/organizations/{org_id}/tenants", response_model=TenantResponse)
async def create_tenant(org_id: str, tenant: TenantCreate, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    tenant_id = str(uuid.uuid4())
    tenant_doc = {
        "id": tenant_id,
        "org_id": org_id,
        "first_name": tenant.first_name,
        "last_name": tenant.last_name,
        "email": tenant.email,
        "phone": tenant.phone,
        "unit_id": tenant.unit_id,
        "lease_start": tenant.lease_start,
        "lease_end": tenant.lease_end,
        "status": TenantStatus.active.value,
        "created_at": datetime.now(timezone.utc)
    }
    await db.tenants.insert_one(tenant_doc)
    
    # Update unit status if assigned
    if tenant.unit_id:
        await db.units.update_one(
            {"id": tenant.unit_id},
            {"$set": {"status": "occupied", "tenant_id": tenant_id}}
        )
    
    return TenantResponse(
        id=tenant_id,
        first_name=tenant.first_name,
        last_name=tenant.last_name,
        email=tenant.email,
        phone=tenant.phone,
        unit_id=tenant.unit_id,
        lease_start=tenant.lease_start,
        lease_end=tenant.lease_end,
        status=TenantStatus.active,
        org_id=org_id,
        created_at=tenant_doc["created_at"]
    )


@router.get("/organizations/{org_id}/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(org_id: str, tenant_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    tenant = await db.tenants.find_one({"id": tenant_id, "org_id": org_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return TenantResponse(
        id=tenant["id"],
        first_name=tenant["first_name"],
        last_name=tenant["last_name"],
        email=tenant["email"],
        phone=tenant.get("phone"),
        unit_id=tenant.get("unit_id"),
        lease_start=tenant.get("lease_start"),
        lease_end=tenant.get("lease_end"),
        status=tenant.get("status", TenantStatus.active),
        org_id=tenant["org_id"],
        created_at=tenant["created_at"]
    )


@router.put("/organizations/{org_id}/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    org_id: str, tenant_id: str, tenant: TenantCreate, current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    existing = await db.tenants.find_one({"id": tenant_id, "org_id": org_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Handle unit changes
    old_unit_id = existing.get("unit_id")
    new_unit_id = tenant.unit_id
    
    if old_unit_id != new_unit_id:
        # Clear old unit
        if old_unit_id:
            await db.units.update_one(
                {"id": old_unit_id},
                {"$set": {"status": "vacant"}, "$unset": {"tenant_id": ""}}
            )
        # Set new unit
        if new_unit_id:
            await db.units.update_one(
                {"id": new_unit_id},
                {"$set": {"status": "occupied", "tenant_id": tenant_id}}
            )
    
    update_data = {
        "first_name": tenant.first_name,
        "last_name": tenant.last_name,
        "email": tenant.email,
        "phone": tenant.phone,
        "unit_id": tenant.unit_id,
        "lease_start": tenant.lease_start,
        "lease_end": tenant.lease_end,
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.tenants.update_one({"id": tenant_id}, {"$set": update_data})
    updated = await db.tenants.find_one({"id": tenant_id})
    
    return TenantResponse(
        id=updated["id"],
        first_name=updated["first_name"],
        last_name=updated["last_name"],
        email=updated["email"],
        phone=updated.get("phone"),
        unit_id=updated.get("unit_id"),
        lease_start=updated.get("lease_start"),
        lease_end=updated.get("lease_end"),
        status=updated.get("status", TenantStatus.active),
        org_id=updated["org_id"],
        created_at=updated["created_at"]
    )


@router.delete("/organizations/{org_id}/tenants/{tenant_id}")
async def delete_tenant(org_id: str, tenant_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    tenant = await db.tenants.find_one({"id": tenant_id, "org_id": org_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Clear unit assignment
    if tenant.get("unit_id"):
        await db.units.update_one(
            {"id": tenant["unit_id"]},
            {"$set": {"status": "vacant"}, "$unset": {"tenant_id": ""}}
        )
    
    await db.tenants.delete_one({"id": tenant_id})
    return {"message": "Tenant deleted"}
