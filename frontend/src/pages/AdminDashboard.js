import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CarSimple, House, ListDashes, CurrencyGbp, SignOut, Plus, Trash,
  PencilSimple, X, Check, MagnifyingGlass, ChatCircleText, Handshake,
  Gear, FilePdf, Note, CheckCircle, ArrowsClockwise,
  UserCircle, Phone, Envelope, Copy, ArrowDown, ArrowUp, ClockCounterClockwise, FunnelSimple
} from '@phosphor-icons/react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ── Booking.com-style blue used throughout admin action buttons ──
const BLU = 'bg-[#0071c2] hover:bg-[#005999] text-white';

function QuoteReplyPanel({ quoteId, passengerEmail, api, onSent }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ price: '', message: '', payment_link: '' });
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  if (!passengerEmail) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={`w-full py-2.5 text-sm font-semibold rounded-lg ${BLU} flex items-center justify-center gap-2 transition`}
        data-testid="send-quote-reply-btn"
      >
        <Envelope size={15} weight="fill" /> {sent ? 'Quote Sent ✓' : 'Send Quote to Customer'}
      </button>
      {open && !sent && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price (£) — leave blank if discussing</label>
            <input value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
              placeholder="e.g. 89.50" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              data-testid="reply-price" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Your Message *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
              rows={4} placeholder={"Dear [name],\n\nThank you for your quote request. Please find your transfer price above…"}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              data-testid="reply-message" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Payment Link — optional</label>
            <input value={form.payment_link} onChange={e => setForm(f => ({...f, payment_link: e.target.value}))}
              placeholder="Paste iWay or manual booking payment link" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              data-testid="reply-payment-link" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={e => { e.stopPropagation(); setOpen(false); }}
              className="flex-none px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">
              Cancel
            </button>
            <button type="button" disabled={sending || !form.message.trim()}
              onClick={async e => {
                e.stopPropagation();
                setSending(true);
                try {
                  await axios.post(`${api}/quotes/${quoteId}/reply`, form);
                  setSent(true); setOpen(false); onSent();
                } catch(err) { alert('Failed to send. Please try again.'); }
                finally { setSending(false); }
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg ${BLU} disabled:opacity-50 transition`}
              data-testid="confirm-reply-btn">
              {sending ? 'Sending…' : `Send to ${passengerEmail}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const FULFILLMENT_COLORS = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  sent:      'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};
const PAYMENT_COLORS = {
  unpaid:            'bg-red-50 text-red-700 border-red-200',
  paid:              'bg-green-50 text-green-700 border-green-200',
  payment_completed: 'bg-green-50 text-green-700 border-green-200',
  pending:           'bg-yellow-50 text-yellow-700 border-yellow-200',
  refunded:          'bg-slate-50 text-slate-500 border-slate-200',
};

function StatusBadge({ value, colorMap }) {
  const cls = colorMap[value] || 'bg-slate-50 text-slate-500 border-slate-200';
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

const EMPTY_BOOKING = {
  passenger_name: '', passenger_email: '', passenger_phone: '', flight_number: '',
  pickup_location: '', dropoff_location: '', pickup_date: '', pickup_time: '',
  vehicle_type: 'Standard', passengers: 1, luggage: 0,
  customer_price: '', currency: 'GBP', payment_status: 'unpaid',
  booking_status: 'confirmed', internal_notes: '', greeting_sign: '',
  booking_source: 'manual'
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab]             = useState('bookings');
  const [allBookings, setAll]     = useState([]);
  const [quotes, setQuotes]       = useState([]);
  const [partners, setPartners]   = useState([]);
  const [routes, setRoutes]       = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [expandedId, setExpanded] = useState(null);
  const [supplierForm, setSF]     = useState({});
  const [savingId, setSavingId]   = useState(null);
  const [voucherLoading, setVL]   = useState(null);
  const [newBooking, setNB]       = useState(EMPTY_BOOKING);
  const [nbLoading, setNBL]       = useState(false);
  const [nbDone, setNBDone]       = useState(null);
  // quote expand
  const [expandedQuoteId, setExpandedQuote] = useState(null);
  const [quoteForm, setQF]                  = useState({});
  const [savingQuoteId, setSavingQId]       = useState(null);
  const [copiedField, setCopied]            = useState('');
  const [quoteStatusFilter, setQuoteFilter] = useState('all');
  const [quoteEditMode, setQuoteEditMode]   = useState(false);
  const [quoteEditData, setQuoteEditData]   = useState({});
  const [savingEditId, setSavingEditId]     = useState(null);
  // routes
  const [showRouteModal, setRouteModal] = useState(false);
  const [editingRoute, setEditRoute]    = useState(null);
  const [routeForm, setRouteForm]       = useState({from_location:'',to_location:'',economy_price:'',business_price:'',group_price:'',bus_price:''});

  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) { navigate('/admin'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [allRes, quotesRes, partnersRes, routesRes, statsRes] = await Promise.all([
        axios.get(`${API}/all-bookings`).catch(() => ({ data: [] })),
        axios.get(`${API}/quotes`).catch(() => ({ data: [] })),
        axios.get(`${API}/partners`).catch(() => ({ data: [] })),
        axios.get(`${API}/routes/prices`).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/stats`).catch(() => ({ data: {} })),
      ]);
      setAll(allRes.data);
      setQuotes(quotesRes.data);
      setPartners(partnersRes.data);
      setRoutes(routesRes.data);
      setStats(statsRes.data);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { localStorage.removeItem('adminAuth'); navigate('/admin'); };

  const filtered = allBookings.filter(b => {
    const q = search.toLowerCase();
    return !q || [b.passenger_name, b.pickup_location, b.dropoff_location,
      b.internal_booking_id, b.id, b.supplier_name, b.passenger_email]
      .some(v => (v||'').toLowerCase().includes(q));
  });

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpanded(null); return; }
    setExpanded(id);
    const b = allBookings.find(x => x.id === id);
    setSF({
      supplier_name: b?.supplier_name || '',
      supplier_reference: b?.supplier_reference || '',
      supplier_cost: b?.supplier_cost || '',
      fulfillment_status: b?.fulfillment_status || 'pending',
      booking_status: b?.booking_status || 'confirmed',
      payment_status: b?.payment_status || 'unpaid',
      internal_notes: b?.internal_notes || '',
    });
  };

  const saveSupplier = async (id) => {
    setSavingId(id);
    await axios.put(`${API}/bookings/${id}/supplier`, supplierForm);
    setAll(prev => prev.map(b => b.id === id ? { ...b, ...supplierForm } : b));
    setSavingId(null);
    setExpanded(null);
  };

  const toggleQuote = (q) => {
    if (expandedQuoteId === q.id) { setExpandedQuote(null); setQuoteEditMode(false); return; }
    setExpandedQuote(q.id);
    setQF({ status: q.status || 'pending', admin_notes: q.admin_notes || '' });
    setQuoteEditMode(false);
    setQuoteEditData({ ...q });
  };

  const saveQuote = async (qid, e) => {
    e.stopPropagation();
    setSavingQId(qid);
    try {
      await axios.put(`${API}/quotes/${qid}/status`, quoteForm);
      setQuotes(prev => prev.map(x => x.id === qid ? { ...x, ...quoteForm } : x));
    } catch (err) { console.error(err); }
    finally { setSavingQId(null); }
  };

  const saveQuoteEdit = async (qid, e) => {
    e.stopPropagation();
    setSavingEditId(qid);
    try {
      await axios.put(`${API}/quotes/${qid}/edit`, quoteEditData);
      setQuotes(prev => prev.map(x => x.id === qid ? { ...x, ...quoteEditData } : x));
      setQuoteEditMode(false);
    } catch (err) { console.error(err); }
    finally { setSavingEditId(null); }
  };

  const copyToClipboard = (text, label, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const QUOTE_STATUS_COLORS = {
    new:               'bg-blue-50 text-blue-700 border-blue-200',
    pending:           'bg-blue-50 text-blue-700 border-blue-200',
    in_progress:       'bg-yellow-50 text-yellow-700 border-yellow-200',
    quote_sent:        'bg-purple-50 text-purple-700 border-purple-200',
    awaiting_customer: 'bg-orange-50 text-orange-700 border-orange-200',
    confirmed:         'bg-green-50 text-green-700 border-green-200',
    done:              'bg-teal-50 text-teal-700 border-teal-200',
    cancelled:         'bg-red-50 text-red-700 border-red-200',
  };
  const qStatuses = ['pending','in_progress','quote_sent','awaiting_customer','confirmed','done','cancelled'];
  const qStatusLabel = s => ({
    new: 'Pending', pending: 'Pending', in_progress: 'In Progress',
    quote_sent: 'Quote Sent', awaiting_customer: 'Awaiting Customer',
    confirmed: 'Confirmed', done: 'Done', cancelled: 'Cancelled',
    reviewing: 'Reviewing', quoted: 'Quoted', accepted: 'Accepted', declined: 'Declined', closed: 'Closed',
  }[s] || s);
  const QD = (label, value) => (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 break-words">{value || '—'}</p>
    </div>
  );

  const sendVoucher = async (id) => {
    setVL(id);
    try {
      await axios.post(`${API}/bookings/${id}/send-voucher`);
      setAll(prev => prev.map(b => b.id === id ? { ...b, voucher_sent: true } : b));
      alert('Voucher sent!');
    } catch { alert('Failed to send voucher.'); }
    setVL(null);
  };

  const submitManual = async (e) => {
    e.preventDefault();
    setNBL(true);
    try {
      const { data } = await axios.post(`${API}/manual-bookings`, {
        ...newBooking,
        customer_price: parseFloat(newBooking.customer_price),
        passengers: parseInt(newBooking.passengers),
        luggage: parseInt(newBooking.luggage),
      });
      setNBDone(`PT-${data.id.slice(0,8).toUpperCase()}`);
      setAll(prev => [{ ...data, source: 'manual' }, ...prev]);
    } catch { alert('Error creating booking. Check all fields.'); }
    setNBL(false);
  };

  const SOURCE_LABELS = {
    iway:          'iWay White Label',
    manual:        'Manual Booking',
    quote_request: 'Quote Request',
  };
  const SOURCE_COLORS = {
    iway:          'bg-blue-100 text-blue-700',
    manual:        'bg-purple-100 text-purple-700',
    quote_request: 'bg-green-100 text-green-700',
  };

  const sourceLabel = (b) => SOURCE_LABELS[b.booking_source || b.source] || SOURCE_LABELS[b.source] || 'Manual Booking';
  const sourceColor = (b) => SOURCE_COLORS[b.booking_source || b.source] || SOURCE_COLORS[b.source] || 'bg-purple-100 text-purple-700';
  // Safe price helper — iWay bookings use customer_price (mapped from price in /all-bookings)
  const customerPrice = (b) => parseFloat(b.customer_price || b.price || b.total_price || 0);

  // ── Nav items ─────────────────────────────────────────────────────────────
  const NAV = [
    { id: 'dashboard',  label: 'Dashboard',       icon: <House size={18} /> },
    { id: 'bookings',   label: 'All Bookings',     icon: <ListDashes size={18} />, badge: allBookings.filter(b=>b.booking_status==='pending'||!b.booking_status).length || null },
    { id: 'new',        label: 'New Booking',      icon: <Plus size={18} /> },
    { id: 'quotes',     label: 'Quote Requests',   icon: <ChatCircleText size={18} />, badge: quotes.filter(q=>['new','pending'].includes(q.status)).length || null },
    { id: 'partners',   label: 'Partner Requests', icon: <Handshake size={18} />, badge: partners.filter(p=>p.status==='new').length || null },
    { id: 'settings',   label: 'Settings',         icon: <Gear size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f2] flex">

      {/* ── Sidebar ── */}
      <aside className="w-56 min-h-screen bg-[#1a1a2e] flex flex-col py-6 px-3 fixed top-0 left-0 z-40">
        <div className="flex items-center gap-2 px-2 mb-8">
          <CarSimple size={24} weight="fill" className="text-[#d4af37]" />
          <span className="text-white font-semibold text-sm font-['Playfair_Display']">Planet Transfers</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab===n.id ? 'bg-[#d4af37] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              data-testid={`nav-${n.id}`}>
              {n.icon} <span className="flex-1 text-left">{n.label}</span>
              {n.badge ? <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{n.badge}</span> : null}
            </button>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white text-sm mt-4">
          <SignOut size={18} /> Sign Out
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="ml-56 flex-1 p-6">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-6">Dashboard</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Bookings',  value: allBookings.length,                                                     color: 'text-blue-600' },
                { label: 'Pending',         value: allBookings.filter(b=>!b.booking_status||b.booking_status==='pending').length, color: 'text-yellow-600' },
                { label: 'Confirmed',       value: allBookings.filter(b=>b.booking_status==='confirmed').length,            color: 'text-green-600' },
                { label: 'Open Quotes',     value: quotes.filter(q=>['new','pending'].includes(q.status)).length,                              color: 'text-purple-600' },
              ].map((c,i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                  <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 mb-4">Recent Bookings</h2>
              {allBookings.slice(0,5).map(b => (
                <div key={b.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{b.passenger_name}</p>
                    <p className="text-xs text-slate-400">{b.pickup_location} → {b.dropoff_location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{b.currency||'GBP'} {customerPrice(b).toFixed(2)}</p>
                    <StatusBadge value={b.booking_status||'pending'} colorMap={FULFILLMENT_COLORS} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ALL BOOKINGS ── */}
        {tab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-semibold text-slate-900">All Bookings</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, route, ref..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white w-56" />
                </div>
                <button onClick={fetchAll} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50">
                  <ArrowsClockwise size={16} className="text-slate-500" />
                </button>
                <button onClick={() => setTab('new')} className="btn-gold py-2 px-4 text-sm flex items-center gap-2">
                  <Plus size={16} /> New Booking
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="text-center py-16 text-slate-400">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">No bookings found</div>
              ) : (
                <div>
                  {/* Table header — simplified, supplier fields hidden */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <div className="col-span-1">Source</div>
                    <div className="col-span-2">Passenger</div>
                    <div className="col-span-4">Route</div>
                    <div className="col-span-1">Date</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-1">Payment</div>
                    <div className="col-span-1">Status</div>
                  </div>

                  {filtered.map(b => (
                    <div key={b.id}>
                      <div
                        onClick={() => toggleExpand(b.id)}
                        className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer items-center text-sm"
                        data-testid={`booking-row-${b.id?.slice(0,8)}`}
                      >
                        <div className="col-span-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sourceColor(b)}`}>
                            {b.source==='manual' ? 'Manual' : 'iWay'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <p className="font-medium text-slate-900 truncate">{b.passenger_name}</p>
                          <p className="text-xs text-slate-400 truncate">{b.passenger_email}</p>
                        </div>
                        <div className="col-span-4">
                          <p className="text-slate-700 text-xs truncate">{b.pickup_location}</p>
                          <p className="text-slate-400 text-xs truncate">→ {b.dropoff_location}</p>
                        </div>
                        <div className="col-span-1 text-xs text-slate-600">{b.pickup_date}</div>
                        <div className="col-span-2 font-semibold text-slate-800">{b.currency||'GBP'} {customerPrice(b).toFixed(2)}</div>
                        <div className="col-span-1"><StatusBadge value={b.payment_status||'unpaid'} colorMap={PAYMENT_COLORS} /></div>
                        <div className="col-span-1"><StatusBadge value={b.booking_status||'pending'} colorMap={FULFILLMENT_COLORS} /></div>
                      </div>

                      {/* ── Booking management panel (supplier fields hidden) ── */}
                      {expandedId === b.id && (
                        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5" data-testid={`booking-expand-${b.id?.slice(0,8)}`}>
                          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">BOOKING STATUS</label>
                              <select value={supplierForm.booking_status||''} onChange={e=>setSF(f=>({...f,booking_status:e.target.value}))}
                                className="input-field text-sm" data-testid="booking-status-select">
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">PAYMENT STATUS</label>
                              <select value={supplierForm.payment_status||''} onChange={e=>setSF(f=>({...f,payment_status:e.target.value}))}
                                className="input-field text-sm" data-testid="payment-status-select">
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                                <option value="payment_completed">Payment Completed</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">INTERNAL NOTES</label>
                            <textarea value={supplierForm.internal_notes||''} onChange={e=>setSF(f=>({...f,internal_notes:e.target.value}))}
                              rows={2} placeholder="Notes visible only to admin..." className="input-field text-sm resize-none w-full" data-testid="internal-notes-input" />
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            <button onClick={() => saveSupplier(b.id)} disabled={savingId===b.id}
                              className={`${BLU} py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50 rounded-lg font-semibold transition`}
                              data-testid="save-booking-btn">
                              <Check size={16} /> {savingId===b.id ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button onClick={() => sendVoucher(b.id)} disabled={voucherLoading===b.id || !b.passenger_email}
                              className="flex items-center gap-2 text-sm font-medium px-5 py-2 border-2 border-[#1a1a2e] text-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-white rounded-lg transition-all disabled:opacity-40"
                              title={!b.passenger_email ? 'No email on this booking' : ''}
                              data-testid="send-voucher-btn">
                              <FilePdf size={16} /> {voucherLoading===b.id ? 'Sending...' : b.voucher_sent ? 'Re-send Voucher' : 'Send Voucher PDF'}
                            </button>
                            <button onClick={() => setExpanded(null)} className="text-sm text-slate-400 hover:text-slate-600 ml-auto">
                              <X size={18} />
                            </button>
                            {b.voucher_sent && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={14} weight="fill" /> Voucher sent</span>}
                          </div>

                          {/* Booking details strip */}
                          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-500">
                            <div><span className="font-semibold uppercase">Vehicle</span><br/>{b.vehicle_type||'—'}</div>
                            <div><span className="font-semibold uppercase">Passengers</span><br/>{b.passengers||b.adults||'—'}</div>
                            <div><span className="font-semibold uppercase">Flight</span><br/>{b.flight_number||'—'}</div>
                            <div><span className="font-semibold uppercase">Phone</span><br/>{b.passenger_phone||'—'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NEW MANUAL BOOKING ── */}
        {tab === 'new' && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold text-slate-900 mb-6">New Booking</h1>
            {nbDone ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                <CheckCircle size={48} weight="fill" className="text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Booking Created: {nbDone}</h3>
                <p className="text-slate-500 text-sm mb-6">The booking has been added to All Bookings. You can now send the voucher PDF to the passenger.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => { setNBDone(null); setNB(EMPTY_BOOKING); }} className="btn-gold py-2 px-5 text-sm">Create Another</button>
                  <button onClick={() => { setTab('bookings'); setNBDone(null); setNB(EMPTY_BOOKING); }} className="border-2 border-slate-300 text-slate-700 py-2 px-5 rounded-lg text-sm hover:bg-slate-50">View All Bookings</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitManual} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5">

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Passenger</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                      <input required value={newBooking.passenger_name} onChange={e=>setNB(f=>({...f,passenger_name:e.target.value}))} className="input-field" data-testid="nb-name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone / WhatsApp</label>
                      <input value={newBooking.passenger_phone} onChange={e=>setNB(f=>({...f,passenger_phone:e.target.value}))} className="input-field" data-testid="nb-phone" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                      <input type="email" value={newBooking.passenger_email} onChange={e=>setNB(f=>({...f,passenger_email:e.target.value}))} className="input-field" data-testid="nb-email" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Flight Number</label>
                      <input value={newBooking.flight_number} onChange={e=>setNB(f=>({...f,flight_number:e.target.value}))} placeholder="BA123" className="input-field" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Transfer</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Pickup Location *</label>
                      <input required value={newBooking.pickup_location} onChange={e=>setNB(f=>({...f,pickup_location:e.target.value}))} placeholder="e.g. London Heathrow Airport Terminal 5" className="input-field" data-testid="nb-pickup" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Drop-off Location *</label>
                      <input required value={newBooking.dropoff_location} onChange={e=>setNB(f=>({...f,dropoff_location:e.target.value}))} placeholder="e.g. 10 Downing Street, London SW1A" className="input-field" data-testid="nb-dropoff" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                        <input type="date" required value={newBooking.pickup_date} onChange={e=>setNB(f=>({...f,pickup_date:e.target.value}))} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Time *</label>
                        <input type="time" required value={newBooking.pickup_time} onChange={e=>setNB(f=>({...f,pickup_time:e.target.value}))} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Vehicle *</label>
                        <select value={newBooking.vehicle_type} onChange={e=>setNB(f=>({...f,vehicle_type:e.target.value}))} className="input-field">
                          <option>Standard</option>
                          <option>Executive</option>
                          <option>Minivan / MPV</option>
                          <option>Minibus</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Passengers</label>
                        <input type="number" min="1" max="50" value={newBooking.passengers} onChange={e=>setNB(f=>({...f,passengers:e.target.value}))} className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Greeting Sign (name on board)</label>
                      <input value={newBooking.greeting_sign} onChange={e=>setNB(f=>({...f,greeting_sign:e.target.value}))} placeholder="Name to display on driver's board" className="input-field" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Price (£) *</label>
                      <input type="number" step="0.01" required value={newBooking.customer_price} onChange={e=>setNB(f=>({...f,customer_price:e.target.value}))} placeholder="0.00" className="input-field" data-testid="nb-price" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Status</label>
                      <select value={newBooking.payment_status} onChange={e=>setNB(f=>({...f,payment_status:e.target.value}))} className="input-field">
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Internal Notes</label>
                  <textarea rows={2} value={newBooking.internal_notes} onChange={e=>setNB(f=>({...f,internal_notes:e.target.value}))} placeholder="Admin notes only — not visible to customer" className="input-field resize-none w-full" />
                </div>

                <button type="submit" disabled={nbLoading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50" data-testid="nb-submit">
                  {nbLoading ? 'Creating...' : <><Plus size={18} /> Create Booking</>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── QUOTES ── */}
        {tab === 'quotes' && (
          <div>
            {/* Header + Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h1 className="text-2xl font-semibold text-slate-900">Quote Requests</h1>
              <div className="flex items-center gap-2">
                <FunnelSimple size={16} className="text-slate-400" />
                <select
                  value={quoteStatusFilter}
                  onChange={e => { setQuoteFilter(e.target.value); setExpandedQuote(null); }}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  data-testid="quote-filter-select"
                >
                  <option value="all">All Statuses</option>
                  {[['pending','Pending'],['in_progress','In Progress'],['quote_sent','Quote Sent'],
                    ['awaiting_customer','Awaiting Customer'],['confirmed','Confirmed'],['done','Done'],['cancelled','Cancelled']
                  ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {(() => {
                const filtered = quotes.filter(q => {
                  if (quoteStatusFilter === 'all') return true;
                  const eff = (q.status === 'new') ? 'pending' : q.status;
                  return eff === quoteStatusFilter;
                });
                if (filtered.length === 0) return (
                  <div className="text-center py-16 text-slate-400">
                    {quoteStatusFilter !== 'all' ? `No ${quoteStatusFilter.replace('_',' ')} quotes` : 'No quote requests yet'}
                  </div>
                );
                return filtered.map(q => {
                const isOpen = expandedQuoteId === q.id;
                const isRT = q.trip_type === 'round-trip';
                const retPickup = q.return_pickup_time || q.return_time;
                const retPax = q.same_pax_luggage !== false ? q.passengers : q.return_passengers;
                const retLug = q.same_pax_luggage !== false ? q.luggage : q.return_luggage;
                const effStatus = q.status === 'new' ? 'pending' : q.status;

                return (
                  <div key={q.id} className="border-b border-slate-100 last:border-b-0">
                    {/* Row */}
                    <div
                      onClick={() => toggleQuote(q)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                      data-testid={`quote-row-${q.id?.slice(0,8)}`}
                    >
                      <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <p className="font-medium text-slate-900 text-sm truncate">{q.passenger_name}</p>
                          <p className="text-xs text-slate-400 truncate">{q.passenger_email}</p>
                        </div>
                        <div className="col-span-3">
                          <p className="text-xs text-slate-600 truncate">{q.pickup_location}</p>
                          <p className="text-xs text-slate-400 truncate">→ {q.dropoff_location}</p>
                        </div>
                        <div className="col-span-2 text-xs text-slate-600">
                          <p>{q.pickup_date}</p>
                          {isRT && <p className="text-amber-600 font-medium">Round-Trip</p>}
                        </div>
                        <div className="col-span-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${QUOTE_STATUS_COLORS[effStatus] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {qStatusLabel(q.status)}
                          </span>
                        </div>
                        <div className="col-span-2 text-xs text-slate-400">
                          {new Date(q.created_at).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toggleQuote(q); }}
                        className="flex-none flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition whitespace-nowrap"
                        data-testid={`quote-view-${q.id?.slice(0,8)}`}
                      >
                        {isOpen ? <><ArrowUp size={13}/> Close</> : <><ArrowDown size={13}/> View Details</>}
                      </button>
                    </div>

                    {/* Expanded detail panel */}
                    {isOpen && (
                      <div className="bg-slate-50 border-t border-slate-200 px-5 py-5" data-testid={`quote-detail-${q.id?.slice(0,8)}`}>
                        {/* Header */}
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Reference</p>
                            <p className="text-lg font-bold text-[#1a1a2e] tracking-wider">QT-{q.id?.slice(0,8).toUpperCase()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); setQuoteEditMode(m => !m); setQuoteEditData({...q}); }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${quoteEditMode ? 'bg-slate-200 border-slate-400 text-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                              data-testid="quote-edit-toggle"
                            >
                              <PencilSimple size={14}/> {quoteEditMode ? 'Cancel Edit' : 'Edit'}
                            </button>
                            <div className="text-right">
                              <p className="text-xs text-slate-400">Received {new Date(q.created_at).toLocaleString('en-GB')}</p>
                              <p className="text-xs font-medium mt-0.5">{isRT ? '✈ Round-Trip' : 'One-Way'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                          {/* Customer */}
                          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Customer</p>
                            {quoteEditMode ? (
                              <>
                                <div>
                                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5 block">Name</label>
                                  <input value={quoteEditData.passenger_name||''} onChange={e=>setQuoteEditData(d=>({...d,passenger_name:e.target.value}))}
                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" onClick={e=>e.stopPropagation()}/>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5 block">Email</label>
                                  <input value={quoteEditData.passenger_email||''} onChange={e=>setQuoteEditData(d=>({...d,passenger_email:e.target.value}))}
                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" onClick={e=>e.stopPropagation()}/>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5 block">Phone</label>
                                  <input value={quoteEditData.passenger_phone||''} onChange={e=>setQuoteEditData(d=>({...d,passenger_phone:e.target.value}))}
                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" onClick={e=>e.stopPropagation()}/>
                                </div>
                              </>
                            ) : (
                              <>
                                {QD('Name', q.passenger_name)}
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Email</p>
                                  <div className="flex items-center gap-2">
                                    <a href={`mailto:${q.passenger_email}`} onClick={e=>e.stopPropagation()} className="text-sm text-blue-600 hover:underline break-all">{q.passenger_email}</a>
                                    <button onClick={e=>copyToClipboard(q.passenger_email,'email',e)} className="flex-none text-slate-400 hover:text-slate-700 transition" title="Copy email">
                                      {copiedField==='email'?<CheckCircle size={14} weight="fill" className="text-green-500"/>:<Copy size={14}/>}
                                    </button>
                                    <a href={`mailto:${q.passenger_email}?subject=Re: Quote Request QT-${q.id?.slice(0,8).toUpperCase()}`} onClick={e=>e.stopPropagation()} className="flex-none" title="Reply by email">
                                      <Envelope size={15} className="text-blue-500 hover:text-blue-700"/>
                                    </a>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Phone / WhatsApp</p>
                                  <div className="flex items-center gap-2">
                                    <a href={`tel:${q.passenger_phone}`} onClick={e=>e.stopPropagation()} className="text-sm text-slate-800">{q.passenger_phone}</a>
                                    <button onClick={e=>copyToClipboard(q.passenger_phone,'phone',e)} className="flex-none text-slate-400 hover:text-slate-700 transition" title="Copy phone">
                                      {copiedField==='phone'?<CheckCircle size={14} weight="fill" className="text-green-500"/>:<Copy size={14}/>}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Outbound */}
                          <div className="bg-white rounded-xl p-4 border border-blue-100 space-y-3">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Outbound Journey</p>
                            {quoteEditMode ? (
                              <>
                                {[['pickup_location','From'],['dropoff_location','To'],['pickup_date','Pickup Date'],['pickup_time','Pickup Time'],
                                  ['flight_number','Flight No.'],['flight_arrival_time','Arrival Time']].map(([f,l])=>(
                                  <div key={f}>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5 block">{l}</label>
                                    <input value={quoteEditData[f]||''} onChange={e=>setQuoteEditData(d=>({...d,[f]:e.target.value}))}
                                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" onClick={e=>e.stopPropagation()}/>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <>
                                {QD('From', q.pickup_location)}
                                {QD('To', q.dropoff_location)}
                                {QD('Pickup Date', q.pickup_date)}
                                {QD('Desired Pickup Time', q.pickup_time)}
                                {QD('Arrival Flight No.', q.flight_number)}
                                {QD('Scheduled Arrival Time', q.flight_arrival_time)}
                                {QD('Adults', q.passengers)}
                                {QD('Children', q.children > 0 ? `${q.children}${q.child_seat_details?' — '+q.child_seat_details:''}` : null)}
                                {QD('Luggage', q.luggage != null ? `${q.luggage} bag(s)` : null)}
                                {QD('Vehicle Preference', q.vehicle_preference)}
                              </>
                            )}
                          </div>

                          {/* Return / Status / Notes / History */}
                          <div className="space-y-4">
                            {isRT && (
                              <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-3">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Return Journey</p>
                                {quoteEditMode ? (
                                  <>
                                    {[['return_pickup_location','Return From'],['return_dropoff_location','Return To'],
                                      ['return_date','Return Date'],['return_pickup_time','Return Pickup Time'],
                                      ['return_flight_number','Return Flight No.'],['return_flight_departure_time','Departure Time']].map(([f,l])=>(
                                      <div key={f}>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5 block">{l}</label>
                                        <input value={quoteEditData[f]||''} onChange={e=>setQuoteEditData(d=>({...d,[f]:e.target.value}))}
                                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" onClick={e=>e.stopPropagation()}/>
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <>
                                    {QD('Return From', q.return_pickup_location)}
                                    {QD('Return To', q.return_dropoff_location)}
                                    {QD('Return Date', q.return_date)}
                                    {QD('Desired Pickup Time', retPickup)}
                                    {QD('Departure Flight No.', q.return_flight_number)}
                                    {QD('Scheduled Departure', q.return_flight_departure_time)}
                                    {QD('Passengers', retPax)}
                                    {QD('Luggage', retLug != null ? `${retLug} bag(s)` : null)}
                                    {q.return_notes && QD('Return Notes', q.return_notes)}
                                  </>
                                )}
                              </div>
                            )}

                            {/* Save edit button */}
                            {quoteEditMode && (
                              <button onClick={e=>saveQuoteEdit(q.id,e)} disabled={savingEditId===q.id}
                                className={`w-full py-2.5 text-sm font-semibold rounded-lg ${BLU} transition flex items-center justify-center gap-2 disabled:opacity-50`}
                                data-testid="save-quote-edit-btn">
                                <Check size={15}/> {savingEditId===q.id ? 'Saving…' : 'Save Edits'}
                              </button>
                            )}

                            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
                              {q.special_requests && QD('Special Requests', q.special_requests)}

                              {/* Status */}
                              <div onClick={e=>e.stopPropagation()}>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</p>
                                <select
                                  value={quoteForm.status || effStatus}
                                  onChange={e=>{e.stopPropagation(); setQF(f=>({...f,status:e.target.value}));}}
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                                  data-testid="quote-status-select"
                                >
                                  {qStatuses.map(s=><option key={s} value={s}>{qStatusLabel(s)}</option>)}
                                </select>
                              </div>

                              {/* Admin notes */}
                              <div onClick={e=>e.stopPropagation()}>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Internal Notes (admin only)</p>
                                <textarea
                                  value={quoteForm.admin_notes ?? ''}
                                  onChange={e=>{e.stopPropagation(); setQF(f=>({...f,admin_notes:e.target.value}));}}
                                  rows={3} placeholder="Internal notes — not visible to customer"
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                                  data-testid="quote-admin-notes"
                                />
                              </div>

                              <button onClick={e=>saveQuote(q.id,e)} disabled={savingQuoteId===q.id}
                                className={`w-full py-2.5 text-sm font-semibold rounded-lg ${BLU} transition flex items-center justify-center gap-2 disabled:opacity-50`}
                                data-testid="save-quote-btn">
                                <Check size={15}/> {savingQuoteId===q.id ? 'Saving…' : 'Save Status & Notes'}
                              </button>
                            </div>

                            {/* Status History */}
                            {q.status_history && q.status_history.length > 0 && (
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                  <ClockCounterClockwise size={13}/> Status History
                                </p>
                                <div className="space-y-2">
                                  {[...q.status_history].reverse().map((h,i)=>(
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                      <span className={`mt-0.5 inline-block px-1.5 py-0.5 rounded-full border font-semibold whitespace-nowrap ${QUOTE_STATUS_COLORS[h.status]||'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        {qStatusLabel(h.status)}
                                      </span>
                                      <div className="text-slate-500">
                                        <span>{new Date(h.changed_at).toLocaleString('en-GB')}</span>
                                        {h.note && <span className="ml-1 italic">· {h.note}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Reply to Customer */}
                            <QuoteReplyPanel quoteId={q.id} passengerEmail={q.passenger_email} api={API}
                              onSent={()=>setQuotes(prev=>prev.map(x=>x.id===q.id?{...x,status:'quote_sent'}:x))} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
              })()}
            </div>
          </div>
        )}

        {/* ── PARTNERS ── */}
        {tab === 'partners' && (
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-6">Partner Requests</h1>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {partners.length === 0 ? (
                <div className="text-center py-16 text-slate-400">No partner requests yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Company</th>
                      <th className="px-4 py-3 text-left">Contact</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Monthly</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partners.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{p.company_name}</td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{p.contact_name}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                          <p className="text-xs text-slate-400">{p.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 capitalize text-xs">{p.business_type?.replace(/_/g,' ')}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{p.monthly_bookings}</td>
                        <td className="px-4 py-3">
                          <select value={p.status} onChange={async e => {
                            await axios.put(`${API}/partners/${p.id}/status`, { status: e.target.value });
                            setPartners(prev => prev.map(x => x.id===p.id ? {...x,status:e.target.value} : x));
                          }} className="text-xs px-2 py-1 rounded-full border font-medium bg-white">
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="active">Active</option>
                            <option value="declined">Declined</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-slate-900">Route Prices</h1>
              <button onClick={() => { setEditRoute(null); setRouteForm({from_location:'',to_location:'',economy_price:'',business_price:'',group_price:'',bus_price:''}); setRouteModal(true); }}
                className="btn-gold py-2 px-4 text-sm flex items-center gap-2">
                <Plus size={16} /> Add Route
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">From</th>
                    <th className="px-4 py-3 text-left">To</th>
                    <th className="px-4 py-3 text-right">Standard</th>
                    <th className="px-4 py-3 text-right">Executive</th>
                    <th className="px-4 py-3 text-right">Minivan</th>
                    <th className="px-4 py-3 text-right">Minibus</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routes.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{r.from_location}</td>
                      <td className="px-4 py-3">{r.to_location}</td>
                      <td className="px-4 py-3 text-right">£{r.economy_price}</td>
                      <td className="px-4 py-3 text-right">£{r.business_price}</td>
                      <td className="px-4 py-3 text-right">£{r.group_price}</td>
                      <td className="px-4 py-3 text-right">£{r.bus_price}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { setEditRoute(r); setRouteForm({from_location:r.from_location,to_location:r.to_location,economy_price:r.economy_price,business_price:r.business_price,group_price:r.group_price,bus_price:r.bus_price}); setRouteModal(true); }}
                            className="p-1 text-slate-400 hover:text-blue-600"><PencilSimple size={16} /></button>
                          <button onClick={async () => { await axios.delete(`${API}/routes/prices/${r.id}`); setRoutes(prev=>prev.filter(x=>x.id!==r.id)); }}
                            className="p-1 text-slate-400 hover:text-red-600"><Trash size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showRouteModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">{editingRoute ? 'Edit Route' : 'Add Route'}</h3>
                    <button onClick={()=>setRouteModal(false)}><X size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="space-y-3">
                    {[['from_location','From Location'],['to_location','To Location']].map(([k,l])=>(
                      <div key={k}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{l}</label>
                        <input value={routeForm[k]} onChange={e=>setRouteForm(f=>({...f,[k]:e.target.value}))} className="input-field" />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      {[['economy_price','Standard (£)'],['business_price','Executive (£)'],['group_price','Minivan (£)'],['bus_price','Minibus (£)']].map(([k,l])=>(
                        <div key={k}>
                          <label className="block text-sm font-medium text-slate-700 mb-1">{l}</label>
                          <input type="number" value={routeForm[k]} onChange={e=>setRouteForm(f=>({...f,[k]:e.target.value}))} className="input-field" />
                        </div>
                      ))}
                    </div>
                    <button onClick={async () => {
                      const payload = {...routeForm, economy_price:parseFloat(routeForm.economy_price), business_price:parseFloat(routeForm.business_price), group_price:parseFloat(routeForm.group_price), bus_price:parseFloat(routeForm.bus_price)};
                      if (editingRoute) {
                        await axios.put(`${API}/routes/prices/${editingRoute.id}`, payload);
                        setRoutes(prev=>prev.map(r=>r.id===editingRoute.id?{...r,...payload}:r));
                      } else {
                        const {data} = await axios.post(`${API}/routes/prices`, payload);
                        setRoutes(prev=>[...prev, data]);
                      }
                      setRouteModal(false);
                    }} className="btn-gold w-full py-2.5 mt-2">
                      {editingRoute ? 'Save Changes' : 'Add Route'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
