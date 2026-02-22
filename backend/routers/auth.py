from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
import uuid

from models.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from utils.database import db
from utils.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)
from utils.email import send_welcome_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate, background_tasks: BackgroundTasks):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user.password)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create default organization
    org_id = str(uuid.uuid4())
    org_doc = {
        "id": org_id,
        "name": f"{user.name}'s Organization",
        "owner_id": user_id,
        "plan": "free",
        "billing_period": "monthly",
        "subscription_active": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.organizations.insert_one(org_doc)
    
    # Create membership
    membership_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "org_id": org_id,
        "role": "admin",
        "is_owner": True,
        "joined_at": datetime.now(timezone.utc)
    }
    await db.memberships.insert_one(membership_doc)
    
    # Send welcome email
    background_tasks.add_task(send_welcome_email, user.email, user.name)
    
    token = create_access_token(user_id, user.email)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user["id"], user["email"])
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"]
    )
