"""
Talixo Partner API Service
API Documentation: v1.14

Base URL:
  Sandbox:    https://beta.talixo.com/en/mapi/v3
  Production: confirm with Talixo (likely https://talixo.com/en/mapi/v3)

Authentication: Partner: {API_KEY} header on every request

Payment model:
  payment_method="default" = Invoice billing to Planet Transfers.
  Planet Transfers MUST collect customer payment independently (Stripe).
  Talixo invoices Planet Transfers on a billing cycle.

Phase flags:
  TALIXO_ENABLED     = false  → Entire integration hidden from customers
  TALIXO_API_BOOKING = false  → Skip API booking creation; save as manual request only
                                (used until Talixo credit approval is confirmed)
"""

import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

# ── Config from env ────────────────────────────────────────────────────────────
TALIXO_API_KEY     = os.environ.get("TALIXO_API_KEY", "")
TALIXO_BASE_URL    = os.environ.get("TALIXO_BASE_URL", "https://beta.talixo.com/en/mapi/v3").rstrip("/")
TALIXO_ENABLED     = os.environ.get("TALIXO_ENABLED", "false").lower() == "true"
TALIXO_API_BOOKING = os.environ.get("TALIXO_API_BOOKING", "false").lower() == "true"

_TIMEOUT = 25.0

# ── Vehicle category metadata ─────────────────────────────────────────────────
_CATEGORY_FEATURES = {
    "economy":     ["Fixed price", "English-speaking driver", "Flight tracking", "Meet & Greet"],
    "business":    ["Fixed price", "Business class vehicle", "Flight tracking", "Meet & Greet"],
    "first_class": ["Fixed price", "Premium vehicle", "Extended waiting (90 min)", "Meet & Greet"],
    "van":         ["Fixed price", "Up to 8 passengers", "Flight tracking", "Meet & Greet"],
    "taxi":        ["Taximeter-based pricing", "Local taxi fleet"],
}

_CATEGORY_IMAGES = {
    "economy":     "https://static.talixo.de/next-booking/vehicles/economy.png",
    "business":    "https://static.talixo.de/next-booking/vehicles/business.png",
    "first_class": "https://static.talixo.de/next-booking/vehicles/business.png",
    "van":         "https://static.talixo.de/next-booking/vehicles/business_van.png",
    "taxi":        "https://static.talixo.de/next-booking/vehicles/taxi.png",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def is_enabled() -> bool:
    return TALIXO_ENABLED and bool(TALIXO_API_KEY)


def api_booking_enabled() -> bool:
    return TALIXO_API_BOOKING and bool(TALIXO_API_KEY)


def _headers() -> dict:
    return {
        "Partner": TALIXO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
    }


def _normalize_vehicle(v: dict, is_taxi: bool = False, currency: str = "GBP") -> dict:
    """
    Map a raw Talixo vehicle object to the internal Planet Transfers vehicle format.
    Keeps field names compatible with the existing iWay results page structure.
    """
    raw_category = (v.get("booking_category") or "economy").lower()
    features     = _CATEGORY_FEATURES.get(raw_category, _CATEGORY_FEATURES["economy"])
    label        = (v.get("booking_category") or "Economy").replace("_", " ").title()
    image        = _CATEGORY_IMAGES.get(raw_category, _CATEGORY_IMAGES["economy"])

    price   = float(v.get("discount_price") or v.get("regular_price") or 0)
    cur     = v.get("currency_code") or currency

    return {
        # ── Fields that mirror iWay structure (used by frontend directly) ────
        "price_id":          v.get("id"),      # Talixo vehicle ID — used as vehicle param on booking
        "price":             price,
        "currency":          cur,
        "car_class": {
            "title": label,
            "image": image,
            "id":    raw_category,
        },
        "capacity":          v.get("seats")   or 4,
        "luggage_capacity":  v.get("luggage") or 2,
        "services":          [{"title": f} for f in features],
        # ── Talixo-specific extras ───────────────────────────────────────────
        "supplier":          "talixo",
        "car_model":         v.get("car_model") or f"{label} class vehicle",
        "is_taxi":           is_taxi,
        "regular_price":     float(v.get("regular_price") or price),
        "discount_price":    float(v.get("discount_price") or price),
        "vat_rate":          v.get("vat_rate"),
        "search_url":        v.get("search_url"),
    }


# ── Search / Quote ─────────────────────────────────────────────────────────────

async def search_vehicles(
    pickup:     str,
    dropoff:    str,
    date:       str,       # YYYY-MM-DD
    time:       str,       # HH:MM
    passengers: int = 1,
    luggage:    int = 1,
    currency:   str = "GBP",
) -> dict:
    """
    POST /vehicles/booking_query/
    Returns normalized vehicle list sorted by price (fixed-price first, then taxis).
    Raises ValueError on API error.
    """
    payload = {
        "start_point":      pickup,
        "end_point":        dropoff,
        "start_time_date":  date,
        "start_time_time":  time,
        "passengers":       passengers,
        "luggage":          luggage,
        "sport_luggage":    0,
        "animals":          0,
        "best_only":        False,
    }

    logger.info(f"[Talixo] search_vehicles: '{pickup}' → '{dropoff}' on {date} {time} "
                f"pax={passengers} luggage={luggage} currency={currency}")

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            f"{TALIXO_BASE_URL}/vehicles/booking_query/",
            headers=_headers(),
            data=payload,
        )

    data = resp.json()
    logger.info(f"[Talixo] search response HTTP={resp.status_code} "
                f"taxis={len(data.get('taxis', []))} "
                f"limousines={len(data.get('limousines', []))}")

    if resp.status_code != 200:
        errors = data.get("errors") or [str(data)[:200]]
        raise ValueError(f"Talixo search failed (HTTP {resp.status_code}): {errors}")

    taxis = [_normalize_vehicle(v, is_taxi=True,  currency=currency)
             for v in (data.get("taxis")      or [])]
    limos = [_normalize_vehicle(v, is_taxi=False, currency=currency)
             for v in (data.get("limousines") or [])]

    # Fixed-price limousines first, then taxis, both sorted ascending by price
    vehicles = sorted(limos, key=lambda x: x["price"]) + sorted(taxis, key=lambda x: x["price"])

    return {
        "vehicles":             vehicles,
        "booking_classes":      data.get("available_booking_classes") or [],
        "end_time":             data.get("end_time"),
        "start_time":           data.get("start_time"),
        "availability_errors":  data.get("availability_errors") or [],
    }


