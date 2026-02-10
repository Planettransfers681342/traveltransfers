from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
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

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str):
    valid_statuses = ["pending", "confirmed", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"booking_status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Status updated"}

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
                await db.bookings.update_one(
                    {"id": booking_id},
                    {"$set": {
                        "payment_status": "paid",
                        "booking_status": "confirmed"
                    }}
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
    
    # Calculate revenue from paid bookings
    paid_bookings = await db.bookings.find({"payment_status": "paid"}, {"_id": 0, "price": 1}).to_list(1000)
    total_revenue = sum(b.get("price", 0) for b in paid_bookings)
    
    return {
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "total_revenue": round(total_revenue, 2)
    }

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
