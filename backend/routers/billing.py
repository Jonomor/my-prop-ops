from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from datetime import datetime, timezone
from typing import List
import uuid
import logging
import stripe

from models.schemas import (
    CheckoutResponse, EmbeddedCheckoutResponse, SubscriptionStatusResponse
)
from utils.database import db
from utils.auth import get_current_user, verify_org_membership
from utils.config import STRIPE_API_KEY, STRIPE_PUBLISHABLE_KEY, SUBSCRIPTION_PLANS, PLAN_LIMITS
from utils.email import send_subscription_email

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)

router = APIRouter(prefix="/billing", tags=["Billing"])
logger = logging.getLogger(__name__)

stripe.api_key = STRIPE_API_KEY


@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout(
    plan_id: str,
    org_id: str,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    if plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = SUBSCRIPTION_PLANS[plan_id]
    
    try:
        stripe_checkout = StripeCheckout(STRIPE_API_KEY)
        
        checkout_request = CheckoutSessionRequest(
            success_url=f"https://housing-ops-dev.preview.emergentagent.com/billing?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url="https://housing-ops-dev.preview.emergentagent.com/billing?canceled=true",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"MyPropOps {plan['plan'].title()} - {plan['period'].title()}",
                        "description": f"{plan['plan'].title()} plan subscription"
                    },
                    "unit_amount": int(plan["amount"] * 100)
                },
                "quantity": 1
            }],
            mode="payment",
            metadata={
                "org_id": org_id,
                "user_id": current_user["id"],
                "plan_id": plan_id,
                "plan": plan["plan"],
                "period": plan["period"]
            }
        )
        
        response = stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": response.session_id,
            "org_id": org_id,
            "user_id": current_user["id"],
            "plan_id": plan_id,
            "amount": plan["amount"],
            "currency": "usd",
            "status": "pending",
            "payment_status": "initiated",
            "checkout_type": "redirect",
            "created_at": datetime.now(timezone.utc)
        })
        
        return CheckoutResponse(
            checkout_url=response.checkout_url,
            session_id=response.session_id
        )
        
    except Exception as e:
        logger.error(f"Checkout creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-embedded-checkout", response_model=EmbeddedCheckoutResponse)
async def create_embedded_checkout(
    plan_id: str,
    org_id: str,
    current_user: dict = Depends(get_current_user)
):
    await verify_org_membership(current_user["id"], org_id)
    
    if plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = SUBSCRIPTION_PLANS[plan_id]
    
    try:
        checkout_session = stripe.checkout.Session.create(
            ui_mode="embedded",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"MyPropOps {plan['plan'].title()} - {plan['period'].title()}",
                        "description": f"{plan['plan'].title()} plan subscription"
                    },
                    "unit_amount": int(plan["amount"] * 100)
                },
                "quantity": 1
            }],
            mode="payment",
            return_url=f"https://housing-ops-dev.preview.emergentagent.com/billing?session_id={{CHECKOUT_SESSION_ID}}",
            metadata={
                "org_id": org_id,
                "user_id": current_user["id"],
                "plan_id": plan_id,
                "plan": plan["plan"],
                "period": plan["period"]
            },
            payment_method_types=["card", "cashapp", "affirm", "klarna", "us_bank_account"]
        )
        
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": checkout_session.id,
            "org_id": org_id,
            "user_id": current_user["id"],
            "plan_id": plan_id,
            "amount": plan["amount"],
            "currency": "usd",
            "status": "pending",
            "payment_status": "initiated",
            "checkout_type": "embedded",
            "created_at": datetime.now(timezone.utc)
        })
        
        return EmbeddedCheckoutResponse(
            client_secret=checkout_session.client_secret,
            session_id=checkout_session.id,
            publishable_key=STRIPE_PUBLISHABLE_KEY
        )
        
    except Exception as e:
        logger.error(f"Embedded checkout creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/checkout-status/{session_id}")
