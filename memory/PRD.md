# Planet Transfers - Airport Transfer Booking Service

## Original Problem Statement
Rebuild Planet Transfers - a premium airport transfer booking service (planettransfers.online) with:
- Stripe payment integration (full payment upfront)
- Admin dashboard to manage bookings and set prices
- Keep the same professional design

## Architecture
- **Frontend**: React with TailwindCSS, Phosphor Icons
- **Backend**: FastAPI with MongoDB
- **Payment**: Stripe integration via emergentintegrations library
- **Auth**: Simple password-based admin authentication
- **iWay**: Direct API integration via ng-api.iwayex.com (user ID: 143708)

## User Personas
1. **Travelers**: Book airport transfers with vehicle selection and secure payment
2. **Admin**: Manage bookings, set route prices, view revenue stats, manage quote requests

## Core Features Implemented

### Phase 1 - Core Features (Feb 10, 2026)

#### Customer Facing
- [x] Premium homepage with booking widget
- [x] Trip type toggle (one-way/round-trip)
- [x] Location, date, time, passenger selection (clean inputs without icons)
- [x] Address autocomplete via OpenStreetMap Nominatim
- [x] Fleet showcase with custom vehicle images:
  - Economy: Silver Hyundai sedan
  - Business: Black Mercedes sedan
  - Group: Black Mercedes van
  - Bus: Black coach bus
- [x] Features section (Meet & Greet, Flight Tracking, etc.)
- [x] Testimonials and service areas display
- [x] 3-step booking flow (Vehicle → Passenger → Review & Pay)
- [x] Real-time price calculation
- [x] Stripe checkout integration
- [x] Payment success/cancel pages with status polling

#### Admin Dashboard - Bookings
- [x] Password-protected login (planet2024)
- [x] Stats cards (Total bookings, Pending, Confirmed, Completed, Revenue)
- [x] Bookings management with search & status updates
- [x] Booking detail page with full passenger/trip info
- [x] Separate Booking Status (pending, confirmed, completed, cancelled)
- [x] Separate Payment Status (pending, paid, refunded)
- [x] Status change timeline/history
- [x] Admin notes for bookings

#### Admin Dashboard - Route Prices
- [x] Route prices CRUD (add/edit/delete)
- [x] Pre-seeded routes for London, Madrid, Seychelles, Switzerland

#### Legal Pages
- [x] Terms & Conditions (/terms-conditions)
- [x] Privacy Policy (/privacy-policy)
- [x] Cookie Policy (/cookie-policy)
- [x] Footer with Legal section links

### Phase 1.5 - Quote Management (Feb 11, 2026)

#### Quote Request Form (/quote)
- [x] Multi-step quote request form (Trip Details → Your Details)
- [x] Address autocomplete for pickup/dropoff
- [x] Vehicle preference selection
- [x] Form submits to backend API (replaces WhatsApp link)
- [x] Success confirmation screen

#### Admin Dashboard - Quotes Tab
- [x] Dedicated "Quote Requests" tab in sidebar
- [x] Badge showing count of new quotes
- [x] Quotes table with customer, route, date, passengers, vehicle, status
- [x] Search/filter functionality
- [x] Status management (new, responded, converted, closed)
- [x] View details button → Quote detail page
- [x] Delete quote functionality

#### Quote Detail Page (/admin/quote/:id)
- [x] Full customer information display
- [x] Trip details with pickup/dropoff/dates
- [x] Trip requirements (passengers, luggage, vehicle preference)
- [x] Status dropdown for updates
- [x] Admin notes with save functionality
- [x] Quick actions (Send Email, Call Customer links)
- [x] Back to dashboard navigation

### Phase 2 - UI/UX Improvements (Feb 18, 2026)

#### Task 1: Airport IATA Search
- [x] Static JSON database with 500+ global airports
- [x] IATA code search prioritization (LHR, JFK, etc.)
- [x] Airport results display with blue IATA badge
- [x] Search by city, airport name, or aliases
- [x] Top 3 results contain correct airport for common inputs

#### Task 2: 24-Hour Advance Booking
- [x] Validation blocks bookings less than 24 hours in advance
- [x] Red warning message: "Pick-up must be at least 24 hours in advance."
- [x] Continue button disabled when validation fails
- [x] Works with user's timezone

#### Task 3: "Starts From" Pricing
- [x] Vehicle cards show "Starts from £XX.XX" instead of "Price £XX.XX"
- [x] Payment summary shows "Estimated Total" with "Starts from" label
- [x] Added note: "Final price may vary based on availability and route details."

#### Task 4: Economy → Standard Rename
- [x] Display label changed from "Economy" to "Standard Class"
- [x] Updated on homepage fleet section
- [x] Updated on booking page vehicle selection
- [x] Backend vehicle type ID unchanged (economy) for compatibility

