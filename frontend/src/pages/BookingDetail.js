import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CarSimple, 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Suitcase,
  User,
  Envelope,
  Phone,
  Airplane,
  CurrencyGbp,
  CheckCircle,
  XCircle,
  ClockCounterClockwise,
  Note,
  Hash
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VEHICLE_NAMES = {
  economy: 'Economy Class',
  business: 'Business Class',
  group: 'Group Transfer',
  bus: 'Full Size Bus'
};

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin');
      return;
    }
    fetchBooking();
  }, [bookingId, navigate]);

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`${API}/bookings/${bookingId}`);
      setBooking(res.data);
      setAdminNotes(res.data.admin_notes || '');
    } catch (err) {
      setError('Booking not found');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (newStatus) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, { status: newStatus });
      fetchBooking();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const updatePaymentStatus = async (newStatus) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/payment-status`, { status: newStatus });
      fetchBooking();
    } catch (err) {
      alert('Failed to update payment status');
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await axios.put(`${API}/bookings/${bookingId}/notes`, { admin_notes: adminNotes });
    } catch (err) {
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const getBookingStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Booking not found'}</p>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
              <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Booking Details</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-semibold uppercase ${getBookingStatusBadge(booking.booking_status)}`}>
              {booking.booking_status}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold uppercase ${getPaymentStatusBadge(booking.payment_status)}`}>
              {booking.payment_status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking ID */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Hash size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-semibold text-slate-900">Booking ID</h2>
              </div>
              <p className="font-mono text-lg text-slate-700 bg-slate-50 p-3 border border-slate-200">
                {booking.id}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Created: {formatTimestamp(booking.created_at)}
              </p>
            </div>

            {/* Trip Details */}
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Trip Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-green-600 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500">Pickup Location</p>
                      <p className="font-medium text-slate-900">{booking.pickup_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-red-600 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500">Dropoff Location</p>
                      <p className="font-medium text-slate-900">{booking.dropoff_location}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500">Pickup Date</p>
                      <p className="font-medium text-slate-900">{booking.pickup_date}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500">Pickup Time</p>
                      <p className="font-medium text-slate-900">{booking.pickup_time}</p>
                    </div>
                  </div>
                </div>
              </div>
              {booking.trip_type === 'round-trip' && booking.return_date && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Return Journey</p>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-slate-400" />
                      <span>{booking.return_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-slate-400" />
                      <span>{booking.return_time}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={18} className="text-slate-400" />
                  <span>{booking.passengers} passengers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Suitcase size={18} className="text-slate-400" />
                  <span>{booking.luggage} luggage</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CarSimple size={18} className="text-slate-400" />
                  <span>{VEHICLE_NAMES[booking.vehicle_type] || booking.vehicle_type}</span>
                </div>
                <div className="px-2 py-1 bg-slate-100 text-xs font-medium uppercase text-slate-600">
                  {booking.trip_type}
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Passenger Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <User size={20} className="text-slate-400 mt-1" />
                  <div>
                    <p className="text-sm text-slate-500">Full Name</p>
                    <p className="font-medium text-slate-900">{booking.passenger_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Envelope size={20} className="text-slate-400 mt-1" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <a href={`mailto:${booking.passenger_email}`} className="font-medium text-blue-600 hover:underline">
                      {booking.passenger_email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-slate-400 mt-1" />
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <a href={`tel:${booking.passenger_phone}`} className="font-medium text-blue-600 hover:underline">
                      {booking.passenger_phone}
                    </a>
                  </div>
                </div>
                {booking.flight_number && (
                  <div className="flex items-start gap-3">
                    <Airplane size={20} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500">Flight Number</p>
                      <p className="font-medium text-slate-900">{booking.flight_number}</p>
                    </div>
                  </div>
                )}
              </div>
              {booking.special_requests && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Special Requests</p>
                  <p className="text-slate-700 bg-slate-50 p-3 border border-slate-200">
                    {booking.special_requests}
                  </p>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Note size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-semibold text-slate-900">Admin Notes</h2>
              </div>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="input-field h-24 mb-3"
                placeholder="Add internal notes about this booking..."
              />
              <button 
                onClick={saveNotes}
                disabled={savingNotes}
                className="btn-primary py-2 px-4 text-sm"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>

            {/* Status Timeline */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <ClockCounterClockwise size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-semibold text-slate-900">Status Timeline</h2>
              </div>
              <div className="space-y-4">
                {(booking.status_history || []).length === 0 ? (
                  <p className="text-slate-500 text-sm">No status history available</p>
                ) : (
                  [...(booking.status_history || [])].reverse().map((entry, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.type === 'booking_status' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                        {idx < (booking.status_history.length - 1) && (
                          <div className="w-0.5 h-full bg-slate-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            entry.type === 'booking_status' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {entry.type === 'booking_status' ? 'Booking' : 'Payment'}
                          </span>
                          <span className="text-xs text-slate-500">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                        <p className="text-sm text-slate-700">
                          {entry.from_status ? (
                            <>
                              <span className="font-medium capitalize">{entry.from_status}</span>
                              <span className="mx-2">→</span>
                              <span className="font-medium capitalize">{entry.to_status}</span>
                            </>
                          ) : (
                            <span className="font-medium capitalize">{entry.to_status}</span>
                          )}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-slate-500 mt-1">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CurrencyGbp size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-semibold text-slate-900">Price</h2>
              </div>
              <p className="text-4xl font-semibold text-slate-900">
                £{booking.price?.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {booking.trip_type === 'round-trip' ? 'Round-trip fare' : 'One-way fare'}
              </p>
            </div>

            {/* Booking Status Control */}
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Booking Status</h2>
              <p className="text-sm text-slate-500 mb-3">Current: <span className="font-medium capitalize">{booking.booking_status}</span></p>
              <div className="grid grid-cols-2 gap-2">
                {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateBookingStatus(status)}
                    disabled={booking.booking_status === status}
                    className={`py-2 px-3 text-sm font-medium border transition-colors capitalize ${
                      booking.booking_status === status
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status Control */}
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Status</h2>
              <p className="text-sm text-slate-500 mb-3">Current: <span className="font-medium capitalize">{booking.payment_status}</span></p>
              <div className="grid grid-cols-3 gap-2">
                {['pending', 'paid', 'refunded'].map(status => (
                  <button
                    key={status}
                    onClick={() => updatePaymentStatus(status)}
                    disabled={booking.payment_status === status}
                    className={`py-2 px-3 text-sm font-medium border transition-colors capitalize ${
                      booking.payment_status === status
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Stripe Info */}
            {booking.stripe_session_id && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Stripe Session</h2>
                <p className="font-mono text-xs text-slate-600 bg-slate-50 p-2 border break-all">
                  {booking.stripe_session_id}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
