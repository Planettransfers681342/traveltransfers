from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, BackgroundTasks
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import asyncio
import httpx
import resend
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)

import talixo_service
import mytransfers_service

# ── Feature flags (read once at startup) ──────────────────────────────────────
TALIXO_ENABLED         = os.environ.get("TALIXO_ENABLED", "false").lower() == "true"
TALIXO_API_BOOKING     = os.environ.get("TALIXO_API_BOOKING", "false").lower() == "true"
MYTRANSFERS_ENABLED     = os.environ.get("MYTRANSFERS_ENABLED", "false").lower() == "true"
MYTRANSFERS_API_BOOKING = os.environ.get("MYTRANSFERS_API_BOOKING", "false").lower() == "true"

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration
stripe_api_key = os.environ['STRIPE_API_KEY']

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class VehicleType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    max_passengers: int
    max_luggage: int
    image_url: str
    base_price: float  # Base multiplier for pricing

class RoutePrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_location: str
    to_location: str
    economy_price: float
    business_price: float
    group_price: float
    bus_price: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoutePriceCreate(BaseModel):
    from_location: str
    to_location: str
    economy_price: float
    business_price: float
    group_price: float
    bus_price: float

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_type: str  # one-way or round-trip
    pickup_location: str
    dropoff_location: str
    pickup_date: str
    pickup_time: str
    return_date: Optional[str] = None
    return_time: Optional[str] = None
    passengers: int
    luggage: int
    vehicle_type: str
    passenger_name: str
    passenger_email: str
    passenger_phone: str
    flight_number: Optional[str] = None
    special_requests: Optional[str] = None
    admin_notes: Optional[str] = None
    price: float
    payment_status: str = "pending"  # pending, paid, refunded
    stripe_session_id: Optional[str] = None
    booking_status: str = "pending"  # pending, confirmed, completed, cancelled
    status_history: List[Dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    trip_type: str
    pickup_location: str
    dropoff_location: str
    pickup_date: str
    pickup_time: str
    return_date: Optional[str] = None
    return_time: Optional[str] = None
    passengers: int
    luggage: int
    vehicle_type: str
    passenger_name: str
    passenger_email: str
    passenger_phone: str
    flight_number: Optional[str] = None
    special_requests: Optional[str] = None

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    session_id: str
    amount: float
    currency: str = "gbp"
    payment_status: str = "initiated"  # initiated, paid, failed, expired
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuoteRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_type: str
    pickup_location: str
    dropoff_location: str
    pickup_date: str
    pickup_time: str
    return_date: Optional[str] = None
    return_time: Optional[str] = None
    passengers: int
    luggage: int
    vehicle_preference: Optional[str] = None
    passenger_name: str
    passenger_email: str
    passenger_phone: str
    flight_number: Optional[str] = None
    special_requests: Optional[str] = None
    status: str = "new"  # new, responded, converted, closed
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuoteRequestCreate(BaseModel):
    trip_type: str
    pickup_location: str
    dropoff_location: str
    pickup_date: str
    pickup_time: str
    return_date: Optional[str] = None
    return_time: Optional[str] = None
    passengers: int
    luggage: int
    vehicle_preference: Optional[str] = None
    passenger_name: str
    passenger_email: str
    passenger_phone: str
    flight_number: Optional[str] = None
    special_requests: Optional[str] = None

class QuoteStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class AdminLogin(BaseModel):
    password: str

class CheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

# ==================== VEHICLE TYPES (Static) ====================

VEHICLE_TYPES = [
    {
        "id": "economy",
        "name": "Economy Class",
        "description": "Perfect for couples or small families",
        "max_passengers": 4,
        "max_luggage": 3,
        "image_url": "https://images.unsplash.com/photo-1656200149554-15998526487e?crop=entropy&cs=srgb&fm=jpg&q=85",
        "base_price": 1.0
    },
    {
        "id": "business",
        "name": "Business Class",
        "description": "Luxury vehicles for business travelers",
        "max_passengers": 4,
        "max_luggage": 4,
        "image_url": "https://images.unsplash.com/photo-1618480483701-c31ac5590db4?crop=entropy&cs=srgb&fm=jpg&q=85",
        "base_price": 1.5
    },
    {
        "id": "group",
        "name": "Group Transfer",
        "description": "Spacious vans for larger groups",
        "max_passengers": 8,
        "max_luggage": 8,
        "image_url": "https://images.unsplash.com/photo-1656200149554-15998526487e?crop=entropy&cs=srgb&fm=jpg&q=85",
        "base_price": 2.0
    },
    {
        "id": "bus",
        "name": "Full Size Bus",
        "description": "Coach buses for large groups",
        "max_passengers": 50,
        "max_luggage": 50,
        "image_url": "https://images.unsplash.com/photo-1689977140799-c7e8692ab497?crop=entropy&cs=srgb&fm=jpg&q=85",
        "base_price": 5.0
    }
]

# Admin password from environment
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'planet2024')

# ==================== HELPER FUNCTIONS ====================

async def get_route_price(from_loc: str, to_loc: str) -> Optional[dict]:
    """Get price for a route (checks both directions)"""
    route = await db.route_prices.find_one({
        "$or": [
            {"from_location": from_loc, "to_location": to_loc},
            {"from_location": to_loc, "to_location": from_loc}
        ]
    }, {"_id": 0})
    return route

def calculate_booking_price(route_price: dict, vehicle_type: str, trip_type: str) -> float:
    """Calculate total price based on route, vehicle, and trip type"""
    price_map = {
        "economy": route_price.get("economy_price", 50.0),
        "business": route_price.get("business_price", 80.0),
        "group": route_price.get("group_price", 120.0),
        "bus": route_price.get("bus_price", 300.0)
    }
    base_price = price_map.get(vehicle_type, 50.0)
    
    # Round trip is 1.8x (10% discount)
    if trip_type == "round-trip":
        return round(base_price * 1.8, 2)
    return round(base_price, 2)

# ==================== API ROUTES ====================

