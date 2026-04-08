import { analyticsAllowed } from '../components/CookieConsent';

const GA_ID = 'G-Y9XJK23G7H';

/** Load the GA4 script dynamically and initialise gtag */
export function initGA4() {
  if (!analyticsAllowed()) return;
  if (window._ga4Loaded) return;
  window._ga4Loaded = true;

  // Inject the gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  // Disable automatic page_view — we fire it manually on every route change
  gtag('config', GA_ID, { send_page_view: false });
}

/** Fire a GA4 event — silently no-ops if consent not given or GA not loaded */
export function trackEvent(eventName, params = {}) {
  if (!analyticsAllowed()) return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

/** Convenience: fire page_view for the current path */
export function trackPageView(path) {
  trackEvent('page_view', { page_path: path });
}
