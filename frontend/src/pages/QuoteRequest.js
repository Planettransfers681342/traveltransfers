import React, { useState } from 'react';
import { CarSimple, X, CheckCircle, Spinner } from '@phosphor-icons/react';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function QuoteRequest() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    // Trip Details
    trip_type: 'one-way',
    pickup_location: '',
    dropoff_location: '',
    pickup_date: '',
    pickup_time: '',
    return_date: '',
    return_time: '',
    passengers: 2,
    luggage: 2,
    vehicle_preference: '',
    // Passenger Details
    passenger_name: '',
    passenger_email: '',
    passenger_phone: '',
    flight_number: '',
    special_requests: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit quote to backend API
      await axios.post(`${API}/quotes`, {
        trip_type: formData.trip_type,
        pickup_location: formData.pickup_location,
        dropoff_location: formData.dropoff_location,
        pickup_date: formData.pickup_date,
        pickup_time: formData.pickup_time,
        return_date: formData.return_date || null,
        return_time: formData.return_time || null,
        passengers: parseInt(formData.passengers) || formData.passengers,
        luggage: parseInt(formData.luggage) || formData.luggage,
        vehicle_preference: formData.vehicle_preference || null,
        passenger_name: formData.passenger_name,
        passenger_email: formData.passenger_email,
        passenger_phone: formData.passenger_phone,
        flight_number: formData.flight_number || null,
        special_requests: formData.special_requests || null
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('There was an error submitting your quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} weight="fill" className="text-green-500" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Quote Request Received!</h2>
          <p className="text-slate-600 mb-6">
            Thank you for your quote request. Our team has received your details and will get back to you shortly.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            We'll respond with a personalized quote within 30 minutes during business hours via email or phone.
          </p>
          <button
            onClick={() => window.close()}
            className="btn-gold w-full"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </div>
          <button 
            onClick={() => window.close()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            title="Close"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-[#d4af37] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-slate-900' : 'text-slate-500'}`}>Trip Details</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-slate-200">
              <div className={`h-full bg-[#d4af37] transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-[#d4af37] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-slate-900' : 'text-slate-500'}`}>Your Details</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white shadow-sm p-8">
          {step === 1 && (
            <div data-testid="quote-step-1">
              <h1 className="text-2xl font-semibold text-slate-900 mb-6">Trip Details</h1>
              
              <form className="space-y-6">
                {/* Trip Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Trip Type</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 border p-4 cursor-pointer transition-all ${formData.trip_type === 'one-way' ? 'border-[#d4af37] bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="trip_type"
                        value="one-way"
                        checked={formData.trip_type === 'one-way'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className="font-medium text-slate-900">One-way</span>
                      <p className="text-sm text-slate-500 mt-1">Single journey transfer</p>
                    </label>
                    <label className={`flex-1 border p-4 cursor-pointer transition-all ${formData.trip_type === 'round-trip' ? 'border-[#d4af37] bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="trip_type"
                        value="round-trip"
                        checked={formData.trip_type === 'round-trip'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className="font-medium text-slate-900">Round-trip</span>
                      <p className="text-sm text-slate-500 mt-1">Return journey included</p>
                    </label>
                  </div>
                </div>

                {/* Pickup Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Location *</label>
                  <AddressAutocomplete
                    name="pickup_location"
                    value={formData.pickup_location}
                    onChange={handleInputChange}
                    placeholder="Enter airport, hotel, or address..."
                    required
                    dataTestId="quote-pickup"
                  />
                </div>

                {/* Dropoff Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dropoff Location *</label>
                  <AddressAutocomplete
                    name="dropoff_location"
                    value={formData.dropoff_location}
                    onChange={handleInputChange}
                    placeholder="Enter airport, hotel, or address..."
                    required
                    dataTestId="quote-dropoff"
                  />
                </div>

                {/* Pickup Date/Time */}
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Time *</label>
                    <input
                      type="time"
                      name="pickup_time"
                      value={formData.pickup_time}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Return Date/Time (if round-trip) */}
                {formData.trip_type === 'round-trip' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Return Date *</label>
                      <input
                        type="date"
                        name="return_date"
                        value={formData.return_date}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                        min={formData.pickup_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Return Time *</label>
                      <input
                        type="time"
                        name="return_time"
                        value={formData.return_time}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Passengers & Luggage */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Passengers *</label>
                    <select
                      name="passengers"
                      value={formData.passengers}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'passenger' : 'passengers'}</option>
                      ))}
                      <option value="17+">17+ passengers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Luggage *</label>
                    <select
                      name="luggage"
                      value={formData.luggage}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'bag' : 'bags'}</option>
                      ))}
                      <option value="10+">10+ bags</option>
                    </select>
                  </div>
                </div>

                {/* Vehicle Preference */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Preference (Optional)</label>
                  <select
                    name="vehicle_preference"
                    value={formData.vehicle_preference}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">No preference</option>
                    <option value="Economy">Economy Class (Sedan)</option>
                    <option value="Business">Business Class (Premium Sedan)</option>
                    <option value="Group">Group Transfer (Van/Minibus)</option>
                    <option value="Bus">Full Size Bus (Coach)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!formData.pickup_location || !formData.dropoff_location || !formData.pickup_date || !formData.pickup_time}
                    className="btn-gold w-full py-4"
                  >
                    Continue to Your Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div data-testid="quote-step-2">
              <h1 className="text-2xl font-semibold text-slate-900 mb-6">Your Details</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="passenger_name"
                    value={formData.passenger_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="John Smith"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="passenger_email"
                    value={formData.passenger_email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="passenger_phone"
                    value={formData.passenger_phone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="+44 7123 456789"
                    required
                  />
                </div>

                {/* Flight Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Flight Number (Optional)</label>
                  <input
                    type="text"
                    name="flight_number"
                    value={formData.flight_number}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., BA1234"
                  />
                  <p className="text-xs text-slate-500 mt-1">We'll track your flight for delays</p>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Special Requests (Optional)</label>
                  <textarea
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleInputChange}
                    className="input-field h-24 py-3"
                    placeholder="Child seats, wheelchair access, extra stops, etc."
                  />
                </div>

                {/* Summary */}
                <div className="bg-slate-50 p-4 border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-3">Trip Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">From:</span>
                      <span className="text-slate-900 text-right max-w-[60%]">{formData.pickup_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">To:</span>
                      <span className="text-slate-900 text-right max-w-[60%]">{formData.dropoff_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="text-slate-900">{formData.pickup_date} at {formData.pickup_time}</span>
                    </div>
                    {formData.trip_type === 'round-trip' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Return:</span>
                        <span className="text-slate-900">{formData.return_date} at {formData.return_time}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Passengers:</span>
                      <span className="text-slate-900">{formData.passengers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Luggage:</span>
                      <span className="text-slate-900">{formData.luggage}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="btn-secondary flex-1 py-4"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.passenger_name || !formData.passenger_email || !formData.passenger_phone}
                    className="btn-gold flex-1 py-4 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size={20} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quote Request'
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  By submitting, you agree to our Terms & Conditions and Privacy Policy
                </p>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
