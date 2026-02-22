from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List
import uuid

from models.schemas import PropertyCreate, PropertyResponse, UnitCreate, UnitResponse
from utils.database import db
from utils.auth import get_current_user, verify_org_membership, check_plan_limits

router = APIRouter(tags=["Properties"])


@router.get("/organizations/{org_id}/properties", response_model=List[PropertyResponse])
async def get_properties(org_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    properties = await db.properties.find({"org_id": org_id}).to_list(100)
    return [PropertyResponse(**p) for p in properties]


@router.post("/organizations/{org_id}/properties", response_model=PropertyResponse)
async def create_property(org_id: str, prop: PropertyCreate, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    await check_plan_limits(org_id, "property")
    
    property_id = str(uuid.uuid4())
    property_doc = {
        "id": property_id,
        "org_id": org_id,
        "name": prop.name,
        "address": prop.address,
        "property_type": prop.property_type,
        "unit_count": prop.unit_count,
        "year_built": prop.year_built,
        "created_at": datetime.now(timezone.utc)
    }
    await db.properties.insert_one(property_doc)
    
    return PropertyResponse(**property_doc)


@router.get("/organizations/{org_id}/properties/{property_id}", response_model=PropertyResponse)
async def get_property(org_id: str, property_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    prop = await db.properties.find_one({"id": property_id, "org_id": org_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return PropertyResponse(**prop)


@router.put("/organizations/{org_id}/properties/{property_id}", response_model=PropertyResponse)
async def update_property(
    org_id: str, property_id: str, prop: PropertyCreate, current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    existing = await db.properties.find_one({"id": property_id, "org_id": org_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    update_data = {
        "name": prop.name,
        "address": prop.address,
        "property_type": prop.property_type,
        "unit_count": prop.unit_count,
        "year_built": prop.year_built,
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.properties.update_one({"id": property_id}, {"$set": update_data})
    updated = await db.properties.find_one({"id": property_id})
    return PropertyResponse(**updated)


@router.delete("/organizations/{org_id}/properties/{property_id}")
async def delete_property(org_id: str, property_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    result = await db.properties.delete_one({"id": property_id, "org_id": org_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Delete associated units
    await db.units.delete_many({"property_id": property_id})
    
    return {"message": "Property deleted"}


# Unit Routes
@router.get("/organizations/{org_id}/units", response_model=List[UnitResponse])
async def get_units(org_id: str, property_id: str = None, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    query = {"org_id": org_id}
    if property_id:
        query["property_id"] = property_id
    
    units = await db.units.find(query).to_list(500)
    return [UnitResponse(**u) for u in units]


@router.post("/organizations/{org_id}/units", response_model=UnitResponse)
async def create_unit(org_id: str, unit: UnitCreate, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    await check_plan_limits(org_id, "unit")
    
    # Verify property exists
    prop = await db.properties.find_one({"id": unit.property_id, "org_id": org_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    unit_id = str(uuid.uuid4())
    unit_doc = {
        "id": unit_id,
        "org_id": org_id,
        "property_id": unit.property_id,
        "unit_number": unit.unit_number,
        "bedrooms": unit.bedrooms,
        "bathrooms": unit.bathrooms,
        "square_feet": unit.square_feet,
        "rent_amount": unit.rent_amount,
        "status": unit.status,
        "created_at": datetime.now(timezone.utc)
    }
    await db.units.insert_one(unit_doc)
    
    return UnitResponse(**unit_doc)


@router.get("/organizations/{org_id}/units/{unit_id}", response_model=UnitResponse)
async def get_unit(org_id: str, unit_id: str, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    unit = await db.units.find_one({"id": unit_id, "org_id": org_id})
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return UnitResponse(**unit)


@router.put("/organizations/{org_id}/units/{unit_id}", response_model=UnitResponse)
async def update_unit(org_id: str, unit_id: str, unit: UnitCreate, current_user: dict = Depends(get_current_user)):
    await verify_org_membership(current_user["id"], org_id)
    
    existing = await db.units.find_one({"id": unit_id, "org_id": org_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    update_data = {
        "property_id": unit.property_id,
        "unit_number": unit.unit_number,
        "bedrooms": unit.bedrooms,
        "bathrooms": unit.bathrooms,
        "square_feet": unit.square_feet,
        "rent_amount": unit.rent_amount,
        "status": unit.status,
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.units.update_one({"id": unit_id}, {"$set": update_data})
    updated = await db.units.find_one({"id": unit_id})
    return UnitResponse(**updated)
