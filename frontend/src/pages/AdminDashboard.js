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
  MagnifyingGlass
} from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [routeForm, setRouteForm] = useState({
    from_location: '',
    to_location: '',
    economy_price: '',
    business_price: '',
    group_price: '',
    bus_price: ''
  });

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
      const [statsRes, bookingsRes, routesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/bookings`),
        axios.get(`${API}/routes/prices`)
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setRoutes(routesRes.data);
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

  const filteredBookings = bookings.filter(booking => 
    booking.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.passenger_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.dropoff_location?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card" data-testid="stat-total-bookings">
            <div className="stat-value">{stats.total_bookings || 0}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card" data-testid="stat-pending">
            <div className="stat-value">{stats.pending_bookings || 0}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card" data-testid="stat-confirmed">
            <div className="stat-value">{stats.confirmed_bookings || 0}</div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card" data-testid="stat-revenue">
            <div className="stat-value">£{(stats.total_revenue || 0).toFixed(2)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

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
                      <tr key={booking.id} data-testid={`booking-row-${booking.id}`}>
                        <td>
                          <div>
                            <p className="font-medium">{booking.passenger_name}</p>
                            <p className="text-xs text-slate-500">{booking.passenger_email}</p>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <p>{booking.pickup_location}</p>
                            <p className="text-slate-500">→ {booking.dropoff_location}</p>
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
                        <td>
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
