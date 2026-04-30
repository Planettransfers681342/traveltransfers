import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CarSimple,
  MapPin,
  ArrowRight,
  Users,
  Suitcase,
  ShieldCheck,
  Info,
} from '@phosphor-icons/react';
import axios from 'axios';
import { CurrencySelector } from '@/components/CurrencySelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VEHICLES = [
  { key: 'economy_price',  label: 'Standard',        sub: 'Sedan · up to 4 pax',  param: 'Standard'  },
  { key: 'business_price', label: 'Business',         sub: 'Premium · up to 4 pax', param: 'Business'  },
  { key: 'group_price',    label: 'Minivan / MPV',    sub: 'Group · up to 8 pax',   param: 'Group'     },
  { key: 'bus_price',      label: 'Full-size Bus',    sub: 'Coach · up to 50 pax',  param: 'Bus'       },
];

function openQuote(from, to, vehicle) {
  const qs = new URLSearchParams({ from, to, vehicle }).toString();
  window.open(`/quote?${qs}`, '_blank', 'width=800,height=900,scrollbars=yes');
}

export default function FixedPricesPage() {
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    axios.get(`${API}/routes/prices`)
      .then(r => setRoutes(r.data || []))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = routes.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.from_location.toLowerCase().includes(q) ||
      r.to_location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={30} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <div className="flex items-center gap-3">
            <CurrencySelector />
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">Home</Link>
            <Link to="/book" className="btn-gold py-2 px-5 text-sm">Book Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-14">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase mb-3">Transparent Pricing</p>
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl font-semibold mb-4">Fixed Transfer Prices</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            All prices are fixed — no surge pricing, no hidden fees. What you see is what you pay.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-300">
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#d4af37]" /> No hidden fees</span>
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#d4af37]" /> Free flight tracking</span>
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#d4af37]" /> Free cancellation</span>
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#d4af37]" /> Meet &amp; Greet included</span>
          </div>
        </div>
      </section>

      {/* Search + Note */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2 text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <Info size={16} className="text-[#d4af37] mt-0.5 shrink-0" />
          For surrounding areas not listed below, pricing is confirmed manually after a quote request.
        </div>
        <input
          type="text"
          placeholder="Search routes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field h-10 w-64 text-sm"
          data-testid="fixed-prices-search"
        />
      </div>

      {/* Pricing Table */}
      <main className="max-w-5xl mx-auto px-6 pb-16">

        {/* Desktop: Table */}
        <div className="hidden md:block">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 w-[30%]">Route</th>
                  {VEHICLES.map(v => (
                    <th key={v.key} className="text-center px-4 py-4 text-sm font-semibold text-slate-700">
                      <p>{v.label}</p>
                      <p className="text-xs font-normal text-slate-400">{v.sub}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">Loading prices…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">No routes found.</td></tr>
                )}
                {filtered.map((route, i) => (
                  <tr
                    key={route.id}
                    className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    data-testid={`price-row-${i}`}
                  >
                    {/* Route */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#d4af37] shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{route.from_location}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <ArrowRight size={12} className="text-slate-400" />
                            <p className="text-xs text-slate-500">{route.to_location}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Prices per vehicle */}
                    {VEHICLES.map(v => (
                      <td key={v.key} className="px-4 py-5 text-center">
                        {route[v.key] > 0 ? (
                          <div>
                            <p className="text-xl font-bold text-slate-900">£{route[v.key].toFixed(0)}</p>
                            <Link
                              to={`/results`}
                              state={{
                                pickup_location:  route.from_location,
                                dropoff_location: route.to_location,
                              }}
                              className="text-xs text-[#d4af37] hover:underline mt-0.5 block"
                            >
                              Book now →
                            </Link>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <button
                              data-testid={`quote-btn-${i}-${v.key}`}
                              onClick={() => openQuote(route.from_location, route.to_location, v.param)}
                              className="btn-gold py-1.5 px-3 text-xs"
                            >
                              Request Quote
                            </button>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-4">
          {loading && <p className="text-center py-12 text-slate-400">Loading prices…</p>}
          {!loading && filtered.length === 0 && <p className="text-center py-12 text-slate-400">No routes found.</p>}
          {filtered.map((route, i) => (
            <div key={route.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid={`price-card-${i}`}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-[#d4af37] shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">{route.from_location}</p>
                  <p className="text-xs text-slate-500">→ {route.to_location}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLES.map(v => (
                  <div key={v.key} className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">{v.label}</p>
                    {route[v.key] > 0 ? (
                      <p className="text-lg font-bold text-slate-900">£{route[v.key].toFixed(0)}</p>
                    ) : (
                      <button
                        onClick={() => openQuote(route.from_location, route.to_location, v.param)}
                        className="btn-gold py-1 px-2 text-xs w-full"
                      >
                        Request Quote
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-slate-900 text-white rounded-xl p-8 text-center">
          <h2 className="font-['Playfair_Display'] text-2xl font-semibold mb-2">Don't see your route?</h2>
          <p className="text-slate-400 mb-6 text-sm">
            We cover hundreds of airports and destinations worldwide. Request a personalised quote and we'll get back to you within 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              data-testid="fixed-prices-quote-btn"
              onClick={() => window.open('/quote', '_blank', 'width=800,height=900,scrollbars=yes')}
              className="btn-gold py-3 px-8"
            >
              Request a Quote
            </button>
            <Link to="/" className="btn-secondary py-3 px-8">
              Search Live Prices
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-4">For surrounding areas, pricing is confirmed manually after submission.</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CarSimple size={22} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] font-semibold">Planet Transfers</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-white">Terms</Link>
            <Link to="/cookie-policy" className="hover:text-white">Cookie Policy</Link>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Planet Transfers</p>
        </div>
      </footer>
    </div>
  );
}
