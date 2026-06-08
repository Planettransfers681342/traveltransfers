import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CarSimple, 
  House, 
  ListDashes, 
  CurrencyGbp,
  SignOut,
  Plus,
  Trash,
  PencilSimple,
  X,
  Check,
  CaretDown,
  MagnifyingGlass,
  ChatCircleText,
  Eye,
  Handshake,
  Buildings
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transfers');
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [iwayBookings, setIwayBookings] = useState([]);
  const [talixoBookings, setTalixoBookings] = useState([]);
  const [mytransfersBookings, setMyTransfersBookings] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [iwaySearch, setIwaySearch] = useState('');
  const [talixoSearch, setTalixoSearch] = useState('');
  const [mytransfersSearch, setMyTransfersSearch] = useState('');
  const [routeForm, setRouteForm] = useState({
    from_location: '',
    to_location: '',
    economy_price: '',
    business_price: '',
    group_price: '',
    bus_price: ''
  });
  const [quotes, setQuotes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [quotesSearchTerm, setQuotesSearchTerm] = useState('');

  useEffect(() => {
    // Check auth
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, routesRes, quotesRes, partnersRes, iwayRes, talixoRes, mytransfersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`).catch(() => ({ data: {} })),
        axios.get(`${API}/bookings`).catch(() => ({ data: [] })),
        axios.get(`${API}/routes/prices`).catch(() => ({ data: [] })),
        axios.get(`${API}/quotes`).catch(() => ({ data: [] })),
        axios.get(`${API}/partners`).catch(() => ({ data: [] })),
        axios.get(`${API}/iway/bookings`).catch(() => ({ data: [] })),
        axios.get(`${API}/talixo/bookings`).catch(() => ({ data: [] })),
        axios.get(`${API}/mytransfers/bookings`).catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setRoutes(routesRes.data);
      setQuotes(quotesRes.data);
      setPartners(partnersRes.data);
      setIwayBookings(iwayRes.data);
      setTalixoBookings(talixoRes.data);
      setMyTransfersBookings(mytransfersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin');
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...routeForm,
        economy_price: parseFloat(routeForm.economy_price),
        business_price: parseFloat(routeForm.business_price),
        group_price: parseFloat(routeForm.group_price),
        bus_price: parseFloat(routeForm.bus_price)
      };

      if (editingRoute) {
        await axios.put(`${API}/routes/prices/${editingRoute.id}`, data);
      } else {
        await axios.post(`${API}/routes/prices`, data);
      }
      setShowRouteModal(false);
      setEditingRoute(null);
      setRouteForm({
        from_location: '',
        to_location: '',
        economy_price: '',
        business_price: '',
        group_price: '',
        bus_price: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving route:', error);
      alert(error.response?.data?.detail || 'Error saving route');
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setRouteForm({
      from_location: route.from_location,
      to_location: route.to_location,
      economy_price: route.economy_price.toString(),
      business_price: route.business_price.toString(),
      group_price: route.group_price.toString(),
      bus_price: route.bus_price.toString()
    });
    setShowRouteModal(true);
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await axios.delete(`${API}/routes/prices/${routeId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const handleQuoteStatusChange = async (quoteId, newStatus) => {
    try {
      await axios.put(`${API}/quotes/${quoteId}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating quote status:', error);
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote request?')) return;
    try {
      await axios.delete(`${API}/quotes/${quoteId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const handleIwayStatusChange = async (bookingId, field, value) => {
    try {
      await axios.put(`${API}/iway/bookings/${bookingId}/status`, { [field]: value });
      fetchData();
    } catch (error) {
      console.error('Error updating iWay booking status:', error);
    }
  };

  const filteredIwayBookings = iwayBookings.filter(b =>
    b.passenger_name?.toLowerCase().includes(iwaySearch.toLowerCase()) ||
    b.passenger_email?.toLowerCase().includes(iwaySearch.toLowerCase()) ||
    b.pickup_location?.toLowerCase().includes(iwaySearch.toLowerCase()) ||
    b.dropoff_location?.toLowerCase().includes(iwaySearch.toLowerCase()) ||
    b.iway_booker_number?.toLowerCase().includes(iwaySearch.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking => 
    booking.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.passenger_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.dropoff_location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuotes = quotes.filter(quote => 
    quote.passenger_name?.toLowerCase().includes(quotesSearchTerm.toLowerCase()) ||
    quote.passenger_email?.toLowerCase().includes(quotesSearchTerm.toLowerCase()) ||
    quote.pickup_location?.toLowerCase().includes(quotesSearchTerm.toLowerCase()) ||
    quote.dropoff_location?.toLowerCase().includes(quotesSearchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      confirmed: 'badge-confirmed',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled'
    };
    return badges[status] || 'badge-pending';
  };

  const getPaymentBadge = (status) => {
    return status === 'paid' ? 'badge-paid' : 'badge-pending';
  };

  const getQuoteStatusBadge = (status) => {
    const badges = {
      new: 'badge-pending',
      responded: 'badge-confirmed',
      converted: 'badge-completed',
      closed: 'badge-cancelled'
    };
    return badges[status] || 'badge-pending';
  };

  const getIwayPaymentBadge = (status) => {
    const map = {
      pending: 'badge-pending',
      payment_completed: 'badge-paid',
      cancelled: 'badge-cancelled',
      iway_error: 'badge-cancelled',
    };
    return map[status] || 'badge-pending';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="admin-sidebar fixed left-0 top-0 h-full" data-testid="admin-sidebar">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-lg font-semibold text-white">Planet Transfers</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
        </div>

        <nav>
          <div
            onClick={() => setActiveTab('transfers')}
            className={`admin-nav-item ${activeTab === 'transfers' ? 'active' : ''}`}
            data-testid="nav-transfers"
          >
            <CarSimple size={20} />
            <span>Transfers</span>
            {stats.iway_pending > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats.iway_pending}
              </span>
            )}
          </div>
          <div
            onClick={() => setActiveTab('bookings')}
            className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            data-testid="nav-bookings"
          >
            <ListDashes size={20} />
            <span>Bookings</span>
          </div>
          <div
            onClick={() => setActiveTab('routes')}
            className={`admin-nav-item ${activeTab === 'routes' ? 'active' : ''}`}
            data-testid="nav-routes"
          >
            <CurrencyGbp size={20} />
            <span>Route Prices</span>
          </div>
          <div
            onClick={() => setActiveTab('quotes')}
            className={`admin-nav-item ${activeTab === 'quotes' ? 'active' : ''}`}
            data-testid="nav-quotes"
          >
            <ChatCircleText size={20} />
            <span>Quote Requests</span>
            {quotes.filter(q => q.status === 'new').length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {quotes.filter(q => q.status === 'new').length}
              </span>
            )}
          </div>
          <div
            onClick={() => setActiveTab('partners')}
            className={`admin-nav-item ${activeTab === 'partners' ? 'active' : ''}`}
            data-testid="nav-partners"
          >
            <Handshake size={20} />
            <span>Partner Requests</span>
            {partners.filter(p => p.status === 'new').length > 0 && (
              <span className="ml-auto bg-[#d4af37] text-white text-xs px-2 py-0.5 rounded-full">
                {partners.filter(p => p.status === 'new').length}
              </span>
            )}
          </div>
          <div
            onClick={() => setActiveTab('talixo')}
            className={`admin-nav-item ${activeTab === 'talixo' ? 'active' : ''}`}
            data-testid="nav-talixo"
          >
            <CarSimple size={20} />
            <span>Talixo</span>
            {stats.talixo_pending_manual > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats.talixo_pending_manual}
              </span>
            )}
          </div>
          <div
            onClick={() => setActiveTab('mytransfers')}
            className={`admin-nav-item ${activeTab === 'mytransfers' ? 'active' : ''}`}
            data-testid="nav-mytransfers"
          >
            <CarSimple size={20} />
            <span>MyTransfers</span>
            {stats.mytransfers_pending_manual > 0 && (
              <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats.mytransfers_pending_manual}
              </span>
            )}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <a href="/" className="admin-nav-item">
            <House size={20} />
            <span>View Website</span>
          </a>
          <div onClick={handleLogout} className="admin-nav-item cursor-pointer">
            <SignOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[260px] p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card" data-testid="stat-iway-total">
            <div className="stat-value">{stats.total_iway_bookings || 0}</div>
            <div className="stat-label">Transfer Bookings</div>
          </div>
          <div className="stat-card" data-testid="stat-iway-paid">
            <div className="stat-value">{stats.iway_payment_completed || 0}</div>
            <div className="stat-label">Payments Completed</div>
          </div>
          <div className="stat-card" data-testid="stat-iway-pending">
            <div className="stat-value">{stats.iway_pending || 0}</div>
            <div className="stat-label">Awaiting Payment</div>
          </div>
          <div className="stat-card" data-testid="stat-iway-revenue">
            <div className="stat-value">£{(stats.iway_revenue || 0).toFixed(2)}</div>
            <div className="stat-label">Transfer Revenue</div>
          </div>
        </div>

        {/* Transfers Tab (iWay bookings) */}
        {activeTab === 'transfers' && (
          <div className="admin-card" data-testid="transfers-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Transfer Bookings</h2>
                <p className="text-xs text-slate-400 mt-0.5">All bookings created through the iWay booking flow</p>
              </div>
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transfers..."
                  value={iwaySearch}
                  onChange={(e) => setIwaySearch(e.target.value)}
                  className="input-field pl-10 h-10 w-64"
                  data-testid="search-transfers"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400">Loading...</div>
            ) : filteredIwayBookings.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CarSimple size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No transfer bookings yet</p>
                <p className="text-sm mt-1">Bookings will appear here once customers complete the booking flow.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Route</th>
                      <th>Date & Time</th>
                      <th>Vehicle / Ref</th>
                      <th>Price</th>
                      <th>Payment</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIwayBookings.map((b) => (
                      <tr key={b.id} data-testid={`iway-booking-row-${b.id}`}>
                        <td>
                          <p className="font-medium">{b.passenger_name}</p>
                          <p className="text-xs text-slate-500">{b.passenger_email}</p>
                          <p className="text-xs text-slate-400">{b.passenger_phone}</p>
                        </td>
                        <td>
                          <p className="text-sm">{b.pickup_location?.substring(0, 28)}{b.pickup_location?.length > 28 ? '…' : ''}</p>
                          <p className="text-xs text-slate-500">→ {b.dropoff_location?.substring(0, 28)}{b.dropoff_location?.length > 28 ? '…' : ''}</p>
                          {b.flight_number && <p className="text-xs text-slate-400 mt-0.5">✈ {b.flight_number}</p>}
                        </td>
                        <td>
                          <p className="text-sm">{b.pickup_date}</p>
                          <p className="text-xs text-slate-500">{b.pickup_time}</p>
                          <p className="text-xs text-slate-400">{b.passengers} pax · {b.luggage} bags</p>
                        </td>
                        <td>
                          <p className="text-sm font-medium capitalize">{b.vehicle_class || '—'}</p>
                          {b.iway_booker_number && <p className="text-xs text-slate-400">Ref: {b.iway_booker_number}</p>}
                        </td>
                        <td className="font-medium">
                          {b.price ? `£${Number(b.price).toFixed(2)}` : '—'}
                        </td>
                        <td>
                          <span className={`badge ${getIwayPaymentBadge(b.payment_status)}`}>
                            {b.payment_status === 'payment_completed' ? 'Paid' :
                             b.payment_status === 'cancelled' ? 'Cancelled' :
                             b.payment_status === 'iway_error' ? 'Error' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {b.email_sent === true && (
                            <span className="badge badge-confirmed" title="Confirmation email sent">Sent</span>
                          )}
                          {b.email_sent === false && (
                            <span className="badge badge-cancelled" title={b.email_error || 'Failed'}>Failed</span>
                          )}
                          {b.email_sent === undefined && b.payment_status !== 'payment_completed' && (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                          {b.email_sent === undefined && b.payment_status === 'payment_completed' && (
                            <span className="text-xs text-amber-500">Pending</span>
                          )}
                        </td>
                        <td>
                          <select
                            value={b.booking_status}
                            onChange={(e) => handleIwayStatusChange(b.id, 'booking_status', e.target.value)}
                            className="text-sm border border-slate-200 rounded px-2 py-1"
                            data-testid={`iway-status-${b.id}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="iway_error">Error</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="admin-card" data-testid="bookings-section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">All Bookings</h2>
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 h-10 w-64"
                  data-testid="search-bookings"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No bookings found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Route</th>
                      <th>Date & Time</th>
                      <th>Vehicle</th>
                      <th>Price</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr 
                        key={booking.id} 
                        data-testid={`booking-row-${booking.id}`}
                        className="cursor-pointer"
                        onClick={() => navigate(`/admin/booking/${booking.id}`)}
                      >
                        <td>
                          <div>
                            <p className="font-medium">{booking.passenger_name}</p>
                            <p className="text-xs text-slate-500">{booking.passenger_email}</p>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <p>{booking.pickup_location?.substring(0, 30)}{booking.pickup_location?.length > 30 ? '...' : ''}</p>
                            <p className="text-slate-500">→ {booking.dropoff_location?.substring(0, 30)}{booking.dropoff_location?.length > 30 ? '...' : ''}</p>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <p>{booking.pickup_date}</p>
                            <p className="text-slate-500">{booking.pickup_time}</p>
                          </div>
                        </td>
                        <td className="capitalize">{booking.vehicle_type}</td>
                        <td className="font-medium">£{booking.price?.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${getPaymentBadge(booking.payment_status)}`}>
                            {booking.payment_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(booking.booking_status)}`}>
                            {booking.booking_status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={booking.booking_status}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                            className="text-sm border border-slate-200 rounded px-2 py-1"
                            data-testid={`status-select-${booking.id}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div className="admin-card" data-testid="routes-section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Route Prices</h2>
              <button
                onClick={() => {
                  setEditingRoute(null);
                  setRouteForm({
                    from_location: '',
                    to_location: '',
                    economy_price: '',
                    business_price: '',
                    group_price: '',
                    bus_price: ''
                  });
                  setShowRouteModal(true);
                }}
                className="btn-gold flex items-center gap-2 py-2 px-4"
                data-testid="add-route-btn"
              >
                <Plus size={18} />
                Add Route
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : routes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No routes configured</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Economy</th>
                      <th>Business</th>
                      <th>Group</th>
                      <th>Bus</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route) => (
                      <tr key={route.id} data-testid={`route-row-${route.id}`}>
                        <td>{route.from_location}</td>
                        <td>{route.to_location}</td>
                        <td>£{route.economy_price?.toFixed(2)}</td>
                        <td>£{route.business_price?.toFixed(2)}</td>
                        <td>£{route.group_price?.toFixed(2)}</td>
                        <td>£{route.bus_price?.toFixed(2)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditRoute(route)}
                              className="p-2 hover:bg-slate-100 rounded"
                              data-testid={`edit-route-${route.id}`}
                            >
                              <PencilSimple size={18} className="text-slate-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoute(route.id)}
                              className="p-2 hover:bg-red-50 rounded"
                              data-testid={`delete-route-${route.id}`}
                            >
                              <Trash size={18} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <div className="admin-card" data-testid="quotes-section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Quote Requests</h2>
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search quotes..."
                  value={quotesSearchTerm}
                  onChange={(e) => setQuotesSearchTerm(e.target.value)}
                  className="input-field pl-10 h-10 w-64"
                  data-testid="search-quotes"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredQuotes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No quote requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Route</th>
                      <th>Date & Time</th>
                      <th>Passengers</th>
                      <th>Vehicle Pref</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.map((quote) => (
                      <tr key={quote.id} data-testid={`quote-row-${quote.id}`}>
                        <td>
                          <div>
                            <p className="font-medium">{quote.passenger_name}</p>
                            <p className="text-xs text-slate-500">{quote.passenger_email}</p>
                            <p className="text-xs text-slate-500">{quote.passenger_phone}</p>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <p>{quote.pickup_location?.substring(0, 30)}{quote.pickup_location?.length > 30 ? '...' : ''}</p>
                            <p className="text-slate-500">→ {quote.dropoff_location?.substring(0, 30)}{quote.dropoff_location?.length > 30 ? '...' : ''}</p>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <p>{quote.pickup_date}</p>
                            <p className="text-slate-500">{quote.pickup_time}</p>
                            {quote.trip_type === 'round-trip' && (
                              <p className="text-xs text-amber-600 mt-1">Return: {quote.return_date}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          <p>{quote.passengers}</p>
                          <p className="text-xs text-slate-500">{quote.luggage} bags</p>
                        </td>
                        <td className="capitalize">{quote.vehicle_preference || '-'}</td>
                        <td>
                          <span className={`badge ${getQuoteStatusBadge(quote.status)}`}>
                            {quote.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <select
                              value={quote.status}
                              onChange={(e) => handleQuoteStatusChange(quote.id, e.target.value)}
                              className="text-sm border border-slate-200 rounded px-2 py-1"
                              data-testid={`quote-status-select-${quote.id}`}
                            >
                              <option value="new">New</option>
                              <option value="responded">Responded</option>
                              <option value="converted">Converted</option>
                              <option value="closed">Closed</option>
                            </select>
                            <button
                              onClick={() => navigate(`/admin/quote/${quote.id}`)}
                              className="p-2 hover:bg-slate-100 rounded"
                              title="View Details"
                              data-testid={`view-quote-${quote.id}`}
                            >
                              <Eye size={18} className="text-slate-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="p-2 hover:bg-red-50 rounded"
                              title="Delete Quote"
                              data-testid={`delete-quote-${quote.id}`}
                            >
                              <Trash size={18} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="admin-card" data-testid="partners-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Partner Requests</h2>
                <p className="text-sm text-slate-500 mt-1">{partners.length} total · {partners.filter(p=>p.status==='new').length} new</p>
              </div>
              <a href="/partners" target="_blank" rel="noopener noreferrer" className="btn-gold py-2 px-4 text-sm flex items-center gap-2">
                <Buildings size={16} /> View Partner Page
              </a>
            </div>
            {partners.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Handshake size={40} className="mx-auto mb-3 opacity-40" />
                <p>No partner requests yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wide">
                      <th className="pb-3 pr-4">Company</th>
                      <th className="pb-3 pr-4">Contact</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Monthly</th>
                      <th className="pb-3 pr-4">Email / Phone</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partners.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-slate-900">{p.company_name}</td>
                        <td className="py-3 pr-4 text-slate-700">{p.contact_name}</td>
                        <td className="py-3 pr-4 text-slate-600 capitalize">{p.business_type?.replace(/_/g,' ')}</td>
                        <td className="py-3 pr-4 text-slate-600">{p.monthly_bookings}</td>
                        <td className="py-3 pr-4">
                          <div className="text-slate-700">{p.email}</div>
                          <div className="text-slate-400 text-xs">{p.phone}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={p.status}
                            onChange={async (e) => {
                              await axios.put(`${API}/partners/${p.id}/status`, { status: e.target.value });
                              setPartners(prev => prev.map(x => x.id===p.id ? {...x, status: e.target.value} : x));
                            }}
                            className={`text-xs px-2 py-1 rounded-full border font-medium ${p.status==='new' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : p.status==='contacted' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-green-50 border-green-200 text-green-700'}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="active">Active Partner</option>
                            <option value="declined">Declined</option>
                          </select>
                        </td>
                        <td className="py-3 text-slate-400 text-xs">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Talixo Tab */}
        {activeTab === 'talixo' && (
          <div className="admin-card" data-testid="talixo-section">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Talixo Bookings</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {stats.talixo_enabled
                    ? 'Talixo integration is ENABLED'
                    : 'Talixo integration is DISABLED (TALIXO_ENABLED=false)'}
                  {' · '}
                  {stats.talixo_api_booking
                    ? 'API booking ON'
                    : 'API booking OFF — manual fulfillment mode'}
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  stats.talixo_enabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {stats.talixo_enabled ? 'Live' : 'Disabled'}
                </span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Talixo..."
                    value={talixoSearch}
                    onChange={(e) => setTalixoSearch(e.target.value)}
                    className="input-field pl-9 h-10 w-56 text-sm"
                    data-testid="search-talixo"
                  />
                </div>
              </div>
            </div>

            {/* Talixo Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.total_talixo_bookings || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Total Requests</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{stats.talixo_pending_manual || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Pending Manual</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{stats.talixo_confirmed || 0}</p>
                <p className="text-xs text-slate-500 mt-1">API Confirmed</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : talixoBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No Talixo booking requests yet.
                {!stats.talixo_enabled && (
                  <p className="text-xs mt-2 text-amber-600">
                    Set TALIXO_ENABLED=true and TALIXO_API_KEY to start receiving bookings.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Route</th>
                      <th>Date &amp; Time</th>
                      <th>Vehicle</th>
                      <th>Price</th>
                      <th>Talixo Ref</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {talixoBookings
                      .filter(b => {
                        if (!talixoSearch) return true;
                        const q = talixoSearch.toLowerCase();
                        return (
                          (b.customer_name  || '').toLowerCase().includes(q) ||
                          (b.customer_email || '').toLowerCase().includes(q) ||
                          (b.pickup_location || '').toLowerCase().includes(q) ||
                          (b.dropoff_location || '').toLowerCase().includes(q) ||
                          (b.talixo_reference || '').toLowerCase().includes(q) ||
                          (b.id || '').toLowerCase().includes(q)
                        );
                      })
                      .map(b => (
                        <tr key={b.id} data-testid={`talixo-booking-row-${b.id}`}>
                          <td>
                            <p className="font-medium">{b.customer_name}</p>
                            <p className="text-xs text-slate-500">{b.customer_email}</p>
                            <p className="text-xs text-slate-400">{b.customer_phone}</p>
                          </td>
                          <td>
                            <p className="font-medium text-sm">{b.pickup_location}</p>
                            <p className="text-xs text-slate-500">→ {b.dropoff_location}</p>
                            {b.flight_number && (
                              <p className="text-xs text-blue-600 mt-0.5">✈ {b.flight_number}</p>
                            )}
                          </td>
                          <td>
                            <p className="text-sm font-medium">{b.pickup_date}</p>
                            <p className="text-xs text-slate-500">{b.pickup_time}</p>
                          </td>
                          <td>
                            <p className="text-sm font-semibold">{b.vehicle_class}</p>
                            {b.car_model && <p className="text-xs text-slate-400">{b.car_model}</p>}
                            <p className="text-xs text-slate-400">{b.passengers} pax · {b.luggage} bags</p>
                          </td>
                          <td>
                            <p className="font-bold text-[#d4af37]">
                              {b.currency} {b.price != null ? Number(b.price).toFixed(2) : '—'}
                            </p>
                          </td>
                          <td>
                            {b.talixo_reference ? (
                              <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {b.talixo_reference}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Not yet created</span>
                            )}
                            <p className="text-xs text-slate-300 mt-0.5 font-mono">
                              {(b.id || '').slice(0, 8)}…
                            </p>
                          </td>
                          <td>
                            <span className={`badge ${
                              b.booking_status === 'confirmed'        ? 'badge-success' :
                              b.booking_status === 'request_received' ? 'badge-warning' :
                              b.booking_status === 'cancelled'        ? 'badge-danger'  : 'badge-info'
                            }`}>
                              {b.booking_status === 'request_received' ? 'Pending Manual' : b.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MyTransfers Tab */}
        {activeTab === 'mytransfers' && (
          <div className="admin-card" data-testid="mytransfers-section">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">MyTransfers Bookings</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {stats.mytransfers_enabled
                    ? 'MyTransfers integration is ENABLED'
                    : 'MyTransfers integration is DISABLED (MYTRANSFERS_ENABLED=false)'}
                  {' · '}
                  {stats.mytransfers_api_booking
                    ? 'API booking ON'
                    : 'API booking OFF — manual fulfillment mode'}
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  stats.mytransfers_enabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {stats.mytransfers_enabled ? 'Live' : 'Disabled'}
                </span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search MyTransfers..."
                    value={mytransfersSearch}
                    onChange={(e) => setMyTransfersSearch(e.target.value)}
                    className="input-field pl-9 h-10 w-56 text-sm"
                    data-testid="search-mytransfers"
                  />
                </div>
              </div>
            </div>

            {/* MyTransfers Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.total_mytransfers_bookings || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Total Requests</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{stats.mytransfers_pending_manual || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Pending Manual</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{stats.mytransfers_confirmed || 0}</p>
                <p className="text-xs text-slate-500 mt-1">API Confirmed</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : mytransfersBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No MyTransfers booking requests yet.
                {!stats.mytransfers_enabled && (
                  <p className="text-xs mt-2 text-amber-600">
                    Set MYTRANSFERS_ENABLED=true and MYTRANSFERS_API_KEY to start receiving bookings.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Route</th>
                      <th>Date &amp; Time</th>
                      <th>Vehicle</th>
                      <th>Price</th>
                      <th>MT Order ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mytransfersBookings
                      .filter(b => {
                        if (!mytransfersSearch) return true;
                        const q = mytransfersSearch.toLowerCase();
                        return (
                          (b.customer_name   || '').toLowerCase().includes(q) ||
                          (b.customer_email  || '').toLowerCase().includes(q) ||
                          (b.pickup_location  || '').toLowerCase().includes(q) ||
                          (b.dropoff_location || '').toLowerCase().includes(q) ||
                          String(b.mt_order_id  || '').toLowerCase().includes(q) ||
                          (b.id || '').toLowerCase().includes(q)
                        );
                      })
                      .map(b => (
                        <tr key={b.id} data-testid={`mytransfers-booking-row-${b.id}`}>
                          <td>
                            <p className="font-medium">{b.customer_name}</p>
                            <p className="text-xs text-slate-500">{b.customer_email}</p>
                            <p className="text-xs text-slate-400">{b.customer_phone}</p>
                          </td>
                          <td>
                            <p className="font-medium text-sm">{b.pickup_location}</p>
                            <p className="text-xs text-slate-500">→ {b.dropoff_location}</p>
                            {b.flight_number && (
                              <p className="text-xs text-blue-600 mt-0.5">✈ {b.flight_number}</p>
                            )}
                          </td>
                          <td>
                            <p className="text-sm font-medium">{b.pickup_date}</p>
                            <p className="text-xs text-slate-500">{b.pickup_time}</p>
                          </td>
                          <td>
                            <p className="text-sm font-semibold">{b.vehicle_class}</p>
                            <p className="text-xs text-slate-400">{b.passengers} pax</p>
                            <p className="text-xs text-slate-300 font-mono">ID: {b.transfer_id}</p>
                          </td>
                          <td>
                            <p className="font-bold text-[#d4af37]">
                              {b.currency} {b.price != null ? Number(b.price).toFixed(2) : '—'}
                            </p>
                          </td>
                          <td>
                            {b.mt_order_id ? (
                              <span className="font-mono text-sm font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                #{b.mt_order_id}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Not yet created</span>
                            )}
                            <p className="text-xs text-slate-300 mt-0.5 font-mono">
                              {(b.id || '').slice(0, 8)}…
                            </p>
                          </td>
                          <td>
                            <span className={`badge ${
                              b.booking_status === 'confirmed'        ? 'badge-success' :
                              b.booking_status === 'request_received' ? 'badge-warning' :
                              b.booking_status === 'cancelled'        ? 'badge-danger'  : 'badge-info'
                            }`}>
                              {b.booking_status === 'request_received' ? 'Pending Manual' : b.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="route-modal">
          <div className="bg-white w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button onClick={() => setShowRouteModal(false)} className="p-2 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRouteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Location</label>
                  <input
                    type="text"
                    value={routeForm.from_location}
                    onChange={(e) => setRouteForm({...routeForm, from_location: e.target.value})}
                    className="input-field"
                    placeholder="e.g., London Heathrow"
                    required
                    data-testid="route-from"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To Location</label>
                  <input
                    type="text"
                    value={routeForm.to_location}
                    onChange={(e) => setRouteForm({...routeForm, to_location: e.target.value})}
                    className="input-field"
                    placeholder="e.g., London City Center"
                    required
                    data-testid="route-to"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Economy Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={routeForm.economy_price}
                    onChange={(e) => setRouteForm({...routeForm, economy_price: e.target.value})}
                    className="input-field"
                    placeholder="45.00"
                    required
                    data-testid="route-economy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={routeForm.business_price}
                    onChange={(e) => setRouteForm({...routeForm, business_price: e.target.value})}
                    className="input-field"
                    placeholder="75.00"
                    required
                    data-testid="route-business"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Group Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={routeForm.group_price}
                    onChange={(e) => setRouteForm({...routeForm, group_price: e.target.value})}
                    className="input-field"
                    placeholder="110.00"
                    required
                    data-testid="route-group"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bus Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={routeForm.bus_price}
                    onChange={(e) => setRouteForm({...routeForm, bus_price: e.target.value})}
                    className="input-field"
                    placeholder="280.00"
                    required
                    data-testid="route-bus"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowRouteModal(false)} className="btn-secondary py-2 px-6">
                  Cancel
                </button>
                <button type="submit" className="btn-gold py-2 px-6 flex items-center gap-2" data-testid="save-route-btn">
                  <Check size={18} />
                  {editingRoute ? 'Update Route' : 'Add Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
