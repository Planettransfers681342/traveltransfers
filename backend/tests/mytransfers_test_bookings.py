"""
MyTransfers White Label API — Test Bookings Script
===================================================
Runs the 2 test bookings exactly as requested by the MyTransfers account manager.
Reads API key from environment variable ONLY. Never hardcodes credentials.

Usage:
  cd /app/backend
  python tests/mytransfers_test_bookings.py

Logs full request + response for each step.
"""

import os
import sys
import json
import asyncio
import httpx
from datetime import datetime

# ── Load .env manually (no dotenv dependency required) ───────────────────────
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

API_KEY  = os.environ.get("MYTRANSFERS_API_KEY", "")
BASE_URL = os.environ.get(
    "MYTRANSFERS_BASE_URL",
    "http://mytransfersapitest-env.jqpvqnc6ft.eu-west-1.elasticbeanstalk.com:5382"
).rstrip("/")

if not API_KEY:
    print("ERROR: MYTRANSFERS_API_KEY is not set in environment.")
    sys.exit(1)

NOMINATIM_HEADERS = {"User-Agent": "PlanetTransfers/1.0 (bookings@planettransfers.online)"}
TIMEOUT = 30.0

# ── Test customer details ─────────────────────────────────────────────────────
CUSTOMER = {
    "firstName": "Planet",
    "lastName":  "Transfers",
    "email":     "test@planettransfers.online",
    "phone":     "+44773947643",
    "country":   "GB",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def hr(title=""):
    print("\n" + "="*70)
    if title:
        print(f"  {title}")
        print("="*70)

def log_request(method, url, params=None):
    print(f"\n>>> REQUEST: {method} {url}")
    if params:
        print("    PARAMS:", json.dumps(params, indent=6, default=str))

def log_response(resp):
    print(f"<<< RESPONSE HTTP {resp.status_code}")
    try:
        data = resp.json()
        print(json.dumps(data, indent=4, default=str))
        return data
    except Exception:
        print(resp.text[:500])
        return {}


async def geocode(address: str, hardcoded: tuple = None) -> tuple:
    """
    Geocode via Nominatim; return (lat, lng).
    Falls back to hardcoded coords if provided and Nominatim returns empty.
    """
    if hardcoded:
        print(f"    => Using hardcoded coords for '{address}': lat={hardcoded[0]}, lng={hardcoded[1]}")
        return hardcoded

    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": address, "format": "json", "limit": 1}
    log_request("GET", url, params)
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params, headers=NOMINATIM_HEADERS)
    data = resp.json()
    if not data:
        raise ValueError(f"Geocoding failed for: {address}")
    lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
    print(f"    => Geocoded '{address}' → lat={lat}, lng={lng}")
    return lat, lng


async def search_availability(origin_lat, origin_lng, dest_lat, dest_lng,
                               pickup_date: str, adults: int = 1) -> dict:
    """
    GET /{key}/availabilities
    Returns the full availability response including sessionId and transferPriceList.
    """
    url = f"{BASE_URL}/{API_KEY}/availabilities"
    params = {
        "originLat":      origin_lat,
        "originLng":      origin_lng,
        "destinationLat": dest_lat,
        "destinationLng": dest_lng,
        "adults":         adults,
        "pickupDate":     pickup_date,
        "lang":           "EN",
    }
    # Mask key in log
    log_url = f"{BASE_URL}/<KEY>/availabilities"
    log_request("GET", log_url, params)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(url, params=params)
    return log_response(resp)


async def get_extras() -> list:
    """GET /{key}/extras — returns all available extras with their IDs."""
    url = f"{BASE_URL}/{API_KEY}/extras"
    log_request("GET", f"{BASE_URL}/<KEY>/extras")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(url)
    return log_response(resp)


async def get_transports() -> list:
    """GET /{key}/transports — returns all transport types."""
    url = f"{BASE_URL}/{API_KEY}/transports"
    log_request("GET", f"{BASE_URL}/<KEY>/transports")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(url)
    return log_response(resp)


async def create_booking(params: dict) -> dict:
    """POST /{key}/bookings — creates the booking."""
    url = f"{BASE_URL}/{API_KEY}/bookings"
    log_params = dict(params)
    log_request("POST", f"{BASE_URL}/<KEY>/bookings", log_params)
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(url, params=params)
    return log_response(resp)


