"""
MyTransfers White-Label API Service
API Documentation: Swagger at /{key}/... (key in URL path, not headers)

Base URL (test): Configured via MYTRANSFERS_BASE_URL env var
Auth: API key embedded in URL path — GET /{key}/availabilities

Payment model:
  No payment URL returned by API.
  Planet Transfers MUST collect customer payment independently (Stripe).
  MyTransfers invoices Planet Transfers on a billing cycle.

Phase flags:
  MYTRANSFERS_ENABLED     = false  → Entire integration hidden from customers
  MYTRANSFERS_API_BOOKING = false  → Skip API booking; save as manual request only
                                     (used until MyTransfers credit approval confirmed)
"""

import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

# ── Config from env ────────────────────────────────────────────────────────────
MYTRANSFERS_API_KEY     = os.environ.get("MYTRANSFERS_API_KEY", "")
MYTRANSFERS_BASE_URL    = os.environ.get(
    "MYTRANSFERS_BASE_URL",
    "http://mytransfersapitest-env.jqpvqnc6ft.eu-west-1.elasticbeanstalk.com:5382"
).rstrip("/")
MYTRANSFERS_ENABLED     = os.environ.get("MYTRANSFERS_ENABLED", "false").lower() == "true"
MYTRANSFERS_API_BOOKING = os.environ.get("MYTRANSFERS_API_BOOKING", "false").lower() == "true"
MYTRANSFERS_CURRENCY    = os.environ.get("MYTRANSFERS_CURRENCY", "EUR")

_TIMEOUT = 25.0
_GEOCODE_TIMEOUT = 10.0

_NOMINATIM_HEADERS = {"User-Agent": "PlanetTransfers/1.0 (bookings@planettransfers.online)"}


# ── Helpers ────────────────────────────────────────────────────────────────────

def is_enabled() -> bool:
    return MYTRANSFERS_ENABLED and bool(MYTRANSFERS_API_KEY)


def api_booking_enabled() -> bool:
    return MYTRANSFERS_API_BOOKING and bool(MYTRANSFERS_API_KEY)


def _detect_location_type(address: str) -> str:
    """
    Attempt to classify an address as airport/port/train_station.
    Falls back to 'airport' (default for this transfer service).
    """
    addr = address.lower()
    if "airport" in addr or "aeropuerto" in addr or "aeroport" in addr:
        return "airport"
    if " port" in addr or "harbour" in addr or "harbor" in addr or "cruise" in addr:
        return "port"
    if "station" in addr or "train" in addr or "rail" in addr or "gare" in addr:
        return "train_station"
    return "airport"  # default — this is an airport transfer platform


async def _geocode(address: str) -> tuple:
    """
    Geocode an address to (lat, lng) using OpenStreetMap Nominatim.
    Returns (float, float) or raises ValueError.
    """
    async with httpx.AsyncClient(timeout=_GEOCODE_TIMEOUT) as client:
        resp = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers=_NOMINATIM_HEADERS,
        )
    data = resp.json()
    if not data:
        raise ValueError(f"MyTransfers: could not geocode address: {address}")
    return float(data[0]["lat"]), float(data[0]["lon"])


def _normalize_vehicle(v: dict, session_id: str) -> dict:
    """
    Map a MyTransfers TransferPrice object to the internal Planet Transfers vehicle format.
    session_id is embedded so PassengerDetailsPage can pass it back to the booking endpoint.

    IMPORTANT: The booking API requires the session-scoped 'transferId' (e.g. "6886598xaGN3TpnAb"),
    NOT the catalog 'transportId' (e.g. 48). We store both for reference.
    """
    return {
        # ── Fields mirroring iWay/Talixo structure (used by frontend directly) ─
        "price_id":         v.get("transferId"),        # session-scoped token — REQUIRED for booking
        "transport_id":     v.get("transportId"),       # catalog ID — reference only
        "price":            float(v.get("price") or 0),
        "currency":         v.get("currency") or MYTRANSFERS_CURRENCY,
        "car_class": {
            "title":  v.get("transportName") or "Standard",
            "image":  v.get("imageURL") or "",
            "id":     str(v.get("transportId") or ""),
        },
        "capacity":         v.get("maxPassengers") or 4,
        "luggage_capacity": v.get("suitcases") or 2,
        "services": [
            {"title": "Meet & Greet included"},
            {"title": "Flight tracking"},
            {"title": "Free waiting time"},
            {"title": "Fixed price"},
        ],
        # ── MyTransfers-specific extras ──────────────────────────────────────
        "supplier":         "mytransfers",
        "session_id":       session_id,    # Required for booking call
        "min_passengers":   v.get("minPassengers") or 1,
        "max_passengers":   v.get("maxPassengers") or 4,
        "mt_image_url":     v.get("imageURL") or "",
        "available_extras": v.get("extras") or [],
    }


# ── Search / Quote ─────────────────────────────────────────────────────────────

