import React, { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { 
  CarSimple, 
  MapPin, 
  Clock, 
  Path,
  CheckCircle,
  CaretDown,
  ArrowRight,
  ShieldCheck,
  Star,
  Phone,
  Airplane
} from '@phosphor-icons/react';
import { SEOHead } from '@/components/SEOHead';
import { getRouteBySlug } from '@/data/seoData';

export default function TransferRoutePage() {
  const { route } = useParams();
  const routeData = getRouteBySlug(route);

  useEffect(() => {
    // Load iWay iframe script
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

  // Redirect if route not found
  if (!routeData) {
    return <Navigate to="/" replace />;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${routeData.from} to ${routeData.to} Transfer`,
    "description": routeData.description,
    "provider": {
      "@type": "Organization",
      "name": "Planet Transfers",
      "url": "https://planettransfers.online"
    },
    "areaServed": [
      { "@type": "City", "name": routeData.fromCity },
      { "@type": "City", "name": routeData.toCity }
    ],
    "serviceType": "Airport Transfer"
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title={routeData.title}
        description={routeData.description}
        canonical={`/transfer/${routeData.slug}`}
        schema={schema}
      />

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={32} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/book" className="btn-gold py-2 px-5 text-sm">Book Now</Link>
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 text-[#d4af37] mb-4">
            <Path size={20} />
            <span className="text-sm font-medium">Private Transfer Route</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-['Playfair_Display'] font-semibold mb-6">
            <span>{routeData.from}</span>
            <ArrowRight size={32} className="inline mx-4 text-[#d4af37]" />
            <span>{routeData.to}</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mb-8">
            {routeData.description}
          </p>
          
          {/* Route Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <MapPin size={24} className="text-[#d4af37] mb-2" />
              <p className="text-sm text-slate-400">Distance</p>
              <p className="font-semibold">{routeData.distance}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Clock size={24} className="text-[#d4af37] mb-2" />
              <p className="text-sm text-slate-400">Journey Time</p>
              <p className="font-semibold">{routeData.duration}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <CarSimple size={24} className="text-[#d4af37] mb-2" />
              <p className="text-sm text-slate-400">Service</p>
              <p className="font-semibold">Door-to-door</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <ShieldCheck size={24} className="text-[#d4af37] mb-2" />
              <p className="text-sm text-slate-400">Price</p>
              <p className="font-semibold">Fixed Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* iWay Booking */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4">
                <h2 className="text-lg font-semibold">Book This Transfer</h2>
                <p className="text-sm text-slate-400">Instant confirmation • Pay online</p>
              </div>
              <div className="p-4">
                <iframe
                  width="100%"
                  height="450"
                  id="iway-frame"
                  name="iway-frame"
                  src="https://iway.io/steporder/framens?userID=143708&lang=en&currency=EUR&pos=iframe"
                  onLoad={(e) => {
                    if (typeof window.FrameResize !== 'undefined') {
                      window.FrameResize.registerFrame(e.target);
                    }
                  }}
                  frameBorder="0"
                  title={`Book ${routeData.from} to ${routeData.to} Transfer`}
                  loading="lazy"
                />
              </div>
            </div>

            {/* Route Details */}
            <div>
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Route Highlights</h2>
                <ul className="space-y-3">
                  {routeData.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                      <span className="text-slate-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#d4af37]/10 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Need a Custom Quote?</h3>
                <p className="text-sm text-slate-600 mb-4">
                  For special requirements, large groups, or additional stops along the way.
                </p>
                <button
                  data-testid="route-quote-btn-sidebar"
                  onClick={() => {
                    const qs = new URLSearchParams({ from: routeData.from, to: routeData.to }).toString();
                    window.open(`/quote?${qs}`, '_blank', 'width=800,height=900,scrollbars=yes');
                  }}
                  className="btn-gold w-full py-3"
                >
                  Request Quote
                </button>
                <p className="text-xs text-slate-500 text-center mt-2">For surrounding areas, pricing is confirmed manually</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-8 text-center">
            Why Book With Planet Transfers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: ShieldCheck, text: 'Professional Licensed Drivers' },
              { icon: CheckCircle, text: 'Fixed Transparent Pricing' },
              { icon: Airplane, text: 'Flight Monitoring Included' },
              { icon: Phone, text: '24/7 Customer Support' },
              { icon: Star, text: 'Free Cancellation' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <item.icon size={32} className="text-[#d4af37] mx-auto mb-3" />
                <p className="text-sm text-slate-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {routeData.faqs.map((faq, index) => (
              <details key={index} className="bg-white rounded-lg shadow-sm">
                <summary className="px-6 py-4 cursor-pointer font-medium text-slate-900 flex items-center justify-between">
                  {faq.q}
                  <CaretDown size={20} className="text-slate-400" />
                </summary>
                <div className="px-6 pb-4 text-slate-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-['Playfair_Display'] font-semibold mb-4">
            Book Your Transfer Today
          </h2>
          <p className="text-slate-400 mb-8">
            {routeData.from} → {routeData.to} • {routeData.duration} • Fixed Price
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="btn-gold py-3 px-8">
              Book Now
            </Link>
            <div className="flex flex-col items-center gap-1">
              <button
                data-testid="route-quote-btn-cta"
                onClick={() => {
                  const qs = new URLSearchParams({ from: routeData.from, to: routeData.to }).toString();
                  window.open(`/quote?${qs}`, '_blank', 'width=800,height=900,scrollbars=yes');
                }}
                className="btn-gold py-3 px-8"
              >
                Request Quote
              </button>
              <p className="text-xs text-slate-400">For surrounding areas, pricing is confirmed manually</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CarSimple size={24} weight="fill" className="text-[#d4af37]" />
              <span className="font-['Playfair_Display'] font-semibold">Planet Transfers</span>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Planet Transfers. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
