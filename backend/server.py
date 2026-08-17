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

class QuoteRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_type: str
    # ── Outbound ──
    pickup_location: str
    dropoff_location: str
    pickup_date: str
    pickup_time: str
    flight_number: Optional[str] = None           # arrival flight (outbound)
    flight_arrival_time: Optional[str] = None      # scheduled arrival time
    passengers: int
    children: Optional[int] = 0
    child_seat_details: Optional[str] = None       # ages + seat types needed
    luggage: int
    vehicle_preference: Optional[str] = None
    special_requests: Optional[str] = None
    # ── Return (round-trip only) ──
    return_pickup_location: Optional[str] = None
    return_dropoff_location: Optional[str] = None
    return_date: Optional[str] = None
    return_time: Optional[str] = None              # kept for backward compat (Boryana)
    return_pickup_time: Optional[str] = None       # desired pickup time for return
    return_flight_number: Optional[str] = None     # departure flight (return)
    return_flight_departure_time: Optional[str] = None  # scheduled departure time
    same_pax_luggage: Optional[bool] = True
    return_passengers: Optional[int] = None
    return_luggage: Optional[int] = None
    return_notes: Optional[str] = None
    # ── Passenger ──
    passenger_name: str
    passenger_email: str
    passenger_phone: str
    # ── Admin ──
    status: str = "new"
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuoteRequestCreate(BaseModel):
    trip_type: str
    # ── Outbound ──
    pickup_location: str
    dropoff_location: str
    pickup_date: str
    pickup_time: str
    flight_number: Optional[str] = None
    flight_arrival_time: Optional[str] = None
    passengers: int
    children: Optional[int] = 0
    child_seat_details: Optional[str] = None
    luggage: int
    vehicle_preference: Optional[str] = None
    special_requests: Optional[str] = None
    # ── Return ──
    return_pickup_location: Optional[str] = None
    return_dropoff_location: Optional[str] = None
    return_date: Optional[str] = None
    return_pickup_time: Optional[str] = None
    return_flight_number: Optional[str] = None
    return_flight_departure_time: Optional[str] = None
    same_pax_luggage: Optional[bool] = True
    return_passengers: Optional[int] = None
    return_luggage: Optional[int] = None
    return_notes: Optional[str] = None
    # ── Passenger ──
    passenger_name: str
    passenger_email: str
    passenger_phone: str

class QuoteStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class AdminLogin(BaseModel):
    password: str

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
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

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

# ==================== ADMIN ====================