async def search_vehicles(
    pickup:     str,
    dropoff:    str,
    date:       str,       # YYYY-MM-DD
    time:       str,       # HH:MM
    passengers: int = 1,   # adults
    children:   int = 0,
    infants:    int = 0,
) -> dict:
    """
    GET /{key}/availabilities
    Geocodes pickup/dropoff, fetches live availability, returns normalized vehicle list.
    Raises ValueError on API error or geocoding failure.
    """
    logger.info(
        f"[MyTransfers] search_vehicles: '{pickup}' → '{dropoff}' on {date} {time} "
        f"adults={passengers} children={children}"
    )

    # Geocode both addresses in parallel
    try:
        from_lat, from_lng = await _geocode(pickup)
        to_lat, to_lng     = await _geocode(dropoff)
    except Exception as exc:
        raise ValueError(f"MyTransfers: geocoding failed — {exc}")

    pickup_dt = f"{date} {time}"  # "yyyy-MM-dd HH:mm"

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(
            f"{MYTRANSFERS_BASE_URL}/{MYTRANSFERS_API_KEY}/availabilities",
            params={
                "originLat":      from_lat,
                "originLng":      from_lng,
                "destinationLat": to_lat,
                "destinationLng": to_lng,
                "adults":         passengers,
                "childs":         children,
                "infants":        infants,
                "pickupDate":     pickup_dt,
                "lang":           "EN",
            },
        )

    logger.info(
        f"[MyTransfers] search response HTTP={resp.status_code} body={str(resp.text)[:300]}"
    )

    if resp.status_code != 200:
        raise ValueError(
            f"MyTransfers availability failed (HTTP {resp.status_code}): {resp.text[:200]}"
        )

    data = resp.json()
    session_id          = data.get("sessionId") or ""
    transfer_price_list = data.get("transferPriceList") or []

    vehicles = [_normalize_vehicle(v, session_id) for v in transfer_price_list]
    vehicles.sort(key=lambda x: x["price"])

    logger.info(
        f"[MyTransfers] found {len(vehicles)} vehicles sessionId={session_id[:12] if session_id else 'none'}…"
    )

    return {
        "vehicles":   vehicles,
        "session_id": session_id,
    }


# ── Create Booking ─────────────────────────────────────────────────────────────

async def create_booking(
    session_id:          str,
    transfer_id:         str,        # transportId from TransferPrice
    first_name:          str,
    last_name:           str,
    email:               str,
    phone:               str,
    country:             str = "GB",
    origin_type:         str = "airport",
    destination_type:    str = "airport",
    origin_address:      Optional[str] = None,
    destination_address: Optional[str] = None,
    flight_number:       Optional[str] = None,   # mapped → arrivalLocator
    arrival_pickup_time: Optional[str] = None,   # "YYYY-MM-DD HH:mm" → arrivalPickUpTime
    special_requirements: Optional[str] = None,
    external_reference:  Optional[str] = None,   # our internal booking ID
) -> dict:
    """
    POST /{key}/bookings
    Creates the booking via MyTransfers API.
    Returns the full Booking object (orderId, status, totalPrice, etc.).
    Raises ValueError on API error.

    BLOCKED until MYTRANSFERS_API_BOOKING=true (requires MyTransfers credit approval).
    """
    params: dict = {
        "sessionId":         session_id,
        "transferId":        transfer_id,
        "customerFirstName": first_name,
        "customerLastName":  last_name,
        "customerEmail":     email,
        "customerPhone":     phone,
        "customerCountry":   country,
        "originType":        origin_type,
        "destinationType":   destination_type,
        "lang":              "EN",
    }

    if origin_address:
        params["originAddress"] = origin_address
    if destination_address:
        params["destinationAddress"] = destination_address
    if flight_number:
        params["arrivalLocator"] = flight_number
    if arrival_pickup_time:
        params["arrivalPickUpTime"] = arrival_pickup_time
    if special_requirements:
        params["specialRequirements"] = special_requirements
    if external_reference:
        params["pickupExternalReference"] = external_reference

    logger.info(
        f"[MyTransfers] create_booking: sessionId={session_id[:12]}… "
        f"transferId={transfer_id} passenger='{first_name} {last_name}' "
        f"ext_ref={external_reference}"
    )

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            f"{MYTRANSFERS_BASE_URL}/{MYTRANSFERS_API_KEY}/bookings",
            params=params,
        )

    logger.info(
        f"[MyTransfers] create_booking HTTP={resp.status_code} body={str(resp.text)[:400]}"
    )

    if resp.status_code not in (200, 201):
        raise ValueError(
            f"MyTransfers booking creation failed (HTTP {resp.status_code}): {resp.text[:200]}"
        )

    return resp.json()


# ── Get Booking ────────────────────────────────────────────────────────────────

async def get_booking(booking_id: int) -> dict:
    """
    GET /{key}/bookings/{bookingId}
    Retrieves full booking details including driver info.
    booking_id is the numeric orderId from the booking response.
    """
    logger.info(f"[MyTransfers] get_booking: {booking_id}")

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(
            f"{MYTRANSFERS_BASE_URL}/{MYTRANSFERS_API_KEY}/bookings/{booking_id}",
            params={"lang": "EN"},
        )

    logger.info(f"[MyTransfers] get_booking HTTP={resp.status_code}")

    if resp.status_code != 200:
        raise ValueError(
            f"Could not retrieve MyTransfers booking {booking_id} "
            f"(HTTP {resp.status_code}): {resp.text[:200]}"
        )
    return resp.json()


# ── Cancel Booking ─────────────────────────────────────────────────────────────

async def cancel_booking(booking_id: int) -> bool:
    """
    DELETE /{key}/bookings/{bookingId}
    Returns True on 200/204 (success).
    Raises ValueError on failure.
    """
    logger.info(f"[MyTransfers] cancel_booking: {booking_id}")

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.delete(
            f"{MYTRANSFERS_BASE_URL}/{MYTRANSFERS_API_KEY}/bookings/{booking_id}",
        )

    logger.info(f"[MyTransfers] cancel_booking HTTP={resp.status_code}")

    if resp.status_code in (200, 204):
        return True

    raise ValueError(
        f"MyTransfers cancellation failed (HTTP {resp.status_code}): {resp.text[:200]}"
    )
