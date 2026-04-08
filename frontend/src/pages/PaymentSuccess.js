import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { openWhatsApp } from '../utils/whatsapp';
import { trackEvent } from '../utils/analytics';
import {
  CheckCircle, CarSimple, ArrowRight, Envelope,
  MapPin, Calendar, Clock, Users, Airplane, Car
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SUPPORT_EMAIL = 'GBRoyaltransfers@gmail.com';

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function currencySymbol(c = 'GBP') {
  return c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$';
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    trackEvent('payment_success_page_view');
    try {
      const saved = sessionStorage.getItem('pt_booking_summary');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSummary(parsed);
        sessionStorage.removeItem('pt_booking_summary');
        // Mark our DB record as payment_completed
        if (parsed.internal_booking_id) {
          axios.put(`${API}/iway/bookings/${parsed.internal_booking_id}/status`, {
            payment_status: 'payment_completed',
          }).catch(() => {});
        }
      }
    } catch {}
  }, []);

  const sym = currencySymbol(summary?.currency);
  const ref = summary?.booker_number || summary?.transaction || null;

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <a href="/" className="flex items-center gap-2 mb-10">
        <CarSimple size={30} weight="fill" className="text-[#d4af37]" />
        <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
      </a>

      <div className="w-full max-w-lg space-y-4">

        {/* ── Success banner ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={44} weight="fill" className="text-green-500" />
          </div>

          <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-slate-900 mb-3">
            Booking Received
          </h1>
          <p className="text-slate-700 text-sm font-medium mb-2">
            Your booking request has been successfully received.
          </p>
          <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
            Payment has been completed with our secure partner. Your transfer provider will process your booking and confirm the service details shortly.
          </p>

          {ref && (
            <div className="mt-5 inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Booking ref</span>
              <span className="text-sm font-bold text-slate-900 tracking-wider">{ref}</span>
            </div>
          )}
        </div>

        {/* ── Trip summary ── */}
        {summary && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-4">Trip Summary</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">From</p>
                  <p className="text-sm font-medium text-slate-900">{summary.pickup}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">To</p>
                  <p className="text-sm font-medium text-slate-900">{summary.dropoff}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Date</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(summary.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Time</p>
                    <p className="text-sm font-medium text-slate-900">{summary.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Passengers</p>
                    <p className="text-sm font-medium text-slate-900">{summary.passengers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Car size={14} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Vehicle</p>
                    <p className="text-sm font-medium text-slate-900">{summary.vehicle_class}</p>
                  </div>
                </div>
              </div>

              {summary.flight_number && (
                <div className="flex items-center gap-2 pt-1">
                  <Airplane size={14} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Flight</p>
                    <p className="text-sm font-medium text-slate-900">{summary.flight_number}</p>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">Amount paid</span>
                <span className="text-lg font-bold text-slate-900">{sym}{summary.price}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── What happens next ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-4">What Happens Next</p>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle size={16} weight="fill" className="text-green-400 mt-0.5 flex-shrink-0" />
              Your booking has been passed to our transfer partner for fulfilment.
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle size={16} weight="fill" className="text-green-400 mt-0.5 flex-shrink-0" />
              Your driver will be assigned and will contact you before your pickup time.
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle size={16} weight="fill" className="text-green-400 mt-0.5 flex-shrink-0" />
              For airport pickups, your driver will monitor your flight for any delays.
            </li>
          </ul>
        </div>

        {/* ── Support ── */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <p className="text-sm font-semibold mb-1">Need help with your booking?</p>
          <p className="text-slate-400 text-xs mb-4">
            {ref ? `Quote your reference: ${ref}` : 'Our team is here to help.'}
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Booking Enquiry${ref ? ` – Ref ${ref}` : ''}`}
              className="inline-flex items-center gap-2 bg-[#d4af37] text-slate-900 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#c9a430] transition-colors"
              data-testid="contact-support-btn"
            >
              <Envelope size={16} />
              {SUPPORT_EMAIL}
            </a>
            <a
              href="#whatsapp"
              onClick={openWhatsApp}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#1ebe5d] transition-colors"
              data-testid="whatsapp-support-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72,24,24,0,0,1,19.29-23.54l11.48,22.94L101,117.11a8,8,0,0,0-.73,7.65,56.47,56.47,0,0,0,31,31,8,8,0,0,0,7.65-.73l13.77-9.19,22.94,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a88,88,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216l12.47-37.4a8,8,0,0,0-.67-6.54A88,88,0,1,1,128,216Z"/></svg>
              WhatsApp Us
            </a>
          </div>
        </div>

        {/* ── Back home ── */}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium py-3.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          data-testid="back-home-btn"
        >
          Back to Home
          <ArrowRight size={16} />
        </button>

        <p className="text-center text-xs text-slate-400 pb-4">
          © {new Date().getFullYear()} Planet Transfers · All rights reserved
        </p>
      </div>
    </div>
  );
}
