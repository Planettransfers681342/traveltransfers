import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CarSimple, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle, Clock } from '@phosphor-icons/react';

const IWAY_USER_ID = '143708';

export default function BookNowPage() {
  const [searchParams] = useSearchParams();
  const fromPlaceId = searchParams.get('from_place_id');
  const toPlaceId   = searchParams.get('to_place_id');
  const carClassId  = searchParams.get('car_class_id');
  const cameFromResults = !!(fromPlaceId && toPlaceId);

  const buildIwayUrl = () => {
    const p = new URLSearchParams({ userID: IWAY_USER_ID, lang: 'en', currency: 'GBP' });
    if (fromPlaceId) p.set('from_place_id', fromPlaceId);
    if (toPlaceId)   p.set('to_place_id',   toPlaceId);
    if (carClassId)  p.set('car_class_id',  carClassId);
    return `https://iway.io/steporder/framens?${p.toString()}`;
  };

  // If arriving with pre-filled params, show a clean handoff page
  if (cameFromResults) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
        <nav className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
              <span className="font-['Playfair_Display'] text-lg font-semibold text-slate-900">Planet Transfers</span>
            </Link>
            <Link to={-1} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft size={16} />Back to Vehicles
            </Link>
          </div>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 max-w-md w-full">
            <div className="w-14 h-14 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={28} className="text-[#d4af37]" />
            </div>
            <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-slate-900 mb-2">
              Secure Checkout
            </h1>
            <p className="text-slate-500 text-sm mb-7 leading-relaxed">
              You're about to complete your booking on our secure payment partner.
              Your transfer details are pre-filled and ready.
            </p>

            <a
              href={buildIwayUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold mb-4"
              data-testid="proceed-to-payment-btn"
            >
              Proceed to Payment
              <ArrowRight size={16} />
            </a>

            <div className="flex justify-center gap-5 mt-5">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={13} className="text-green-500" />Secure
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle size={13} className="text-blue-400" />Instant confirmation
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={13} className="text-amber-400" />Free waiting
              </span>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">© {new Date().getFullYear()} Planet Transfers</span>
            <div className="flex gap-4 text-xs text-slate-400">
              <Link to="/terms-and-conditions" className="hover:text-slate-600">Terms</Link>
              <Link to="/privacy-policy" className="hover:text-slate-600">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Standalone (nav "Book Now" → search directly on iWay)
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-lg font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={16} />Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="text-center mb-6">
          <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-slate-900 mb-1">Book Your Airport Transfer</h1>
          <p className="text-sm text-slate-500">Search, compare and book — secure payment, instant confirmation.</p>
        </div>

        <div className="flex justify-center gap-6 mb-8">
          <span className="flex items-center gap-1.5 text-sm text-slate-600"><ShieldCheck size={16} className="text-green-600" />Secure Payment</span>
          <span className="flex items-center gap-1.5 text-sm text-slate-600"><Clock size={16} className="text-blue-600" />Instant Confirmation</span>
          <span className="flex items-center gap-1.5 text-sm text-slate-600"><CheckCircle size={16} className="text-slate-400" />Free Cancellation</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" data-testid="booking-frame-wrapper">
          <iframe
            width="100%"
            height="850"
            id="iway-frame"
            src={buildIwayUrl()}
            frameBorder="0"
            style={{ minHeight: '750px', display: 'block' }}
            title="Book Airport Transfer — Planet Transfers"
            data-testid="iway-booking-frame"
          />
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          * Estimated price based on route and demand. Final price confirmed after booking.
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
