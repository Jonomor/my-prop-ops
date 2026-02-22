from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
from typing import List
import uuid

from models.schemas import (
    ContractorRegister, ContractorLogin, ContractorResponse, ContractorProfileUpdate,
    ContractorJobResponse, ContractorJobUpdate, AssignContractorRequest
)
from models.enums import ContractorStatus, MaintenanceStatus
from utils.database import db
from utils.auth import (
    hash_password, verify_password, create_contractor_token,
    get_current_contractor, get_current_user, verify_org_membership
)
from utils.email import send_contractor_assignment_email

router = APIRouter(tags=["Contractors"])


@router.post("/contractor/register")
async def register_contractor(data: ContractorRegister):
    existing = await db.contractors.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    contractor_id = str(uuid.uuid4())
    hashed_password = hash_password(data.password)
    
    contractor_doc = {
        "id": contractor_id,
        "email": data.email,
        "hashed_password": hashed_password,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "phone": data.phone,
        "company_name": data.company_name,
        "license_number": data.license_number,
        "specialties": [s.value for s in data.specialties],
        "service_area": data.service_area,
        "status": ContractorStatus.active.value,
        "rating": None,
        "jobs_completed": 0,
        "connected_organizations": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.contractors.insert_one(contractor_doc)
    
    token = create_contractor_token(contractor_id, data.email)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/contractor/login")
async def login_contractor(data: ContractorLogin):
    contractor = await db.contractors.find_one({"email": data.email})
    if not contractor or not verify_password(data.password, contractor["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if contractor.get("status") != ContractorStatus.active.value:
        raise HTTPException(status_code=403, detail="Account is not active")
    
    token = create_contractor_token(contractor["id"], contractor["email"])
    return {"access_token": token, "token_type": "bearer"}


@router.get("/contractor/me", response_model=ContractorResponse)
async def get_contractor_profile(contractor: dict = Depends(get_current_contractor)):
    return ContractorResponse(
        id=contractor["id"],
        email=contractor["email"],
        first_name=contractor["first_name"],
        last_name=contractor["last_name"],
        phone=contractor["phone"],
        company_name=contractor.get("company_name"),
        license_number=contractor.get("license_number"),
        specialties=contractor.get("specialties", []),
        service_area=contractor.get("service_area"),
        status=contractor.get("status", ContractorStatus.active.value),
        rating=contractor.get("rating"),
        jobs_completed=contractor.get("jobs_completed", 0),
        created_at=contractor["created_at"]
    )


@router.put("/contractor/me", response_model=ContractorResponse)
async def update_contractor_profile(
    data: ContractorProfileUpdate,
    contractor: dict = Depends(get_current_contractor)
):
    update_data = {}
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.company_name is not None:
        update_data["company_name"] = data.company_name
    if data.license_number is not None:
        update_data["license_number"] = data.license_number
    if data.specialties is not None:
        update_data["specialties"] = [s.value for s in data.specialties]
    if data.service_area is not None:
        update_data["service_area"] = data.service_area
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.contractors.update_one(
            {"id": contractor["id"]},
            {"$set": update_data}
        )
    
    updated = await db.contractors.find_one({"id": contractor["id"]})
    return ContractorResponse(
        id=updated["id"],
        email=updated["email"],
        first_name=updated["first_name"],
        last_name=updated["last_name"],
        phone=updated["phone"],
        company_name=updated.get("company_name"),
        license_number=updated.get("license_number"),
        specialties=updated.get("specialties", []),
        service_area=updated.get("service_area"),
        status=updated.get("status", ContractorStatus.active.value),
        rating=updated.get("rating"),
        jobs_completed=updated.get("jobs_completed", 0),
        created_at=updated["created_at"]
    )


@router.get("/contractor/jobs")
async def get_contractor_jobs(contractor: dict = Depends(get_current_contractor)):
    jobs = await db.maintenance_requests.find({
        "assigned_contractor_id": contractor["id"]
    }).sort("created_at", -1).to_list(100)
    
    result = []
    for job in jobs:
        org = await db.organizations.find_one({"id": job["org_id"]})
        prop = await db.properties.find_one({"id": job["property_id"]})
        unit = await db.units.find_one({"id": job.get("unit_id")}) if job.get("unit_id") else None
        
        result.append(ContractorJobResponse(
            id=job["id"],
            org_id=job["org_id"],
            org_name=org["name"] if org else "Unknown",
            property_id=job["property_id"],
            property_name=prop["name"] if prop else "Unknown",
            property_address=prop["address"] if prop else "",
            unit_id=job.get("unit_id"),
            unit_number=unit["unit_number"] if unit else None,
            category=job["category"],
            priority=job["priority"],
            status=job["status"],
            title=job["title"],
            description=job["description"],
            permission_to_enter=job.get("permission_to_enter", False),
            scheduled_date=job.get("scheduled_date"),
            assigned_at=job.get("assigned_at", job["created_at"]),
            tenant_name=job.get("tenant_name"),
            tenant_phone=job.get("tenant_phone"),
            photos=job.get("photos", [])
        ))
    
    return result


@router.get("/contractor/jobs/{job_id}", response_model=ContractorJobResponse)
async def get_contractor_job(job_id: str, contractor: dict = Depends(get_current_contractor)):
    job = await db.maintenance_requests.find_one({
        "id": job_id,
        "assigned_contractor_id": contractor["id"]
    })
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    org = await db.organizations.find_one({"id": job["org_id"]})
    prop = await db.properties.find_one({"id": job["property_id"]})
    unit = await db.units.find_one({"id": job.get("unit_id")}) if job.get("unit_id") else None
    
    return ContractorJobResponse(
        id=job["id"],
        org_id=job["org_id"],
        org_name=org["name"] if org else "Unknown",
        property_id=job["property_id"],
        property_name=prop["name"] if prop else "Unknown",
        property_address=prop["address"] if prop else "",
        unit_id=job.get("unit_id"),
        unit_number=unit["unit_number"] if unit else None,
        category=job["category"],
        priority=job["priority"],
        status=job["status"],
        title=job["title"],
        description=job["description"],
        permission_to_enter=job.get("permission_to_enter", False),
        scheduled_date=job.get("scheduled_date"),
        assigned_at=job.get("assigned_at", job["created_at"]),
        tenant_name=job.get("tenant_name"),
        tenant_phone=job.get("tenant_phone"),
        photos=job.get("photos", [])
    )


@router.put("/contractor/jobs/{job_id}")
async def update_contractor_job(
    job_id: str,
    data: ContractorJobUpdate,
    contractor: dict = Depends(get_current_contractor)
):
    job = await db.maintenance_requests.find_one({
        "id": job_id,
        "assigned_contractor_id": contractor["id"]
    })
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if data.status:
        update_data["status"] = data.status.value
        if data.status == MaintenanceStatus.completed:
            update_data["completed_date"] = datetime.now(timezone.utc)
            await db.contractors.update_one(
                {"id": contractor["id"]},
                {"$inc": {"jobs_completed": 1}}
            )
    
    if data.notes:
        update_data["contractor_notes"] = data.notes
    
    if data.completion_notes:
        update_data["completion_notes"] = data.completion_notes
    
    await db.maintenance_requests.update_one(
        {"id": job_id},
        {"$set": update_data}
    )
    
    return {"message": "Job updated successfully"}


@router.get("/contractor/stats")
async def get_contractor_stats(contractor: dict = Depends(get_current_contractor)):
    total_jobs = await db.maintenance_requests.count_documents({
        "assigned_contractor_id": contractor["id"]
    })
    
    active_jobs = await db.maintenance_requests.count_documents({
        "assigned_contractor_id": contractor["id"],
        "status": {"$in": ["assigned", "in_progress", "scheduled"]}
    })
    
    completed_jobs = await db.maintenance_requests.count_documents({
        "assigned_contractor_id": contractor["id"],
        "status": "completed"
    })
    
    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "rating": contractor.get("rating"),
        "jobs_completed": contractor.get("jobs_completed", 0)
    }


@router.get("/organizations/{org_id}/contractors")
async def get_org_contractors(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    contractors = await db.contractors.find({
        "connected_organizations": org_id
    }).to_list(100)
    
    return [
        ContractorResponse(
            id=c["id"],
            email=c["email"],
            first_name=c["first_name"],
            last_name=c["last_name"],
            phone=c["phone"],
            company_name=c.get("company_name"),
            license_number=c.get("license_number"),
            specialties=c.get("specialties", []),
            service_area=c.get("service_area"),
            status=c.get("status", ContractorStatus.active.value),
            rating=c.get("rating"),
            jobs_completed=c.get("jobs_completed", 0),
            created_at=c["created_at"]
        ) for c in contractors
    ]


@router.post("/organizations/{org_id}/contractors/invite")
async def invite_contractor(
    org_id: str,
    email: str,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    contractor = await db.contractors.find_one({"email": email})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    if org_id in contractor.get("connected_organizations", []):
        raise HTTPException(status_code=400, detail="Contractor already connected")
    
    await db.contractors.update_one(
        {"id": contractor["id"]},
        {"$addToSet": {"connected_organizations": org_id}}
    )
    
    return {"message": "Contractor invited successfully"}


@router.post("/maintenance-requests/{request_id}/assign-contractor")
async def assign_contractor(
    request_id: str,
    data: AssignContractorRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    request = await db.maintenance_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    await verify_org_membership(current_user["id"], request["org_id"])
    
    contractor = await db.contractors.find_one({"id": data.contractor_id})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    # Get property for email
    prop = await db.properties.find_one({"id": request["property_id"]})
    property_address = prop["address"] if prop else "Unknown"
    
    update_data = {
        "assigned_contractor_id": data.contractor_id,
        "assigned_contractor_name": f"{contractor['first_name']} {contractor['last_name']}",
        "status": MaintenanceStatus.assigned.value,
        "assigned_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    if data.scheduled_date:
        update_data["scheduled_date"] = data.scheduled_date
        update_data["status"] = MaintenanceStatus.scheduled.value
    
    if data.notes:
        update_data["assignment_notes"] = data.notes
    
    await db.maintenance_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    # Connect contractor to org if not already
    if request["org_id"] not in contractor.get("connected_organizations", []):
        await db.contractors.update_one(
            {"id": contractor["id"]},
            {"$addToSet": {"connected_organizations": request["org_id"]}}
        )
    
    # Send email notification
    scheduled_str = data.scheduled_date.strftime("%B %d, %Y at %I:%M %p") if data.scheduled_date else None
    background_tasks.add_task(
        send_contractor_assignment_email,
        contractor["email"],
        contractor["first_name"],
        request["title"],
        property_address,
        scheduled_str
    )
    
    return {"message": "Contractor assigned successfully"}


@router.get("/contractor/notifications")
async def get_contractor_notifications(contractor: dict = Depends(get_current_contractor)):
    notifications = await db.contractor_notifications.find({
        "contractor_id": contractor["id"]
    }).sort("created_at", -1).limit(50).to_list(50)
    
    return notifications


@router.put("/contractor/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    contractor: dict = Depends(get_current_contractor)
):
    await db.contractor_notifications.update_one(
        {"id": notification_id, "contractor_id": contractor["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}