# ── Create Booking ─────────────────────────────────────────────────────────────

async def create_booking(
    pickup:                  str,
    dropoff:                 str,
    date:                    str,       # YYYY-MM-DD
    time:                    str,       # HH:MM
    vehicle_id:              str,       # Talixo vehicle ID from search response
    first_name:              str,
    last_name:               str,
    email:                   str,
    mobile:                  str,       # E.164 format, e.g. +447911123456
    passengers:              int = 1,
    luggage:                 int = 1,
    flight_number:           Optional[str] = None,
    greeting_sign:           Optional[str] = None,
    special_wishes:          Optional[str] = None,
    external_booking_number: Optional[str] = None,
) -> dict:
    """
    POST /bookings/
    payment_method="default" → Invoice billed to Planet Transfers by Talixo.
    Returns the full Talixo booking object (reference_code, status, driver, etc.).
    Raises ValueError on API error.

    BLOCKED until TALIXO_API_BOOKING=true (requires Talixo credit approval).
    """
    payload: dict = {
        "start_point":      pickup,
        "end_point":        dropoff,
        "start_time_date":  date,
        "start_time_time":  time,
        "vehicle":          vehicle_id,
        "payment_method":   "default",
        "passengers":       passengers,
        "luggage":          luggage,
        "sport_luggage":    0,
        "animals":          0,
        "first_name":       first_name,
        "last_name":        last_name,
        "email":            email,
        "mobile":           mobile,
    }

    if flight_number:
        payload["unverified_flight_number"] = flight_number
    if greeting_sign:
        payload["talixo_shield_text"] = greeting_sign
    if special_wishes:
        payload["special_wishes"] = special_wishes
    if external_booking_number:
        payload["external_booking_number"] = external_booking_number

    logger.info(f"[Talixo] create_booking: vehicle={vehicle_id} "
                f"route='{pickup}'→'{dropoff}' on {date} {time} "
                f"passenger='{first_name} {last_name}' ext_ref={external_booking_number}")

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            f"{TALIXO_BASE_URL}/bookings/",
            headers=_headers(),
            data=payload,
        )

    data = resp.json()
    logger.info(f"[Talixo] create_booking HTTP={resp.status_code} body={str(data)[:400]}")

    if resp.status_code not in (200, 201):
        errors = data.get("errors") or [str(data)[:200]]
        raise ValueError(f"Talixo booking creation failed (HTTP {resp.status_code}): {errors}")

    return data