#### Task 5: Icons Outside Inputs
- [x] Icons moved outside input fields with colored circular backgrounds
- [x] Green: Landing plane icon for pickup location
- [x] Red: Map pin icon for dropoff location
- [x] Amber: Calendar icon for pickup date
- [x] Blue: Clock icon for pickup time
- [x] Responsive layout maintained on mobile/desktop

#### Task 6: Phone Input with Country Code
- [x] Country dropdown with flag emoji, name, and dial code
- [x] Search by country name, ISO code, or calling code (+44, +359)
- [x] Auto-detect user country from timezone/locale
- [x] Default fallback to Bulgaria (+359)
- [x] Phone number stored with country code prefix

#### Task 7: Hero Background Upgrade
- [x] New AI-generated premium hero image
- [x] Features: London Heathrow airport, black Mercedes sedan, UK flag element
- [x] Cinematic dusk lighting with golden hour tones
- [x] Space for headline text on left side
- [x] High resolution, professional commercial style

### Phase 3 - SEO & Visibility Setup (Mar 3, 2026)

#### Task 1-12: Full SEO Implementation
- [x] Homepage meta tags, Open Graph, Twitter Cards
- [x] Static sitemap.xml
- [x] robots.txt
- [x] Google Search Console verification meta tag
- [x] Destination SEO pages (/airport-transfer/:city)
- [x] Route SEO pages (/transfer/:route)
- [x] Trust section
- [x] Image SEO (alt tags, lazy loading)
- [x] Structured Data (TransportService schema)
- [x] SEO-friendly URL structure
- [x] seoData.js for scalable page generation

### Phase 4 - Production-Ready Upgrades (Mar 18, 2026)

#### JSX Blocker Fix
- [x] Fixed adjacent JSX elements error in HomePage.js (orphaned fragment removed)

#### iWay Direct API Integration (CRITICAL)
- [x] Discovered iWay API at ng-api.iwayex.com
- [x] Backend proxy endpoint: GET /api/iway/search
  - Geocodes pickup/dropoff via /v1/places/find
  - Resolves geometry via /v1/places/{place_id}
  - Fetches live prices via /v1/prices (returns 6 vehicle classes)
- [x] Frontend results page: /results (IWayResultsPage.js)
  - Route summary bar
  - Vehicle cards: Standard, Business, First, Minivan, Minivan VIP, Minibus
  - Live prices, capacity, services (Meeting sign, free waiting, etc.)
  - Travel time and distance per route
  - "Book Now" per vehicle → redirects to /book with place_ids
- [x] Homepage form now submits to /results (instead of /booking)
- [x] BookNowPage updated to accept from_place_id/to_place_id/car_class_id URL params
  - iWay iframe pre-filled with search data
- [x] Button text updated: "Search Available Vehicles"

#### Booking Flow & Branding Polish (Mar 18, 2026)
- [x] Progress steps (Search → Select Vehicle → Complete Booking) on Results (step 2) and BookNow (step 3)
- [x] Dark trust strip on Results + BookNow: "Secure booking • Instant confirmation • Trusted transfer partner • 24/7 support"
- [x] Homepage widget: 3-step mini flow hint — "1. Search → 2. Choose Vehicle → 3. Book Securely"
- [x] BookNowPage smart back button: "Back to Vehicles" when arriving from results
- [x] Pricing clarity: "STARTS FROM £X / one way *" on all vehicle cards
- [x] Disclaimer box on Results + BookNow: "Estimated price based on route and demand. Final price confirmed after booking."
- [x] Consistent sticky nav (glassmorphism), footer (logo + links + copyright) on Results + BookNow

#### Results Page Visual Rebrand (Mar 18, 2026)
- [x] Replaced dark trust strip with clean minimal layout matching PT homepage aesthetic
- [x] Removed progress steps and iframe-based BookNow page
- [x] Results page: Playfair Display "Available Transfers" heading, clean white vehicle cards
- [x] Only relevant services shown (meet & greet, waiting time, free cancellation)
- [x] BookNow page: "Secure Checkout" handoff card (no iframe, no promotional content)
- [x] "Book Now" opens iWay booking URL in new tab — removes all supplier promo content

#### Native Booking Flow via iWay API (Mar 18, 2026)
- [x] Backend POST /api/iway/book: creates order on iWay API, returns Stripe payment URL
  - Phone normalisation (strips +/spaces), time format YYYY-MM-DD HH:mm
  - Flight number required for airport pickups, optional otherwise
- [x] Frontend /passenger-details page (PassengerDetailsPage.js):
  - Left: route summary, selected vehicle card, price, trust signals
  - Right: form — name, email, phone, flight number (auto-shown for airports), special requests
  - "Confirm & Pay £X" submits to /api/iway/book → redirects to Stripe payment page
