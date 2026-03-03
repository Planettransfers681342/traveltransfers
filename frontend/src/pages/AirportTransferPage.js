import React, { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { 
  CarSimple, 
  MapPin, 
  Clock, 
  Users, 
  ShieldCheck,
  Airplane,
  CheckCircle,
  CaretDown,
  Star,
  Phone
} from '@phosphor-icons/react';
import { SEOHead } from '@/components/SEOHead';
import { getDestinationBySlug } from '@/data/seoData';

export default function AirportTransferPage() {
  const { city } = useParams();
  const destination = getDestinationBySlug(city);

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

  // Redirect if destination not found
  if (!destination) {
    return <Navigate to="/" replace />;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${destination.city} Airport Transfer`,
    "description": destination.description,
    "provider": {
      "@type": "Organization",
      "name": "Planet Transfers",
      "url": "https://planettransfers.online"
    },
    "areaServed": {
      "@type": "City",
      "name": destination.city,
      "containedInPlace": {
        "@type": "Country",
        "name": destination.country
      }
    },
    "serviceType": "Airport Transfer"
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title={destination.title}
        description={destination.description}
        canonical={`/airport-transfer/${destination.slug}`}
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
      <section className="relative bg-slate-900 text-white py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${destination.heroImage})` }}
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 text-[#d4af37] mb-4">
            <Airplane size={20} />
            <span className="text-sm font-medium">{destination.airport}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-['Playfair_Display'] font-semibold mb-4">
            {destination.city} Airport Transfer
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mb-6">
            {destination.description}
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#d4af37]" />
              <span>{destination.distance.center} to city center</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#d4af37]" />
              <span>~{destination.distance.time} journey</span>
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
                <h2 className="text-lg font-semibold">Book & Pay Instantly</h2>
                <p className="text-sm text-slate-400">Search available transfers and book online</p>
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
                  title={`Book ${destination.city} Airport Transfer`}
                  loading="lazy"
                />
              </div>
            </div>

            {/* Quote Request */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-[#d4af37] text-white px-6 py-4">
                <h2 className="text-lg font-semibold">Request a Quote</h2>
                <p className="text-sm text-amber-100">Get a personalized quote for your transfer</p>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-6">
                  Need a custom quote for a special route or large group? Our team will respond within 30 minutes.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle size={18} className="text-green-500" />
                    Personalized pricing
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle size={18} className="text-green-500" />
                    Special requirements catered
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle size={18} className="text-green-500" />
                    Large group discounts
                  </li>
                </ul>
                <button
                  onClick={() => window.open('/quote', '_blank', 'width=800,height=900,scrollbars=yes')}
                  className="btn-secondary w-full py-3"
                >
                  Request Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Popular {destination.city} Transfer Routes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {destination.popularRoutes.map((route, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <MapPin size={24} className="text-[#d4af37] mx-auto mb-2" />
                <p className="font-medium text-slate-900">{destination.airport.split(' ')[0]}</p>
                <p className="text-slate-400 text-sm">→</p>
                <p className="font-medium text-slate-900">{route}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Categories */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Available Vehicle Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: 'Standard Class', desc: 'Comfortable sedans', passengers: 4, luggage: 3, alt: 'Standard airport transfer vehicle' },
              { name: 'Business Class', desc: 'Premium sedans', passengers: 4, luggage: 4, alt: 'Business class airport transfer sedan' },
              { name: 'Group Transfer', desc: 'Minivans & MPVs', passengers: 8, luggage: 8, alt: 'Airport transfer minivan for groups' },
              { name: 'Full Size Bus', desc: 'Coaches', passengers: 50, luggage: 50, alt: 'Large coach for airport group transfers' }
            ].map((vehicle, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <CarSimple size={32} className="text-[#d4af37] mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">{vehicle.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{vehicle.desc}</p>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {vehicle.passengers}
                  </span>
                  <span>•</span>
                  <span>{vehicle.luggage} bags</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-8 text-center">
            Why Choose Planet Transfers
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
            {destination.faqs.map((faq, index) => (
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
            Ready to Book Your {destination.city} Transfer?
          </h2>
          <p className="text-slate-400 mb-8">
            Professional drivers • Fixed prices • Flight monitoring included
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="btn-gold py-3 px-8">
              Book Now
            </Link>
            <button
              onClick={() => window.open('/quote', '_blank', 'width=800,height=900,scrollbars=yes')}
              className="btn-secondary py-3 px-8"
            >
              Request Quote
            </button>
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
