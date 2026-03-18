import React, { useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CarSimple, ArrowLeft, ShieldCheck, Clock, CreditCard,
  Lock, Confetti, Phone, CheckCircle
} from '@phosphor-icons/react';

const IWAY_USER_ID = '143708';

function ProgressSteps({ step }) {
  const steps = ['Search', 'Select Vehicle', 'Complete Booking'];
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <React.Fragment key={num}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                ${done ? 'bg-green-500 border-green-500 text-white' :
                  active ? 'bg-[#d4af37] border-[#d4af37] text-white' :
                  'bg-white border-slate-200 text-slate-400'}`}
              >
                {done ? <CheckCircle size={16} weight="fill" /> : num}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap font-medium
                ${active ? 'text-[#d4af37]' : done ? 'text-green-600' : 'text-slate-400'}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 mx-1 mb-5 transition-colors
                ${done ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function BookNowPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromPlaceId = searchParams.get('from_place_id');
  const toPlaceId = searchParams.get('to_place_id');
  const carClassId = searchParams.get('car_class_id');
  const cameFromResults = !!(fromPlaceId && toPlaceId);

  const buildIwayUrl = () => {
    const params = new URLSearchParams({
      userID: IWAY_USER_ID,
      lang: 'en',
      currency: 'GBP',
      pos: 'iframe',
    });
    if (fromPlaceId) params.set('from_place_id', fromPlaceId);
    if (toPlaceId) params.set('to_place_id', toPlaceId);
    if (carClassId) params.set('car_class_id', carClassId);
    return `https://iway.io/steporder/framens?${params.toString()}`;
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://iway.io/js/plugins/iframe.resize.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={30} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-lg font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <button
            onClick={() => cameFromResults ? navigate(-1) : navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            {cameFromResults ? 'Back to Vehicles' : 'Back to Home'}
          </button>
        </div>
      </nav>

      {/* Trust Strip */}
      <div className="bg-slate-900 text-white px-6 py-2.5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <Lock size={12} className="text-green-400" />Secure booking
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <Confetti size={12} className="text-[#d4af37]" />Instant confirmation
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <ShieldCheck size={12} className="text-blue-400" />Trusted transfer partner
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <Phone size={12} className="text-purple-400" />24/7 support
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Progress */}
        <ProgressSteps step={3} />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-['Playfair_Display'] font-semibold text-slate-900 mb-1">
            Complete Your Booking
          </h1>
          <p className="text-sm text-slate-500">
            Confirm details, choose extras, and pay securely — all in one step.
          </p>
        </div>

        {/* Trust badges inline */}
        <div className="flex flex-wrap justify-center gap-5 mb-6">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <ShieldCheck size={17} className="text-green-600" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Clock size={17} className="text-blue-600" />
            <span>Instant Confirmation</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <CreditCard size={17} className="text-slate-500" />
            <span>All Major Cards Accepted</span>
          </div>
        </div>

        {/* iWay Booking Frame */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="booking-frame-wrapper">
          <iframe
            width="100%"
            height="900"
            id="iway-frame"
            name="iway-frame"
            src={buildIwayUrl()}
            onLoad={(e) => {
              if (typeof window.FrameResize !== 'undefined') {
                window.FrameResize.registerFrame(e.target);
              }
            }}
            frameBorder="0"
            style={{ minHeight: '800px', display: 'block' }}
            title="Complete Your Airport Transfer Booking — Planet Transfers"
            data-testid="iway-booking-frame"
          />
        </div>

        {/* Pricing disclaimer */}
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-800 text-center">
            Estimated price based on route and demand. Final price confirmed after booking.
            Free cancellation may apply — see booking terms for details.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CarSimple size={22} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] font-semibold text-slate-900 text-sm">Planet Transfers</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link to="/terms-conditions" className="hover:text-slate-600 transition-colors">Terms</Link>
            <Link to="/privacy-policy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <span>© {new Date().getFullYear()} Planet Transfers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
