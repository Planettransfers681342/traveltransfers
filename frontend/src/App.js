import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import BookingPage from "@/pages/BookingPage";
import BookNowPage from "@/pages/BookNowPage";
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

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/book" element={<BookNowPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/booking/:bookingId" element={<BookingDetail />} />
          <Route path="/admin/quote/:quoteId" element={<QuoteDetail />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/quote" element={<QuoteRequest />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
