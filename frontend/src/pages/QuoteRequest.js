import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CarSimple, ArrowLeft, ArrowRight, CheckCircle, Warning } from '@phosphor-icons/react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VEHICLES = ['Standard', 'Executive', 'Minivan', 'Minibus', 'No preference'];
const CHILD_SEAT_TYPES = ['Infant seat (0–12 months)', 'Child seat (1–4 years)', 'Booster seat (4–12 years)'];

const initForm = (from = '', to = '', vehicle = '') => ({
  trip_type: 'one-way',
  // outbound
  pickup_location: from,
  dropoff_location: to,
  pickup_date: '',
  pickup_time: '',
  flight_number: '',
  flight_arrival_time: '',
  passengers: 2,
  children: 0,
  child_seat_details: '',
  luggage: 2,
  vehicle_preference: vehicle || 'No preference',
  special_requests: '',
  // return (round-trip only)
  return_pickup_location: '',
  return_dropoff_location: '',
  return_date: '',
  return_pickup_time: '',
  return_flight_number: '',
  return_flight_departure_time: '',
  same_pax_luggage: true,
  return_passengers: 2,
  return_luggage: 2,
  return_notes: '',
  // personal
  passenger_name: '',
  passenger_email: '',
  passenger_phone: '',
});

export default function QuoteRequest() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initForm(params.get('from') || '', params.get('to') || '', params.get('vehicle') || ''));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quoteRef, setQuoteRef] = useState('');

  // When trip type switches to round-trip, auto-reverse locations
  useEffect(() => {
    if (form.trip_type === 'round-trip') {
      setForm(f => ({
        ...f,
        return_pickup_location: f.return_pickup_location || f.dropoff_location,
        return_dropoff_location: f.return_dropoff_location || f.pickup_location,
      }));
    }
  }, [form.trip_type]);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const upper = (key, val) => set(key, val.toUpperCase());

  // ── Validation ──────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.pickup_location.trim())   e.pickup_location  = 'Pickup location is required';
    if (!form.dropoff_location.trim())  e.dropoff_location = 'Drop-off location is required';
    if (!form.pickup_date)              e.pickup_date      = 'Pickup date is required';
    if (!form.pickup_time)              e.pickup_time      = 'Pickup time is required';
    if (form.passengers < 1)            e.passengers       = 'At least 1 passenger';

    if (form.trip_type === 'round-trip') {
      if (!form.return_date)             e.return_date        = 'Return date is required';
      if (!form.return_pickup_time)      e.return_pickup_time = 'Desired pickup time is required';
      if (!form.return_pickup_location.trim()) e.return_pickup_location = 'Return pickup location is required';
      if (!form.return_dropoff_location.trim()) e.return_dropoff_location = 'Return drop-off location is required';

      // Date+time comparison
      if (form.return_date && form.pickup_date && form.return_pickup_time && form.pickup_time) {
        const out = new Date(`${form.pickup_date}T${form.pickup_time}`);
        const ret = new Date(`${form.return_date}T${form.return_pickup_time}`);
        if (ret <= out) {
          e.return_pickup_time = 'Return pickup must be after the outbound pickup date and time';
        }
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.passenger_name.trim())    e.passenger_name  = 'Full name is required';
    if (!form.passenger_email.trim())   e.passenger_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.passenger_email)) e.passenger_email = 'Enter a valid email address';
    if (!form.passenger_phone.trim())   e.passenger_phone = 'Phone / WhatsApp is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (payload.children === 0) payload.child_seat_details = '';
      if (payload.same_pax_luggage) {
        payload.return_passengers = payload.passengers;
        payload.return_luggage    = payload.luggage;
      }
      if (payload.trip_type !== 'round-trip') {
        payload.return_pickup_location = '';
        payload.return_dropoff_location = '';
        payload.return_date = '';
        payload.return_pickup_time = '';
        payload.return_flight_number = '';
        payload.return_flight_departure_time = '';
        payload.return_notes = '';
      }
      const res = await axios.post(`${API}/quotes`, payload);
      const id = res.data?.id || '';
      setQuoteRef(`QT-${id.substring(0, 8).toUpperCase()}`);
    } catch (err) {
      console.error(err);
      setErrors({ form: 'Something went wrong. Please try again or contact us directly.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────
  if (quoteRef) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <CheckCircle size={56} weight="fill" className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Quote Request Received</h2>
          <p className="text-slate-500 mb-4">We'll review your details and get back to you within a few hours.</p>
          <div className="bg-slate-100 rounded-xl px-6 py-4 mb-6">
            <p className="text-xs text-slate-500 mb-1">Your reference number</p>
            <p className="text-2xl font-bold text-[#1a1a2e] tracking-widest">{quoteRef}</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-gold w-full py-3">Back to Home</button>
        </div>
      </div>
    );
  }

  const Err = ({ field }) => errors[field]
    ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><Warning size={12} weight="fill" />{errors[field]}</p>
    : null;

  const Label = ({ children, required }) => (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );

  const inputCls = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] transition ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`;

  // ── Step 1 ───────────────────────────────────────────────────
  const Step1 = () => (
    <div className="space-y-6">
      {/* Trip type */}
      <div>
        <Label>Trip Type <span className="text-red-400">*</span></Label>
        <div className="flex gap-3">
          {['one-way', 'round-trip'].map(t => (
            <button key={t} type="button"
              onClick={() => set('trip_type', t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.trip_type === t ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#1a1a2e]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              data-testid={`trip-type-${t}`}>
              {t === 'one-way' ? 'One-Way' : 'Round-Trip'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Outbound ── */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Outbound Journey</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Pickup Location</Label>
            <input value={form.pickup_location} onChange={e => set('pickup_location', e.target.value)}
              placeholder="e.g. London Heathrow Airport" className={inputCls('pickup_location')}
              data-testid="pickup-location" />
            <Err field="pickup_location" />
          </div>
          <div>
            <Label required>Drop-off Location</Label>
            <input value={form.dropoff_location} onChange={e => set('dropoff_location', e.target.value)}
              placeholder="e.g. Central London" className={inputCls('dropoff_location')}
              data-testid="dropoff-location" />
            <Err field="dropoff_location" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Pickup Date</Label>
            <input type="date" value={form.pickup_date} onChange={e => set('pickup_date', e.target.value)}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              className={inputCls('pickup_date')} data-testid="pickup-date" />
            <Err field="pickup_date" />
          </div>
          <div>
            <Label required>Desired Pickup Time</Label>
            <input type="time" value={form.pickup_time} onChange={e => set('pickup_time', e.target.value)}
              className={inputCls('pickup_time')} data-testid="pickup-time" />
            <Err field="pickup_time" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Arrival Flight No.</Label>
            <input value={form.flight_number} onChange={e => upper('flight_number', e.target.value)}
              placeholder="e.g. LH1234" className={inputCls('flight_number')}
              data-testid="flight-number" />
            <p className="text-xs text-slate-400 mt-1">If being picked up from an airport</p>
          </div>
          <div>
            <Label>Scheduled Arrival Time</Label>
            <input type="time" value={form.flight_arrival_time} onChange={e => set('flight_arrival_time', e.target.value)}
              className={inputCls('flight_arrival_time')} data-testid="flight-arrival-time" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label required>Adults</Label>
            <input type="number" min="1" max="20" value={form.passengers}
              onChange={e => set('passengers', parseInt(e.target.value) || 1)}
              className={inputCls('passengers')} data-testid="passengers" />
            <Err field="passengers" />
          </div>
          <div>
            <Label>Children</Label>
            <input type="number" min="0" max="10" value={form.children}
              onChange={e => set('children', parseInt(e.target.value) || 0)}
              className={inputCls('children')} data-testid="children" />
          </div>
          <div>
            <Label required>Luggage (bags)</Label>
            <input type="number" min="0" max="20" value={form.luggage}
              onChange={e => set('luggage', parseInt(e.target.value) || 0)}
              className={inputCls('luggage')} data-testid="luggage" />
          </div>
        </div>

        {form.children > 0 && (
          <div>
            <Label>Child Seat Requirements</Label>
            <div className="flex flex-col gap-2 mb-2">
              {CHILD_SEAT_TYPES.map(t => (
                <label key={t} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox"
                    checked={(form.child_seat_details || '').includes(t)}
                    onChange={e => {
                      const cur = form.child_seat_details ? form.child_seat_details.split('; ').filter(Boolean) : [];
                      const next = e.target.checked ? [...cur, t] : cur.filter(x => x !== t);
                      set('child_seat_details', next.join('; '));
                    }}
                    className="rounded border-slate-300 text-[#d4af37]" />
                  {t}
                </label>
              ))}
            </div>
            <textarea value={form.child_seat_details} onChange={e => set('child_seat_details', e.target.value)}
              rows={2} placeholder="Add ages and any additional seat details here…"
              className={`${inputCls('child_seat_details')} resize-none`} data-testid="child-seat-details" />
          </div>
        )}

        <div>
          <Label>Vehicle Preference</Label>
          <select value={form.vehicle_preference} onChange={e => set('vehicle_preference', e.target.value)}
            className={inputCls('vehicle_preference')} data-testid="vehicle-preference">
            {VEHICLES.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* ── Return Journey (round-trip only) ── */}
      {form.trip_type === 'round-trip' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Return Journey</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Return Pickup Location</Label>
              <input value={form.return_pickup_location} onChange={e => set('return_pickup_location', e.target.value)}
                placeholder="e.g. Hotel / City Centre" className={inputCls('return_pickup_location')}
                data-testid="return-pickup-location" />
              <Err field="return_pickup_location" />
            </div>
            <div>
              <Label required>Return Drop-off Location</Label>
              <input value={form.return_dropoff_location} onChange={e => set('return_dropoff_location', e.target.value)}
                placeholder="e.g. London Heathrow Airport" className={inputCls('return_dropoff_location')}
                data-testid="return-dropoff-location" />
              <Err field="return_dropoff_location" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Return Date</Label>
              <input type="date" value={form.return_date} onChange={e => set('return_date', e.target.value)}
                min={form.pickup_date || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                className={inputCls('return_date')} data-testid="return-date" />
              <Err field="return_date" />
            </div>
            <div>
              <Label required>Desired Pickup Time</Label>
              <input type="time" value={form.return_pickup_time} onChange={e => set('return_pickup_time', e.target.value)}
                className={inputCls('return_pickup_time')} data-testid="return-pickup-time" />
              <Err field="return_pickup_time" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Departure Flight No.</Label>
              <input value={form.return_flight_number} onChange={e => upper('return_flight_number', e.target.value)}
                placeholder="e.g. BA456" className={inputCls('return_flight_number')}
                data-testid="return-flight-number" />
              <p className="text-xs text-slate-400 mt-1">If travelling to an airport</p>
            </div>
            <div>
              <Label>Scheduled Departure Time</Label>
              <input type="time" value={form.return_flight_departure_time} onChange={e => set('return_flight_departure_time', e.target.value)}
                className={inputCls('return_flight_departure_time')} data-testid="return-flight-departure-time" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer" data-testid="same-pax-toggle">
              <input type="checkbox" checked={form.same_pax_luggage}
                onChange={e => set('same_pax_luggage', e.target.checked)}
                className="rounded border-slate-300 text-[#d4af37]" />
              Same passengers and luggage as outbound
            </label>
          </div>

          {!form.same_pax_luggage && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Return Passengers</Label>
                <input type="number" min="1" max="20" value={form.return_passengers}
                  onChange={e => set('return_passengers', parseInt(e.target.value) || 1)}
                  className={inputCls('return_passengers')} data-testid="return-passengers" />
              </div>
              <div>
                <Label required>Return Luggage (bags)</Label>
                <input type="number" min="0" max="20" value={form.return_luggage}
                  onChange={e => set('return_luggage', parseInt(e.target.value) || 0)}
                  className={inputCls('return_luggage')} data-testid="return-luggage" />
              </div>
            </div>
          )}

          <div>
            <Label>Additional Return Notes</Label>
            <textarea value={form.return_notes} onChange={e => set('return_notes', e.target.value)}
              rows={2} placeholder="Any extra details for the return journey…"
              className={`${inputCls('return_notes')} resize-none`} data-testid="return-notes" />
          </div>
        </div>
      )}

      <div>
        <Label>Special Requests</Label>
        <textarea value={form.special_requests} onChange={e => set('special_requests', e.target.value)}
          rows={3} placeholder="Meet & greet, accessibility needs, extra stops…"
          className={`${inputCls('special_requests')} resize-none`} data-testid="special-requests" />
      </div>

      <button type="button" onClick={nextStep}
        className="btn-gold w-full py-3 flex items-center justify-center gap-2 text-base font-semibold"
        data-testid="next-step-btn">
        Continue to Your Details <ArrowRight size={18} />
      </button>
    </div>
  );

  // ── Step 2 ───────────────────────────────────────────────────
  const Step2 = () => (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 space-y-1">
        <p className="font-semibold text-slate-900">{form.trip_type === 'round-trip' ? 'Round-Trip' : 'One-Way'} Transfer</p>
        <p>{form.pickup_location} → {form.dropoff_location}</p>
        <p>{form.pickup_date} at {form.pickup_time} · {form.passengers} adult(s){form.children > 0 ? `, ${form.children} child(ren)` : ''} · {form.luggage} bag(s)</p>
        {form.trip_type === 'round-trip' && <p className="text-amber-700">Return: {form.return_date} at {form.return_pickup_time}</p>}
      </div>

      <div>
        <Label required>Full Name</Label>
        <input value={form.passenger_name} onChange={e => set('passenger_name', e.target.value)}
          placeholder="As it appears on your booking" className={inputCls('passenger_name')}
          data-testid="passenger-name" autoComplete="name" />
        <Err field="passenger_name" />
      </div>
      <div>
        <Label required>Email Address</Label>
        <input type="email" value={form.passenger_email} onChange={e => set('passenger_email', e.target.value)}
          placeholder="your@email.com" className={inputCls('passenger_email')}
          data-testid="passenger-email" autoComplete="email" />
        <Err field="passenger_email" />
      </div>
      <div>
        <Label required>Phone / WhatsApp</Label>
        <input type="tel" value={form.passenger_phone} onChange={e => set('passenger_phone', e.target.value)}
          placeholder="+44 7xxx xxxxxx" className={inputCls('passenger_phone')}
          data-testid="passenger-phone" autoComplete="tel" />
        <Err field="passenger_phone" />
      </div>

      {errors.form && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <Warning size={16} weight="fill" />{errors.form}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => setStep(1)}
          className="flex-none px-5 py-3 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:border-slate-400 transition flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <button type="submit" disabled={submitting}
          className="btn-gold flex-1 py-3 text-base font-semibold disabled:opacity-50"
          data-testid="submit-quote-btn">
          {submitting ? 'Sending…' : 'Send Quote Request'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1a1a2e] text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition">
            <ArrowLeft size={18} />
            <CarSimple size={26} weight="fill" className="text-[#d4af37]" />
            <span className="font-semibold text-sm">Planet Transfers</span>
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[#d4af37] text-[#1a1a2e]' : 'bg-slate-700 text-slate-400'}`}>1</span>
            <div className="w-8 h-0.5 bg-slate-600" />
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-[#d4af37] text-[#1a1a2e]' : 'bg-slate-700 text-slate-400'}`}>2</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 1 ? 'Request a Transfer Quote' : 'Your Contact Details'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {step === 1 ? 'Tell us about your journey and we\'ll send you a price within a few hours.' : 'Almost done — where should we send your quote?'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit}>
            {step === 1 ? <Step1 /> : <Step2 />}
          </form>
        </div>
      </main>
    </div>
  );
}
