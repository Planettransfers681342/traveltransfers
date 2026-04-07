import React, { useState } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import {
  CarSimple, ArrowLeft, ArrowRight, Users, Suitcase, Clock,
  ShieldCheck, CheckCircle, Warning, Airplane, PencilSimple,
  CalendarBlank, MapPin, IdentificationCard, Note
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function isAirportType(types = []) {
  return (types || []).some(t => t.toLowerCase().includes('airport'));
}

function formatDisplayDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

// ── Stepper ──────────────────────────────────────────────────────────
function Stepper({ value, onChange, min = 0, max = 20, label }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-[#d4af37] hover:text-[#d4af37] transition-colors text-lg leading-none"
      >−</button>
      <span className="w-6 text-center text-sm font-semibold text-slate-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-[#d4af37] hover:text-[#d4af37] transition-colors text-lg leading-none"
      >+</button>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

// ── Inline field ─────────────────────────────────────────────────────
function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Summary row ──────────────────────────────────────────────────────
function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold flex-shrink-0 w-28">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}

// ── Car image helper ──────────────────────────────────────────────────
const CAR_IMAGES = {
  standard: 'standard', comfort: 'comfort', business: 'business',
  'business light': 'business-lite', 'business lite': 'business-lite',
  luxury: 'luxury', minivan: 'minivan', 'minivan vip': 'minivan-vip',
  suv: 'suv', minibus: 'minibus',
};
function carImage(title = '') {
  const k = title.toLowerCase();
  const slug = CAR_IMAGES[k] || Object.entries(CAR_IMAGES).find(([key]) => k.includes(key) || key.includes(k))?.[1] || 'standard';
  return `https://iway.io/images/new-template/car-classes-slider/${slug}.webp`;
}

// ─────────────────────────────────────────────────────────────────────
export default function PassengerDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Restore from sessionStorage if navigation state was lost (page refresh)
  const state = location.state || (() => {
    try {
      const saved = sessionStorage.getItem('pt_booking_state');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  const { vehicle, fromPlace, toPlace, searchData } = state || {};
  const cc = vehicle?.car_class || {};
  const sym = vehicle?.currency === 'GBP' ? '£' : vehicle?.currency === 'EUR' ? '€' : '$';

  const fromIsAirport = isAirportType(fromPlace?.types) ||
    (fromPlace?.address || '').toLowerCase().includes('airport') ||
    (searchData?.pickup_location || '').toLowerCase().includes('airport');
  const toIsAirport   = isAirportType(toPlace?.types) ||
    (toPlace?.address || '').toLowerCase().includes('airport') ||
    (searchData?.dropoff_location || '').toLowerCase().includes('airport');
  // Always show flight fields — this is an airport transfer service
  const showFlightFields = true;
  const flightRequired   = fromIsAirport;

  // ── Form state ────────────────────────────────────────────────────
  // Transfer Details (editable)
  const [transfer, setTransfer] = useState({
    pickup_date:    searchData?.pickup_date    || '',
    pickup_time:    searchData?.pickup_time    || '',
    adults:         parseInt(searchData?.passengers || 1, 10),
    children:       0,
    flight_number:  '',
    terminal:       '',
    sign_name:      '',
  });

  // Passenger / contact fields
  const [contact, setContact] = useState({
    name:     '',
    email:    '',
    phone:    '',
    comment:  '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Guard — if state is completely missing (direct URL access), redirect home
  if (!vehicle || !fromPlace || !toPlace || !searchData) {
    return <Navigate to="/" replace />;
  }

  const handleTransfer = (field, value) =>
    setTransfer(t => ({ ...t, [field]: value }));

  const handleContact = (e) => {
    setContact(c => ({ ...c, [e.target.name]: e.target.value }));
    setError('');
  };

  const isValid = () =>
    contact.name.trim() &&
    contact.email.trim() &&
    contact.phone.trim() &&
    transfer.pickup_date &&
    transfer.pickup_time &&
    (transfer.adults + transfer.children) > 0 &&
    (!cc.capacity || (transfer.adults + transfer.children) <= cc.capacity) &&
    (!flightRequired || transfer.flight_number.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid()) return;
    setSubmitting(true);
    setError('');

    // Build comment with sign name appended
    const commentParts = [];
    if (contact.comment.trim()) commentParts.push(contact.comment.trim());
    if (transfer.sign_name.trim()) commentParts.push(`Greeting sign: ${transfer.sign_name.trim()}`);

    try {
      const { data } = await axios.post(`${API}/iway/book`, {
        price_id:          vehicle.price_id,
        from_place_id:     fromPlace.place_id,
        to_place_id:       toPlace.place_id,
        from_location:     fromPlace.location,
        to_location:       toPlace.location,
        from_address:      fromPlace.address,
        to_address:        toPlace.address,
        pickup_datetime:   `${transfer.pickup_date} ${transfer.pickup_time}`,
        currency:          vehicle.currency || 'GBP',
        passenger_name:    contact.name.trim(),
        passenger_email:   contact.email.trim(),
        passenger_phone:   contact.phone.trim(),
        flight_number:     transfer.flight_number.trim() || null,
        terminal_number:   transfer.terminal.trim() || null,
        adults_count:      transfer.adults,
        children_count:    transfer.children,
        comment:           commentParts.join(' | ') || '',
      });

      // Save booking summary to sessionStorage so success page can display it
      try {
        sessionStorage.setItem('pt_booking_summary', JSON.stringify({
          booker_number: data.booker_number || '',
          transaction:   data.transaction   || '',
          price:         data.price         || vehicle.price,
          currency:      data.currency      || vehicle.currency || 'GBP',
          pickup:        searchData.pickup_location,
          dropoff:       searchData.dropoff_location,
          date:          transfer.pickup_date,
          time:          transfer.pickup_time,
          passengers:    transfer.adults + transfer.children,
          flight_number: transfer.flight_number.trim() || null,
          vehicle_class: cc.title || 'Standard',
          passenger_name:  contact.name.trim(),
          passenger_email: contact.email.trim(),
        }));
        // Booking state no longer needed — clear it
        sessionStorage.removeItem('pt_booking_state');
      } catch {}

      window.location.href = data.payment_url;
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed. Please check your details and try again.');
      setSubmitting(false);
    }
  };

  const totalPax = transfer.adults + transfer.children;

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">

      {/* Nav */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-lg font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={16} />Back to Vehicles
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">

        <div className="mb-7">
          <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-slate-900 mb-1">Review & Book</h1>
          <p className="text-sm text-slate-500">Confirm your transfer details and complete passenger info to continue.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Trip Summary sidebar ──────────────────────────── */}
          <aside className="lg:col-span-2 space-y-4">

            {/* Trip Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Trip Summary</p>
              <SummaryRow label="Pickup"     value={searchData.pickup_location} />
              <SummaryRow label="Dropoff"    value={searchData.dropoff_location} />
              <SummaryRow label="Date"       value={formatDisplayDate(transfer.pickup_date)} />
              <SummaryRow label="Time"       value={transfer.pickup_time} />
              <SummaryRow label="Passengers" value={totalPax > 0 ? `${transfer.adults} adult${transfer.adults !== 1 ? 's' : ''}${transfer.children > 0 ? ` + ${transfer.children} child${transfer.children !== 1 ? 'ren' : ''}` : ''}` : '—'} />
              {searchData.luggage > 0 && <SummaryRow label="Luggage"    value={`${searchData.luggage} bag${searchData.luggage !== 1 ? 's' : ''}`} />}
              {searchData.trip_type === 'round-trip' && <SummaryRow label="Trip type"  value="Round trip" />}
              {transfer.flight_number && <SummaryRow label="Flight"    value={transfer.flight_number} />}
              {transfer.terminal      && <SummaryRow label="Terminal"  value={transfer.terminal} />}
              {transfer.sign_name     && <SummaryRow label="Sign name" value={transfer.sign_name} />}
            </div>

            {/* Vehicle */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Selected Vehicle</p>
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 rounded-lg p-2 flex-shrink-0">
                  <img src={carImage(cc.title)} alt={cc.title}
                    className="h-12 w-auto object-contain"
                    onError={e => { e.target.src = 'https://iway.io/images/new-template/car-classes-slider/standard.webp'; }} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{cc.title || 'Standard'}</p>
                  {cc.models?.[0] && <p className="text-xs text-slate-400">{cc.models[0]} or similar</p>}
                  <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500">
                    {cc.capacity && <span className="flex items-center gap-1"><Users size={11} />Up to {cc.capacity}</span>}
                    {cc.luggage_capacity && <span className="flex items-center gap-1"><Suitcase size={11} />{cc.luggage_capacity} bags</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-white border border-[#d4af37]/30 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Estimated Price</p>
              <p className="text-2xl font-bold text-slate-900">{sym}{vehicle.price}</p>
              <p className="text-xs text-slate-400">one way · final price at checkout</p>
            </div>

            {/* Trust */}
            <div className="space-y-2 px-1">
              {[
                { icon: ShieldCheck, color: 'text-green-500', label: 'Secure payment via Stripe' },
                { icon: CheckCircle, color: 'text-blue-400',  label: 'Instant confirmation' },
                { icon: Clock,       color: 'text-amber-400', label: 'Free waiting time included' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon size={13} className={color} />{label}
                </div>
              ))}
            </div>
          </aside>

          {/* ── RIGHT: Two-section form ──────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">

            {/* ── Section 1: Transfer Details ─────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
                <PencilSimple size={15} className="text-[#d4af37]" />
                <h2 className="text-sm font-semibold text-slate-900">Transfer Details</h2>
                <span className="text-xs text-slate-400 ml-1">— review and edit if needed</span>
              </div>

              <div className="p-6 space-y-5">

                {/* Date & Time row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Pickup Date" required>
                    <div className="relative">
                      <CalendarBlank size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={transfer.pickup_date}
                        onChange={e => handleTransfer('pickup_date', e.target.value)}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                        required
                        data-testid="transfer-date"
                      />
                    </div>
                  </FormField>
                  <FormField label="Pickup Time" required>
                    <div className="relative">
                      <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="time"
                        value={transfer.pickup_time}
                        onChange={e => handleTransfer('pickup_time', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                        required
                        data-testid="transfer-time"
                      />
                    </div>
                  </FormField>
                </div>

                {/* Passengers */}
                <FormField label="Passengers">
                  <div className="flex flex-col sm:flex-row gap-4 mt-1">
                    <Stepper value={transfer.adults}   onChange={v => handleTransfer('adults', v)}   min={1} label="Adults" />
                    <Stepper value={transfer.children} onChange={v => handleTransfer('children', v)} min={0} label="Children (under 12)" />
                  </div>
                  {cc.capacity && (transfer.adults + transfer.children) > cc.capacity && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1" data-testid="capacity-warning">
                      <Warning size={13} className="flex-shrink-0" />
                      This vehicle holds up to {cc.capacity} passengers. Please reduce the count or go back to choose a larger vehicle.
                    </p>
                  )}
                </FormField>

                {/* Airport-specific fields */}
                {showFlightFields && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Flight Number" required={flightRequired}
                        hint={flightRequired ? 'Required — driver monitors your flight' : 'Recommended for airport drop-off'}>
                        <div className="relative">
                          <Airplane size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={transfer.flight_number}
                            onChange={e => handleTransfer('flight_number', e.target.value.toUpperCase())}
                            placeholder="e.g. BA123"
                            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors uppercase"
                            required={flightRequired}
                            data-testid="transfer-flight"
                          />
                        </div>
                      </FormField>

                      <FormField label="Arrival Terminal"
                        hint="If known — helps driver meet you faster">
                        <div className="relative">
                          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={transfer.terminal}
                            onChange={e => handleTransfer('terminal', e.target.value)}
                            placeholder="e.g. T2, Terminal 5"
                            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                            data-testid="transfer-terminal"
                          />
                        </div>
                      </FormField>
                    </div>

                    <FormField label="Greeting Sign Name"
                      hint="Name to display on the driver's sign at the airport">
                      <div className="relative">
                        <IdentificationCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={transfer.sign_name}
                          onChange={e => handleTransfer('sign_name', e.target.value)}
                          placeholder="e.g. Wilson or ACME Corp"
                          className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                          data-testid="transfer-sign"
                        />
                      </div>
                    </FormField>
                  </>
                )}
              </div>
            </div>

            {/* ── Section 2: Your Details ──────────────────────────────── */}
            <form onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
                <IdentificationCard size={15} className="text-[#d4af37]" />
                <h2 className="text-sm font-semibold text-slate-900">Your Details</h2>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Full Name" required>
                    <input name="name" type="text" value={contact.name} onChange={handleContact}
                      placeholder="e.g. James Wilson"
                      className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                      required data-testid="passenger-name" />
                  </FormField>
                  <FormField label="Phone Number" required hint="Include country code, e.g. +447911123456">
                    <input name="phone" type="tel" value={contact.phone} onChange={handleContact}
                      placeholder="+447911123456"
                      className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                      required data-testid="passenger-phone" />
                  </FormField>
                </div>

                <FormField label="Email Address" required hint="Booking confirmation sent here">
                  <input name="email" type="email" value={contact.email} onChange={handleContact}
                    placeholder="e.g. james@example.com"
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                    required data-testid="passenger-email" />
                </FormField>

                <FormField label="Special Requests">
                  <div className="relative">
                    <Note size={15} className="absolute left-3 top-3 text-slate-400" />
                    <textarea name="comment" value={contact.comment} onChange={handleContact} rows={2}
                      placeholder="e.g. child seat required, extra luggage, specific route…"
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors resize-none"
                      data-testid="passenger-comment" />
                  </div>
                </FormField>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg" data-testid="booking-error">
                    <Warning size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isValid() || submitting}
                  className="btn-gold w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="confirm-pay-btn"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</>
                  ) : (
                    <>Confirm &amp; Pay {sym}{vehicle.price}<ArrowRight size={16} /></>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  By confirming, you agree to our{' '}
                  <Link to="/terms-conditions" className="underline hover:text-slate-600">Terms</Link> and{' '}
                  <Link to="/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</Link>.
                  You'll be redirected to our secure payment partner to complete payment.
                </p>
              </div>
            </form>

          </div>{/* end right col */}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Estimated price based on route and demand. Final price confirmed at checkout.
        </p>
      </main>

      <footer className="bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CarSimple size={20} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] font-semibold text-slate-900 text-sm">Planet Transfers</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <Link to="/terms-conditions" className="hover:text-slate-600">Terms</Link>
            <Link to="/privacy-policy" className="hover:text-slate-600">Privacy</Link>
            <span>© {new Date().getFullYear()} Planet Transfers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
