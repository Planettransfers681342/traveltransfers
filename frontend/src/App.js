import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import CookieConsent from "@/components/CookieConsent";
import { trackPageView } from "@/utils/analytics";
import HomePage from "@/pages/HomePage";
import BookingPage from "@/pages/BookingPage";
import BookNowPage from "@/pages/BookNowPage";
import IWayResultsPage from "@/pages/IWayResultsPage";
import PassengerDetailsPage from "@/pages/PassengerDetailsPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import BookingDetail from "@/pages/BookingDetail";
import QuoteDetail from "@/pages/QuoteDetail";
import TermsConditions from "@/pages/TermsConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CookiePolicy from "@/pages/CookiePolicy";
import QuoteRequest from "@/pages/QuoteRequest";
import AirportTransferPage from "@/pages/AirportTransferPage";
import TransferRoutePage from "@/pages/TransferRoutePage";

// Fires page_view on every route change (consent-gated inside trackPageView)
function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AnalyticsTracker />
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/book" element={<BookNowPage />} />
          <Route path="/results" element={<IWayResultsPage />} />
          <Route path="/passenger-details" element={<PassengerDetailsPage />} />
          <Route path="/quote" element={<QuoteRequest />} />
          
          {/* SEO Destination Pages */}
          <Route path="/airport-transfer/:city" element={<AirportTransferPage />} />
          
          {/* SEO Route Pages */}
          <Route path="/transfer/:route" element={<TransferRoutePage />} />
          
          {/* Payment Pages */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          
          {/* Admin Pages */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/booking/:bookingId" element={<BookingDetail />} />
          <Route path="/admin/quote/:quoteId" element={<QuoteDetail />} />
          
          {/* Legal Pages */}
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </div>
  );
}

export default App;
