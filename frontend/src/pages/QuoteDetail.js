import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CarSimple, 
  ArrowLeft, 
  User, 
  Phone, 
  Envelope, 
  MapPin, 
  Calendar, 
  Clock,
  Suitcase,
  Users,
  Airplane,
  ChatCircleText,
  CaretDown
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function QuoteDetail() {
  const navigate = useNavigate();
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin');
      return;
    }
    fetchQuote();
  }, [navigate, quoteId]);

  const fetchQuote = async () => {
    try {
      const response = await axios.get(`${API}/quotes/${quoteId}`);
      setQuote(response.data);
      setAdminNotes(response.data.admin_notes || '');
    } catch (error) {
      console.error('Error fetching quote:', error);
      if (error.response?.status === 404) {
        navigate('/admin/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await axios.put(`${API}/quotes/${quoteId}/status`, { 
        status: newStatus,
        admin_notes: adminNotes 
      });
      fetchQuote();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setUpdating(true);
    try {
      await axios.put(`${API}/quotes/${quoteId}/status`, { 
        status: quote.status,
        admin_notes: adminNotes 
      });
      fetchQuote();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: 'badge-pending',
      responded: 'badge-confirmed',
      converted: 'badge-completed',
      closed: 'badge-cancelled'
    };
    return badges[status] || 'badge-pending';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Quote not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                data-testid="back-to-dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
                <span className="font-['Playfair_Display'] text-lg font-semibold">Planet Transfers</span>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              Quote ID: {quote.id?.substring(0, 8)}...
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Quote Request Details</h1>
            <p className="text-slate-500 mt-1">Submitted: {formatDate(quote.created_at)}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`badge ${getStatusBadge(quote.status)} text-sm px-4 py-2`}>
              {quote.status?.toUpperCase()}
            </span>
            <select
              value={quote.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
              data-testid="quote-status-select"
            >
              <option value="new">New</option>
              <option value="responded">Responded</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="admin-card" data-testid="customer-info">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-[#d4af37]" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="font-medium text-slate-900">{quote.passenger_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Envelope size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <a href={`mailto:${quote.passenger_email}`} className="font-medium text-blue-600 hover:underline">
                      {quote.passenger_email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <a href={`tel:${quote.passenger_phone}`} className="font-medium text-blue-600 hover:underline">
                      {quote.passenger_phone}
                    </a>
                  </div>
                </div>
                {quote.flight_number && (
                  <div className="flex items-start gap-3">
                    <Airplane size={18} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Flight Number</p>
                      <p className="font-medium text-slate-900">{quote.flight_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trip Details */}
            <div className="admin-card" data-testid="trip-details">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-[#d4af37]" />
                Trip Details
              </h2>
              
              <div className="mb-4 inline-block">
                <span className={`px-3 py-1 text-sm rounded-full ${quote.trip_type === 'round-trip' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                  {quote.trip_type === 'round-trip' ? 'Round Trip' : 'One-Way'}
                </span>
              </div>

              <div className="space-y-4">
                {/* Pickup */}
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <p className="text-xs text-green-700 font-medium mb-1">PICKUP</p>
                  <p className="text-slate-900">{quote.pickup_location}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {quote.pickup_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {quote.pickup_time}
                    </span>
                  </div>
                </div>

                {/* Dropoff */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-xs text-red-700 font-medium mb-1">DROP-OFF</p>
                  <p className="text-slate-900">{quote.dropoff_location}</p>
                </div>

                {/* Return (if round-trip) */}
                {quote.trip_type === 'round-trip' && quote.return_date && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                    <p className="text-xs text-amber-700 font-medium mb-1">RETURN</p>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {quote.return_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {quote.return_time}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {quote.special_requests && (
              <div className="admin-card" data-testid="special-requests">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ChatCircleText size={20} className="text-[#d4af37]" />
                  Special Requests
                </h2>
                <p className="text-slate-700 whitespace-pre-wrap">{quote.special_requests}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="admin-card" data-testid="quick-stats">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Trip Requirements</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Users size={18} />
                    Passengers
                  </span>
                  <span className="font-semibold text-slate-900">{quote.passengers}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Suitcase size={18} />
                    Luggage
                  </span>
                  <span className="font-semibold text-slate-900">{quote.luggage} bags</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-slate-600">
                    <CarSimple size={18} />
                    Vehicle Pref
                  </span>
                  <span className="font-semibold text-slate-900 capitalize">{quote.vehicle_preference || 'No preference'}</span>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="admin-card" data-testid="admin-notes">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Notes</h2>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="input-field h-32 resize-none"
                placeholder="Add internal notes about this quote..."
                data-testid="admin-notes-input"
              />
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="btn-gold w-full mt-4 py-2"
                data-testid="save-notes-btn"
              >
                {updating ? 'Saving...' : 'Save Notes'}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="admin-card" data-testid="quick-actions">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a
                  href={`mailto:${quote.passenger_email}?subject=Your Planet Transfers Quote Request`}
                  className="btn-secondary w-full py-2 flex items-center justify-center gap-2"
                >
                  <Envelope size={18} />
                  Send Email
                </a>
                <a
                  href={`tel:${quote.passenger_phone}`}
                  className="btn-secondary w-full py-2 flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  Call Customer
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
