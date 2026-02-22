#!/usr/bin/env python3
"""
Create Demo Account for App Store Reviewers

This script creates a pre-populated demo account that Apple/Google reviewers
can use to test all app features without needing to create their own data.

Run this before submitting to app stores:
    python create_reviewer_account.py
"""

import asyncio
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from passlib.context import CryptContext

# Configuration
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

# Reviewer account credentials
REVIEWER_EMAIL = "reviewer@mypropops.com"
REVIEWER_PASSWORD = "ReviewerAccess2026!"
REVIEWER_NAME = "App Store Reviewer"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_reviewer_account():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Creating App Store Reviewer Demo Account...")
    print(f"Email: {REVIEWER_EMAIL}")
    print(f"Password: {REVIEWER_PASSWORD}")
    print("-" * 50)
    
    # Check if account already exists
    existing = await db.users.find_one({"email": REVIEWER_EMAIL})
    if existing:
        print("⚠️  Reviewer account already exists. Deleting and recreating...")
        await db.users.delete_one({"email": REVIEWER_EMAIL})
        await db.organizations.delete_many({"owner_email": REVIEWER_EMAIL})
        await db.memberships.delete_many({"user_id": existing["id"]})
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": REVIEWER_EMAIL,
        "password": pwd_context.hash(REVIEWER_PASSWORD),
        "name": REVIEWER_NAME,
        "subscription_plan": "pro",  # Give Pro access for full feature demo
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    print("✅ User created")
    
    # Create organization
    org_id = str(uuid.uuid4())
    org = {
        "id": org_id,
        "name": "Demo Property Management",
        "owner_id": user_id,
        "owner_email": REVIEWER_EMAIL,
        "subscription_plan": "pro",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.organizations.insert_one(org)
    print("✅ Organization created")
    
    # Create membership
    membership = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "org_id": org_id,
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.memberships.insert_one(membership)
    print("✅ Membership created")
    
    # Create sample properties
    properties = [
        {"name": "Sunset Apartments", "address": "123 Main St, San Francisco, CA 94102", "type": "apartment", "units": 8},
        {"name": "Oak View Condos", "address": "456 Oak Ave, San Francisco, CA 94110", "type": "condo", "units": 4},
        {"name": "Single Family Home", "address": "789 Pine St, San Francisco, CA 94115", "type": "house", "units": 1}
    ]
    
    property_ids = []
    for prop in properties:
        prop_id = str(uuid.uuid4())
        property_ids.append(prop_id)
        await db.properties.insert_one({
            "id": prop_id,
            "org_id": org_id,
            "name": prop["name"],
            "address": prop["address"],
            "property_type": prop["type"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Create units for each property
        for i in range(prop["units"]):
            unit_id = str(uuid.uuid4())
            await db.units.insert_one({
                "id": unit_id,
                "org_id": org_id,
                "property_id": prop_id,
                "unit_number": f"{i+1}{'A' if prop['units'] > 1 else ''}",
                "bedrooms": (i % 3) + 1,
                "bathrooms": 1 if i % 2 == 0 else 2,
                "rent_amount": 1500 + (i * 200),
                "status": "occupied" if i < prop["units"] - 1 else "vacant",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    print(f"✅ {len(properties)} properties with units created")
    
    # Create sample tenants
    tenant_names = ["John Smith", "Jane Doe", "Bob Johnson", "Alice Williams", "Charlie Brown"]
    for i, name in enumerate(tenant_names):
        tenant_id = str(uuid.uuid4())
        await db.tenants.insert_one({
            "id": tenant_id,
            "org_id": org_id,
            "name": name,
            "email": f"tenant{i+1}@example.com",
            "phone": f"(555) 123-{1000+i}",
            "lease_start": (datetime.now(timezone.utc) - timedelta(days=180)).isoformat(),
            "lease_end": (datetime.now(timezone.utc) + timedelta(days=185)).isoformat(),
            "rent_amount": 1500 + (i * 100),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    print(f"✅ {len(tenant_names)} tenants created")
    
    # Create sample maintenance requests
    maintenance_items = [
        {"title": "Leaking faucet in bathroom", "category": "plumbing", "status": "open", "priority": "medium"},
        {"title": "AC not cooling properly", "category": "hvac", "status": "in_progress", "priority": "high"},
        {"title": "Broken door handle", "category": "general", "status": "completed", "priority": "low"},
        {"title": "Electrical outlet not working", "category": "electrical", "status": "open", "priority": "medium"}
    ]
    
    for item in maintenance_items:
        await db.maintenance_requests.insert_one({
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "property_id": property_ids[0],
            "title": item["title"],
            "description": f"Details about: {item['title']}",
            "category": item["category"],
            "status": item["status"],
            "priority": item["priority"],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        })
    print(f"✅ {len(maintenance_items)} maintenance requests created")
    
    # Create sample inspections
    await db.inspections.insert_one({
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "property_id": property_ids[0],
        "type": "move_in",
        "status": "completed",
        "scheduled_date": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
        "completed_date": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
        "notes": "Property in excellent condition",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    print("✅ Sample inspection created")
    
    print("-" * 50)
    print("✅ Demo account setup complete!")
    print(f"\nReviewer Login Credentials:")
    print(f"  Email: {REVIEWER_EMAIL}")
    print(f"  Password: {REVIEWER_PASSWORD}")
    print(f"\nThis account has:")
    print(f"  - Pro subscription (all features unlocked)")
    print(f"  - {len(properties)} properties with multiple units")
    print(f"  - {len(tenant_names)} sample tenants")
    print(f"  - {len(maintenance_items)} maintenance requests")
    print(f"  - Sample inspection data")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_reviewer_account())
