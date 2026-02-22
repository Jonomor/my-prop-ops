from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
from typing import List
import uuid

from models.schemas import (
    MaintenanceRequestCreate, MaintenanceRequestUpdate, MaintenanceRequestResponse,
    TenantMaintenanceRequestCreate
)
from models.enums import MaintenanceStatus, MaintenancePriority
from utils.database import db
from utils.auth import get_current_user, get_current_tenant, verify_org_membership
from utils.email import send_maintenance_notification

router = APIRouter(tags=["Maintenance"])


@router.post("/maintenance-requests", response_model=MaintenanceRequestResponse)
async def create_maintenance_request(
    request: MaintenanceRequestCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], request.org_id)
    
    # Get property and unit info
    prop = await db.properties.find_one({"id": request.property_id})
    unit = await db.units.find_one({"id": request.unit_id}) if request.unit_id else None
    tenant = await db.tenants.find_one({"id": request.tenant_id}) if request.tenant_id else None
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    request_doc = {
        "id": request_id,
        "org_id": request.org_id,
        "property_id": request.property_id,
        "unit_id": request.unit_id,
        "tenant_id": request.tenant_id,
        "category": request.category.value,
        "priority": request.priority.value,
        "status": MaintenanceStatus.open.value,
        "title": request.title,
        "description": request.description,
        "preferred_access_times": request.preferred_access_times,
        "permission_to_enter": request.permission_to_enter,
        "photos": [],
        "created_at": now,
        "created_by": current_user["id"]
    }
    
    await db.maintenance_requests.insert_one(request_doc)
    
    # Send notification email to org admins
    org = await db.organizations.find_one({"id": request.org_id})
    memberships = await db.memberships.find({"org_id": request.org_id, "role": "admin"}).to_list(10)
    for m in memberships:
        admin = await db.users.find_one({"id": m["user_id"]})
        if admin:
            background_tasks.add_task(
                send_maintenance_notification,
                admin["email"],
                admin["name"],
                request.title,
                prop["name"] if prop else "Unknown",
                request.priority.value
            )
    
    return MaintenanceRequestResponse(
        id=request_id,
        org_id=request.org_id,
        property_id=request.property_id,
        property_name=prop["name"] if prop else None,
        unit_id=request.unit_id,
        unit_number=unit["unit_number"] if unit else None,
        tenant_id=request.tenant_id,
        tenant_name=f"{tenant['first_name']} {tenant['last_name']}" if tenant else None,
        category=request.category,
        priority=request.priority,
        status=MaintenanceStatus.open,
        title=request.title,
        description=request.description,
        preferred_access_times=request.preferred_access_times,
        permission_to_enter=request.permission_to_enter,
        photos=[],
        created_at=now
    )


@router.get("/maintenance-requests", response_model=List[MaintenanceRequestResponse])
async def get_maintenance_requests(
    org_id: str = None,
    status: str = None,
    priority: str = None,
    current_user: dict = Depends(get_current_user)
):
    # Get user's organizations
    memberships = await db.memberships.find({"user_id": current_user["id"]}).to_list(100)
    org_ids = [m["org_id"] for m in memberships]
    
    query = {"org_id": {"$in": org_ids}}
    if org_id:
        query["org_id"] = org_id
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    requests = await db.maintenance_requests.find(query).sort("created_at", -1).to_list(500)
    
    result = []
    for req in requests:
        prop = await db.properties.find_one({"id": req["property_id"]})
        unit = await db.units.find_one({"id": req.get("unit_id")}) if req.get("unit_id") else None
        tenant = await db.tenants.find_one({"id": req.get("tenant_id")}) if req.get("tenant_id") else None
        contractor = await db.contractors.find_one({"id": req.get("assigned_contractor_id")}) if req.get("assigned_contractor_id") else None
        
        result.append(MaintenanceRequestResponse(
            id=req["id"],
            org_id=req["org_id"],
            property_id=req["property_id"],
            property_name=prop["name"] if prop else None,
            unit_id=req.get("unit_id"),
            unit_number=unit["unit_number"] if unit else None,
            tenant_id=req.get("tenant_id"),
            tenant_name=f"{tenant['first_name']} {tenant['last_name']}" if tenant else None,
            category=req["category"],
            priority=req["priority"],
            status=req["status"],
            title=req["title"],
            description=req["description"],
            preferred_access_times=req.get("preferred_access_times"),
            permission_to_enter=req.get("permission_to_enter", False),
            assigned_to=req.get("assigned_contractor_id"),
            assigned_to_name=f"{contractor['first_name']} {contractor['last_name']}" if contractor else None,
            notes=req.get("notes"),
            scheduled_date=req.get("scheduled_date"),
            completed_date=req.get("completed_date"),
            created_at=req["created_at"],
            updated_at=req.get("updated_at"),
            photos=req.get("photos", [])
        ))
    
    return result


