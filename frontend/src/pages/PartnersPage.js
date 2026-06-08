import React, { useState } from 'react';
import axios from 'axios';
import {
  CarSimple, CheckCircle, Buildings, Handshake,
  WhatsappLogo, Envelope, ArrowRight, Users,
  CurrencyGbp, Clock, ShieldCheck, Phone
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BENEFITS = [
  { icon: <CurrencyGbp size={28} weight="light" />, title: "Commission on Every Booking", desc: "Earn a commission for each completed transfer you refer to us." },
  { icon: <Clock size={28} weight="light" />,        title: "Instant Booking Confirmation", desc: "Your clients receive email confirmation immediately after booking online." },
  { icon: <ShieldCheck size={28} weight="light" />, title: "Professional, Licensed Drivers", desc: "All drivers are vetted, licensed, and fully insured for your peace of mind." },
  { icon: <Users size={28} weight="light" />,        title: "Meet & Greet Included",        desc: "Driver meets guests at arrivals with a name sign — no stress at the airport." },
  { icon: <WhatsappLogo size={28} weight="light" />, title: "WhatsApp Support",             desc: "Direct WhatsApp line for quick changes, queries, and last-minute bookings." },
  { icon: <CheckCircle size={28} weight="light" />,  title: "Fixed Prices, No Surprises",   desc: "Fixed-price transfers so your clients always know the cost upfront." },
];

const BUSINESS_TYPES = [
  { value: 'travel_agency',       label: 'Travel Agency' },
  { value: 'hotel',               label: 'Hotel' },
  { value: 'serviced_apartment',  label: 'Serviced Apartment' },
  { value: 'airbnb',              label: 'Airbnb / Short-Let Host' },
  { value: 'relocation_agent',    label: 'Relocation Agent' },
  { value: 'other',               label: 'Other' },
];

const MONTHLY_OPTIONS = [
  { value: '1-5',   label: '1 – 5 bookings' },
  { value: '5-20',  label: '5 – 20 bookings' },
  { value: '20-50', label: '20 – 50 bookings' },
  { value: '50+',   label: '50+ bookings' },
];

const EMPTY = { company_name:'', contact_name:'', email:'', phone:'', business_type:'', monthly_bookings:'', message:'' };

export default function PartnersPage() {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(null);   // null | {ref}

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const valid = form.company_name && form.contact_name && form.email && form.phone && form.business_type && form.monthly_bookings;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/partners`, form);
      setDone(`PR-${data.id.slice(0,8).toUpperCase()}`);
    } catch {
      alert('Something went wrong. Please try again or contact us on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6]">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <CarSimple size={30} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/book" className="btn-gold py-2 px-4 text-sm">Book a Transfer</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 bg-[#1a1a2e] text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#d4af37]/30 rounded-full px-4 py-2 mb-6">
            <Handshake size={18} className="text-[#d4af37]" />
            <span className="text-sm font-medium text-[#d4af37]">Partner Programme</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-['Playfair_Display'] font-semibold mb-5 leading-tight">
            Partner with Planet Transfers
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Provide your clients and guests with reliable, fixed-price airport transfers — and earn commission on every completed booking you refer.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-white/70">
            <span className="flex items-center gap-1"><CheckCircle size={15} weight="fill" className="text-green-400" /> Travel Agencies</span>
            <span className="flex items-center gap-1"><CheckCircle size={15} weight="fill" className="text-green-400" /> Hotels & Serviced Apartments</span>
            <span className="flex items-center gap-1"><CheckCircle size={15} weight="fill" className="text-green-400" /> Relocation Agents</span>
            <span className="flex items-center gap-1"><CheckCircle size={15} weight="fill" className="text-green-400" /> Airbnb Hosts</span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 text-center mb-10">What Partners Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                <div className="text-[#d4af37] mb-3">{b.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { n:'01', t:'Send Us Your Enquiry', d:'Fill in the form below. We respond within 1 business day.' },
              { n:'02', t:'We Agree Terms',       d:'Simple commission agreement — no complex contracts.' },
              { n:'03', t:'Start Referring',      d:'Share our booking link or request a quote for your clients directly.' },
            ].map((s,i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="text-3xl font-['Playfair_Display'] text-[#d4af37] mb-3">{s.n}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.t}</h3>
                <p className="text-sm text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 bg-white" id="partner-form">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">Become a Partner</h2>
            <p className="text-slate-500 text-sm">Fill in your details and we&apos;ll be in touch within 1 business day.</p>
          </div>

          {done ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <CheckCircle size={48} weight="fill" className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Enquiry Received!</h3>
              <p className="text-slate-600 mb-1">Reference: <strong>{done}</strong></p>
              <p className="text-slate-500 text-sm">We&apos;ve sent a confirmation to your email. Our team will contact you within 1 business day.</p>
              <a href="/" className="inline-block mt-6 btn-gold py-2 px-6 text-sm">Back to Home</a>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name *</label>
                  <input name="company_name" value={form.company_name} onChange={handle} required placeholder="e.g. Sunshine Travel Ltd" className="input-field" data-testid="partner-company" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Name *</label>
                  <input name="contact_name" value={form.contact_name} onChange={handle} required placeholder="Your full name" className="input-field" data-testid="partner-contact" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handle} required placeholder="you@company.com" className="input-field" data-testid="partner-email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone / WhatsApp *</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handle} required placeholder="+44 7700 000000" className="input-field" data-testid="partner-phone" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type of Business *</label>
                <select name="business_type" value={form.business_type} onChange={handle} required className="input-field" data-testid="partner-btype">
                  <option value="">Select type...</option>
                  {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected Monthly Bookings *</label>
                <select name="monthly_bookings" value={form.monthly_bookings} onChange={handle} required className="input-field" data-testid="partner-monthly">
                  <option value="">Select range...</option>
                  {MONTHLY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message (optional)</label>
                <textarea name="message" value={form.message} onChange={handle} rows={3} placeholder="Tell us about your business and how you'd like to work together..." className="input-field resize-none" data-testid="partner-message" />
              </div>

              <button type="submit" disabled={!valid || loading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" data-testid="partner-submit">
                {loading ? 'Sending...' : <><span>Send Partner Request</span><ArrowRight size={18} /></>}
              </button>

              <p className="text-xs text-center text-slate-400">By submitting you agree to our <a href="/privacy-policy" className="underline">Privacy Policy</a>. We do not share your details with third parties.</p>
            </form>
          )}
        </div>
      </section>

      {/* Footer strip */}
      <footer className="bg-[#1a1a2e] text-white py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <CarSimple size={20} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-white font-medium">Planet Transfers</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://wa.me/447739476432" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
              <WhatsappLogo size={16} weight="fill" className="text-green-400" /> +44 773 947 6432
            </a>
            <a href="mailto:bookings@planettransfers.online" className="flex items-center gap-1 hover:text-white transition-colors">
              <Envelope size={16} /> bookings@planettransfers.online
            </a>
          </div>
          <span>&copy; {new Date().getFullYear()} Planet Transfers</span>
        </div>
      </footer>
    </div>
  );
}