async def get_checkout_status(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    try:
        stripe_checkout = StripeCheckout(STRIPE_API_KEY)
        response = stripe_checkout.get_checkout_session_status(session_id)
        
        if response.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction and transaction.get("status") != "complete":
                plan_id = transaction.get("plan_id", "")
                plan_info = SUBSCRIPTION_PLANS.get(plan_id, {})
                
                await db.organizations.update_one(
                    {"id": transaction["org_id"]},
                    {"$set": {
                        "plan": plan_info.get("plan", "standard"),
                        "billing_period": plan_info.get("period", "monthly"),
                        "plan_updated_at": datetime.now(timezone.utc),
                        "subscription_active": True
                    }}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "status": "complete",
                        "payment_status": "paid",
                        "completed_at": datetime.now(timezone.utc)
                    }}
                )
                
                user = await db.users.find_one({"id": transaction["user_id"]})
                if user:
                    background_tasks.add_task(
                        send_subscription_email,
                        user["email"],
                        user["name"],
                        plan_info.get("plan", "standard"),
                        transaction["amount"]
                    )
        
        return {
            "session_id": response.session_id,
            "status": response.status,
            "payment_status": response.payment_status
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session-status/{session_id}")
async def get_session_status(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.status == "complete" and session.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction and transaction.get("status") != "complete":
                plan_id = transaction.get("plan_id", "")
                plan_info = SUBSCRIPTION_PLANS.get(plan_id, {})
                
                await db.organizations.update_one(
                    {"id": transaction["org_id"]},
                    {"$set": {
                        "plan": plan_info.get("plan", "standard"),
                        "billing_period": plan_info.get("period", "monthly"),
                        "plan_updated_at": datetime.now(timezone.utc),
                        "subscription_active": True
                    }}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "status": "complete",
                        "payment_status": "paid",
                        "completed_at": datetime.now(timezone.utc)
                    }}
                )
                
                user = await db.users.find_one({"id": transaction["user_id"]})
                if user:
                    background_tasks.add_task(
                        send_subscription_email,
                        user["email"],
                        user["name"],
                        plan_info.get("plan", "standard"),
                        transaction["amount"]
                    )
        
        return {
            "session_id": session.id,
            "status": session.status,
            "payment_status": session.payment_status,
            "customer_email": session.customer_details.email if session.customer_details else None
        }
        
    except Exception as e:
        logger.error(f"Session status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    membership = await db.memberships.find_one({"user_id": current_user["id"]})
    if not membership:
        raise HTTPException(status_code=404, detail="No organization found")
    
    org = await db.organizations.find_one({"id": membership["org_id"]})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    plan = org.get("plan", "free")
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    
    properties_count = await db.properties.count_documents({"org_id": org["id"]})
    units_count = await db.units.count_documents({"org_id": org["id"]})
    members_count = await db.memberships.count_documents({"org_id": org["id"]})
    
    return SubscriptionStatusResponse(
        plan=plan,
        billing_period=org.get("billing_period", "monthly"),
        properties_used=properties_count,
        properties_limit=limits["max_properties"],
        units_used=units_count,
        units_limit=limits["max_units"],
        team_members_used=members_count,
        team_members_limit=limits["max_team_members"],
        features=limits["features"],
        subscription_active=org.get("subscription_active", False),
        plan_updated_at=org.get("plan_updated_at")
    )


@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "description": "Perfect for getting started",
                "monthly_price": 0,
                "annual_price": 0,
                "features": [
                    "Up to 2 properties",
                    "Up to 5 units",
                    "1 team member",
                    "Basic maintenance tracking"
                ]
            },
            {
                "id": "standard",
                "name": "Standard",
                "description": "For growing portfolios",
                "monthly_price": 49,
                "annual_price": 468,
                "features": [
                    "Up to 20 properties",
                    "Up to 40 units",
                    "5 team members",
                    "Full inspection workflows",
                    "Document storage (10GB)",
                    "Calendar integrations",
                    "Maintenance requests",
                    "Email notifications"
                ]
            },
            {
                "id": "pro",
                "name": "Pro",
                "description": "For large portfolios",
                "monthly_price": 149,
                "annual_price": 1428,
                "features": [
                    "Unlimited properties",
                    "Unlimited units",
                    "Unlimited team members",
                    "Full inspection workflows",
                    "Document storage (100GB)",
                    "24/7 priority support",
                    "Advanced analytics",
                    "Calendar integrations",
                    "Full API access",
                    "Tenant Portal access",
                    "Real-time tenant messaging",
                    "Maintenance requests",
                    "Priority work orders",
                    "Contractor Portal"
                ]
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "description": "Custom solutions",
                "monthly_price": 299,
                "annual_price": 2868,
                "features": [
                    "Everything in Pro",
                    "White-label options",
                    "Custom SLA",
                    "Dedicated support",
                    "Custom integrations",
                    "On-premise deployment options"
                ]
            }
        ]
    }
