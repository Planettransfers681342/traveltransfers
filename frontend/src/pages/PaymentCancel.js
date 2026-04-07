import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { XCircle, CarSimple, ArrowLeft } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    // Mark the booking as cancelled in our DB
    try {
      const saved = sessionStorage.getItem('pt_booking_summary');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.internal_booking_id) {
          axios.put(`${API}/iway/bookings/${parsed.internal_booking_id}/status`, {
            payment_status: 'cancelled',
            booking_status: 'cancelled',
          }).catch(() => {});
        }
        sessionStorage.removeItem('pt_booking_summary');
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-4">

        <a href="/" className="flex items-center justify-center gap-2 mb-6">
          <CarSimple size={30} weight="fill" className="text-[#d4af37]" />
          <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
        </a>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm" data-testid="payment-cancel-card">
          <div className="w-20 h-20 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle size={44} weight="fill" className="text-amber-400" />
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-slate-900 mb-2">Payment Cancelled</h1>
          <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
            Your payment was not completed and you have not been charged. You can start a new booking at any time.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-[#d4af37] text-slate-900 font-semibold py-3.5 rounded-xl hover:bg-[#c9a430] transition-colors shadow-sm"
          data-testid="try-again-btn"
        >
          <ArrowLeft size={16} />
          Try Again
        </button>

        <p className="text-center text-xs text-slate-400">
          Need help? Email us at <a href="mailto:GBRoyaltransfers@gmail.com" className="underline">GBRoyaltransfers@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
