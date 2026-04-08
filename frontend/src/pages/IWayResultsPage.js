import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CarSimple,
  ArrowLeft,
  ArrowRight,
  Users,
  Suitcase,
  CheckCircle,
  Warning,
  ArrowsClockwise,
  ShieldCheck,
  Clock,
  Airplane,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import axios from 'axios';
import { trackEvent } from '../utils/analytics';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CAR_CLASS_IMAGES = {
  standard:       'https://iway.io/images/new-template/car-classes-slider/standard.webp',
  comfort:        'https://iway.io/images/new-template/car-classes-slider/comfort.webp',
  'business light':'https://iway.io/images/new-template/car-classes-slider/business-lite.webp',
  'business lite': 'https://iway.io/images/new-template/car-classes-slider/business-lite.webp',
  business:       'https://iway.io/images/new-template/car-classes-slider/business.webp',
  luxury:         'https://iway.io/images/new-template/car-classes-slider/luxury.webp',
  minivan:        'https://iway.io/images/new-template/car-classes-slider/minivan.webp',
  'minivan vip':  'https://iway.io/images/new-template/car-classes-slider/minivan-vip.webp',
  suv:            'https://iway.io/images/new-template/car-classes-slider/suv.webp',
  minibus:        'https://iway.io/images/new-template/car-classes-slider/minibus.webp',
};

function getCarImage(title = '') {
  const k = title.toLowerCase();
  if (CAR_CLASS_IMAGES[k]) return CAR_CLASS_IMAGES[k];
  for (const key of Object.keys(CAR_CLASS_IMAGES)) {
    if (k.includes(key) || key.includes(k)) return CAR_CLASS_IMAGES[key];
  }
  return CAR_CLASS_IMAGES.standard;
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `~${h}h${m > 0 ? ` ${m}m` : ''}` : `~${m} min`;
}

function currencySymbol(c = 'GBP') {
  return c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$';
}

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

// Key services we surface (exclude generic/promotional ones)
const USEFUL_SERVICES = ['meeting', 'meet', 'greet', 'waiting', 'cancellation', 'flight', 'free'];
function filterServices(services = []) {
  return services.filter(s => {
    const t = (s.title || '').toLowerCase();
    return USEFUL_SERVICES.some(k => t.includes(k));
  }).slice(0, 3);
}