def find_transport(transfer_price_list: list, keyword: str) -> dict | None:
    """Find a vehicle in the availability list by transport name keyword (case-insensitive)."""
    kw = keyword.lower()
    for v in transfer_price_list:
        name = (v.get("transportName") or "").lower()
        if kw in name:
            return v
    return None


def find_extra(extras_list: list, keyword: str) -> dict | None:
    """Find an extra by name keyword."""
    kw = keyword.lower()
    for e in extras_list:
        for field in ("nameEN", "name", "nameES", "nameFR"):
            val = (e.get(field) or "").lower()
            if kw in val:
                return e
    return None


# ── MAIN ──────────────────────────────────────────────────────────────────────

async def main():
    results = {}  # summary to print at the end

    # ── 0. Ping ────────────────────────────────────────────────────────────────
    hr("STEP 0 — PING API")
    async with httpx.AsyncClient(timeout=10.0) as client:
        ping = await client.get(f"{BASE_URL}/ping")
    print(f"Ping → HTTP {ping.status_code}: {ping.text.strip()}")

    # ── 0b. Get available transports (for reference) ──────────────────────────
    hr("STEP 0b — GET TRANSPORTS (reference)")
    transports = await get_transports()

    # ── 0c. Get extras (needed for Booking 2 booster seat) ────────────────────
    hr("STEP 0c — GET EXTRAS")
    extras_list = await get_extras()

    # Use the standard named "Booster seat" (id: 58) — not the free variant
    booster_extra = next((e for e in extras_list if e.get("id") == 58), None)
    if not booster_extra:
        # Fallback: search by name
        booster_extra = find_extra(extras_list, "booster")
    if booster_extra:
        print(f"\n  => Booster seat extra to use: id={booster_extra['id']}  name='{booster_extra.get('nameEN') or booster_extra.get('name')}'")
    else:
        print("\n  => WARNING: 'Booster seat' extra NOT found in extras list.")
        print("     Available extras:", [(e.get("id"), e.get("nameEN") or e.get("name")) for e in extras_list])

    # ═══════════════════════════════════════════════════════════════════════════
    # BOOKING 1
    # From: PMI Airport  →  To: Alcúdia
    # Transport: Private Sedan (1-4)
    # Pickup: 2026-07-12 13:00
    # Flight arrival: 2026-07-12 10:00  |  AA 1111
    # ═══════════════════════════════════════════════════════════════════════════
    hr("BOOKING 1 — PMI Airport → Alcúdia")

    # Geocode — use hardcoded known coords for PMI Airport and Alcúdia (Mallorca)
    # PMI (Aeropuerto de Son Sant Joan): 39.5517°N, 2.7388°E
    # Alcúdia (town centre):            39.8528°N, 3.1229°E
    hr("BOOKING 1 / STEP 1 — Geocode addresses")
    pmi_lat, pmi_lng = await geocode("PMI Airport", hardcoded=(39.5517, 2.7388))
    alc_lat, alc_lng = await geocode("Alcúdia, Mallorca", hardcoded=(39.8528, 3.1229))

    # Availability search
    hr("BOOKING 1 / STEP 2 — Availability search (pickup 2026-07-12 13:00)")
    avail1 = await search_availability(
        origin_lat  = pmi_lat,
        origin_lng  = pmi_lng,
        dest_lat    = alc_lat,
        dest_lng    = alc_lng,
        pickup_date = "2026-07-12 13:00",
        adults      = 1,
    )

    session_id_1       = avail1.get("sessionId", "")
    transfer_list_1    = avail1.get("transferPriceList") or []
    origin_type_1      = avail1.get("pickupType") or "airport"
    destination_type_1 = avail1.get("dropoffType") or "airport"

    print(f"\n  sessionId      : {session_id_1}")
    print(f"  pickupType     : {origin_type_1}")
    print(f"  dropoffType    : {destination_type_1}")
    print(f"  vehicles found : {len(transfer_list_1)}")
    for v in transfer_list_1:
        print(f"    transportId={v.get('transportId'):>5}  name='{v.get('transportName')}'  "
              f"price={v.get('price')}  pax={v.get('minPassengers')}-{v.get('maxPassengers')}")

    # Select Private Sedan (1-4)
    hr("BOOKING 1 / STEP 3 — Select 'Private Sedan'")
    sedan = find_transport(transfer_list_1, "sedan")
    if not sedan:
        # Fallback: first vehicle with maxPassengers <= 4
        sedan = next((v for v in transfer_list_1 if (v.get("maxPassengers") or 99) <= 4), None)
    if not sedan and transfer_list_1:
        sedan = transfer_list_1[0]

    if sedan:
        # IMPORTANT: use 'transferId' (session token), NOT 'transportId' (catalog ID)
        print(f"  => Selected: transferId='{sedan['transferId']}'  transportId={sedan['transportId']}  "
              f"name='{sedan['transportName']}'  price={sedan['price']}")
    else:
        print("  => ERROR: No suitable sedan found. Available vehicles above.")
        results["booking1"] = {"status": "FAILED", "reason": "No sedan vehicle found in availability results"}
        sedan = None

    # Create Booking 1
    if sedan and session_id_1:
        hr("BOOKING 1 / STEP 4 — Create booking")
        booking1_params = {
            "sessionId":         session_id_1,
            "transferId":        sedan["transferId"],   # session-scoped token, NOT transportId
            "customerFirstName": CUSTOMER["firstName"],
            "customerLastName":  CUSTOMER["lastName"],
            "customerEmail":     CUSTOMER["email"],
            "customerPhone":     CUSTOMER["phone"],
            "customerCountry":   CUSTOMER["country"],
            "originType":        origin_type_1,
            "destinationType":   destination_type_1,
            "originAddress":     "PMI Airport, Palma de Mallorca",
            "destinationAddress":"Alcúdia, Mallorca",
            # Arrival flight details
            "arrivalLine":       "AA",
            "arrivalLocator":    "1111",
            "arrivalPickUpTime": "2026-07-12 10:00",
            "finalPickupDate":   "2026-07-12 13:00",
            "pickupExternalReference": "PT-TEST-BOOKING-1",
            "lang":              "EN",
        }
        booking1_resp = await create_booking(booking1_params)
        order_id_1 = booking1_resp.get("orderId")
        status_1   = booking1_resp.get("status")

        results["booking1"] = {
            "status":    "SUCCESS" if order_id_1 else "FAILED",
            "orderId":   order_id_1,
            "apiStatus": status_1,
            "price":     booking1_resp.get("totalPrice"),
            "vehicle":   sedan.get("transportName"),
            "request":   booking1_params,
            "response":  booking1_resp,
        }
    elif not session_id_1:
        print("  => ERROR: No sessionId returned from availability search.")
        results["booking1"] = {"status": "FAILED", "reason": "No sessionId in availability response"}
    else:
        results["booking1"] = {"status": "FAILED", "reason": "No sedan vehicle selected"}

    # ═══════════════════════════════════════════════════════════════════════════
    # BOOKING 2
    # From: Alcúdia  →  To: PMI Airport
    # Transport: Private Minivan (1-8)
    # Pickup: 2026-07-14 12:00
    # Flight departure: 2026-07-14 14:00  |  BB 2222
    # Extras: 1x Booster seat
    # ═══════════════════════════════════════════════════════════════════════════
    hr("BOOKING 2 — Alcúdia → PMI Airport")

    # Geocode (reuse pmi/alc coords, just swap)
    hr("BOOKING 2 / STEP 1 — Geocode addresses (reversed)")
    print(f"  Origin:      Alcúdia  → lat={alc_lat}, lng={alc_lng}  (hardcoded)")
    print(f"  Destination: PMI Airport → lat={pmi_lat}, lng={pmi_lng}  (hardcoded)")

    # Availability search
    hr("BOOKING 2 / STEP 2 — Availability search (pickup 2026-07-14 12:00)")
    avail2 = await search_availability(
        origin_lat  = alc_lat,
        origin_lng  = alc_lng,
        dest_lat    = pmi_lat,
        dest_lng    = pmi_lng,
        pickup_date = "2026-07-14 12:00",
        adults      = 1,
    )

    session_id_2       = avail2.get("sessionId", "")
    transfer_list_2    = avail2.get("transferPriceList") or []
    origin_type_2      = avail2.get("pickupType") or "airport"
    destination_type_2 = avail2.get("dropoffType") or "airport"

    print(f"\n  sessionId      : {session_id_2}")
    print(f"  pickupType     : {origin_type_2}")
    print(f"  dropoffType    : {destination_type_2}")
    print(f"  vehicles found : {len(transfer_list_2)}")
    for v in transfer_list_2:
        print(f"    transportId={v.get('transportId'):>5}  name='{v.get('transportName')}'  "
              f"price={v.get('price')}  pax={v.get('minPassengers')}-{v.get('maxPassengers')}")

    # Select Private Minivan (1-8)
    hr("BOOKING 2 / STEP 3 — Select 'Private Minivan'")
    minivan = find_transport(transfer_list_2, "minivan")
    if not minivan:
        # Fallback: vehicle with maxPassengers >= 7
        minivan = next((v for v in transfer_list_2 if (v.get("maxPassengers") or 0) >= 7), None)
    if not minivan and transfer_list_2:
        print("  WARNING: No exact minivan match — picking vehicle with highest capacity")
        minivan = max(transfer_list_2, key=lambda v: v.get("maxPassengers") or 0)

    if minivan:
        print(f"  => Selected: transferId='{minivan['transferId']}'  transportId={minivan['transportId']}  "
              f"name='{minivan['transportName']}'  price={minivan['price']}")
    else:
        print("  => ERROR: No suitable minivan found.")
        results["booking2"] = {"status": "FAILED", "reason": "No minivan vehicle found"}
        minivan = None

    # Build extras JSON for booster seat
    extras_json = None
    if booster_extra:
        extras_json = json.dumps([{"extraId": booster_extra["id"], "amount": 1}])
        print(f"\n  => Booster seat extraId={booster_extra['id']}  extras_json={extras_json}")
    else:
        print("\n  => WARNING: Booster seat extra not found — booking will proceed without it")

    # Create Booking 2
    if minivan and session_id_2:
        hr("BOOKING 2 / STEP 4 — Create booking")
        booking2_params = {
            "sessionId":         session_id_2,
            "transferId":        minivan["transferId"],   # session-scoped token, NOT transportId
            "customerFirstName": CUSTOMER["firstName"],
            "customerLastName":  CUSTOMER["lastName"],
            "customerEmail":     CUSTOMER["email"],
            "customerPhone":     CUSTOMER["phone"],
            "customerCountry":   CUSTOMER["country"],
            "originType":        origin_type_2,
            "destinationType":   destination_type_2,
            "originAddress":     "Alcúdia, Mallorca",
            "destinationAddress":"PMI Airport, Palma de Mallorca",
            # Departure flight details
            "departureLine":        "BB",
            "departureLocator":     "2222",
            "departurePickUpTime":  "2026-07-14 14:00",
            "finalPickupDate":      "2026-07-14 12:00",
            "pickupExternalReference": "PT-TEST-BOOKING-2",
            "lang":                "EN",
        }
        if extras_json:
            booking2_params["extras"] = extras_json

        booking2_resp = await create_booking(booking2_params)
        order_id_2 = booking2_resp.get("orderId")
        status_2   = booking2_resp.get("status")

        results["booking2"] = {
            "status":    "SUCCESS" if order_id_2 else "FAILED",
            "orderId":   order_id_2,
            "apiStatus": status_2,
            "price":     booking2_resp.get("totalPrice"),
            "vehicle":   minivan.get("transportName"),
            "extras":    extras_json,
            "request":   booking2_params,
            "response":  booking2_resp,
        }
    elif not session_id_2:
        print("  => ERROR: No sessionId returned from availability search.")
        results["booking2"] = {"status": "FAILED", "reason": "No sessionId in availability response"}
    else:
        results["booking2"] = {"status": "FAILED", "reason": "No minivan vehicle selected"}

    # ═══════════════════════════════════════════════════════════════════════════
    # FINAL SUMMARY
    # ═══════════════════════════════════════════════════════════════════════════
    hr("FINAL SUMMARY — MyTransfers Test Bookings")

    for name, r in results.items():
        label = name.upper()
        print(f"\n  {label}:")
        print(f"    Status    : {r.get('status')}")
        if r.get("orderId"):
            print(f"    orderId   : {r.get('orderId')}")
        if r.get("apiStatus"):
            print(f"    apiStatus : {r.get('apiStatus')}")
        if r.get("vehicle"):
            print(f"    Vehicle   : {r.get('vehicle')}")
        if r.get("price"):
            p = r.get("price") or {}
            print(f"    Price     : {p.get('currency','')} {p.get('totalPrice','')} (transfer: {p.get('transfersPrice','')} + extras: {p.get('extrasPrice','')})")
        if r.get("extras"):
            print(f"    Extras    : {r.get('extras')}")
        if r.get("reason"):
            print(f"    Reason    : {r.get('reason')}")

    # Save to file for reference
    out_path = os.path.join(os.path.dirname(__file__), "mytransfers_test_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n  Full results saved to: {out_path}")
    hr()


if __name__ == "__main__":
    asyncio.run(main())