@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes readiness probe"""
    return {"status": "healthy"}

@api_router.get("/health")
async def api_health_check():
    """Health check endpoint under /api prefix"""
    return {"status": "healthy"}

@api_router.get("/")
async def root():
    return {"message": "Planet Transfers API"}

# Vehicle Types
@api_router.get("/vehicles")
async def get_vehicles():
    return VEHICLE_TYPES

# Route Prices
@api_router.get("/routes/prices")
async def get_all_route_prices():
    prices = await db.route_prices.find({}, {"_id": 0}).to_list(1000)
    return prices

@api_router.post("/routes/prices")
async def create_route_price(route: RoutePriceCreate):
    # Check if route already exists
    existing = await get_route_price(route.from_location, route.to_location)
    if existing:
        raise HTTPException(status_code=400, detail="Route price already exists")
    
    route_obj = RoutePrice(**route.model_dump())
    doc = route_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.route_prices.insert_one(doc)
    return route_obj

@api_router.put("/routes/prices/{route_id}")
async def update_route_price(route_id: str, route: RoutePriceCreate):
    update_data = route.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.route_prices.update_one(
        {"id": route_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Route not found")
    
    updated = await db.route_prices.find_one({"id": route_id}, {"_id": 0})
    return updated

@api_router.delete("/routes/prices/{route_id}")
async def delete_route_price(route_id: str):
    result = await db.route_prices.delete_one({"id": route_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"message": "Route deleted"}

# Get quote for a specific route
@api_router.get("/quote")
async def get_quote(
    from_location: str,
    to_location: str,
    vehicle_type: str,
    trip_type: str = "one-way"
):
    route_price = await get_route_price(from_location, to_location)
    if not route_price:
        # Default prices if route not configured
        route_price = {
            "economy_price": 50.0,
            "business_price": 80.0,
            "group_price": 120.0,
            "bus_price": 300.0
        }
    
    price = calculate_booking_price(route_price, vehicle_type, trip_type)
    return {"price": price, "currency": "GBP"}

# Bookings
@api_router.post("/bookings")
async def create_booking(booking: BookingCreate):
    # Get route price
    route_price = await get_route_price(booking.pickup_location, booking.dropoff_location)
    if not route_price:
        route_price = {
            "economy_price": 50.0,
            "business_price": 80.0,
            "group_price": 120.0,
            "bus_price": 300.0
        }
    
    price = calculate_booking_price(route_price, booking.vehicle_type, booking.trip_type)
    
    now = datetime.now(timezone.utc)
    initial_history = [
        {
            "type": "booking_status",
            "from_status": None,
            "to_status": "pending",
            "timestamp": now.isoformat(),
            "note": "Booking created"
        },
        {
            "type": "payment_status",
            "from_status": None,
            "to_status": "pending",
            "timestamp": now.isoformat(),
            "note": "Awaiting payment"
        }
    ]
    
    booking_obj = Booking(
        **booking.model_dump(),
        price=price,
        status_history=initial_history
    )
    
    doc = booking_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.bookings.insert_one(doc)
    return booking_obj

@api_router.get("/bookings")
async def get_all_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

class BookingStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class PaymentStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class BookingNotesUpdate(BaseModel):
    admin_notes: str

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, update: BookingStatusUpdate):
    valid_statuses = ["pending", "confirmed", "completed", "cancelled"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid booking status")
    
    # Get current booking
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    old_status = booking.get("booking_status", "pending")
    
    # Create history entry
    history_entry = {
        "type": "booking_status",
        "from_status": old_status,
        "to_status": update.status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": update.note or f"Status changed from {old_status} to {update.status}"
    }
    
    result = await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {"booking_status": update.status},
            "$push": {"status_history": history_entry}
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking status updated", "new_status": update.status}

@api_router.put("/bookings/{booking_id}/payment-status")
async def update_payment_status(booking_id: str, update: PaymentStatusUpdate):
    valid_statuses = ["pending", "paid", "refunded"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid payment status")
    
    # Get current booking
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    old_status = booking.get("payment_status", "pending")
    
    # Create history entry
    history_entry = {
        "type": "payment_status",
        "from_status": old_status,
        "to_status": update.status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": update.note or f"Payment status changed from {old_status} to {update.status}"
    }
    
    result = await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {"payment_status": update.status},
            "$push": {"status_history": history_entry}
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Payment status updated", "new_status": update.status}

@api_router.put("/bookings/{booking_id}/notes")
async def update_booking_notes(booking_id: str, update: BookingNotesUpdate):
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"admin_notes": update.admin_notes}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Notes updated"}

# ==================== STRIPE PAYMENT ====================

@api_router.post("/checkout/create")
async def create_checkout_session(request: Request, checkout_req: CheckoutRequest):
    # Get booking details
    booking = await db.bookings.find_one({"id": checkout_req.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")
    
    # Setup Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Build URLs from provided origin
    origin = checkout_req.origin_url.rstrip('/')
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel?booking_id={checkout_req.booking_id}"
    
    # Create checkout session
    amount = float(booking["price"])  # Keep as float for Stripe
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="gbp",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": checkout_req.booking_id,
            "passenger_name": booking.get("passenger_name", ""),
            "passenger_email": booking.get("passenger_email", "")
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        booking_id=checkout_req.booking_id,
        session_id=session.session_id,
        amount=amount,
        currency="gbp",
        payment_status="initiated",
        metadata={
            "booking_id": checkout_req.booking_id,
            "passenger_name": booking.get("passenger_name", ""),
            "passenger_email": booking.get("passenger_email", "")
        }
    )
    
    tx_doc = transaction.model_dump()
    tx_doc['created_at'] = tx_doc['created_at'].isoformat()
    tx_doc['updated_at'] = tx_doc['updated_at'].isoformat()
    
    await db.payment_transactions.insert_one(tx_doc)
    
    # Update booking with session ID
    await db.bookings.update_one(
        {"id": checkout_req.booking_id},
        {"$set": {"stripe_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(request: Request, session_id: str):
    # Check if already processed
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if transaction and transaction.get("payment_status") == "paid":
        # Already processed, return cached status
        return {
            "status": "complete",
            "payment_status": "paid",
            "booking_id": transaction.get("booking_id")
        }
    
    # Get fresh status from Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction and booking if paid
        if status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Get booking_id from transaction
            if transaction:
                booking_id = transaction.get("booking_id")
                await db.bookings.update_one(
                    {"id": booking_id},
                    {"$set": {
                        "payment_status": "paid",
                        "booking_status": "confirmed"
                    }}
                )
        elif status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "expired",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "booking_id": transaction.get("booking_id") if transaction else None
        }
    except Exception as e:
        logger.error(f"Error checking checkout status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            booking_id = webhook_response.metadata.get("booking_id")
            
            if booking_id:
                # Add status history entries
                now = datetime.now(timezone.utc).isoformat()
                payment_history = {
                    "type": "payment_status",
                    "from_status": "pending",
                    "to_status": "paid",
                    "timestamp": now,
                    "note": "Payment received via Stripe"
                }
                booking_history = {
                    "type": "booking_status",
                    "from_status": "pending",
                    "to_status": "confirmed",
                    "timestamp": now,
                    "note": "Booking confirmed after payment"
                }
                
                await db.bookings.update_one(
                    {"id": booking_id},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "booking_status": "confirmed"
                        },
                        "$push": {
                            "status_history": {
                                "$each": [payment_history, booking_history]
                            }
                        }
                    }
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ==================== ADMIN ====================

@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    if login.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.get("/admin/stats")
async def get_admin_stats():
    total_bookings = await db.bookings.count_documents({})
    pending_bookings = await db.bookings.count_documents({"booking_status": "pending"})
    confirmed_bookings = await db.bookings.count_documents({"booking_status": "confirmed"})
    completed_bookings = await db.bookings.count_documents({"booking_status": "completed"})

    revenue_bookings = await db.bookings.find(
        {"payment_status": "paid", "booking_status": {"$in": ["confirmed", "completed"]}},
        {"_id": 0, "price": 1}
    ).to_list(1000)
    total_revenue = sum(b.get("price", 0) for b in revenue_bookings)

    # iWay transfer bookings
    total_iway = await db.iway_bookings.count_documents({})
    iway_payment_completed = await db.iway_bookings.count_documents({"payment_status": "payment_completed"})
    iway_pending = await db.iway_bookings.count_documents({"payment_status": "pending", "booking_status": "pending"})

    iway_revenue_docs = await db.iway_bookings.find(
        {"payment_status": "payment_completed"},
        {"_id": 0, "price": 1}
    ).to_list(1000)
    iway_revenue = sum(b.get("price") or 0 for b in iway_revenue_docs)

    return {
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings,
        "total_revenue": round(total_revenue, 2),
        "total_iway_bookings": total_iway,
        "iway_payment_completed": iway_payment_completed,
        "iway_pending": iway_pending,
        "iway_revenue": round(iway_revenue, 2),
        # Talixo stats (zero when not enabled)
        "total_talixo_bookings":   await db.talixo_bookings.count_documents({}),
        "talixo_confirmed":        await db.talixo_bookings.count_documents({"booking_status": "confirmed"}),
        "talixo_pending_manual":   await db.talixo_bookings.count_documents({"booking_status": "request_received"}),
        "talixo_enabled":          TALIXO_ENABLED,
        "talixo_api_booking":      TALIXO_API_BOOKING,
        # MyTransfers stats (zero when not enabled)
        "total_mytransfers_bookings":  await db.mytransfers_bookings.count_documents({}),
        "mytransfers_confirmed":       await db.mytransfers_bookings.count_documents({"booking_status": "confirmed"}),
        "mytransfers_pending_manual":  await db.mytransfers_bookings.count_documents({"booking_status": "request_received"}),
        "mytransfers_enabled":         MYTRANSFERS_ENABLED,
        "mytransfers_api_booking":     MYTRANSFERS_API_BOOKING,
    }

# ==================== SEED DATA ====================

# ==================== QUOTES ====================

@api_router.post("/quotes")
async def create_quote(quote: QuoteRequestCreate):
    """Create a new quote request"""
    quote_obj = QuoteRequest(**quote.model_dump())
    doc = quote_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.quotes.insert_one(doc)
    return quote_obj

@api_router.get("/quotes")
async def get_all_quotes():
    """Get all quotes for admin panel"""
    quotes = await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return quotes

@api_router.get("/quotes/{quote_id}")
async def get_quote_by_id(quote_id: str):
    """Get a single quote by ID"""
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote

@api_router.put("/quotes/{quote_id}/status")
async def update_quote_status(quote_id: str, update: QuoteStatusUpdate):
    """Update quote status"""
    valid_statuses = ["new", "responded", "converted", "closed"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid quote status")
    
    update_data = {"status": update.status}
    if update.admin_notes is not None:
        update_data["admin_notes"] = update.admin_notes
    
    result = await db.quotes.update_one(
        {"id": quote_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    return {"message": "Quote status updated", "new_status": update.status}

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str):
    """Delete a quote"""
    result = await db.quotes.delete_one({"id": quote_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote deleted"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial route prices"""
    default_routes = [
        {"from_location": "London Heathrow", "to_location": "London City Center", "economy_price": 45.0, "business_price": 75.0, "group_price": 110.0, "bus_price": 280.0},
        {"from_location": "London Gatwick", "to_location": "London City Center", "economy_price": 55.0, "business_price": 85.0, "group_price": 130.0, "bus_price": 320.0},
        {"from_location": "London Stansted", "to_location": "London City Center", "economy_price": 60.0, "business_price": 95.0, "group_price": 145.0, "bus_price": 350.0},
        {"from_location": "Madrid Airport", "to_location": "Madrid City Center", "economy_price": 35.0, "business_price": 55.0, "group_price": 85.0, "bus_price": 200.0},
        {"from_location": "Seychelles Airport", "to_location": "Mahé Hotels", "economy_price": 40.0, "business_price": 65.0, "group_price": 95.0, "bus_price": 220.0},
        {"from_location": "Zurich Airport", "to_location": "Zurich City Center", "economy_price": 50.0, "business_price": 80.0, "group_price": 120.0, "bus_price": 290.0},
        {"from_location": "Geneva Airport", "to_location": "Geneva City Center", "economy_price": 45.0, "business_price": 70.0, "group_price": 105.0, "bus_price": 260.0},
    ]
    
    for route_data in default_routes:
        existing = await get_route_price(route_data["from_location"], route_data["to_location"])
        if not existing:
            route_obj = RoutePrice(**route_data)
            doc = route_obj.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            await db.route_prices.insert_one(doc)
    
    return {"message": "Seed data created"}

# ==================== SITEMAP ====================

# SEO destination and route data
SEO_DESTINATIONS = ['sofia', 'london', 'paris', 'dubai', 'zurich']
SEO_ROUTES = ['zurich-to-st-moritz', 'sofia-airport-to-bansko', 'paris-airport-to-disneyland']

@app.get("/sitemap.xml", response_class=PlainTextResponse)
async def sitemap():
    """Generate dynamic sitemap for SEO"""
    base_url = "https://planettransfers.online"
    today = datetime.now().strftime('%Y-%m-%d')
    
    urls = [
        # Main pages
        {"loc": f"{base_url}/", "priority": "1.0", "changefreq": "daily"},
        {"loc": f"{base_url}/book", "priority": "0.9", "changefreq": "daily"},
        {"loc": f"{base_url}/quote", "priority": "0.8", "changefreq": "weekly"},
        {"loc": f"{base_url}/terms-conditions", "priority": "0.3", "changefreq": "monthly"},
        {"loc": f"{base_url}/privacy-policy", "priority": "0.3", "changefreq": "monthly"},
        {"loc": f"{base_url}/cookie-policy", "priority": "0.3", "changefreq": "monthly"},
    ]
    
    # Add destination pages
    for dest in SEO_DESTINATIONS:
        urls.append({
            "loc": f"{base_url}/airport-transfer/{dest}",
            "priority": "0.8",
            "changefreq": "weekly"
        })
    
    # Add route pages
    for route in SEO_ROUTES:
        urls.append({
            "loc": f"{base_url}/transfer/{route}",
            "priority": "0.8",
            "changefreq": "weekly"
        })
    
    # Build XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in urls:
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{url["loc"]}</loc>\n'
        xml_content += f'    <lastmod>{today}</lastmod>\n'
        xml_content += f'    <changefreq>{url["changefreq"]}</changefreq>\n'
        xml_content += f'    <priority>{url["priority"]}</priority>\n'
        xml_content += '  </url>\n'
    
    xml_content += '</urlset>'
    
    return PlainTextResponse(content=xml_content, media_type="application/xml")


