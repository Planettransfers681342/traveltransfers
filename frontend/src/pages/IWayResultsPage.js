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
  Clock
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const IWAY_USER_ID = '143708';

// iWay car class images from their CDN
const CAR_CLASS_IMAGES = {
  standard: 'https://iway.io/images/new-template/car-classes-slider/standard.webp',
  comfort: 'https://iway.io/images/new-template/car-classes-slider/comfort.webp',
  'business light': 'https://iway.io/images/new-template/car-classes-slider/business-lite.webp',
  'business lite': 'https://iway.io/images/new-template/car-classes-slider/business-lite.webp',
  business: 'https://iway.io/images/new-template/car-classes-slider/business.webp',
  luxury: 'https://iway.io/images/new-template/car-classes-slider/luxury.webp',
  minivan: 'https://iway.io/images/new-template/car-classes-slider/minivan.webp',
  'minivan vip': 'https://iway.io/images/new-template/car-classes-slider/minivan-vip.webp',
  suv: 'https://iway.io/images/new-template/car-classes-slider/suv.webp',
  minibus: 'https://iway.io/images/new-template/car-classes-slider/minibus.webp',
};

function getCarImage(title = '') {
  const key = title.toLowerCase();
  return CAR_CLASS_IMAGES[key] || CAR_CLASS_IMAGES['standard'];
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `~${h}h ${m}m`;
  return `~${m} min`;
}

export default function IWayResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchData = location.state;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!searchData) {
      navigate('/');
      return;
    }
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API}/iway/search`, {
        params: {
          pickup: searchData.pickup_location,
          dropoff: searchData.dropoff_location,
          currency: 'GBP',
          lang: 'en'
        }
      });
      setResults(response.data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Unable to find transfers for this route. Please try a different location or use our quote form.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBookVehicle = (vehicle, fromPlaceId, toPlaceId) => {
    // Build the iWay booking URL with pre-filled locations and vehicle class
    const params = new URLSearchParams({
      from_place_id: fromPlaceId,
      to_place_id: toPlaceId,
      car_class_id: vehicle.car_class?.car_class_id || '',
    });
    navigate(`/book?${params.toString()}`);
  };

  if (!searchData) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={32} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            Modify Search
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Route Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Pickup</p>
                <p className="font-semibold text-slate-900 truncate">{searchData.pickup_location}</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-300 flex-shrink-0 hidden sm:block" />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Dropoff</p>
                <p className="font-semibold text-slate-900 truncate">{searchData.dropoff_location}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 flex-shrink-0">
              <span className="flex items-center gap-1">
                <Users size={15} />
                {searchData.passengers}
              </span>
              <span>{searchData.pickup_date}</span>
              <span>{searchData.pickup_time}</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4" data-testid="iway-loading">
            <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-medium">Searching available vehicles...</p>
            <p className="text-slate-400 text-sm">Checking live availability and prices</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16" data-testid="iway-error">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Warning size={32} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Direct Results Found</h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchResults}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                data-testid="retry-search-btn"
              >
                <ArrowsClockwise size={18} />
                Try Again
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
              <h1 className="text-lg font-semibold text-slate-900" data-testid="results-heading">
                {results.vehicles.length} vehicle{results.vehicles.length !== 1 ? 's' : ''} available
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-green-500" />
                Powered by iWay — live prices
              </div>
            </div>

            <div className="space-y-4" data-testid="vehicle-results">
              {results.vehicles.map((vehicle, idx) => {
                const carClass = vehicle.car_class || {};
                const title = carClass.title || 'Standard';
                const models = (carClass.models || []).join(', ');
                const capacity = carClass.capacity || vehicle.capacity;
                const luggage = carClass.luggage_capacity;
                const price = vehicle.price;
                const currency = vehicle.currency || 'GBP';
                const duration = formatDuration(vehicle.travel_time);
                const distance = vehicle.distance ? `${vehicle.distance.toFixed(0)} km` : null;
                const services = vehicle.class_services || [];
                const img = getCarImage(title);

                return (
                  <div
                    key={vehicle.price_id || idx}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    data-testid={`vehicle-card-${idx}`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Car Image */}
                      <div className="sm:w-48 bg-slate-50 flex items-center justify-center p-4 flex-shrink-0">
                        <img
                          src={img}
                          alt={`${title} transfer vehicle`}
                          className="h-28 w-auto object-contain"
                          onError={(e) => { e.target.src = CAR_CLASS_IMAGES.standard; }}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                            {models && (
                              <p className="text-sm text-slate-500 mt-0.5">{models} or similar</p>
                            )}
                          </div>
                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-bold text-slate-900">
                              {currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}{price}
                            </p>
                            <p className="text-xs text-slate-400">one way</p>
                          </div>
                        </div>

                        {/* Capacity + Distance */}
                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600">
                          {capacity && (
                            <span className="flex items-center gap-1.5">
                              <Users size={15} className="text-slate-400" />
                              Up to {capacity} passengers
                            </span>
                          )}
                          {luggage && (
                            <span className="flex items-center gap-1.5">
                              <Suitcase size={15} className="text-slate-400" />
                              {luggage} bags
                            </span>
                          )}
                          {duration && (
                            <span className="flex items-center gap-1.5">
                              <Clock size={15} className="text-slate-400" />
                              {duration}
                            </span>
                          )}
                          {distance && (
                            <span className="text-slate-400">{distance}</span>
                          )}
                        </div>

                        {/* Services */}
                        {services.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                            {services.slice(0, 4).map((s) => (
                              <span key={s.id} className="flex items-center gap-1 text-xs text-green-700">
                                <CheckCircle size={12} weight="fill" className="text-green-500" />
                                {s.title}{s.value ? ` (${s.value} min)` : ''}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Star size={12} weight="fill" className="text-[#d4af37]" />
                            {vehicle.service_provider?.rating || 5}.0 rated
                          </div>
                          <button
                            onClick={() => handleBookVehicle(vehicle, results.from_place.place_id, results.to_place.place_id)}
                            className="btn-gold py-2.5 px-6 text-sm flex items-center gap-2"
                            data-testid={`book-vehicle-btn-${idx}`}
                          >
                            Book Now
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-slate-400 mt-6">
              Prices shown are live estimates from iWay. Final price confirmed at checkout.
              Free cancellation applies — see booking terms.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-green-500" />
                Secure payment
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle size={14} className="text-blue-500" />
                Instant confirmation
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={14} className="text-amber-500" />
                Free waiting time included
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