# ── Get Booking ────────────────────────────────────────────────────────────────

async def get_booking(reference_code: str) -> dict:
    """
    GET /bookings/{reference_code}/
    Retrieves full booking details including driver info (available ~24h before pickup).
    Use for status polling (no webhook support in v1.14).
    """
    logger.info(f"[Talixo] get_booking: {reference_code}")

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(
            f"{TALIXO_BASE_URL}/bookings/{reference_code}/",
            headers=_headers(),
        )

    data = resp.json()
    logger.info(f"[Talixo] get_booking HTTP={resp.status_code}")

    if resp.status_code != 200:
        raise ValueError(f"Could not retrieve Talixo booking '{reference_code}' "
                         f"(HTTP {resp.status_code}): {data}")
    return data


# ── Cancel Booking ─────────────────────────────────────────────────────────────

async def cancel_booking(reference_code: str) -> bool:
    """
    DELETE /bookings/{reference_code}/
    Returns True on 204 (success).
    Policy: free cancellation if >3h before pickup; full charge applies after that.
    Raises ValueError on failure.
    """
    logger.info(f"[Talixo] cancel_booking: {reference_code}")

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.delete(
            f"{TALIXO_BASE_URL}/bookings/{reference_code}/",
            headers=_headers(),
        )

    logger.info(f"[Talixo] cancel_booking HTTP={resp.status_code}")

    if resp.status_code == 204:
        return True

    data = resp.json()
    errors = data.get("errors") or [str(data)[:200]]
    raise ValueError(f"Talixo cancellation failed (HTTP {resp.status_code}): {errors}")


# ── Modify Booking (Partial PATCH) ─────────────────────────────────────────────

async def modify_booking(reference_code: str, updates: dict) -> dict:
    """
    PATCH /bookings/{reference_code}/
    Applies partial field updates.
    Note: which fields are patchable depends on Talixo account configuration.
    Raises ValueError on failure.
    """
    logger.info(f"[Talixo] modify_booking: {reference_code} fields={list(updates.keys())}")

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.patch(
            f"{TALIXO_BASE_URL}/bookings/{reference_code}/",
            headers=_headers(),
            data=updates,
        )

    data = resp.json()
    logger.info(f"[Talixo] modify_booking HTTP={resp.status_code}")

    if resp.status_code != 200:
        errors = data.get("errors") or [str(data)[:200]]
        raise ValueError(f"Talixo modification failed (HTTP {resp.status_code}): {errors}")

    return data


# ── Track Vehicle (Live GPS) ────────────────────────────────────────────────────

async def track_vehicle(reference_code: str, extended: bool = False) -> dict:
    """
    GET /next_api/rides/bookings:track_vehicle?reference_code={ref}

    Returns: { status, latitude, longitude, timestamp }
    Status values: initial | driving_to_pickup | at_pickup |
                   client_picked_up | driving_to_destination | at_destination
    GPS updates every ~10 seconds.
    extended=True: keep tracking up to 10 mins after ride end.

    Note: tracking base URL is different from booking base URL.
    """
    tracking_base = TALIXO_BASE_URL.replace("/en/mapi/v3", "")
    params: dict = {"reference_code": reference_code}
    if extended:
        params["extended_end_of_vehicle_tracking"] = "true"

    logger.info(f"[Talixo] track_vehicle: {reference_code}")

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(
            f"{tracking_base}/next_api/rides/bookings:track_vehicle",
            headers=_headers(),
            params=params,
        )

    data = resp.json()
    logger.info(f"[Talixo] track_vehicle HTTP={resp.status_code} status={data.get('status')}")

    if resp.status_code != 200:
        raise ValueError(f"Vehicle tracking failed (HTTP {resp.status_code}): {data}")

    return data