# ==================== IWAY PROXY ====================

IWAY_USER_ID = "143708"
IWAY_API_BASE = "https://ng-api.iwayex.com"

# ==================== EMAIL (RESEND) ====================

resend.api_key = os.environ.get('RESEND_API_KEY', '')
_SENDER_EMAIL      = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
_SUPPORT_EMAIL     = os.environ.get('ADMIN_EMAIL',  'bookings@planettransfers.online')
_ADMIN_NOTIFY_EMAIL = os.environ.get('ADMIN_EMAIL', 'bookings@planettransfers.online')


def _format_email_date(date_str: str) -> str:
    try:
        from datetime import datetime as _dt
        return _dt.strptime(date_str, '%Y-%m-%d').strftime('%A, %d %B %Y')
    except Exception:
        return date_str


def _build_confirmation_html(booking: dict) -> str:
    sym = '£' if booking.get('currency', 'GBP') == 'GBP' else ('€' if booking.get('currency') == 'EUR' else '$')
    price_str = f"{sym}{float(booking['price']):.2f}" if booking.get('price') else 'See payment receipt'
    pt_ref = f"PT-{booking['id'][:8].upper()}"

    iway_ref_row = (
        f'<p style="margin:6px 0 0;color:#9ca3af;font-size:12px;font-family:Arial,sans-serif;">'
        f'iWay Ref: {booking["iway_booker_number"]}</p>'
        if booking.get('iway_booker_number') else ''
    )

    date_time = _format_email_date(booking.get('pickup_date', ''))
    if booking.get('pickup_time'):
        date_time += f" at {booking['pickup_time']}"

    flight_row = ''
    if booking.get('flight_number'):
        flight_row = f'''
        <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;">
          <table width="100%"><tr>
            <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;font-family:Arial,sans-serif;vertical-align:top;padding-top:2px;">Flight</td>
            <td style="color:#111827;font-size:14px;font-weight:500;font-family:Arial,sans-serif;">{booking["flight_number"]}</td>
          </tr></table>
        </td></tr>'''

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Booking Confirmation – Planet Transfers</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background-color:#0f1419;padding:32px 40px;text-align:center;border-radius:12px 12px 0 0;">
    <p style="margin:0;color:#d4af37;font-size:22px;font-weight:bold;letter-spacing:2px;font-family:Georgia,'Times New Roman',serif;">PLANET TRANSFERS</p>
    <p style="margin:8px 0 0;color:#6b7280;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Booking Confirmation</p>
  </td></tr>

  <!-- Gold bar -->
  <tr><td style="background-color:#d4af37;padding:13px 40px;text-align:center;">
    <p style="margin:0;color:#0f1419;font-size:12px;font-weight:bold;letter-spacing:1px;font-family:Arial,sans-serif;">BOOKING REQUEST RECEIVED SUCCESSFULLY</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background-color:#ffffff;padding:40px;">

    <p style="margin:0 0 18px;color:#374151;font-size:15px;font-family:Arial,sans-serif;">Dear {booking.get('passenger_name', 'Valued Customer')},</p>
    <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.7;font-family:Arial,sans-serif;">Your booking request has been received successfully. Payment was completed with our secure partner. Your transfer details are being processed and you will be contacted before your scheduled pickup.</p>

    <!-- Booking ref -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr><td style="background-color:#faf7ee;border:2px solid #d4af37;border-radius:10px;padding:22px;text-align:center;">
        <p style="margin:0 0 6px;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:3px;font-family:Arial,sans-serif;">Your Booking Reference</p>
        <p style="margin:0;color:#0f1419;font-size:28px;font-weight:bold;letter-spacing:4px;font-family:Georgia,'Times New Roman',serif;">{pt_ref}</p>
        {iway_ref_row}
      </td></tr>
    </table>

    <!-- Transfer details table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
      <tr><td style="background-color:#f9fafb;padding:14px 20px;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0;color:#0f1419;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Transfer Details</p>
      </td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;"><table width="100%"><tr>
        <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;font-family:Arial,sans-serif;vertical-align:top;padding-top:2px;">From</td>
        <td style="color:#111827;font-size:14px;font-weight:500;font-family:Arial,sans-serif;">{booking.get('pickup_location','')}</td>
      </tr></table></td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;"><table width="100%"><tr>
        <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;font-family:Arial,sans-serif;vertical-align:top;padding-top:2px;">To</td>
        <td style="color:#111827;font-size:14px;font-weight:500;font-family:Arial,sans-serif;">{booking.get('dropoff_location','')}</td>
      </tr></table></td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;"><table width="100%"><tr>
        <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;font-family:Arial,sans-serif;">Date & Time</td>
        <td style="color:#111827;font-size:14px;font-weight:500;font-family:Arial,sans-serif;">{date_time}</td>
      </tr></table></td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;"><table width="100%"><tr>
        <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;font-family:Arial,sans-serif;">Passengers</td>
        <td style="color:#111827;font-size:14px;font-weight:500;font-family:Arial,sans-serif;">{booking.get('passengers',1)}</td>
      </tr></table></td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;"><table width="100%"><tr>
        <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;font-family:Arial,sans-serif;">Vehicle</td>
        <td style="color:#111827;font-size:14px;font-weight:500;font-family:Arial,sans-serif;">{booking.get('vehicle_class','Standard')}</td>
      </tr></table></td></tr>
      {flight_row}
      <tr><td style="padding:16px 20px;background-color:#f9fafb;"><table width="100%"><tr>
        <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:110px;font-family:Arial,sans-serif;">Amount Paid</td>
        <td style="color:#0f1419;font-size:20px;font-weight:bold;font-family:Georgia,'Times New Roman',serif;">{price_str}</td>
      </tr></table></td></tr>
    </table>

    <!-- What happens next -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:10px;overflow:hidden;">
      <tr><td style="background-color:#f0fdf4;padding:20px 24px;">
        <p style="margin:0 0 12px;color:#15803d;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">What Happens Next</p>
        <p style="margin:0 0 8px;color:#374151;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">&#10003;&nbsp; Your booking has been passed to our transfer partner for fulfilment.</p>
        <p style="margin:0 0 8px;color:#374151;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">&#10003;&nbsp; Your driver will be assigned and will contact you before your pickup time.</p>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">&#10003;&nbsp; For airport pickups, your driver will monitor your flight for any delays.</p>
      </td></tr>
    </table>

    <!-- Cancellation policy -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:10px;overflow:hidden;">
      <tr><td style="background-color:#fffbeb;border:1px solid #fde68a;padding:18px 24px;">
        <p style="margin:0 0 6px;color:#92400e;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Cancellation Policy</p>
        <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">Free cancellation up to 48 hours before your scheduled pickup. Cancellations within 48 hours may be subject to a charge. To cancel or amend your booking, please contact us with your booking reference.</p>
      </td></tr>
    </table>

    <!-- Need help -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;border-radius:10px;overflow:hidden;">
      <tr><td style="background-color:#0f1419;padding:24px;">
        <p style="margin:0 0 6px;color:#ffffff;font-size:14px;font-weight:bold;font-family:Arial,sans-serif;">Need Help?</p>
        <p style="margin:0 0 14px;color:#9ca3af;font-size:12px;font-family:Arial,sans-serif;">Please quote your reference <strong style="color:#d4af37;">{pt_ref}</strong> when contacting us.</p>
        <a href="mailto:{_SUPPORT_EMAIL}" style="display:inline-block;color:#d4af37;font-size:13px;text-decoration:none;font-family:Arial,sans-serif;margin-bottom:10px;">{_SUPPORT_EMAIL}</a><br>
        <a href="https://wa.me/447739476432?text=Hi%2C%20I%27d%20like%20help%20with%20a%20transfer%20booking" style="display:inline-block;background-color:#25D366;color:#ffffff;font-size:12px;font-weight:bold;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;margin-top:4px;">WhatsApp: +44 7739 476432</a>
      </td></tr>
    </table>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
    <p style="margin:0 0 4px;color:#111827;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">Planet Transfers</p>
    <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;font-family:Arial,sans-serif;">Premium Airport Transfer Service</p>
    <p style="margin:12px 0 0;color:#d1d5db;font-size:10px;font-family:Arial,sans-serif;">This is an automated confirmation. Please do not reply directly to this email.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>"""


_ADMIN_NOTIFY_EMAIL = os.environ.get('ADMIN_EMAIL', 'bookings@planettransfers.online')


def _build_admin_notification_html(booking: dict) -> str:
    sym = '£' if booking.get('currency', 'GBP') == 'GBP' else ('€' if booking.get('currency') == 'EUR' else '$')
    price_str = f"{sym}{float(booking['price']):.2f}" if booking.get('price') else '—'
    pt_ref = f"PT-{booking['id'][:8].upper()}"
    date_time = _format_email_date(booking.get('pickup_date', ''))
    if booking.get('pickup_time'):
        date_time += f" at {booking['pickup_time']}"

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>New Booking – {pt_ref}</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <tr><td style="background-color:#0f1419;padding:24px 32px;border-radius:10px 10px 0 0;text-align:center;">
    <p style="margin:0;color:#d4af37;font-size:18px;font-weight:bold;letter-spacing:2px;font-family:Georgia,serif;">PLANET TRANSFERS</p>
    <p style="margin:6px 0 0;color:#6b7280;font-size:11px;letter-spacing:2px;font-family:Arial,sans-serif;">NEW BOOKING RECEIVED</p>
  </td></tr>

  <tr><td style="background-color:#d4af37;padding:12px 32px;text-align:center;">
    <p style="margin:0;color:#0f1419;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">
      {pt_ref} &nbsp;·&nbsp; {price_str} &nbsp;·&nbsp; Payment Completed
    </p>
  </td></tr>

  <tr><td style="background-color:#ffffff;padding:32px;">

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr><td style="background-color:#f9fafb;padding:12px 18px;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#0f1419;font-family:Arial,sans-serif;">Passenger</p>
      </td></tr>
      <tr><td style="padding:14px 18px;">
        <p style="margin:0;font-size:15px;font-weight:bold;color:#111827;font-family:Arial,sans-serif;">{booking.get('passenger_name','')}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;font-family:Arial,sans-serif;">{booking.get('passenger_email','')}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;font-family:Arial,sans-serif;">{booking.get('passenger_phone','')}</p>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr><td style="background-color:#f9fafb;padding:12px 18px;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#0f1419;font-family:Arial,sans-serif;">Transfer Details</p>
      </td></tr>
      <tr><td style="padding:14px 18px;">
        <table width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:100px;padding:5px 0;font-family:Arial,sans-serif;vertical-align:top;">From</td>
            <td style="color:#111827;font-size:13px;font-family:Arial,sans-serif;padding:5px 0;">{booking.get('pickup_location','')}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:5px 0;font-family:Arial,sans-serif;vertical-align:top;">To</td>
            <td style="color:#111827;font-size:13px;font-family:Arial,sans-serif;padding:5px 0;">{booking.get('dropoff_location','')}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:5px 0;font-family:Arial,sans-serif;">Date</td>
            <td style="color:#111827;font-size:13px;font-family:Arial,sans-serif;padding:5px 0;">{date_time}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:5px 0;font-family:Arial,sans-serif;">Pax</td>
            <td style="color:#111827;font-size:13px;font-family:Arial,sans-serif;padding:5px 0;">{booking.get('passengers',1)}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:5px 0;font-family:Arial,sans-serif;">Vehicle</td>
            <td style="color:#111827;font-size:13px;font-family:Arial,sans-serif;padding:5px 0;">{booking.get('vehicle_class','Standard')}</td>
          </tr>
          {'<tr><td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:5px 0;font-family:Arial,sans-serif;">Flight</td><td style="color:#111827;font-size:13px;font-family:Arial,sans-serif;padding:5px 0;">' + booking['flight_number'] + '</td></tr>' if booking.get('flight_number') else ''}
          {'<tr><td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:5px 0;font-family:Arial,sans-serif;">Sign</td><td style="color:#111827;font-size:13px;font-family:Arial,sans-serif;padding:5px 0;">' + booking['greeting_sign'] + '</td></tr>' if booking.get('greeting_sign') else ''}
          <tr>
            <td style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:5px 0;font-family:Arial,sans-serif;">iWay Ref</td>
            <td style="color:#111827;font-size:13px;font-family:Arial,sans-serif;padding:5px 0;">{booking.get('iway_booker_number','—')}</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="background-color:#f9fafb;padding:12px 18px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#0f1419;font-size:16px;font-weight:bold;font-family:Georgia,serif;">{price_str} &nbsp;<span style="font-size:12px;color:#9ca3af;font-family:Arial,sans-serif;">paid</span></p>
      </td></tr>
    </table>

    <p style="margin:0;text-align:center;">
      <a href="{os.environ.get('CORS_ORIGINS','').split(',')[0].strip()}/admin" style="display:inline-block;background-color:#d4af37;color:#0f1419;font-weight:bold;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;font-family:Arial,sans-serif;">View in Admin Dashboard</a>
    </p>

  </td></tr>

  <tr><td style="background-color:#f9fafb;padding:16px 32px;text-align:center;border-radius:0 0 10px 10px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:10px;font-family:Arial,sans-serif;">Planet Transfers · Admin Notification · {pt_ref}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>"""


