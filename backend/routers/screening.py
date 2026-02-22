from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import random

from pydantic import BaseModel
from models.schemas import ScreeningRequestCreate, ScreeningResponse
from utils.database import db
from utils.auth import get_current_user, verify_org_membership

router = APIRouter(prefix="/screening", tags=["Tenant Screening"])


class ScreeningRequestForm(BaseModel):
    tenant_id: str
    screening_type: str = "comprehensive"  # basic, comprehensive, premium
    include_credit: bool = True
    include_criminal: bool = True
    include_eviction: bool = True
    include_income: bool = False


class ScreeningResultResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_name: str
    status: str
    screening_type: str
    credit_score: Optional[int] = None
    credit_status: Optional[str] = None
    criminal_check: Optional[str] = None
    criminal_details: Optional[str] = None
    eviction_history: Optional[str] = None
    eviction_count: Optional[int] = None
    income_verification: Optional[str] = None
    income_ratio: Optional[float] = None
    overall_recommendation: Optional[str] = None
    risk_score: Optional[int] = None
    requested_at: datetime
    completed_at: Optional[datetime] = None
    org_id: str


@router.post("/requests")
async def create_screening_request(
    org_id: str,
    request: ScreeningRequestForm,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    # Verify tenant exists
    tenant = await db.tenants.find_one({"id": request.tenant_id, "org_id": org_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check for existing pending request
    existing = await db.screening_requests.find_one({
        "tenant_id": request.tenant_id,
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Screening request already pending")
    
    screening_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    screening_doc = {
        "id": screening_id,
        "org_id": org_id,
        "tenant_id": request.tenant_id,
        "tenant_name": f"{tenant['first_name']} {tenant['last_name']}",
        "tenant_email": tenant["email"],
        "screening_type": request.screening_type,
        "include_credit": request.include_credit,
        "include_criminal": request.include_criminal,
        "include_eviction": request.include_eviction,
        "include_income": request.include_income,
        "status": "pending",
        "requested_by": current_user["id"],
        "requested_at": now
    }
    
    await db.screening_requests.insert_one(screening_doc)
    
    # Simulate async screening process (in production, this would call external APIs)
    background_tasks.add_task(process_screening, screening_id)
    
    return {
        "id": screening_id,
        "status": "pending",
        "message": "Screening request submitted. Results typically available within 2-5 minutes."
    }


async def process_screening(screening_id: str):
    """Simulate screening process - in production this would call real screening APIs"""
    import asyncio
    await asyncio.sleep(5)  # Simulate processing time
    
    screening = await db.screening_requests.find_one({"id": screening_id})
    if not screening:
        return
    
    # Generate simulated results (in production, these would come from real screening services)
    results = {}
    
    if screening.get("include_credit"):
        credit_score = random.randint(580, 800)
        results["credit_score"] = credit_score
        results["credit_status"] = "excellent" if credit_score >= 750 else "good" if credit_score >= 700 else "fair" if credit_score >= 650 else "poor"
    
    if screening.get("include_criminal"):
        has_criminal = random.random() < 0.1  # 10% chance
        results["criminal_check"] = "records_found" if has_criminal else "clear"
        results["criminal_details"] = "Minor traffic violation (2019)" if has_criminal else None
    
    if screening.get("include_eviction"):
        has_eviction = random.random() < 0.05  # 5% chance
        results["eviction_history"] = "records_found" if has_eviction else "clear"
        results["eviction_count"] = 1 if has_eviction else 0
    
    if screening.get("include_income"):
        results["income_verification"] = "verified"
        results["income_ratio"] = round(random.uniform(2.5, 4.5), 1)  # Income to rent ratio
    
    # Calculate overall recommendation
    risk_score = 100
    if results.get("credit_status") == "poor":
        risk_score -= 30
    elif results.get("credit_status") == "fair":
        risk_score -= 15
    
    if results.get("criminal_check") == "records_found":
        risk_score -= 20
    
    if results.get("eviction_history") == "records_found":
        risk_score -= 35
    
    if results.get("income_ratio") and results["income_ratio"] < 3.0:
        risk_score -= 10
    
    results["risk_score"] = max(0, risk_score)
    results["overall_recommendation"] = "approved" if risk_score >= 70 else "conditional" if risk_score >= 50 else "denied"
    
    # Update screening record
    await db.screening_requests.update_one(
        {"id": screening_id},
        {"$set": {
            **results,
            "status": "completed",
            "completed_at": datetime.now(timezone.utc)
        }}
    )


@router.get("/requests", response_model=List[ScreeningResultResponse])
async def get_screening_requests(
    org_id: str,
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    query = {"org_id": org_id}
    if status:
        query["status"] = status
    
    requests = await db.screening_requests.find(query).sort("requested_at", -1).to_list(100)
    
    return [ScreeningResultResponse(
        id=r["id"],
        tenant_id=r["tenant_id"],
        tenant_name=r["tenant_name"],
        status=r["status"],
        screening_type=r["screening_type"],
        credit_score=r.get("credit_score"),
        credit_status=r.get("credit_status"),
        criminal_check=r.get("criminal_check"),
        criminal_details=r.get("criminal_details"),
        eviction_history=r.get("eviction_history"),
        eviction_count=r.get("eviction_count"),
        income_verification=r.get("income_verification"),
        income_ratio=r.get("income_ratio"),
        overall_recommendation=r.get("overall_recommendation"),
        risk_score=r.get("risk_score"),
        requested_at=r["requested_at"],
        completed_at=r.get("completed_at"),
        org_id=r["org_id"]
    ) for r in requests]


@router.get("/requests/{screening_id}", response_model=ScreeningResultResponse)
async def get_screening_result(
    screening_id: str,
    current_user: dict = Depends(get_current_user)
):
    screening = await db.screening_requests.find_one({"id": screening_id})
    if not screening:
        raise HTTPException(status_code=404, detail="Screening request not found")
    
    await verify_org_membership(current_user["id"], screening["org_id"])
    
    return ScreeningResultResponse(
        id=screening["id"],
        tenant_id=screening["tenant_id"],
        tenant_name=screening["tenant_name"],
        status=screening["status"],
        screening_type=screening["screening_type"],
        credit_score=screening.get("credit_score"),
        credit_status=screening.get("credit_status"),
        criminal_check=screening.get("criminal_check"),
        criminal_details=screening.get("criminal_details"),
        eviction_history=screening.get("eviction_history"),
        eviction_count=screening.get("eviction_count"),
        income_verification=screening.get("income_verification"),
        income_ratio=screening.get("income_ratio"),
        overall_recommendation=screening.get("overall_recommendation"),
        risk_score=screening.get("risk_score"),
        requested_at=screening["requested_at"],
        completed_at=screening.get("completed_at"),
        org_id=screening["org_id"]
    )


@router.delete("/requests/{screening_id}")
async def delete_screening_request(
    screening_id: str,
    current_user: dict = Depends(get_current_user)
):
    screening = await db.screening_requests.find_one({"id": screening_id})
    if not screening:
        raise HTTPException(status_code=404, detail="Screening request not found")
    
    await verify_org_membership(current_user["id"], screening["org_id"])
    
    await db.screening_requests.delete_one({"id": screening_id})
    return {"message": "Screening request deleted"}