@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    if login.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.post("/admin/test-email")
async def send_test_email(to_email: str = "GBRoyaltransfers@gmail.com"):
    """
    Send a test confirmation email with correct Reply-To headers.
    Used by admin to verify email config before going live.
    """
    if not resend.api_key:
        raise HTTPException(status_code=503, detail="RESEND_API_KEY not configured")

    test_booking = {
        "id": "00000000-test-0000-0000-000000000000",
        "passenger_name":  "Test Customer",
        "passenger_email": to_email,
        "pickup_location":  "London Heathrow Airport, UK",
        "dropoff_location": "London City Centre, UK",
        "pickup_date":      "2026-07-01",
        "pickup_time":      "14:00",
        "passengers":       2,
        "flight_number":    "BA123",
        "vehicle_class":    "Business Class",
        "price":            149.00,
        "currency":         "GBP",
        "payment_status":   "payment_completed",
        "greeting_sign":    "Test Customer",
    }

    try:
        pt_ref = "PT-00000000"
        params: Dict = {
            "from":     f"Planet Transfers <{_SENDER_EMAIL}>",
            "reply_to": [_REPLY_TO_EMAIL],
            "to":       [to_email],
            "subject":  f"[TEST] Booking Confirmation – {pt_ref} | Planet Transfers",
            "html":     _build_confirmation_html(test_booking),
            "headers":  {"Reply-To": _REPLY_TO_EMAIL},
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "sent": True,
            "to": to_email,
            "reply_to": _REPLY_TO_EMAIL,
            "from": _SENDER_EMAIL,
            "email_id": result.get("id") if isinstance(result, dict) else str(result),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
async def create_quote(quote: QuoteRequestCreate, background_tasks: BackgroundTasks):
    """Create a new quote request and send email notifications."""
    quote_obj = QuoteRequest(**quote.model_dump())
    doc = quote_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.quotes.insert_one(doc)
    background_tasks.add_task(_send_quote_emails, doc)
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
    valid_statuses = ["new", "reviewing", "quoted", "accepted", "declined", "closed"]
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

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str):
    """Delete a quote"""
    result = await db.quotes.delete_one({"id": quote_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote deleted"}


class QuoteReplyCreate(BaseModel):
    price: Optional[str] = None        # e.g. "89.50"
    message: str                        # custom message to customer
    payment_link: Optional[str] = None  # paste an iWay or manual payment URL


@api_router.post("/quotes/{quote_id}/reply")
async def send_quote_reply(quote_id: str, reply: QuoteReplyCreate, background_tasks: BackgroundTasks):
    """Admin sends a quote reply (price + message + optional payment link) to the customer."""
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if not quote.get("passenger_email"):
        raise HTTPException(status_code=400, detail="No customer email on this quote")

    qid = f"QT-{quote_id[:8].upper()}"
    customer_name = (quote.get("passenger_name") or "").split()[0] or "there"
    route = f"{quote.get('pickup_location','')} → {quote.get('dropoff_location','')}"

    price_block = f"""
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:8px;padding:16px 20px;margin:0 0 20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#16a34a;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;">Your Quoted Price</p>
        <p style="margin:0;font-size:32px;font-weight:bold;color:#15803d;">£{reply.price}</p>
      </div>""" if reply.price else ''

    payment_block = f"""
      <div style="text-align:center;margin:0 0 20px;">
        <a href="{reply.payment_link}" style="display:inline-block;background:#0071c2;color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:6px;text-decoration:none;">
          Pay Now &amp; Confirm Booking
        </a>
        <p style="margin:8px 0 0;font-size:11px;color:#6b7280;">Secure payment link · expires in 24 hours</p>
      </div>""" if reply.payment_link else ''

    html = f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:#1a1a2e;padding:24px 32px;">
    <h1 style="margin:0;color:#d4af37;font-size:22px;font-family:Georgia,serif;">Planet Transfers</h1>
    <p style="margin:4px 0 0;color:#fff;font-size:13px;">Your Transfer Quote — {qid}</p>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p style="font-size:15px;color:#111;margin:0 0 8px;">Dear {customer_name},</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">Thank you for your quote request. Here is your personalised transfer price:</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:bold;">Your Journey</p>
      <p style="margin:0;font-size:13px;color:#111;font-weight:600;">{route}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">{_format_email_date(quote.get('pickup_date',''))} at {quote.get('pickup_time','')} · {quote.get('passengers','')} passenger(s)</p>
    </div>
    {price_block}
    <div style="background:#fff9e6;border-left:4px solid #d4af37;padding:14px 16px;margin:0 0 20px;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-line;">{reply.message}</p>
    </div>
    {payment_block}
    <p style="font-size:13px;color:#374151;margin:0 0 6px;">Questions? Reply to this email or WhatsApp: <strong>+44 773 947 6432</strong></p>
    <p style="font-size:12px;color:#9ca3af;margin:0;">Reference: {qid}</p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:14px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Planet Transfers · bookings@planettransfers.online</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>"""

    async def _send():
        await _send_email({
            "from":     f"Planet Transfers <{_SENDER_EMAIL}>",
            "reply_to": [_REPLY_TO_EMAIL],
            "to":       [quote["passenger_email"]],
            "subject":  f"Your Transfer Quote – {qid} | Planet Transfers",
            "html":     html,
        }, f"Quote reply {qid}")
        await db.quotes.update_one({"id": quote_id}, {"$set": {"status": "quoted"}})

    background_tasks.add_task(_send)
    return {"ok": True, "sent_to": quote["passenger_email"], "quote_id": qid}




class PartnerRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_name: str
    email: str
    phone: str
    business_type: str
    monthly_bookings: str
    message: Optional[str] = None
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PartnerRequestCreate(BaseModel):
    company_name: str
    contact_name: str
    email: str
    phone: str
    business_type: str
    monthly_bookings: str
    message: Optional[str] = None


def _build_partner_admin_html(p: dict) -> str:
    pid = p.get('id', '')[:8].upper()
    btype = p.get('business_type','').replace('_',' ').title()
    return f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:#1a1a2e;padding:24px 32px;">
    <h1 style="margin:0;color:#d4af37;font-size:22px;font-family:Georgia,serif;">Planet Transfers</h1>
    <p style="margin:4px 0 0;color:#fff;font-size:13px;">New Partner Request — PR-{pid}</p>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p style="font-size:15px;color:#111;font-weight:bold;margin:0 0 16px;">A new partner enquiry has been submitted.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr style="background:#f9fafb;"><td style="padding:8px 12px;font-size:12px;color:#6b7280;width:38%;font-weight:bold;border-bottom:1px solid #e5e7eb;">Company</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #e5e7eb;">{p.get('company_name','')}</td></tr>
      <tr><td style="padding:8px 12px;font-size:12px;color:#6b7280;font-weight:bold;border-bottom:1px solid #e5e7eb;">Contact</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #e5e7eb;">{p.get('contact_name','')}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:8px 12px;font-size:12px;color:#6b7280;font-weight:bold;border-bottom:1px solid #e5e7eb;">Email</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #e5e7eb;">{p.get('email','')}</td></tr>
      <tr><td style="padding:8px 12px;font-size:12px;color:#6b7280;font-weight:bold;border-bottom:1px solid #e5e7eb;">Phone / WhatsApp</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #e5e7eb;">{p.get('phone','')}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:8px 12px;font-size:12px;color:#6b7280;font-weight:bold;border-bottom:1px solid #e5e7eb;">Business Type</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #e5e7eb;">{btype}</td></tr>
      <tr><td style="padding:8px 12px;font-size:12px;color:#6b7280;font-weight:bold;border-bottom:1px solid #e5e7eb;">Est. Monthly Bookings</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #e5e7eb;">{p.get('monthly_bookings','')}</td></tr>
      {'<tr style="background:#f9fafb;"><td style="padding:8px 12px;font-size:12px;color:#6b7280;font-weight:bold;">Message</td><td style="padding:8px 12px;font-size:13px;color:#111;">' + p.get('message','') + '</td></tr>' if p.get('message') else ''}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">Reply directly to this email to respond to the partner.</p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Planet Transfers · bookings@planettransfers.online</p>
  </td></tr>
</table></td></tr></table></body></html>"""


def _build_partner_customer_html(p: dict) -> str:
    pid = p.get('id', '')[:8].upper()
    first = p.get('contact_name','').split()[0] if p.get('contact_name') else 'there'
    return f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:#1a1a2e;padding:24px 32px;">
    <h1 style="margin:0;color:#d4af37;font-size:22px;font-family:Georgia,serif;">Planet Transfers</h1>
    <p style="margin:4px 0 0;color:#fff;font-size:13px;">Partner Enquiry Received — PR-{pid}</p>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p style="font-size:15px;color:#111;margin:0 0 8px;">Dear {first},</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px;">Thank you for your interest in partnering with Planet Transfers. We have received your enquiry and our team will be in touch within <strong>1 business day</strong> to discuss how we can work together.</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Your Enquiry Summary</p>
      <table width="100%" cellpadding="4" cellspacing="0">
        <tr><td style="font-size:12px;color:#6b7280;width:40%;">Company</td><td style="font-size:13px;color:#111;font-weight:600;">{p.get('company_name','')}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;">Reference</td><td style="font-size:13px;color:#111;font-weight:600;">PR-{pid}</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#374151;line-height:1.6;margin:0;">Questions? Reach us on WhatsApp at <strong>+44 773 947 6432</strong> or reply to this email.</p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Planet Transfers · bookings@planettransfers.online</p>
  </td></tr>
</table></td></tr></table></body></html>"""


async def _send_partner_emails(partner: dict) -> None:
    if not resend.api_key:
        return
    pid = f"PR-{partner.get('id','')[:8].upper()}"
    customer_email = partner.get('email','')
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from":     f"Planet Transfers <{_SENDER_EMAIL}>",
            "reply_to": [customer_email] if customer_email else [_REPLY_TO_EMAIL],
            "to":       [_ADMIN_NOTIFY_EMAIL],
            "subject":  f"New Partner Request {pid} — {partner.get('company_name','')} ({partner.get('business_type','').replace('_',' ').title()})",
            "html":     _build_partner_admin_html(partner),
            "headers":  {"Reply-To": customer_email or _REPLY_TO_EMAIL},
        })
        logger.info(f"Admin partner notification sent for {pid}")
    except Exception as exc:
        logger.error(f"Admin partner notification failed for {pid}: {exc}")
    if customer_email:
        try:
            await asyncio.to_thread(resend.Emails.send, {
                "from":     f"Planet Transfers <{_SENDER_EMAIL}>",
                "reply_to": [_REPLY_TO_EMAIL],
                "to":       [customer_email],
                "subject":  f"Partner Enquiry Received — {pid} | Planet Transfers",
                "html":     _build_partner_customer_html(partner),
                "headers":  {"Reply-To": _REPLY_TO_EMAIL},
            })
            logger.info(f"Partner acknowledgement sent to {customer_email} for {pid}")
        except Exception as exc:
            logger.error(f"Partner acknowledgement failed for {pid}: {exc}")


@api_router.post("/partners")
async def create_partner_request(partner: PartnerRequestCreate, background_tasks: BackgroundTasks):
    obj = PartnerRequest(**partner.model_dump())
    doc = obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.partners.insert_one(doc)
    background_tasks.add_task(_send_partner_emails, doc)
    return obj


@api_router.get("/partners")
async def get_all_partners():
    partners = await db.partners.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return partners


@api_router.put("/partners/{partner_id}/status")
async def update_partner_status(partner_id: str, update: dict):
    await db.partners.update_one({"id": partner_id}, {"$set": {"status": update.get("status", "new")}})
    return {"ok": True}


@api_router.delete("/partners/{partner_id}")
async def delete_partner(partner_id: str):
    await db.partners.delete_one({"id": partner_id})
    return {"ok": True}


# ==================== MANUAL BOOKINGS + UNIFIED BOOKINGS ====================

class ManualBookingCreate(BaseModel):
    passenger_name: str
    passenger_email: Optional[str] = None
    passenger_phone: Optional[str] = None
    flight_number: Optional[str] = None
    pickup_location: str
    dropoff_location: str
    pickup_date: str
    pickup_time: str
    vehicle_type: str = "Standard"
    passengers: int = 1
    luggage: int = 0
    customer_price: float
    currency: str = "GBP"
    payment_status: str = "unpaid"
    booking_status: str = "confirmed"
    internal_notes: Optional[str] = None
    greeting_sign: Optional[str] = None

class ManualBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str = "manual"
    passenger_name: str
    passenger_email: Optional[str] = None
    passenger_phone: Optional[str] = None
    flight_number: Optional[str] = None
    pickup_location: str
    dropoff_location: str
    pickup_date: str
    pickup_time: str
    vehicle_type: str = "Standard"
    passengers: int = 1
    luggage: int = 0
    customer_price: float
    currency: str = "GBP"
    payment_status: str = "unpaid"
    booking_status: str = "confirmed"
    fulfillment_status: str = "pending"
    supplier_name: Optional[str] = None
    supplier_reference: Optional[str] = None
    supplier_cost: Optional[float] = None
    internal_notes: Optional[str] = None
    greeting_sign: Optional[str] = None
    voucher_sent: bool = False
    email_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.post("/manual-bookings")
async def create_manual_booking(booking: ManualBookingCreate, background_tasks: BackgroundTasks):
    obj = ManualBooking(**booking.model_dump())
    doc = obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.manual_bookings.insert_one(doc)
    if obj.passenger_email:
        background_tasks.add_task(_send_manual_booking_confirmation, doc)
    return obj


@api_router.get("/manual-bookings")
async def get_manual_bookings():
    bookings = await db.manual_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings


@api_router.get("/all-bookings")
async def get_all_bookings():
    iway_raw = await db.iway_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    manual_raw = await db.manual_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for b in iway_raw:
        b["source"] = "iway"
        if "passenger_price" not in b:
            b["customer_price"] = b.get("price", 0)
        else:
            b["customer_price"] = b.get("passenger_price", 0)
        if "fulfillment_status" not in b:
            b["fulfillment_status"] = "pending"
    for b in manual_raw:
        b["source"] = "manual"
    combined = iway_raw + manual_raw
    combined.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return combined


@api_router.put("/bookings/{booking_id}/supplier")
async def update_booking_supplier(booking_id: str, payload: dict):
    allowed = {"supplier_name","supplier_reference","supplier_cost",
               "fulfillment_status","internal_notes","booking_status","payment_status"}
    fields = {k: v for k, v in payload.items() if k in allowed}
    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    result = await db.manual_bookings.update_one({"id": booking_id}, {"$set": fields})
    if result.matched_count == 0:
        await db.iway_bookings.update_one({"id": booking_id}, {"$set": fields})
    return {"ok": True}


@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str):
    """Delete a booking — only allowed if no successful payment on record."""
    booking = await db.manual_bookings.find_one({"id": booking_id}, {"_id": 0})
    collection = "manual_bookings"
    if not booking:
        booking = await db.iway_bookings.find_one({"id": booking_id}, {"_id": 0})
        collection = "iway_bookings"
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.get("payment_status") == "payment_completed":
        raise HTTPException(status_code=403, detail="Cannot delete a booking with completed payment")
    await db[collection].delete_one({"id": booking_id})
    return {"ok": True, "deleted": booking_id}


@api_router.post("/bookings/{booking_id}/send-voucher")
async def send_voucher(booking_id: str, background_tasks: BackgroundTasks):
    booking = await db.manual_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        booking = await db.iway_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    background_tasks.add_task(_generate_and_send_voucher, booking)
    return {"ok": True}


def _generate_voucher_pdf(booking: dict) -> bytes:
    from fpdf import FPDF
    ref = booking.get("internal_booking_id") or f"PT-{booking.get('id','')[:8].upper()}"
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)

    # ── Header bar ──────────────────────────────────────────────────────────
    pdf.set_fill_color(26, 26, 46)
    pdf.rect(0, 0, 210, 38, 'F')
    pdf.set_xy(12, 8)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(212, 175, 55)
    pdf.cell(0, 10, "Planet Transfers", ln=True)
    pdf.set_xy(12, 21)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(200, 200, 200)
    pdf.cell(0, 6, "Booking Confirmation Voucher", ln=True)
    pdf.set_xy(150, 12)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(212, 175, 55)
    pdf.cell(0, 6, ref, ln=True)

    pdf.set_text_color(30, 30, 30)
    y = 48

    def section(title: str):
        nonlocal y
        pdf.set_fill_color(245, 245, 242)
        pdf.rect(10, y, 190, 8, 'F')
        pdf.set_xy(12, y + 1)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 6, title.upper(), ln=True)
        y += 12

    def row(label: str, value: str, highlight=False):
        nonlocal y
        if highlight:
            pdf.set_fill_color(255, 253, 235)
            pdf.rect(10, y, 190, 8, 'F')
        pdf.set_xy(12, y)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(110, 110, 110)
        pdf.cell(55, 7, label)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(0, 7, str(value), ln=True)
        y += 8

    # ── Passenger ───────────────────────────────────────────────────────────
    section("Passenger Details")
    row("Name", booking.get("passenger_name", ""))
    if booking.get("passenger_email"):
        row("Email", booking.get("passenger_email", ""))
    if booking.get("passenger_phone"):
        row("Phone", booking.get("passenger_phone", ""))
    y += 4

    # ── Transfer ────────────────────────────────────────────────────────────
    section("Transfer Details")
    row("Pickup", booking.get("pickup_location", ""))
    row("Drop-off", booking.get("dropoff_location", ""))
    row("Date", booking.get("pickup_date", ""))
    row("Time", booking.get("pickup_time", ""))
    row("Vehicle", booking.get("vehicle_type", ""))
    if booking.get("flight_number"):
        row("Flight Number", booking.get("flight_number", ""))
    pax = str(booking.get("passengers", booking.get("adults", 1)))
    row("Passengers", pax)
    if booking.get("greeting_sign"):
        row("Greeting Sign", booking.get("greeting_sign", ""))
    y += 4

    # ── Pricing ─────────────────────────────────────────────────────────────
    section("Payment")
    ccy = booking.get("currency", "GBP")
    price = booking.get("customer_price") or booking.get("passenger_price") or booking.get("price", 0)
    row("Total Price", f"{ccy} {float(price):.2f}", highlight=True)
    pstatus = booking.get("payment_status", "pending").replace("_", " ").title()
    row("Payment Status", pstatus)
    y += 4

    # ── Driver placeholder ───────────────────────────────────────────────────
    section("Driver Information")
    row("Driver", "Details will be provided 24 hours before your transfer")
    row("WhatsApp", "+44 773 947 6432")
    y += 4

    # ── Footer ──────────────────────────────────────────────────────────────
    pdf.set_fill_color(26, 26, 46)
    pdf.rect(0, 270, 210, 27, 'F')
    pdf.set_xy(12, 273)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(160, 160, 160)
    pdf.multi_cell(0, 5, "Planet Transfers  |  bookings@planettransfers.online  |  +44 773 947 6432  |  planettransfers.online\n"
                         "This voucher is your official booking confirmation. Please present it to your driver.")

    return bytes(pdf.output())


async def _generate_and_send_voucher(booking: dict) -> None:
    if not resend.api_key:
        return
    ref = booking.get("internal_booking_id") or f"PT-{booking.get('id','')[:8].upper()}"
    passenger_email = booking.get("passenger_email", "")
    if not passenger_email:
        logger.warning(f"No passenger email for voucher {ref}")
        return
    try:
        pdf_bytes = _generate_voucher_pdf(booking)
        import base64
        pdf_b64 = base64.b64encode(pdf_bytes).decode()
        first = (booking.get("passenger_name") or "").split()[0] or "there"
        html = f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:#1a1a2e;padding:24px 32px;">
    <h1 style="margin:0;color:#d4af37;font-size:22px;font-family:Georgia,serif;">Planet Transfers</h1>
    <p style="margin:4px 0 0;color:#fff;font-size:13px;">Booking Confirmation — {ref}</p>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p style="font-size:15px;color:#111;margin:0 0 12px;">Dear {first},</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">Your transfer is confirmed. Please find your booking voucher attached to this email.</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px 20px;margin:0 0 20px;">
      <table width="100%" cellpadding="4" cellspacing="0">
        <tr><td style="font-size:12px;color:#6b7280;width:40%;">Booking Ref</td><td style="font-size:13px;color:#111;font-weight:600;">{ref}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;">Pickup</td><td style="font-size:13px;color:#111;font-weight:600;">{booking.get('pickup_location','')}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;">Drop-off</td><td style="font-size:13px;color:#111;font-weight:600;">{booking.get('dropoff_location','')}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;">Date &amp; Time</td><td style="font-size:13px;color:#111;font-weight:600;">{booking.get('pickup_date','')} at {booking.get('pickup_time','')}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;">Vehicle</td><td style="font-size:13px;color:#111;font-weight:600;">{booking.get('vehicle_type','')}</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#374151;margin:0;">Driver details will be sent 24 hours before your transfer. Questions? WhatsApp us at <strong>+44 773 947 6432</strong>.</p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Planet Transfers · bookings@planettransfers.online</p>
  </td></tr>
</table></td></tr></table></body></html>"""
        await asyncio.to_thread(resend.Emails.send, {
            "from":        f"Planet Transfers <{_SENDER_EMAIL}>",
            "reply_to":    [_REPLY_TO_EMAIL],
            "to":          [passenger_email],
            "subject":     f"Your Booking Voucher — {ref} | Planet Transfers",
            "html":        html,
            "attachments": [{"filename": f"PlanetTransfers_{ref}.pdf", "content": pdf_b64}],
            "headers":     {"Reply-To": _REPLY_TO_EMAIL},
        })
        await db.manual_bookings.update_one({"id": booking.get("id")}, {"$set": {"voucher_sent": True}})
        await db.iway_bookings.update_one({"id": booking.get("id")}, {"$set": {"voucher_sent": True}})
        logger.info(f"Voucher sent to {passenger_email} for {ref}")
    except Exception as exc:
        logger.error(f"Voucher send failed for {ref}: {exc}")


async def _send_manual_booking_confirmation(booking: dict) -> None:
    """Admin notification when a manual booking is created."""
    if not resend.api_key:
        return
    ref = f"PT-{booking.get('id','')[:8].upper()}"
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from":    f"Planet Transfers <{_SENDER_EMAIL}>",
            "to":      [_ADMIN_NOTIFY_EMAIL],
            "subject": f"Manual Booking Created {ref} — {booking.get('passenger_name','')} | {booking.get('pickup_location','')} → {booking.get('dropoff_location','')}",
            "html":    _build_quote_admin_html({**booking, "id": booking.get("id",""), "passenger_email": booking.get("passenger_email",""), "trip_type":"one-way", "passengers": booking.get("passengers",1), "luggage": booking.get("luggage",0), "vehicle_preference": booking.get("vehicle_type",""), "special_requests": booking.get("internal_notes","")}),
            "headers": {"Reply-To": booking.get("passenger_email","") or _REPLY_TO_EMAIL},
        })
        logger.info(f"Manual booking admin notification sent for {ref}")
    except Exception as exc:
        logger.error(f"Manual booking notification failed: {exc}")


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