export default function IWayResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchData = location.state;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!searchData) { navigate('/'); return; }
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API}/iway/search`, {
        params: { pickup: searchData.pickup_location, dropoff: searchData.dropoff_location, currency: 'GBP', lang: 'en' }
      });
      setResults(data);
      trackEvent('results_viewed', {
        pickup: searchData.pickup_location,
        dropoff: searchData.dropoff_location,
        results_count: data.vehicles?.length || 0,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to find transfers for this route. Please try a different location.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (vehicle) => {
    trackEvent('vehicle_selected', {
      vehicle_class: vehicle.car_class?.title || 'Standard',
      price: vehicle.price,
      currency: vehicle.currency || 'GBP',
    });
    const bookingState = { vehicle, fromPlace: results.from_place, toPlace: results.to_place, searchData };
    // Persist to sessionStorage so passenger details page survives a refresh
    try { sessionStorage.setItem('pt_booking_state', JSON.stringify(bookingState)); } catch {}
    navigate('/passenger-details', { state: bookingState });
  };

  if (!searchData) return null;

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">

      {/* ── Navigation ── */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-lg font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            data-testid="modify-search-btn"
          >
            <ArrowLeft size={16} />
            Modify Search
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">

        {/* ── Route Summary ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Your Transfer</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">From</p>
                <p className="font-semibold text-slate-900 text-sm truncate">{searchData.pickup_location}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-300 flex-shrink-0 hidden sm:block" />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">To</p>
                <p className="font-semibold text-slate-900 text-sm truncate">{searchData.dropoff_location}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 flex-shrink-0 sm:border-l sm:border-slate-100 sm:pl-4">
              <span className="flex items-center gap-1"><Users size={13} />{searchData.passengers} pax</span>
              <span>{formatDate(searchData.pickup_date)}</span>
              <span>{searchData.pickup_time}</span>
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3" data-testid="iway-loading">
            <div className="w-10 h-10 border-[3px] border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-700 font-medium text-sm">Searching available vehicles…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="text-center py-16" data-testid="iway-error">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Warning size={28} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No results found</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchResults}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                data-testid="retry-search-btn"
              >
                <ArrowsClockwise size={16} /> Try Again
              </button>
              <button
                onClick={() => navigate('/quote')}
                className="flex items-center justify-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Request a Quote
              </button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {!loading && results && !error && (
          <>
            <div className="mb-5">
              <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-slate-900" data-testid="results-heading">
                Available Transfers
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {results.vehicles.length} vehicle{results.vehicles.length !== 1 ? 's' : ''} available — live availability
              </p>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6" data-testid="results-trust-badges">
              {[
                { icon: ShieldCheck,           label: 'Secure booking' },
                { icon: ArrowCounterClockwise,  label: 'Free cancellation up to 48h' },
                { icon: Airplane,               label: 'Flight tracking included' },
                { icon: CheckCircle,            label: 'Instant confirmation' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <Icon size={14} weight="fill" className="text-[#d4af37] flex-shrink-0" />
                  <span className="text-xs text-slate-600 leading-tight">{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4" data-testid="vehicle-results">
              {results.vehicles.map((vehicle, idx) => {
                const cc = vehicle.car_class || {};
                const title = cc.title || 'Standard';
                const models = (cc.models || []).join(', ');
                const capacity = cc.capacity || vehicle.capacity;
                const luggage = cc.luggage_capacity;
                const price = vehicle.price;
                const sym = currencySymbol(vehicle.currency);
                const duration = formatDuration(vehicle.travel_time);
                const distance = vehicle.distance ? `${Math.round(vehicle.distance)} km` : null;
                const services = filterServices(vehicle.class_services);
                const overCapacity = capacity && searchData?.passengers > capacity;

                return (
                  <div
                    key={vehicle.price_id || idx}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#d4af37]/50 hover:shadow-md transition-all duration-200"
                    data-testid={`vehicle-card-${idx}`}
                  >
                    <div className="flex flex-col sm:flex-row">

                      {/* Vehicle image */}
                      <div className="sm:w-40 bg-slate-50 flex items-center justify-center p-5 flex-shrink-0">
                        <img
                          src={getCarImage(title)}
                          alt={`${title} transfer`}
                          className="h-20 w-auto object-contain"
                          onError={(e) => { e.target.src = CAR_CLASS_IMAGES.standard; }}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-4">

                          {/* Left: name + specs */}
                          <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-slate-900 text-base">{title}</h2>
                            {models && (
                              <p className="text-xs text-slate-400 mt-0.5">{models} or similar</p>
                            )}

                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                              {capacity && (
                                <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" />Up to {capacity} pax</span>
                              )}
                              {luggage != null && (
                                <span className="flex items-center gap-1"><Suitcase size={12} className="text-slate-400" />{luggage} bags</span>
                              )}
                              {duration && (
                                <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" />{duration}</span>
                              )}
                              {distance && <span className="text-slate-400">{distance}</span>}
                            </div>

                            {services.length > 0 && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                                {services.map(s => (
                                  <span key={s.id} className="flex items-center gap-1 text-[11px] text-green-700">
                                    <CheckCircle size={11} weight="fill" className="text-green-500 flex-shrink-0" />
                                    {s.title}{s.value ? ` (${s.value} min)` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right: price + CTA */}
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Starts from</p>
                              <p className="text-xl font-bold text-slate-900 leading-tight">{sym}{price}</p>
                              <p className="text-[10px] text-slate-400">one way *</p>
                            </div>
                            {overCapacity && (
                              <p className="text-[11px] text-amber-600 text-right flex items-center gap-1">
                                <Warning size={11} className="flex-shrink-0" />
                                Max {capacity} pax
                              </p>
                            )}
                            <button
                              onClick={() => handleBook(vehicle)}
                              disabled={overCapacity}
                              className={`btn-gold py-2.5 px-5 text-sm inline-flex items-center gap-2 whitespace-nowrap ${overCapacity ? 'opacity-40 cursor-not-allowed' : ''}`}
                              data-testid={`book-vehicle-btn-${idx}`}
                            >
                              Book Now
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed">
              * Estimated price based on route and demand. Final price confirmed after booking.
              Free cancellation may apply — see booking terms.
            </p>

            {/* Minimal trust row */}
            <div className="flex flex-wrap justify-center gap-5 mt-4 mb-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={13} className="text-green-500" />Secure payment
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle size={13} className="text-blue-400" />Instant confirmation
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={13} className="text-amber-400" />Free waiting time
              </span>
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CarSimple size={20} weight="fill" className="text-[#d4af37]" />
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