async def _send_admin_notification(booking: dict) -> None:
    """Send admin alert email for a new paid booking (background task)."""
    if not resend.api_key:
        return
    pt_ref = f"PT-{booking['id'][:8].upper()}"
    params: Dict = {
        "from": f"Planet Transfers <{_SENDER_EMAIL}>",
        "to": [_ADMIN_NOTIFY_EMAIL],
        "subject": f"New Booking {pt_ref} – {booking.get('passenger_name','')} | Planet Transfers",
        "html": _build_admin_notification_html(booking),
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Admin notification sent for {pt_ref}")
    except Exception as exc:
        logger.error(f"Admin notification failed for {pt_ref}: {exc}")


async def _send_booking_confirmation(booking: dict) -> None:
    """Send booking confirmation email and persist the result to DB (background task)."""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not set — skipping confirmation email")
        return

    pt_ref = f"PT-{booking['id'][:8].upper()}"
    params: Dict = {
        "from": f"Planet Transfers <{_SENDER_EMAIL}>",
        "to": [booking["passenger_email"]],
        "subject": f"Booking Confirmation – {pt_ref} | Planet Transfers",
        "html": _build_confirmation_html(booking),
    }

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        await db.iway_bookings.update_one(
            {"id": booking["id"]},
            {"$set": {
                "email_sent": True,
                "email_sent_at": datetime.now(timezone.utc).isoformat(),
                "email_id": email_id,
            }}
        )
        logger.info(f"Confirmation email sent for {pt_ref} → {booking['passenger_email']}")
    except Exception as exc:
        await db.iway_bookings.update_one(
            {"id": booking["id"]},
            {"$set": {"email_sent": False, "email_error": str(exc)}}
        )
        logger.error(f"Failed to send confirmation email for {pt_ref}: {exc}")

@api_router.get("/iway/search")
async def iway_search(pickup: str, dropoff: str, currency: str = "GBP", lang: str = "en"):
    """Proxy iWay transfer search: geocode both locations then fetch vehicle prices."""
    async with httpx.AsyncClient(timeout=15.0) as client_h:
        # Step 1: Find place IDs
        from_resp = await client_h.get(
            f"{IWAY_API_BASE}/v1/places/find",
            params={"term": pickup, "lang": lang, "user_id": IWAY_USER_ID}
        )
        to_resp = await client_h.get(
            f"{IWAY_API_BASE}/v1/places/find",
            params={"term": dropoff, "lang": lang, "user_id": IWAY_USER_ID}
        )
        from_data = from_resp.json()
        to_data = to_resp.json()

        from_places = from_data.get("result") or []
        to_places = to_data.get("result") or []

        if not from_places:
            raise HTTPException(status_code=404, detail=f"Pickup location not found: {pickup}")
        if not to_places:
            raise HTTPException(status_code=404, detail=f"Dropoff location not found: {dropoff}")

        from_place = from_places[0]
        to_place = to_places[0]

        # Step 2: Get geometry for both places
        from_geo_resp = await client_h.get(
            f"{IWAY_API_BASE}/v1/places/{from_place['place_id']}",
            params={"user_id": IWAY_USER_ID, "lang": lang}
        )
        to_geo_resp = await client_h.get(
            f"{IWAY_API_BASE}/v1/places/{to_place['place_id']}",
            params={"user_id": IWAY_USER_ID, "lang": lang}
        )
        from_geo = from_geo_resp.json().get("result", {}).get("geometry", {}).get("location", {})
        to_geo = to_geo_resp.json().get("result", {}).get("geometry", {}).get("location", {})

        if not from_geo or not to_geo:
            raise HTTPException(status_code=404, detail="Could not resolve locations")

        from_point = f"{from_geo['lat']},{from_geo['lng']}"
        to_point = f"{to_geo['lat']},{to_geo['lng']}"

        # Step 3: Fetch prices
        prices_resp = await client_h.get(
            f"{IWAY_API_BASE}/v1/prices",
            params={
                "lang": lang,
                "user_id": IWAY_USER_ID,
                "currency": currency,
                "start_place_point": from_point,
                "finish_place_point": to_point,
                "platform": "3"
            }
        )
        prices_data = prices_resp.json()
        vehicles = prices_data.get("result") or []

    return {
        "vehicles": vehicles,
        "from_place": {
            "place_id": from_place["place_id"],
            "description": from_place.get("description", pickup),
            "name": from_place.get("structured_formatting", {}).get("main_text", pickup),
            "location": from_point,
            "address": from_place.get("description", pickup),
            "types": from_place.get("types", [])
        },
        "to_place": {
            "place_id": to_place["place_id"],
            "description": to_place.get("description", dropoff),
            "name": to_place.get("structured_formatting", {}).get("main_text", dropoff),
            "location": to_point,
            "address": to_place.get("description", dropoff),
            "types": to_place.get("types", [])
        }
    }


class IWayBookingRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Trip
    pickup_location: str = ""
    dropoff_location: str = ""
    pickup_date: str = ""
    pickup_time: str = ""
    passengers: int = 1
    luggage: int = 0
    flight_number: Optional[str] = None
    greeting_sign: Optional[str] = None
    # Vehicle
    vehicle_class: str = ""
    price: Optional[float] = None
    currency: str = "GBP"
    # Customer
    passenger_name: str = ""
    passenger_email: str = ""
    passenger_phone: str = ""
    # iWay refs
    from_place_id: str = ""
    to_place_id: str = ""
    price_id: Optional[int] = None
    iway_transaction: Optional[str] = None
    iway_booker_number: Optional[str] = None
    # Status
    supplier: str = "iway"
    payment_status: str = "pending"   # pending | payment_completed | cancelled
    booking_status: str = "pending"   # pending | confirmed | completed | cancelled | iway_error
    admin_notes: Optional[str] = None

class IWayBookingStatusUpdate(BaseModel):
    payment_status: Optional[str] = None
    booking_status: Optional[str] = None
    admin_notes: Optional[str] = None

class IWayBookingRequest(BaseModel):
    price_id: int
    from_place_id: str
    to_place_id: str
    from_location: str          # "lat,lng"
    to_location: str            # "lat,lng"
    from_address: str
    to_address: str
    pickup_datetime: str        # "YYYY-MM-DD HH:mm"
    currency: str = "GBP"
    passenger_name: str
    passenger_email: str
    passenger_phone: str        # any format — we strip + and spaces
    flight_number: Optional[str] = None
    terminal_number: Optional[str] = None
    adults_count: int = 1
    children_count: int = 0
    comment: Optional[str] = ""
    # Extra fields used to save our own booking record
    pickup_location: Optional[str] = ""
    dropoff_location: Optional[str] = ""
    luggage_count: int = 0
    vehicle_class: Optional[str] = ""
    greeting_sign: Optional[str] = None
    displayed_price: Optional[float] = None


@api_router.post("/iway/book")
async def iway_book(req: IWayBookingRequest):
    """Create a booking via iWay API, persist to our DB, return the payment URL."""
    import re as _re
    phone_clean = _re.sub(r"[\s\-\+\(\)]", "", req.passenger_phone)
    pickup_time_full = req.pickup_datetime.replace("T", " ")[:16]  # "YYYY-MM-DD HH:mm"
    pickup_date_str, pickup_t_str = pickup_time_full.split(" ") if " " in pickup_time_full else (pickup_time_full[:10], pickup_time_full[11:16])

    # ── Step 0: Persist booking record BEFORE touching iWay ──────────────────
    total_pax = (req.adults_count or 1) + (req.children_count or 0)
    record = IWayBookingRecord(
        pickup_location=req.pickup_location or req.from_address,
        dropoff_location=req.dropoff_location or req.to_address,
        pickup_date=pickup_date_str,
        pickup_time=pickup_t_str,
        passengers=total_pax,
        luggage=req.luggage_count or 0,
        flight_number=req.flight_number,
        greeting_sign=req.greeting_sign,
        vehicle_class=req.vehicle_class or "",
        price=req.displayed_price,
        currency=req.currency,
        passenger_name=req.passenger_name,
        passenger_email=req.passenger_email,
        passenger_phone=phone_clean,
        from_place_id=req.from_place_id,
        to_place_id=req.to_place_id,
        price_id=req.price_id,
    )
    record_doc = record.model_dump()
    record_doc["created_at"] = record.created_at.isoformat()
    await db.iway_bookings.insert_one(record_doc)
    internal_id = record.id

    # ── Step 1: Build the iWay trip payload ──────────────────────────────────
    start_loc: Dict = {
        "place_id": req.from_place_id,
        "time": pickup_time_full,
        "address": req.from_address,
        "location": req.from_location,
    }
    if req.flight_number:
        start_loc["flight_number"] = req.flight_number
    if req.terminal_number:
        start_loc["terminal_number"] = req.terminal_number

    finish_loc: Dict = {
        "place_id": req.to_place_id,
        "address": req.to_address,
        "location": req.to_location,
    }

    trip = {
        "lang": "en",
        "user_id": int(IWAY_USER_ID),
        "price_id": req.price_id,
        "currency": req.currency,
        "is_rent": None,
        "start_location": start_loc,
        "finish_location": finish_loc,
        "passengers_number": total_pax,
        "adults_amount": req.adults_count or 1,
        "children_amount": req.children_count or 0,
        "passengers": [{
            "name": req.passenger_name,
            "phone": phone_clean,
            "email": req.passenger_email,
        }],
        "platform": 3,
        "comment": req.comment or "",
    }

    async with httpx.AsyncClient(timeout=25.0) as client_h:
        # ── Step 2: Create order on iWay ─────────────────────────────────────
        try:
            order_resp = await client_h.post(
                f"{IWAY_API_BASE}/v1/orders",
                json={"trips": [trip]}
            )
        except httpx.TimeoutException:
            await db.iway_bookings.update_one(
                {"id": internal_id},
                {"$set": {"booking_status": "iway_error", "admin_notes": "iWay orders API timed out"}}
            )
            raise HTTPException(status_code=504, detail="The transfer provider did not respond in time. Please try again.")

        order_data = order_resp.json()
        logger.info(f"iWay /v1/orders response status={order_resp.status_code} body={str(order_data)[:500]}")

        if order_data.get("error"):
            err_msg = order_data["error"].get("message", "Booking failed at transfer provider")
            await db.iway_bookings.update_one(
                {"id": internal_id},
                {"$set": {"booking_status": "iway_error", "admin_notes": err_msg}}
            )
            raise HTTPException(status_code=400, detail=err_msg)

        results_list = order_data.get("result") or []
        if not results_list:
            raw = str(order_data)[:300]
            await db.iway_bookings.update_one(
                {"id": internal_id},
                {"$set": {"booking_status": "iway_error", "admin_notes": f"Empty result: {raw}"}}
            )
            raise HTTPException(status_code=400, detail="Transfer provider returned an empty order response. Please try again.")

        result = results_list[0]
        transaction = result["transaction"]
        booker_number = result.get("booker_number", "")
        final_price = result.get("price")

        # ── Step 3: Get payment URL ───────────────────────────────────────────
        try:
            pay_resp = await client_h.get(
                f"{IWAY_API_BASE}/v1/orders/pay-url",
                params={
                    "transaction": transaction,
                    "trans_host_name": "planettransfers.online",
                    "user_id": IWAY_USER_ID
                }
            )
        except httpx.TimeoutException:
            await db.iway_bookings.update_one(
                {"id": internal_id},
                {"$set": {"iway_transaction": transaction, "booking_status": "iway_error",
                          "admin_notes": "pay-url API timed out"}}
            )
            raise HTTPException(status_code=504, detail="Could not retrieve payment URL (timeout). Please contact support with your booking reference.")

        pay_data = pay_resp.json()
        logger.info(f"iWay /v1/orders/pay-url response status={pay_resp.status_code} body={str(pay_data)[:300]}")

        if pay_data.get("error"):
            err_detail = pay_data["error"].get("message", "pay-url call failed")
            await db.iway_bookings.update_one(
                {"id": internal_id},
                {"$set": {"iway_transaction": transaction, "booking_status": "iway_error",
                          "admin_notes": err_detail}}
            )
            raise HTTPException(status_code=400, detail="Could not retrieve payment URL from transfer provider.")

        payment_url = (pay_data.get("result") or {}).get("url")
        if not payment_url:
            raw = str(pay_data)[:300]
            await db.iway_bookings.update_one(
                {"id": internal_id},
                {"$set": {"iway_transaction": transaction, "booking_status": "iway_error",
                          "admin_notes": f"pay-url missing: {raw}"}}
            )
            raise HTTPException(status_code=400, detail="Payment URL not found in provider response. Please contact support.")

        # ── Step 4: Update our record with iWay data ─────────────────────────
        iway_update: Dict = {"iway_transaction": transaction, "iway_booker_number": booker_number}
        if final_price:
            iway_update["price"] = final_price
        await db.iway_bookings.update_one({"id": internal_id}, {"$set": iway_update})

    return {
        "transaction": transaction,
        "booker_number": booker_number,
        "payment_url": payment_url,
        "price": result.get("price"),
        "currency": result.get("currency"),
        "internal_booking_id": internal_id,
    }


# ── iWay booking admin endpoints ─────────────────────────────────────────────

@api_router.get("/iway/bookings")
async def list_iway_bookings():
    """Return all iWay bookings newest first (admin use)."""
    bookings = await db.iway_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings


@api_router.get("/iway/bookings/{booking_id}")
async def get_iway_booking(booking_id: str):
    booking = await db.iway_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@api_router.put("/iway/bookings/{booking_id}/status")
async def update_iway_booking_status(
    booking_id: str,
    update: IWayBookingStatusUpdate,
    background_tasks: BackgroundTasks,
):
    set_fields: Dict = {}
    if update.payment_status is not None:
        set_fields["payment_status"] = update.payment_status
    if update.booking_status is not None:
        set_fields["booking_status"] = update.booking_status
    if update.admin_notes is not None:
        set_fields["admin_notes"] = update.admin_notes
    if set_fields:
        await db.iway_bookings.update_one({"id": booking_id}, {"$set": set_fields})

    # Send confirmation email + admin notification when payment is marked complete (only once)
    if update.payment_status == "payment_completed":
        booking = await db.iway_bookings.find_one({"id": booking_id}, {"_id": 0})
        if booking and booking.get("passenger_email") and not booking.get("email_sent"):
            background_tasks.add_task(_send_booking_confirmation, booking)
            background_tasks.add_task(_send_admin_notification, booking)

    return {"ok": True}


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  TALIXO INTEGRATION                                                        ║
# ║  Feature flag: TALIXO_ENABLED (env). All routes return 503 when disabled.  ║
# ║  API booking flag: TALIXO_API_BOOKING — off until Talixo credit approved.  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

class TalixoBookingRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id:             str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at:     datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    supplier:       str = "talixo"
    # Status
    # request_received  → saved locally, admin creates on Talixo manually (Phase 1)
    # confirmed         → booking created via Talixo API (Phase 2)
    # cancelled         → booking cancelled
    # completed         → ride completed
    booking_status: str = "request_received"
    # Trip
    pickup_location:  str = ""
    dropoff_location: str = ""
    pickup_date:      str = ""
    pickup_time:      str = ""
    passengers:       int = 1
    luggage:          int = 1
    flight_number:    Optional[str] = None
    greeting_sign:    Optional[str] = None
    special_wishes:   Optional[str] = None
    # Vehicle
    vehicle_class:    str = ""
    vehicle_id:       str = ""      # Talixo vehicle ID from search
    car_model:        str = ""
    price:            Optional[float] = None
    currency:         str = "GBP"
    # Customer
    customer_name:    str = ""
    customer_email:   str = ""
    customer_phone:   str = ""
    # Talixo API refs (populated in Phase 2 when API booking is enabled)
    talixo_reference:      Optional[str] = None   # e.g. "P4RABLG"
    external_booking_number: str = ""              # our internal UUID passed to Talixo
    talixo_response:       Optional[dict] = None  # full raw Talixo booking response
    # Admin
    admin_notes:      Optional[str] = None
    email_sent:       bool = False


class TalixoBookingRequest(BaseModel):
    # Route (address strings — Talixo uses these directly)
    pickup:           str
    dropoff:          str
    pickup_datetime:  str       # "YYYY-MM-DD HH:mm"
    # Vehicle
    vehicle_id:       str       # Talixo vehicle ID from search response
    vehicle_class:    Optional[str] = "Standard"
    car_model:        Optional[str] = ""
    displayed_price:  Optional[float] = None
    currency:         str = "GBP"
    # Passenger
    passenger_name:   str
    passenger_email:  str
    passenger_phone:  str       # E.164 or any format
    # Trip details
    passengers:       int = 1
    luggage:          int = 1
    flight_number:    Optional[str] = None
    greeting_sign:    Optional[str] = None
    special_wishes:   Optional[str] = None
    # Our DB labels
    pickup_location:  Optional[str] = ""
    dropoff_location: Optional[str] = ""


class TalixoModifyRequest(BaseModel):
    start_time_date: Optional[str] = None
    start_time_time: Optional[str] = None
    passengers:      Optional[int] = None
    luggage:         Optional[int] = None
    first_name:      Optional[str] = None
    last_name:       Optional[str] = None
    mobile:          Optional[str] = None
    special_wishes:  Optional[str] = None


# ── Talixo admin email helper ──────────────────────────────────────────────────

async def _send_talixo_admin_notification(booking: dict) -> None:
    """Send admin email with full Talixo booking request details for manual fulfillment."""
    try:
        admin_email = os.environ.get("ADMIN_EMAIL", os.environ.get("SENDER_EMAIL", ""))
        sender      = os.environ.get("SENDER_EMAIL", "bookings@planettransfers.online")
        if not admin_email or not os.environ.get("RESEND_API_KEY"):
            logger.warning("[Talixo] Admin email skipped — ADMIN_EMAIL or RESEND_API_KEY not set")
            return

        resend.api_key = os.environ.get("RESEND_API_KEY", "")

        status_badge = (
            "✅ Created via API" if booking.get("booking_status") == "confirmed"
            else "⚠️ MANUAL ACTION REQUIRED — Create on Talixo"
        )

        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:#1e293b;padding:24px 32px">
            <h2 style="color:#d4af37;margin:0;font-size:22px">New Talixo Booking Request</h2>
            <p style="color:#94a3b8;margin:8px 0 0;font-size:14px">{status_badge}</p>
          </div>
          <div style="padding:32px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%">Internal ID</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('id','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Pickup</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('pickup_location','')}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Dropoff</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('dropoff_location','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Date &amp; Time</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('pickup_date','')} {booking.get('pickup_time','')}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Passengers</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('passengers',1)}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Luggage</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('luggage',1)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Flight Number</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('flight_number') or '—'}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Greeting Sign</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('greeting_sign') or '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Vehicle Class</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('vehicle_class','')} — {booking.get('car_model','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Vehicle ID</td>
                  <td style="padding:8px 0;font-family:monospace;font-size:13px">{booking.get('vehicle_id','')}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Price</td>
                  <td style="padding:8px 0;font-weight:700;color:#d4af37;font-size:15px">{booking.get('currency','GBP')} {booking.get('price','—')}</td></tr>
            </table>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
            <h3 style="color:#1e293b;margin:0 0 16px;font-size:16px">Passenger Details</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:40%">Name</td>
                  <td style="padding:6px 0;font-weight:600;font-size:13px">{booking.get('customer_name','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:6px 0;color:#64748b;font-size:13px">Email</td>
                  <td style="padding:6px 0;font-size:13px">{booking.get('customer_email','')}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Phone</td>
                  <td style="padding:6px 0;font-size:13px">{booking.get('customer_phone','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:6px 0;color:#64748b;font-size:13px">Special Wishes</td>
                  <td style="padding:6px 0;font-size:13px">{booking.get('special_wishes') or '—'}</td></tr>
            </table>

            <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:8px;border:1px solid #f59e0b">
              <p style="margin:0;font-size:13px;color:#92400e">
                <strong>Action required:</strong> Log in to your Talixo corporate account and create this booking manually.
                Use the vehicle ID <strong>{booking.get('vehicle_id','')}</strong> and reference our internal ID
                <strong>{booking.get('id','')}</strong> for tracking.
              </p>
            </div>
          </div>
          <div style="background:#f8fafc;padding:16px 32px;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">Planet Transfers · Talixo Booking System</p>
          </div>
        </div>
        """

        resend.Emails.send({
            "from":    sender,
            "to":      [admin_email],
            "subject": f"[Talixo] New Booking Request — {booking.get('pickup_location','')} → {booking.get('dropoff_location','')}",
            "html":    html,
        })
        logger.info(f"[Talixo] Admin notification sent to {admin_email}")
    except Exception as e:
        logger.error(f"[Talixo] Admin notification failed: {e}")


# ── Talixo Routes ──────────────────────────────────────────────────────────────

def _talixo_guard():
    """Raise 503 if Talixo integration is not enabled."""
    if not TALIXO_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Talixo integration is not enabled. Set TALIXO_ENABLED=true to activate."
        )


@api_router.get("/talixo/status")
async def talixo_status():
    """Returns the current Talixo feature flag state (admin/debug use)."""
    return {
        "TALIXO_ENABLED":     TALIXO_ENABLED,
        "TALIXO_API_BOOKING": TALIXO_API_BOOKING,
        "api_key_set":        bool(os.environ.get("TALIXO_API_KEY")),
        "base_url":           talixo_service.TALIXO_BASE_URL,
    }


@api_router.get("/talixo/search")
async def talixo_search(
    pickup:     str,
    dropoff:    str,
    date:       str,
    time:       str,
    passengers: int = 1,
    luggage:    int = 1,
    currency:   str = "GBP",
):
    """
    Proxy search to Talixo /vehicles/booking_query/.
    Returns normalized vehicle list.
    Requires TALIXO_ENABLED=true.
    """
    _talixo_guard()
    try:
        result = await talixo_service.search_vehicles(
            pickup=pickup, dropoff=dropoff,
            date=date, time=time,
            passengers=passengers, luggage=luggage,
            currency=currency,
        )
        return result
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Talixo search timed out. Please try again.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[Talixo] search error: {e}")
        raise HTTPException(status_code=500, detail="Talixo search failed unexpectedly.")


@api_router.post("/talixo/book")
async def talixo_book(req: TalixoBookingRequest, background_tasks: BackgroundTasks):
    """
    Create a Talixo booking.

    Phase 1 (TALIXO_API_BOOKING=false):
      → Saves booking request to MongoDB (booking_status="request_received")
      → Emails admin with full details for manual creation on Talixo corporate account
      → Returns { request_received: true, internal_booking_id: ... }

    Phase 2 (TALIXO_API_BOOKING=true, credit approved):
      → Creates booking via Talixo API
      → Saves with booking_status="confirmed" + talixo_reference
      → Returns { confirmed: true, talixo_reference: ..., internal_booking_id: ... }

    Requires TALIXO_ENABLED=true.
    """
    _talixo_guard()

    import re as _re
    dt_parts = req.pickup_datetime.replace("T", " ")[:16].split(" ")
    pickup_date = dt_parts[0]
    pickup_time = dt_parts[1] if len(dt_parts) > 1 else "00:00"

    name_parts  = req.passenger_name.strip().split(" ", 1)
    first_name  = name_parts[0]
    last_name   = name_parts[1] if len(name_parts) > 1 else "-"

    internal_id = str(uuid.uuid4())

    # ── Save to DB immediately ─────────────────────────────────────────────────
    record = TalixoBookingRecord(
        id                    = internal_id,
        pickup_location       = req.pickup_location or req.pickup,
        dropoff_location      = req.dropoff_location or req.dropoff,
        pickup_date           = pickup_date,
        pickup_time           = pickup_time,
        passengers            = req.passengers,
        luggage               = req.luggage,
        flight_number         = req.flight_number or None,
        greeting_sign         = req.greeting_sign  or None,
        special_wishes        = req.special_wishes or None,
        vehicle_class         = req.vehicle_class  or "Standard",
        vehicle_id            = str(req.vehicle_id),
        car_model             = req.car_model or "",
        price                 = req.displayed_price,
        currency              = req.currency,
        customer_name         = req.passenger_name,
        customer_email        = req.passenger_email,
        customer_phone        = req.passenger_phone,
        external_booking_number = internal_id,
        booking_status        = "request_received",
    )
    record_doc = {k: v for k, v in record.model_dump().items() if v is not None}
    await db.talixo_bookings.insert_one(record_doc)
    logger.info(f"[Talixo] Booking request saved: id={internal_id} vehicle={req.vehicle_id}")

    # ── Phase 2: Create via Talixo API (only when TALIXO_API_BOOKING=true) ─────
    if TALIXO_API_BOOKING:
        try:
            phone_e164 = req.passenger_phone.strip()
            if not phone_e164.startswith("+"):
                phone_e164 = "+" + _re.sub(r"\D", "", phone_e164)

            talixo_resp = await talixo_service.create_booking(
                pickup                  = req.pickup,
                dropoff                 = req.dropoff,
                date                    = pickup_date,
                time                    = pickup_time,
                vehicle_id              = str(req.vehicle_id),
                first_name              = first_name,
                last_name               = last_name,
                email                   = req.passenger_email,
                mobile                  = phone_e164,
                passengers              = req.passengers,
                luggage                 = req.luggage,
                flight_number           = req.flight_number or None,
                greeting_sign           = req.greeting_sign  or None,
                special_wishes          = req.special_wishes or None,
                external_booking_number = internal_id,
            )

            talixo_ref = talixo_resp.get("reference_code") or talixo_resp.get("id") or ""
            await db.talixo_bookings.update_one(
                {"id": internal_id},
                {"$set": {
                    "booking_status":   "confirmed",
                    "talixo_reference": talixo_ref,
                    "talixo_response":  talixo_resp,
                }}
            )
            logger.info(f"[Talixo] Booking confirmed via API: ref={talixo_ref} id={internal_id}")

            return {
                "confirmed":           True,
                "request_received":    False,
                "talixo_reference":    talixo_ref,
                "internal_booking_id": internal_id,
                "price":               req.displayed_price,
                "currency":            req.currency,
            }

        except (ValueError, httpx.TimeoutException) as e:
            # API failed — fall back to manual request + log
            logger.error(f"[Talixo] API booking failed, falling back to manual: {e}")
            await db.talixo_bookings.update_one(
                {"id": internal_id},
                {"$set": {"booking_status": "request_received", "admin_notes": f"API error: {e}"}}
            )

    # ── Phase 1 (or fallback): notify admin to create manually ────────────────
    booking_doc = await db.talixo_bookings.find_one({"id": internal_id}, {"_id": 0})
    background_tasks.add_task(_send_talixo_admin_notification, booking_doc or record_doc)

    return {
        "confirmed":           False,
        "request_received":    True,
        "internal_booking_id": internal_id,
        "price":               req.displayed_price,
        "currency":            req.currency,
    }


@api_router.get("/talixo/bookings")
async def list_talixo_bookings():
    """Return all Talixo booking requests newest first (admin use)."""
    bookings = await db.talixo_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings


@api_router.get("/talixo/bookings/{booking_id}")
async def get_talixo_booking_local(booking_id: str):
    """Return a single Talixo booking from our DB by internal ID or Talixo reference."""
    booking = await db.talixo_bookings.find_one(
        {"$or": [{"id": booking_id}, {"talixo_reference": booking_id}]}, {"_id": 0}
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Talixo booking not found")
    return booking


@api_router.get("/talixo/bookings/{booking_id}/live")
async def get_talixo_booking_live(booking_id: str):
    """
    Fetch live booking status from Talixo API.
    booking_id must be the Talixo reference_code (e.g. P4RABLG).
    Requires TALIXO_ENABLED=true.
    """
    _talixo_guard()
    try:
        return await talixo_service.get_booking(booking_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@api_router.delete("/talixo/bookings/{booking_id}")
async def cancel_talixo_booking(booking_id: str):
    """
    Cancel a Talixo booking via API and update local DB.
    booking_id = Talixo reference_code.
    Requires TALIXO_ENABLED=true.
    Cancellation policy: free if >3h before pickup; full charge after.
    """
    _talixo_guard()

    try:
        await talixo_service.cancel_booking(booking_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Update our DB record
    await db.talixo_bookings.update_one(
        {"talixo_reference": booking_id},
        {"$set": {"booking_status": "cancelled"}}
    )
    logger.info(f"[Talixo] Booking {booking_id} cancelled and DB updated")
    return {"ok": True, "cancelled": True}


@api_router.patch("/talixo/bookings/{booking_id}")
async def modify_talixo_booking(booking_id: str, updates: TalixoModifyRequest):
    """
    Partially modify a Talixo booking via API.
    booking_id = Talixo reference_code.
    Requires TALIXO_ENABLED=true.
    """
    _talixo_guard()

    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields provided for modification.")

    try:
        result = await talixo_service.modify_booking(booking_id, update_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    logger.info(f"[Talixo] Booking {booking_id} modified: {list(update_dict.keys())}")
    return result


@api_router.get("/talixo/bookings/{booking_id}/track")
async def track_talixo_vehicle(booking_id: str, extended: bool = False):
    """
    Get live GPS location of the assigned vehicle.
    booking_id = Talixo reference_code.
    Status: initial | driving_to_pickup | at_pickup |
            client_picked_up | driving_to_destination | at_destination
    GPS updates every ~10 seconds.
    Requires TALIXO_ENABLED=true.
    """
    _talixo_guard()
    try:
        return await talixo_service.track_vehicle(booking_id, extended=extended)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@api_router.put("/talixo/bookings/{booking_id}/status")
async def update_talixo_booking_status(booking_id: str, update: IWayBookingStatusUpdate):
    """Update local DB status for a Talixo booking (admin use)."""
    set_fields: Dict = {}
    if update.booking_status is not None:
        set_fields["booking_status"] = update.booking_status
    if update.admin_notes is not None:
        set_fields["admin_notes"]    = update.admin_notes
    if set_fields:
        await db.talixo_bookings.update_one({"id": booking_id}, {"$set": set_fields})
    return {"ok": True}


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  MYTRANSFERS INTEGRATION                                                   ║
# ║  Feature flag: MYTRANSFERS_ENABLED (env). Returns 503 when disabled.       ║
# ║  API booking flag: MYTRANSFERS_API_BOOKING — off until credit approved.    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

class MyTransfersBookingRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id:              str      = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at:      datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    supplier:        str      = "mytransfers"
    # Status: request_received | confirmed | cancelled | completed
    booking_status:  str      = "request_received"
    # Trip
    pickup_location:   str  = ""
    dropoff_location:  str  = ""
    pickup_date:       str  = ""
    pickup_time:       str  = ""
    passengers:        int  = 1
    flight_number:     Optional[str] = None
    special_requirements: Optional[str] = None
    # Vehicle
    vehicle_class:     str  = ""
    transfer_id:       str  = ""   # MyTransfers transportId from search
    session_id:        str  = ""   # MyTransfers sessionId from availability search
    price:             Optional[float] = None
    currency:          str  = "EUR"
    # Customer
    customer_name:    str = ""
    customer_email:   str = ""
    customer_phone:   str = ""
    customer_country: str = "GB"
    # Location metadata
    origin_type:      str = "airport"
    destination_type: str = "airport"
    # MyTransfers API refs (Phase 2 when API booking enabled)
    mt_order_id:       Optional[int]  = None   # orderId from MT booking response
    mt_booking_status: Optional[str]  = None   # status field from MT response
    mt_response:       Optional[dict] = None   # full raw MT booking response
    # Admin
    admin_notes:       Optional[str] = None
    email_sent:        bool = False


class MyTransfersBookingRequest(BaseModel):
    # Route
    pickup:           str
    dropoff:          str
    pickup_datetime:  str        # "YYYY-MM-DD HH:mm"
    # Vehicle (from search result)
    transfer_id:      str        # MyTransfers transportId
    session_id:       str        # MyTransfers sessionId from availability search
    vehicle_class:    Optional[str] = "Standard"
    displayed_price:  Optional[float] = None
    currency:         str = "EUR"
    # Passenger
    passenger_name:   str
    passenger_email:  str
    passenger_phone:  str
    passenger_country: str = "GB"
    # Trip details
    passengers:       int = 1
    flight_number:    Optional[str] = None
    special_requirements: Optional[str] = None
    # Location labels for DB
    pickup_location:  Optional[str] = ""
    dropoff_location: Optional[str] = ""
    # Location types (auto-detected if not provided)
    origin_type:      Optional[str] = None
    destination_type: Optional[str] = None


class MyTransfersStatusUpdate(BaseModel):
    booking_status: Optional[str] = None
    admin_notes:    Optional[str] = None


# ── MyTransfers admin email helper ────────────────────────────────────────────

async def _send_mytransfers_admin_notification(booking: dict) -> None:
    """Send admin email with full MyTransfers booking request for manual fulfillment."""
    try:
        admin_email = os.environ.get("ADMIN_EMAIL", os.environ.get("SENDER_EMAIL", ""))
        sender      = os.environ.get("SENDER_EMAIL", "bookings@planettransfers.online")
        if not admin_email or not os.environ.get("RESEND_API_KEY"):
            logger.warning("[MyTransfers] Admin email skipped — ADMIN_EMAIL or RESEND_API_KEY not set")
            return

        resend.api_key = os.environ.get("RESEND_API_KEY", "")

        status_badge = (
            "✅ Created via API" if booking.get("booking_status") == "confirmed"
            else "⚠️ MANUAL ACTION REQUIRED — Create on MyTransfers"
        )

        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:#1e293b;padding:24px 32px">
            <h2 style="color:#d4af37;margin:0;font-size:22px">New MyTransfers Booking Request</h2>
            <p style="color:#94a3b8;margin:8px 0 0;font-size:14px">{status_badge}</p>
          </div>
          <div style="padding:32px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%">Internal ID</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('id','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Pickup</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('pickup_location','')}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Dropoff</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('dropoff_location','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Date &amp; Time</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('pickup_date','')} {booking.get('pickup_time','')}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Passengers</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('passengers',1)}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Flight Number</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('flight_number') or '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Vehicle Class</td>
                  <td style="padding:8px 0;font-weight:600;font-size:13px">{booking.get('vehicle_class','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Transfer ID</td>
                  <td style="padding:8px 0;font-family:monospace;font-size:13px">{booking.get('transfer_id','')}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Session ID</td>
                  <td style="padding:8px 0;font-family:monospace;font-size:12px">{booking.get('session_id','')[:20]}…</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px 0;color:#64748b;font-size:13px">Price</td>
                  <td style="padding:8px 0;font-weight:700;color:#d4af37;font-size:15px">{booking.get('currency','EUR')} {booking.get('price','—')}</td></tr>
            </table>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
            <h3 style="color:#1e293b;margin:0 0 16px;font-size:16px">Passenger Details</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:40%">Name</td>
                  <td style="padding:6px 0;font-weight:600;font-size:13px">{booking.get('customer_name','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:6px 0;color:#64748b;font-size:13px">Email</td>
                  <td style="padding:6px 0;font-size:13px">{booking.get('customer_email','')}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Phone</td>
                  <td style="padding:6px 0;font-size:13px">{booking.get('customer_phone','')}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:6px 0;color:#64748b;font-size:13px">Country</td>
                  <td style="padding:6px 0;font-size:13px">{booking.get('customer_country','GB')}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Special Requirements</td>
                  <td style="padding:6px 0;font-size:13px">{booking.get('special_requirements') or '—'}</td></tr>
            </table>

            <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:8px;border:1px solid #f59e0b">
              <p style="margin:0;font-size:13px;color:#92400e">
                <strong>Action required:</strong> Log in to your MyTransfers partner account and create this booking manually.
                Use Transfer ID <strong>{booking.get('transfer_id','')}</strong>, Session ID <strong>{(booking.get('session_id',''))[:20]}…</strong>
                and reference our internal ID <strong>{booking.get('id','')}</strong> for tracking.
              </p>
            </div>
          </div>
          <div style="background:#f8fafc;padding:16px 32px;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">Planet Transfers · MyTransfers Booking System</p>
          </div>
        </div>
        """

        resend.Emails.send({
            "from":    sender,
            "to":      [admin_email],
            "subject": f"[MyTransfers] New Booking Request — {booking.get('pickup_location','')} → {booking.get('dropoff_location','')}",
            "html":    html,
        })
        logger.info(f"[MyTransfers] Admin notification sent to {admin_email}")
    except Exception as e:
        logger.error(f"[MyTransfers] Admin notification failed: {e}")


# ── MyTransfers guard ─────────────────────────────────────────────────────────

def _mytransfers_guard():
    """Raise 503 if MyTransfers integration is not enabled."""
    if not MYTRANSFERS_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="MyTransfers integration is not enabled. Set MYTRANSFERS_ENABLED=true to activate."
        )


# ── MyTransfers Routes ────────────────────────────────────────────────────────

@api_router.get("/mytransfers/status")
async def mytransfers_status():
    """Returns the current MyTransfers feature flag state (admin/debug use)."""
    return {
        "MYTRANSFERS_ENABLED":     MYTRANSFERS_ENABLED,
        "MYTRANSFERS_API_BOOKING": MYTRANSFERS_API_BOOKING,
        "api_key_set":             bool(os.environ.get("MYTRANSFERS_API_KEY")),
        "base_url":                mytransfers_service.MYTRANSFERS_BASE_URL,
        "currency":                mytransfers_service.MYTRANSFERS_CURRENCY,
    }


@api_router.get("/mytransfers/search")
async def mytransfers_search(
    pickup:     str,
    dropoff:    str,
    date:       str,
    time:       str,
    passengers: int = 1,
    children:   int = 0,
    currency:   str = "EUR",
):
    """
    Proxy search to MyTransfers /{key}/availabilities.
    Geocodes addresses, returns normalized vehicle list.
    Requires MYTRANSFERS_ENABLED=true.
    """
    _mytransfers_guard()
    try:
        result = await mytransfers_service.search_vehicles(
            pickup=pickup, dropoff=dropoff,
            date=date, time=time,
            passengers=passengers, children=children,
        )
        return result
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="MyTransfers search timed out. Please try again.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[MyTransfers] search error: {e}")
        raise HTTPException(status_code=500, detail="MyTransfers search failed unexpectedly.")


@api_router.post("/mytransfers/book")
async def mytransfers_book(req: MyTransfersBookingRequest, background_tasks: BackgroundTasks):
    """
    Create a MyTransfers booking.

    Phase 1 (MYTRANSFERS_API_BOOKING=false):
      → Saves booking request to MongoDB (booking_status="request_received")
      → Emails admin with full details for manual creation
      → Returns { request_received: true, internal_booking_id: ... }

    Phase 2 (MYTRANSFERS_API_BOOKING=true, credit approved):
      → Creates booking via MyTransfers API
      → Saves with booking_status="confirmed" + mt_order_id
      → Returns { confirmed: true, mt_order_id: ..., internal_booking_id: ... }

    Requires MYTRANSFERS_ENABLED=true.
    """
    _mytransfers_guard()

    dt_parts    = req.pickup_datetime.replace("T", " ")[:16].split(" ")
    pickup_date = dt_parts[0]
    pickup_time = dt_parts[1] if len(dt_parts) > 1 else "00:00"

    name_parts = req.passenger_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name  = name_parts[1] if len(name_parts) > 1 else "-"

    # Auto-detect location types if not provided
    origin_type      = req.origin_type      or mytransfers_service._detect_location_type(req.pickup_location or req.pickup)
    destination_type = req.destination_type or mytransfers_service._detect_location_type(req.dropoff_location or req.dropoff)

    internal_id = str(uuid.uuid4())

    # ── Save to DB immediately ────────────────────────────────────────────────
    record = MyTransfersBookingRecord(
        id                   = internal_id,
        pickup_location      = req.pickup_location or req.pickup,
        dropoff_location     = req.dropoff_location or req.dropoff,
        pickup_date          = pickup_date,
        pickup_time          = pickup_time,
        passengers           = req.passengers,
        flight_number        = req.flight_number or None,
        special_requirements = req.special_requirements or None,
        vehicle_class        = req.vehicle_class or "Standard",
        transfer_id          = str(req.transfer_id),
        session_id           = req.session_id,
        price                = req.displayed_price,
        currency             = req.currency,
        customer_name        = req.passenger_name,
        customer_email       = req.passenger_email,
        customer_phone       = req.passenger_phone,
        customer_country     = req.passenger_country,
        origin_type          = origin_type,
        destination_type     = destination_type,
        booking_status       = "request_received",
    )
    record_doc = {k: v for k, v in record.model_dump().items() if v is not None}
    record_doc["created_at"] = record.created_at.isoformat()
    await db.mytransfers_bookings.insert_one(record_doc)
    logger.info(f"[MyTransfers] Booking request saved: id={internal_id} transfer={req.transfer_id}")

    # ── Phase 2: Create via MyTransfers API (only when MYTRANSFERS_API_BOOKING=true) ──
    if MYTRANSFERS_API_BOOKING:
        try:
            mt_resp = await mytransfers_service.create_booking(
                session_id           = req.session_id,
                transfer_id          = str(req.transfer_id),
                first_name           = first_name,
                last_name            = last_name,
                email                = req.passenger_email,
                phone                = req.passenger_phone,
                country              = req.passenger_country,
                origin_type          = origin_type,
                destination_type     = destination_type,
                origin_address       = req.pickup_location or req.pickup,
                destination_address  = req.dropoff_location or req.dropoff,
                flight_number        = req.flight_number or None,
                arrival_pickup_time  = req.pickup_datetime[:16] if req.flight_number else None,
                special_requirements = req.special_requirements or None,
                external_reference   = internal_id,
            )

            mt_order_id = mt_resp.get("orderId")
            mt_status   = mt_resp.get("status", "confirmed")
            await db.mytransfers_bookings.update_one(
                {"id": internal_id},
                {"$set": {
                    "booking_status":  "confirmed",
                    "mt_order_id":     mt_order_id,
                    "mt_booking_status": mt_status,
                    "mt_response":     mt_resp,
                }}
            )
            logger.info(f"[MyTransfers] Booking confirmed via API: orderId={mt_order_id} id={internal_id}")

            return {
                "confirmed":           True,
                "request_received":    False,
                "mt_order_id":         mt_order_id,
                "internal_booking_id": internal_id,
                "price":               req.displayed_price,
                "currency":            req.currency,
            }

        except (ValueError, httpx.TimeoutException) as e:
            # API failed — fall back to manual request + log
            logger.error(f"[MyTransfers] API booking failed, falling back to manual: {e}")
            await db.mytransfers_bookings.update_one(
                {"id": internal_id},
                {"$set": {"booking_status": "request_received", "admin_notes": f"API error: {e}"}}
            )

    # ── Phase 1 (or fallback): notify admin to create manually ───────────────
    booking_doc = await db.mytransfers_bookings.find_one({"id": internal_id}, {"_id": 0})
    background_tasks.add_task(_send_mytransfers_admin_notification, booking_doc or record_doc)

    return {
        "confirmed":           False,
        "request_received":    True,
        "internal_booking_id": internal_id,
        "price":               req.displayed_price,
        "currency":            req.currency,
    }


@api_router.get("/mytransfers/bookings")
async def list_mytransfers_bookings():
    """Return all MyTransfers booking requests newest first (admin use)."""
    bookings = await db.mytransfers_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings


@api_router.get("/mytransfers/bookings/{booking_id}")
async def get_mytransfers_booking_local(booking_id: str):
    """Return a single MyTransfers booking from our DB by internal ID."""
    booking = await db.mytransfers_bookings.find_one(
        {"$or": [{"id": booking_id}, {"mt_order_id": booking_id}]}, {"_id": 0}
    )
    if not booking:
        raise HTTPException(status_code=404, detail="MyTransfers booking not found")
    return booking


@api_router.get("/mytransfers/bookings/{booking_id}/live")
async def get_mytransfers_booking_live(booking_id: int):
    """
    Fetch live booking status from MyTransfers API.
    booking_id must be the numeric mt_order_id.
    Requires MYTRANSFERS_ENABLED=true.
    """
    _mytransfers_guard()
    try:
        return await mytransfers_service.get_booking(booking_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@api_router.delete("/mytransfers/bookings/{booking_id}")
async def cancel_mytransfers_booking(booking_id: int):
    """
    Cancel a MyTransfers booking via API and update local DB.
    booking_id = numeric mt_order_id.
    Requires MYTRANSFERS_ENABLED=true.
    """
    _mytransfers_guard()
    try:
        await mytransfers_service.cancel_booking(booking_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await db.mytransfers_bookings.update_one(
        {"mt_order_id": booking_id},
        {"$set": {"booking_status": "cancelled"}}
    )
    logger.info(f"[MyTransfers] Booking {booking_id} cancelled and DB updated")
    return {"ok": True, "cancelled": True}


@api_router.put("/mytransfers/bookings/{booking_id}/status")
async def update_mytransfers_booking_status(booking_id: str, update: MyTransfersStatusUpdate):
    """Update local DB status for a MyTransfers booking (admin use)."""
    set_fields: Dict = {}
    if update.booking_status is not None:
        set_fields["booking_status"] = update.booking_status
    if update.admin_notes is not None:
        set_fields["admin_notes"]    = update.admin_notes
    if set_fields:
        await db.mytransfers_bookings.update_one({"id": booking_id}, {"$set": set_fields})
    return {"ok": True}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
