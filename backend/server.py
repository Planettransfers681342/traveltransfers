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
_SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
_SUPPORT_EMAIL = 'GBRoyaltransfers@gmail.com'


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


_ADMIN_NOTIFY_EMAIL = 'milevgeorgi681@gmail.com'


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
        result = await asyncio.to_thread(resend.Emails.send, params)
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

    async with httpx.AsyncClient(timeout=20.0) as client_h:
        # ── Step 2: Create order on iWay ─────────────────────────────────────
        order_resp = await client_h.post(
            f"{IWAY_API_BASE}/v1/orders",
            json={"trips": [trip]}
        )
        order_data = order_resp.json()
        if order_data.get("error"):
            err_msg = order_data["error"].get("message", "Booking failed")
            await db.iway_bookings.update_one(
                {"id": internal_id},
                {"$set": {"booking_status": "iway_error", "admin_notes": err_msg}}
            )
            raise HTTPException(status_code=400, detail=err_msg)

        result = order_data["result"][0]
        transaction = result["transaction"]
        booker_number = result.get("booker_number", "")
        final_price = result.get("price")

        # ── Step 3: Get payment URL ───────────────────────────────────────────
        pay_resp = await client_h.get(
            f"{IWAY_API_BASE}/v1/orders/pay-url",
            params={
                "transaction": transaction,
                "trans_host_name": "planettransfers.online",
                "user_id": IWAY_USER_ID
            }
        )
        pay_data = pay_resp.json()
        if pay_data.get("error"):
            await db.iway_bookings.update_one(
                {"id": internal_id},
                {"$set": {"iway_transaction": transaction, "booking_status": "iway_error",
                          "admin_notes": "pay-url call failed"}}
            )
            raise HTTPException(status_code=400, detail="Could not retrieve payment URL")

        payment_url = pay_data["result"]["url"]

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
