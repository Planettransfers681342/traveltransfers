import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CarSimple, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Suitcase,
  ArrowRight,
  CheckCircle,
  Phone,
  Airplane,
  WhatsappLogo,
  CaretDown,
  Envelope,
  AirplaneLanding,
  Warning,
  ShieldCheck,
  CurrencyGbp,
  Headset,
  Medal,
  Globe,
  Lightning
} from '@phosphor-icons/react';
import axios from 'axios';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { CurrencySelector } from '../components/CurrencySelector';
import { useCurrency } from '../context/CurrencyContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WHATSAPP_NUMBER = "447739476432";
// openWhatsApp import removed — links now use plain <a href> tags
import { trackEvent } from '../utils/analytics';

// Hero Images
const HERO_IMAGE = "https://static.prod-images.emergentagent.com/jobs/bdf6f771-1f03-411b-9d3c-236b42d26b33/images/cc81389a63562a8e56aeb8add76427b4e10b593ddd3d0c4cf0206c0bf4098405.png";

// Fleet Images — stable production sources
const FLEET_IMAGES = {
  standard:  "https://images.pexels.com/photos/6191762/pexels-photo-6191762.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  executive: "https://images.unsplash.com/photo-1592222269733-1d44ea5ab43b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
  minivan:   "https://images.pexels.com/photos/17455625/pexels-photo-17455625.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  minibus:   "https://images.pexels.com/photos/19871521/pexels-photo-19871521.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
};

// Location Images
const LOCATION_IMAGES = {
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80",
  madrid: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80",
  seychelles: "https://images.unsplash.com/photo-1769961262833-b048f52633a8?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
  switzerland: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80"
};

