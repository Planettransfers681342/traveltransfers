import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CarSimple,
  ArrowLeft,
  ArrowRight,
  Users,
  Suitcase,
  CheckCircle,
  Star,
  Warning,
  ArrowsClockwise,
  ShieldCheck,
  Clock,
  Lock,
  Confetti,
  Phone
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CAR_CLASS_IMAGES = {
  standard: 'https://iway.io/images/new-template/car-classes-slider/standard.webp',
  comfort:  'https://iway.io/images/new-template/car-classes-slider/comfort.webp',
  'business light': 'https://iway.io/images/new-template/car-classes-slider/business-lite.webp',
  'business lite':  'https://iway.io/images/new-template/car-classes-slider/business-lite.webp',
  business: 'https://iway.io/images/new-template/car-classes-slider/business.webp',
  luxury:   'https://iway.io/images/new-template/car-classes-slider/luxury.webp',
  minivan:  'https://iway.io/images/new-template/car-classes-slider/minivan.webp',
  'minivan vip': 'https://iway.io/images/new-template/car-classes-slider/minivan-vip.webp',
  suv:      'https://iway.io/images/new-template/car-classes-slider/suv.webp',
  minibus:  'https://iway.io/images/new-template/car-classes-slider/minibus.webp',
};

function getCarImage(title = '') {
  const key = title.toLowerCase();
  // Try exact match, then partial
  if (CAR_CLASS_IMAGES[key]) return CAR_CLASS_IMAGES[key];
  for (const k of Object.keys(CAR_CLASS_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return CAR_CLASS_IMAGES[k];
  }
  return CAR_CLASS_IMAGES.standard;
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `~${h}h ${m > 0 ? ` ${m}m` : ''}`.trim();
  return `~${m} min`;
}

function formatSymbol(currency = 'GBP') {
  if (currency === 'GBP') return '£';
  if (currency === 'EUR') return '€';
  if (currency === 'USD') return '$';
  return currency + ' ';
}

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

function TrustStrip() {
  return (
    <div className="bg-slate-900 text-white px-6 py-2.5">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <Lock size={12} className="text-green-400" />
          Secure booking
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <Confetti size={12} className="text-[#d4af37]" />
          Instant confirmation
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <ShieldCheck size={12} className="text-blue-400" />
          Trusted transfer partner
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <Phone size={12} className="text-purple-400" />
          24/7 support
        </span>
      </div>
    </div>
  );
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
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to find transfers for this route. Please try a different location or use our quote form.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (vehicle) => {
    const params = new URLSearchParams({
      from_place_id: results.from_place.place_id,
      to_place_id: results.to_place.place_id,
      car_class_id: vehicle.car_class?.car_class_id || '',
    });
    navigate(`/book?${params.toString()}`);
  };

  if (!searchData) return null;

  const formatDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

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
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            data-testid="modify-search-btn"
          >
            <ArrowLeft size={16} />
            Modify Search
          </button>
        </div>
      </nav>

      {/* Trust Strip */}
      <TrustStrip />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Progress Steps */}
        <ProgressSteps step={2} />

        {/* Route Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-6 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Your Transfer</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Pickup</p>
                <p className="font-semibold text-slate-900 text-sm truncate">{searchData.pickup_location}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300 flex-shrink-0 hidden sm:block" />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Dropoff</p>
                <p className="font-semibold text-slate-900 text-sm truncate">{searchData.dropoff_location}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
              <span className="flex items-center gap-1"><Users size={14} />{searchData.passengers} pax</span>
              <span>{formatDate(searchData.pickup_date)}</span>
              <span>{searchData.pickup_time}</span>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4" data-testid="iway-loading">
            <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-700 font-semibold">Searching available vehicles...</p>
            <p className="text-slate-400 text-sm">Checking live availability and prices</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16" data-testid="iway-error">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Warning size={32} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Results Found</h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchResults}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                data-testid="retry-search-btn"
              >
                <ArrowsClockwise size={18} />Try Again
              </button>
              <button
                onClick={() => navigate('/quote')}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                Request a Quote
              </button>
              <a
                href="/book"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#d4af37] text-white rounded-lg hover:bg-[#b8952e] transition-colors text-sm font-medium"
              >
                Open Booking Engine
              </a>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results && !error && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-semibold text-slate-900" data-testid="results-heading">
                <span className="text-lg">{results.vehicles.length} vehicles</span>
                <span className="text-slate-500 font-normal text-sm ml-1.5">available for your transfer</span>
              </h1>
            </div>

            <div className="space-y-4" data-testid="vehicle-results">
              {results.vehicles.map((vehicle, idx) => {
                const cc = vehicle.car_class || {};
                const title = cc.title || 'Standard';
                const models = (cc.models || []).join(', ');
                const capacity = cc.capacity || vehicle.capacity;
                const luggage = cc.luggage_capacity;
                const price = vehicle.price;
                const sym = formatSymbol(vehicle.currency);
                const duration = formatDuration(vehicle.travel_time);
                const distance = vehicle.distance ? `${Math.round(vehicle.distance)} km` : null;
                const services = vehicle.class_services || [];

                return (
                  <div
                    key={vehicle.price_id || idx}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-[#d4af37]/40 hover:shadow-md transition-all duration-200 overflow-hidden"
                    data-testid={`vehicle-card-${idx}`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Image panel */}
                      <div className="sm:w-44 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 flex-shrink-0">
                        <img
                          src={getCarImage(title)}
                          alt={`${title} class transfer vehicle`}
                          className="h-24 w-auto object-contain drop-shadow-sm"
                          onError={(e) => { e.target.src = CAR_CLASS_IMAGES.standard; }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-base font-bold text-slate-900">{title}</h2>
                            {models && (
                              <p className="text-xs text-slate-400 mt-0.5">{models} or similar</p>
                            )}
                          </div>
                          {/* Pricing block */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Starts from</p>
                            <p className="text-2xl font-bold text-slate-900 leading-tight">{sym}{price}</p>
                            <p className="text-xs text-slate-400">one way *</p>
                          </div>
                        </div>

                        {/* Specs row */}
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                          {capacity && (
                            <span className="flex items-center gap-1.5">
                              <Users size={13} className="text-slate-400" />
                              Up to {capacity} passengers
                            </span>
                          )}
                          {luggage != null && (
                            <span className="flex items-center gap-1.5">
                              <Suitcase size={13} className="text-slate-400" />
                              {luggage} bags
                            </span>
                          )}
                          {duration && (
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} className="text-slate-400" />
                              {duration}
                            </span>
                          )}
                          {distance && (
                            <span className="text-slate-400">{distance}</span>
                          )}
                        </div>

                        {/* Services */}
                        {services.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                            {services.slice(0, 4).map((s) => (
                              <span key={s.id} className="flex items-center gap-1 text-[11px] text-green-700">
                                <CheckCircle size={11} weight="fill" className="text-green-500 flex-shrink-0" />
                                {s.title}{s.value ? ` (${s.value} min)` : ''}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* CTA row */}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Star size={11} weight="fill" className="text-[#d4af37]" />
                            <span>{vehicle.service_provider?.rating || 5}.0 rated driver</span>
                          </div>
                          <button
                            onClick={() => handleBook(vehicle)}
                            className="btn-gold py-2.5 px-5 text-sm flex items-center gap-2"
                            data-testid={`book-vehicle-btn-${idx}`}
                          >
                            Book Now
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-xs text-amber-800 text-center leading-relaxed">
                * Estimated price based on route and demand. Final price confirmed after booking.
                Free cancellation may apply — see booking terms for details.
              </p>
            </div>

            {/* Bottom trust row */}
            <div className="flex flex-wrap justify-center gap-5 mt-5 pb-4">
              {[
                { icon: Lock, color: 'text-green-500', label: 'Secure payment' },
                { icon: Confetti, color: 'text-[#d4af37]', label: 'Instant confirmation' },
                { icon: ShieldCheck, color: 'text-blue-500', label: 'Trusted partner' },
                { icon: Phone, color: 'text-purple-500', label: '24/7 support' },
              ].map(({ icon: Icon, color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon size={13} className={color} />
                  {label}
                </span>
              ))}
            </div>
          </>
        )}
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
