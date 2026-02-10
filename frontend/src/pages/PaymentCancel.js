import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, CarSimple, ArrowLeft, WhatsappLogo } from '@phosphor-icons/react';

const WHATSAPP_NUMBER = "447739476432";

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <CarSimple size={32} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </a>
        </div>

        <div className="bg-white border border-slate-200 p-8 text-center" data-testid="payment-cancel-card">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={48} weight="fill" className="text-amber-500" />
          </div>
          
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Payment Cancelled</h1>
          <p className="text-slate-600 mb-6">
            Your payment was cancelled and you have not been charged. 
            Your booking has been saved and you can complete the payment later.
          </p>

          <div className="bg-slate-50 p-4 mb-6">
            <p className="text-sm text-slate-600">
              Changed your mind? No worries! You can start a new booking or contact us if you need assistance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              data-testid="try-again-btn"
            >
              <ArrowLeft size={20} />
              Book Again
            </button>
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I cancelled my booking. Can you help me with a new booking?")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <WhatsappLogo size={20} weight="fill" />
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