// Popular Routes
const POPULAR_ROUTES = [
  { from: "London Heathrow", to: "London City Center" },
  { from: "London Gatwick", to: "London City Center" },
  { from: "London Stansted", to: "London City Center" },
  { from: "Madrid Airport", to: "Madrid City Center" },
  { from: "Seychelles Airport", to: "Mahé Hotels" },
  { from: "Zurich Airport", to: "Zurich City Center" },
  { from: "Geneva Airport", to: "Geneva City Center" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [tripType, setTripType] = useState('one-way');
  const [formData, setFormData] = useState({
    pickup_location: '',
    dropoff_location: '',
    pickup_date: '',
    pickup_time: '',
    passengers: 2,
    luggage: 2
  });
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    // Seed data on first load
    axios.post(`${API}/seed`).catch(() => {});
  }, []);

  // Validate 24-hour rule
  const validatePickupTime = (date, time) => {
    if (!date || !time) return true; // Don't show error if fields are empty
    
    const now = new Date();
    const pickupDateTime = new Date(`${date}T${time}`);
    const minPickupTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    if (pickupDateTime < minPickupTime) {
      setTimeError('Pick-up must be at least 24 hours in advance.');
      return false;
    }
    
    setTimeError('');
    return true;
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Validate time when date or time changes
    if (name === 'pickup_date' || name === 'pickup_time') {
      validatePickupTime(
        name === 'pickup_date' ? value : formData.pickup_date,
        name === 'pickup_time' ? value : formData.pickup_time
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Final validation before submit
    if (!validatePickupTime(formData.pickup_date, formData.pickup_time)) {
      return;
    }
    
    const bookingData = {
      ...formData,
      trip_type: tripType,
      currency,
    };

    trackEvent('search_started', {
      pickup: formData.pickup_location,
      dropoff: formData.dropoff_location,
      date: formData.pickup_date,
      passengers: formData.passengers,
      trip_type: tripType,
    });

    // Navigate to iWay results page to show live vehicle options
    navigate('/results', { state: bookingData });
  };

  const isFormValid = () => {
    return (
      formData.pickup_location &&
      formData.dropoff_location &&
      formData.pickup_date &&
      formData.pickup_time &&
      !timeError
    );
  };

  const features = [
    { icon: <MapPin size={32} weight="light" />, title: "Door to Door Service", desc: "From the airport directly to your destination" },
    { icon: <CarSimple size={32} weight="light" />, title: "Private Transfers", desc: "Exclusive service, no shared rides" },
    { icon: <Users size={32} weight="light" />, title: "Meet & Greet", desc: "Driver meets you at arrivals with name sign" },
    { icon: <Airplane size={32} weight="light" />, title: "Flight Tracking", desc: "We monitor your flight for delays" },
  ];

  const fleet = [
    { id: "standard",  name: "Standard",       desc: "Reliable everyday saloons for comfortable transfers",     passengers: 3,  luggage: 2,  image: FLEET_IMAGES.standard,  alt: "Standard airport transfer — Toyota Prius or similar" },
    { id: "executive", name: "Executive",       desc: "Premium business saloons for a professional journey",     passengers: 4,  luggage: 3,  image: FLEET_IMAGES.executive, alt: "Executive airport transfer — Mercedes E-Class or similar" },
    { id: "minivan",   name: "Minivan / MPV",   desc: "Spacious people carriers perfect for families with luggage", passengers: 7, luggage: 5, image: FLEET_IMAGES.minivan,   alt: "Minivan airport transfer — Mercedes Vito or similar" },
    { id: "minibus",   name: "Minibus",         desc: "Comfortable minibuses for larger groups and events",      passengers: 16, luggage: 16, image: FLEET_IMAGES.minibus,   alt: "Minibus airport transfer — Mercedes Sprinter or similar" },
  ];

  const locations = [
    { name: "London", airports: "Heathrow, Gatwick, Stansted", desc: "Premium transfers across all London airports", image: LOCATION_IMAGES.london },
    { name: "Madrid", airports: "Madrid-Barajas Airport", desc: "Reliable service throughout Madrid region", image: LOCATION_IMAGES.madrid },
    { name: "Seychelles", airports: "Seychelles International", desc: "Luxury island transfers and tours", image: LOCATION_IMAGES.seychelles },
    { name: "Switzerland", airports: "Zurich, Geneva, Basel", desc: "Professional transfers across Swiss cities", image: LOCATION_IMAGES.switzerland },
  ];

  const steps = [
    { num: "01", title: "Fill the Booking Form", desc: "Enter your pickup and dropoff locations, date, time, and passenger details." },
    { num: "02", title: "Select Your Vehicle", desc: "Choose from our fleet of economy, business, or group vehicles." },
    { num: "03", title: "Complete Payment", desc: "Pay securely online with card via Stripe. Instant confirmation." },
    { num: "04", title: "Enjoy Your Ride", desc: "Your driver will be ready at your pickup location on time!" },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CarSimple size={32} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>
            <a 
              href="/book"
              className="btn-gold py-2.5 px-4 sm:px-5 flex items-center gap-2 text-sm"
              data-testid="book-now-btn"
            >
              Book Now
            </a>
            <button 
              onClick={() => {
                const params = {};
                if (formData.pickup_location)  params.from = formData.pickup_location;
                if (formData.dropoff_location) params.to   = formData.dropoff_location;
                const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
                window.open(`/quote${qs}`, '_blank', 'width=800,height=900,scrollbars=yes');
              }}
              className="flex items-center gap-2 text-sm font-semibold text-[#d4af37] border-2 border-[#d4af37] hover:bg-[#d4af37] hover:text-white transition-all px-4 sm:px-5 py-2.5 rounded-lg"
              data-testid="request-quote-btn"
            >
              Request Quote
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="hero-section pt-20"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        data-testid="hero-section"
      >
        <div className="hero-overlay"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="text-white fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Playfair_Display'] font-semibold leading-tight mb-6">
                Premium Airport Transfers Worldwide
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg leading-relaxed">
                Trusted by international travellers. Professional drivers, fixed prices, and comfortable vehicles for your journey.
              </p>
              
              {/* Hero Trust Signals */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <CheckCircle size={24} weight="fill" className="text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium">Free Cancellation</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <Users size={24} weight="fill" className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium">Meet & Greet Included</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <ShieldCheck size={24} weight="fill" className="text-amber-400 flex-shrink-0" />
                  <span className="text-sm font-medium">Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <Headset size={24} weight="fill" className="text-purple-400 flex-shrink-0" />
                  <span className="text-sm font-medium">24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Booking Widget */}
            <div className="booking-widget glass-card p-8 fade-in fade-in-delay-2" id="booking-form" data-testid="booking-widget">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-slate-900">Book Your Transfer</h2>
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <ShieldCheck size={16} weight="fill" />
                  <span>Secure</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-6">Instant confirmation · No hidden fees</p>
              
              {/* Trip Type Toggle */}
              <div className="flex mb-6 bg-slate-100 p-1 rounded-sm">
                <button 
                  onClick={() => setTripType('one-way')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tripType === 'one-way' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  data-testid="trip-type-oneway"
                >
                  One-way
                </button>
                <button 
                  onClick={() => setTripType('round-trip')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tripType === 'round-trip' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  data-testid="trip-type-roundtrip"
                >
                  Round-trip
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pickup Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Location *</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <AirplaneLanding size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <AddressAutocomplete
                        name="pickup_location"
                        value={formData.pickup_location}
                        onChange={handleInputChange}
                        placeholder="Airport, hotel, or address..."
                        required
                        dataTestId="pickup-location"
                      />
                    </div>
                  </div>
                </div>

                {/* Dropoff Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dropoff Location *</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <MapPin size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <AddressAutocomplete
                        name="dropoff_location"
                        value={formData.dropoff_location}
                        onChange={handleInputChange}
                        placeholder="Airport, hotel, or address..."
                        required
                        dataTestId="dropoff-location"
                      />
                    </div>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Date *</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Calendar size={20} className="text-amber-600" />
                      </div>
                      <input
                        type="date"
                        name="pickup_date"
                        value={formData.pickup_date}
                        onChange={handleInputChange}
                        className="input-field flex-1"
                        required
                        min={getMinDate()}
                        data-testid="pickup-date"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Time *</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock size={20} className="text-blue-600" />
                      </div>
                      <input
                        type="time"
                        name="pickup_time"
                        value={formData.pickup_time}
                        onChange={handleInputChange}
                        className="input-field flex-1"
                        required
                        data-testid="pickup-time"
                      />
                    </div>
                  </div>
                </div>

                {/* 24-hour warning */}
                {timeError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded" data-testid="time-error">
                    <Warning size={18} weight="fill" />
                    {timeError}
                  </div>
                )}

                {/* Passengers & Luggage */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Passengers & Luggage</label>
                  <button
                    type="button"
                    onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                    className="input-field flex items-center justify-between text-left w-full"
                    data-testid="passengers-luggage-btn"
                  >
                    <span className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Users size={16} className="text-slate-400" /> {formData.passengers}</span>
                      <span className="flex items-center gap-1"><Suitcase size={16} className="text-slate-400" /> {formData.luggage}</span>
                    </span>
                    <CaretDown size={18} className="text-slate-400" />
                  </button>
                  
                  {showPassengerDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowPassengerDropdown(false)}></div>
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-lg p-4 z-20">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-slate-700">Passengers</span>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setFormData({...formData, passengers: Math.max(1, formData.passengers - 1)})} className="w-8 h-8 border border-slate-300 flex items-center justify-center hover:bg-slate-50">-</button>
                            <span className="w-8 text-center">{formData.passengers}</span>
                            <button type="button" onClick={() => setFormData({...formData, passengers: Math.min(50, formData.passengers + 1)})} className="w-8 h-8 border border-slate-300 flex items-center justify-center hover:bg-slate-50">+</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">Luggage</span>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setFormData({...formData, luggage: Math.max(0, formData.luggage - 1)})} className="w-8 h-8 border border-slate-300 flex items-center justify-center hover:bg-slate-50">-</button>
                            <span className="w-8 text-center">{formData.luggage}</span>
                            <button type="button" onClick={() => setFormData({...formData, luggage: Math.min(50, formData.luggage + 1)})} className="w-8 h-8 border border-slate-300 flex items-center justify-center hover:bg-slate-50">+</button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-gold w-full flex items-center justify-center gap-2 relative z-0 disabled:opacity-50 disabled:cursor-not-allowed" 
                  data-testid="continue-btn"
                  disabled={!isFormValid()}
                >
                  Search Available Vehicles
                  <ArrowRight size={20} />
                </button>

                {/* Return transfer / Quote secondary CTA */}
                <div className="text-center pt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1.5 font-medium">Need a return transfer or a custom route?</p>
                  <p className="text-xs text-slate-400 mb-2">Our one-way search covers most airport routes. For return trips, include your return date, time, and flight details in a quote request.</p>
                  <button
                    type="button"
                    onClick={() => {
                      const params = {};
                      if (formData.pickup_location)  params.from = formData.pickup_location;
                      if (formData.dropoff_location) params.to   = formData.dropoff_location;
                      const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
                      window.open(`/quote${qs}`, '_blank', 'width=800,height=900,scrollbars=yes');
                    }}
                    className="text-sm font-semibold text-[#d4af37] hover:underline"
                    data-testid="quote-cta-below-form"
                  >
                    Request a return or custom quote →
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4">Why Choose Planet Transfers?</h2>
            <p className="text-lg text-slate-600">Premium service with unmatched reliability</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="text-[#d4af37] mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section id="fleet" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4">Our Fleet</h2>
            <p className="text-lg text-slate-600">Choose the perfect vehicle for your journey</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {fleet.map((vehicle, idx) => (
              <div key={vehicle.id} className="fleet-card fade-in" style={{ animationDelay: `${idx * 0.1}s` }} data-testid={`fleet-card-${vehicle.id}`}>
                <div className="overflow-hidden">
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.alt}
                    loading="lazy"
                    width="400"
                    height="267"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">{vehicle.name}</h3>
                  <p className="text-slate-600 text-sm mb-3">{vehicle.desc}</p>
                  <p className="text-xs text-slate-400 italic mb-4">
                    {vehicle.id === 'standard'  && 'Toyota Prius, VW Passat or similar vehicle'}
                    {vehicle.id === 'executive' && 'Mercedes E-Class, BMW 5 Series or similar vehicle'}
                    {vehicle.id === 'minivan'   && 'Mercedes Vito, VW Transporter or similar vehicle'}
                    {vehicle.id === 'minibus'   && 'Mercedes Sprinter, Ford Transit or similar vehicle'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={16} /> Up to {vehicle.passengers}
                    </span>
                    <span className="flex items-center gap-1">
                      <Suitcase size={16} /> {vehicle.luggage} bags
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section - SEO Task 7 */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Why Travellers Choose Us</h2>
            <p className="text-slate-400">Reliable, professional airport transfers worldwide</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Medal size={32} className="text-[#d4af37]" />
              </div>
              <p className="font-medium">Best Price Guarantee</p>
              <p className="text-sm text-slate-400 mt-1">Competitive rates always</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} className="text-[#d4af37]" />
              </div>
              <p className="font-medium">Professional Vetted Drivers</p>
              <p className="text-sm text-slate-400 mt-1">Licensed & insured</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyGbp size={32} className="text-[#d4af37]" />
              </div>
              <p className="font-medium">No Hidden Costs</p>
              <p className="text-sm text-slate-400 mt-1">Transparent pricing</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe size={32} className="text-[#d4af37]" />
              </div>
              <p className="font-medium">Global Airport Coverage</p>
              <p className="text-sm text-slate-400 mt-1">500+ airports worldwide</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightning size={32} className="text-[#d4af37]" />
              </div>
              <p className="font-medium">Fast & Reliable Service</p>
              <p className="text-sm text-slate-400 mt-1">On-time guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Simple steps to book your transfer</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="text-5xl font-['Playfair_Display'] text-[#d4af37] mb-4">{step.num}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="locations" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4">Service Areas</h2>
            <p className="text-lg text-slate-600">We serve airports worldwide</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {locations.map((location, idx) => (
              <div key={idx} className="location-card fade-in" style={{ animationDelay: `${idx * 0.1}s` }} data-testid={`location-${location.name.toLowerCase()}`}>
                <img src={location.image} alt={location.name} />
                <div className="overlay">
                  <h3 className="text-2xl font-semibold">{location.name}</h3>
                  <p className="text-sm text-white/80">{location.airports}</p>
                  <p className="text-sm text-white/60 mt-1">{location.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <CarSimple size={32} weight="fill" className="text-[#d4af37]" />
                <span className="font-['Playfair_Display'] text-2xl font-semibold text-[#d4af37]">Planet Transfers</span>
              </div>
              <p className="text-white/70">
                Premium airport transfer service operating worldwide. Reliable, professional, and always on time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#fleet">Our Fleet</a></li>
                <li><a href="#locations">Destinations</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/terms-and-conditions">Terms &amp; Conditions</a></li>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><a href="/cookie-policy">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <WhatsappLogo size={18} weight="fill" className="text-green-400" />
                  <a
                    href="https://wa.me/447739476432?text=Hi%2C%20I%27d%20like%20help%20with%20a%20transfer%20booking"
                    target="_blank"
                    rel="noopener noreferrer"
                  >WhatsApp</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={18} />
                  <span>+44 773 947 6432</span>
                </li>
                <li className="flex items-center gap-2">
                  <Envelope size={18} />
                  <a href="mailto:GBRoyaltransfers@gmail.com">GBRoyaltransfers@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/50 text-sm">
            <p>&copy; {new Date().getFullYear()} Planet Transfers. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      <a
        href="https://wa.me/447739476432?text=Hi%2C%20I%27d%20like%20help%20with%20a%20transfer%20booking"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        data-testid="whatsapp-float"
      >
        <WhatsappLogo size={28} weight="fill" />
      </a>
    </div>
  );
}