@router.get("/maintenance-requests/{request_id}", response_model=MaintenanceRequestResponse)
async def get_maintenance_request(request_id: str, current_user: dict = Depends(get_current_user)):
    req = await db.maintenance_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await verify_org_membership(current_user["id"], req["org_id"])
    
    prop = await db.properties.find_one({"id": req["property_id"]})
    unit = await db.units.find_one({"id": req.get("unit_id")}) if req.get("unit_id") else None
    tenant = await db.tenants.find_one({"id": req.get("tenant_id")}) if req.get("tenant_id") else None
    contractor = await db.contractors.find_one({"id": req.get("assigned_contractor_id")}) if req.get("assigned_contractor_id") else None
    
    return MaintenanceRequestResponse(
        id=req["id"],
        org_id=req["org_id"],
        property_id=req["property_id"],
        property_name=prop["name"] if prop else None,
        unit_id=req.get("unit_id"),
        unit_number=unit["unit_number"] if unit else None,
        tenant_id=req.get("tenant_id"),
        tenant_name=f"{tenant['first_name']} {tenant['last_name']}" if tenant else None,
        category=req["category"],
        priority=req["priority"],
        status=req["status"],
        title=req["title"],
        description=req["description"],
        preferred_access_times=req.get("preferred_access_times"),
        permission_to_enter=req.get("permission_to_enter", False),
        assigned_to=req.get("assigned_contractor_id"),
        assigned_to_name=f"{contractor['first_name']} {contractor['last_name']}" if contractor else None,
        notes=req.get("notes"),
        scheduled_date=req.get("scheduled_date"),
        completed_date=req.get("completed_date"),
        created_at=req["created_at"],
        updated_at=req.get("updated_at"),
        photos=req.get("photos", [])
    )


@router.put("/maintenance-requests/{request_id}", response_model=MaintenanceRequestResponse)
async def update_maintenance_request(
    request_id: str,
    update: MaintenanceRequestUpdate,
    current_user: dict = Depends(get_current_user)
):
    req = await db.maintenance_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await verify_org_membership(current_user["id"], req["org_id"])
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if update.status:
        update_data["status"] = update.status.value
        if update.status == MaintenanceStatus.completed:
            update_data["completed_date"] = datetime.now(timezone.utc)
    if update.priority:
        update_data["priority"] = update.priority.value
    if update.assigned_to:
        update_data["assigned_to"] = update.assigned_to
    if update.notes is not None:
        update_data["notes"] = update.notes
    if update.scheduled_date:
        update_data["scheduled_date"] = update.scheduled_date
    
    await db.maintenance_requests.update_one({"id": request_id}, {"$set": update_data})
    
    # Get updated request
    updated = await db.maintenance_requests.find_one({"id": request_id})
    prop = await db.properties.find_one({"id": updated["property_id"]})
    unit = await db.units.find_one({"id": updated.get("unit_id")}) if updated.get("unit_id") else None
    tenant = await db.tenants.find_one({"id": updated.get("tenant_id")}) if updated.get("tenant_id") else None
    contractor = await db.contractors.find_one({"id": updated.get("assigned_contractor_id")}) if updated.get("assigned_contractor_id") else None
    
    return MaintenanceRequestResponse(
        id=updated["id"],
        org_id=updated["org_id"],
        property_id=updated["property_id"],
        property_name=prop["name"] if prop else None,
        unit_id=updated.get("unit_id"),
        unit_number=unit["unit_number"] if unit else None,
        tenant_id=updated.get("tenant_id"),
        tenant_name=f"{tenant['first_name']} {tenant['last_name']}" if tenant else None,
        category=updated["category"],
        priority=updated["priority"],
        status=updated["status"],
        title=updated["title"],
        description=updated["description"],
        preferred_access_times=updated.get("preferred_access_times"),
        permission_to_enter=updated.get("permission_to_enter", False),
        assigned_to=updated.get("assigned_contractor_id"),
        assigned_to_name=f"{contractor['first_name']} {contractor['last_name']}" if contractor else None,
        notes=updated.get("notes"),
        scheduled_date=updated.get("scheduled_date"),
        completed_date=updated.get("completed_date"),
        created_at=updated["created_at"],
        updated_at=updated.get("updated_at"),
        photos=updated.get("photos", [])
    )


@router.delete("/maintenance-requests/{request_id}")
async def delete_maintenance_request(request_id: str, current_user: dict = Depends(get_current_user)):
    req = await db.maintenance_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await verify_org_membership(current_user["id"], req["org_id"])
    
    await db.maintenance_requests.delete_one({"id": request_id})
    return {"message": "Request deleted"}


