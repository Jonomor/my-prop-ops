from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List
import uuid

from models.schemas import (
    InspectionCreate, InspectionUpdate, InspectionResponse,
    CalendarEvent, DashboardStats
)
from models.enums import InspectionStatus, VALID_STATUS_TRANSITIONS
from utils.database import db
from utils.auth import get_current_user, verify_org_membership

router = APIRouter(tags=["Inspections"])


@router.get("/organizations/{org_id}/inspections", response_model=List[InspectionResponse])
async def get_inspections(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    inspections = await db.inspections.find({"org_id": org_id}).to_list(500)
    return [InspectionResponse(**i) for i in inspections]


@router.post("/organizations/{org_id}/inspections", response_model=InspectionResponse)
async def create_inspection(
    org_id: str, inspection: InspectionCreate, current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    # Verify property exists
    prop = await db.properties.find_one({"id": inspection.property_id, "org_id": org_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    inspection_id = str(uuid.uuid4())
    inspection_doc = {
        "id": inspection_id,
        "org_id": org_id,
        "property_id": inspection.property_id,
        "unit_id": inspection.unit_id,
        "inspection_type": inspection.inspection_type,
        "status": InspectionStatus.scheduled.value,
        "scheduled_date": inspection.scheduled_date,
        "inspector_id": current_user["id"],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.inspections.insert_one(inspection_doc)
    return InspectionResponse(**inspection_doc)


@router.get("/organizations/{org_id}/inspections/{inspection_id}", response_model=InspectionResponse)
async def get_inspection(org_id: str, inspection_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    inspection = await db.inspections.find_one({"id": inspection_id, "org_id": org_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return InspectionResponse(**inspection)


@router.put("/organizations/{org_id}/inspections/{inspection_id}", response_model=InspectionResponse)
async def update_inspection(
    org_id: str,
    inspection_id: str,
    update: InspectionUpdate,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    inspection = await db.inspections.find_one({"id": inspection_id, "org_id": org_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if update.status:
        current_status = InspectionStatus(inspection["status"])
        valid_transitions = VALID_STATUS_TRANSITIONS.get(current_status, [])
        if update.status not in valid_transitions:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from {current_status.value} to {update.status.value}"
            )
        update_data["status"] = update.status.value
        if update.status == InspectionStatus.completed:
            update_data["completed_date"] = datetime.now(timezone.utc)
    
    if update.notes is not None:
        update_data["notes"] = update.notes
    
    if update.completed_date:
        update_data["completed_date"] = update.completed_date
    
    await db.inspections.update_one({"id": inspection_id}, {"$set": update_data})
    updated = await db.inspections.find_one({"id": inspection_id})
    return InspectionResponse(**updated)


# Calendar Routes
@router.get("/organizations/{org_id}/calendar", response_model=List[CalendarEvent])
async def get_calendar(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    events = []
    
    # Get inspections
    inspections = await db.inspections.find({
        "org_id": org_id,
        "status": {"$ne": "completed"}
    }).to_list(100)
    
    for i in inspections:
        prop = await db.properties.find_one({"id": i["property_id"]})
        events.append(CalendarEvent(
            id=i["id"],
            title=f"Inspection: {prop['name'] if prop else 'Unknown'}",
            start=i["scheduled_date"],
            type="inspection",
            entity_id=i["id"],
            description=i.get("inspection_type"),
            status=i["status"]
        ))
    
    # Get lease expirations
    thirty_days = datetime.now(timezone.utc) + timedelta(days=30)
    tenants = await db.tenants.find({
        "org_id": org_id,
        "lease_end": {"$lte": thirty_days, "$gte": datetime.now(timezone.utc)}
    }).to_list(100)
    
    for t in tenants:
        if t.get("lease_end"):
            events.append(CalendarEvent(
                id=f"lease-{t['id']}",
                title=f"Lease Expiring: {t['first_name']} {t['last_name']}",
                start=t["lease_end"],
                type="lease_expiration",
                entity_id=t["id"],
                description=f"Tenant: {t['email']}"
            ))
    
    # Get scheduled maintenance
    maintenance = await db.maintenance_requests.find({
        "org_id": org_id,
        "status": "scheduled",
        "scheduled_date": {"$exists": True}
    }).to_list(100)
    
    for m in maintenance:
        events.append(CalendarEvent(
            id=m["id"],
            title=f"Maintenance: {m['title']}",
            start=m["scheduled_date"],
            type="maintenance",
            entity_id=m["id"],
            description=m["description"],
            status=m["status"]
        ))
    
    return sorted(events, key=lambda x: x.start)


# Dashboard Routes
@router.get("/organizations/{org_id}/dashboard", response_model=DashboardStats)
async def get_dashboard(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    total_properties = await db.properties.count_documents({"org_id": org_id})
    total_units = await db.units.count_documents({"org_id": org_id})
    total_tenants = await db.tenants.count_documents({"org_id": org_id, "status": "active"})
    
    occupied_units = await db.units.count_documents({"org_id": org_id, "status": "occupied"})
    occupancy_rate = (occupied_units / total_units * 100) if total_units > 0 else 0
    
    pending_inspections = await db.inspections.count_documents({
        "org_id": org_id,
        "status": "scheduled"
    })
    
    thirty_days = datetime.now(timezone.utc) + timedelta(days=30)
    upcoming_lease_expirations = await db.tenants.count_documents({
        "org_id": org_id,
        "lease_end": {"$lte": thirty_days, "$gte": datetime.now(timezone.utc)}
    })
    
    return DashboardStats(
        total_properties=total_properties,
        total_units=total_units,
        total_tenants=total_tenants,
        occupancy_rate=round(occupancy_rate, 1),
        pending_inspections=pending_inspections,
        upcoming_lease_expirations=upcoming_lease_expirations
    )
