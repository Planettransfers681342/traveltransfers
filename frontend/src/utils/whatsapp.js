const WA_NUMBER = '447739476432';
const WA_TEXT   = "Hi%2C%20I%27d%20like%20help%20with%20a%20transfer%20booking";

/**
 * Returns the correct WhatsApp URL for the current device.
 *  - Mobile  → wa.me  (opens WhatsApp app, no api.whatsapp.com)
 *  - Desktop → web.whatsapp.com/send  (opens WhatsApp Web directly)
 */
export function getWhatsAppUrl() {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
  return isMobile
    ? `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`
    : `https://web.whatsapp.com/send?phone=${WA_NUMBER}&text=${WA_TEXT}`;
}

/**
 * Opens WhatsApp in a new tab using the device-appropriate URL.
 * Use this in onClick handlers.
 */
export function openWhatsApp(e) {
  if (e) e.preventDefault();
  window.open(getWhatsAppUrl(), '_blank', 'noopener,noreferrer');
}
