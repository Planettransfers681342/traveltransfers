import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CarSimple, ArrowLeft, ShieldCheck, Clock, CreditCard } from '@phosphor-icons/react';

const IWAY_USER_ID = '143708';

export default function BookNowPage() {
  const [searchParams] = useSearchParams();
  const fromPlaceId = searchParams.get('from_place_id');
  const toPlaceId = searchParams.get('to_place_id');
  const carClassId = searchParams.get('car_class_id');

  // Build the iWay iframe URL with optional pre-filled params
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
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={32} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3">
            Book Your Airport Transfer
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Search, compare prices, and book your transfer instantly. Secure payment and instant confirmation.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck size={20} className="text-green-600" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock size={20} className="text-blue-600" />
            <span>Instant Confirmation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CreditCard size={20} className="text-purple-600" />
            <span>Free Cancellation</span>
          </div>
        </div>

        {/* iWay Booking Frame */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
            style={{ minHeight: '800px' }}
            title="Book Airport Transfer"
            data-testid="iway-booking-frame"
          />
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Booking powered by iWay • All major credit cards accepted
          </p>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CarSimple size={24} weight="fill" className="text-[#d4af37]" />
              <span className="font-['Playfair_Display'] font-semibold text-slate-900">Planet Transfers</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Planet Transfers. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