- [x] Results "Book Now" navigates natively to /passenger-details (no iframe, no new tab)
- [x] /api/iway/search updated to include geometry (location lat,lng) and types in place data

#### Passenger Details — Transfer Details section (Mar 18, 2026)
- [x] "Review & Book" page restructured to two sections: Transfer Details + Your Details
- [x] Transfer Details (editable): Pickup Date & Time (pre-filled, editable), Adults stepper, Children stepper
- [x] Airport-specific fields (auto-shown): Flight Number (required for airport pickup), Arrival Terminal, Greeting Sign Name
- [x] Trip Summary sidebar: live-updating summary of all transfer data (pickup, dropoff, date, time, pax, flight, terminal, sign)
- [x] Backend /api/iway/book updated: terminal_number, adults_count, children_count (mapped to adults_amount/children_amount in iWay)
- [x] Sign name appended to comment field for iWay

#### P0 Data Persistence Bug Fix — Full Booking Flow (Mar 18, 2026)
- [x] **Root cause 1 fixed**: `showFlightFields` was conditional on iWay API returning `types=['airport']` which was unreliable. Now always `true` — flight/terminal/greeting sign fields always visible.
- [x] **Root cause 2 fixed**: sessionStorage backup added in `IWayResultsPage.handleBook` → `PassengerDetailsPage` restores state from sessionStorage on mount, surviving page refresh.
- [x] **Root cause 3 fixed**: Guard replaced `navigate()` during render with `<Navigate to="/" replace />` (correct React Router v6 pattern).
- [x] **Enhanced airport detection**: `fromIsAirport` now triple-checks: iWay types + address string + pickup_location string — all containing "airport".
- [x] **Capacity validation**: `IWayResultsPage` shows disabled button + warning when `passengers > vehicle.capacity`. `PassengerDetailsPage` shows inline warning and blocks form submit.
- [x] **Trip Summary enriched**: Luggage count and round-trip indicator added to sidebar summary.
- [x] **Backend uses FINAL edited values**: All form fields in Transfer Details are editable; booking payload uses the final state values.

### Contact Information
- Email: GBRoyaltransfers@gmail.com

## API Endpoints

### Public
- `GET /health` - Kubernetes health check
- `GET /api/vehicles` - List vehicle types
- `GET /api/quote` - Get price quote for route

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List all bookings
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}/status` - Update booking status
- `PUT /api/bookings/{id}/payment-status` - Update payment status
- `PUT /api/bookings/{id}/notes` - Update admin notes

### Route Prices
- `GET /api/routes/prices` - Get all route prices
- `POST /api/routes/prices` - Create route price
- `PUT /api/routes/prices/{id}` - Update route price
- `DELETE /api/routes/prices/{id}` - Delete route price

### Quotes
- `POST /api/quotes` - Create quote request
- `GET /api/quotes` - List all quotes (admin)
- `GET /api/quotes/{id}` - Get quote details
- `PUT /api/quotes/{id}/status` - Update quote status & notes
- `DELETE /api/quotes/{id}` - Delete quote

### Payments
- `POST /api/checkout/create` - Create Stripe checkout session
- `GET /api/checkout/status/{session_id}` - Check payment status
- `POST /api/webhook/stripe` - Stripe webhook handler

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard statistics
- `POST /api/seed` - Seed initial route prices

### iWay Proxy
- `GET /api/iway/search?pickup=&dropoff=&currency=GBP` - Live transfer search

## Technical Notes
- Admin password: `planet2024`
- Stripe uses Emergent test key
- Default routes seeded via `/api/seed`
- GBP currency for all transactions
- iWay user ID: 143708
- iWay API base: https://ng-api.iwayex.com

## Backlog / Future Features (P1/P2)

### P1 - High Priority
- [ ] Fix WhatsApp number (user to provide correct number - currently +44 773 947 6432)
- [ ] Booking Flow Improvements: Add reassurance messages ("Secure booking", "Instant confirmation")
- [ ] Vehicle & Class Management UI
- [ ] Email notifications (booking confirmation, quote response)
- [ ] Pricing Clarity: Ensure "Starts from £X" format consistent site-wide

### P2 - Medium Priority
- [ ] Branding consistency across all pages
- [ ] Remove unused SEOHead.js component and HelmetProvider from App.js
- [ ] User Roles & Security (Admin vs Operator)
- [ ] Driver management system
- [ ] Multi-currency support
- [ ] Customer accounts/login
- [ ] Booking modification/cancellation
- [ ] Promo codes/discounts
- [ ] Analytics dashboard
- [ ] SMS notifications via Twilio
