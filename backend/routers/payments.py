from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import uuid
from pydantic import BaseModel

from utils.database import db
from utils.auth import get_current_user, get_current_tenant, verify_org_membership
from utils.email import send_transactional_email

router = APIRouter(prefix="/rent-payments", tags=["Rent Payments"])


class RentPaymentCreate(BaseModel):
    tenant_id: str
    unit_id: str
    amount: float
    due_date: datetime
    description: Optional[str] = None


class RentPaymentUpdate(BaseModel):
    status: Optional[str] = None
    paid_amount: Optional[float] = None
    paid_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class RentPaymentResponse(BaseModel):
    id: str
    org_id: str
    tenant_id: str
    tenant_name: str
    unit_id: str
    unit_number: str
    property_name: str
    amount: float
    paid_amount: float
    due_date: datetime
    paid_date: Optional[datetime] = None
    status: str  # pending, partial, paid, overdue, cancelled
    payment_method: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    late_fee: float = 0
    created_at: datetime


class RentSummary(BaseModel):
    total_expected: float
    total_collected: float
    total_outstanding: float
    overdue_count: int
    overdue_amount: float
    collection_rate: float
    payments_this_month: int


@router.post("", response_model=RentPaymentResponse)
async def create_rent_payment(
    org_id: str,
    payment: RentPaymentCreate,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    # Verify tenant and unit
    tenant = await db.tenants.find_one({"id": payment.tenant_id, "org_id": org_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    unit = await db.units.find_one({"id": payment.unit_id, "org_id": org_id})
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    prop = await db.properties.find_one({"id": unit["property_id"]})
    
    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    payment_doc = {
        "id": payment_id,
        "org_id": org_id,
        "tenant_id": payment.tenant_id,
        "unit_id": payment.unit_id,
        "property_id": unit["property_id"],
        "amount": payment.amount,
        "paid_amount": 0,
        "due_date": payment.due_date,
        "status": "pending",
        "description": payment.description,
        "late_fee": 0,
        "created_at": now,
        "created_by": current_user["id"]
    }
    
    await db.rent_payments.insert_one(payment_doc)
    
    return RentPaymentResponse(
        id=payment_id,
        org_id=org_id,
        tenant_id=payment.tenant_id,
        tenant_name=f"{tenant['first_name']} {tenant['last_name']}",
        unit_id=payment.unit_id,
        unit_number=unit["unit_number"],
        property_name=prop["name"] if prop else "Unknown",
        amount=payment.amount,
        paid_amount=0,
        due_date=payment.due_date,
        status="pending",
        description=payment.description,
        late_fee=0,
        created_at=now
    )


@router.get("", response_model=List[RentPaymentResponse])
async def get_rent_payments(
    org_id: str,
    status: str = None,
    tenant_id: str = None,
    month: int = None,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    query = {"org_id": org_id}
    if status:
        query["status"] = status
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    if month and year:
        start_date = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        query["due_date"] = {"$gte": start_date, "$lt": end_date}
    
    payments = await db.rent_payments.find(query).sort("due_date", -1).to_list(500)
    
    result = []
    for p in payments:
        tenant = await db.tenants.find_one({"id": p["tenant_id"]})
        unit = await db.units.find_one({"id": p["unit_id"]})
        prop = await db.properties.find_one({"id": p.get("property_id")})
        
        result.append(RentPaymentResponse(
            id=p["id"],
            org_id=p["org_id"],
            tenant_id=p["tenant_id"],
            tenant_name=f"{tenant['first_name']} {tenant['last_name']}" if tenant else "Unknown",
            unit_id=p["unit_id"],
            unit_number=unit["unit_number"] if unit else "Unknown",
            property_name=prop["name"] if prop else "Unknown",
            amount=p["amount"],
            paid_amount=p.get("paid_amount", 0),
            due_date=p["due_date"],
            paid_date=p.get("paid_date"),
            status=p["status"],
            payment_method=p.get("payment_method"),
            description=p.get("description"),
            notes=p.get("notes"),
            late_fee=p.get("late_fee", 0),
            created_at=p["created_at"]
        ))
    
    return result


@router.get("/summary", response_model=RentSummary)
async def get_rent_summary(
    org_id: str,
    month: int = None,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    now = datetime.now(timezone.utc)
    if not month:
        month = now.month
    if not year:
        year = now.year
    
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    
    query = {
        "org_id": org_id,
        "due_date": {"$gte": start_date, "$lt": end_date}
    }
    
    payments = await db.rent_payments.find(query).to_list(1000)
    
    total_expected = sum(p["amount"] for p in payments)
    total_collected = sum(p.get("paid_amount", 0) for p in payments)
    total_outstanding = total_expected - total_collected
    
    overdue = [p for p in payments if p["status"] == "overdue" or (p["due_date"] < now and p["status"] not in ["paid", "cancelled"])]
    overdue_count = len(overdue)
    overdue_amount = sum(p["amount"] - p.get("paid_amount", 0) for p in overdue)
    
    collection_rate = (total_collected / total_expected * 100) if total_expected > 0 else 0
    
    paid_this_month = len([p for p in payments if p["status"] == "paid"])
    
    return RentSummary(
        total_expected=total_expected,
        total_collected=total_collected,
        total_outstanding=total_outstanding,
        overdue_count=overdue_count,
        overdue_amount=overdue_amount,
        collection_rate=round(collection_rate, 1),
        payments_this_month=paid_this_month
    )


@router.put("/{payment_id}", response_model=RentPaymentResponse)
async def update_rent_payment(
    payment_id: str,
    update: RentPaymentUpdate,
    current_user: dict = Depends(get_current_user)
):
    payment = await db.rent_payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await verify_org_membership(current_user["id"], payment["org_id"])
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if update.status:
        update_data["status"] = update.status
    
    if update.paid_amount is not None:
        update_data["paid_amount"] = update.paid_amount
        # Auto-update status based on payment
        if update.paid_amount >= payment["amount"]:
            update_data["status"] = "paid"
        elif update.paid_amount > 0:
            update_data["status"] = "partial"
    
    if update.paid_date:
        update_data["paid_date"] = update.paid_date
    
    if update.payment_method:
        update_data["payment_method"] = update.payment_method
    
    if update.notes is not None:
        update_data["notes"] = update.notes
    
    await db.rent_payments.update_one({"id": payment_id}, {"$set": update_data})
    
    # Get updated payment
    updated = await db.rent_payments.find_one({"id": payment_id})
    tenant = await db.tenants.find_one({"id": updated["tenant_id"]})
    unit = await db.units.find_one({"id": updated["unit_id"]})
    prop = await db.properties.find_one({"id": updated.get("property_id")})
    
    return RentPaymentResponse(
        id=updated["id"],
        org_id=updated["org_id"],
        tenant_id=updated["tenant_id"],
        tenant_name=f"{tenant['first_name']} {tenant['last_name']}" if tenant else "Unknown",
        unit_id=updated["unit_id"],
        unit_number=unit["unit_number"] if unit else "Unknown",
        property_name=prop["name"] if prop else "Unknown",
        amount=updated["amount"],
        paid_amount=updated.get("paid_amount", 0),
        due_date=updated["due_date"],
        paid_date=updated.get("paid_date"),
        status=updated["status"],
        payment_method=updated.get("payment_method"),
        description=updated.get("description"),
        notes=updated.get("notes"),
        late_fee=updated.get("late_fee", 0),
        created_at=updated["created_at"]
    )


@router.post("/{payment_id}/record-payment")
async def record_payment(
    payment_id: str,
    amount: float,
    payment_method: str = "check",
    background_tasks: BackgroundTasks = None,
    current_user: dict = Depends(get_current_user)
):
    payment = await db.rent_payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await verify_org_membership(current_user["id"], payment["org_id"])
    
    new_paid_amount = payment.get("paid_amount", 0) + amount
    status = "paid" if new_paid_amount >= payment["amount"] else "partial"
    
    await db.rent_payments.update_one(
        {"id": payment_id},
        {"$set": {
            "paid_amount": new_paid_amount,
            "status": status,
            "paid_date": datetime.now(timezone.utc) if status == "paid" else None,
            "payment_method": payment_method,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Record transaction
    await db.rent_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "payment_id": payment_id,
        "org_id": payment["org_id"],
        "tenant_id": payment["tenant_id"],
        "amount": amount,
        "payment_method": payment_method,
        "recorded_by": current_user["id"],
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": f"Payment of ${amount:.2f} recorded", "status": status, "total_paid": new_paid_amount}


@router.post("/generate-monthly")
async def generate_monthly_rent(
    org_id: str,
    month: int,
    year: int,
    current_user: dict = Depends(get_current_user)
):
    """Generate rent payment records for all active tenants for a specific month"""
    await verify_org_membership(current_user["id"], org_id)
    
    # Get all active tenants with units
    tenants = await db.tenants.find({
        "org_id": org_id,
        "status": "active",
        "unit_id": {"$exists": True, "$ne": None}
    }).to_list(500)
    
    due_date = datetime(year, month, 1, tzinfo=timezone.utc)
    created_count = 0
    
    for tenant in tenants:
        # Check if payment already exists
        existing = await db.rent_payments.find_one({
            "tenant_id": tenant["id"],
            "due_date": due_date
        })
        
        if existing:
            continue
        
        unit = await db.units.find_one({"id": tenant["unit_id"]})
        if not unit or not unit.get("rent_amount"):
            continue
        
        payment_id = str(uuid.uuid4())
        payment_doc = {
            "id": payment_id,
            "org_id": org_id,
            "tenant_id": tenant["id"],
            "unit_id": tenant["unit_id"],
            "property_id": unit["property_id"],
            "amount": unit["rent_amount"],
            "paid_amount": 0,
            "due_date": due_date,
            "status": "pending",
            "description": f"Rent for {datetime(year, month, 1).strftime('%B %Y')}",
            "late_fee": 0,
            "created_at": datetime.now(timezone.utc),
            "created_by": current_user["id"]
        }
        
        await db.rent_payments.insert_one(payment_doc)
        created_count += 1
    
    return {"message": f"Generated {created_count} rent payment records for {datetime(year, month, 1).strftime('%B %Y')}"}


@router.delete("/{payment_id}")
async def delete_rent_payment(payment_id: str, current_user: dict = Depends(get_current_user)):
    payment = await db.rent_payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await verify_org_membership(current_user["id"], payment["org_id"])
    
    await db.rent_payments.delete_one({"id": payment_id})
    return {"message": "Payment record deleted"}


# Tenant Portal - View own rent payments
@router.get("/portal/my-payments")
async def get_tenant_payments(tenant: dict = Depends(get_current_tenant)):
    if not tenant.get("connected_organization"):
        return []
    
    linked_tenant = await db.tenants.find_one({"id": tenant.get("linked_tenant_id")}) if tenant.get("linked_tenant_id") else None
    
    if not linked_tenant:
        return []
    
    payments = await db.rent_payments.find({
        "tenant_id": linked_tenant["id"]
    }).sort("due_date", -1).to_list(50)
    
    result = []
    for p in payments:
        unit = await db.units.find_one({"id": p["unit_id"]})
        result.append({
            "id": p["id"],
            "amount": p["amount"],
            "paid_amount": p.get("paid_amount", 0),
            "due_date": p["due_date"],
            "paid_date": p.get("paid_date"),
            "status": p["status"],
            "unit_number": unit["unit_number"] if unit else "Unknown",
            "description": p.get("description"),
            "late_fee": p.get("late_fee", 0)
        })
    
    return result
