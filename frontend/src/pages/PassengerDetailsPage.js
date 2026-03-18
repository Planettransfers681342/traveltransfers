import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CarSimple, ArrowLeft, ArrowRight, Users, Suitcase,
  Clock, ShieldCheck, CheckCircle, Warning, Airplane
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function isAirportType(types = []) {
  return types.some(t => t.toLowerCase().includes('airport'));
}

function Field({ label, required, children, hint }) {
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

export default function PassengerDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    flight_number: '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Guard: need vehicle + place data
  if (!state?.vehicle || !state?.fromPlace || !state?.toPlace || !state?.searchData) {
    navigate('/');
    return null;
  }

  const { vehicle, fromPlace, toPlace, searchData } = state;
  const cc = vehicle.car_class || {};
  const sym = vehicle.currency === 'GBP' ? '£' : vehicle.currency === 'EUR' ? '€' : '$';

  const fromIsAirport = isAirportType(fromPlace.types || []);
  const toIsAirport = isAirportType(toPlace.types || []);
  const showFlightNumber = fromIsAirport || toIsAirport;
  const flightRequired = fromIsAirport;  // only required for pickup at airport

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const pickupDatetime = `${searchData.pickup_date} ${searchData.pickup_time}`;

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const isValid = () =>
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    (!flightRequired || form.flight_number.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid()) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        price_id: vehicle.price_id,
        from_place_id: fromPlace.place_id,
        to_place_id: toPlace.place_id,
        from_location: fromPlace.location,
        to_location: toPlace.location,
        from_address: fromPlace.address,
        to_address: toPlace.address,
        pickup_datetime: pickupDatetime,
        currency: vehicle.currency || 'GBP',
        passenger_name: form.name.trim(),
        passenger_email: form.email.trim(),
        passenger_phone: form.phone.trim(),
        flight_number: form.flight_number.trim() || null,
        passengers_count: parseInt(searchData.passengers, 10) || 1,
        comment: form.comment.trim(),
      };
      const { data } = await axios.post(`${API}/iway/book`, payload);
      // Redirect to Stripe payment page
      window.location.href = data.payment_url;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Booking failed. Please check your details and try again.';
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">

      {/* Nav */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-lg font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />Back to Vehicles
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-7">
          <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-slate-900 mb-1">
            Passenger Details
          </h1>
          <p className="text-sm text-slate-500">Complete your details to confirm and pay securely.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Booking Summary ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Route */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Your Transfer</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Pickup</p>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{searchData.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-700 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Dropoff</p>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{searchData.dropoff_location}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users size={12} />{searchData.passengers} pax</span>
                <span>{formatDate(searchData.pickup_date)}</span>
                <span>{searchData.pickup_time}</span>
              </div>
            </div>

            {/* Vehicle */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Selected Vehicle</p>
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 rounded-lg p-2">
                  <img
                    src={`https://iway.io/images/new-template/car-classes-slider/${(cc.title || 'standard').toLowerCase().replace(' ', '-').replace(' vip','-vip').replace(' light','-lite')}.webp`}
                    alt={cc.title}
                    className="h-12 w-auto object-contain"
                    onError={(e) => { e.target.src = 'https://iway.io/images/new-template/car-classes-slider/standard.webp'; }}
                  />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{cc.title || 'Standard'}</p>
                  {cc.models?.[0] && <p className="text-xs text-slate-400">{cc.models[0]} or similar</p>}
                  {cc.capacity && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Users size={11} />Up to {cc.capacity} pax
                      {cc.luggage_capacity && <><Suitcase size={11} className="ml-1" />{cc.luggage_capacity} bags</>}
                    </p>
                  )}
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
            <div className="space-y-2">
              {[
                { icon: ShieldCheck, color: 'text-green-500', label: 'Secure payment via Stripe' },
                { icon: CheckCircle, color: 'text-blue-400', label: 'Instant confirmation' },
                { icon: Clock, color: 'text-amber-400', label: 'Free waiting time included' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon size={14} className={color} />{label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">

              <Field label="Full Name" required>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. James Wilson"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                  required
                  data-testid="passenger-name"
                />
              </Field>

              <Field label="Email Address" required hint="Your booking confirmation will be sent here">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. james@example.com"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                  required
                  data-testid="passenger-email"
                />
              </Field>

              <Field label="Phone Number" required hint="Include country code, e.g. +447911123456">
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+447911123456"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                  required
                  data-testid="passenger-phone"
                />
              </Field>

              {showFlightNumber && (
                <Field
                  label="Flight Number"
                  required={flightRequired}
                  hint={flightRequired ? "Required for airport pickup — helps the driver track your flight" : "Recommended for airport drop-off"}
                >
                  <div className="relative">
                    <Airplane size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      name="flight_number"
                      type="text"
                      value={form.flight_number}
                      onChange={handleChange}
                      placeholder="e.g. BA123"
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors"
                      required={flightRequired}
                      data-testid="passenger-flight"
                    />
                  </div>
                </Field>
              )}

              <Field label="Special Requests (optional)">
                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. child seat, extra stop, meet & greet sign name…"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-colors resize-none"
                  data-testid="passenger-comment"
                />
              </Field>

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
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    Confirm & Pay {sym}{vehicle.price}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                By confirming, you agree to our{' '}
                <Link to="/terms-conditions" className="underline hover:text-slate-600">Terms</Link> and{' '}
                <Link to="/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</Link>.
                You'll be redirected to our secure payment partner to complete payment.
              </p>
            </form>
          </div>
        </div>

        {/* Bottom disclaimer */}
        <p className="text-center text-xs text-slate-400 mt-6">
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
