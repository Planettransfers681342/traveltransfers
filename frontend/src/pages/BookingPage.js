import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CarSimple, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Suitcase,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  User,
  Envelope,
  Phone,
  Airplane,
  CreditCard,
  Spinner
} from '@phosphor-icons/react';
import axios from 'axios';
import { PhoneInput } from '@/components/PhoneInput';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fleet Images — stable production sources
const FLEET_IMAGES = {
  standard:  "https://images.pexels.com/photos/6191762/pexels-photo-6191762.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  executive: "https://images.unsplash.com/photo-1592222269733-1d44ea5ab43b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
  minivan:   "https://images.pexels.com/photos/17455625/pexels-photo-17455625.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  minibus:   "https://images.pexels.com/photos/19871521/pexels-photo-19871521.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
};

const VEHICLES = [
  { id: "standard",  name: "Standard",     desc: "Toyota Prius, VW Passat or similar vehicle",       passengers: 3,  luggage: 2,  features: ["Air conditioning", "Comfortable saloon", "Professional driver"] },
  { id: "executive", name: "Executive",    desc: "Mercedes E-Class, BMW 5 Series or similar vehicle", passengers: 4,  luggage: 3,  features: ["Premium vehicle", "Climate control", "Complimentary water"] },
  { id: "minivan",   name: "Minivan / MPV",desc: "Mercedes Vito, VW Transporter or similar vehicle",  passengers: 7,  luggage: 5,  features: ["Extra luggage space", "People carrier", "Group friendly"] },
  { id: "minibus",   name: "Minibus",      desc: "Mercedes Sprinter, Ford Transit or similar vehicle", passengers: 16, luggage: 16, features: ["Climate control", "Comfortable seating", "Large group capacity"] },
];

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state || {};

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [prices, setPrices] = useState({});
  const [bookingData, setBookingData] = useState({
    trip_type: initialData.trip_type || 'one-way',
    pickup_location: initialData.pickup_location || '',
    dropoff_location: initialData.dropoff_location || '',
    pickup_date: initialData.pickup_date || '',
    pickup_time: initialData.pickup_time || '',
    return_date: '',
    return_time: '',
    passengers: initialData.passengers || 2,
    luggage: initialData.luggage || 2,
    vehicle_type: '',
    passenger_name: '',
    passenger_email: '',
    passenger_phone: '',
    flight_number: '',
    special_requests: ''
  });

  useEffect(() => {
    if (!initialData.pickup_location) {
      navigate('/');
    }
  }, [initialData, navigate]);

  // Fetch prices for all vehicles
  useEffect(() => {
    const fetchPrices = async () => {
      if (!bookingData.pickup_location || !bookingData.dropoff_location) return;
      
      const pricePromises = VEHICLES.map(vehicle => 
        axios.get(`${API}/quote`, {
          params: {
            from_location: bookingData.pickup_location,
            to_location: bookingData.dropoff_location,
            vehicle_type: vehicle.id,
            trip_type: bookingData.trip_type
          }
        }).then(res => ({ [vehicle.id]: res.data.price }))
          .catch(() => ({ [vehicle.id]: 0 }))
      );
      
      const results = await Promise.all(pricePromises);
      const priceMap = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setPrices(priceMap);
    };
    
    fetchPrices();
  }, [bookingData.pickup_location, bookingData.dropoff_location, bookingData.trip_type]);

  const handleInputChange = (e) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const handleVehicleSelect = (vehicleId) => {
    setSelectedVehicle(vehicleId);
    setBookingData({ ...bookingData, vehicle_type: vehicleId });
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create booking
      const bookingRes = await axios.post(`${API}/bookings`, bookingData);
      const booking = bookingRes.data;

      // Create checkout session
      const checkoutRes = await axios.post(`${API}/checkout/create`, {
        booking_id: booking.id,
        origin_url: window.location.origin
      });

      // Redirect to Stripe
      window.location.href = checkoutRes.data.url;
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.detail || 'Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  const getSelectedPrice = () => {
    return prices[selectedVehicle] || 0;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </a>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft size={18} />
            Back to Home
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="step-indicator">
            <div className={`step-circle ${step >= 1 ? 'active' : 'inactive'}`}>1</div>
            <div className={`step-line ${step > 1 ? 'completed' : ''}`}></div>
            <div className={`step-circle ${step >= 2 ? 'active' : 'inactive'}`}>2</div>
            <div className={`step-line ${step > 2 ? 'completed' : ''}`}></div>
            <div className={`step-circle ${step >= 3 ? 'active' : 'inactive'}`}>3</div>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex gap-8 text-sm">
            <span className={step === 1 ? 'font-semibold text-slate-900' : 'text-slate-400'}>Select Vehicle</span>
            <span className={step === 2 ? 'font-semibold text-slate-900' : 'text-slate-400'}>Passenger Info</span>
            <span className={step === 3 ? 'font-semibold text-slate-900' : 'text-slate-400'}>Review & Pay</span>
          </div>
        </div>

        {/* Trip Summary Card */}
        <div className="bg-white border border-slate-200 p-6 mb-8">
          <h3 className="font-semibold text-slate-900 mb-4">Trip Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#d4af37]" />
              <div>
                <span className="text-slate-500 block">From</span>
                <span className="font-medium">{bookingData.pickup_location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#d4af37]" />
              <div>
                <span className="text-slate-500 block">To</span>
                <span className="font-medium">{bookingData.dropoff_location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#d4af37]" />
              <div>
                <span className="text-slate-500 block">Date</span>
                <span className="font-medium">{bookingData.pickup_date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#d4af37]" />
              <div>
                <span className="text-slate-500 block">Time</span>
                <span className="font-medium">{bookingData.pickup_time}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <Users size={18} className="text-slate-400" />
              {bookingData.passengers} passengers
            </span>
            <span className="flex items-center gap-2">
              <Suitcase size={18} className="text-slate-400" />
              {bookingData.luggage} luggage
            </span>
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium uppercase">
              {bookingData.trip_type}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Vehicle Selection */}
        {step === 1 && (
          <div className="fade-in" data-testid="vehicle-selection-step">
            <h2 className="text-3xl font-semibold text-slate-900 mb-6">Select Your Vehicle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VEHICLES.map(vehicle => (
                <div
                  key={vehicle.id}
                  onClick={() => handleVehicleSelect(vehicle.id)}
                  className={`premium-card cursor-pointer overflow-hidden ${selectedVehicle === vehicle.id ? 'ring-2 ring-[#d4af37]' : ''}`}
                  data-testid={`vehicle-option-${vehicle.id}`}
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={FLEET_IMAGES[vehicle.id]} 
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-slate-900">{vehicle.name}</h3>
                      {selectedVehicle === vehicle.id && (
                        <CheckCircle size={24} weight="fill" className="text-[#d4af37]" />
                      )}
                    </div>
                    <p className="text-slate-600 text-sm mb-4">{vehicle.desc}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Users size={16} /> Up to {vehicle.passengers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Suitcase size={16} /> {vehicle.luggage} bags
                      </span>
                    </div>
                    <ul className="space-y-1 mb-4">
                      {vehicle.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle size={14} className="text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t border-slate-100">
                      {prices[vehicle.id] > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">Starts from</span>
                          <span className="text-2xl font-semibold text-slate-900">
                            £{prices[vehicle.id]?.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            data-testid={`request-quote-${vehicle.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const qs = new URLSearchParams({
                                from:    bookingData.pickup_location,
                                to:      bookingData.dropoff_location,
                                vehicle: vehicle.name,
                              }).toString();
                              window.open(`/quote?${qs}`, '_blank', 'width=800,height=900,scrollbars=yes');
                            }}
                            className="btn-gold w-full py-2 text-sm"
                          >
                            Request Quote
                          </button>
                          <p className="text-xs text-slate-400 text-center">
                            For surrounding areas, pricing is confirmed manually
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleNextStep} 
                className="btn-gold flex items-center gap-2"
                data-testid="next-step-btn"
              >
                Continue to Passenger Details
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Passenger Info */}
        {step === 2 && (
          <div className="fade-in" data-testid="passenger-info-step">
            <h2 className="text-3xl font-semibold text-slate-900 mb-6">Passenger Information</h2>
            <div className="bg-white border border-slate-200 p-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                    <div className="relative">
                      <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="passenger_name"
                        value={bookingData.passenger_name}
                        onChange={handleInputChange}
                        className="input-field pl-12"
                        placeholder="John Smith"
                        required
                        data-testid="passenger-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Envelope size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="passenger_email"
                        value={bookingData.passenger_email}
                        onChange={handleInputChange}
                        className="input-field pl-12"
                        placeholder="john@example.com"
                        required
                        data-testid="passenger-email"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                    <PhoneInput
                      value={bookingData.passenger_phone}
                      onChange={handleInputChange}
                      name="passenger_phone"
                      placeholder="Phone number"
                      required
                      dataTestId="passenger-phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Flight Number (Optional)</label>
                    <div className="relative">
                      <Airplane size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="flight_number"
                        value={bookingData.flight_number}
                        onChange={handleInputChange}
                        className="input-field pl-12"
                        placeholder="BA1234"
                        data-testid="flight-number"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Special Requests (Optional)</label>
                  <textarea
                    name="special_requests"
                    value={bookingData.special_requests}
                    onChange={handleInputChange}
                    className="input-field h-24 py-3"
                    placeholder="Child seat required, wheelchair accessible vehicle, etc."
                    data-testid="special-requests"
                  />
                </div>
              </form>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={handlePrevStep} className="btn-secondary flex items-center gap-2">
                <ArrowLeft size={20} />
                Back
              </button>
              <button 
                onClick={handleNextStep} 
                className="btn-gold flex items-center gap-2"
                disabled={!bookingData.passenger_name || !bookingData.passenger_email || !bookingData.passenger_phone}
                data-testid="next-step-btn"
              >
                Review Booking
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Pay */}
        {step === 3 && (
          <div className="fade-in" data-testid="review-pay-step">
            <h2 className="text-3xl font-semibold text-slate-900 mb-6">Review & Pay</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Trip Details */}
                <div className="bg-white border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Trip Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">From:</span>
                      <p className="font-medium">{bookingData.pickup_location}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">To:</span>
                      <p className="font-medium">{bookingData.dropoff_location}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>
                      <p className="font-medium">{bookingData.pickup_date}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Time:</span>
                      <p className="font-medium">{bookingData.pickup_time}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Passengers:</span>
                      <p className="font-medium">{bookingData.passengers}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Luggage:</span>
                      <p className="font-medium">{bookingData.luggage}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="bg-white border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Selected Vehicle</h3>
                  <div className="flex gap-4">
                    <img 
                      src={FLEET_IMAGES[selectedVehicle]} 
                      alt={VEHICLES.find(v => v.id === selectedVehicle)?.name}
                      className="w-32 h-24 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {VEHICLES.find(v => v.id === selectedVehicle)?.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {VEHICLES.find(v => v.id === selectedVehicle)?.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passenger Details */}
                <div className="bg-white border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Passenger Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <p className="font-medium">{bookingData.passenger_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Email:</span>
                      <p className="font-medium">{bookingData.passenger_email}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      <p className="font-medium">{bookingData.passenger_phone}</p>
                    </div>
                    {bookingData.flight_number && (
                      <div>
                        <span className="text-slate-500">Flight:</span>
                        <p className="font-medium">{bookingData.flight_number}</p>
                      </div>
                    )}
                  </div>
                  {bookingData.special_requests && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="text-slate-500 text-sm">Special Requests:</span>
                      <p className="text-sm">{bookingData.special_requests}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-slate-200 p-6 sticky top-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Payment Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{VEHICLES.find(v => v.id === selectedVehicle)?.name}</span>
                      <span>£{getSelectedPrice().toFixed(2)}</span>
                    </div>
                    {bookingData.trip_type === 'round-trip' && (
                      <div className="flex justify-between text-green-600">
                        <span>Round-trip discount</span>
                        <span>-10%</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-200 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">Estimated Total</span>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Starts from</span>
                        <span className="text-3xl font-semibold text-slate-900">£{getSelectedPrice().toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Final price may vary based on availability and route details.</p>
                  </div>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-gold w-full mt-6 flex items-center justify-center gap-2"
                    data-testid="pay-now-btn"
                  >
                    {loading ? (
                      <>
                        <Spinner size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} />
                        Pay Now - £{getSelectedPrice().toFixed(2)}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-500 text-center mt-4">
                    Secure payment powered by Stripe
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button onClick={handlePrevStep} className="btn-secondary flex items-center gap-2">
                <ArrowLeft size={20} />
                Back to Passenger Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
