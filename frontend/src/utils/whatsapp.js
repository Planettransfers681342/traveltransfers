// Single canonical WhatsApp URL — works on ALL devices and ALL browsers
// wa.me is the official WhatsApp universal link:
//   Mobile  → opens the WhatsApp app directly
//   Desktop → opens web.whatsapp.com (WhatsApp Web) — no blocked pages
const WA_NUMBER = '447739476432';
const WA_TEXT   = 'Hi%2C%20I%27d%20like%20help%20with%20a%20transfer%20booking';

export const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

// Always returns the same URL — device detection removed (was causing desktop block)
export function getWhatsAppUrl() {
  return WA_URL;
}

// Legacy helper kept for any remaining onClick usage
// Prefer: <a href={WA_URL} target="_blank" rel="noopener noreferrer">
export function openWhatsApp(e) {
  if (e) e.preventDefault();
  window.open(WA_URL, '_blank', 'noopener,noreferrer');
}