IWAY_USER_ID = os.environ['IWAY_USER_ID']
IWAY_API_BASE = os.environ.get('IWAY_API_BASE', 'https://ng-api.iwayex.com')

# ==================== EMAIL (RESEND) ====================

resend.api_key = os.environ.get('RESEND_API_KEY', '')
_SENDER_EMAIL      = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
_SENDER_FALLBACK   = 'onboarding@resend.dev'   # always-verified Resend sender (fallback)
_SUPPORT_EMAIL     = os.environ.get('ADMIN_EMAIL',  'GBRoyaltransfers@gmail.com')
_ADMIN_NOTIFY_EMAIL = os.environ.get('ADMIN_EMAIL', 'GBRoyaltransfers@gmail.com')
# Reply-To is hardcoded — this is the monitored inbox customers must reach
_REPLY_TO_EMAIL    = os.environ.get('ADMIN_EMAIL', 'GBRoyaltransfers@gmail.com')


async def _send_email(payload: dict, label: str) -> bool:
    """Send via Resend. If custom domain not yet verified, retries with fallback sender."""
    for sender in [payload.get("from"), f"Planet Transfers <{_SENDER_FALLBACK}>"]:
        try:
            p = dict(payload); p["from"] = sender
            await asyncio.to_thread(resend.Emails.send, p)
            if sender != payload.get("from"):
                logger.info(f"{label} sent via fallback sender")
            else:
                logger.info(f"{label} sent")
            return True
        except Exception as exc:
            exc_str = str(exc).lower()
            logger.error(f"{label} [{sender}] error: {exc}")
            if any(kw in exc_str for kw in ("not verified", "domain", "sender", "from")):
                logger.warning(f"{label} → rejected, trying next sender")
                continue
            return False
    logger.error(f"{label} failed with all senders")
    return False


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
        <a href="mailto:GBRoyaltransfers@gmail.com" style="display:inline-block;color:#d4af37;font-size:13px;text-decoration:none;font-family:Arial,sans-serif;margin-bottom:10px;">GBRoyaltransfers@gmail.com</a><br>
        <a href="https://wa.me/447739476432?text=Hi%2C%20I%27d%20like%20help%20with%20a%20transfer%20booking" style="display:inline-block;background-color:#25D366;color:#ffffff;font-size:12px;font-weight:bold;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;margin-top:4px;">WhatsApp: +44 7739 476432</a>
      </td></tr>
    </table>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
    <p style="margin:0 0 4px;color:#111827;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">Planet Transfers</p>
    <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;font-family:Arial,sans-serif;">Premium Airport Transfer Service</p>
    <p style="margin:10px 0 4px;color:#d1d5db;font-size:10px;font-family:Arial,sans-serif;">
      <strong>bookings@planettransfers.online</strong> is a no-reply address and is not monitored.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:10px;font-family:Arial,sans-serif;">
      To contact us, reply to this email — your reply will reach our team at <strong>GBRoyaltransfers@gmail.com</strong>
    </p>
    <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;font-family:Arial,sans-serif;">
      For any questions: <a href="mailto:GBRoyaltransfers@gmail.com" style="color:#d4af37;">GBRoyaltransfers@gmail.com</a>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>"""


_REPLY_TO_EMAIL = 'GBRoyaltransfers@gmail.com'  # monitored inbox — duplicate safety


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
        "from":     f"Planet Transfers <{_SENDER_EMAIL}>",
        "reply_to": [_REPLY_TO_EMAIL],
        "to":       [_ADMIN_NOTIFY_EMAIL],
        "subject":  f"New Booking {pt_ref} – {booking.get('passenger_name','')} | Planet Transfers",
        "html":     _build_admin_notification_html(booking),
        "headers":  {"Reply-To": _REPLY_TO_EMAIL},
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
        "from":     f"Planet Transfers <{_SENDER_EMAIL}>",
        "reply_to": [_REPLY_TO_EMAIL],
        "to":       [booking["passenger_email"]],
        "subject":  f"Booking Confirmation – {pt_ref} | Planet Transfers",
        "html":     _build_confirmation_html(booking),
        "headers":  {"Reply-To": _REPLY_TO_EMAIL},
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


# ── Quote emails ─────────────────────────────────────────────────────────────

def _build_quote_admin_html(quote: dict) -> str:
    qid = quote.get('id', '')[:8].upper()
    is_rt = quote.get('trip_type') == 'round-trip'

    def row(label, value, alt='—'):
        v = value if value else alt
        return f'<tr><td style="padding:7px 12px;font-size:12px;color:#6b7280;width:38%;font-weight:bold;border-bottom:1px solid #e5e7eb;">{label}</td><td style="padding:7px 12px;font-size:13px;color:#111;border-bottom:1px solid #e5e7eb;">{v}</td></tr>'

    children = quote.get('children', 0) or 0
    child_block = f'{children} child(ren)' + (f' — {quote.get("child_seat_details","")}' if quote.get('child_seat_details') else '') if children else 'None'

    return_pickup = quote.get('return_pickup_time') or quote.get('return_time', '')
    ret_pax = quote.get('return_passengers') if not quote.get('same_pax_luggage', True) else quote.get('passengers')
    ret_lug = quote.get('return_luggage') if not quote.get('same_pax_luggage', True) else quote.get('luggage')

    return_section = f"""
    <tr><td colspan="2" style="padding:12px 12px 4px;font-size:12px;font-weight:bold;color:#b45309;text-transform:uppercase;letter-spacing:.06em;background:#fffbeb;border-bottom:1px solid #fde68a;">Return Journey</td></tr>
    {row('Return Pickup', quote.get('return_pickup_location'))}
    {row('Return Drop-off', quote.get('return_dropoff_location'))}
    {row('Return Date', quote.get('return_date'))}
    {row('Desired Pickup Time', return_pickup)}
    {row('Return Flight No.', (quote.get('return_flight_number') or '').upper() or None)}
    {row('Flight Departure Time', quote.get('return_flight_departure_time'))}
    {row('Return Passengers', ret_pax)}
    {row('Return Luggage', ret_lug)}
    {row('Return Notes', quote.get('return_notes'))}
    """ if is_rt else ''

    return f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:#1a1a2e;padding:24px 32px;">
    <h1 style="margin:0;color:#d4af37;font-size:22px;font-family:Georgia,serif;">Planet Transfers</h1>
    <p style="margin:4px 0 0;color:#fff;font-size:13px;">New Quote Request — QT-{qid}</p>
  </td></tr>
  <tr><td style="padding:24px 32px 0;">
    <p style="font-size:15px;color:#111;font-weight:bold;margin:0 0 16px;">A new {"round-trip " if is_rt else ""}quote request has been submitted.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td colspan="2" style="padding:8px 12px 4px;font-size:12px;font-weight:bold;color:#1e40af;text-transform:uppercase;letter-spacing:.06em;background:#eff6ff;border-bottom:1px solid #bfdbfe;">Customer</td></tr>
      {row('Name', quote.get('passenger_name'))}
      {row('Email', quote.get('passenger_email'))}
      {row('Phone', quote.get('passenger_phone'))}
      <tr><td colspan="2" style="padding:12px 12px 4px;font-size:12px;font-weight:bold;color:#065f46;text-transform:uppercase;letter-spacing:.06em;background:#ecfdf5;border-bottom:1px solid #a7f3d0;">Outbound Journey</td></tr>
      {row('Trip Type', ('Round-Trip' if is_rt else 'One-Way'))}
      {row('Pickup', quote.get('pickup_location'))}
      {row('Drop-off', quote.get('dropoff_location'))}
      {row('Pickup Date', _format_email_date(quote.get('pickup_date','')))}
      {row('Desired Pickup Time', quote.get('pickup_time'))}
      {row('Arrival Flight No.', (quote.get('flight_number') or '').upper() or None)}
      {row('Scheduled Arrival Time', quote.get('flight_arrival_time'))}
      {row('Passengers', quote.get('passengers'))}
      {row('Children', child_block)}
      {row('Luggage', str(quote.get('luggage','')) + ' bags')}
      {row('Vehicle Preference', quote.get('vehicle_preference') or 'No preference')}
      {row('Special Requests', quote.get('special_requests'))}
      {return_section}
    </table>
    <p style="margin:20px 0 8px;font-size:13px;color:#6b7280;">Reply directly to this email to respond to the customer.</p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:14px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Planet Transfers · bookings@planettransfers.online</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>"""