@router.get("/maintenance-requests/stats/summary")
async def get_maintenance_stats(org_id: str = None, current_user: dict = Depends(get_current_user)):
    memberships = await db.memberships.find({"user_id": current_user["id"]}).to_list(100)
    org_ids = [m["org_id"] for m in memberships]
    
    query = {"org_id": {"$in": org_ids}}
    if org_id:
        query["org_id"] = org_id
    
    total = await db.maintenance_requests.count_documents(query)
    open_count = await db.maintenance_requests.count_documents({**query, "status": "open"})
    in_progress = await db.maintenance_requests.count_documents({**query, "status": {"$in": ["assigned", "in_progress", "scheduled"]}})
    completed = await db.maintenance_requests.count_documents({**query, "status": "completed"})
    
    emergency = await db.maintenance_requests.count_documents({**query, "priority": "emergency", "status": {"$ne": "completed"}})
    high = await db.maintenance_requests.count_documents({**query, "priority": "high", "status": {"$ne": "completed"}})
    
    return {
        "total": total,
        "by_status": {
            "open": open_count,
            "in_progress": in_progress,
            "completed": completed
        },
        "by_priority": {
            "emergency": emergency,
            "high": high
        }
    }


# Tenant Portal Maintenance Routes
@router.post("/portal/maintenance-requests")
async def create_tenant_maintenance_request(
    request: TenantMaintenanceRequestCreate,
    background_tasks: BackgroundTasks,
    tenant: dict = Depends(get_current_tenant)
):
    if not tenant.get("connected_organization"):
        raise HTTPException(status_code=400, detail="Not connected to an organization")
    
    org_id = tenant["connected_organization"]
    
    # Find tenant's unit
    linked_tenant = await db.tenants.find_one({"id": tenant.get("linked_tenant_id")}) if tenant.get("linked_tenant_id") else None
    unit_id = linked_tenant.get("unit_id") if linked_tenant else None
    property_id = None
    
    if unit_id:
        unit = await db.units.find_one({"id": unit_id})
        property_id = unit.get("property_id") if unit else None
    
    # If no unit, get first property
    if not property_id:
        prop = await db.properties.find_one({"org_id": org_id})
        property_id = prop["id"] if prop else None
    
    if not property_id:
        raise HTTPException(status_code=400, detail="No property found")
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    request_doc = {
        "id": request_id,
        "org_id": org_id,
        "property_id": property_id,
        "unit_id": unit_id,
        "tenant_portal_user_id": tenant["id"],
        "tenant_name": tenant["name"],
        "category": request.category.value,
        "priority": request.priority.value,
        "status": MaintenanceStatus.open.value,
        "title": request.title,
        "description": request.description,
        "preferred_access_times": request.preferred_access_times,
        "permission_to_enter": request.permission_to_enter,
        "photos": [],
        "created_at": now,
        "source": "tenant_portal"
    }
    
    await db.maintenance_requests.insert_one(request_doc)
    
    # Send notification
    org = await db.organizations.find_one({"id": org_id})
    prop = await db.properties.find_one({"id": property_id})
    memberships = await db.memberships.find({"org_id": org_id, "role": "admin"}).to_list(10)
    for m in memberships:
        admin = await db.users.find_one({"id": m["user_id"]})
        if admin:
            background_tasks.add_task(
                send_maintenance_notification,
                admin["email"],
                admin["name"],
                request.title,
                prop["name"] if prop else "Unknown",
                request.priority.value
            )
    
    return {"id": request_id, "message": "Request submitted successfully"}


@router.get("/portal/maintenance-requests")
async def get_tenant_maintenance_requests(tenant: dict = Depends(get_current_tenant)):
    if not tenant.get("connected_organization"):
        return []
    
    requests = await db.maintenance_requests.find({
        "tenant_portal_user_id": tenant["id"]
    }).sort("created_at", -1).to_list(100)
    
    result = []
    for req in requests:
        prop = await db.properties.find_one({"id": req["property_id"]})
        unit = await db.units.find_one({"id": req.get("unit_id")}) if req.get("unit_id") else None
        
        result.append({
            "id": req["id"],
            "property_name": prop["name"] if prop else None,
            "unit_number": unit["unit_number"] if unit else None,
            "category": req["category"],
            "priority": req["priority"],
            "status": req["status"],
            "title": req["title"],
            "description": req["description"],
            "scheduled_date": req.get("scheduled_date"),
            "created_at": req["created_at"],
            "photos": req.get("photos", [])
        })
    
    return result
