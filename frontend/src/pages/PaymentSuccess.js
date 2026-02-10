import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, CarSimple, Spinner, House, WhatsappLogo } from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WHATSAPP_NUMBER = "447739476432";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Poll for payment status
    const pollPaymentStatus = async (attempts = 0) => {
      const maxAttempts = 10;
      const pollInterval = 2000;

      if (attempts >= maxAttempts) {
        setStatus('error');
        return;
      }

      try {
        const response = await axios.get(`${API}/checkout/status/${sessionId}`);
        
        if (response.data.payment_status === 'paid') {
          setStatus('success');
          // Fetch booking details
          if (response.data.booking_id) {
            const bookingRes = await axios.get(`${API}/bookings/${response.data.booking_id}`);
            setBooking(bookingRes.data);
          }
          return;
        } else if (response.data.status === 'expired') {
          setStatus('error');
          return;
        }

        // Continue polling
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (attempts >= maxAttempts - 1) {
          setStatus('error');
        } else {
          setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
        }
      }
    };

    pollPaymentStatus();
  }, [searchParams]);

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

        <div className="bg-white border border-slate-200 p-8 text-center" data-testid="payment-success-card">
          {status === 'checking' && (
            <>
              <Spinner size={64} className="text-[#d4af37] animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verifying Payment...</h1>
              <p className="text-slate-600">Please wait while we confirm your payment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} weight="fill" className="text-green-500" />
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 mb-2">Payment Successful!</h1>
              <p className="text-slate-600 mb-6">
                Thank you for booking with Planet Transfers. Your transfer is confirmed.
              </p>
              
              {booking && (
                <div className="bg-slate-50 p-6 text-left mb-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Booking Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Booking ID:</span>
                      <span className="font-medium">{booking.id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">From:</span>
                      <span className="font-medium">{booking.pickup_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">To:</span>
                      <span className="font-medium">{booking.dropoff_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-medium">{booking.pickup_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time:</span>
                      <span className="font-medium">{booking.pickup_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-semibold text-green-600">£{booking.price?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-500 mb-6">
                A confirmation email has been sent to your email address. 
                Your driver will contact you before the pickup time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/')} 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  data-testid="back-home-btn"
                >
                  <House size={20} />
                  Back to Home
                </button>
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I just booked a transfer (Booking ID: ${booking?.id?.slice(0, 8)}). I have a question.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  Contact Us
                </a>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">Payment Verification Issue</h1>
              <p className="text-slate-600 mb-6">
                We couldn't verify your payment. If you were charged, please contact our support team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/')} 
                  className="btn-primary flex-1"
                >
                  Back to Home
                </button>
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I had an issue with my payment. Can you help?")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  Get Help
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