def _build_quote_customer_html(quote: dict) -> str:
    qid = quote.get('id', '')[:8].upper()
    is_rt = quote.get('trip_type') == 'round-trip'
    return_pickup = quote.get('return_pickup_time') or quote.get('return_time', '')

    return_block = f"""
      <tr style="background:#fffbeb;"><td colspan="2" style="padding:8px 12px 4px;font-size:11px;font-weight:bold;color:#b45309;text-transform:uppercase;letter-spacing:.05em;">Return Journey</td></tr>
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 12px;width:42%;">Date</td><td style="font-size:13px;color:#111;font-weight:600;padding:3px 12px;">{quote.get('return_date','—')}</td></tr>
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 12px;">Pickup Time</td><td style="font-size:13px;color:#111;font-weight:600;padding:3px 12px;">{return_pickup or '—'}</td></tr>
      {('<tr><td style="font-size:12px;color:#6b7280;padding:3px 12px;">Return From</td><td style="font-size:13px;color:#111;font-weight:600;padding:3px 12px;">' + quote.get('return_pickup_location','') + '</td></tr>') if quote.get('return_pickup_location') else ''}
      {('<tr><td style="font-size:12px;color:#6b7280;padding:3px 12px;">Return Flight</td><td style="font-size:13px;color:#111;font-weight:600;padding:3px 12px;">' + (quote.get('return_flight_number') or '').upper() + '</td></tr>') if quote.get('return_flight_number') else ''}
    """ if is_rt else ''

    return f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:#1a1a2e;padding:24px 32px;">
    <h1 style="margin:0;color:#d4af37;font-size:22px;font-family:Georgia,serif;">Planet Transfers</h1>
    <p style="margin:4px 0 0;color:#fff;font-size:13px;">Quote Request Received</p>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p style="font-size:15px;color:#111;margin:0 0 8px;">Dear {quote.get('passenger_name','').split()[0] if quote.get('passenger_name') else 'there'},</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Thank you for your {"round-trip " if is_rt else ""}quote request. Our team will review your route and get back to you with a price within <strong>a few hours</strong>.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Your Transfer Summary</p>
      <table width="100%" cellpadding="4" cellspacing="0">
        <tr><td style="font-size:12px;color:#6b7280;width:40%;">From</td><td style="font-size:13px;color:#111;font-weight:600;">{quote.get('pickup_location','')}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;">To</td><td style="font-size:13px;color:#111;font-weight:600;">{quote.get('dropoff_location','')}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;">Date &amp; Time</td><td style="font-size:13px;color:#111;font-weight:600;">{_format_email_date(quote.get('pickup_date',''))} at {quote.get('pickup_time','')}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;">Passengers</td><td style="font-size:13px;color:#111;font-weight:600;">{quote.get('passengers','')} adult(s){(', ' + str(quote.get('children',0)) + ' child(ren)') if quote.get('children') else ''}</td></tr>
        {('<tr><td style="font-size:12px;color:#6b7280;">Vehicle</td><td style="font-size:13px;color:#111;font-weight:600;">' + quote.get('vehicle_preference','') + '</td></tr>') if quote.get('vehicle_preference') else ''}
        {return_block}
      </table>
    </div>
    <p style="font-size:13px;color:#374151;line-height:1.6;margin:0 0 6px;">
      Your reference: <strong>QT-{qid}</strong>. Please quote this if you contact us.
    </p>
    <p style="font-size:13px;color:#374151;line-height:1.6;margin:0;">
      Questions? WhatsApp: <strong>+44 773 947 6432</strong> or reply to this email.
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Planet Transfers · bookings@planettransfers.online</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>"""


async def _send_quote_emails(quote: dict) -> None:
    """Send admin notification + customer acknowledgement when a new quote is submitted."""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not set — skipping quote emails")
        return

    qid = f"QT-{quote.get('id','')[:8].upper()}"
    customer_email = quote.get('passenger_email', '')

    await _send_email({
        "from":     f"Planet Transfers <{_SENDER_EMAIL}>",
        "reply_to": [customer_email] if customer_email else [_REPLY_TO_EMAIL],
        "to":       [_ADMIN_NOTIFY_EMAIL],
        "subject":  f"New Quote Request {qid} – {quote.get('passenger_name','')} | {quote.get('pickup_location','')} → {quote.get('dropoff_location','')}",
        "html":     _build_quote_admin_html(quote),
        "headers":  {"Reply-To": customer_email or _REPLY_TO_EMAIL},
    }, f"Admin quote notification {qid}")

    if customer_email:
        await _send_email({
            "from":     f"Planet Transfers <{_SENDER_EMAIL}>",
            "reply_to": [_REPLY_TO_EMAIL],
            "to":       [customer_email],
            "subject":  f"Quote Request Received – {qid} | Planet Transfers",
            "html":     _build_quote_customer_html(quote),
            "headers":  {"Reply-To": _REPLY_TO_EMAIL},
        }, f"Customer quote acknowledgement {qid}")


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

    # Auto-confirm booking when payment is completed
    if update.payment_status == "payment_completed":
        await db.iway_bookings.update_one(
            {"id": booking_id, "booking_status": "pending"},
            {"$set": {"booking_status": "confirmed"}}
        )
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
            "from":     sender,
            "reply_to": ["GBRoyaltransfers@gmail.com"],
            "headers":  {"Reply-To": "GBRoyaltransfers@gmail.com"},
            "to":       [admin_email],
            "subject":  f"[Talixo] New Booking Request — {booking.get('pickup_location','')} → {booking.get('dropoff_location','')}",
            "html":     html,
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
            "from":     sender,
            "reply_to": admin_email,
            "to":       [admin_email],
            "subject":  f"[MyTransfers] New Booking Request — {booking.get('pickup_location','')} → {booking.get('dropoff_location','')}",
            "html":     html,
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
