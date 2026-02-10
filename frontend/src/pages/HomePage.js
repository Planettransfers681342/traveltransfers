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
  Star,
  WhatsappLogo,
  CaretDown
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WHATSAPP_NUMBER = "447739476432";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi, I'd like to book a transfer with Planet Transfers");

// Hero Images
const HERO_IMAGE = "https://images.unsplash.com/photo-1733879075560-ff1f9ef8281c?crop=entropy&cs=srgb&fm=jpg&q=85";

// Fleet Images
const FLEET_IMAGES = {
  economy: "https://images.unsplash.com/photo-1656200149554-15998526487e?crop=entropy&cs=srgb&fm=jpg&q=85",
  business: "https://images.unsplash.com/photo-1618480483701-c31ac5590db4?crop=entropy&cs=srgb&fm=jpg&q=85",
  group: "https://images.unsplash.com/photo-1656200149554-15998526487e?crop=entropy&cs=srgb&fm=jpg&q=85",
  bus: "https://images.unsplash.com/photo-1689977140799-c7e8692ab497?crop=entropy&cs=srgb&fm=jpg&q=85"
};

// Location Images
const LOCATION_IMAGES = {
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80",
  madrid: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80",
  seychelles: "https://images.unsplash.com/photo-1537551080512-358ecdf268dc?auto=format&fit=crop&q=80",
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

  useEffect(() => {
    // Seed data on first load
    axios.post(`${API}/seed`).catch(() => {});
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bookingData = {
      ...formData,
      trip_type: tripType
    };
    navigate('/booking', { state: bookingData });
  };

  const features = [
    { icon: <MapPin size={32} weight="light" />, title: "Door to Door Service", desc: "From the airport directly to your destination" },
    { icon: <CarSimple size={32} weight="light" />, title: "Private Transfers", desc: "Exclusive service, no shared rides" },
    { icon: <Users size={32} weight="light" />, title: "Meet & Greet", desc: "Driver meets you at arrivals with name sign" },
    { icon: <Airplane size={32} weight="light" />, title: "Flight Tracking", desc: "We monitor your flight for delays" },
  ];

  const fleet = [
    { id: "economy", name: "Economy Class", desc: "Perfect for couples or small families", passengers: 4, luggage: 3, image: FLEET_IMAGES.economy },
    { id: "business", name: "Business Class", desc: "Luxury vehicles for business travelers", passengers: 4, luggage: 4, image: FLEET_IMAGES.business },
    { id: "group", name: "Group Transfer", desc: "Spacious vans for larger groups", passengers: 8, luggage: 8, image: FLEET_IMAGES.group },
    { id: "bus", name: "Full Size Bus", desc: "Coach buses for large groups", passengers: 50, luggage: 50, image: FLEET_IMAGES.bus },
  ];

  const testimonials = [
    { text: "Exceptional service! Driver was punctual and very professional. The car was spotless and comfortable.", author: "Sarah Johnson", route: "London Heathrow to City Center" },
    { text: "Best transfer service I've used. Booking was easy and the driver tracked my flight delay.", author: "Michael Torres", route: "Madrid Airport Transfer" },
    { text: "Professional, reliable, and great value. The driver helped with luggage and knew the best routes.", author: "Emma Williams", route: "Seychelles Island Transfer" },
    { text: "Smooth booking process and excellent communication. Will definitely use again for my business trips.", author: "David Chen", route: "Business Class Service" },
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
          <div className="hidden md:flex items-center gap-8">
            <a href="#fleet" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Fleet</a>
            <a href="#locations" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Destinations</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
              <WhatsappLogo size={20} weight="fill" />
              Contact
            </a>
          </div>
          <a href="/admin" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Admin</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="hero-section pt-20"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        data-testid="hero-section"
      >
        <div className="hero-overlay"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="text-white fade-in">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6">
                Worldwide Premium Airport Transfers
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-lg">
                Book your reliable transfer service with ease. Professional drivers, premium vehicles, and unmatched service.
              </p>
            </div>

            {/* Booking Widget */}
            <div className="booking-widget glass-card p-8 fade-in fade-in-delay-2" data-testid="booking-widget">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">Book Your Transfer</h2>
              
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
                  <div className="relative">
                    <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="pickup_location"
                      value={formData.pickup_location}
                      onChange={handleInputChange}
                      className="input-field pl-12"
                      required
                      data-testid="pickup-location"
                    >
                      <option value="">Select pickup location</option>
                      {POPULAR_ROUTES.map(route => (
                        <option key={route.from} value={route.from}>{route.from}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dropoff Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dropoff Location *</label>
                  <div className="relative">
                    <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="dropoff_location"
                      value={formData.dropoff_location}
                      onChange={handleInputChange}
                      className="input-field pl-12"
                      required
                      data-testid="dropoff-location"
                    >
                      <option value="">Select dropoff location</option>
                      {POPULAR_ROUTES.map(route => (
                        <option key={route.to} value={route.to}>{route.to}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Date *</label>
                    <div className="relative">
                      <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        name="pickup_date"
                        value={formData.pickup_date}
                        onChange={handleInputChange}
                        className="input-field pl-12"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        data-testid="pickup-date"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Time *</label>
                    <div className="relative">
                      <Clock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="time"
                        name="pickup_time"
                        value={formData.pickup_time}
                        onChange={handleInputChange}
                        className="input-field pl-12"
                        required
                        data-testid="pickup-time"
                      />
                    </div>
                  </div>
                </div>

                {/* Passengers & Luggage */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Passengers & Luggage</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                      className="input-field flex items-center justify-between text-left"
                      data-testid="passengers-luggage-btn"
                    >
                      <span className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users size={18} className="text-slate-400" />
                          {formData.passengers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Suitcase size={18} className="text-slate-400" />
                          {formData.luggage}
                        </span>
                      </span>
                      <CaretDown size={18} className="text-slate-400" />
                    </button>
                    
                    {showPassengerDropdown && (
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
                    )}
                  </div>
                </div>

                <button type="submit" className="btn-gold w-full flex items-center justify-center gap-2" data-testid="continue-btn">
                  Continue to Vehicle Selection
                  <ArrowRight size={20} />
                </button>
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
                  <img src={vehicle.image} alt={vehicle.name} />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{vehicle.name}</h3>
                  <p className="text-slate-600 text-sm mb-4">{vehicle.desc}</p>
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

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4">What Our Clients Say</h2>
            <p className="text-lg text-slate-600">Trusted by thousands of satisfied customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="testimonial-card fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} weight="fill" className="text-[#d4af37]" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 relative z-10">"{testimonial.text}"</p>
                <div className="mt-auto">
                  <p className="font-semibold text-slate-900">{testimonial.author}</p>
                  <p className="text-sm text-slate-500">{testimonial.route}</p>
                </div>
              </div>
            ))}
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
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <CarSimple size={32} weight="fill" className="text-[#d4af37]" />
                <span className="font-['Playfair_Display'] text-2xl font-semibold text-[#d4af37]">Planet Transfers</span>
              </div>
              <p className="text-white/70 max-w-md">
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
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <WhatsappLogo size={18} weight="fill" className="text-green-400" />
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={18} />
                  <span>+44 773 947 6432</span>
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
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`} 
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
