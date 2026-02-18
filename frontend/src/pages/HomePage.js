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
  CaretDown,
  Envelope,
  AirplaneTakeoff,
  AirplaneLanding,
  Warning
} from '@phosphor-icons/react';
import axios from 'axios';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WHATSAPP_NUMBER = "447739476432";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi, I'd like to book a transfer with Planet Transfers");

// Hero Images
const HERO_IMAGE = "https://images.unsplash.com/photo-1733879075560-ff1f9ef8281c?crop=entropy&cs=srgb&fm=jpg&q=85";

// Fleet Images
const FLEET_IMAGES = {
  economy: "https://customer-assets.emergentagent.com/job_continue-chat-14/artifacts/zjojrhht_image.png",
  business: "https://customer-assets.emergentagent.com/job_continue-chat-14/artifacts/fio8po2v_image.png",
  group: "https://customer-assets.emergentagent.com/job_continue-chat-14/artifacts/q24v6sx4_image.png",
  bus: "https://customer-assets.emergentagent.com/job_continue-chat-14/artifacts/nie3ba6i_image.png"
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
      trip_type: tripType
    };
    navigate('/booking', { state: bookingData });
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
    { id: "economy", name: "Standard Class", desc: "Perfect for couples or small families", passengers: 4, luggage: 3, image: FLEET_IMAGES.economy },
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
          <div className="flex items-center gap-6">
            <button 
              onClick={() => window.open('/quote', '_blank', 'width=800,height=900,scrollbars=yes')}
              className="btn-gold py-3 px-6 flex items-center gap-2 text-sm"
              data-testid="request-quote-btn"
            >
              Request Quote
            </button>
            <a href="/admin" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Admin</a>
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
            <div className="booking-widget glass-card p-8 fade-in fade-in-delay-2" id="booking-form" data-testid="booking-widget">
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
                  <AddressAutocomplete
                    name="pickup_location"
                    value={formData.pickup_location}
                    onChange={handleInputChange}
                    placeholder="Search pickup address, airport, hotel..."
                    required
                    dataTestId="pickup-location"
                  />
                </div>

                {/* Dropoff Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dropoff Location *</label>
                  <AddressAutocomplete
                    name="dropoff_location"
                    value={formData.dropoff_location}
                    onChange={handleInputChange}
                    placeholder="Search dropoff address, airport, hotel..."
                    required
                    dataTestId="dropoff-location"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Date *</label>
                    <input
                      type="date"
                      name="pickup_date"
                      value={formData.pickup_date}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="pickup-date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Time *</label>
                    <input
                      type="time"
                      name="pickup_time"
                      value={formData.pickup_time}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                      data-testid="pickup-time"
                    />
                  </div>
                </div>

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
                      <span>{formData.passengers} Passengers</span>
                      <span>{formData.luggage} Luggage</span>
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

                <button type="submit" className="btn-gold w-full flex items-center justify-center gap-2 relative z-0" data-testid="continue-btn">
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
                <li><a href="/terms-conditions">Terms & Conditions</a></li>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><a href="/cookie-policy">Cookie Policy</a></li>
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
